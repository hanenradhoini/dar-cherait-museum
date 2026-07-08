// backend/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 5;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

// Cloudinary est utilisé seulement si les 3 variables sont définies (typiquement en production).
// En local, si elles sont absentes, on revient au stockage disque comme avant — rien ne change.
const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storage;
let UPLOAD_DIR = null;

if (useCloudinary) {
  console.log('☁️  Upload configuré avec Cloudinary (stockage persistant)');
  const cloudinary = require('../config/cloudinary');
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'dar-cherait',
      public_id: (_req, file) => {
        const base = file.originalname
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-z0-9]/gi, '-')
          .toLowerCase()
          .slice(0, 40);
        return `${base || 'image'}-${Date.now()}`;
      },
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
    },
  });
} else {
  console.log('💾 Upload configuré en stockage disque local (mode développement)');
  UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
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
}

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

module.exports = { upload, handleUploadError, UPLOAD_DIR, useCloudinary };