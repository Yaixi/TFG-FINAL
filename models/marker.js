const mongoose = require('mongoose');

const markerSchema = new mongoose.Schema({
    // --- Campos geoespaciales y de información ---
    latlng: {
        lat: Number,
        lng: Number
    },
    title: { type: String, required: true },
    info: String,
    image: String,
    masInfo: String,
    municipio: { type: String, required: true },
    precio: {
        type: Number,
        default: 0.0
    },

    // --- ¡AQUÍ ES DONDE DEBES AÑADIR EL CAMPO! ---
    // Este campo identificará al usuario que creó el marcador.
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia a tu modelo de Usuario
        required: true // Es importante que cada marcador tenga un autor
    },

    // --- Campos de clasificación ---
    category: {
        type: String,
        enum: ['Restauración', 'Viajes', 'Naturaleza', 'Deportes', 'Ocio', 'Gratis', 'sin asignar'],
        default: 'sin asignar'
    },
    plan: {
        type: String,
        enum: ['normal', 'gratis'],
        default: 'normal'
    },
    
    // --- Campo para almacenar las valoraciones individuales ---
    valoraciones: [{
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            required: true
        },
        puntuacion: { 
            type: Number, 
            required: true, 
            min: 1, 
            max: 5 
        }
    }]
    
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// --- Tus campos virtuales (valoracionMedia, numeroVotos) ---
// Estos no necesitan ningún cambio. Funcionarán perfectamente.
markerSchema.virtual('valoracionMedia').get(function() {
    if (!this.valoraciones || this.valoraciones.length === 0) {
        return 0;
    }
    const suma = this.valoraciones.reduce((total, v) => total + v.puntuacion, 0);
    const media = suma / this.valoraciones.length;
    return Math.round(media * 10) / 10;
});

markerSchema.virtual('numeroVotos').get(function() {
    if (!this.valoraciones) {
        return 0;
    }
    return this.valoraciones.length;
});

const Marker = mongoose.model('Marker', markerSchema);

module.exports = Marker;