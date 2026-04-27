// Script de inicialización de MongoDB para Docker
db.createUser({
  user: 'admin',
  pwd: 'password',
  roles: [
    {
      role: 'readWrite',
      db: 'boost-services'
    }
  ]
});

// Crear índices iniciales
db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.boostservices.createIndex({ game: 1, serviceType: 1 });