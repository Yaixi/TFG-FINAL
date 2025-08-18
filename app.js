var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var flash = require('connect-flash');
const createError = require('http-errors');
const passport = require("./passport/setup");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const mongoose = require('mongoose');

// --- IMPORTACIÓN DE MODELOS ---
// Es buena práctica tener los modelos que se usan aquí a mano
const User = require('./models/Users'); 
const Marker = require('./models/marker'); // <<<--- 1. IMPORTAMOS EL MODELO MARKER

// --- IMPORTACIÓN DE RUTAS ---
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const loginRouter = require('./routes/login');
const signupRouter = require('./routes/signup');
const logoutRouter = require('./routes/logout');
const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api'); 
var markersRouter = require('./routes/markers');

var app = express();

// --- CONEXIÓN A LA BASE DE DATOS ---
const mongoDB = 'mongodb+srv://yaizamunozgonzalez:1234@madriddebolsillo.ahd8y8d.mongodb.net/';

//const mongoDB = process.env.MONGO_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Conectado a la Base de Datos'));

// --- CONFIGURACIÓN DE MIDDLEWARE ---
// CÓDIGO NUEVO (SEGURO)
/*app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, 
    store: MongoStore.create({ mongoUrl: mongoDB })
  })
);*/
app.use(
  session({
    secret: "un-secreto-muy-bien-guardado-y-largo", // O process.env.SESSION_SECRET
    resave: false,
    saveUninitialized: true, // O false, dependiendo de tu necesidad
    store: new MongoStore({ // <<<--- SE USA 'new MongoStore'
      mongooseConnection: mongoose.connection, // <<<--- SE PASA LA CONEXIÓN DE MONGOOSE
      collection: 'sessions' // Opcional: nombre de la colección
    })
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --- ASIGNACIÓN DE RUTAS ---
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/login', loginRouter);
app.use('/signup', signupRouter);
app.use('/logout', logoutRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter); 
app.use('/markers', markersRouter);

// ======================================================================
// --- 2. AÑADIMOS LA NUEVA RUTA PÚBLICA PARA COMPARTIR MAPAS ---
// ======================================================================
app.get('/mapa/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Buscamos los marcadores y el usuario dueño
    const markers = await Marker.find({ author: userId });
    const owner = await User.findById(userId);

    if (!owner) {
      return next(createError(404, 'Usuario no encontrado'));
    }

    // Renderizamos la nueva vista 'public-map' y le pasamos los datos
    res.render('public-map', { 
      markers: markers,
      ownerName: owner.username // Asegúrate que 'username' es el campo correcto
    });

  } catch (error) {
    // Si hay un error (ej: ID inválido), lo pasamos al manejador de errores
    next(error);
  }
});

// --- MANEJO DE ERRORES ---
// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;