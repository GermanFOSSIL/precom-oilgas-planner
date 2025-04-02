
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Importar jsPDF y autotable de manera correcta
import 'jspdf'
import 'jspdf-autotable'

createRoot(document.getElementById("root")!).render(<App />);
