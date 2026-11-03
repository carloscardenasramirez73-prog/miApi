require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/db');
const { Usuario } = require('./models'); // al importar los modelos Sequelize los registra para el sync

const authRoutes = require('./routes/authRoutes');
const autenticar = require('./middleware/authMiddleware');

const app = express();

// --- PROTECCIÓN CONTRA ATAQUES COMUNES ---

// 1. HELMET: Protege contra XSS y otras vulnerabilidades de cabecera HTTP
app.use(helmet());

// 2. CORS: Configuración restrictiva (reemplazar por la URL de tu React cuando esté en producción)
// Por ahora permitimos localhost:5173 (Vite), lo cual previene peticiones de orígenes no autorizados.
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. RATE LIMIT: Previene ataques de Fuerza Bruta y DoS limitando las peticiones por IP
// (en las versiones nuevas de express-rate-limit la opción "max" de la guía se llama "limit")
const limitador = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 100, // Máximo 100 peticiones por IP en ese lapso
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.'
});
app.use('/api/', limitador); // Aplica a todas las rutas que comiencen con /api/

// Parsear el body de las peticiones a JSON (SIEMPRE antes de registrar las rutas)
app.use(express.json());

// --- RUTAS BÁSICAS DE PRUEBA ---
app.get('/', (req, res) => {
    res.send('¡API Backend funcionando exitosamente!');
});

// Rutas de autenticación abiertas para todos
app.use('/api/auth', authRoutes);

// --- RUTAS PROTEGIDAS (necesitan token y rol permitido) ---
const SOLO_ADMIN = ['Administrador'];
const ALMACEN = ['Administrador', 'Almacenero'];
const TODOS_LOS_ROLES = ['Administrador', 'Almacenero', 'Supervisor'];

app.use('/api/dashboard', autenticar(TODOS_LOS_ROLES), require('./routes/dashboard'));
app.use('/api/productos', autenticar(ALMACEN), require('./routes/productos'));
app.use('/api/categorias', autenticar(ALMACEN), require('./routes/categorias'));
app.use('/api/proveedores', autenticar(ALMACEN), require('./routes/proveedores'));
app.use('/api/movimientos', autenticar(ALMACEN), require('./routes/movimientos'));
app.use('/api/usuarios', autenticar(SOLO_ADMIN), require('./routes/usuarios'));

// Si no existe ningún usuario, crea un administrador inicial para poder iniciar sesión
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

// force: false evita que se borren los datos cada vez que se reinicia el servidor
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