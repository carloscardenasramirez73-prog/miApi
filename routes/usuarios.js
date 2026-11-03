const crearCrud = require('./crud');
const { Usuario } = require('../models');

module.exports = crearCrud(Usuario, {
    campos: ['nombre', 'email', 'password', 'rol'],
    ignorarVacios: ['password'],  // al editar, si la contraseña viene vacía no se cambia
    excluir: ['password'],        // la contraseña nunca se devuelve al frontend
    validar: async (datos, actual) => {
        if (!datos.nombre) return 'El nombre es obligatorio';
        if (!datos.email) return 'El email es obligatorio';
        if (!actual && !datos.password) return 'La contraseña es obligatoria';
        // Al editar, datos.password trae la contraseña ya guardada si no se envió una nueva
        const cambiaPassword = actual ? datos.password !== actual.password : true;
        if (cambiaPassword && datos.password && datos.password.length < 6) {
            return 'La contraseña debe tener al menos 6 caracteres';
        }
        return null;
    }
});
