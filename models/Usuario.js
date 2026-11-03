const crypto = require('crypto');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Guardamos la contraseña "hasheada" con scrypt (viene incluido en Node, no hay que instalar nada).
// Formato guardado: salt:hash
function hashPassword(plano) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(plano, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

// Se usará más adelante cuando se implemente el Login
function verificarPassword(plano, guardado) {
    const [salt, hash] = guardado.split(':');
    const hashIntento = crypto.scryptSync(plano, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), hashIntento);
}

const Usuario = sequelize.define('Usuario', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: { msg: 'El email del usuario no es válido' } }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('Administrador', 'Almacenero', 'Supervisor'),
        allowNull: false,
        defaultValue: 'Almacenero'
    }
}, {
    tableName: 'usuarios',
    timestamps: true,
    hooks: {
        beforeSave: (usuario) => {
            if (usuario.changed('password')) {
                usuario.password = hashPassword(usuario.password);
            }
        }
    }
});

Usuario.verificarPassword = verificarPassword;

module.exports = Usuario;
