// createAdminUser.js - Versión SEGURA
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// ✅ SEGURO - Solo variable de entorno, SIN credenciales hardcodeadas
const MONGODB_URI = process.env.MONGODB_URI;

// Validar que la variable de entorno exista
if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI no está definida en las variables de entorno');
  console.log('💡 Solución: Crea un archivo .env con MONGODB_URI=tu_conexion_mongodb');
  process.exit(1);
}

const createAdminUser = async () => {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Verificar si ya existe un usuario admin
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@boostpro.com' },
        { username: 'admin' },
        { role: 'admin' }
      ]
    });
    
    if (existingAdmin) {
      console.log('ℹ️  Usuario admin ya existe:');
      console.log(`   📧 Email: ${existingAdmin.email}`);
      console.log(`   👤 Username: ${existingAdmin.username}`);
      console.log(`   🎯 Role: ${existingAdmin.role}`);
      console.log(`   🆔 ID: ${existingAdmin._id}`);
      return;
    }
    
    // Crear usuario admin
    const adminUser = new User({
      username: 'admin',
      email: 'admin@boostpro.com',
      password: 'Admin123!',
      role: 'admin',
      balance: 1000,
      isVerified: true,
      profile: {
        firstName: 'Administrator',
        lastName: 'System'
      }
    });
    
    await adminUser.save();
    console.log('🎉 USUARIO ADMIN CREADO EXITOSAMENTE');
    console.log('══════════════════════════════════════');
    console.log('📧 Email: admin@boostpro.com');
    console.log('🔑 Password: Admin123!');
    console.log('👤 Username: admin');
    console.log('🎯 Role: admin');
    console.log('💰 Balance: $1000');
    console.log('══════════════════════════════════════');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('🔒 Esta contraseña es solo para desarrollo');
    
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error);
    if (error.code === 11000) {
      console.log('💡 El email o username ya está en uso');
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
};

createAdminUser();