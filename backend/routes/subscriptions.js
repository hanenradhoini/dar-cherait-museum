const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/postgres');
const { requireAuth } = require('../middleware/auth');
const { requireUserAuth } = require('../middleware/userAuth');
const { calculateSubscriptionPrice } = require('../utils/subscriptionCalculator');
const { sendError } = require('../utils/errorHandler');

// ─── PUBLIC : voir les catégories et tarifs ─────────────────────────────────

router.get('/categories', async (_req, res) => {
  try {
    const cats = await pool.query('SELECT * FROM subscription_categories ORDER BY name');
    const tiers = await pool.query('SELECT * FROM discount_tiers ORDER BY min_persons');
    const result = cats.rows.map(c => ({
      ...c,
      tiers: tiers.rows.filter(t => t.category_id === c.id),
    }));
    res.json({ categories: result });
  } catch (err) {
    sendError(res, err);
  }
});

// ─── VISITEUR CONNECTÉ ───────────────────────────────────────────────────────

router.post(
  '/calculate',
  requireUserAuth,
  [
    body('categoryId').isInt().withMessage('Catégorie requise'),
    body('numberOfPersons').isInt({ min: 1 }).withMessage('Nombre de personnes invalide'),
    body('planType').isIn(['monthly', 'annual']).withMessage('Type de plan invalide'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const result = await calculateSubscriptionPrice(req.body);
      res.json(result);
    } catch (err) {
      sendError(res, err, 'Erreur lors du calcul du tarif');
    }
  }
);

router.post(
  '/',
  requireUserAuth,
  [
    body('organizationName').trim().notEmpty().withMessage('Nom de l\'organisme requis'),
    body('categoryId').isInt().withMessage('Catégorie requise'),
    body('numberOfPersons').isInt({ min: 1 }).withMessage('Nombre de personnes invalide'),
    body('planType').isIn(['monthly', 'annual']).withMessage('Type de plan invalide'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { organizationName, categoryId, numberOfPersons, planType } = req.body;
      const { basePrice, discountPercent, totalPrice } = await calculateSubscriptionPrice({
        categoryId, numberOfPersons, planType,
      });

      const startDate = new Date();
      const endDate = new Date(startDate);
      planType === 'annual'
        ? endDate.setFullYear(endDate.getFullYear() + 1)
        : endDate.setMonth(endDate.getMonth() + 1);

      const result = await client.query(
        `INSERT INTO subscriptions
          (user_id, organization_name, category_id, number_of_persons, plan_type,
           base_price, discount_percent, total_price, statut, start_date, end_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'en_attente',$9,$10)
         RETURNING *`,
        [req.user.id, organizationName.trim(), categoryId, numberOfPersons, planType,
         basePrice, discountPercent, totalPrice, startDate, endDate]
      );

      await client.query('COMMIT');
      res.status(201).json({ message: 'Demande d\'abonnement créée', subscription: result.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      sendError(res, err, 'Erreur lors de la création de l\'abonnement');
    } finally {
      client.release();
    }
  }
);

router.get('/mine', requireUserAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, c.name AS category_name
       FROM subscriptions s
       LEFT JOIN subscription_categories c ON c.id = s.category_id
       WHERE s.user_id = $1 ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json({ subscriptions: result.rows });
  } catch (err) {
    sendError(res, err);
  }
});

// ─── ADMIN ───────────────────────────────────────────────────────────────────

router.post('/admin/categories', requireAuth, async (req, res) => {
  try {
    const { name, pricePerPersonMonth } = req.body;
    const result = await pool.query(
      'INSERT INTO subscription_categories (name, price_per_person_month) VALUES ($1,$2) RETURNING *',
      [name, pricePerPersonMonth]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    sendError(res, err, 'Erreur lors de la création de la catégorie');
  }
});

router.post('/admin/categories/:id/tiers', requireAuth, async (req, res) => {
  try {
    const { minPersons, maxPersons, discountPercent } = req.body;
    const result = await pool.query(
      `INSERT INTO discount_tiers (category_id, min_persons, max_persons, discount_percent)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, minPersons, maxPersons || null, discountPercent]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    sendError(res, err, 'Erreur lors de la création du palier');
  }
});

router.get('/admin', requireAuth, async (req, res) => {
  try {
    const { statut } = req.query;
    const where = statut ? 'WHERE s.statut = $1' : '';
    const params = statut ? [statut] : [];
    const result = await pool.query(
      `SELECT s.*, u.email AS user_email, c.name AS category_name
       FROM subscriptions s
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN subscription_categories c ON c.id = s.category_id
       ${where} ORDER BY s.created_at DESC`,
      params
    );
    res.json({ subscriptions: result.rows });
  } catch (err) {
    sendError(res, err);
  }
});

router.patch('/admin/:id/status', requireAuth, async (req, res) => {
  try {
    const { statut, reponse_admin } = req.body;
    const VALID = ['active', 'annulee', 'expiree'];
    if (!VALID.includes(statut)) {
      return res.status(400).json({ message: `Statut invalide. Valeurs : ${VALID.join(', ')}` });
    }
    const result = await pool.query(
      'UPDATE subscriptions SET statut = $1, reponse_admin = $2 WHERE id = $3 RETURNING *',
      [statut, reponse_admin || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Abonnement introuvable' });
    res.json({ message: 'Statut mis à jour', subscription: result.rows[0] });
  } catch (err) {
    sendError(res, err);
  }
});

// ─── ADMIN : modifier / supprimer catégories ────────────────────────────────

router.put('/admin/categories/:id', requireAuth, async (req, res) => {
  try {
    const { name, pricePerPersonMonth } = req.body;
    const result = await pool.query(
      `UPDATE subscription_categories SET
         name = COALESCE($1, name),
         price_per_person_month = COALESCE($2, price_per_person_month)
       WHERE id = $3 RETURNING *`,
      [name || null, pricePerPersonMonth || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Catégorie introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    sendError(res, err, 'Erreur lors de la modification de la catégorie');
  }
});

router.delete('/admin/categories/:id', requireAuth, async (req, res) => {
  try {
    // ON DELETE CASCADE sur discount_tiers supprime aussi les paliers liés
    const result = await pool.query(
      'DELETE FROM subscription_categories WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Catégorie introuvable' });
    res.json({ message: 'Catégorie supprimée' });
  } catch (err) {
    sendError(res, err, 'Erreur lors de la suppression de la catégorie (vérifie qu\'aucun abonnement n\'y est lié)');
  }
});

// ─── ADMIN : modifier / supprimer paliers ───────────────────────────────────

router.put('/admin/tiers/:id', requireAuth, async (req, res) => {
  try {
    const { minPersons, maxPersons, discountPercent } = req.body;
    const result = await pool.query(
      `UPDATE discount_tiers SET
         min_persons      = COALESCE($1, min_persons),
         max_persons      = $2,
         discount_percent = COALESCE($3, discount_percent)
       WHERE id = $4 RETURNING *`,
      [minPersons ?? null, maxPersons === undefined ? null : maxPersons, discountPercent ?? null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Palier introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    sendError(res, err, 'Erreur lors de la modification du palier');
  }
});

router.delete('/admin/tiers/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM discount_tiers WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Palier introuvable' });
    res.json({ message: 'Palier supprimé' });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;