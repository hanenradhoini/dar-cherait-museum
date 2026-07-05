// backend/config/force-settings.js
// Script ponctuel : ÉCRASE complètement horaires/tarifs/contact du document Settings
// avec les valeurs par défaut correctes, quel que soit leur état actuel.
//
// Usage :
//   node backend/config/force-settings.js

require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('../models/Settings');

const DEFAULT_HORAIRES = [
  { jour: 'lundi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'mardi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'mercredi', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'jeudi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'vendredi', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'samedi',   ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  { jour: 'dimanche', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
];

const DEFAULT_TARIFS = [
  { espace: 'arts_traditions',   label: 'Arts & Traditions',   prix: 5.5, ordre: 1, actif: true },
  { espace: 'medina_1001_nuits', label: 'Médina 1001 Nuits',   prix: 6,   ordre: 2, actif: true },
  { espace: 'dar_zamen',         label: 'Dar Zamen',           prix: 6,   ordre: 3, actif: true },
  { espace: 'forfait_complet',   label: 'Forfait Tout Inclus', prix: 15,  ordre: 4, actif: true },
];

const DEFAULT_CONTACT = {
  adresse: 'Avenue Abou El Kacem Chebbi, Tozeur, Tunisie',
  telephone: '+216 76 452 636',
  email: 'contact@darcherait.tn',
  latitude: 33.9195,
  longitude: 8.1335,
};

const DEFAULT_HERO_IMAGES = {
  accueil: '', expositions: '', oeuvres: '', visite: '', contact: '',
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dar_cherait_content');
  console.log('✅ Connecté à MongoDB');

  let existing = await Settings.findOne();

  if (!existing) {
    existing = new Settings({});
    console.log('ℹ️  Aucun document existant, création d\'un nouveau');
  }

  console.log('   Avant : horaires =', existing.horaires?.length || 0, '| tarifs =', existing.tarifs?.length || 0);

  // Écrasement complet et inconditionnel
  existing.horaires = DEFAULT_HORAIRES;
  existing.tarifs = DEFAULT_TARIFS;
  if (!existing.contact?.adresse) existing.contact = DEFAULT_CONTACT;
  if (!existing.heroImages) existing.heroImages = DEFAULT_HERO_IMAGES;
  if (!existing.nomSite) existing.nomSite = 'Musée Dar Cheraït';
  if (!existing.slogan) existing.slogan = 'Un voyage à travers la civilisation tunisienne';

  await existing.save();

  console.log('   Après : horaires =', existing.horaires.length, '| tarifs =', existing.tarifs.length);
  console.log('✅ Document Settings forcé avec succès');

  await mongoose.disconnect();
  console.log('✅ Terminé');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
