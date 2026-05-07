const googleCalendarService = require('../services/googleCalendarService');

/**
 * Inicia el flujo de autorización de Google Calendar.
 * Genera una URL de autenticación y la devuelve para que el frontend redirija al usuario.
 */
exports.authorize = async (req, res, next) => {
  try {
    // Asumimos que el professionalId viene del usuario autenticado
    const professionalId = req.user.professionalId;
    if (!professionalId) {
      return res.status(400).json({ message: 'El usuario no es un profesional válido.' });
    }
    const authUrl = await googleCalendarService.generateAuthUrl(professionalId.toString());
    res.json({ authUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para el callback de OAuth2 de Google.
 * Recibe el código y el estado, y los usa para obtener y guardar los tokens.
 */
exports.oauth2callback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).json({ message: 'Faltan el código o el estado en la solicitud.' });
    }
    const professionalId = state; // Recuperamos el ID del profesional del 'state'
    await googleCalendarService.getAndSaveTokens(code, professionalId);
    
    // Redirigir al usuario a una página de éxito en el frontend
    // o simplemente mostrar un mensaje de éxito.
    res.send('¡Integración con Google Calendar completada exitosamente! Ya puedes cerrar esta ventana.');
  } catch (error) {
    next(error);
  }
}; 