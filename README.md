# AdoFitness Fullstack

Proyecto listo con **API (Node/Express)** y **Frontend (HTML/CSS/JS)**.

## Requisitos
- Node.js 18+

## 1) Iniciar la API
```bash
cd api
npm install
npm run dev   # o: npm start
# API en http://localhost:4000
```

### Endpoints
- `GET /api/health` → estado del servidor
- `GET /api/plans` → planes
- `GET /api/classes` → clases
- `GET /api/trainers` → entrenadores
- `GET /api/schedule` → horario
- `POST /api/bookings` → crear reserva `{clase, cuando, nombre, email}`
- `POST /api/contact` → enviar contacto `{nombre, email, plan, mensaje?}`
- `GET /api/schedule/ics?dia=...&hora=...&clase=...&coach=...` → descarga .ics

## 2) Abrir el Frontend
- Abre `frontend/index.html` en el navegador. Recomendado: **Live Server** en VS Code.
- El frontend consume `http://localhost:4000`.

## Notas
- Los datos se guardan en `api/data/*.json`.
- Este proyecto es demo: no hay autenticación ni base de datos. Se puede migrar a Mongo/Postgres.
- Para despliegue (Railway/Render/VPS), expón el puerto de la API y sirve el frontend como estático.
