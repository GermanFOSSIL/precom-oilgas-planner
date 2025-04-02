
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Importar jsPDF de manera correcta
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Añadir a la ventana global para que esté disponible en toda la app
window.jsPDF = jsPDF;

createRoot(document.getElementById("root")!).render(<App />);
