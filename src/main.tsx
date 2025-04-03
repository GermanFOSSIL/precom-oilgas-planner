
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
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

createRoot(document.getElementById("root")!).render(<App />);
