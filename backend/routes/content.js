// backend/routes/content.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Settings = require('../models/Settings');
const Espace = require('../models/Espace');
const Collection = require('../models/Collection');
const VisiteGuidee = require('../models/VisiteGuidee');
const Annonce = require('../models/Annonce');
const { sendError } = require('../utils/errorHandler');

// ════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════

router.get('/settings', async (_req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ settings });
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/settings', requireAuth, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ settings });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// ── RÉSEAUX SOCIAUX (liste libre) ─────────────────────────────

// Ajouter un réseau social
router.post('/settings/reseaux-sociaux', requireAuth, async (req, res) => {
  try {
    const { plateforme, label, url, icone } = req.body;
    if (!plateforme || !url) {
      return res.status(400).json({ message: 'Plateforme et URL requis' });
    }

    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});

    settings.reseauxSociaux.push({
      plateforme,
      label: label || plateforme,
      url,
      icone: icone || '',
      ordre: settings.reseauxSociaux.length,
    });
    await settings.save();

    res.status(201).json({ settings });
  } catch (err) {
    sendError(res, err, 'Erreur lors de l\'ajout du réseau social');
  }
});

// Modifier un réseau social
router.put('/settings/reseaux-sociaux/:reseauId', requireAuth, async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) return res.status(404).json({ message: 'Settings introuvable' });

    const reseau = settings.reseauxSociaux.id(req.params.reseauId);
    if (!reseau) return res.status(404).json({ message: 'Réseau social introuvable' });

    Object.assign(reseau, req.body);
    await settings.save();

    res.json({ settings });
  } catch (err) {
    sendError(res, err, 'Erreur lors de la modification du réseau social');
  }
});

// Supprimer un réseau social
router.delete('/settings/reseaux-sociaux/:reseauId', requireAuth, async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) return res.status(404).json({ message: 'Settings introuvable' });

    settings.reseauxSociaux = settings.reseauxSociaux.filter(
      r => r._id.toString() !== req.params.reseauId
    );
    await settings.save();

    res.json({ settings });
  } catch (err) {
    sendError(res, err, 'Erreur lors de la suppression du réseau social');
  }
});

// ════════════════════════════════════════
// ESPACES
// ════════════════════════════════════════

router.get('/espaces', async (_req, res) => {
  try {
    const espaces = await Espace.find({ actif: true }).sort('ordre');
    res.json({ espaces });
  } catch (err) {
    console.error('❌ ERREUR GET /espaces :', err);
    sendError(res, err, 'Erreur lors du chargement des espaces');
  }
});

