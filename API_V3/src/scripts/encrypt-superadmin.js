// encrypt-superadmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function encryptSuperAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const username = "vmontoyar";
    const plainPassword = "19634739@Amorr"; // La contraseña actual en texto plano
    
    // Generar el hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    // Actualizar el usuario
    const result = await mongoose.connection.db.collection('users').updateOne(
      { username },
      { $set: { password: hashedPassword } }
    );
    
    console.log(`Contraseña actualizada para ${username}:`, result.modifiedCount === 1 ? 'Éxito' : 'No modificado');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

encryptSuperAdminPassword();