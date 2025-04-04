
/**
 * Servicio que proporciona almacenamiento persistente local
 * usando localStorage pero con características adicionales:
 * - Respaldo automático
 * - Notificaciones de cambios
 * - Control de versiones
 */

type StorageChangeListener = (key: string, value: any) => void;

class PersistentStorage {
  private listeners: Map<string, StorageChangeListener[]> = new Map();
  private autoSaveInterval: number | null = null;
  private lastBackup: string = '';
  
  constructor() {
    // Iniciar respaldo automático cada 5 minutos
    this.startAutoBackup();
    
    // Escuchar cambios de almacenamiento en otras pestañas
    window.addEventListener('storage', (event) => {
      if (event.key && this.listeners.has(event.key)) {
        const keyListeners = this.listeners.get(event.key) || [];
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        keyListeners.forEach(listener => listener(event.key || '', newValue));
      }
    });
  }

  /**
   * Guarda un valor en el almacenamiento persistente
   */
  setItem(key: string, value: any): void {
    // Convertir a JSON si es un objeto
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    // Guardar en localStorage
    localStorage.setItem(key, stringValue);
    
    // Notificar a los listeners
    if (this.listeners.has(key)) {
      const keyListeners = this.listeners.get(key) || [];
      keyListeners.forEach(listener => listener(key, value));
    }
    
    // Registrar cambio para respaldo
    this.markForBackup();
  }

  /**
   * Obtiene un valor desde el almacenamiento persistente
   */
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    const item = localStorage.getItem(key);
    
