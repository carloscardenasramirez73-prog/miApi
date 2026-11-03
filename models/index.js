const Categoria = require('./Categoria');
const Proveedor = require('./Proveedor');
const Usuario = require('./Usuario');
const Producto = require('./Producto');
const Movimiento = require('./Movimiento');

// ---- Asociaciones (llaves foráneas) ----

// Categoria 1 --- N Producto
Categoria.hasMany(Producto, { as: 'productos', foreignKey: 'categoria_id', onDelete: 'RESTRICT' });
Producto.belongsTo(Categoria, { as: 'categoria', foreignKey: 'categoria_id' });

// Proveedor 1 --- N Producto
Proveedor.hasMany(Producto, { as: 'productos', foreignKey: 'proveedor_id', onDelete: 'RESTRICT' });
Producto.belongsTo(Proveedor, { as: 'proveedor', foreignKey: 'proveedor_id' });

// Producto 1 --- N Movimiento
Producto.hasMany(Movimiento, { as: 'movimientos', foreignKey: 'producto_id', onDelete: 'RESTRICT' });
Movimiento.belongsTo(Producto, { as: 'producto', foreignKey: 'producto_id' });

// Usuario 1 --- N Movimiento
Usuario.hasMany(Movimiento, { as: 'movimientos', foreignKey: 'usuario_id', onDelete: 'RESTRICT' });
Movimiento.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuario_id' });

module.exports = { Categoria, Proveedor, Usuario, Producto, Movimiento };