// backend/routes/museum.js
const express = require('express');
const router = express.Router();
const museumController = require('../controllers/museumController');

// المسارات العامة للجلب
router.get('/expositions', museumController.getExpositions);
router.get('/oeuvres', museumController.getOeuvres);

module.exports = router;