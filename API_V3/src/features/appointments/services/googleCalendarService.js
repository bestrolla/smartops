const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
const Professional = require('../../professionals/models/Professional.model');
const User = require('../../../core/auth/users/models/user.model'); // Para obtener el email del cliente

// --- Configuración ---
const CREDENTIALS_PATH = path.join(__dirname, '../../../config/secrets/google_credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

/**
 * Crea y configura un cliente OAuth2.
 * @returns {Promise<google.auth.OAuth2>}
 */
const getOAuth2Client = async () => {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.web;
    return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  } catch (error) {
    console.error('Error reading Google credentials:', error);
    throw new Error('Missing or invalid google_credentials.json file.');
  }
};

/**
 * Obtiene un cliente OAuth2 autorizado para un profesional específico.
 * Carga los tokens desde la BD y los establece en el cliente.
 * @param {string} professionalId
 * @returns {Promise<google.auth.OAuth2>}
 */
const getAuthorizedClientForProfessional = async (professionalId) => {
  const professional = await Professional.findById(professionalId);
  if (!professional || !professional.googleCalendar.isLinked || !professional.googleCalendar.tokens) {
    throw new Error('Este profesional no ha vinculado su cuenta de Google Calendar.');
  }

  const oAuth2Client = await getOAuth2Client();
  oAuth2Client.setCredentials(professional.googleCalendar.tokens);

  // Escuchar por si el token se refresca, para guardarlo
  oAuth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // Si obtenemos un nuevo refresh_token, lo guardamos.
      professional.googleCalendar.tokens.refresh_token = tokens.refresh_token;
    }
    professional.googleCalendar.tokens.access_token = tokens.access_token;
    professional.googleCalendar.tokens.expiry_date = tokens.expiry_date;
    professional.save().catch(err => console.error('Failed to save refreshed token:', err));
  });

  return oAuth2Client;
};

/**
 * Genera la URL de autenticación para que un profesional la visite.
 * Incluimos el ID del profesional en el `state` para saber quién está iniciando el proceso.
 * @param {string} professionalId - El ID del profesional que se está autenticando.
 * @returns {Promise<string>}
 */
exports.generateAuthUrl = async (professionalId) => {
  const oAuth2Client = await getOAuth2Client();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline', // Necesario para obtener un refresh_token
    prompt: 'consent', // Muestra la pantalla de consentimiento siempre
    scope: SCOPES,
    state: professionalId // Pasamos el ID del profesional para identificarlo en el callback
  });
};

/**
 * Obtiene los tokens a partir del código de autorización y los guarda en el profesional.
 * @param {string} code - El código de autorización devuelto por Google.
 * @param {string} professionalId - El ID del profesional (recuperado del 'state').
 * @returns {Promise<void>}
 */
exports.getAndSaveTokens = async (code, professionalId) => {
  const oAuth2Client = await getOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  
  await Professional.findByIdAndUpdate(professionalId, {
    'googleCalendar.tokens': tokens,
    'googleCalendar.isLinked': true
  });
};

/**
 * Crea un evento en el calendario de un profesional.
 * @param {string} professionalId - El ID del profesional.
 * @param {Appointment} appointment - La cita de nuestro sistema.
 * @returns {Promise<string|null>} El ID del evento de Google creado.
 */
exports.createEvent = async (professionalId, appointment) => {
  try {
    const auth = await getAuthorizedClientForProfessional(professionalId);
    const calendar = google.calendar({ version: 'v3', auth });
    
    const client = await User.findById(appointment.userId);

    const event = {
      summary: `Cita con ${client ? client.firstName : 'Cliente'}`,
      description: `Cita agendada a través de SmartOps. Notas: ${appointment.notes || ''}`,
      start: {
        dateTime: appointment.start.toISOString(),
        timeZone: 'America/Caracas', // Esto debería ser configurable por tenant/profesional
      },
      end: {
        dateTime: appointment.end.toISOString(),
        timeZone: 'America/Caracas',
      },
      attendees: [
        { email: client.email } // Invitar al cliente
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 30 }, // 30 mins antes
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.data.id;
  } catch (error) {
    console.error('Error al crear evento en Google Calendar:', error.message);
    // No lanzar error para no romper el flujo principal de creación de cita
    return null; 
  }
};

/**
 * Elimina un evento del calendario de un profesional.
 * @param {string} professionalId - El ID del profesional.
 * @param {string} googleEventId - El ID del evento de Google a eliminar.
 */
exports.deleteEvent = async (professionalId, googleEventId) => {
  if (!googleEventId) return;

  try {
    const auth = await getAuthorizedClientForProfessional(professionalId);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });
    console.log(`Evento de Google ${googleEventId} eliminado.`);
  } catch (error) {
    console.error('Error al eliminar evento en Google Calendar:', error.message);
    // No lanzar error para no romper el flujo de cancelación
  }
}; 