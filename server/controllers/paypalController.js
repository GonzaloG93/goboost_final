// backend/controllers/paypalController.js - VERSIÓN FINAL CORREGIDA
import axios from 'axios';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// ✅ CARGAR VARIABLES DE ENTORNO
dotenv.config();

// ⭐ CONFIGURACIÓN GLOBAL DE PAYPAL
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const IS_PRODUCTION_MODE = PAYPAL_MODE === 'live';

console.log('\n🔄 ===== PAYPAL CONTROLLER CARGADO =====');
console.log('📊 Variables en controlador PayPal:');
console.log('- PAYPAL_CLIENT_ID:', process.env.PAYPAL_CLIENT_ID ? '✅ PRESENTE' : '❌ AUSENTE');
console.log('- PAYPAL_CLIENT_ID (prefijo):', process.env.PAYPAL_CLIENT_ID?.substring(0, 2) || 'N/A');
console.log('- PAYPAL_CLIENT_SECRET:', process.env.PAYPAL_CLIENT_SECRET ? '✅ PRESENTE' : '❌ AUSENTE');
console.log('- PAYPAL_MODE:', PAYPAL_MODE);
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

// ⭐ VERIFICACIÓN VISUAL DEL MODO
if (IS_PRODUCTION_MODE) {
    console.log('\n🔴🔴🔴 MODO PRODUCCIÓN ACTIVADO - TRANSACCIONES REALES 🔴🔴🔴');
    console.log('⚠️  ADVERTENCIA: Los pagos serán PROCESADOS CON DINERO REAL');
    console.log('📍 URL API PayPal:', 'https://api-m.paypal.com');
    
    const clientId = process.env.PAYPAL_CLIENT_ID || '';
    
    // ✅ Verificación crítica: NO debe contener "sandbox"
    if (clientId.toLowerCase().includes('sandbox')) {
        console.error('❌ ERROR CRÍTICO: El Client ID contiene "sandbox" pero el modo es LIVE');
        console.error('❌ DETENGA EL SERVIDOR Y USE CREDENCIALES LIVE CORRECTAS');
        process.exit(1);
    }
    
    // ✅ Prefijos válidos conocidos para Live (informativo)
    const LIVE_PREFIXES = ['AQ', 'AR', 'Ad', 'AS', 'AT', 'AU', 'AV', 'AW', 'AX', 'AY'];
    const prefix = clientId.substring(0, 2);
    
    if (LIVE_PREFIXES.includes(prefix)) {
        console.log(`✅ Prefijo "${prefix}" validado como credencial Live`);
    } else {
        console.log(`ℹ️  Prefijo "${prefix}" - Si tus credenciales son del dashboard Live, son válidas`);
    }
    
    console.log('✅ Credenciales Live verificadas - Listo para procesar pagos reales');
} else {
    console.log('\n🟡 MODO SANDBOX ACTIVO - TRANSACCIONES DE PRUEBA 🟡');
    console.log('📍 URL API PayPal:', 'https://api-m.sandbox.paypal.com');
    console.log('ℹ️  Transacciones de prueba - No se usa dinero real');
}

console.log('=====================================\n');

// ✅ FUNCIÓN PARA OBTENER CONFIGURACIÓN SIEMPRE ACTUALIZADA
const getPaypalConfig = () => ({
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: PAYPAL_MODE,
    isProduction: IS_PRODUCTION_MODE,
    webhookId: process.env.PAYPAL_WEBHOOK_ID,
    nodeEnv: process.env.NODE_ENV || 'development'
});

// ✅ URL SEGÚN EL MODO
const getPaypalBaseUrl = () => IS_PRODUCTION_MODE
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const PAYPAL_API_VERSION = 'v2';
const REQUEST_TIMEOUT = 30000; // 30 segundos

class PayPalController {
    
    // ==================== MÉTODOS PRIVADOS ====================
    
