import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { toast } from 'react-toastify';

const ReviewForm = ({ orderId }) => {
  const [loading, setLoading] = useState(true);
  const [existingReview, setExistingReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    axios.get(`/reviews/mine/order/${orderId}`)
      .then((res) => {
        if (res.data?.success) setExistingReview(res.data.review);
      })
      .catch(() => {
        // sin review todavía, o error de red — dejamos el form disponible igual
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleSubmit = async () => {
    if (rating < 1) {
      toast.error('Elegí una cantidad de estrellas primero');
      return;
    }
    setSubmitting(true);
    try {
      const response = await axios.post('/reviews', { orderId, rating, comment });
      if (response.data?.success) {
        setExistingReview(response.data.review);
        toast.success('¡Gracias por tu review!');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo enviar la review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (existingReview) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">⭐</span> Tu Review
        </h2>
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n <= existingReview.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
          ))}
        </div>
        {existingReview.comment && (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{existingReview.comment}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center">
        <span className="mr-2">⭐</span> ¿Cómo estuvo el servicio?
      </h2>
      <p className="text-sm text-gray-500 mb-4">Tu review ayuda a otros clientes a decidir.</p>

      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(n)}
            className="text-3xl leading-none focus:outline-none"
          >
            <span className={n <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows="3"
        maxLength={500}
        className="w-full p-3 border rounded-lg resize-none text-sm mb-4"
        placeholder="Contanos tu experiencia (opcional)"
      />

      <button
        onClick={handleSubmit}
        disabled={submitting || rating < 1}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-lg font-medium transition-all"
      >
        {submitting ? 'Enviando...' : 'Enviar Review'}
      </button>
    </div>
  );
};

export default ReviewForm;
