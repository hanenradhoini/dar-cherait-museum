// backend/scripts/fixAllHttpUrls.js
// Parcourt TOUTES les collections de la base, TOUS les documents,
// et remplace récursivement toute chaîne commençant par le préfixe HTTP
// du backend Render par sa version HTTPS. Ne dépend d'aucun modèle Mongoose :
// fonctionne même sur des champs imbriqués (objets, tableaux) quel que soit leur nom.
//
// ⚠️ IMPORTANT : ce script doit se connecter à la base MongoDB ATLAS de PRODUCTION
// (celle utilisée par votre backend déployé sur Render), pas à votre Mongo local.
// Deux façons de fournir l'URI Atlas :
//   1. Passez-la directement en argument :
//      node scripts/fixAllHttpUrls.js "mongodb+srv://user:pass@cluster.../dbname"
//   2. Ou définissez temporairement MONGO_URI dans backend/.env avec l'URI Atlas
//      (trouvable dans le dashboard Render → votre service backend → Environment)

require('dotenv').config();
const mongoose = require('mongoose');

const HTTP_PREFIX  = 'http://dar-cherait-museum.onrender.com';
const HTTPS_PREFIX = 'https://dar-cherait-museum.onrender.com';

const mongoUri = process.argv[2] || process.env.MONGO_URI;

async function main() {
  if (!mongoUri) {
    console.error('❌ Aucune URI MongoDB fournie. Passez-la en argument ou définissez MONGO_URI dans .env');
    process.exit(1);
  }
  if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
    console.warn('⚠️  ATTENTION : vous ciblez une base LOCALE, pas la base Atlas de production.');
    console.warn('   Les URLs cassées sur le site en ligne ne seront PAS corrigées par cette exécution.\n');
  }

  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB connecté');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  let totalDocsModifies = 0;
  let totalChampsCorriges = 0;

  for (const { name: collectionName } of collections) {
    // Ignore les collections système
    if (collectionName.startsWith('system.')) continue;

    const collection = db.collection(collectionName);
    const cursor = collection.find({});
    let docsModifiesDansCollection = 0;

    for await (const doc of cursor) {
      let modifie = false;

      function corrigerRecursif(valeur) {
        if (typeof valeur === 'string') {
          if (valeur.startsWith(HTTP_PREFIX)) {
            modifie = true;
            totalChampsCorriges++;
            return HTTPS_PREFIX + valeur.slice(HTTP_PREFIX.length);
          }
          return valeur;
        }
        if (Array.isArray(valeur)) {
          return valeur.map(corrigerRecursif);
        }
        if (valeur && typeof valeur === 'object' && !(valeur instanceof mongoose.Types.ObjectId) && !(valeur instanceof Date)) {
          const objCorrige = {};
          for (const [cle, val] of Object.entries(valeur)) {
            objCorrige[cle] = corrigerRecursif(val);
          }
          return objCorrige;
        }
        return valeur;
      }

      const docCorrige = corrigerRecursif(doc);

      if (modifie) {
        await collection.replaceOne({ _id: doc._id }, docCorrige);
        docsModifiesDansCollection++;
        totalDocsModifies++;
      }
    }

    if (docsModifiesDansCollection > 0) {
      console.log(`📁 ${collectionName} : ${docsModifiesDansCollection} document(s) corrigé(s)`);
    }
  }

  console.log(`\n🎉 Terminé : ${totalDocsModifies} document(s) modifié(s), ${totalChampsCorriges} champ(s) corrigé(s)`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});