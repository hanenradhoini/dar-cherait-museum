// backend/utils/errorHandler.js
// Helper centralisé pour gérer les erreurs et exposer le détail en développement

function sendError(res, err, fallbackMessage = 'Erreur serveur') {
  console.error('❌', err);

  const isDev = process.env.NODE_ENV !== 'production';

  // Erreurs PostgreSQL connues
  if (err.code === '42P01') {
    return res.status(500).json({
      message: 'Table introuvable dans la base de données. Avez-vous exécuté schema.sql ?',
      detail: isDev ? err.message : undefined,
      code: err.code,
    });
  }
  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json({
      message: 'Connexion à la base de données refusée. Vérifiez que PostgreSQL/MongoDB tournent.',
      detail: isDev ? err.message : undefined,
    });
  }
  if (err.code === '23505') {
    return res.status(409).json({ message: 'Cette donnée existe déjà (doublon)', detail: isDev ? err.detail : undefined });
  }
  if (err.code === '23502') {
    return res.status(400).json({ message: 'Un champ obligatoire est manquant', detail: isDev ? err.column : undefined });
  }

  return res.status(500).json({
    message: fallbackMessage,
    detail: isDev ? err.message : undefined,
  });
}

module.exports = { sendError };
