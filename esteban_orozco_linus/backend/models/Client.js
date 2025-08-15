// Propósito: Encapsular reglas de negocio
// de clientes (validar, sanitizar y ejecutar SQL).

const { executeQuery } = require('../config/database');
const { body, validationResult } = require('express-validator');
// Usa helpers BD y el validador.

class Client {
  // --- Utilidades internas ---

  
  static sanitizeAndNormalize(input = {}) {
    const out = { ...input };

    // Asegurar tipos string → trim y '' -> null
    for (const k of Object.keys(out)) {
      if (typeof out[k] === 'string') {
        const v = out[k].trim();
        out[k] = v === '' ? null : v;
      }
    }

    // client_code a MAYÚSCULAS 
    if (typeof out.client_code === 'string') {
      out.client_code = out.client_code.toUpperCase();
    }

    return out;
  }
    // Sanitización defensiva: recorta espacios, y string vacío → null (evita “cadenas vacías” en DB).
    //Racional: normalizar antes de validar/insertar.
    //static mapRow(dbRow){ ... } para transformar nombres/formatos si aplica.

  // --- Consultas ---

  /**
   * Obtener todos los clientes activos 
   */
  static async getAll() {
    const query = `
      SELECT
        client_id,
        client_code,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        department,
        is_active,
        created_at,
        updated_at
      FROM clients
      WHERE is_active = TRUE
      ORDER BY created_at DESC
    `;
    return await executeQuery(query);
  }

  /** Validacion
   * Obtener un cliente por ID 
   */
  static async getById(clientId) {
    const query = `
      SELECT
        client_id,
        client_code,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        department,
        is_active,
        created_at,
        updated_at
      FROM clients
      WHERE client_id = ? AND is_active = TRUE
    `;
    return await executeQuery(query, [clientId]);
  }

  /**
   * Obtener un cliente por código
   */
  static async getByCode(clientCode) {
    const query = `
      SELECT
        client_id,
        client_code,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        department,
        is_active,
        created_at,
        updated_at
      FROM clients
      WHERE client_code = ?
    `;
    return await executeQuery(query, [clientCode]);
  }

  /**
   * Crear cliente.
   */
  static async create(clientData) {
    const data = Client.sanitizeAndNormalize(clientData);

    const query = `
      INSERT INTO clients (
        client_code,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        department
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.client_code,
      data.first_name,
      data.last_name,
      data.email,
      data.phone,
      data.address,
      data.city,
      data.department,
    ];
    return await executeQuery(query, params);
  }

  /**
   * Actualizar 
   */
  static async update(clientId, clientData) {
    const data = Client.sanitizeAndNormalize(clientData);

    const query = `
      UPDATE clients SET
        client_code = ?,
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        address = ?,
        city = ?,
        department = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE client_id = ? AND is_active = TRUE
    `;
    const params = [
      data.client_code,
      data.first_name,
      data.last_name,
      data.email,
      data.phone,
      data.address,
      data.city,
      data.department,
      clientId,
    ];
    return await executeQuery(query, params);
  }

  /**
   * Borrado lógico 
   */
  static async delete(clientId) {
    const query = `
      UPDATE clients SET
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE client_id = ? AND is_active = TRUE
    `;
    return await executeQuery(query, [clientId]);
  }

  // --- Validaciones ---

  /*
   */
  static getValidationRules() {
    return [
      body('client_code')
        .exists().withMessage('Client code is required')
        .bail()
        .isString().withMessage('Client code must be a string')
        .bail()
        .trim()
        // sanitiza a UPPERCASE antes de validar el regex
        .customSanitizer((v) => (typeof v === 'string' ? v.toUpperCase() : v))
        .isLength({ min: 3, max: 20 }).withMessage('Client code must be between 3 and 20 characters')
        .matches(/^[A-Z0-9]+$/).withMessage('Client code must contain only uppercase letters and numbers'),

      body('first_name')
        .exists().withMessage('First name is required')
        .bail()
        .isString().withMessage('First name must be a string')
        .bail()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('First name must be between 2 and 100 characters')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('First name must contain only letters and spaces'),

      body('last_name')
        .exists().withMessage('Last name is required')
        .bail()
        .isString().withMessage('Last name must be a string')
        .bail()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Last name must be between 2 and 100 characters')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Last name must contain only letters and spaces'),

      body('email')
        .optional({ nullable: true })
        .trim()
        .isEmail().withMessage('Email must be a valid email address')
        .normalizeEmail(),

      body('phone')
        .optional({ nullable: true })
        .trim()
        .matches(/^[0-9+\-\s()]+$/).withMessage('Phone number must contain only numbers, spaces, hyphens, and parentheses'),

      body('address')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 250 }).withMessage('Address must not exceed 250 characters'),

      body('city')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),

      body('department')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 100 }).withMessage('Department must not exceed 100 characters'),
    ];
  }

  /**
   * Procesar resultados de validación.
   */
  static checkValidation(req) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return {
        success: false,
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      };
    }
    return { success: true };
  }
}

module.exports = Client;

