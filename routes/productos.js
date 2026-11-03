const crearCrud = require('./crud');
const { Producto, Categoria, Proveedor } = require('../models');

module.exports = crearCrud(Producto, {
    // Al crear se acepta el stock inicial; después el stock solo cambia con Movimientos (Kardex)
    campos: ['nombre', 'descripcion', 'precio', 'stock', 'categoria_id', 'proveedor_id'],
    camposEditables: ['nombre', 'descripcion', 'precio', 'categoria_id', 'proveedor_id'],
    include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] }
    ],
    validar: async (datos) => {
        if (!datos.nombre) return 'El nombre del producto es obligatorio';
        if (datos.precio === undefined || datos.precio === null || Number(datos.precio) < 0) {
            return 'El precio es obligatorio y no puede ser negativo';
        }
        if (datos.stock !== undefined && datos.stock !== null && Number(datos.stock) < 0) {
            return 'El stock no puede ser negativo';
        }
        // Relación obligatoria: un producto no existe sin una categoría real
        if (!datos.categoria_id) return 'Debes asignar una categoría al producto';
        const categoria = await Categoria.findByPk(datos.categoria_id);
        if (!categoria) return 'La categoría seleccionada no existe';
        // El proveedor es opcional, pero si se envía debe existir
        if (datos.proveedor_id) {
            const proveedor = await Proveedor.findByPk(datos.proveedor_id);
            if (!proveedor) return 'El proveedor seleccionado no existe';
        }
        return null;
    }
});
