// backend/models/Annonce.js
const mongoose = require('mongoose');

const AnnonceSchema = new mongoose.Schema({
  titre:     { type:String, required:true },
  contenu:   { type:String, required:true },
  type:      { type:String,
    enum:['info','alerte','evenement','promotion'], default:'info' },
  imageUrl:  { type:String, default:'' },
  epinglee:  { type:Boolean, default:false },
  dateDebut: { type:Date, default:Date.now },
  dateFin:   { type:Date },
  actif:     { type:Boolean, default:true },
  creePar:   { type:String, default:'' },
}, { timestamps:true });

AnnonceSchema.index({ actif:1, dateFin:1, dateDebut:1 });

AnnonceSchema.virtual('estActive').get(function () {
  const now = new Date();
  if (!this.actif) return false;
  if (this.dateDebut && this.dateDebut > now) return false;
  if (this.dateFin  && this.dateFin  < now) return false;
  return true;
});

module.exports = mongoose.model('Annonce', AnnonceSchema);