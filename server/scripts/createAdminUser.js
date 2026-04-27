import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/User.js';

// ================= CONFIG ENV =================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 cargar /server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'boost-services';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no definida');
  process.exit(1);
}

// ================= DATA ADMIN =================
const adminUser = {
  username: 'Administrador',
  name: 'Administrador',
  email: 'xxxx',
  password: 'xxx',
  role: 'admin',
  isActive: true,
  balance: 0,
  rating: 0,
  completedOrders: 0,
  games: []
};

// ================= SCRIPT =================
const createAdmin = async () => {
  try {
    console.log('🔄 Conectando a MongoDB...');

    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });

    console.log('✅ Conectado a MongoDB');
    console.log('📦 DB conectada:', mongoose.connection.name);

    // Buscar si ya existe
    const existingUser = await User.findOne({
      $or: [
        { email: adminUser.email },
        { username: adminUser.username }
      ]
    });

    if (existingUser) {
      console.log('⚠️ Usuario ya existe');

      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log('✅ Usuario actualizado a admin');
      } else {
        console.log('ℹ️ Ya es admin');
      }

    } else {
      const newAdmin = new User(adminUser);
      await newAdmin.save();

      console.log('✅ Admin creado');
      console.log(`📧 Email: ${adminUser.email}`);
      console.log(`👤 Username: ${adminUser.username}`);
    }

    // Listar admins
    const admins = await User.find({ role: 'admin' })
      .select('username email name');

    console.log('\n📋 ADMINS:');
    admins.forEach(a => {
      console.log(`- ${a.username} (${a.email})`);
    });

    console.log(`\n📊 Total: ${admins.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.code === 11000) {
      console.error('⚠️ Duplicado (email o username)');
    }

  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
};

createAdmin();