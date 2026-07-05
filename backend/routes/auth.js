// backend/routes/auth.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool           = require('../config/postgres');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/login — connexion admin
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors:errors.array() });

    try {
      const { email, password } = req.body;
      const { rows } = await pool.query(
        'SELECT * FROM admins WHERE email=$1', [email.toLowerCase()]
      );
      if (!rows.length)
        return res.status(401).json({ message:'Email ou mot de passe incorrect' });

      const admin = rows[0];
      if (!admin.actif)
        return res.status(401).json({ message:'Compte désactivé' });

      if (!await bcrypt.compare(password, admin.password_hash))
        return res.status(401).json({ message:'Email ou mot de passe incorrect' });

      const token = jwt.sign(
        { id:admin.id, email:admin.email, role:admin.role, type:'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );
      res.json({ token, admin:{ id:admin.id, email:admin.email, nom:admin.nom, role:admin.role } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message:'Erreur serveur' });
    }
  }
);

// GET /api/auth/me — profil admin connecté
router.get('/me', requireAuth, (req, res) => {
  res.json({ admin:req.admin });
});

module.exports = router;