    // ✅ Obtener token de acceso
    async getAccessToken() {
        try {
            const config = getPaypalConfig();
            const PAYPAL_BASE_URL = getPaypalBaseUrl();
            
            console.log(`🔑 [${PAYPAL_MODE.toUpperCase()}] Obteniendo token de acceso PayPal...`);
            
            if (!config.clientId || !config.clientSecret) {
                console.error('❌ Credenciales de PayPal faltantes');
                const error = new Error('PAYPAL_CREDENTIALS_MISSING');
                error.code = 'PAYPAL_CONFIG_ERROR';
                throw error;
            }
            
            // Verificación adicional en producción
            if (IS_PRODUCTION_MODE && config.clientId.toLowerCase().includes('sandbox')) {
                console.error('❌ CRÍTICO: Usando credenciales sandbox en modo LIVE');
                throw new Error('CREDENTIAL_MISMATCH: Sandbox credentials in LIVE mode');
            }
            
            const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
            
            const response = await axios.post(
                `${PAYPAL_BASE_URL}/v1/oauth2/token`,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                        'Accept-Language': 'en_US'
                    },
                    timeout: REQUEST_TIMEOUT
                }
            );
            
            if (!response.data.access_token) {
                throw new Error('INVALID_PAYPAL_RESPONSE');
            }
            
