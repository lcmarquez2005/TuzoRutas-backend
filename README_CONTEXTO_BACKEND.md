# TuzoRutas Backend - Documento de Contexto para el Siguiente Agente

¡Hola! Si eres el agente de IA o desarrollador encargado de continuar con el desarrollo de este backend, este documento contiene todo el contexto necesario para que puedas arrancar y tomar el control del proyecto de forma inmediata y sin fricciones.

---

## 📌 Resumen del Proyecto
Este es el backend para **TuzoRutas**, una aplicación móvil construida en React Native / Expo para la movilidad inteligente en Pachuca de Soto, Hidalgo. 
El objetivo primordial de este backend es proveer una **API REST** para almacenar y consultar de forma persistente rutas de transporte público, incluyendo la secuencia exacta de sus coordenadas de trayectoria y sus paradas autorizadas.

---

## 🛠️ Pila Tecnológica Implementada
- **Entorno de Ejecución**: Node.js (v18+) con **TypeScript** configurado en modo ES Modules (`ESM`).
- **Framework Web**: **Express.js** para la creación de la API REST.
- **Base de Datos**: **PostgreSQL** mediante la librería cliente **`pg` (node-postgres)** utilizando un Pool de conexiones optimizado.
- **Utilidades**: 
  - `dotenv` para la gestión segura de variables de entorno mediante archivos `.env`.
  - `cors` habilitado globalmente para admitir llamadas directas desde la aplicación móvil.
  - `ts-node-dev` para recarga automática del servidor durante el desarrollo (`npm run dev`).
  - `rimraf` para la limpieza de compilaciones previas.

---

## 📂 Estructura del Código Fuente
El código está completamente estructurado, tipado y verificado (compila al 100% con TypeScript sin errores):

```text
TuzoRutas-backend/
├── package.json                    # Dependencias y scripts de ejecución
├── tsconfig.json                   # Configuración del compilador TypeScript
├── .env                            # Archivo local de variables de entorno (BD)
├── .env.example                    # Plantilla de variables de entorno (para compartir)
├── database.sql                    # Script de inicialización de tablas de PostgreSQL
├── README_CONTEXTO_BACKEND.md      # Este documento (Handoff)
└── src/
    ├── index.ts                    # Punto de entrada principal (Express, middlewares, puerto)
    ├── config/
    │   └── db.ts                   # Configuración de Pool de PostgreSQL y test de conexión
    ├── routes/
    │   └── rutas.ts                # Enrutador de Express para endpoints de rutas
    └── controllers/
        └── rutasController.ts      # Lógica de negocio (Consultas y Transacciones relacionales)
```

---

## 💾 Base de Datos e Integridad de Datos

La base de datos relacional PostgreSQL modela las rutas, paradas y coordenadas de la siguiente manera:
1. **`rutas`**: Cabecera con datos de la ruta (id, nombre, color, distancia en km, fecha de creación).
2. **`coordenadas_trayectoria`**: Puntos geográficos ordenados de manera secuencial mediante un campo numérico `orden` para poder dibujar la línea (`Polyline`) sobre el mapa sin deformaciones.
3. **`paradas`**: Puntos de interés específicos en el mapa que representan las paradas autorizadas de dicha ruta.

> [!NOTE]
> Todo el diseño de creación de tablas se encuentra listo en el archivo **[database.sql](file:///home/lcmarquez/Documents/Github/TuzoRutas-backend/database.sql)**.

---

## 🌐 Endpoints Listos en la API REST

Los endpoints responden bajo el prefijo `/api/rutas` y están totalmente adaptados al formato JSON que consume la aplicación móvil:

### 1. `GET /api/rutas`
* **Controlador**: `obtenerRutas` en `src/controllers/rutasController.ts`.
* **Función**: Realiza consultas concurrentes a PostgreSQL y unifica la información de las tablas en un formato JSON anidado. Mapea automáticamente los campos de BD (`latitud` / `longitud`) a la estructura del frontend móvil (`lat` / `lng`).

### 2. `POST /api/rutas`
* **Controlador**: `crearRuta` en `src/controllers/rutasController.ts`.
* **Función**: Registra una nueva ruta de forma segura mediante una **transacción relacional SQL (`BEGIN` / `COMMIT` / `ROLLBACK`)**. Si la inserción de coordenadas o de paradas falla, revierte todo para evitar dejar registros incompletos o huérfanos.

---

## 📋 Tareas Pendientes para el Agente del Backend

Si eres el agente encargado de continuar con el desarrollo de este backend, aquí tienes los pasos y tareas prioritarias por realizar:

### Paso 1: Instalar e Inicializar PostgreSQL (Específico para Arch Linux)
Dado que el sistema es **Arch Linux**, es necesario instalar el servidor e inicializar el cluster de datos antes de poder arrancar el servicio de systemd (el cual no viene pre-configurado de fábrica):

1. **Instalar el servidor de PostgreSQL**:
   ```bash
   sudo pacman -S postgresql
   ```
2. **Inicializar el cluster de almacenamiento de la base de datos** (bajo el usuario `postgres`):
   ```bash
   sudo -u postgres initdb -D /var/lib/postgres/data
   ```
3. **Iniciar y habilitar el servicio en systemd**:
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

### Paso 2: Inicializar la Base de Datos
1. Accede a PostgreSQL y crea la base de datos llamada `tuzorutas`. Puedes usar el cliente `psql`:
   ```bash
   sudo -u postgres psql
   # Dentro de psql ejecutamos:
   CREATE DATABASE tuzorutas;
   \q
   ```
2. Corre el script de inicialización para poblar las tablas con datos semilla:
   ```bash
   psql -U postgres -d tuzorutas -f database.sql
   ```
3. Asegúrate de configurar el usuario y contraseña correctos en tu archivo **`.env`**.

### Paso 3: Arrancar el Backend en Desarrollo
Instala dependencias y corre el backend:
```bash
npm install
npm run dev
```
El servidor debe arrancar en `http://localhost:3000`. Puedes verificarlo abriendo `http://localhost:3000/` en tu navegador para ver la respuesta del healthcheck.

### Paso 4: Propuestas de Expansión
* **Autenticación**: Crear un sistema de Login/Registro de usuarios (ej: Choferes o Administradores) con JWT.
* **Integración PostGIS**: Modificar las tablas para almacenar las coordenadas mediante tipos nativos geográficos `GEOMETRY(Point, 4326)` o `GEOGRAPHY`.
* **Rutas Cercanas (Query Espacial)**: Implementar un endpoint `GET /api/rutas/cercanas?lat=XX&lng=XX&radio=1000` que utilice PostGIS (`ST_DWithin`) para obtener las rutas que pasan cerca del usuario en tiempo real.
