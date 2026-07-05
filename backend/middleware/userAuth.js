// backend/middleware/userAuth.js
const jwt  = require('jsonwebtoken');
const pool = require('../config/postgres');

async function requireUserAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ message:'Connexion requise' });

    const token   = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.type !== 'user')
      return res.status(403).json({ message:'Accès réservé aux visiteurs' });

    const { rows } = await pool.query(
      'SELECT id,email,prenom,nom,telephone,nationalite,actif FROM users WHERE id=$1',
      [payload.id]
    );
    if (!rows.length || !rows[0].actif)
      return res.status(401).json({ message:'Compte introuvable ou désactivé' });

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ message:'Session expirée, reconnectez-vous' });
    return res.status(401).json({ message:'Token invalide' });
  }
}

async function optionalUserAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();

    const token   = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'user') return next();

    const { rows } = await pool.query(
      'SELECT id,email,prenom,nom,telephone,nationalite FROM users WHERE id=$1 AND actif=TRUE',
      [payload.id]
    );
    if (rows.length) req.user = rows[0];
  } catch (_) { /* token invalide → on continue sans user */ }
  next();
}

module.exports = { requireUserAuth, optionalUserAuth };