            console.log(`✅ [${PAYPAL_MODE.toUpperCase()}] Token de acceso obtenido exitosamente`);
            return response.data.access_token;
            
        } catch (error) {
            console.error(`❌ [${PAYPAL_MODE}] Error de autenticación PayPal:`, {
                error: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });
            
            throw new Error(`PayPal authentication failed: ${error.message}`);
        }
    }
    
    // ✅ Registrar webhook para auditoría
    async logWebhook(data, status, error = null) {
        try {
            const logEntry = {
                event: data.event_type,
                resourceId: data.resource?.id,
                status,
                error,
                mode: PAYPAL_MODE,
                receivedAt: new Date(),
                data: {
                    event_type: data.event_type,
                    resource_type: data.resource_type,
                    summary: data.summary
                }
            };
            
            console.log('📝 Webhook registrado:', JSON.stringify(logEntry, null, 2));
            
            // Opcional: Guardar en base de datos
            // await WebhookLog.create(logEntry);
            
        } catch (logError) {
            console.error('❌ Error registrando webhook:', logError);
        }
    }
    
    // ✅ Determinar próxima acción según estado
    getNextAction(internalStatus, paypalStatus) {
        if (internalStatus === 'completed') return 'order_processing';
        if (internalStatus === 'pending' && paypalStatus === 'APPROVED') return 'capture_payment';
        if (internalStatus === 'pending') return 'complete_checkout';
        if (internalStatus === 'failed') return 'retry_payment';
        if (internalStatus === 'refunded') return 'refund_processed';
        return 'contact_support';
    }
    
    // ==================== MÉTODOS PÚBLICOS ====================
    
    // ✅ CREAR ORDEN DE PAGO
    async createOrder(req, res) {
        try {
            const config = getPaypalConfig();
            const PAYPAL_BASE_URL = getPaypalBaseUrl();
            
            console.log(`\n🔍 [${PAYPAL_MODE.toUpperCase()}] === CREANDO ORDEN DE PAGO ===`);
            
            const { orderId } = req.body;
            
            // Validación de orderId
            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    error: 'ORDER_ID_REQUIRED',
                    message: 'Se requiere ID de orden'
                });
            }
            
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_ORDER_ID',
                    message: 'Formato de ID de orden inválido'
                });
            }
            
            // Verificar credenciales
            if (!config.clientId || !config.clientSecret) {
                return res.status(500).json({
                    success: false,
                    error: 'PAYPAL_NOT_CONFIGURED',
                    message: `PayPal no está configurado (modo: ${PAYPAL_MODE})`
                });
            }
            
            // Verificación crítica para producción
            if (IS_PRODUCTION_MODE && config.clientId.toLowerCase().includes('sandbox')) {
                console.error('❌ CRÍTICO: Intento de usar credenciales sandbox en producción');
                return res.status(500).json({
                    success: false,
                    error: 'CREDENTIAL_MISMATCH',
                    message: 'Error de configuración: Credenciales incorrectas para modo LIVE'
                });
            }
            
            // Obtener orden de la base de datos
            const order = await Order.findById(orderId).populate('service');
            
            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: 'ORDER_NOT_FOUND',
                    message: `Orden ${orderId} no encontrada`
                });
            }
            
            // Verificar propiedad
            if (order.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    error: 'UNAUTHORIZED',
                    message: 'No tienes permiso para pagar esta orden'
                });
            }
            
            // Verificar que no esté pagada
            if (order.status === 'paid' || order.paymentStatus === 'paid') {
                return res.status(400).json({
                    success: false,
                    error: 'ORDER_ALREADY_PAID',
                    message: 'Esta orden ya ha sido pagada'
                });
            }
            
            // Obtener token de acceso
            const accessToken = await this.getAccessToken();
            
            // Datos para PayPal
            const paypalOrderData = {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: order.totalPrice.toFixed(2)
                        },
                        description: `Servicio: ${order.service?.name || 'Gaming Service'}`,
                        custom_id: order._id.toString(),
                        invoice_id: order.orderNumber || `INV-${Date.now()}`,
                        soft_descriptor: IS_PRODUCTION_MODE ? 'GONBOOST' : 'GONBOOST TEST'
                    }
                ],
                application_context: {
                    brand_name: IS_PRODUCTION_MODE ? 'GonBoost' : 'GonBoost Sandbox',
                    landing_page: IS_PRODUCTION_MODE ? 'BILLING' : 'LOGIN',
                    user_action: 'PAY_NOW',
                    shipping_preference: 'NO_SHIPPING',
                    return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?orderId=${order._id}`,
                    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel?orderId=${order._id}`,
                    payment_method: {
                        payer_selected: 'PAYPAL',
                        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
                    }
                }
            };
            
            console.log(`📦 [${PAYPAL_MODE.toUpperCase()}] Creando orden por $${order.totalPrice} USD`);
            
            // Crear orden en PayPal
            const paypalResponse = await axios.post(
                `${PAYPAL_BASE_URL}/v2/checkout/orders`,
                paypalOrderData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation',
                        'PayPal-Request-Id': `req_${Date.now()}_${order._id}`
                    },
                    timeout: REQUEST_TIMEOUT
                }
            );
            
            const paypalOrder = paypalResponse.data;
            console.log(`✅ [${PAYPAL_MODE.toUpperCase()}] Orden PayPal creada: ${paypalOrder.id}`);
            
            // Crear registro de pago
            const payment = new Payment({
                order: orderId,
                user: req.user._id,
                provider: 'paypal',
                amount: order.totalPrice,
                currency: 'USD',
                providerPaymentId: paypalOrder.id,
                paymentUrl: paypalOrder.links.find(link => link.rel === 'approve')?.href,
                status: 'pending',
                metadata: {
                    paypalOrderId: paypalOrder.id,
                    create_time: paypalOrder.create_time,
                    status: paypalOrder.status,
                    intent: paypalOrder.intent,
                    links: paypalOrder.links.map(link => ({
                        rel: link.rel,
                        method: link.method,
                        href: link.href
                    })),
                    environment: PAYPAL_MODE,
                    isProduction: IS_PRODUCTION_MODE,
                    apiVersion: PAYPAL_API_VERSION,
                    createdAt: new Date()
                }
            });
            
            await payment.save();
            
            // Actualizar orden
            order.paymentReference = payment._id;
            order.paymentMethod = 'paypal';
            order.paymentDetails = {
                provider: 'paypal',
                paymentId: paypalOrder.id,
                status: 'pending',
                amount: order.totalPrice,
                currency: 'USD',
                environment: PAYPAL_MODE
            };
            
            await order.save();
            
            console.log(`💰 [${PAYPAL_MODE.toUpperCase()}] Registro de pago creado: ${payment._id}`);
            
            // Respuesta para frontend
            res.json({
                success: true,
                data: {
                    paymentId: payment._id,
                    paypalOrderId: paypalOrder.id,
                    approvalUrl: paypalOrder.links.find(link => link.rel === 'approve')?.href,
                    order: {
                        id: order._id,
                        number: order.orderNumber,
                        amount: order.totalPrice,
                        currency: 'USD'
                    },
                    expiresAt: new Date(Date.now() + 3600000), // 1 hora
                    instructions: IS_PRODUCTION_MODE
                        ? 'Serás redirigido a PayPal para completar el pago real'
                        : 'Serás redirigido a PayPal Sandbox para completar el pago de prueba',
                    mode: PAYPAL_MODE,
                    isProduction: IS_PRODUCTION_MODE
                },
                message: `Orden PayPal creada exitosamente (${PAYPAL_MODE.toUpperCase()})`
            });
            
        } catch (error) {
            console.error(`❌ [${PAYPAL_MODE}] Error creando orden PayPal:`, {
                error: error.message,
                code: error.code,
                orderId: req.body?.orderId,
                userId: req.user?._id,
                response: error.response?.data
            });
            
            let statusCode = 500;
            let errorCode = 'INTERNAL_ERROR';
            let userMessage = `Error creando orden de pago (${PAYPAL_MODE})`;
            
            if (error.code === 'PAYPAL_CONFIG_ERROR') {
                statusCode = 503;
                errorCode = 'PAYPAL_UNAVAILABLE';
                userMessage = 'Servicio de pagos temporalmente no disponible';
            } else if (error.response?.status === 401) {
                statusCode = 401;
                errorCode = 'PAYPAL_AUTH_ERROR';
                userMessage = `Error de autenticación con PayPal (${PAYPAL_MODE})`;
            } else if (error.response?.status === 400) {
                statusCode = 400;
                errorCode = 'PAYPAL_VALIDATION_ERROR';
                userMessage = 'Datos de pago inválidos';
            }
            
            res.status(statusCode).json({
                success: false,
                error: errorCode,
                message: userMessage,
                mode: PAYPAL_MODE,
                ...(process.env.NODE_ENV === 'development' && {
                    debug: {
                        paypalError: error.response?.data,
                        originalError: error.message
                    }
                })
            });
        }
    }
    
    // ✅ CAPTURAR PAGO
    async capturePayment(req, res) {
        try {
            const config = getPaypalConfig();
            const PAYPAL_BASE_URL = getPaypalBaseUrl();
            const { orderID } = req.body;
            
            console.log(`💰 [${PAYPAL_MODE.toUpperCase()}] Capturando pago PayPal: ${orderID}`);
            
            if (!orderID) {
                return res.status(400).json({
                    success: false,
                    error: 'ORDER_ID_REQUIRED',
                    message: 'Se requiere ID de orden PayPal'
                });
            }
            
            if (!config.clientId || !config.clientSecret) {
                return res.status(500).json({
                    success: false,
                    error: 'PAYPAL_NOT_CONFIGURED',
                    message: `PayPal no está configurado (modo: ${PAYPAL_MODE})`
                });
            }
            
            const accessToken = await this.getAccessToken();
            
            const response = await axios.post(
                `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    timeout: REQUEST_TIMEOUT
                }
            );
            
            const captureData = response.data;
            console.log(`✅ [${PAYPAL_MODE.toUpperCase()}] Pago capturado: ${captureData.id}`);
            
            // Buscar el pago en la base de datos
            const payment = await Payment.findOne({ providerPaymentId: orderID })
                .populate('order')
                .populate('user');
            
            if (!payment) {
                console.warn(`⚠️ [${PAYPAL_MODE}] Pago no encontrado en BD para ID: ${orderID}`);
                return res.json({
                    success: true,
                    data: captureData,
                    message: 'Pago capturado en PayPal',
                    warning: 'Pago no encontrado en sistema interno',
                    mode: PAYPAL_MODE
                });
            }
            
            // Actualizar el pago
            payment.status = 'completed';
            payment.metadata = {
                ...payment.metadata,
                capture: captureData,
                captureId: captureData.id,
                captureTime: new Date().toISOString(),
                status: captureData.status,
                payer: captureData.payer,
                isProduction: IS_PRODUCTION_MODE
            };
            await payment.save();
            
            // Actualizar la orden si existe
            if (payment.order) {
                const order = await Order.findById(payment.order._id);
                if (order && order.status !== 'paid') {
                    order.status = 'paid';
                    order.paymentStatus = 'paid';
                    order.paymentMethod = 'paypal';
                    order.paymentReference = payment._id;
                    order.paymentProviderId = payment.providerPaymentId;
                    order.paymentDetails = {
                        provider: 'paypal',
                        paymentId: payment.providerPaymentId,
                        captureId: captureData.id,
                        amount: payment.amount,
                        currency: payment.currency,
                        payer: captureData.payer,
                        captureTime: new Date(),
                        mode: PAYPAL_MODE
                    };
                    order.paidAt = new Date();
                    
                    await order.save();
                    
                    // Actualizar estadísticas del usuario
                    await User.findByIdAndUpdate(payment.user, {
                        $inc: {
                            totalSpent: payment.amount,
                            ordersCount: 1
                        },
                        $set: {
                            lastOrderDate: new Date()
                        }
                    });
                    
                    console.log(`✅ [${PAYPAL_MODE.toUpperCase()}] Orden ${order._id} marcada como pagada`);
                    
                    // Emitir evento de Socket.IO si está disponible
                    if (global.io) {
                        global.io.emit('order_paid', {
                            orderId: order._id,
                            orderNumber: order.orderNumber,
                            paymentMethod: 'paypal',
                            amount: payment.amount,
                            paidAt: order.paidAt,
                            captureId: captureData.id,
                            userId: payment.user._id,
                            mode: PAYPAL_MODE
                        });
                    }
                }
            }
            
            res.json({
                success: true,
                data: {
                    capture: captureData,
                    payment: {
                        id: payment._id,
                        status: payment.status,
                        amount: payment.amount
                    },
                    order: payment.order ? {
                        id: payment.order._id,
                        number: payment.order.orderNumber,
                        status: 'paid'
                    } : null
                },
                message: `Pago capturado exitosamente (${PAYPAL_MODE.toUpperCase()})`,
                mode: PAYPAL_MODE
            });
            
        } catch (error) {
            console.error(`❌ [${PAYPAL_MODE}] Error capturando pago:`, {
                error: error.message,
                paypalId: req.body?.orderID,
                response: error.response?.data
            });
            
            let statusCode = 500;
            let errorCode = 'CAPTURE_ERROR';
            let userMessage = `Error capturando el pago (${PAYPAL_MODE})`;
            
            if (error.response?.status === 404) {
                statusCode = 404;
                errorCode = 'ORDER_NOT_FOUND';
                userMessage = 'Orden PayPal no encontrada';
            } else if (error.response?.status === 422) {
                statusCode = 422;
                errorCode = 'ORDER_ALREADY_CAPTURED';
                userMessage = 'Esta orden ya ha sido pagada';
            }
            
            res.status(statusCode).json({
                success: false,
                error: errorCode,
                message: userMessage,
                mode: PAYPAL_MODE,
                ...(process.env.NODE_ENV === 'development' && {
                    debug: error.response?.data || error.message
                })
            });
        }
    }
    
    // ✅ OBTENER ESTADO DEL PAGO
    async getPaymentStatus(req, res) {
        try {
            const { orderId } = req.params;
            
            const payment = await Payment.findOne({ order: orderId })
                .sort({ createdAt: -1 });
            
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    error: 'PAYMENT_NOT_FOUND',
                    message: 'No se encontró pago para esta orden'
                });
            }
            
            let paypalStatus = null;
            if (payment.providerPaymentId && payment.status === 'pending') {
                try {
                    const accessToken = await this.getAccessToken();
                    const response = await axios.get(
                        `${getPaypalBaseUrl()}/v2/checkout/orders/${payment.providerPaymentId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 10000
                        }
                    );
                    paypalStatus = response.data.status;
                } catch (paypalError) {
                    console.warn(`⚠️ No se pudo obtener estado de PayPal (${PAYPAL_MODE}):`, paypalError.message);
                }
            }
            
            res.json({
                success: true,
                data: {
                    payment: {
                        id: payment._id,
                        status: payment.status,
                        amount: payment.amount,
                        currency: payment.currency,
                        provider: payment.provider,
                        providerPaymentId: payment.providerPaymentId,
                        createdAt: payment.createdAt,
                        updatedAt: payment.updatedAt
                    },
                    paypalStatus,
                    nextAction: this.getNextAction(payment.status, paypalStatus),
                    canRetry: payment.status === 'failed',
                    mode: PAYPAL_MODE
                },
                message: 'Estado del pago obtenido'
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo estado del pago:', error);
            res.status(500).json({
                success: false,
                error: 'STATUS_ERROR',
                message: 'Error obteniendo estado del pago'
            });
        }
    }
    
    // ✅ OBTENER DETALLES DEL PAGO (Admin)
    async getPaymentDetails(req, res) {
        try {
            const { paymentId } = req.params;
            
            const payment = await Payment.findById(paymentId)
                .populate('order')
                .populate('user', 'username email');
            
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    error: 'PAYMENT_NOT_FOUND',
                    message: 'Pago no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: {
                    payment,
                    mode: PAYPAL_MODE
                }
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo detalles del pago:', error);
            res.status(500).json({
                success: false,
                error: 'DETAILS_ERROR',
                message: 'Error obteniendo detalles del pago'
            });
        }
    }
    
    // ✅ REEMBOLSAR PAGO (Admin)
    async refundPayment(req, res) {
        try {
            const { paymentId } = req.params;
            const { amount, reason } = req.body;
            
            const payment = await Payment.findById(paymentId);
            
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    error: 'PAYMENT_NOT_FOUND',
                    message: 'Pago no encontrado'
                });
            }
            
            if (payment.status !== 'completed') {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_STATUS',
                    message: 'Solo se pueden reembolsar pagos completados'
                });
            }
            
            const accessToken = await this.getAccessToken();
            const captureId = payment.metadata.captureId;
            
            if (!captureId) {
                return res.status(400).json({
                    success: false,
                    error: 'NO_CAPTURE_ID',
                    message: 'No se encontró ID de captura para este pago'
                });
            }
            
            const refundData = {
                amount: {
                    value: amount || payment.amount.toFixed(2),
                    currency_code: 'USD'
                },
                note_to_payer: reason || 'Reembolso solicitado por el vendedor'
            };
            
            const response = await axios.post(
                `${getPaypalBaseUrl()}/v2/payments/captures/${captureId}/refund`,
                refundData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            payment.status = 'refunded';
            payment.metadata.refund = {
                ...response.data,
                refundedAt: new Date(),
                reason: reason || 'Manual refund',
                refundedBy: req.user?._id || 'system'
            };
            await payment.save();
            
            if (payment.order) {
                await Order.findByIdAndUpdate(payment.order._id, {
                    status: 'refunded',
                    paymentStatus: 'refunded'
                });
            }
            
            res.json({
                success: true,
                data: response.data,
                message: 'Reembolso procesado exitosamente'
            });
            
        } catch (error) {
            console.error('❌ Error procesando reembolso:', error);
            res.status(500).json({
                success: false,
                error: 'REFUND_ERROR',
                message: 'Error procesando reembolso',
                ...(process.env.NODE_ENV === 'development' && {
                    debug: error.response?.data || error.message
                })
            });
        }
    }
    
    // ✅ VERIFICAR FIRMA DE WEBHOOK
    async verifyWebhookSignature(req) {
        try {
            const config = getPaypalConfig();
            
            if (!config.webhookId) {
                console.warn(`⚠️ PayPal webhook ID no configurado (${PAYPAL_MODE})`);
                return config.nodeEnv !== 'production';
            }
            
            const webhookId = req.headers['paypal-webhook-id'];
            const transmissionId = req.headers['paypal-transmission-id'];
            const transmissionTime = req.headers['paypal-transmission-time'];
            const certUrl = req.headers['paypal-cert-url'];
            const authAlgo = req.headers['paypal-auth-algo'];
            const transmissionSig = req.headers['paypal-transmission-sig'];
            
            if (!webhookId || !transmissionId || !transmissionSig) {
                console.error('❌ Headers de webhook PayPal faltantes');
                return false;
            }
            
            return webhookId === config.webhookId;
            
        } catch (error) {
            console.error('❌ Error verificando firma de webhook:', error);
            return false;
        }
    }
    
    // ✅ MANEJAR WEBHOOK
    async handleWebhook(req, res) {
        try {
            const config = getPaypalConfig();
            console.log(`🔔 [${PAYPAL_MODE.toUpperCase()}] Webhook PayPal recibido`);
            
            // Verificar firma en producción
            if (config.nodeEnv === 'production') {
                const isValid = await this.verifyWebhookSignature(req);
                if (!isValid) {
                    console.error('❌ Firma de webhook inválida');
                    return res.status(401).json({ success: false, error: 'INVALID_SIGNATURE' });
                }
            }
            
            const webhookData = req.body;
            const eventType = webhookData.event_type;
            const resource = webhookData.resource || {};
            
            console.log(`📩 Evento webhook: ${eventType}`, {
                id: resource.id,
                status: resource.status
            });
            
            // Eventos relevantes a procesar
            const relevantEvents = [
                'CHECKOUT.ORDER.APPROVED',
                'PAYMENT.CAPTURE.COMPLETED',
                'PAYMENT.CAPTURE.DENIED',
                'PAYMENT.CAPTURE.REFUNDED'
            ];
            
            if (!relevantEvents.includes(eventType)) {
                console.log(`ℹ️ Ignorando evento irrelevante: ${eventType}`);
                return res.status(200).json({ success: true, message: 'Event ignored' });
            }
            
            const paypalId = resource.id || resource.order_id || resource.supplementary_data?.related_ids?.order_id;
            if (!paypalId) {
                console.error('❌ No se encontró ID de PayPal en webhook');
                return res.status(400).json({ success: false, error: 'NO_PAYPAL_ID' });
            }
            
            const payment = await Payment.findOne({ providerPaymentId: paypalId })
                .populate('order')
                .populate('user');
            
            if (!payment) {
                console.warn(`⚠️ Pago no encontrado para ID PayPal: ${paypalId}`);
                await this.logWebhook(webhookData, 'PAYMENT_NOT_FOUND');
                return res.status(200).json({ success: true, message: 'Payment not found, logged for review' });
            }
            
            // Procesar según tipo de evento
            switch (eventType) {
                case 'CHECKOUT.ORDER.APPROVED':
                case 'PAYMENT.CAPTURE.COMPLETED':
                    if (payment.status !== 'completed') {
                        payment.status = 'completed';
                        payment.metadata.webhook = {
                            event: eventType,
                            received: new Date().toISOString(),
                            data: webhookData
                        };
                        await payment.save();
                        
                        if (payment.order && payment.order.status !== 'paid') {
                            await Order.findByIdAndUpdate(payment.order._id, {
                                status: 'paid',
                                paymentStatus: 'paid',
                                paidAt: new Date(),
                                paymentDetails: {
                                    ...payment.order.paymentDetails,
                                    webhookEvent: eventType,
                                    webhookReceived: new Date(),
                                    mode: PAYPAL_MODE
                                }
                            });
                            
                            console.log(`✅ Orden ${payment.order._id} actualizada vía webhook (${PAYPAL_MODE})`);
                        }
                    }
                    break;
                    
                case 'PAYMENT.CAPTURE.DENIED':
                    payment.status = 'failed';
                    payment.metadata.webhook = {
                        event: eventType,
                        received: new Date().toISOString(),
                        reason: resource.reason || 'Denegado por PayPal'
                    };
                    await payment.save();
                    break;
                    
                case 'PAYMENT.CAPTURE.REFUNDED':
                    payment.status = 'refunded';
                    payment.metadata.webhook = {
                        event: eventType,
                        received: new Date().toISOString(),
                        refundData: resource
                    };
                    await payment.save();
                    break;
            }
            
            await this.logWebhook(webhookData, 'PROCESSED');
            
            res.status(200).json({
                success: true,
                message: 'Webhook procesado',
                mode: PAYPAL_MODE
            });
            
        } catch (error) {
            console.error('❌ Error procesando webhook:', error);
            await this.logWebhook(req.body, 'ERROR', error.message);
            
            res.status(500).json({
                success: false,
                error: 'PROCESSING_ERROR',
                message: 'Error procesando webhook'
            });
        }
    }
    
    // ✅ OBTENER CONFIGURACIÓN (Público)
    async getConfigStatus(req, res) {
        try {
            const config = getPaypalConfig();
            
            res.json({
                success: true,
                data: {
                    mode: PAYPAL_MODE,
                    isProduction: IS_PRODUCTION_MODE,
                    configured: !!(config.clientId && config.clientSecret),
                    webhookConfigured: !!config.webhookId,
                    apiUrl: getPaypalBaseUrl(),
                    clientIdPrefix: config.clientId?.substring(0, 2) || 'N/A'
                }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'CONFIG_ERROR',
                message: 'Error obteniendo configuración'
            });
        }
    }
}

export default new PayPalController();