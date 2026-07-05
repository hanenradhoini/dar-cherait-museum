const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true },
  sujet: { type: String, required: true },
  texte: { type: String, required: true },
  lu: { type: Boolean, default: false }, // لمتابعة الرسائل المقروءة في لوحة التحكم
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);