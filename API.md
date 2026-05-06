# 📖 Documentación de la API de TuzoRutas (Contrato Frontend-Backend)

Este documento define el contrato de comunicación oficial entre la aplicación móvil (Frontend) y el servidor (Backend). Mantener este archivo sincronizado en ambos repositorios garantiza que ambos agentes/equipos de desarrollo sepan exactamente qué enviar, qué recibir y sobre qué URLs trabajar, evitando problemas de integración.

---

## 🌍 URL Base del Servidor

* **Desarrollo (Local en PC)**: `http://localhost:3000/api`
* **Desarrollo (Pruebas en Celular Físico)**: Usar URL de túnel como Ngrok (ej: `https://tu-subdominio.ngrok-free.app/api`)
* **Producción**: `[Pendiente de definir]`

---

## 🚀 1. Endpoints Implementados (Fase 1)

Estos endpoints **ya están desarrollados en el backend** y listos para ser consumidos por el frontend a través de `fetch` o `axios`.

### A. Listar Todas las Rutas
Obtiene el catálogo completo de rutas, incluyendo las coordenadas precisas de sus trayectorias (para dibujar las líneas en el mapa) y las ubicaciones de sus paradas autorizadas.

* **Método**: `GET`
* **Ruta**: `/rutas`
* **Respuesta de Éxito (`200 OK`)**:
```json
[
  {
    "id": "1",
    "nombre": "Tulipanes - Soriana del Valle",
    "color": "#1E90FF",
    "distancia_km": 4.12,
    "trayectoria": [
      { "lat": 20.061532, "lng": -98.774230 },
      { "lat": 20.065462, "lng": -98.771543 }
    ],
    "paradas": [
      { "nombre": "Soriana del Valle", "lat": 20.096733, "lng": -98.759784 }
    ]
  }
]
```

### B. Guardar una Nueva Ruta Trazada (GPS)
Recibe la información recolectada por el celular al trazar una nueva ruta (`TrackRoutes.tsx`) y la guarda de forma persistente en la base de datos de manera transaccional.

* **Método**: `POST`
* **Ruta**: `/rutas`
* **Cuerpo de la Petición (`Request Body`)**:
```json
{
  "nombre": "Ruta Centro Express",
  "color": "#FF0000",
  "distancia_km": 2.35,
  "trayectoria": [
    { "lat": 20.1011, "lng": -98.7591 },
    { "lat": 20.1020, "lng": -98.7580 }
  ],
  "paradas": [
    { "nombre": "Plaza Independencia", "lat": 20.1011, "lng": -98.7591 }
  ]
}
```
* **Respuesta de Éxito (`211 Created`)**:
```json
{
  "mensaje": "Ruta trazada y guardada exitosamente en el servidor",
  "rutaId": 5
}
```

---

## 🔮 2. Endpoints Propuestos (Próximos Desarrollos)

Estos endpoints están planeados para futuras iteraciones y **deben ser desarrollados en el backend** antes de que el frontend intente consumirlos.

### C. Buscar Rutas Cercanas por Ubicación
Permitirá a la aplicación móvil (`InicioScreen.tsx`) enviar la ubicación actual del usuario y descubrir qué rutas de transporte pasan cerca de él.
* **Método**: `GET`
* **Ruta**: `/rutas/cercanas?lat={latitud}&lng={longitud}&radio={metros}`
* **Parámetros URL**:
  - `lat` (float): Latitud del usuario.
  - `lng` (float): Longitud del usuario.
  - `radio` (int): Distancia máxima de búsqueda en metros (ej. 1000).
* **Respuesta Esperada (`200 OK`)**: Mismo arreglo de rutas que el `GET /rutas`, pero filtrado por proximidad.

### D. Autenticación de Operadores/Administradores
Para restringir quién tiene permisos para trazar y guardar nuevas rutas en el servidor.
* **Método**: `POST`
* **Ruta**: `/auth/login`
* **Cuerpo Esperado (`Request Body`)**: 
```json
{ 
  "usuario": "chofer_01", 
  "password": "mi_password_seguro" 
}
```
* **Respuesta Esperada (`200 OK`)**: Token JWT para adjuntar en los headers de peticiones protegidas (`Authorization: Bearer <token>`).
