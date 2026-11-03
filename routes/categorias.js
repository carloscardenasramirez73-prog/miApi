const crearCrud = require('./crud');
const { Categoria, Producto } = require('../models');

module.exports = crearCrud(Categoria, {
    campos: ['nombre', 'descripcion'],
    // Devuelve los ids de sus productos para mostrar la cantidad en la tabla
    include: [{ model: Producto, as: 'productos', attributes: ['id'] }],
    validar: async (datos) => {
        if (!datos.nombre) return 'El nombre de la categoría es obligatorio';
        return null;
    }
});
