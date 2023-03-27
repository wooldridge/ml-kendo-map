import React from 'react';
import ReactDOM from 'react-dom/client';
import '@progress/kendo-theme-bootstrap/dist/all.css'; // Needs to be before MyMap
import App from './App';
import { MLProvider } from './ML';

const el = document.getElementById('root');
const root = ReactDOM.createRoot(el);

root.render(
  <MLProvider
    scheme="http"
    host="localhost"
    port="4000"
  >
    <App />
  </MLProvider>
);