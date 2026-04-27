const nodemailer = require('nodemailer');

// Configuración del transporter (usando Gmail como ejemplo)
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Plantillas de email
const emailTemplates = {
  orderConfirmation: (order) => ({
    subject: `Confirmación de Orden #${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Gracias por tu orden!</h2>
        <p>Tu orden ha sido recibida y está siendo procesada.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalles de la Orden:</h3>
          <p><strong>Número de Orden:</strong> ${order.orderNumber}</p>
          <p><strong>Servicio:</strong> ${order.service.name}</p>
          <p><strong>Total:</strong> $${order.totalPrice}</p>
          <p><strong>Estado:</strong> ${order.status}</p>
        </div>
        
        <p>Puedes seguir el progreso de tu orden en tu panel de usuario.</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Si tienes alguna pregunta, contáctanos en soporte@boostpro.com
        </p>
      </div>
    `
  }),

  orderStatusUpdate: (order, newStatus) => ({
    subject: `Actualización de Orden #${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Actualización de tu Orden</h2>
        <p>El estado de tu orden ha cambiado a: <strong>${newStatus}</strong></p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalles:</h3>
          <p><strong>Orden #:</strong> ${order.orderNumber}</p>
          <p><strong>Servicio:</strong> ${order.service.name}</p>
          <p><strong>Nuevo Estado:</strong> ${newStatus}</p>
        </div>
        
        <p>Visita tu panel para más detalles.</p>
      </div>
    `
  }),

  boosterAssigned: (order, booster) => ({
    subject: `Booster Asignado - Orden #${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Tu booster ha sido asignado!</h2>
        <p><strong>Booster:</strong> ${booster.username}</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalles de la Orden:</h3>
          <p><strong>Orden #:</strong> ${order.orderNumber}</p>
          <p><strong>Servicio:</strong> ${order.service.name}</p>
          <p><strong>Rating del Booster:</strong> ${booster.rating}/5</p>
        </div>
        
        <p>Puedes contactar a tu booster a través del panel de la orden.</p>
      </div>
    `
  })
};

// Función para enviar emails
const sendEmail = async (to, template, data) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      console.log('Email simulation:', { to, template: template.subject });
      return true;
    }

    const transporter = createTransporter();
    const emailContent = emailTemplates[template](data);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  emailTemplates
};