    if (item === null) {
      return defaultValue;
    }
    
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  }

  /**
   * Elimina un valor del almacenamiento persistente
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
    
    // Notificar a los listeners
    if (this.listeners.has(key)) {
      const keyListeners = this.listeners.get(key) || [];
      keyListeners.forEach(listener => listener(key, null));
    }
    
    // Registrar cambio para respaldo
    this.markForBackup();
  }

  /**
   * Limpia todo el almacenamiento persistente
   */
  clear(): void {
    localStorage.clear();
    
    // Notificar a todos los listeners
    this.listeners.forEach((listeners, key) => {
      listeners.forEach(listener => listener(key, null));
    });
    
    // Registrar cambio para respaldo
    this.markForBackup();
  }

  /**
   * Registra un listener para cambios en una clave específica
   */
  subscribe(key: string, listener: StorageChangeListener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    const keyListeners = this.listeners.get(key) || [];
    keyListeners.push(listener);
    this.listeners.set(key, keyListeners);
    
    // Devolver función de limpieza
    return () => {
      const updatedListeners = (this.listeners.get(key) || [])
        .filter(l => l !== listener);
      this.listeners.set(key, updatedListeners);
    };
  }

  /**
   * Inicia el respaldo automático
   */
  startAutoBackup(intervalMinutes = 5): void {
    // Limpiar intervalo anterior si existe
    if (this.autoSaveInterval !== null) {
      window.clearInterval(this.autoSaveInterval);
    }
    
    // Crear nuevo intervalo
    this.autoSaveInterval = window.setInterval(() => {
      this.createBackup();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Detiene el respaldo automático
   */
  stopAutoBackup(): void {
    if (this.autoSaveInterval !== null) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Marca que hay cambios pendientes para respaldar
   */
  private markForBackup(): void {
    localStorage.setItem('_lastChange', new Date().toISOString());
  }

  /**
   * Crea un respaldo de los datos actuales
   */
  createBackup(): void {
    try {
      // Obtener estado actual
      const backupData = {
        timestamp: new Date().toISOString(),
        data: {} as Record<string, string | null>
      };
      
      // Excluir claves que comienzan con '_'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('_')) {
          backupData.data[key] = localStorage.getItem(key);
        }
      }
      
      // Guardar respaldo
      const backupStr = JSON.stringify(backupData);
      localStorage.setItem('_lastBackup', backupStr);
      
      // Guardar también como archivo de respaldo (en producción)
      this.saveBackupFile(backupStr);
      
      console.log('Respaldo automático creado:', backupData.timestamp);
      this.lastBackup = backupData.timestamp;
    } catch (error) {
      console.error('Error al crear respaldo automático:', error);
    }
  }

  /**
   * Guarda el archivo de respaldo en el sistema (simulado)
   */
  private saveBackupFile(data: string): void {
    // En un entorno real del servidor, aquí escribiríamos a un archivo
    // Como estamos en el navegador, guardamos en localStorage adicional
    try {
      localStorage.setItem('_backupFile', data);
      
      // También podemos ofrecer la descarga al usuario
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Crear elemento pero no descargarlo automáticamente
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().replace(/:/g, '-')}.json`;
      
      // En un entorno de producción real, esto se manejaría en el servidor
      // Aquí solo mantenemos la referencia
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al guardar archivo de respaldo:', error);
    }
  }

  /**
   * Restaura un respaldo
   */
  restoreBackup(backupData: string): boolean {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.data || !backup.timestamp) {
        throw new Error('Formato de respaldo inválido');
      }
      
      // Limpiar datos actuales (excepto configuración)
      const configKeys = ['_theme', '_apiKeys', '_lastSession'];
      const savedConfig: Record<string, string | null> = {};
      
      configKeys.forEach(key => {
        savedConfig[key] = localStorage.getItem(key);
      });
      
      // Limpiar localStorage
      localStorage.clear();
      
      // Restaurar configuración
      Object.entries(savedConfig).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });
      
      // Restaurar datos del respaldo
      Object.entries(backup.data).forEach(([key, value]) => {
        if (value !== null && typeof value === 'string') {
          // Manejo especial para ITRBs para asegurar que las fechas sean válidas
          if (key === 'itrbItems') {
            try {
              const itrbItems = JSON.parse(value);
              if (Array.isArray(itrbItems)) {
                // Procesar cada ITRB para asegurar fechas válidas
                const processedItems = itrbItems.map(item => {
                  // Asegurarse que todas las fechas sean ISO strings válidos
                  if (item.fechaInicio) {
                    const fechaInicio = new Date(item.fechaInicio);
                    if (isNaN(fechaInicio.getTime())) {
                      item.fechaInicio = new Date().toISOString();
                    } else {
                      item.fechaInicio = fechaInicio.toISOString();
                    }
                  } else {
                    item.fechaInicio = new Date().toISOString();
                  }
                  
                  if (item.fechaLimite) {
                    const fechaLimite = new Date(item.fechaLimite);
                    if (isNaN(fechaLimite.getTime())) {
                      // Usar fecha actual + 7 días como predeterminada
                      const defaultDate = new Date();
                      defaultDate.setDate(defaultDate.getDate() + 7);
                      item.fechaLimite = defaultDate.toISOString();
                    } else {
                      item.fechaLimite = fechaLimite.toISOString();
                    }
                  } else {
                    // Usar fecha actual + 7 días como predeterminada
                    const defaultDate = new Date();
                    defaultDate.setDate(defaultDate.getDate() + 7);
                    item.fechaLimite = defaultDate.toISOString();
                  }
                  
                  return item;
                });
                
                // Guardar los ITRBs procesados
                localStorage.setItem(key, JSON.stringify(processedItems));
              } else {
                localStorage.setItem(key, value);
              }
            } catch (e) {
              console.error('Error procesando ITRBs:', e);
              localStorage.setItem(key, value);
            }
          } else {
            localStorage.setItem(key, value);
          }
        }
      });
      
      console.log('Respaldo restaurado correctamente:', backup.timestamp);
      return true;
    } catch (error) {
      console.error('Error al restaurar respaldo:', error);
      return false;
    }
  }

  /**
   * Obtiene la fecha del último respaldo
   */
  getLastBackupDate(): string {
    return this.lastBackup;
  }
}

// Singleton
export const persistentStorage = new PersistentStorage();
