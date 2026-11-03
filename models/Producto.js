const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Las llaves foráneas categoria_id y proveedor_id se crean en models/index.js (asociaciones)
const Producto = sequelize.define('Producto', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'productos',
    timestamps: true // Crea automáticamente createdAt y updatedAt
});

module.exports = Producto;