// Créer un nouvel espace
router.post('/espaces', requireAuth, async (req, res) => {
  try {
    const { titre, description, imageUrl } = req.body;
    if (!titre || !titre.trim()) {
      return res.status(400).json({ message: 'Le titre est requis' });
    }

    const slug = titre.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let finalSlug = slug;
    let counter = 1;
    while (await Espace.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter++}`;
    }

    const maxOrdre = await Espace.findOne().sort('-ordre').select('ordre');
    const espace = await Espace.create({
      slug: finalSlug,
      titre: titre.trim(),
      description: description || '',
      imageUrl: imageUrl || '',
      ordre: (maxOrdre?.ordre || 0) + 1,
      salles: [],
    });

    res.status(201).json({ espace });
  } catch (err) {
    sendError(res, err, 'Erreur lors de la création de l\'espace');
  }
});

router.put('/espaces/:id', requireAuth, async (req, res) => {
  try {
    const espace = await Espace.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!espace) return res.status(404).json({ message: 'Espace introuvable' });
    res.json({ espace });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Supprimer un espace entier (et toutes ses salles)
router.delete('/espaces/:id', requireAuth, async (req, res) => {
  try {
    const espace = await Espace.findByIdAndDelete(req.params.id);
    if (!espace) return res.status(404).json({ message: 'Espace introuvable' });
    res.json({ message: 'Espace supprimé' });
  } catch (err) {
    sendError(res, err, 'Erreur lors de la suppression de l\'espace');
  }
});

// Ajouter une salle
router.post('/espaces/:id/salles', requireAuth, async (req, res) => {
  try {
    const espace = await Espace.findById(req.params.id);
    if (!espace) return res.status(404).json({ message: 'Espace introuvable' });
    espace.salles.push(req.body);
    await espace.save();
    res.status(201).json({ espace });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Modifier une salle (titre, catégorie, description…)
router.put('/espaces/:id/salles/:salleId', requireAuth, async (req, res) => {
  try {
    const espace = await Espace.findById(req.params.id);
    if (!espace) return res.status(404).json({ message: 'Espace introuvable' });
    const salle = espace.salles.id(req.params.salleId);
    if (!salle) return res.status(404).json({ message: 'Salle introuvable' });
    Object.assign(salle, req.body);
    await espace.save();
    res.json({ espace });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Supprimer une salle
router.delete('/espaces/:id/salles/:salleId', requireAuth, async (req, res) => {
  try {
    const espace = await Espace.findById(req.params.id);
    if (!espace) return res.status(404).json({ message: 'Espace introuvable' });
    espace.salles = espace.salles.filter(s => s._id.toString() !== req.params.salleId);
    await espace.save();
    res.json({ espace });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── GALERIE D'UNE SALLE ──────────────────────────────────────

// Ajouter plusieurs photos en une fois (upload en lot)
router.post('/espaces/:id/salles/:salleId/galerie', requireAuth, async (req, res) => {
  try {
    const { photos } = req.body;
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ message: 'Le champ "photos" (tableau) est requis' });
    }

    const espace = await Espace.findById(req.params.id);
    if (!espace) return res.status(404).json({ message: 'Espace introuvable' });
    const salle = espace.salles.id(req.params.salleId);
    if (!salle) return res.status(404).json({ message: 'Salle introuvable' });

    const dejaCouverture = salle.galerie.some(p => p.isCouverture);
    photos.forEach((p, i) => {
      salle.galerie.push({
        url: p.url,
        alt: p.alt || '',
        legende: p.legende || '',
        ordre: salle.galerie.length + i,
        isCouverture: !dejaCouverture && i === 0,
      });
    });

    await espace.save();
    res.status(201).json({ espace });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Modifier une photo (légende, alt)
router.put('/espaces/:id/salles/:salleId/galerie/:photoId', requireAuth, async (req, res) => {
  try {
    const espace = await Espace.findById(req.params.id);
    if (!espace) return res.status(404).json({ message: 'Espace introuvable' });
    const salle = espace.salles.id(req.params.salleId);
    if (!salle) return res.status(404).json({ message: 'Salle introuvable' });
    const photo = salle.galerie.id(req.params.photoId);
    if (!photo) return res.status(404).json({ message: 'Photo introuvable' });
    Object.assign(photo, req.body);
    await espace.save();
    res.json({ espace });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Définir une photo comme couverture de la salle
router.patch('/espaces/:id/salles/:salleId/galerie/:photoId/couverture', requireAuth, async (req, res) => {
  try {
    const espace = await Espace.findById(req.params.id);
    if (!espace) return res.status(404).json({ message: 'Espace introuvable' });
    const salle = espace.salles.id(req.params.salleId);
    if (!salle) return res.status(404).json({ message: 'Salle introuvable' });
    salle.galerie.forEach(p => { p.isCouverture = p._id.toString() === req.params.photoId; });
    await espace.save();
    res.json({ espace });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Réorganiser l'ordre des photos
router.put('/espaces/:id/salles/:salleId/galerie-ordre', requireAuth, async (req, res) => {
  try {
    const { ordre } = req.body;
    const espace = await Espace.findById(req.params.id);
    if (!espace) return res.status(404).json({ message: 'Espace introuvable' });
    const salle = espace.salles.id(req.params.salleId);
    if (!salle) return res.status(404).json({ message: 'Salle introuvable' });

    ordre.forEach((photoId, index) => {
      const photo = salle.galerie.id(photoId);
      if (photo) photo.ordre = index;
    });
    salle.galerie.sort((a, b) => a.ordre - b.ordre);
    await espace.save();
    res.json({ espace });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Supprimer une photo de la galerie
router.delete('/espaces/:id/salles/:salleId/galerie/:photoId', requireAuth, async (req, res) => {
  try {
    const espace = await Espace.findById(req.params.id);
    if (!espace) return res.status(404).json({ message: 'Espace introuvable' });
    const salle = espace.salles.id(req.params.salleId);
    if (!salle) return res.status(404).json({ message: 'Salle introuvable' });

    const wasCouverture = salle.galerie.id(req.params.photoId)?.isCouverture;
    salle.galerie = salle.galerie.filter(p => p._id.toString() !== req.params.photoId);
    if (wasCouverture && salle.galerie.length > 0) salle.galerie[0].isCouverture = true;

    await espace.save();
    res.json({ espace });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ════════════════════════════════════════
// COLLECTIONS
// ════════════════════════════════════════

router.get('/collections', async (_req, res) => {
  try {
    const collections = await Collection.find({ actif: true }).sort('ordre');
    res.json({ collections });
  } catch (err) {
    sendError(res, err);
  }
});

// Créer une nouvelle collection
router.post('/collections', requireAuth, async (req, res) => {
  try {
    const { titre, description, imageUrl } = req.body;
    if (!titre || !titre.trim()) {
      return res.status(400).json({ message: 'Le titre est requis' });
    }

    const slug = titre.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let finalSlug = slug;
    let counter = 1;
    while (await Collection.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter++}`;
    }

    const maxOrdre = await Collection.findOne().sort('-ordre').select('ordre');
    const collection = await Collection.create({
      slug: finalSlug,
      titre: titre.trim(),
      description: description || '',
      imageUrl: imageUrl || '',
      ordre: (maxOrdre?.ordre || 0) + 1,
      pieces: [],
    });

    res.status(201).json({ collection });
  } catch (err) {
    sendError(res, err, 'Erreur lors de la création de la collection');
  }
});

