const crearCrud = require('./crud');
const { Proveedor, Producto } = require('../models');

module.exports = crearCrud(Proveedor, {
    campos: ['razon_social', 'contacto', 'telefono', 'email'],
    include: [{ model: Producto, as: 'productos', attributes: ['id'] }],
    validar: async (datos) => {
        if (!datos.razon_social) return 'La razón social es obligatoria';
        return null;
    }
});
