// backend/models/Media.js
const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  filename:     { type:String, required:true },
  originalName: { type:String, required:true },
  url:          { type:String, required:true },
  mimeType:     { type:String, required:true },
  tailleMo:     { type:Number },
  largeur:      { type:Number },
  hauteur:      { type:Number },
  alt:          { type:String, default:'' },
  tags:         [{ type:String }],
  utiliseeDans: [{ type:String }],
  uploadePar:   { type:String, default:'' },
}, { timestamps:true });

module.exports = mongoose.model('Media', MediaSchema);