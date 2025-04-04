
/**
 * Servicio para manejar el almacenamiento de la API key de forma persistente
 */
export const ApiKeyStorage = {
  /**
   * Guarda la API key en el almacenamiento local
   * @param key La API key a guardar
   */
  saveApiKey: (key: string): void => {
    try {
      // Guardar en localStorage para persistencia
      localStorage.setItem('openai_api_key', key);
      
      // También se podría implementar un mecanismo para guardar
      // en un archivo en el sistema de archivos local, pero eso
      // requeriría una aplicación de escritorio o permisos especiales
      // en un navegador web.
      
      console.log('API key guardada correctamente');
    } catch (error) {
      console.error('Error al guardar la API key:', error);
      throw new Error('No se pudo guardar la API key');
    }
  },
  
  /**
   * Obtiene la API key del almacenamiento local
   * @returns La API key almacenada o null si no existe
   */
  getApiKey: (): string | null => {
    try {
      return localStorage.getItem('openai_api_key');
    } catch (error) {
      console.error('Error al obtener la API key:', error);
      return null;
    }
  },
  
  /**
   * Elimina la API key del almacenamiento local
   */
  removeApiKey: (): void => {
    try {
      localStorage.removeItem('openai_api_key');
    } catch (error) {
      console.error('Error al eliminar la API key:', error);
    }
  }
};

export default ApiKeyStorage;
