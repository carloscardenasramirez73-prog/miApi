const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Proveedor = sequelize.define('Proveedor', {
    razon_social: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contacto: {
        type: DataTypes.STRING
    },
    telefono: {
        type: DataTypes.STRING(30)
    },
    email: {
        type: DataTypes.STRING,
        validate: { isEmail: { msg: 'El email del proveedor no es válido' } }
    }
}, {
    tableName: 'proveedores',
    timestamps: true
});

module.exports = Proveedor;
