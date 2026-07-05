// backend/config/fix-index-espaces.js
// Script ponctuel : supprime l'index obsolète "nomEspace_1" sur la collection
// "espaces", reliquat d'un ancien schéma incompatible avec le modèle Espace.js actuel.
//
// Symptôme corrigé :
//   E11000 duplicate key error collection: dar_cherait_content.espaces
//   index: nomEspace_1 dup key: { nomEspace: null }
//
// Usage :
//   node backend/config/fix-index-espaces.js

require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dar_cherait_content');
  console.log('✅ Connecté à MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('espaces');

  const indexes = await collection.indexes();
  console.log('📋 Index actuels sur "espaces" :');
  indexes.forEach(idx => console.log('   -', idx.name, JSON.stringify(idx.key)));

  const obsolete = indexes.find(idx => idx.name === 'nomEspace_1');

  if (obsolete) {
    await collection.dropIndex('nomEspace_1');
    console.log('✅ Index obsolète "nomEspace_1" supprimé avec succès');
  } else {
    console.log('ℹ️  Aucun index "nomEspace_1" trouvé, rien à faire');
  }

  // Vérification finale
  const after = await collection.indexes();
  console.log('📋 Index restants sur "espaces" après nettoyage :');
  after.forEach(idx => console.log('   -', idx.name, JSON.stringify(idx.key)));

  // ── Même vérification pour la collection "collections" (Œuvres) ──
  console.log('\n--- Vérification de la collection "collections" ---');
  const collCollections = db.collection('collections');
  const collIndexes = await collCollections.indexes();
  console.log('📋 Index actuels sur "collections" :');
  collIndexes.forEach(idx => console.log('   -', idx.name, JSON.stringify(idx.key)));

  // Recherche de tout index obsolète similaire (nomCollection, nom, etc.)
  const suspectNames = ['nomCollection_1', 'nom_1', 'name_1'];
  for (const idx of collIndexes) {
    if (suspectNames.includes(idx.name)) {
      await collCollections.dropIndex(idx.name);
      console.log(`✅ Index obsolète "${idx.name}" supprimé de "collections"`);
    }
  }

  await mongoose.disconnect();
  console.log('✅ Terminé');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
