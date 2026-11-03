require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const { Usuario } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API Backend funcionando exitosamente!');
});

// --- RUTAS DEL SISTEMA DE INVENTARIO ---
app.use('/dashboard', require('./routes/dashboard'));
app.use('/productos', require('./routes/productos'));
app.use('/categorias', require('./routes/categorias'));
app.use('/proveedores', require('./routes/proveedores'));
app.use('/usuarios', require('./routes/usuarios'));
app.use('/movimientos', require('./routes/movimientos'));

// Si no existe ningún usuario, crea un administrador inicial para poder registrar movimientos
async function crearAdministradorInicial() {
    const total = await Usuario.count();
    if (total === 0) {
        await Usuario.create({
            nombre: 'Administrador',
            email: 'admin@senati.pe',
            password: 'admin123',
            rol: 'Administrador'
        });
        console.log('Usuario administrador inicial creado: admin@senati.pe / admin123');
    }
}

// --- SINCRONIZACIÓN Y ARRANQUE ---
const PORT = process.env.PORT || 3006;

sequelize.sync({ force: false })
    .then(async () => {
        console.log('Base de datos conectada y sincronizada.');
        await crearAdministradorInicial();
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('Error al conectar con la base de datos:', error);
    });
