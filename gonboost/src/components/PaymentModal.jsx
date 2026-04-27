// components/PaymentModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axiosConfig';
import { toast } from 'react-toastify';

const PaymentModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const openModal = (order) => {
    setSelectedOrder(order);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedOrder(null);
    setLoading(false);
  };

  const handlePayment = async (method) => {
    if (!selectedOrder) return;
    
    setLoading(true);
    
    try {
      // Redirigir al checkout para métodos completos
      if (method === 'paypal' || method === 'crypto') {
        navigate(`/checkout/${selectedOrder._id}`);
        closeModal();
        return;
      }
      
      // Pago con wallet directo
      if (method === 'wallet') {
        const response = await axios.post('/payments/wallet/pay', {
          orderId: selectedOrder._id
        });
        
        if (response.data.success) {
          toast.success('Pago realizado con wallet');
          closeModal();
          window.location.reload();
        }
      }
    } catch (error) {
      toast.error('Error procesando pago');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity" onClick={closeModal}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Contenido del modal */}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;