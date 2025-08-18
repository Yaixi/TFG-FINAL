// PÁGINA E MARCOS Y YAIZA PARA CARGAR PLANES

const express = require('express');
const router = express.Router();
const Marker = require('../models/marker');
const multer = require('multer');
const fs = require('fs');

// Configuración de multer
const upload = multer({ dest: 'uploads/' });

// Middleware para verificar si es administrador
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// GET admin page
router.get('/', isAdmin, (req, res) => {
  res.render('admin', { title: 'Admin' });
});

// POST JSON file
router.post('/upload-json', isAdmin, upload.single('jsonFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Leer y procesar el archivo JSON
  const filePath = req.file.path;
  fs.readFile(filePath, 'utf8', async (err, data) => {
    if (err) {
      return res.status(500).send('Error reading file.');
    }

    try {
      const markers = JSON.parse(data);
      await Marker.insertMany(markers);
      fs.unlinkSync(filePath); // Elimina el archivo temporal
      res.status(200).send('Markers uploaded successfully');
    } catch (error) {
      res.status(500).send('Error processing JSON data.');
    }
  });
});

module.exports = router;

