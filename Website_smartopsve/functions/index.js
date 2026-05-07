const functions = require('firebase-functions');
const fetch = require('node-fetch');

exports.getTenantProfile = functions.https.onRequest(async (req, res) => {
  // Obtener el slug de la URL
  const slug = req.path.split('/')[1];
  
  if (!slug) {
    res.redirect('/');
    return;
  }
  
  try {
    // Llamar a tu API para obtener los datos del perfil
    const apiUrl = process.env.API_URL || 'https://api.smartopsve.com';
    const response = await fetch(`${apiUrl}/public/tenant/${slug}`);
    
    if (!response.ok) {
      res.status(404).sendFile('404.html', { root: './public' });
      return;
    }
    
    const profileData = await response.json();
    
    // Renderizar la página con los datos del perfil
    // Aquí puedes usar un template o enviar los datos como JSON
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${profileData.data.name || 'Perfil'}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          <div id="profile-data" data-profile='${JSON.stringify(profileData.data)}'></div>
          <script src="/tenant-profile.js"></script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error interno del servidor');
  }
});