
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../dist')));

// API Routes

// Users
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { email, nombre, role } = req.body;
    
    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    db.prepare('INSERT INTO users (email, nombre, role) VALUES (?, ?, ?)').run(email, nombre, role);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:email', (req, res) => {
  try {
    const { email } = req.params;
    const { nombre, role } = req.body;
    
    db.prepare('UPDATE users SET nombre = ?, role = ? WHERE email = ?').run(nombre, role, email);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:email', (req, res) => {
  try {
    const { email } = req.params;
    db.prepare('DELETE FROM users WHERE email = ?').run(email);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Proyectos
app.get('/api/proyectos', (req, res) => {
  try {
    const proyectos = db.prepare('SELECT * FROM proyectos').all();
    res.json(proyectos);
  } catch (error) {
    console.error('Error fetching proyectos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/proyectos', (req, res) => {
  try {
    const { titulo, descripcion } = req.body;
    const id = uuidv4();
    const fechaCreacion = new Date().toISOString();
    const fechaActualizacion = fechaCreacion;
    
    db.prepare('INSERT INTO proyectos (id, titulo, descripcion, fechaCreacion, fechaActualizacion) VALUES (?, ?, ?, ?, ?)')
      .run(id, titulo, descripcion, fechaCreacion, fechaActualizacion);
      
    const newProyecto = db.prepare('SELECT * FROM proyectos WHERE id = ?').get(id);
    res.status(201).json(newProyecto);
  } catch (error) {
    console.error('Error creating proyecto:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/proyectos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;
    const fechaActualizacion = new Date().toISOString();
    
    db.prepare('UPDATE proyectos SET titulo = ?, descripcion = ?, fechaActualizacion = ? WHERE id = ?')
      .run(titulo, descripcion, fechaActualizacion, id);
      
    const updatedProyecto = db.prepare('SELECT * FROM proyectos WHERE id = ?').get(id);
    res.json(updatedProyecto);
  } catch (error) {
    console.error('Error updating proyecto:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/proyectos/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM proyectos WHERE id = ?').run(id);
    res.json({ message: 'Proyecto deleted successfully' });
  } catch (error) {
    console.error('Error deleting proyecto:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Actividades
app.get('/api/actividades', (req, res) => {
  try {
    const actividades = db.prepare('SELECT * FROM actividades').all();
    res.json(actividades);
  } catch (error) {
    console.error('Error fetching actividades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/actividades', (req, res) => {
  try {
    const { proyectoId, nombre, sistema, subsistema, fechaInicio, fechaFin, duracion } = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO actividades (id, proyectoId, nombre, sistema, subsistema, fechaInicio, fechaFin, duracion) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, proyectoId, nombre, sistema, subsistema, fechaInicio, fechaFin, duracion);
      
    const newActividad = db.prepare('SELECT * FROM actividades WHERE id = ?').get(id);
    res.status(201).json(newActividad);
  } catch (error) {
    console.error('Error creating actividad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/actividades/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { proyectoId, nombre, sistema, subsistema, fechaInicio, fechaFin, duracion } = req.body;
    
    db.prepare(`
      UPDATE actividades 
      SET proyectoId = ?, nombre = ?, sistema = ?, subsistema = ?, fechaInicio = ?, fechaFin = ?, duracion = ?
      WHERE id = ?
    `).run(proyectoId, nombre, sistema, subsistema, fechaInicio, fechaFin, duracion, id);
      
    const updatedActividad = db.prepare('SELECT * FROM actividades WHERE id = ?').get(id);
    res.json(updatedActividad);
  } catch (error) {
    console.error('Error updating actividad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/actividades/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM actividades WHERE id = ?').run(id);
    res.json({ message: 'Actividad deleted successfully' });
  } catch (error) {
    console.error('Error deleting actividad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ITRBs
app.get('/api/itrbs', (req, res) => {
  try {
    const itrbs = db.prepare('SELECT * FROM itrbs').all();
    res.json(itrbs);
  } catch (error) {
    console.error('Error fetching ITRBs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/itrbs', (req, res) => {
  try {
    const { actividadId, descripcion, cantidadTotal, cantidadRealizada, fechaInicio, estado, fechaLimite, mcc, observaciones, codigoITR } = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO itrbs (id, actividadId, descripcion, cantidadTotal, cantidadRealizada, fechaInicio, estado, fechaLimite, mcc, observaciones, codigoITR) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, actividadId, descripcion, cantidadTotal, cantidadRealizada, fechaInicio, estado, fechaLimite, mcc ? 1 : 0, observaciones, codigoITR);
      
    const newITRB = db.prepare('SELECT * FROM itrbs WHERE id = ?').get(id);
    res.status(201).json(newITRB);
  } catch (error) {
    console.error('Error creating ITRB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/itrbs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { actividadId, descripcion, cantidadTotal, cantidadRealizada, fechaInicio, estado, fechaLimite, mcc, observaciones, codigoITR } = req.body;
    
    db.prepare(`
      UPDATE itrbs 
      SET actividadId = ?, descripcion = ?, cantidadTotal = ?, cantidadRealizada = ?, 
          fechaInicio = ?, estado = ?, fechaLimite = ?, mcc = ?, observaciones = ?, codigoITR = ?
      WHERE id = ?
    `).run(actividadId, descripcion, cantidadTotal, cantidadRealizada, fechaInicio, estado, fechaLimite, mcc ? 1 : 0, observaciones, codigoITR, id);
      
    const updatedITRB = db.prepare('SELECT * FROM itrbs WHERE id = ?').get(id);
    res.json(updatedITRB);
  } catch (error) {
    console.error('Error updating ITRB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/itrbs/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM itrbs WHERE id = ?').run(id);
    res.json({ message: 'ITRB deleted successfully' });
  } catch (error) {
    console.error('Error deleting ITRB:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Alertas
app.get('/api/alertas', (req, res) => {
  try {
    const alertas = db.prepare('SELECT * FROM alertas').all();
    res.json(alertas);
  } catch (error) {
    console.error('Error fetching alertas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/alertas', (req, res) => {
  try {
    const { tipo, mensaje, fechaCreacion, leida, itemsRelacionados, proyectoId } = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO alertas (id, tipo, mensaje, fechaCreacion, leida, itemsRelacionados, proyectoId) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, tipo, mensaje, fechaCreacion, leida ? 1 : 0, JSON.stringify(itemsRelacionados), proyectoId);
      
    const newAlerta = db.prepare('SELECT * FROM alertas WHERE id = ?').get(id);
    res.status(201).json(newAlerta);
  } catch (error) {
    console.error('Error creating alerta:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/alertas/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { leida } = req.body;
    
    db.prepare('UPDATE alertas SET leida = ? WHERE id = ?').run(leida ? 1 : 0, id);
      
    const updatedAlerta = db.prepare('SELECT * FROM alertas WHERE id = ?').get(id);
    res.json(updatedAlerta);
  } catch (error) {
    console.error('Error updating alerta:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/alertas/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM alertas WHERE id = ?').run(id);
    res.json({ message: 'Alerta deleted successfully' });
  } catch (error) {
    console.error('Error deleting alerta:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// KPI Config
app.get('/api/kpiconfig', (req, res) => {
  try {
    const kpiConfig = db.prepare('SELECT * FROM kpiConfig LIMIT 1').get();
    res.json(kpiConfig || {});
  } catch (error) {
    console.error('Error fetching KPI config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/kpiconfig', (req, res) => {
  try {
    const { nombreKPI1, nombreKPI2, nombreKPI3, nombreKPI4, kpiPersonalizado1, kpiPersonalizado2, kpiPersonalizado3, kpiPersonalizado4, itrVencidosMostrar } = req.body;
    
    db.prepare(`
      UPDATE kpiConfig SET 
      nombreKPI1 = ?, nombreKPI2 = ?, nombreKPI3 = ?, nombreKPI4 = ?,
      kpiPersonalizado1 = ?, kpiPersonalizado2 = ?, kpiPersonalizado3 = ?, kpiPersonalizado4 = ?,
      itrVencidosMostrar = ?
      WHERE id = 1
    `).run(nombreKPI1, nombreKPI2, nombreKPI3, nombreKPI4, kpiPersonalizado1, kpiPersonalizado2, kpiPersonalizado3, kpiPersonalizado4, itrVencidosMostrar);
    
    const updatedKpiConfig = db.prepare('SELECT * FROM kpiConfig WHERE id = 1').get();
    res.json(updatedKpiConfig);
  } catch (error) {
    console.error('Error updating KPI config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Keys
app.get('/api/apikeys', (req, res) => {
  try {
    const apiKeys = db.prepare('SELECT * FROM apiKeys LIMIT 1').get();
    res.json(apiKeys || {});
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/apikeys', (req, res) => {
  try {
    const { openAI, aiModel } = req.body;
    
    // Check if record exists
    const exists = db.prepare('SELECT COUNT(*) as count FROM apiKeys').get();
    
    if (exists.count === 0) {
      db.prepare('INSERT INTO apiKeys (id, openAI, aiModel) VALUES (1, ?, ?)').run(openAI, aiModel);
    } else {
      db.prepare('UPDATE apiKeys SET openAI = ?, aiModel = ? WHERE id = 1').run(openAI, aiModel);
    }
    
    const updatedApiKeys = db.prepare('SELECT * FROM apiKeys WHERE id = 1').get();
    res.json(updatedApiKeys);
  } catch (error) {
    console.error('Error updating API keys:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify login
app.post('/api/login', (req, res) => {
  try {
    const { email } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch all other routes and return the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
