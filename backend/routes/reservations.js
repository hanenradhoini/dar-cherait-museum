// backend/routes/reservations.js
const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const pool = require('../config/postgres');
const { requireAuth } = require('../middleware/auth');
const { requireUserAuth, optionalUserAuth } = require('../middleware/userAuth');
const { sendConfirmationEmail, sendAdminResponseEmail } = require('../utils/mailer');
const { sendError } = require('../utils/errorHandler');

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function logHistory(client, reservationId, action, ancienne, nouvelle, faitPar, role) {
  await client.query(
    `INSERT INTO reservation_history (reservation_id, action, ancienne_valeur, nouvelle_valeur, fait_par, fait_par_role)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [reservationId, action, ancienne || null, nouvelle || null, faitPar || null, role || null]
  );
}

// ─── PUBLIC ─────────────────────────────────────────────────────────────────

/**
 * POST /api/reservations
 * Créer une réservation (invité ou connecté)
 */
router.post(
  '/',
  optionalUserAuth,
  [
    body('visiteur_prenom').trim().notEmpty().withMessage('Prénom requis'),
    body('visiteur_nom').trim().notEmpty().withMessage('Nom requis'),
    body('visiteur_email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('espace').notEmpty().withMessage('Espace requis'),
    body('date_visite').isDate().withMessage('Date invalide'),
    body('heure_visite').matches(/^\d{2}:\d{2}$/).withMessage('Heure invalide (HH:MM)'),
    body('nombre_adultes').isInt({ min: 1 }).withMessage('Au moins 1 adulte requis'),
    body('nombre_enfants').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        visiteur_prenom, visiteur_nom, visiteur_email, visiteur_telephone,
        visiteur_nationalite, espace, date_visite, heure_visite,
        nombre_adultes, nombre_enfants, langue_visite, visite_guidee, message,
      } = req.body;

      const result = await client.query(
        `INSERT INTO reservations
          (user_id, visiteur_prenom, visiteur_nom, visiteur_email, visiteur_telephone,
           visiteur_nationalite, espace, date_visite, heure_visite, nombre_adultes,
           nombre_enfants, langue_visite, visite_guidee, message)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          req.user?.id || null,
          visiteur_prenom.trim(), visiteur_nom.trim(), visiteur_email,
          visiteur_telephone || null, visiteur_nationalite || null,
          espace, date_visite, heure_visite,
          parseInt(nombre_adultes), parseInt(nombre_enfants) || 0,
          langue_visite || 'français',
          visite_guidee === true || visite_guidee === 'true',
          message || null,
        ]
      );

      const reservation = result.rows[0];

      await logHistory(client, reservation.id, 'CREATION', null, 'en_attente',
        visiteur_email, 'visiteur');

      await client.query('COMMIT');

      // Email de confirmation (non bloquant)
      sendConfirmationEmail({
        to: visiteur_email,
        prenom: visiteur_prenom,
        reference: reservation.reference,
        espace, dateVisite: date_visite, heureVisite: heure_visite,
      }).catch(console.error);

      res.status(201).json({
        message: 'Réservation créée avec succès',
        reference: reservation.reference,
        reservation,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      sendError(res, err, 'Erreur lors de la création de la réservation');
    } finally {
      client.release();
    }
  }
);

/**
 * GET /api/reservations/lookup
 * Consulter le statut par référence + email (sans compte)
 */
router.get('/lookup', async (req, res) => {
  try {
    const { reference, email } = req.query;
    if (!reference || !email) {
      return res.status(400).json({ message: 'Référence et email requis' });
    }

    const result = await pool.query(
      `SELECT r.*, array_agg(h.*) AS historique
       FROM reservations r
       LEFT JOIN reservation_history h ON h.reservation_id = r.id
       WHERE UPPER(r.reference) = UPPER($1) AND LOWER(r.visiteur_email) = LOWER($2)
       GROUP BY r.id`,
      [reference, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    res.json({ reservation: result.rows[0] });
  } catch (err) {
    sendError(res, err);
  }
});

/**
 * PATCH /api/reservations/annuler-public
 * Annuler une réservation sans compte, via référence + email
 */
router.patch('/annuler-public', async (req, res) => {
  const { reference, email } = req.body;
  if (!reference || !email) {
    return res.status(400).json({ message: 'Référence et email requis' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT * FROM reservations
       WHERE UPPER(reference) = UPPER($1) AND LOWER(visiteur_email) = LOWER($2)`,
      [reference, email]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    const resa = result.rows[0];
    if (!['en_attente', 'confirmee'].includes(resa.statut)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Impossible d'annuler une réservation "${resa.statut}"` });
    }

    await client.query(
      `UPDATE reservations SET statut = 'annulee', annule_par = 'visiteur' WHERE id = $1`,
      [resa.id]
    );
    await logHistory(client, resa.id, 'ANNULATION_VISITEUR', resa.statut, 'annulee',
      resa.visiteur_email, 'visiteur');

    await client.query('COMMIT');
    res.json({ message: 'Réservation annulée avec succès' });
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

// ─── VISITEUR CONNECTÉ ───────────────────────────────────────────────────────

/**
 * GET /api/reservations/mine
 */
router.get('/mine', requireUserAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM reservations WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ reservations: result.rows });
  } catch (err) {
    sendError(res, err);
  }
});

