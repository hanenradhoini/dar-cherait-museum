require('dotenv').config({ path: '../.env.production.local' });
const connectMongo = require('../config/mongo');
const Media = require('../models/Media');

const CORRECT_BASE_URL = 'https://dar-cherait-museum.onrender.com';

async function fixUrls() {
  await connectMongo();

  const medias = await Media.find({
    url: { $not: { $regex: `^${CORRECT_BASE_URL}` } },
  });

  console.log(`🔎 ${medias.length} média(s) à corriger`);

  let count = 0;
  for (const media of medias) {
    const filename = media.filename;
    const newUrl = `${CORRECT_BASE_URL}/uploads/${filename}`;

    if (newUrl !== media.url) {
      await Media.updateOne({ _id: media._id }, { $set: { url: newUrl } });
      console.log(`   ✅ ${filename} → ${newUrl}`);
      count++;
    }
  }

  console.log(`🎉 Terminé : ${count} URL(s) corrigée(s)`);
  process.exit(0);
}

fixUrls().catch((err) => {
  console.error('❌ Erreur migration :', err);
  process.exit(1);
});
