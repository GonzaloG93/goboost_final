// components/QuickSupportButtons.jsx
import { useTawkTo } from '../hooks/useTawkTo';

const QuickSupportButtons = ({ order, game }) => {
  const { openChat } = useTawkTo();

  const quickActions = [
    {
      label: '📋 Consultar Precios',
      message: 'Hola, me gustaría consultar precios de boosting'
    },
    {
      label: '🚀 Soporte Urgente',
      message: 'URGENTE: Necesito ayuda inmediata con mi pedido'
    },
    {
      label: '🎮 Problema con Pedido',
      message: `Tengo un problema con mi pedido de ${game}`
    },
    {
      label: '⏰ Consultar Tiempos',
      message: '¿Cuál es el tiempo estimado para mi pedido?'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
      {quickActions.map((action, index) => (
        <button
          key={index}
          onClick={() => openChat(action.message)}
          className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm transition-colors border border-gray-600"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default QuickSupportButtons;