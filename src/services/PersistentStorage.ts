import { 
  Proyecto, 
  Actividad, 
  ITRB, 
  User, 
  Alerta, 
  KPIConfig, 
  APIKeys
} from '@/types';

const API_URL = 'http://localhost:3000/api';

export class PersistentStorage {
  // Users
  static async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  static async addUser(user: User): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      if (!response.ok) throw new Error('Failed to add user');
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  static async updateUser(email: string, updates: Partial<User>): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/users/${email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update user');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(email: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/users/${email}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete user');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Proyectos
  static async getProyectos(): Promise<Proyecto[]> {
    try {
      const response = await fetch(`${API_URL}/proyectos`);
      if (!response.ok) throw new Error('Failed to fetch proyectos');
      return await response.json();
    } catch (error) {
      console.error('Error fetching proyectos:', error);
      return [];
    }
  }

  static async addProyecto(proyecto: Omit<Proyecto, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Proyecto> {
    try {
      const response = await fetch(`${API_URL}/proyectos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proyecto)
      });
      if (!response.ok) throw new Error('Failed to add proyecto');
      return await response.json();
    } catch (error) {
      console.error('Error adding proyecto:', error);
      throw error;
    }
  }

  static async updateProyecto(id: string, updates: Partial<Proyecto>): Promise<Proyecto> {
    try {
      const response = await fetch(`${API_URL}/proyectos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update proyecto');
      return await response.json();
    } catch (error) {
      console.error('Error updating proyecto:', error);
      throw error;
    }
  }

  static async deleteProyecto(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/proyectos/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete proyecto');
    } catch (error) {
      console.error('Error deleting proyecto:', error);
      throw error;
    }
  }

  // Actividades
  static async getActividades(): Promise<Actividad[]> {
    try {
      const response = await fetch(`${API_URL}/actividades`);
      if (!response.ok) throw new Error('Failed to fetch actividades');
      return await response.json();
    } catch (error) {
      console.error('Error fetching actividades:', error);
      return [];
    }
  }

  static async addActividad(actividad: Omit<Actividad, 'id'>): Promise<Actividad> {
    try {
      const response = await fetch(`${API_URL}/actividades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actividad)
      });
      if (!response.ok) throw new Error('Failed to add actividad');
      return await response.json();
    } catch (error) {
      console.error('Error adding actividad:', error);
      throw error;
    }
  }

  static async updateActividad(id: string, updates: Partial<Actividad>): Promise<Actividad> {
    try {
      const response = await fetch(`${API_URL}/actividades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update actividad');
      return await response.json();
    } catch (error) {
      console.error('Error updating actividad:', error);
      throw error;
    }
  }

  static async deleteActividad(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/actividades/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete actividad');
    } catch (error) {
      console.error('Error deleting actividad:', error);
      throw error;
    }
  }

  // ITRBs
  static async getITRBItems(): Promise<ITRB[]> {
    try {
      const response = await fetch(`${API_URL}/itrbs`);
      if (!response.ok) throw new Error('Failed to fetch ITRBs');
      const itrbs = await response.json();
      
      // Convert numeric mcc to boolean
      return itrbs.map((itrb: any) => ({
        ...itrb,
        mcc: Boolean(itrb.mcc)
      }));
    } catch (error) {
      console.error('Error fetching ITRBs:', error);
      return [];
    }
  }

  static async addITRB(itrb: Omit<ITRB, 'id'>): Promise<ITRB> {
    try {
      const response = await fetch(`${API_URL}/itrbs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itrb)
      });
      if (!response.ok) throw new Error('Failed to add ITRB');
      const newItrb = await response.json();
      return {
        ...newItrb,
        mcc: Boolean(newItrb.mcc)
      };
    } catch (error) {
      console.error('Error adding ITRB:', error);
      throw error;
    }
  }

  static async updateITRB(id: string, updates: Partial<ITRB>): Promise<ITRB> {
    try {
      const response = await fetch(`${API_URL}/itrbs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update ITRB');
      const updatedItrb = await response.json();
      return {
        ...updatedItrb,
        mcc: Boolean(updatedItrb.mcc)
      };
    } catch (error) {
      console.error('Error updating ITRB:', error);
      throw error;
    }
  }

  static async deleteITRB(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/itrbs/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete ITRB');
    } catch (error) {
      console.error('Error deleting ITRB:', error);
      throw error;
    }
  }

  // Alertas
  static async getAlertas(): Promise<Alerta[]> {
    try {
      const response = await fetch(`${API_URL}/alertas`);
      if (!response.ok) throw new Error('Failed to fetch alertas');
      const alertas = await response.json();
      
      // Parse itemsRelacionados JSON
      return alertas.map((alerta: any) => ({
        ...alerta,
        leida: Boolean(alerta.leida),
        itemsRelacionados: alerta.itemsRelacionados ? JSON.parse(alerta.itemsRelacionados) : undefined
      }));
    } catch (error) {
      console.error('Error fetching alertas:', error);
      return [];
    }
  }

  static async addAlerta(alerta: Omit<Alerta, 'id'>): Promise<Alerta> {
    try {
      const response = await fetch(`${API_URL}/alertas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alerta)
      });
      if (!response.ok) throw new Error('Failed to add alerta');
      const newAlerta = await response.json();
      return {
        ...newAlerta,
        leida: Boolean(newAlerta.leida),
        itemsRelacionados: newAlerta.itemsRelacionados ? JSON.parse(newAlerta.itemsRelacionados) : undefined
      };
    } catch (error) {
      console.error('Error adding alerta:', error);
      throw error;
    }
  }

  static async updateAlerta(id: string, updates: Partial<Alerta>): Promise<Alerta> {
    try {
      const response = await fetch(`${API_URL}/alertas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update alerta');
      const updatedAlerta = await response.json();
      return {
        ...updatedAlerta,
        leida: Boolean(updatedAlerta.leida),
        itemsRelacionados: updatedAlerta.itemsRelacionados ? JSON.parse(updatedAlerta.itemsRelacionados) : undefined
      };
    } catch (error) {
      console.error('Error updating alerta:', error);
      throw error;
    }
  }

  static async deleteAlerta(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/alertas/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete alerta');
    } catch (error) {
      console.error('Error deleting alerta:', error);
      throw error;
    }
  }

  // KPI Config
  static async getKPIConfig(): Promise<KPIConfig> {
    try {
      const response = await fetch(`${API_URL}/kpiconfig`);
      if (!response.ok) throw new Error('Failed to fetch KPI config');
      return await response.json();
    } catch (error) {
      console.error('Error fetching KPI config:', error);
      return {} as KPIConfig;
    }
  }

  static async updateKPIConfig(updates: Partial<KPIConfig>): Promise<KPIConfig> {
    try {
      const response = await fetch(`${API_URL}/kpiconfig`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update KPI config');
      return await response.json();
    } catch (error) {
      console.error('Error updating KPI config:', error);
      throw error;
    }
  }

  // API Keys
  static async getAPIKeys(): Promise<APIKeys> {
    try {
      const response = await fetch(`${API_URL}/apikeys`);
      if (!response.ok) throw new Error('Failed to fetch API keys');
      return await response.json();
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return {} as APIKeys;
    }
  }

  static async updateAPIKeys(updates: Partial<APIKeys>): Promise<APIKeys> {
    try {
      const response = await fetch(`${API_URL}/apikeys`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update API keys');
      return await response.json();
    } catch (error) {
      console.error('Error updating API keys:', error);
      throw error;
    }
  }

  // Login
  static async verifyUser(email: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error verifying user:', error);
      return null;
    }
  }
}

// Export an instance for compatibility with parts of the app that need it
export const persistentStorage = PersistentStorage;
