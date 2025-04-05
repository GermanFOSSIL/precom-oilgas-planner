
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Import jsPDF correctly
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PersistentStorage } from './services/PersistentStorage';

// Add to the global window object
declare global {
  interface Window {
    jsPDF: typeof jsPDF;
    PersistentStorage: typeof PersistentStorage;
  }
}
window.jsPDF = jsPDF;
window.PersistentStorage = PersistentStorage; // Make the PersistentStorage class available for debugging

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
