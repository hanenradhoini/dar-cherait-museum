// backend/models/Collection.js
const mongoose = require('mongoose');

// Une photo individuelle dans une galerie
const PhotoSchema = new mongoose.Schema({
  url:         { type: String, required: true },
  legende:     { type: String, default: '' },
  alt:         { type: String, default: '' },
  ordre:       { type: Number, default: 0 },
  isCouverture:{ type: Boolean, default: false },
}, { timestamps: true });

const PieceSchema = new mongoose.Schema({
  titre:       { type: String, required: true },
  periode:     { type: String, default: '' },
  origine:     { type: String, default: '' },
  materiaux:   { type: String, default: '' },
  description: { type: String, default: '' },
  ordre:       { type: Number, default: 0 },
  galerie:     [PhotoSchema],   // ← galerie multi-photos
});

const CollectionSchema = new mongoose.Schema({
  slug:        { type: String, required: true, unique: true },
  titre:       { type: String, required: true },
  description: { type: String, default: '' },
  imageUrl:    { type: String, default: '' }, // image de couverture de la collection elle-même
  ordre:       { type: Number, default: 0 },
  actif:       { type: Boolean, default: true },
  pieces:      [PieceSchema],
}, { timestamps: true });

module.exports = mongoose.model('Collection', CollectionSchema);
