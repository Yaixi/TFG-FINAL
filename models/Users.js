const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define el esquema para proveedores de terceros
const ThirdPartyProviderSchema = new mongoose.Schema({
    provider_name: {
        type: String,
        default: null
    },
    provider_id: {
        type: String,
        default: null
    },
    provider_data: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
});

// Crear el esquema para el usuario
const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: null
        },
        city: {
            type: String,
            default: null
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        email_is_verified: {
            type: Boolean,
            default: false
        },
        password: {
            type: String
        },
        referred_by: {
            type: String,
            default: null
        },
        third_party_auth: [ThirdPartyProviderSchema],
        date: {
            type: Date,
            default: Date.now
        },
        markers: [
            {
                latlng: {
                    lat: Number,
                    lng: Number
                },
                data: {
                    title: String,
                    image: String,
                    info: String,
                    category: String  
                }
            }
        ]
    },
    { strict: false }
);

// Método para generar un hash de la contraseña
UserSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// Método para validar la contraseña
UserSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
