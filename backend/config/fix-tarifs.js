// backend/config/fix-tarifs.js
// Script ponctuel : vérifie les tarifs existants en base, et remplace
// ceux qui sont incomplets (espace/label/prix manquants) par les valeurs
// par défaut correctes.
//
// Usage :
//   node backend/config/fix-tarifs.js

require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('../models/Settings');

const DEFAULT_TARIFS = [
  { espace: 'arts_traditions',   label: 'Arts & Traditions',   prix: 5.5, ordre: 1, actif: true },
  { espace: 'medina_1001_nuits', label: 'Médina 1001 Nuits',   prix: 6,   ordre: 2, actif: true },
  { espace: 'dar_zamen',         label: 'Dar Zamen',           prix: 6,   ordre: 3, actif: true },
  { espace: 'forfait_complet',   label: 'Forfait Tout Inclus', prix: 15,  ordre: 4, actif: true },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dar_cherait_content');
  console.log('✅ Connecté à MongoDB');

  // Accès direct à la collection brute pour contourner toute validation Mongoose
  // (le but est justement de réparer des données qui ne passent plus la validation)
  const db = mongoose.connection.db;
  const collection = db.collection('settings');

  const doc = await collection.findOne({});
  if (!doc) {
    console.log('ℹ️  Aucun document Settings trouvé, rien à réparer');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('📋 Tarifs actuels en base :');
  console.log(JSON.stringify(doc.tarifs, null, 2));

  const tarifsEstTableau = Array.isArray(doc.tarifs);
  const incomplets = tarifsEstTableau && doc.tarifs.some(
    t => !t.espace || !t.label || t.prix === undefined || t.prix === null
  );

  if (tarifsEstTableau && !incomplets && doc.tarifs.length === 4) {
    console.log('ℹ️  Les tarifs semblent déjà complets, aucune réparation nécessaire');
  } else {
    if (!tarifsEstTableau) {
      console.log('⚠️  "tarifs" n\'est pas un tableau (structure obsolète détectée) — remplacement forcé');
    } else {
      console.log('⚠️  Tarifs incomplets ou en nombre incorrect — remplacement forcé');
    }
    await collection.updateOne(
      { _id: doc._id },
      { $set: { tarifs: DEFAULT_TARIFS } }
    );
    console.log('✅ Tarifs réparés et remplacés par les valeurs par défaut');
  }

  // Vérification finale
  const after = await collection.findOne({ _id: doc._id });
  console.log('📋 Tarifs après réparation :');
  console.log(JSON.stringify(after.tarifs, null, 2));

  // ── Vérification bonus : horaires a-t-il le même problème de structure ? ──
  const horairesEstTableau = Array.isArray(doc.horaires);
  if (!horairesEstTableau) {
    console.log('\n⚠️  "horaires" n\'est pas non plus un tableau valide.');
    console.log('   Lancez aussi : node config\\force-settings.js pour le réparer.');
  } else if (doc.horaires.length !== 7) {
    console.log(`\n⚠️  "horaires" contient ${doc.horaires.length} entrée(s) au lieu de 7.`);
    console.log('   Lancez aussi : node config\\force-settings.js pour le réparer.');
  } else {
    console.log('\nℹ️  "horaires" semble correct (7 entrées, tableau valide)');
  }

  await mongoose.disconnect();
  console.log('✅ Terminé');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});

