// backend/models/VisiteGuidee.js
const mongoose = require('mongoose');

const EtapeSchema = new mongoose.Schema({
  ordre:        { type:Number, required:true },
  titre:        { type:String, required:true },
  description:  { type:String, default:'' },
  dureeMinutes: { type:Number, default:30 },
  imageUrl:     { type:String, default:'' },
}, { _id:false });

const FormuleSchema = new mongoose.Schema({
  slug:         { type:String, required:true },
  titre:        { type:String, required:true },
  description:  { type:String, default:'' },
  prix:         { type:Number, required:true },
  dureeMinutes: { type:Number, default:90 },
  inclus:       [{ type:String }],
  actif:        { type:Boolean, default:true },
}, { _id:false });

const GuideSchema = new mongoose.Schema({
  nom:    { type:String, required:true },
  photo:  { type:String, default:'' },
  langues:[{ type:String }],
  bio:    { type:String, default:'' },
});

const VisiteGuideeSchema = new mongoose.Schema({
  introduction:       { type:String, default:'' },
  etapes:             [EtapeSchema],
  formules:           [FormuleSchema],
  guides:             [GuideSchema],
  horairesDepart:     [{ type:String }],
  languesDisponibles: [{ type:String }],
}, { timestamps:true });

module.exports = mongoose.model('VisiteGuidee', VisiteGuideeSchema);