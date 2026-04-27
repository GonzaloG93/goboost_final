import mongoose from 'mongoose';
import BoostService from '../models/BoostService.js';

const MONGODB_URI = 'mongodb+srv://gonzalo_db_admin:zjzyPlrchnG6JaCi@cluster0.etrf7vr.mongodb.net/boost-services?retryWrites=true&w=majority&appName=Cluster0';

const checkServices = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Conectado a MongoDB');
    
    const services = await BoostService.find();
    console.log(`📋 Total de servicios en BD: ${services.length}`);
    
    if (services.length > 0) {
      console.log('\n🔍 Servicios encontrados:');
      services.forEach(service => {
        console.log(`\n🎮 ${service.name}`);
        console.log(`   ID: ${service._id}`);
        console.log(`   Juego: ${service.game}`);
        console.log(`   Precio: $${service.basePrice}`);
        console.log(`   Disponible: ${service.available}`);
      });
    } else {
      console.log('❌ No hay servicios en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

checkServices();