import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ProtectedRoute from '../components/ProtectedRoute';

const BoosterDashboard = () => {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    if (user?.role === 'booster') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [availableResponse, myOrdersResponse] = await Promise.all([
        axios.get('/api/orders/available'),
        axios.get('/api/orders/booster/my-orders') // Endpoint específico para booster
      ]);
      
      setAvailableOrders(availableResponse.data);
      setMyOrders(myOrdersResponse.data);
    } catch (error) {
      console.error('Error fetching booster data:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      await axios.patch(`/api/orders/${orderId}/accept`);
      fetchData();
      alert('Orden aceptada exitosamente');
    } catch (error) {
      alert('Error al aceptar la orden: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status });
      fetchData();
      alert('Estado actualizado exitosamente');
    } catch (error) {
      alert('Error al actualizar el estado: ' + (error.response?.data?.message || error.message));
    }
  };

  const completeOrder = async (orderId) => {
    try {
      await axios.patch(`/api/orders/${orderId}/complete`);
      fetchData();
      alert('Orden completada exitosamente');
    } catch (error) {
      alert('Error al completar la orden: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando dashboard booster..." />;
  }

  return (
    <ProtectedRoute requiredRole="booster">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Dashboard Booster
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Órdenes Activas</h3>
              <p className="text-3xl font-bold text-blue-600">
                {myOrders.filter(order => order.status === 'in_progress').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Completadas</h3>
              <p className="text-3xl font-bold text-green-600">
                {myOrders.filter(order => order.status === 'completed').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Rating</h3>
              <p className="text-3xl font-bold text-yellow-600">{user?.rating || 0}/5</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Ganancias</h3>
              <p className="text-3xl font-bold text-green-600">${user?.balance || 0}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="border-b">
              <nav className="flex -mb-px">
                {[
                  { id: 'available', name: 'Órdenes Disponibles' },
                  { id: 'active', name: 'Mis Órdenes Activas' },
                  { id: 'history', name: 'Historial' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Órdenes Disponibles */}
              {activeTab === 'available' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-4">Órdenes Disponibles</h3>
                  {availableOrders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No hay órdenes disponibles en este momento
                    </p>
                  ) : (
                    availableOrders.map((order) => (
                      <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-lg">{order.service?.name}</h4>
                            <p className="text-gray-600">Orden #{order.orderNumber}</p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            ${order.totalPrice}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div>
                            <p><strong>Juego:</strong> {order.gameDetails?.game}</p>
                            <p><strong>Cliente:</strong> {order.customer?.username}</p>
                          </div>
                          <div>
                            <p><strong>De:</strong> {order.gameDetails?.currentRank}</p>
                            <p><strong>A:</strong> {order.gameDetails?.desiredRank}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Creada: {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => acceptOrder(order._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Aceptar Orden
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Mis Órdenes Activas */}
              {activeTab === 'active' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-4">Mis Órdenes Activas</h3>
                  {myOrders.filter(order => order.status === 'in_progress').length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No tienes órdenes activas
                    </p>
                  ) : (
                    myOrders
                      .filter(order => order.status === 'in_progress')
                      .map((order) => (
                        <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-lg">{order.service?.name}</h4>
                              <p className="text-gray-600">Orden #{order.orderNumber}</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                              En Progreso
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div>
                              <p><strong>Juego:</strong> {order.gameDetails?.game}</p>
                              <p><strong>Cliente:</strong> {order.customer?.username}</p>
                              <p><strong>Usuario:</strong> {order.gameDetails?.username}</p>
                            </div>
                            <div>
                              <p><strong>De:</strong> {order.gameDetails?.currentRank}</p>
                              <p><strong>A:</strong> {order.gameDetails?.desiredRank}</p>
                              <p><strong>Servidor:</strong> {order.gameDetails?.server}</p>
                            </div>
                          </div>

                          {order.gameDetails?.notes && (
                            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                              <strong>Notas:</strong> {order.gameDetails.notes}
                            </div>
                          )}

                          <div className="flex space-x-2 justify-end">
                            <button
                              onClick={() => completeOrder(order._id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Marcar como Completado
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order._id, 'cancelled')}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Historial */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-4">Historial de Órdenes</h3>
                  {myOrders.filter(order => order.status === 'completed').length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No hay órdenes completadas
                    </p>
                  ) : (
                    myOrders
                      .filter(order => order.status === 'completed')
                      .map((order) => (
                        <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-lg">{order.service?.name}</h4>
                              <p className="text-gray-600">Orden #{order.orderNumber}</p>
                            </div>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                              Completada
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                            <div>
                              <p><strong>Juego:</strong> {order.gameDetails?.game}</p>
                              <p><strong>Cliente:</strong> {order.customer?.username}</p>
                            </div>
                            <div>
                              <p><strong>Ganancia:</strong> ${order.boosterEarnings || order.totalPrice}</p>
                              <p><strong>Completada:</strong> {new Date(order.updatedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default BoosterDashboard;