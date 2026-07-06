# 🚀 Inicio Rápido - SIGEI

## Setup en 3 pasos

### 1️⃣ Instalar
```bash
npm install
```

### 2️⃣ Configurar
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Verifica que contenga:
# VITE_API_URL=/api
```

### 3️⃣ Ejecutar
```bash
npm run dev
```

Abre: `http://localhost:5173`

---

## ⚠️ Si ves errores

### Error de CORS
```
✅ Solución: Ya está configurado el proxy en vite.config.js
✅ Acción: Reinicia el servidor (Ctrl+C → npm run dev)
```

### Error 404
```
❌ El backend no responde en: https://lab.vallegrande.edu.pe/sigei/gateway
✅ Verifica que el backend esté corriendo
```

### Error 401 (Unauthorized)
```
✅ El proxy funciona correctamente
❌ Credenciales incorrectas o backend rechaza la petición
✅ Prueba con credenciales válidas del sistema
```

### Variables .env no se cargan
```
✅ Reinicia COMPLETAMENTE el servidor
✅ Las variables deben empezar con VITE_
✅ Revisa: console.log(import.meta.env.VITE_API_URL)
```

---

## 🔍 Debug

### Ver si el proxy funciona
Abre la consola del navegador y busca:
```
[ApiClient] BASE_URL: /api
[Proxy →] POST /api/auth/login → https://lab.vallegrande.edu.pe/sigei/gateway/api/auth/login
[Proxy ←] 200 /api/auth/login
```

### Verificar variables de entorno
En la consola del navegador:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL)
// Debe mostrar: /api
```

---

## 📁 Archivos importantes

```
.env                   → Tu configuración local (NO commitear)
.env.example           → Plantilla de ejemplo
.env.development       → Config de desarrollo
.env.production        → Config de producción
vite.config.js         → Configuración del proxy
CONFIGURACION.md       → Documentación completa
```

---

## 🌐 URLs del Sistema

| Ambiente | URL |
|----------|-----|
| **Frontend (dev)** | `http://localhost:5173` |
| **Frontend (prod)** | `https://lab.vallegrande.edu.pe/SIGEI/` |
| **Backend (API)** | `https://lab.vallegrande.edu.pe/sigei/gateway` |
| **Keycloak** | `https://lab.vallegrande.edu.pe/keycloak/realms/sigei` |

---

## 💡 Tips

- **Siempre reinicia** el servidor después de cambiar `.env`
- **Los logs del proxy** aparecen en la terminal (donde corre npm run dev)
- **Los logs del frontend** aparecen en la consola del navegador
- **Lee `CONFIGURACION.md`** para información detallada
