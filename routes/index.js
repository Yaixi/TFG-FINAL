var express = require('express');
var router = express.Router();
var o2x = require('object-to-xml');
var mongoose = require('mongoose');
var Marker = require('../models/marker');

// --- MIDDLEWARE DE AUTENTICACIÓN ---
// Esta función ya la tenías, comprueba si el usuario ha iniciado sesión.
function isLoggedIn (req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // Si está logueado, continúa
  }
  res.redirect('/login'); // Si no, lo manda a la página de login
}

// ======================================================================
// --- RUTAS PRINCIPALES ---
// ======================================================================

/* GET home page (http://localhost:3000/) */
// Muestra el mapa principal con todos los marcadores.
// He dejado solo una definición de esta ruta para evitar redundancia.
router.get('/', async function(req, res, next) {
  try {
    const markers = await Marker.find({});
    // Le pasamos el objeto 'user' para que el header sepa si mostrar "Login" o "Logout".
    res.render('index', { title: 'Madrid de Bolsillo', markers, user: req.user });
  } catch (err) {
    next(err);
  }
});

/* GET crear page (http://localhost:3000/crear) */
// CÓDIGO CORREGIDO en routes/index.js
router.get('/crear', isLoggedIn, function(req, res, next) {
  // 1. Detecta si la app está en producción (en Render) o en desarrollo (localhost)
  // req.protocol nos da "https" en Render y "http" en localhost.
  // req.get('host') nos da "madrid-de-bolsillo.onrender.com" o "localhost:3000".
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  // 2. Construye la URL completa para compartir
  const shareUrl = `${baseUrl}/mapa/${req.user._id}`;
  
  // 3. Pasa la URL a la vista 'crear.ejs'
  res.render('crear', { 
    title: 'Crear Nuevo Plan', 
    user: req.user,
    shareUrl: shareUrl // <--- Aquí pasamos la nueva variable
  });
});
router.get('/index', (req, res) => {
  res.redirect('/');
});


/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    const markers = await Marker.find({});
    res.render('index', { title: 'Madrid de Bolsillo', markers, user: req.user });
  } catch (err) {
    next(err);
  }
});
/*
  GET /acerca  (Página "Acerca de")
  Renderiza la vista 'acerca.ejs'.
*/
router.get('/acerca', function(req, res, next) {
  res.render('acerca', { 
    title: 'Acerca de Nosotros', 
    user: req.user 
  });
});

/* 
  GET /contacto  (Página "Contacto")
  Renderiza la vista 'contacto.ejs'.
*/
router.get('/contacto', function(req, res, next) {
  res.render('contacto', { 
    title: 'Contacto', 
    user: req.user 
  });
});

// Está registrado?
// Está registrado?
function isLoggedIn (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


// ======================================================================
// --- RUTAS DE API Y EXPORTACIÓN DE DATOS ---
// ======================================================================

// Ruta GET para exportar a XML
router.get('/xml', async (req, res, next) => {
  try {
    var markers = await Marker.find();
    var markersFixed = JSON.parse(JSON.stringify(markers));
    res.set('Content-Type', 'text/xml');
    res.send(o2x({
      '?xml version="1.0" encoding="utf-8"?': null, markers: { "marker": markersFixed }
    }));
  } catch (err) {
    next(err);
  }
});

// Ruta GET para exportar a JSON
router.get('/json', async function(req, res, next) {
  try {
    const markers = await Marker.find({});
    res.set('Content-Type', 'application/json');
    res.json(markers);
  } catch (err) {
    next(err);
  }
});

// Ruta para obtener los límites de un municipio desde Nominatim
router.get('/municipio-limites', async (req, res, next) => {
    const nombreMunicipio = req.query.nombre;
    if (!nombreMunicipio) {
        return res.status(400).json({ error: 'El nombre del municipio es requerido.' });
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nombreMunicipio + ', Comunidad de Madrid')}&format=json&polygon_geojson=1&limit=1`;

    try {
        const fetch = (await import('node-fetch')).default;
        const nominatimResponse = await fetch(url, {
            headers: { 'User-Agent': 'MadridDeBolsillo/1.0 (tuemail@ejemplo.com)' }
        });
        const data = await nominatimResponse.json();

        if (data.length > 0 && data[0].geojson) {
            res.json({
                nombre: data[0].display_name,
                geojson: data[0].geojson 
            });
        } else {
            res.status(404).json({ error: 'No se encontraron los límites para ese municipio.' });
        }
    } catch (error) {
        console.error("Error al contactar con Nominatim:", error);
        next(error);
    }
});

module.exports = router;