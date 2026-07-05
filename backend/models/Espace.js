// backend/models/Espace.js
const mongoose = require('mongoose');

// Une photo individuelle dans une galerie
const PhotoSchema = new mongoose.Schema({
  url:         { type: String, required: true },
  legende:     { type: String, default: '' },   // description courte sous la photo
  alt:         { type: String, default: '' },   // texte alternatif (accessibilité/SEO)
  ordre:       { type: Number, default: 0 },
  isCouverture:{ type: Boolean, default: false }, // photo affichée en miniature/carte
}, { timestamps: true });

const SalleSchema = new mongoose.Schema({
  titre:       { type: String, required: true },
  categorie:   { type: String, enum: ['architecture', 'scenographie', 'univers'], default: 'univers' },
  description: { type: String, default: '' },
  ordre:       { type: Number, default: 0 },
  galerie:     [PhotoSchema],   // ← galerie multi-photos
});

const EspaceSchema = new mongoose.Schema({
  slug:        { type: String, required: true, unique: true },
  titre:       { type: String, required: true },
  description: { type: String, default: '' },
  imageUrl:    { type: String, default: '' }, // image de couverture de l'espace lui-même
  ordre:       { type: Number, default: 0 },
  actif:       { type: Boolean, default: true },
  salles:      [SalleSchema],
}, { timestamps: true });

module.exports = mongoose.model('Espace', EspaceSchema);