router.put('/collections/:id', requireAuth, async (req, res) => {
  try {
    const collection = await Collection.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true }
    );
    if (!collection) return res.status(404).json({ message: 'Collection introuvable' });
    res.json({ collection });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Supprimer une collection entière (et toutes ses pièces)
router.delete('/collections/:id', requireAuth, async (req, res) => {
  try {
    const collection = await Collection.findByIdAndDelete(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection introuvable' });
    res.json({ message: 'Collection supprimée' });
  } catch (err) {
    sendError(res, err, 'Erreur lors de la suppression de la collection');
  }
});

router.post('/collections/:id/pieces', requireAuth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection introuvable' });
    collection.pieces.push(req.body);
    await collection.save();
    res.status(201).json({ collection });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/collections/:id/pieces/:pieceId', requireAuth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection introuvable' });
    const piece = collection.pieces.id(req.params.pieceId);
    if (!piece) return res.status(404).json({ message: 'Pièce introuvable' });
    Object.assign(piece, req.body);
    await collection.save();
    res.json({ collection });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/collections/:id/pieces/:pieceId', requireAuth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection introuvable' });
    collection.pieces = collection.pieces.filter(p => p._id.toString() !== req.params.pieceId);
    await collection.save();
    res.json({ collection });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── GALERIE D'UNE PIÈCE ──────────────────────────────────────

// Ajouter plusieurs photos en une fois (upload en lot)
router.post('/collections/:id/pieces/:pieceId/galerie', requireAuth, async (req, res) => {
  try {
    const { photos } = req.body;
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ message: 'Le champ "photos" (tableau) est requis' });
    }

    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection introuvable' });
    const piece = collection.pieces.id(req.params.pieceId);
    if (!piece) return res.status(404).json({ message: 'Pièce introuvable' });

    const dejaCouverture = piece.galerie.some(p => p.isCouverture);
    photos.forEach((p, i) => {
      piece.galerie.push({
        url: p.url,
        alt: p.alt || '',
        legende: p.legende || '',
        ordre: piece.galerie.length + i,
        isCouverture: !dejaCouverture && i === 0,
      });
    });

    await collection.save();
    res.status(201).json({ collection });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Modifier une photo (légende, alt)
