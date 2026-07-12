require('dotenv').config();
const connectMongo = require('../config/mongo');
const Media = require('../models/Media');

async function fixLocalUrls() {
  await connectMongo();

  const medias = await Media.find({ url: { $regex: '^https://localhost' } });
  console.log(`🔎 ${medias.length} média(s) local(aux) à corriger`);

  let count = 0;
  for (const media of medias) {
    const newUrl = media.url.replace('https://localhost', 'http://localhost');
    await Media.updateOne({ _id: media._id }, { $set: { url: newUrl } });
    console.log(`   ✅ ${media.filename} → ${newUrl}`);
    count++;
  }

  console.log(`🎉 Terminé : ${count} URL(s) corrigée(s)`);
  process.exit(0);
}

fixLocalUrls().catch((err) => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});