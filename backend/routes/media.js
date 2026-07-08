// backend/routes/media.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { upload, handleUploadError, UPLOAD_DIR, useCloudinary } = require('../middleware/upload');
const Media = require('../models/Media');
const { sendError } = require('../utils/errorHandler');

/**
 * POST /api/media/upload
 * Uploader 1 ou plusieurs images
 */
router.post(
  '/upload',
  requireAuth,
  (req, res, next) => upload.array('images', 10)(req, res, (err) => handleUploadError(err, req, res, next)),
  async (req, res) => {
    try {
      console.log('📥 Upload reçu — fichiers:', req.files?.length, '— admin:', req.admin?.email);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Aucun fichier reçu' });
      }

      const saved = [];

      for (const file of req.files) {
        console.log('   → traitement:', file.filename, file.mimetype, file.size, 'octets');

        // Cloudinary fournit déjà l'URL HTTPS complète dans file.path.
        // En local (sans Cloudinary configuré), on reconstruit l'URL comme avant.
        const fileUrl = useCloudinary
          ? file.path
          : `${process.env.BASE_URL || `${req.protocol}://${req.get('host')}`}/uploads/${file.filename}`;

        const media = await Media.create({
          filename:     file.filename,
          originalName: file.originalname,
          url:          fileUrl,
          mimeType:     file.mimetype,
          tailleMo:     +(file.size / 1024 / 1024).toFixed(2),
          uploadePar:   req.admin.email,
        });
        saved.push(media);
        console.log('   ✅ Media créé en base, id:', media._id);
      }

      res.status(201).json({ medias: saved });
    } catch (err) {
      console.error('❌ ERREUR UPLOAD COMPLÈTE :', err);
      sendError(res, err, 'Erreur lors de l\'upload des médias');
    }
  }
);

/**
 * GET /api/media
 * Bibliothèque de toutes les images
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { tag, page = 1, limit = 30 } = req.query;
    const filter = tag ? { tags: tag } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [medias, total] = await Promise.all([
      Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Media.countDocuments(filter),
    ]);

    res.json({ medias, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    sendError(res, err);
  }
});

/**
 * PUT /api/media/:id
 * Modifier alt et tags
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { alt, tags } = req.body;
    const media = await Media.findByIdAndUpdate(
      req.params.id,
      { $set: { alt: alt ?? '', tags: tags ?? [] } },
      { new: true }
    );
    if (!media) return res.status(404).json({ message: 'Media introuvable' });
    res.json({ media });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * DELETE /api/media/:id
 * Supprimer (bloqué si utilisé)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Media introuvable' });

    if (media.utiliseeDans && media.utiliseeDans.length > 0) {
      return res.status(409).json({
        message: 'Ce fichier est utilisé dans le site. Utilisez /force pour forcer la suppression.',
        utiliseeDans: media.utiliseeDans,
      });
    }

    await _deleteMediaFile(media);
    res.json({ message: 'Media supprimé' });
  } catch (err) {
    sendError(res, err);
  }
});

/**
 * DELETE /api/media/:id/force
 * Supprimer même si utilisé
 */
router.delete('/:id/force', requireAuth, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Media introuvable' });
    await _deleteMediaFile(media);
    res.json({ message: 'Media supprimé (forcé)' });
  } catch (err) {
    sendError(res, err);
  }
});

async function _deleteMediaFile(media) {
  if (useCloudinary) {
    const cloudinary = require('../config/cloudinary');
    try {
      await cloudinary.uploader.destroy(
        media.filename.startsWith('dar-cherait/') ? media.filename : `dar-cherait/${media.filename}`
      );
    } catch (err) {
      console.warn('⚠️ Suppression Cloudinary échouée :', err.message);
    }
  } else {
    const filePath = path.join(UPLOAD_DIR, media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  await Media.findByIdAndDelete(media._id);
}

module.exports = router;