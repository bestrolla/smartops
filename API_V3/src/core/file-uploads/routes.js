const express = require('express');
const router = express.Router();
const imageController = require('./controllers/image.controller');

// Ruta para servir imágenes
router.get('/images/:imagePath(*)', imageController.serveImage);

module.exports = router;
