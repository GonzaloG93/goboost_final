import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancel = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Pago Cancelado</h1>
        
        <p className="text-gray-600 mb-2">
          Tu proceso de pago ha sido cancelado.
        </p>
        <p className="text-gray-600 mb-6">
          No se ha realizado ningún cargo. Puedes intentar nuevamente cuando estés listo.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            💡 Tu orden ha sido guardada y puedes completar el pago más tarde desde "Mis Órdenes".
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/my-orders"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 block text-center"
          >
            Ver Mis Órdenes Pendientes
          </Link>
          
          <Link
            to="/services"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 block text-center"
          >
            Explorar Servicios
          </Link>
          
          <Link
            to="/"
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 block text-center"
          >
            Volver al Inicio
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            ¿Problemas con el pago? <Link to="/support" className="text-blue-600 hover:text-blue-700 font-medium">Contacta a Soporte</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;