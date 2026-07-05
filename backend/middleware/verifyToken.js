const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification JWT pour le panel admin.
 * Attend un header : Authorization: Bearer <token>
 * Attache req.admin = { id, username } si le token est valide.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token invalide ou expiré.' });
  }
}

module.exports = verifyToken;
