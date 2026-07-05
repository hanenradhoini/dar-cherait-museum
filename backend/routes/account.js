// backend/routes/account.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/postgres');
const { requireUserAuth } = require('../middleware/userAuth');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, type: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// ── POST /api/account/register ───────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 8 }).withMessage('Mot de passe min 8 caractères'),
    body('prenom').trim().notEmpty().withMessage('Prénom requis'),
    body('nom').trim().notEmpty().withMessage('Nom requis'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password, prenom, nom, telephone, nationalite } = req.body;

      // Vérifier si email déjà utilisé
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'Cet email est déjà utilisé' });
      }

      const hash = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, prenom, nom, telephone, nationalite)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, prenom, nom`,
        [email, hash, prenom.trim(), nom.trim(), telephone || null, nationalite || null]
      );

      const user = rows[0];
      res.status(201).json({ token: signToken(user), user });
    } catch (err) {
      // Afficher l'erreur réelle dans la console ET dans la réponse (mode dev)
      console.error('❌ Erreur register :', err.message);
      console.error(err);
      res.status(500).json({
        message: 'Erreur serveur lors de l\'inscription',
        // En développement, on expose le détail pour déboguer
        detail: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      });
    }
  }
);

// ── POST /api/account/login ───────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (!rows.length) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      const user = rows[0];
      if (!user.actif) return res.status(401).json({ message: 'Compte désactivé' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

      res.json({
        token: signToken(user),
        user: { id: user.id, email: user.email, prenom: user.prenom, nom: user.nom },
      });
    } catch (err) {
      console.error('❌ Erreur login :', err.message);
      res.status(500).json({
        message: 'Erreur serveur lors de la connexion',
        detail: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      });
    }
  }
);

// ── GET /api/account/me ───────────────────────────────────────
router.get('/me', requireUserAuth, (req, res) => {
  res.json({ user: req.user });
});

// ── PUT /api/account/me ───────────────────────────────────────
router.put('/me', requireUserAuth, async (req, res) => {
  try {
    const { prenom, nom, telephone, nationalite } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET
         prenom      = COALESCE($1, prenom),
         nom         = COALESCE($2, nom),
         telephone   = COALESCE($3, telephone),
         nationalite = COALESCE($4, nationalite)
       WHERE id = $5
       RETURNING id, email, prenom, nom, telephone, nationalite`,
      [prenom || null, nom || null, telephone || null, nationalite || null, req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('❌ Erreur update profil :', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── PUT /api/account/password ─────────────────────────────────
router.put(
  '/password',
  requireUserAuth,
  [
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword').isLength({ min: 8 }).withMessage('Nouveau mot de passe min 8 caractères'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { currentPassword, newPassword } = req.body;
      const { rows } = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1', [req.user.id]
      );

      const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
      if (!valid) return res.status(400).json({ message: 'Mot de passe actuel incorrect' });

      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
      res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (err) {
      console.error('❌ Erreur change password :', err.message);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

module.exports = router;
