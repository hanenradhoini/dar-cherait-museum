// backend/config/fix-settings.js
// Script ponctuel : force la recréation d'un document Settings complet
// (horaires, tarifs, contact) si le document existant est vide ou incomplet.
//
// Usage :
//   node backend/config/fix-settings.js

require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('../models/Settings');

const DEFAULT_SETTINGS = {
  nomSite: 'Musée Dar Cheraït',
  slogan: 'Un voyage à travers la civilisation tunisienne',
  logoUrl: '',
  heroImages: {
    accueil: '', expositions: '', oeuvres: '', visite: '', contact: '',
  },
  horaires: [
    { jour: 'lundi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
    { jour: 'mardi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
    { jour: 'mercredi', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
    { jour: 'jeudi',    ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
    { jour: 'vendredi', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
    { jour: 'samedi',   ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
    { jour: 'dimanche', ouvertureJournee: '08:00', fermetureJournee: '18:30', ouvertureSoiree: '20:00', fermetureSoiree: '00:00', ferme: false },
  ],
  tarifs: [
    { espace: 'arts_traditions',   label: 'Arts & Traditions',   prix: 5.5, ordre: 1, actif: true },
    { espace: 'medina_1001_nuits', label: 'Médina 1001 Nuits',   prix: 6,   ordre: 2, actif: true },
    { espace: 'dar_zamen',         label: 'Dar Zamen',           prix: 6,   ordre: 3, actif: true },
    { espace: 'forfait_complet',   label: 'Forfait Tout Inclus', prix: 15,  ordre: 4, actif: true },
  ],
  contact: {
    adresse: 'Avenue Abou El Kacem Chebbi, Tozeur, Tunisie',
    telephone: '+216 76 452 636',
    email: 'contact@darcherait.tn',
    latitude: 33.9195,
    longitude: 8.1335,
  },
  reseauxSociaux: { facebook: '', instagram: '', youtube: '' },
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dar_cherait_content');
  console.log('✅ Connecté à MongoDB');

  const existing = await Settings.findOne();

  if (!existing) {
    await Settings.create(DEFAULT_SETTINGS);
    console.log('✅ Document Settings créé (aucun document existant)');
  } else if (!existing.horaires || existing.horaires.length === 0) {
    existing.horaires = DEFAULT_SETTINGS.horaires;
    if (!existing.tarifs || existing.tarifs.length === 0) existing.tarifs = DEFAULT_SETTINGS.tarifs;
    if (!existing.contact?.adresse) existing.contact = DEFAULT_SETTINGS.contact;
    if (!existing.nomSite) existing.nomSite = DEFAULT_SETTINGS.nomSite;
    if (!existing.slogan) existing.slogan = DEFAULT_SETTINGS.slogan;
    await existing.save();
    console.log('✅ Document Settings existant complété (horaires/tarifs/contact manquants)');
  } else {
    console.log('ℹ️  Document Settings déjà complet, aucune modification nécessaire');
    console.log('   horaires:', existing.horaires.length, '| tarifs:', existing.tarifs.length);
  }

  await mongoose.disconnect();
  console.log('✅ Terminé');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
