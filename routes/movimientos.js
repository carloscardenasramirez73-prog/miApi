const { Router } = require('express');
const sequelize = require('../config/db');
const { Movimiento, Producto, Usuario } = require('../models');
const { ErrorNegocio, manejarError } = require('./utils');

const router = Router();

const incluirRelaciones = [
    { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
    { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'rol'] }
];

// Cuánto cambia el stock según el tipo:
// Entrada suma, Salida resta, Ajuste suma la cantidad tal cual (puede ser negativa)
function variacionDeStock(tipo, cantidad) {
    return tipo === 'Salida' ? -cantidad : cantidad;
}

// GET: historial del Kardex (lo más reciente primero)
router.get('/', async (req, res) => {
    try {
        const movimientos = await Movimiento.findAll({
            include: incluirRelaciones,
            order: [['fecha_hora', 'DESC'], ['id', 'DESC']]
        });
        res.json(movimientos);
    } catch (error) {
        manejarError(res, error);
    }
});

// POST: registrar un movimiento y actualizar el stock en UNA sola transacción.
// Si algo falla, no se guarda el movimiento ni cambia el stock.
router.post('/', async (req, res) => {
    try {
        const { producto_id, usuario_id, tipo_movimiento, observaciones } = req.body;
        const cantidad = Number(req.body.cantidad);

        if (!['Entrada', 'Salida', 'Ajuste'].includes(tipo_movimiento)) {
            throw new ErrorNegocio('El tipo de movimiento debe ser Entrada, Salida o Ajuste');
        }
        if (!Number.isInteger(cantidad) || cantidad === 0) {
            throw new ErrorNegocio('La cantidad debe ser un número entero distinto de 0');
        }
        if (tipo_movimiento !== 'Ajuste' && cantidad < 0) {
            throw new ErrorNegocio('En Entrada y Salida la cantidad debe ser positiva');
        }

        const creado = await sequelize.transaction(async (t) => {
            // Bloqueamos la fila del producto mientras dura la transacción
            const producto = await Producto.findByPk(producto_id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!producto) throw new ErrorNegocio('El producto no existe', 404);

            const usuario = await Usuario.findByPk(usuario_id, { transaction: t });
            if (!usuario) throw new ErrorNegocio('El usuario no existe');

            const nuevoStock = producto.stock + variacionDeStock(tipo_movimiento, cantidad);
            if (nuevoStock < 0) {
                throw new ErrorNegocio(`Stock insuficiente: el producto tiene ${producto.stock} unidades`);
            }

            const movimiento = await Movimiento.create({
                producto_id,
                usuario_id,
                tipo_movimiento,
                cantidad,
                observaciones: observaciones || null
            }, { transaction: t });

            await producto.update({ stock: nuevoStock }, { transaction: t });
            return movimiento;
        });

        res.status(201).json(await Movimiento.findByPk(creado.id, { include: incluirRelaciones }));
    } catch (error) {
        manejarError(res, error);
    }
});

// POST /:id/anular: marca el movimiento como anulado y revierte su efecto en el stock
// (también en una transacción: o se hacen las dos cosas o ninguna).
router.post('/:id/anular', async (req, res) => {
    try {
        await sequelize.transaction(async (t) => {
            const movimiento = await Movimiento.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!movimiento) throw new ErrorNegocio('El movimiento no existe', 404);
            if (movimiento.anulado) throw new ErrorNegocio('El movimiento ya fue anulado');

            const producto = await Producto.findByPk(movimiento.producto_id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!producto) throw new ErrorNegocio('El producto del movimiento ya no existe', 404);

            // Se resta lo que el movimiento original había sumado (o se suma lo que había restado)
            const nuevoStock = producto.stock - variacionDeStock(movimiento.tipo_movimiento, movimiento.cantidad);
            if (nuevoStock < 0) {
                throw new ErrorNegocio(
                    `No se puede anular: el stock quedaría negativo (stock actual: ${producto.stock})`
                );
            }

            await producto.update({ stock: nuevoStock }, { transaction: t });
            await movimiento.update({ anulado: true }, { transaction: t });
        });

        res.json({ message: 'Movimiento anulado y stock revertido' });
    } catch (error) {
        manejarError(res, error);
    }
});

module.exports = router;