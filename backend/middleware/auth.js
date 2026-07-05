
const jwt  = require('jsonwebtoken');
const pool = require('../config/postgres');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ message:'Token manquant' });

    const token   = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.type !== 'admin')
      return res.status(403).json({ message:'Accès réservé aux administrateurs' });

    const { rows } = await pool.query(
      'SELECT id,email,nom,role,actif FROM admins WHERE id=$1', [payload.id]
    );
    if (!rows.length || !rows[0].actif)
      return res.status(401).json({ message:'Compte introuvable ou désactivé' });

    req.admin = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ message:'Session expirée, reconnectez-vous' });
    return res.status(401).json({ message:'Token invalide' });
  }
}

function requireSuperAdmin(req, res, next) {
  if (req.admin?.role !== 'super_admin')
    return res.status(403).json({ message:'Action réservée au super administrateur' });
  next();
}

module.exports = { requireAuth, requireSuperAdmin };