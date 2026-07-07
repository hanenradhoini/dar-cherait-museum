// backend/scripts/fixMediaUrls.js
require('dotenv').config();
const connectMongo = require('../config/mongo');
const Media = require('../models/Media');

async function fixUrls() {
  await connectMongo();

  const medias = await Media.find({ url: { $regex: '^http://' } });
  console.log(`🔎 ${medias.length} média(s) à corriger`);

  let count = 0;
  for (const media of medias) {
    const newUrl = media.url.replace('http://', 'https://');
    await Media.updateOne({ _id: media._id }, { $set: { url: newUrl } });
    console.log(`   ✅ ${media.filename} → ${newUrl}`);
    count++;
  }

  console.log(`🎉 Terminé : ${count} URL(s) corrigée(s)`);
  process.exit(0);
}

fixUrls().catch((err) => {
  console.error('❌ Erreur migration :', err);
  process.exit(1);
});