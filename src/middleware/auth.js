/**
 * Middleware de Autenticación para Bookwise
 */

/**
 * Verifica que la petición incluya el secreto de API correcto en los headers.
 * Se usa para endpoints administrativos como la carga masiva de libros.
 */
export const adminAuth = (req, res, next) => {
    const apiSecret = req.headers['x-api-secret'];
    const expectedSecret = process.env.API_SECRET;

    // Si no hay secreto configurado en el servidor, bloqueamos por seguridad
    if (!expectedSecret || expectedSecret === 'tu_secreto_local_aqui') {
        console.error('❌ ERROR DE SEGURIDAD: API_SECRET no configurado o es el valor por defecto.');
        return res.status(500).json({ error: 'Error interno: Servidor no asegurado correctamente.' });
    }

    if (!apiSecret || apiSecret !== expectedSecret) {
        console.warn(`⚠️ Intento de acceso no autorizado a: ${req.originalUrl} desde ${req.ip}`);
        return res.status(401).json({ error: 'No autorizado: Secreto de API inválido o faltante.' });
    }

    next();
};

/**
 * Placeholder para autenticación de usuario vía Supabase
 * (Se puede expandir para proteger recomendaciones privadas)
 */
export const userAuth = (req, res, next) => {
    // Por ahora permitimos todo, pero aquí iría la lógica de verificar el token de Supabase
    next();
};
