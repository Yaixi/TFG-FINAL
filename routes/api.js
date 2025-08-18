const express = require('express');
const router = express.Router();
const Marker = require('../models/marker');

// Ruta para obtener todos los marcadores
router.get('/markers', async (req, res) => {
  try {
    const markers = await Marker.find({});
    res.json(markers);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
