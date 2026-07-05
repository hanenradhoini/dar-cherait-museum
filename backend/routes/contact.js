const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// استقبال رسالة جديدة من صفحة Contact
router.post('/', async (req, res) => {
  try {
    const { nom, email, sujet, texte } = req.body;
    
    if (!nom || !email || !sujet || !texte) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs.' });
    }

    const newMessage = new Message({ nom, email, sujet, texte });
    await newMessage.save();

    res.status(201).json({ success: true, message: 'Message envoyé avec succès !' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de l\'envoi.' });
  }
});

module.exports = router;