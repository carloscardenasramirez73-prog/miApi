const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Kardex: cada fila explica por qué cambió el stock de un producto.
// Las llaves foráneas producto_id y usuario_id se crean en models/index.js
const Movimiento = sequelize.define('Movimiento', {
    tipo_movimiento: {
        type: DataTypes.ENUM('Entrada', 'Salida', 'Ajuste'),
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha_hora: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    observaciones: {
        type: DataTypes.TEXT
    },
    // true cuando el movimiento fue anulado (el stock ya se revirtió)
    anulado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'movimientos',
    timestamps: false
});

module.exports = Movimiento;