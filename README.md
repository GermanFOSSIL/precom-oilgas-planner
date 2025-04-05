
# FOSSIL Precom Track Plan

Sistema de seguimiento para planes de precomisionamiento con base de datos SQLite.

## Requisitos previos

- Node.js (versión 14 o superior)
- NPM (viene con Node.js)

## Instalación

1. Clona este repositorio:
   ```
   git clone <url-del-repositorio>
   cd fossil-precom-track
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Configura la base de datos SQLite:
   ```
   node src/server/setup.js
   ```

## Ejecutar la aplicación

### Ambiente de desarrollo

Para ejecutar la aplicación en modo desarrollo:

```
npm run start:dev
```

Esto iniciará el servidor Express y la aplicación React en modo desarrollo.

### Ambiente de producción

Para ejecutar la aplicación en modo producción:

1. Primero, construye la aplicación:
   ```
   npm run build
   ```

2. Luego, inicia el servidor:
   ```
   npm run start
   ```

La aplicación estará disponible en `http://localhost:3000`.

## Estructura de la base de datos

La aplicación utiliza SQLite como base de datos. La base de datos se crea automáticamente en la carpeta `data/` cuando se ejecuta el script de configuración (`setup.js`).

### Tablas principales:

- `users`: Usuarios del sistema
- `proyectos`: Proyectos de precomisionamiento
- `actividades`: Actividades de cada proyecto
- `itrbs`: Items ITR-B asociados a las actividades
- `alertas`: Sistema de alertas y notificaciones
- `kpiConfig`: Configuración de indicadores KPI
- `apiKeys`: Claves de API (para integraciones)

## Usuarios predeterminados

La aplicación viene con tres usuarios predeterminados:

- Admin: admin@example.com
- Técnico: tecnico@example.com
- Visualizador: viewer@example.com

## Respaldo y restauración

La base de datos SQLite se guarda en un archivo en la carpeta `data/`. Se recomienda hacer copias de seguridad periódicas de este archivo.

## Acceso a los datos

Los datos se acceden a través de una API RESTful implementada con Express. Las rutas principales son:

- `/api/users`: Gestión de usuarios
- `/api/proyectos`: Gestión de proyectos
- `/api/actividades`: Gestión de actividades
- `/api/itrbs`: Gestión de ITR-Bs
- `/api/alertas`: Gestión de alertas
- `/api/kpiconfig`: Configuración de KPIs
- `/api/apikeys`: Gestión de claves de API
- `/api/login`: Autenticación de usuarios
