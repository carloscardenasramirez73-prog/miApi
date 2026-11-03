const { Router } = require('express');
const { manejarError, ErrorNegocio } = require('./utils');

/**
 * Crea las 5 rutas básicas (GET lista, GET uno, POST, PUT, DELETE) para un modelo.
 *
 * opciones:
 *  - campos:          campos que se aceptan al CREAR
 *  - camposEditables: campos que se aceptan al EDITAR (por defecto, los mismos de campos)
 *  - ignorarVacios:   campos que, si llegan vacíos, no se tocan (ej. password al editar)
 *  - include:         relaciones que se devuelven junto al registro
 *  - excluir:         campos que nunca se devuelven (ej. password)
 *  - validar:         función async (datos, actual) que devuelve un mensaje de error o null
 */
function crearCrud(Modelo, opciones) {
    const {
        campos,
        camposEditables = campos,
        ignorarVacios = [],
        include = [],
        excluir = [],
        validar
    } = opciones;

    const attributes = { exclude: excluir };
    const router = Router();

    // Toma solo los campos permitidos; los vacíos "" se guardan como null
    const tomarDatos = (body, permitidos) => {
        const datos = {};
        for (const campo of permitidos) {
            if (body[campo] === undefined) continue;
            if (body[campo] === '') {
                if (ignorarVacios.includes(campo)) continue;
                datos[campo] = null;
            } else {
                datos[campo] = body[campo];
            }
        }
        return datos;
    };

    const buscar = (id) => Modelo.findByPk(id, { include, attributes });

    router.get('/', async (req, res) => {
        try {
            const lista = await Modelo.findAll({ include, attributes, order: [['id', 'ASC']] });
            res.json(lista);
        } catch (error) {
            manejarError(res, error);
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const item = await buscar(req.params.id);
            if (!item) throw new ErrorNegocio('Registro no encontrado', 404);
            res.json(item);
        } catch (error) {
            manejarError(res, error);
        }
    });

    router.post('/', async (req, res) => {
        try {
            const datos = tomarDatos(req.body, campos);
            if (validar) {
                const mensaje = await validar(datos, null);
                if (mensaje) throw new ErrorNegocio(mensaje);
            }
            const nuevo = await Modelo.create(datos);
            res.status(201).json(await buscar(nuevo.id));
        } catch (error) {
            manejarError(res, error);
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const item = await Modelo.findByPk(req.params.id);
            if (!item) throw new ErrorNegocio('Registro no encontrado', 404);
            const datos = tomarDatos(req.body, camposEditables);
            if (validar) {
                const mensaje = await validar({ ...item.toJSON(), ...datos }, item);
                if (mensaje) throw new ErrorNegocio(mensaje);
            }
            await item.update(datos);
            res.json(await buscar(item.id));
        } catch (error) {
            manejarError(res, error);
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            const item = await Modelo.findByPk(req.params.id);
            if (!item) throw new ErrorNegocio('Registro no encontrado', 404);
            await item.destroy();
            res.json({ message: 'Registro eliminado' });
        } catch (error) {
            manejarError(res, error);
        }
    });

    return router;
}

module.exports = crearCrud;
