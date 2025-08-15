//Propósito: Exponer HTTP CRUD 
// con validaciones, sanitización y whitelist de campos.

const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
//

// Campos permitidos 
const ALLOWED_FIELDS = [
  'client_code',
  'first_name',
  'last_name',
  'email',
  'phone',
  'address',
  'city',
  'department',
];
 //Lista blanca: previene overposting (que te envíen campos inesperados).


// Filtra payload a los campos permitidos
const pickAllowed = (payload = {}) =>
  Object.fromEntries(Object.entries(payload).filter(([k]) => ALLOWED_FIELDS.includes(k)));

// Limpia strings: trim; 
function sanitizePayload(p) {
  const out = { ...p };
  for (const k of Object.keys(out)) {
    if (typeof out[k] === 'string') {
      const v = out[k].trim();
      out[k] = v === '' ? null : v;
    }
  }
  return out;
}

/**
 * GET /api/clients
 * Listar clientes 
 */
router.get('/', async (_req, res) => {
  try {
    const result = await Client.getAll();
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener clientes',
        error: result.error || result.message,
      });
    }

    // Defensa por si el modelo aún no filtra:
    const rows = Array.isArray(result.data)
      ? result.data.filter(r => r.is_active !== false) // true o null -> incluye; false -> excluye
      : [];

    res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error('Error en GET /api/clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
});

/**
 * GET /api/clients/:id
 * Obtener detalle de un cliente 
 */
router.get('/:id', async (req, res) => {
  try {
    const clientId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(clientId) || clientId <= 0) {
      return res.status(400).json({ success: false, message: 'ID de cliente inválido' });
    }

    const result = await Client.getById(clientId);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener el cliente',
        error: result.error || result.message,
      });
    }
    if (result.data.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    const client = result.data[0];
    if (client.is_active === false) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('Error en GET /api/clients/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
});

/**
 * POST /api/clients
 * Crear cliente (con validaciones).
 */
router.post('/', Client.getValidationRules(), async (req, res) => {
  try {
    // 1) Validación
    const validation = Client.checkValidation(req);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validación fallida',
        errors: validation.errors,
      });
    }

    // 2) Whitelist + sanitizado
    let payload = pickAllowed(req.body);
    payload = sanitizePayload(payload);

    // 3) Unicidad de client_code
    const exists = await Client.getByCode(payload.client_code);
    if (exists.success && exists.data.length > 0) {
      return res.status(409).json({ success: false, message: 'El client_code ya existe' });
    }

    // 4) Crear
    const result = await Client.create(payload);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al crear el cliente',
        error: result.error || result.message,
      });
    }

    // 5) Consultar creado
    const created = await Client.getById(result.data.insertId);
    return res
      .status(201)
      .location(`/api/clients/${result.data.insertId}`)
      .json({
        success: true,
        message: 'Cliente creado correctamente',
        data: created.data[0],
      });
  } catch (error) {
    console.error('Error en POST /api/clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
});

/**
 * PUT /api/clients/:id
 * Actualizar cliente (update completo con validaciones).
 */
router.put('/:id', Client.getValidationRules(), async (req, res) => {
  try {
    const clientId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(clientId) || clientId <= 0) {
      return res.status(400).json({ success: false, message: 'ID de cliente inválido' });
    }

    // 1) Validación
    const validation = Client.checkValidation(req);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validación fallida',
        errors: validation.errors,
      });
    }

    // 2) Verificar existencia
    const existing = await Client.getById(clientId);
    if (!existing.success) {
      return res.status(500).json({
        success: false,
        message: 'Error verificando cliente',
        error: existing.error || existing.message,
      });
    }
    if (existing.data.length === 0 || existing.data[0].is_active === false) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    // 3) Whitelist + sanitizado
    let payload = pickAllowed(req.body);
    payload = sanitizePayload(payload);

    // 4) Si cambia el client_code, verificar unicidad
    if (payload.client_code) {
      const codeCheck = await Client.getByCode(payload.client_code);
      if (codeCheck.success && codeCheck.data.length > 0) {
        const other = codeCheck.data[0];
        if (other.client_id !== clientId) {
          return res.status(409).json({ success: false, message: 'El client_code ya existe' });
        }
      }
    }

    // 5) Actualizar
    const result = await Client.update(clientId, payload);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar el cliente',
        error: result.error || result.message,
      });
    }

    // 6) Devolver actualizado
    const updated = await Client.getById(clientId);
    res.json({
      success: true,
      message: 'Cliente actualizado correctamente',
      data: updated.data[0],
    });
  } catch (error) {
    console.error('Error en PUT /api/clients/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/clients/:id
 * Borrado lógico 
 */
router.delete('/:id', async (req, res) => {
  try {
    const clientId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(clientId) || clientId <= 0) {
      return res.status(400).json({ success: false, message: 'ID de cliente inválido' });
    }

    // Verificar existencia (y que esté activo)
    const existing = await Client.getById(clientId);
    if (!existing.success) {
      return res.status(500).json({
        success: false,
        message: 'Error verificando cliente',
        error: existing.error || existing.message,
      });
    }
    if (existing.data.length === 0 || existing.data[0].is_active === false) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    
    const result = await Client.delete(clientId);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar el cliente',
        error: result.error || result.message,
      });
    }

    res.json({ success: true, message: 'Cliente eliminado correctamente (soft delete)' });
  } catch (error) {
    console.error('Error en DELETE /api/clients/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
    });
  }
});

module.exports = router;
