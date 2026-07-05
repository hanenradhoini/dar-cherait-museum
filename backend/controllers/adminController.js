const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/postgres');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

/* ============================================================
   AUTHENTIFICATION
============================================================ */

// POST /api/admin/login
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, admin: { id: admin.id, username: admin.username } });
  } catch (err) {
    console.error('Erreur login admin:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

/* ============================================================
   HELPER : suppression sûre d'un fichier uploadé
============================================================ */
function deleteUploadedFile(imageUrl) {
  if (!imageUrl) return;
  const filename = path.basename(imageUrl);
  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Erreur suppression fichier:', err);
    });
  }
}

/* ============================================================
   EXPOSITIONS — CRUD
============================================================ */

// GET /api/admin/expositions (liste complète, y compris inactives)
async function getExpositions(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM expositions ORDER BY updated_at DESC'
    );
    res.json({ expositions: result.rows });
  } catch (err) {
    console.error('Erreur liste expositions:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// POST /api/admin/expositions
async function createExposition(req, res) {
  const { titre, description, actif } = req.body;

  if (!titre || !titre.trim()) {
    if (req.file) deleteUploadedFile(`/uploads/${req.file.filename}`);
    return res.status(400).json({ error: 'Le titre est requis.' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO expositions (titre, description, image_url, actif)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [titre.trim(), description || null, imageUrl, actif === 'false' ? false : true]
    );
    res.status(201).json({ exposition: result.rows[0] });
  } catch (err) {
    console.error('Erreur création exposition:', err);
    if (req.file) deleteUploadedFile(`/uploads/${req.file.filename}`);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// PUT /api/admin/expositions/:id
async function updateExposition(req, res) {
  const { id } = req.params;
  const { titre, description, actif } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM expositions WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      if (req.file) deleteUploadedFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ error: 'Exposition introuvable.' });
    }

    const current = existing.rows[0];
    let imageUrl = current.image_url;

    // Si une nouvelle image est uploadée, on remplace et on supprime l'ancienne
    if (req.file) {
      deleteUploadedFile(current.image_url);
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const result = await pool.query(
      `UPDATE expositions
       SET titre = $1, description = $2, image_url = $3, actif = $4
       WHERE id = $5
       RETURNING *`,
      [
        titre?.trim() || current.titre,
        description !== undefined ? description : current.description,
        imageUrl,
        actif !== undefined ? actif === 'true' || actif === true : current.actif,
        id,
      ]
    );

    res.json({ exposition: result.rows[0] });
  } catch (err) {
    console.error('Erreur mise à jour exposition:', err);
    if (req.file) deleteUploadedFile(`/uploads/${req.file.filename}`);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// DELETE /api/admin/expositions/:id
async function deleteExposition(req, res) {
  const { id } = req.params;

  try {
    const existing = await pool.query('SELECT * FROM expositions WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Exposition introuvable.' });
    }

    // Vérifier s'il existe des œuvres liées
    const linkedOeuvres = await pool.query(
      'SELECT COUNT(*) FROM oeuvres WHERE exposition_id = $1',
      [id]
    );
    if (parseInt(linkedOeuvres.rows[0].count) > 0) {
      return res.status(409).json({
        error: `Impossible de supprimer : ${linkedOeuvres.rows[0].count} œuvre(s) sont liées à cette exposition.`,
      });
    }

    deleteUploadedFile(existing.rows[0].image_url);
    await pool.query('DELETE FROM expositions WHERE id = $1', [id]);

    res.json({ message: 'Exposition supprimée avec succès.' });
  } catch (err) {
    console.error('Erreur suppression exposition:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

/* ============================================================
   ŒUVRES — CRUD
============================================================ */

// GET /api/admin/oeuvres
async function getOeuvres(req, res) {
  try {
    const result = await pool.query(`
      SELECT o.*, e.titre AS exposition_titre
      FROM oeuvres o
      LEFT JOIN expositions e ON e.id = o.exposition_id
      ORDER BY o.updated_at DESC
    `);
    res.json({ oeuvres: result.rows });
  } catch (err) {
    console.error('Erreur liste œuvres:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// POST /api/admin/oeuvres
async function createOeuvre(req, res) {
  const { titre, description, exposition_id, actif } = req.body;

  if (!titre || !titre.trim()) {
    if (req.file) deleteUploadedFile(`/uploads/${req.file.filename}`);
    return res.status(400).json({ error: 'Le titre est requis.' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const expoId = exposition_id && exposition_id !== '' ? parseInt(exposition_id) : null;

  try {
    const result = await pool.query(
      `INSERT INTO oeuvres (titre, description, image_url, exposition_id, actif)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [titre.trim(), description || null, imageUrl, expoId, actif === 'false' ? false : true]
    );
    res.status(201).json({ oeuvre: result.rows[0] });
  } catch (err) {
    console.error('Erreur création œuvre:', err);
    if (req.file) deleteUploadedFile(`/uploads/${req.file.filename}`);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// PUT /api/admin/oeuvres/:id
async function updateOeuvre(req, res) {
  const { id } = req.params;
  const { titre, description, exposition_id, actif } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM oeuvres WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      if (req.file) deleteUploadedFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ error: 'Œuvre introuvable.' });
    }

    const current = existing.rows[0];
    let imageUrl = current.image_url;

    if (req.file) {
      deleteUploadedFile(current.image_url);
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const expoId = exposition_id !== undefined
      ? (exposition_id === '' ? null : parseInt(exposition_id))
      : current.exposition_id;

    const result = await pool.query(
      `UPDATE oeuvres
       SET titre = $1, description = $2, image_url = $3, exposition_id = $4, actif = $5
       WHERE id = $6
       RETURNING *`,
      [
        titre?.trim() || current.titre,
        description !== undefined ? description : current.description,
        imageUrl,
        expoId,
        actif !== undefined ? actif === 'true' || actif === true : current.actif,
        id,
      ]
    );

    res.json({ oeuvre: result.rows[0] });
  } catch (err) {
    console.error('Erreur mise à jour œuvre:', err);
    if (req.file) deleteUploadedFile(`/uploads/${req.file.filename}`);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// DELETE /api/admin/oeuvres/:id
async function deleteOeuvre(req, res) {
  const { id } = req.params;

  try {
    const existing = await pool.query('SELECT * FROM oeuvres WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Œuvre introuvable.' });
    }

    deleteUploadedFile(existing.rows[0].image_url);
    await pool.query('DELETE FROM oeuvres WHERE id = $1', [id]);

    res.json({ message: 'Œuvre supprimée avec succès.' });
  } catch (err) {
    console.error('Erreur suppression œuvre:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

module.exports = {
  login,
  getExpositions,
  createExposition,
  updateExposition,
  deleteExposition,
  getOeuvres,
  createOeuvre,
  updateOeuvre,
  deleteOeuvre,
};
