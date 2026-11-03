// controllers/authController.js
const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Compatibilidad: los usuarios creados en el Laboratorio 9 tienen la contraseña cifrada con scrypt
// (formato "salt:hash"). Esta función las reconoce para poder pasarlas a bcrypt en su primer login.
function coincideConScryptAntiguo(plano, guardado) {
    const [salt, hash] = guardado.split(':');
    if (!salt || !hash) return false;
    const intento = crypto.scryptSync(plano, salt, 64);
    const original = Buffer.from(hash, 'hex');
    return original.length === intento.length && crypto.timingSafeEqual(original, intento);
}

exports.registrar = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y password son obligatorios' });
        }

        // Verificar si el correo ya está en uso
        const existe = await Usuario.findOne({ where: { email } });
        if (existe) {
            return res.status(400).json({ error: 'El correo ya se encuentra registrado' });
        }

        const nuevoUsuario = await Usuario.create({ nombre, email, password, rol });
        res.status(201).json({ message: 'Usuario registrado exitosamente', id: nuevoUsuario.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y password son obligatorios' });
        }

        // Buscar al usuario
        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Validar contraseña
        let passwordCorrecto;
        if (usuario.password.startsWith('$2')) {
            // Contraseña ya cifrada con bcrypt
            passwordCorrecto = await bcrypt.compare(password, usuario.password);
        } else {
            // Usuario del Laboratorio 9: se valida con scrypt y, si es correcta, se pasa a bcrypt
            passwordCorrecto = coincideConScryptAntiguo(password, usuario.password);
            if (passwordCorrecto) {
                usuario.password = password; // el hook beforeUpdate la vuelve a cifrar con bcrypt
                await usuario.save();
            }
        }
        if (!passwordCorrecto) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
