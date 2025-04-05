
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'fossil.db');
const db = new Database(DB_PATH);

// Initialize tables if they don't exist
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      nombre TEXT,
      role TEXT NOT NULL
    )
  `);

  // Proyectos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS proyectos (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      fechaCreacion TEXT NOT NULL,
      fechaActualizacion TEXT NOT NULL
    )
  `);

  // Actividades table
  db.exec(`
    CREATE TABLE IF NOT EXISTS actividades (
      id TEXT PRIMARY KEY,
      proyectoId TEXT NOT NULL,
      nombre TEXT NOT NULL,
      sistema TEXT,
      subsistema TEXT,
      fechaInicio TEXT NOT NULL,
      fechaFin TEXT NOT NULL,
      duracion INTEGER,
      FOREIGN KEY (proyectoId) REFERENCES proyectos(id) ON DELETE CASCADE
    )
  `);

  // ITRB table
  db.exec(`
    CREATE TABLE IF NOT EXISTS itrbs (
      id TEXT PRIMARY KEY,
      actividadId TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      cantidadTotal INTEGER NOT NULL,
      cantidadRealizada INTEGER NOT NULL,
      fechaInicio TEXT NOT NULL,
      estado TEXT NOT NULL,
      fechaLimite TEXT NOT NULL,
      mcc INTEGER NOT NULL,
      observaciones TEXT,
      codigoITR TEXT,
      FOREIGN KEY (actividadId) REFERENCES actividades(id) ON DELETE CASCADE
    )
  `);

  // Alertas table
  db.exec(`
    CREATE TABLE IF NOT EXISTS alertas (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      fechaCreacion TEXT NOT NULL,
      leida INTEGER NOT NULL,
      itemsRelacionados TEXT,
      proyectoId TEXT
    )
  `);

  // KPI Config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS kpiConfig (
      id INTEGER PRIMARY KEY,
      nombreKPI1 TEXT,
      nombreKPI2 TEXT,
      nombreKPI3 TEXT,
      nombreKPI4 TEXT,
      kpiPersonalizado1 TEXT,
      kpiPersonalizado2 TEXT,
      kpiPersonalizado3 TEXT,
      kpiPersonalizado4 TEXT,
      itrVencidosMostrar TEXT
    )
  `);

  // API Keys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS apiKeys (
      id INTEGER PRIMARY KEY,
      openAI TEXT,
      aiModel TEXT
    )
  `);

  // Check for default users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    // Add default users
    db.prepare('INSERT INTO users (email, nombre, role) VALUES (?, ?, ?)').run('admin@example.com', 'Administrador', 'admin');
    db.prepare('INSERT INTO users (email, nombre, role) VALUES (?, ?, ?)').run('tecnico@example.com', 'Técnico', 'tecnico');
    db.prepare('INSERT INTO users (email, nombre, role) VALUES (?, ?, ?)').run('viewer@example.com', 'Visualizador', 'viewer');
  }

  // Check for KPI config
  const kpiConfigCount = db.prepare('SELECT COUNT(*) as count FROM kpiConfig').get();
  if (kpiConfigCount.count === 0) {
    // Add default KPI configuration
    db.prepare(`
      INSERT INTO kpiConfig 
      (nombreKPI1, nombreKPI2, nombreKPI3, nombreKPI4, kpiPersonalizado1, kpiPersonalizado2, kpiPersonalizado3, kpiPersonalizado4, itrVencidosMostrar) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Avance Físico', 
      'Total ITRs', 
      'ITRs Realizados', 
      'Actividades Vencidas', 
      'avanceFisico', 
      'totalITRB', 
      'realizadosITRB', 
      'actividadesVencidas',
      'total'
    );
  }
}

initializeDatabase();

module.exports = db;
