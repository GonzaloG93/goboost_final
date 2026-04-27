import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'));

const isProduction = import.meta.env.PROD || process.env.NODE_ENV === 'production';

const AppWithRouter = () => (
  <BrowserRouter 
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}
  >
    <App />
  </BrowserRouter>
);

if (isProduction) {
  root.render(<AppWithRouter />);
} else {
  root.render(
    <React.StrictMode>
      <AppWithRouter />
    </React.StrictMode>
  );
}

console.log(`🚀 Aplicación iniciada en modo: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);