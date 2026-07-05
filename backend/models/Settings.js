// backend/models/Settings.js
const mongoose = require('mongoose');

const HoraireSchema = new mongoose.Schema({
  jour:               { type: String, required: true },
  ouvertureJournee:   { type: String, default: '08:00' },
  fermetureJournee:   { type: String, default: '18:30' },
  ouvertureSoiree:    { type: String, default: '20:00' },
  fermetureSoiree:    { type: String, default: '00:00' },
  ferme:              { type: Boolean, default: false },
}, { _id: false });

const TarifSchema = new mongoose.Schema({
  espace:   { type: String, required: true },
  label:    { type: String, required: true },
  prix:     { type: Number, required: true },
  ordre:    { type: Number, default: 0 },
  actif:    { type: Boolean, default: true },
}, { _id: false });

const ContactSchema = new mongoose.Schema({
  adresse:          { type: String, default: '' },
  telephone:        { type: String, default: '' },
  telephoneMobile:  { type: String, default: '' },
  email:            { type: String, default: '' },
  latitude:         { type: Number },
  longitude:        { type: Number },
  googleMapsUrl:    { type: String, default: '' },
}, { _id: false });

const ReseauSocialSchema = new mongoose.Schema({
  plateforme: { type: String, required: true },
  label:      { type: String, default: '' },
  url:        { type: String, required: true },
  icone:      { type: String, default: '' },
  ordre:      { type: Number, default: 0 },
});

const SettingsSchema = new mongoose.Schema({
  nomSite:   { type: String, default: 'Musée Dar Cheraït' },
  slogan:    { type: String, default: '' },
  logoUrl:   { type: String, default: '' },
  heroImages: {
    accueil:      { type: String, default: '' },
    expositions:  { type: String, default: '' },
    oeuvres:      { type: String, default: '' },
    visite:       { type: String, default: '' },
    contact:      { type: String, default: '' },
    informations: { type: String, default: '' },
  },
  heroImagesSlider: { type: [String], default: [] },
  // Fonds de contenu (corps de page) — distincts des bannières hero ci-dessus
  fondsContenu: {
    visite:       { type: String, default: '' },
    expositions:  { type: String, default: '' },
    oeuvres:      { type: String, default: '' },
    contact:      { type: String, default: '' },
    informations: { type: String, default: '' },
  },
  horaires:        [HoraireSchema],
  tarifs:          [TarifSchema],
  contact:         ContactSchema,
  reseauxSociaux:  [ReseauSocialSchema],
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);