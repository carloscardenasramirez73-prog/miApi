require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const Producto = require('./models/Producto');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API Backend funcionando exitosamente!');
});

// --- RUTAS CRUD PARA PRODUCTOS ---

// 1. POST: Crear un nuevo producto (Hace funcionar el botón Guardar)
app.post('/productos', async (req, res) => {
    try {
        const nuevoProducto = await Producto.create(req.body);
        res.json(nuevoProducto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. GET: Obtener todos los productos (Hace funcionar la Lista de Productos)
app.get('/productos', async (req, res) => {
    try {
        const productos = await Producto.findAll();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. PUT: Actualizar un producto existente (Hace funcionar el botón Editar)
app.put('/productos/:id', async (req, res) => {
    try {
        await Producto.update(req.body, {
            where: { id: req.params.id }
        });
        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. DELETE: Eliminar un producto (Hace funcionar el botón Eliminar)
app.delete('/productos/:id', async (req, res) => {
    try {
        await Producto.destroy({
            where: { id: req.params.id }
        });
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- SINCRONIZACIÓN Y ARRANQUE ---
const PORT = process.env.PORT || 3006;

sequelize.sync({ force: false })
    .then(() => {
        console.log('Base de datos conectada y sincronizada.');
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('Error al conectar con la base de datos:', error);
    });