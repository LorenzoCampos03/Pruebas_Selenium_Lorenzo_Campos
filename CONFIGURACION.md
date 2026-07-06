# Configuración del Proyecto SIGEI

## 🔧 Variables de Entorno

El proyecto utiliza diferentes archivos `.env` según el entorno:

### Desarrollo Local (`.env` o `.env.development`)
```env
VITE_API_URL=/api
```
**Usa una ruta relativa** para aprovechar el proxy de Vite que redirige a:
- `https://lab.vallegrande.edu.pe/sigei/gateway`

### Producción (`.env.production`)
```env
VITE_API_URL=https://lab.vallegrande.edu.pe/sigei/gateway
```
**Usa la URL completa** del backend de producción.

## 🌐 Configuración del Proxy (Desarrollo)

El archivo `vite.config.js` está configurado con un proxy que:

```
Frontend (localhost:5173)
  ↓ solicita: /api/auth/login
  ↓
Proxy de Vite intercepta
  ↓ redirige a: https://lab.vallegrande.edu.pe/sigei/gateway/api/auth/login
  ↓
Backend procesa y responde
```

**Esto evita problemas de CORS durante el desarrollo local.**

## 🚀 Cómo Usar

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# El archivo .env ya debe tener:
VITE_API_URL=/api
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```

**⚠️ IMPORTANTE:** Después de cambiar archivos `.env`, debes **reiniciar completamente** el servidor de Vite:
- Presiona `Ctrl+C` para detener
- Ejecuta `npm run dev` nuevamente

### 4. Verificar en consola del navegador
Deberías ver logs como:
```
[ApiClient] BASE_URL: /api
[Proxy →] POST /api/auth/login → https://lab.vallegrande.edu.pe/sigei/gateway/api/auth/login
[Proxy ←] 200 /api/auth/login
```

### 5. Para producción
```bash
# Asegúrate de que .env.production tenga la URL completa
VITE_API_URL=https://lab.vallegrande.edu.pe/sigei/gateway

# Construye la aplicación
npm run build
```

## 🏗️ Arquitectura

### URLs del Sistema

| Entorno | Frontend | Backend (API) | Keycloak |
|---------|----------|---------------|----------|
| **Producción** | `https://lab.vallegrande.edu.pe/SIGEI/` | `https://lab.vallegrande.edu.pe/sigei/gateway` | `https://lab.vallegrande.edu.pe/keycloak/realms/sigei` |
| **Desarrollo** | `http://localhost:5173` | `/api` (proxy → gateway) | N/A (usa backend directamente) |

### Flujo de Autenticación

```
Usuario ingresa credenciales
  ↓
LoginPage.jsx
  ↓
authService.login(username, password)
  ↓
POST /api/auth/login
  ↓ (en dev: proxy redirige)
  ↓ (en prod: va directo)
  ↓
Backend (gateway) valida con Keycloak
  ↓
Retorna: { access_token, refresh_token, profile }
  ↓
Se guarda en localStorage
  ↓
Usuario autenticado ✅
```

## 🐛 Solución de Problemas

### ❌ Error: CORS Policy
**Causa:** El proxy no está configurado o no se reinició el servidor.

**Solución:**
1. Verifica que `vite.config.js` tenga la sección `server.proxy`
2. Reinicia completamente el servidor (`Ctrl+C` → `npm run dev`)
3. Limpia caché: `npm run dev -- --force`

### ❌ Error: 404 Not Found
**Causa:** La ruta del backend es incorrecta o el backend no está corriendo.

**Solución:**
1. Verifica que el backend esté activo: `https://lab.vallegrande.edu.pe/sigei/gateway/api/auth/login`
2. Revisa los logs del proxy en la consola del terminal
3. Confirma que `VITE_API_URL=/api` en tu `.env`

### ❌ Error: 401 Unauthorized
**Causa:** Las credenciales son incorrectas o el backend rechaza la petición.

**Solución:**
1. Verifica que estés usando credenciales válidas
2. Revisa que el header `Content-Type: application/json` esté presente
3. Comprueba los logs del backend para más detalles
4. Intenta con las credenciales de prueba del sistema

### ⚠️ Variables de entorno no se cargan
**Causa:** Vite no detectó los cambios en `.env`

**Solución:**
1. Las variables **DEBEN** empezar con `VITE_` para ser accesibles
2. Reinicia **completamente** el servidor (no hot-reload)
3. Verifica con: `console.log(import.meta.env.VITE_API_URL)`

### 🔍 Debug del Proxy

Para ver logs detallados del proxy, revisa la terminal donde corre `npm run dev`:

```
[Proxy →] POST /api/auth/login → https://lab.vallegrande.edu.pe/sigei/gateway/api/auth/login
[Proxy ←] 401 /api/auth/login
```

Los logs te dirán:
- `→` Request que sale del frontend
- `←` Response que viene del backend
- Código de estado HTTP (200, 401, 404, 500, etc.)

## 📝 Notas Importantes

1. **En desarrollo local**, siempre usa `VITE_API_URL=/api` (ruta relativa)
2. **En producción**, usa `VITE_API_URL=https://lab.vallegrande.edu.pe/sigei/gateway` (URL completa)
3. El backend debe tener **CORS configurado** correctamente para producción
4. **Nunca** commitees el archivo `.env` (solo `.env.example`)
5. Si trabajas con otros desarrolladores, asegúrate de que todos tengan el mismo `.env`

## 🔐 Seguridad

⚠️ **ADVERTENCIA:** Actualmente el proyecto guarda tokens en `localStorage`, lo cual es vulnerable a ataques XSS.

**Recomendación para producción:**
- Migrar a **HttpOnly cookies** para almacenar tokens
- Implementar **CSRF protection**
- Usar **Secure flags** en cookies de producción

Ver documento `ERRORES_COMPLETOS_VG-WEB-SIGEI.md` para más detalles sobre problemas de seguridad.

---

**Última actualización:** Junio 2026  
**Mantenido por:** Equipo SIGEI - Valle Grande
