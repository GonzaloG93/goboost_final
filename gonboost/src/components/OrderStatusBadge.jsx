import React from 'react';

const OrderStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      className: 'bg-yellow-100 text-yellow-800'
    },
    paid: {
      label: 'Pagado',
      className: 'bg-blue-100 text-blue-800'
    },
    in_progress: {
      label: 'En Progreso',
      className: 'bg-indigo-100 text-indigo-800'
    },
    completed: {
      label: 'Completado',
      className: 'bg-green-100 text-green-800'
    },
    cancelled: {
      label: 'Cancelado',
      className: 'bg-red-100 text-red-800'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default OrderStatusBadge;