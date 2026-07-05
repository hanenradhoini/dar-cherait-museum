// backend/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 5;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

// Créer le dossier si nécessaire
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Vérification à chaque écriture (pas seulement au chargement du module)
    // pour éviter les erreurs si le dossier a été supprimé/déplacé après le démarrage du serveur
    try {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      cb(null, UPLOAD_DIR);
    } catch (err) {
      console.error('❌ Erreur création dossier uploads :', err);
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .slice(0, 40);
    const unique = `${base || 'image'}-${Date.now()}${ext}`;
    cb(null, unique);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format non supporté : ${file.mimetype}. Formats acceptés : JPG, PNG, WEBP, GIF, SVG`));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

/**
 * Gestionnaire d'erreur Multer à utiliser après le middleware
 */
function handleUploadError(err, req, res, next) {
  if (err) {
    console.error('❌ Erreur Multer/upload :', err);
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: `Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)` });
    }
    return res.status(400).json({ message: `Erreur upload : ${err.message}`, code: err.code });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
}

module.exports = { upload, handleUploadError, UPLOAD_DIR };
