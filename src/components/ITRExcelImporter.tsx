
import React, { useState, useRef } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Check, AlertTriangle, FileUp } from "lucide-react";
import { ITRB } from "@/types";
import * as XLSX from 'xlsx';

const ITRExcelImporter: React.FC = () => {
  const { addITRB, actividades, proyectoActual } = useAppContext();
  const [uploading, setUploading] = useState<boolean>(false);
  const [results, setResults] = useState<{
    success: number;
    errors: number;
    messages: string[];
  }>({ success: 0, errors: 0, messages: [] });
  const [showResults, setShowResults] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setShowResults(false);
    setResults({ success: 0, errors: 0, messages: [] });

    // Verificar que sea un archivo Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Por favor, sube un archivo Excel (.xlsx o .xls)");
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        processExcelData(json);
      } catch (error) {
        console.error("Error al procesar el archivo Excel:", error);
        toast.error("Error al procesar el archivo Excel");
        setResults(prev => ({
          ...prev,
          errors: prev.errors + 1,
          messages: [...prev.messages, "Error al procesar el archivo Excel"]
        }));
      } finally {
        setUploading(false);
        setShowResults(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      toast.error("Error al leer el archivo");
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsBinaryString(file);
  };

  const processExcelData = (data: any[]) => {
    if (!data || data.length === 0) {
      toast.error("El archivo no contiene datos");
      setResults(prev => ({
        ...prev,
        errors: prev.errors + 1,
        messages: [...prev.messages, "El archivo no contiene datos"]
      }));
      return;
    }

    // Verificar que las columnas necesarias existan
    const firstRow = data[0];
    const requiredColumns = ['codigo', 'descripcion'];
    const missingColumns = requiredColumns.filter(col => 
      !Object.keys(firstRow).some(key => key.toLowerCase().includes(col.toLowerCase()))
    );

    if (missingColumns.length > 0) {
      toast.error(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
      setResults(prev => ({
        ...prev,
        errors: prev.errors + 1,
        messages: [...prev.messages, `Faltan columnas requeridas: ${missingColumns.join(', ')}`]
      }));
      return;
    }

    // Filtrar actividades del proyecto actual
    const actividadesDelProyecto = actividades.filter(act => 
      proyectoActual === "todos" || act.proyectoId === proyectoActual
    );

    if (actividadesDelProyecto.length === 0) {
      toast.error("No hay actividades en el proyecto seleccionado");
      setResults(prev => ({
        ...prev,
        errors: prev.errors + 1,
        messages: [...prev.messages, "No hay actividades en el proyecto seleccionado"]
      }));
      return;
    }

    // Procesar cada fila del Excel
    let successCount = 0;
    let errorCount = 0;
    const messages: string[] = [];

    data.forEach((row, index) => {
      try {
        // Encontrar las claves que contienen 'codigo' y 'descripcion'
        const codigoKey = Object.keys(row).find(key => 
          key.toLowerCase().includes('codigo') || key.toLowerCase().includes('code')
        );
        const descripcionKey = Object.keys(row).find(key => 
          key.toLowerCase().includes('descripcion') || key.toLowerCase().includes('description')
        );

        if (!codigoKey || !descripcionKey) {
          throw new Error(`Fila ${index + 1}: No se pudieron identificar las columnas de código y descripción`);
        }

        const codigo = row[codigoKey]?.toString() || '';
        const descripcion = row[descripcionKey]?.toString() || '';

        if (!codigo || !descripcion) {
          throw new Error(`Fila ${index + 1}: Código o descripción vacío`);
        }

        // Asignar a la primera actividad disponible (esto podría mejorarse)
        const actividadAsignada = actividadesDelProyecto[0];

        // Crear nuevo ITR B
        const nuevoITRB: ITRB = {
          id: `itr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          actividadId: actividadAsignada.id,
          descripcion: `${codigo} - ${descripcion}`,
          cantidadTotal: 1,
          cantidadRealizada: 0,
          estado: "En curso",
          fechaLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días en el futuro
          ccc: false,
          mcc: false
        };

        // Agregar el ITR B
        addITRB(nuevoITRB);
        successCount++;
        messages.push(`✅ Importado: ${codigo} - ${descripcion}`);

      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        messages.push(`❌ ${errorMessage}`);
        console.error(`Error en fila ${index + 1}:`, error);
      }
    });

    setResults({
      success: successCount,
      errors: errorCount,
      messages
    });

    if (successCount > 0) {
      toast.success(`Importados ${successCount} ITR B exitosamente`);
    }
    
    if (errorCount > 0) {
      toast.error(`Hubo ${errorCount} errores durante la importación`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar ITR desde Excel
        </CardTitle>
        <CardDescription>
          Importa ITRs desde un archivo Excel con columnas para código y descripción
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="excel-file"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Excel (.xlsx, .xls)
                </p>
              </div>
              <Input
                id="excel-file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {uploading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {showResults && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <span>Importados exitosamente:</span>
              <Badge className="bg-green-600">{results.success}</Badge>
            </div>
            {results.errors > 0 && (
              <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <span>Errores:</span>
                <Badge variant="destructive">{results.errors}</Badge>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
              {results.messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`py-1 ${msg.startsWith('❌') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                >
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setShowResults(false)} disabled={uploading || !showResults}>
          Limpiar resultados
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <FileUp className="h-4 w-4 mr-2" />
          Subir Excel
        </Button>
      </CardFooter>
    </Card>
  );
};

import { Badge } from "@/components/ui/badge";

export default ITRExcelImporter;