router.put('/collections/:id/pieces/:pieceId/galerie/:photoId', requireAuth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection introuvable' });
    const piece = collection.pieces.id(req.params.pieceId);
    if (!piece) return res.status(404).json({ message: 'Pièce introuvable' });
    const photo = piece.galerie.id(req.params.photoId);
    if (!photo) return res.status(404).json({ message: 'Photo introuvable' });
    Object.assign(photo, req.body);
    await collection.save();
    res.json({ collection });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Définir une photo comme couverture de la pièce
router.patch('/collections/:id/pieces/:pieceId/galerie/:photoId/couverture', requireAuth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection introuvable' });
    const piece = collection.pieces.id(req.params.pieceId);
    if (!piece) return res.status(404).json({ message: 'Pièce introuvable' });
    piece.galerie.forEach(p => { p.isCouverture = p._id.toString() === req.params.photoId; });
    await collection.save();
    res.json({ collection });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Réorganiser l'ordre des photos
router.put('/collections/:id/pieces/:pieceId/galerie-ordre', requireAuth, async (req, res) => {
  try {
    const { ordre } = req.body;
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection introuvable' });
    const piece = collection.pieces.id(req.params.pieceId);
    if (!piece) return res.status(404).json({ message: 'Pièce introuvable' });

    ordre.forEach((photoId, index) => {
      const photo = piece.galerie.id(photoId);
      if (photo) photo.ordre = index;
    });
    piece.galerie.sort((a, b) => a.ordre - b.ordre);
    await collection.save();
    res.json({ collection });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Supprimer une photo de la galerie
router.delete('/collections/:id/pieces/:pieceId/galerie/:photoId', requireAuth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection introuvable' });
    const piece = collection.pieces.id(req.params.pieceId);
    if (!piece) return res.status(404).json({ message: 'Pièce introuvable' });

    const wasCouverture = piece.galerie.id(req.params.photoId)?.isCouverture;
    piece.galerie = piece.galerie.filter(p => p._id.toString() !== req.params.photoId);
    if (wasCouverture && piece.galerie.length > 0) piece.galerie[0].isCouverture = true;

    await collection.save();
    res.json({ collection });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ════════════════════════════════════════
// VISITE GUIDÉE
// ════════════════════════════════════════

router.get('/visite', async (_req, res) => {
  try {
    let visite = await VisiteGuidee.findOne();
    if (!visite) visite = await VisiteGuidee.create({});
    res.json({ visite });
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/visite', requireAuth, async (req, res) => {
  try {
    const visite = await VisiteGuidee.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ visite });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ════════════════════════════════════════
// ANNONCES
// ════════════════════════════════════════

router.get('/annonces', async (_req, res) => {
  try {
    const now = new Date();
    const annonces = await Annonce.find({
      actif: true,
      dateDebut: { $lte: now },
      $or: [{ dateFin: null }, { dateFin: { $gte: now } }],
    }).sort({ epinglee: -1, createdAt: -1 });
    res.json({ annonces });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/annonces', requireAuth, async (req, res) => {
  try {
    const annonce = await Annonce.create({ ...req.body, creePar: req.admin.email });
    res.status(201).json({ annonce });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/annonces/:id', requireAuth, async (req, res) => {
  try {
    const annonce = await Annonce.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!annonce) return res.status(404).json({ message: 'Annonce introuvable' });
    res.json({ annonce });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/annonces/:id', requireAuth, async (req, res) => {
  try {
    const annonce = await Annonce.findByIdAndDelete(req.params.id);
    if (!annonce) return res.status(404).json({ message: 'Annonce introuvable' });
    res.json({ message: 'Annonce supprimée' });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;