/**
 * PATCH /api/reservations/mine/:id/annuler
 */
router.patch('/mine/:id/annuler', requireUserAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT * FROM reservations WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    const resa = result.rows[0];
    if (!['en_attente', 'confirmee'].includes(resa.statut)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Impossible d'annuler une réservation "${resa.statut}"` });
    }

    await client.query(
      `UPDATE reservations SET statut = 'annulee', annule_par = 'visiteur' WHERE id = $1`,
      [resa.id]
    );
    await logHistory(client, resa.id, 'ANNULATION_VISITEUR', resa.statut, 'annulee',
      req.user.email, 'visiteur');

    await client.query('COMMIT');
    res.json({ message: 'Réservation annulée' });
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

// ─── ADMIN ───────────────────────────────────────────────────────────────────

/**
 * GET /api/reservations
 * Liste admin avec filtres
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { statut, date, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];
    let i = 1;

    if (statut) { where.push(`statut = $${i++}`); params.push(statut); }
    if (date)   { where.push(`date_visite = $${i++}`); params.push(date); }
    if (search) {
      where.push(`(visiteur_nom ILIKE $${i} OR visiteur_email ILIKE $${i} OR reference ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM reservations ${whereClause} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
        [...params, parseInt(limit), offset]
      ),
      pool.query(`SELECT COUNT(*) FROM reservations ${whereClause}`, params),
    ]);

    res.json({
      reservations: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
    });
  } catch (err) {
    sendError(res, err);
  }
});

/**
 * GET /api/reservations/stats
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE statut = 'en_attente')  AS en_attente,
        COUNT(*) FILTER (WHERE statut = 'confirmee')   AS confirmees,
        COUNT(*) FILTER (WHERE statut = 'annulee')     AS annulees,
        COUNT(*) FILTER (WHERE statut = 'terminee')    AS terminees,
        COUNT(*) FILTER (WHERE date_visite = CURRENT_DATE) AS aujourd_hui,
        COUNT(*)                                        AS total
      FROM reservations
    `);
    res.json({ stats: result.rows[0] });
  } catch (err) {
    sendError(res, err);
  }
});

/**
 * GET /api/reservations/:id
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [resaResult, histResult] = await Promise.all([
      pool.query('SELECT * FROM reservations WHERE id = $1', [req.params.id]),
      pool.query('SELECT * FROM reservation_history WHERE reservation_id = $1 ORDER BY created_at ASC', [req.params.id]),
    ]);

    if (resaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    res.json({ reservation: resaResult.rows[0], historique: histResult.rows });
  } catch (err) {
    sendError(res, err);
  }
});

/**
 * PATCH /api/reservations/:id/status
 * Changer le statut + envoyer une réponse au visiteur
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { statut, reponse_admin } = req.body;
    const VALID_STATUTS = ['confirmee', 'annulee', 'terminee'];
    if (!VALID_STATUTS.includes(statut)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Statut invalide. Valeurs: ${VALID_STATUTS.join(', ')}` });
    }

    const resaResult = await client.query('SELECT * FROM reservations WHERE id = $1', [req.params.id]);
    if (resaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    const resa = resaResult.rows[0];

    await client.query(
      `UPDATE reservations SET statut = $1, reponse_admin = $2,
        annule_par = CASE WHEN $4 = 'annulee' THEN 'admin' ELSE annule_par END
       WHERE id = $3`,
      [statut, reponse_admin || null, resa.id, statut]
    );

    await logHistory(client, resa.id, `STATUT_${statut.toUpperCase()}`,
      resa.statut, statut, req.admin.email, 'admin');

    await client.query('COMMIT');

    // Email visiteur (non bloquant)
    sendAdminResponseEmail({
      to: resa.visiteur_email,
      prenom: resa.visiteur_prenom,
      reference: resa.reference,
      statut,
      reponse: reponse_admin,
    }).catch(console.error);

    res.json({ message: 'Statut mis à jour' });
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

/**
 * PUT /api/reservations/:id
 * Modifier les détails (admin)
 */
router.put('/:id', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const fields = ['visiteur_prenom','visiteur_nom','visiteur_email','visiteur_telephone',
      'visiteur_nationalite','espace','date_visite','heure_visite','nombre_adultes',
      'nombre_enfants','langue_visite','visite_guidee','message'];

    const updates = [];
    const values = [];
    let i = 1;

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${i++}`);
        values.push(req.body[f]);
      }
    });

    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Aucune donnée à modifier' });
    }

    values.push(req.params.id);
    const result = await client.query(
      `UPDATE reservations SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Réservation introuvable' });
    }

    await logHistory(client, req.params.id, 'MODIFICATION', null,
      JSON.stringify(req.body), req.admin.email, 'admin');

    await client.query('COMMIT');
    res.json({ reservation: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/reservations/:id
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reservations WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Réservation introuvable' });
    res.json({ message: 'Réservation supprimée' });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;