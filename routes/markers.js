const express = require('express');
const router = express.Router();
const Marker = require('../models/marker.js');

// --- NUEVO: MIDDLEWARE DE AUTENTICACIÓN ---
// Este middleware verifica si el usuario ha iniciado sesión.
// Lo usaremos para proteger las rutas que lo necesiten.
// Passport.js añade la función `req.isAuthenticated()` a la petición.
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // Si está autenticado, continúa.
    }
    // Si no, devuelve un error de "No autorizado".
    res.status(401).json({ message: 'Acceso denegado. Debes iniciar sesión.' });
}


// --- RUTA PARA OBTENER TODOS LOS MARCADORES (PÚBLICA) ---
// Esta ruta no cambia, ya que es para que todos vean todos los marcadores en el mapa general.
// Ruta: GET /markers/
router.get('/', async (req, res) => {
    try {
        const markers = await Marker.find();
        res.json(markers);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener los marcadores", error: err.message });
    }
});


// --- RUTA PARA CREAR UN NUEVO MARCADOR (PROTEGIDA Y MODIFICADA) ---
// Se añade el middleware `isLoggedIn` para que solo usuarios logueados puedan crear.
// Ruta: POST /markers/
router.post('/', isLoggedIn, async (req, res) => {
    // Creamos una nueva instancia del modelo con los datos del body
    const marker = new Marker({
        title: req.body.title,
        info: req.body.info,
        masInfo: req.body.masInfo,
        image: req.body.image,
        category: req.body.category,
        plan: req.body.plan,
        latlng: req.body.latlng,
        municipio: req.body.municipio,
        precio: req.body.precio,

        // --- CAMBIO CLAVE: ASIGNAR EL AUTOR ---
        // Asignamos el ID del usuario que ha iniciado sesión (gracias a Passport.js, está en req.user)
        author: req.user._id 
    });

    try {
        const newMarker = await marker.save();
        res.status(201).json(newMarker); // 201 = Creado con éxito
    } catch (err) {
        // Si hay un error de validación (ej: falta un campo requerido como 'author'), se enviará un error 400.
        res.status(400).json({ message: "Error al crear el marcador", error: err.message });
    }
});


// --- RUTA PARA AÑADIR UNA VALORACIÓN (PROTEGIDA) ---
// Es buena idea proteger también esta ruta para que solo usuarios logueados puedan valorar.
// Ruta: POST /markers/:id/valorar
router.post('/:id/valorar', isLoggedIn, async (req, res) => {
    // Ahora, en lugar de recibir el userId del body, usamos el del usuario logueado.
    // Esto es mucho más seguro.
    const userId = req.user._id;
    const { puntuacion } = req.body;

    if (!puntuacion) {
        return res.status(400).json({ message: "Falta la puntuación." });
    }

    try {
        const marker = await Marker.findById(req.params.id);
        if (!marker) {
            return res.status(404).json({ message: "Marcador no encontrado." });
        }

        // OPCIONAL PERO RECOMENDADO: Evitar que un usuario vote dos veces.
        const yaVoto = marker.valoraciones.some(v => v.userId.toString() === userId.toString());
        if (yaVoto) {
            return res.status(409).json({ message: "Ya has valorado este marcador." }); // 409 = Conflicto
        }

        marker.valoraciones.push({ userId, puntuacion });
        const updatedMarker = await marker.save();
        res.json(updatedMarker);

    } catch (err) {
        res.status(500).json({ message: "Error al añadir la valoración", error: err.message });
    }
});

// --- EJEMPLO: RUTA PARA BORRAR UN MARCADOR (PROTEGIDA) ---
// Ruta: DELETE /markers/:id
router.delete('/:id', isLoggedIn, async (req, res) => {
    try {
        const marker = await Marker.findById(req.params.id);
        if (!marker) {
            return res.status(404).json({ message: "Marcador no encontrado" });
        }

        // --- VERIFICACIÓN DE PERMISOS ---
        // Comparamos el `author` del marcador con el ID del usuario logueado.
        if (marker.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "No tienes permiso para borrar este marcador." }); // 403 = Prohibido
        }

        await marker.remove(); // o Marker.findByIdAndDelete(req.params.id)
        res.json({ message: "Marcador borrado con éxito." });

    } catch (err) {
        res.status(500).json({ message: "Error al borrar el marcador", error: err.message });
    }
});
// Cargar marcadores públicos desde un link compartido
router.get('/public-markers/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).send('Usuario no encontrado');
        res.json(user.markers);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error interno');
    }
});

// Generar un enlace público para compartir el mapa
router.get('/generate-share-link', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.shareId) {
            user.shareId = require('crypto').randomBytes(6).toString('hex');
            await user.save();
        }
        res.json({ url: `${req.protocol}://${req.get('host')}/mapa/${user._id}` });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al generar enlace');
    }
});

// Página pública del mapa
router.get('/shared/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).send('Mapa no encontrado');
        res.render('shared_map', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar mapa compartido');
    }
});


// -------------------------------------------------------------------
// EXPORTAR EL ROUTER
// -------------------------------------------------------------------
module.exports = router;