import Transaction from '../models/Transaction.js';
import Order from '../models/Order.js'; // Necesario para buscar y actualizar la orden

// @desc    Obtener transacciones del usuario autenticado con filtros y paginación
// @route   GET /api/transactions
export const getUserTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    
    // Filtro inicial limitando al usuario autenticado
    const query = { user: req.user._id };
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('metadata.order', 'orderNumber totalPrice');

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transactions,
      message: 'Transacciones obtenidas correctamente'
    });
  } catch (error) {
    console.error('Error al obtener transacciones del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones del usuario',
      error: error.message
    });
  }
};

// @desc    Obtener el balance actual del usuario e historial resumido
// @route   GET /api/transactions/balance
export const getBalance = async (req, res) => {
  try {
    // Calculamos los totales según las transacciones completadas del usuario
    const balanceStats = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalDeposits: {
            $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] }
          },
          totalWithdrawals: {
            $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] }
          },
          totalPayments: {
            $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] }
          }
        }
      }
    ]);

    const stats = balanceStats[0] || { totalDeposits: 0, totalWithdrawals: 0, totalPayments: 0 };
    const calculatedBalance = stats.totalDeposits - stats.totalWithdrawals - stats.totalPayments;

    res.json({
      success: true,
      data: {
        balance: req.user.balance !== undefined ? req.user.balance : calculatedBalance,
        stats
      },
      message: 'Balance obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener balance',
      error: error.message
    });
  }
};

// @desc    Crear una nueva transacción
// @route   POST /api/transactions
export const createTransaction = async (req, res) => {
  try {
    const { amount, type, description, metadata } = req.body;

    const transaction = await Transaction.create({
      user: req.user._id,
      amount,
      type,
      description,
      metadata,
      status: req.body.status || 'pending'
    });

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transacción creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear transacción:', error);
    res.status(400).json({
      success: false,
      message: 'Error al crear la transacción',
      error: error.message
    });
  }
};

// @desc    Actualizar estado de una transacción
// @route   PUT /api/transactions/:id/status
export const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    // Verificar pertenencia o rol de admin
    if (transaction.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta transacción'
      });
    }

    transaction.status = status;
    await transaction.save();

    res.json({
      success: true,
      data: transaction,
      message: 'Estado de la transacción actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar transacción:', error);
    res.status(400).json({
      success: false,
      message: 'Error al actualizar la transacción',
      error: error.message
    });
  }
};

// @desc    Procesar Webhook de Ko-fi (Verifica pago, actualiza Orden y crea Transacción)
// @route   POST /api/transactions/webhooks/kofi
export const kofiWebhook = async (req, res) => {
  try {
    if (!req.body.data) {
      return res.status(400).send('No data received');
    }

    const paymentData = JSON.parse(req.body.data);

    const KOFI_TOKEN = process.env.KOFI_VERIFICATION_TOKEN;
    if (paymentData.verification_token !== KOFI_TOKEN) {
      return res.status(401).send('Unauthorized');
    }

    const message = paymentData.message || '';
    const matchOrder = message.match(/(ORD-[0-9]+-[0-9A-Z]+)/i); 

    if (matchOrder) {
      const orderNumber = matchOrder[1];
      const order = await Order.findOne({ orderNumber });

      if (order) {
        // 1. Actualizamos la orden
        order.status = 'paid'; 
        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        order.paymentProviderId = paymentData.kofi_transaction_id;
        order.paymentDetails = paymentData;

        if (typeof order.addNote === 'function') {
          await order.addNote(`Pago recibido vía Ko-fi por $${paymentData.amount}`, 'system');
        }
        await order.save();

        // 2. Creamos la transacción automática en el historial del usuario
        await Transaction.create({
          user: order.user, 
          amount: parseFloat(paymentData.amount),
          type: 'payment',
          description: `Pago de orden ${orderNumber} vía Ko-fi`,
          metadata: { 
            order: order._id,
            kofi_transaction_id: paymentData.kofi_transaction_id,
            kofi_url: paymentData.url
          },
          status: 'completed'
        });

        console.log(`✅ Orden ${orderNumber} pagada y transacción generada vía Ko-fi.`);
      }
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('❌ Error processing Ko-fi webhook:', error);
    res.status(500).send('Server Error');
  }
};

// @desc    Notificar que el usuario ha realizado el pago manualmente
// @route   POST /api/transactions/orders/:id/notify-payment
export const notifyManualPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = 'pending_verification';
    order.status = 'awaiting_payment_confirmation';
    
    if (typeof order.addNote === 'function') {
      await order.addNote('El usuario ha notificado que realizó el pago manualmente.', 'system');
    }
    
    await order.save();

    res.json({ success: true, message: 'Payment notification received' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};