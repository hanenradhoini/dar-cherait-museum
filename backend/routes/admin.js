// backend/routes/admin.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/postgres');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

// GET /api/admin/users
router.get('/users', requireAuth, async (req, res) => {
  try {
    const { search, page=1, limit=20 } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const params = []; let where='';
    if (search) { where='WHERE (prenom ILIKE $1 OR nom ILIKE $1 OR email ILIKE $1)'; params.push(`%${search}%`); }
    const n = params.length;
    const [data, count] = await Promise.all([
      pool.query(`SELECT id,email,prenom,nom,telephone,nationalite,actif,created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${n+1} OFFSET $${n+2}`, [...params,parseInt(limit),offset]),
      pool.query(`SELECT COUNT(*) FROM users ${where}`, params),
    ]);
    res.json({ users:data.rows, total:parseInt(count.rows[0].count), page:parseInt(page), pages:Math.ceil(count.rows[0].count/limit) });
  } catch (err) { console.error(err); res.status(500).json({ message:'Erreur serveur' }); }
});

// PUT /api/admin/users/:id
router.put('/users/:id', requireAuth, async (req, res) => {
  try {
    const { actif } = req.body;
    if (typeof actif !== 'boolean') return res.status(400).json({ message:'Champ "actif" (boolean) requis' });
    const { rows } = await pool.query(
      'UPDATE users SET actif=$1 WHERE id=$2 RETURNING id,email,prenom,nom,actif', [actif, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message:'Utilisateur introuvable' });
    res.json({ user:rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ message:'Erreur serveur' }); }
});

// POST /api/admin/admins — super_admin seulement
router.post('/admins', requireAuth, requireSuperAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min:8 }),
    body('nom').trim().notEmpty(),
    body('role').optional().isIn(['admin','super_admin']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors:errors.array() });
    try {
      const { email, password, nom, role='admin' } = req.body;
      if ((await pool.query('SELECT id FROM admins WHERE email=$1',[email])).rows.length)
        return res.status(409).json({ message:'Email déjà utilisé' });
      const hash = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        'INSERT INTO admins (email,password_hash,nom,role) VALUES ($1,$2,$3,$4) RETURNING id,email,nom,role',
        [email, hash, nom.trim(), role]
      );
      res.status(201).json({ admin:rows[0] });
    } catch (err) { console.error(err); res.status(500).json({ message:'Erreur serveur' }); }
  }
);

// GET /api/admin/dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const [stats, users, week] = await Promise.all([
      pool.query(`SELECT
        COUNT(*) FILTER (WHERE statut='en_attente') AS en_attente,
        COUNT(*) FILTER (WHERE statut='confirmee')  AS confirmees,
        COUNT(*) FILTER (WHERE statut='annulee')    AS annulees,
        COUNT(*) FILTER (WHERE statut='terminee')   AS terminees,
        COUNT(*) FILTER (WHERE date_visite=CURRENT_DATE) AS aujourd_hui,
        COUNT(*) AS total FROM reservations`),
      pool.query('SELECT COUNT(*) FROM users WHERE actif=TRUE'),
      pool.query(`SELECT date_visite::TEXT AS jour, COUNT(*) AS total
        FROM reservations WHERE date_visite >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY date_visite ORDER BY date_visite`),
    ]);
    res.json({ reservations:stats.rows[0], visiteurs_inscrits:parseInt(users.rows[0].count), reservations_semaine:week.rows });
  } catch (err) { console.error(err); res.status(500).json({ message:'Erreur serveur' }); }
});

// GET /api/admin/admins — liste tous les admins (super_admin seulement)
router.get('/admins', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, nom, role, actif, created_at FROM admins ORDER BY created_at ASC'
    );
    res.json({ admins: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/admin/admins/:id — modifier le rôle (super_admin seulement)
router.put('/admins/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }
    if (req.params.id == req.admin.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle' });
    }
    const { rows } = await pool.query(
      'UPDATE admins SET role=$1 WHERE id=$2 RETURNING id, email, nom, role, actif',
      [role, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Administrateur introuvable' });
    res.json({ admin: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PATCH /api/admin/admins/:id/actif — activer/désactiver (super_admin seulement)
router.patch('/admins/:id/actif', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { actif } = req.body;
    if (typeof actif !== 'boolean') {
      return res.status(400).json({ message: 'Champ "actif" (boolean) requis' });
    }
    if (req.params.id == req.admin.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas désactiver votre propre compte' });
    }
    const { rows } = await pool.query(
      'UPDATE admins SET actif=$1 WHERE id=$2 RETURNING id, email, nom, role, actif',
      [actif, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Administrateur introuvable' });
    res.json({ admin: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/admin/admins/:id — supprimer un admin (super_admin seulement)
router.delete('/admins/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    if (req.params.id == req.admin.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    const { rows } = await pool.query(
      'DELETE FROM admins WHERE id=$1 RETURNING id', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Administrateur introuvable' });
    res.json({ message: 'Administrateur supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;