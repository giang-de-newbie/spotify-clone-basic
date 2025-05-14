import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/main.css';
import { AuthProvider } from './contexts/AuthContext';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MusicPlayerProvider>
          <App />
        </MusicPlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);