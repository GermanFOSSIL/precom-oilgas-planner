import './utils/dataMigration'; // Add this line at the top of the file
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Import jsPDF correctly
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Add to the global window object
declare global {
  interface Window {
    jsPDF: typeof jsPDF;
  }
}
window.jsPDF = jsPDF;

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
