const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const backupDatabase = () => {
  const date = new Date().toISOString().split('T')[0];
  const backupDir = path.join(__dirname, '../backups');
  
  // Crear directorio de backups si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupFile = path.join(backupDir, `boostpro-backup-${date}.gz`);
  
  const command = `mongodump --uri="${process.env.MONGODB_URI}" --archive="${backupFile}" --gzip`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error haciendo backup:', error);
      return;
    }
    
    console.log('✅ Backup completado:', backupFile);
    console.log('📊 Tamaño del backup:', fs.statSync(backupFile).size, 'bytes');
    
    // Limpiar backups antiguos (mantener solo últimos 7 días)
    cleanupOldBackups(backupDir);
  });
};

const cleanupOldBackups = (backupDir) => {
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  files.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stat = fs.statSync(filePath);
    
    if (now - stat.mtimeMs > sevenDays) {
      fs.unlinkSync(filePath);
      console.log('🗑️  Backup eliminado:', file);
    }
  });
};

// Ejecutar backup si es llamado directamente
if (require.main === module) {
  backupDatabase();
}

module.exports = backupDatabase;