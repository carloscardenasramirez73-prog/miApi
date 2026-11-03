const { Router } = require('express');
const { Op } = require('sequelize');
const { Categoria, Proveedor, Producto, Movimiento, Usuario } = require('../models');
const { manejarError } = require('./utils');

const router = Router();
const STOCK_BAJO = 5; // productos con este stock o menos se consideran "bajo stock"

router.get('/', async (req, res) => {
    try {
        const [
            totalProductos,
            totalCategorias,
            totalProveedores,
            bajoStock,
            productosBajoStock,
            movimientosRecientes,
            categorias
        ] = await Promise.all([
            Producto.count(),
            Categoria.count(),
            Proveedor.count(),
            Producto.count({ where: { stock: { [Op.lte]: STOCK_BAJO } } }),
            Producto.findAll({
                where: { stock: { [Op.lte]: STOCK_BAJO } },
                attributes: ['id', 'nombre', 'stock'],
                order: [['stock', 'ASC']],
                limit: 5
            }),
            Movimiento.findAll({
                include: [
                    { model: Producto, as: 'producto', attributes: ['nombre'] },
                    { model: Usuario, as: 'usuario', attributes: ['nombre'] }
                ],
                order: [['fecha_hora', 'DESC'], ['id', 'DESC']],
                limit: 5
            }),
            Categoria.findAll({
                include: [{ model: Producto, as: 'productos', attributes: ['stock'] }]
            })
        ]);

        const stockPorCategoria = categorias.map(c => ({
            categoria: c.nombre,
            productos: c.productos.length,
            stock: c.productos.reduce((suma, p) => suma + p.stock, 0)
        }));

        res.json({
            totalProductos,
            totalCategorias,
            totalProveedores,
            bajoStock,
            umbralBajoStock: STOCK_BAJO,
            productosBajoStock,
            movimientosRecientes,
            stockPorCategoria
        });
    } catch (error) {
        manejarError(res, error);
    }
});

module.exports = router;
