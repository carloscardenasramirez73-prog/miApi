// Error propio para avisar problemas de reglas de negocio (stock insuficiente, datos faltantes, etc.)
class ErrorNegocio extends Error {
    constructor(mensaje, status = 400) {
        super(mensaje);
        this.status = status;
    }
}

// Convierte cualquier error en una respuesta JSON clara para el frontend
function manejarError(res, error) {
    if (error instanceof ErrorNegocio) {
        return res.status(error.status).json({ error: error.message });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(409).json({
            error: 'No se puede completar la operación: el registro está relacionado con otros datos.'
        });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Ya existe un registro con ese valor (dato duplicado).' });
    }
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error(error);
    res.status(500).json({ error: error.message });
}

module.exports = { ErrorNegocio, manejarError };
