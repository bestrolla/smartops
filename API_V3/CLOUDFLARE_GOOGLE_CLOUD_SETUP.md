# 🌐 Configuración SmartOps - Google Cloud + Cloudflare

## 📋 Resumen de la Implementación

Se ha implementado un sistema completo de perfiles públicos que permite acceder a los perfiles de tenant mediante URLs limpias como `smartopsve.com/nombre-usuario`.

### ✅ Archivos Implementados

```
src/
├── middleware/
│   └── enhanced-tenant.middleware.js    ← Detección mejorada de tenants
├── routes/
│   └── public-profile.routes.js         ← Rutas públicas de perfiles
├── app.js                               ← Modificado para integrar nuevas rutas
└── test-profile-slugs.js               ← Script de testing
```

## 🏗️ Arquitectura del Sistema

### 🔄 Flujo de Requests

```
1. Usuario visita: smartopsve.com/asuimagen
   ↓
2. Cloudflare DNS → Google Cloud Load Balancer
   ↓
3. enhancedTenantDetection middleware:
   - Extrae "asuimagen" de la URL
   - Busca tenant con slug="asuimagen"
   - Marca como req.isPublicProfile = true
   ↓
4. public-profile.routes.js maneja la request:
   - Obtiene perfil del tenant
   - Si es browser: HTML con SEO
   - Si es API: JSON
   ↓
5. Respuesta optimizada con cache headers
```

## ☁️ Configuración en Google Cloud

### 1. **Cloud Run Services**

```bash
# Buildear y deployar el backend
gcloud builds submit --tag gcr.io/TU-PROJECT-ID/smartops-api .
gcloud run deploy smartops-api \
  --image gcr.io/TU-PROJECT-ID/smartops-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,MONGO_URI=tu-mongo-uri
```

### 2. **Load Balancer Configuration**

```yaml
# load-balancer.yaml
apiVersion: compute.googleapis.com/v1
kind: GlobalAddress
metadata:
  name: smartops-ip
spec:
  ipVersion: IPV4
---
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: smartops-ssl
spec:
  domains:
    - smartopsve.com
    - www.smartopsve.com
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: smartops-ingress
  annotations:
    kubernetes.io/ingress.global-static-ip-name: "smartops-ip"
    networking.gke.io/managed-certificates: "smartops-ssl"
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.allow-http: "false"
spec:
  rules:
  - host: smartopsve.com
    http:
      paths:
      - path: /*
        pathType: Prefix
        backend:
          service:
            name: smartops-api
            port:
              number: 80
```

### 3. **Variables de Entorno**

```bash
# En Cloud Run, configurar estas variables:
NODE_ENV=production
PORT=8080
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartops
CORS_ORIGIN=https://smartopsve.com,https://www.smartopsve.com
GOOGLE_CLOUD_PROJECT=tu-project-id
```

## 🌐 Configuración en Cloudflare

### 1. **DNS Records**

```
Tipo: A
Nombre: @
IPv4: [IP_DEL_LOAD_BALANCER_GOOGLE_CLOUD]
Proxied: ✅ Sí
TTL: Auto

Tipo: A
Nombre: www
IPv4: [IP_DEL_LOAD_BALANCER_GOOGLE_CLOUD]
Proxied: ✅ Sí
TTL: Auto

Tipo: CNAME
Nombre: api
Target: smartopsve.com
Proxied: ✅ Sí
TTL: Auto
```

### 2. **Page Rules** (Orden importante)

```
Prioridad 1:
URL: smartopsve.com/api/*
Settings:
- Cache Level: Bypass
- SSL: Full (strict)

Prioridad 2:
URL: smartopsve.com/*
Settings:
- Cache Level: Standard
- Browser Cache TTL: 4 hours
- Edge Cache TTL: 2 hours
- SSL: Full (strict)
```

### 3. **SSL/TLS Configuration**

```
SSL/TLS Mode: Full (strict)
Edge Certificates: ✅ Enabled
Always Use HTTPS: ✅ Enabled
HTTP Strict Transport Security (HSTS): ✅ Enabled
Minimum TLS Version: 1.2
```

### 4. **Speed Optimizations**

```
Auto Minify:
- JavaScript: ✅ On
- CSS: ✅ On
- HTML: ✅ On

Rocket Loader: ✅ On
Mirage: ✅ On
Polish: Lossless
```

## 🚀 Deployment Instructions

### Paso 1: Preparar el Proyecto

```bash
# 1. Clonar y preparar el código
git clone tu-repo
cd SmartOps_Api_V3

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.production
# Editar .env.production con tus valores
```

### Paso 2: Crear Dockerfile Optimizado

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runner
WORKDIR /app

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 smartops

# Copiar aplicación
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Cambiar permisos
RUN chown -R smartops:nodejs /app
USER smartops

# Exponer puerto
EXPOSE 8080
ENV PORT 8080

# Comando de inicio
CMD ["node", "src/app.js"]
```

### Paso 3: Deploy a Google Cloud

```bash
# 1. Configurar gcloud
gcloud auth login
gcloud config set project TU-PROJECT-ID

# 2. Build y deploy
gcloud builds submit --tag gcr.io/TU-PROJECT-ID/smartops-api

gcloud run deploy smartops-api \
  --image gcr.io/TU-PROJECT-ID/smartops-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file .env.production

# 3. Obtener la URL del servicio
gcloud run services describe smartops-api --region us-central1
```

### Paso 4: Configurar Load Balancer

```bash
# 1. Reservar IP estática
gcloud compute addresses create smartops-ip --global

# 2. Obtener la IP
gcloud compute addresses describe smartops-ip --global

# 3. Aplicar configuración de Ingress
kubectl apply -f load-balancer.yaml
```

### Paso 5: Configurar Cloudflare

1. **Agregar el dominio a Cloudflare**
2. **Configurar DNS records con la IP del Load Balancer**
3. **Configurar Page Rules y SSL**
4. **Activar optimizaciones de velocidad**

## 🧪 Testing

### Ejecutar el Script de Testing

```bash
# Desde el directorio del proyecto
node test-profile-slugs.js
```

### Tests Manuales

```bash
# 1. Test de salud del servicio
curl https://smartopsve.com/health

# 2. Test de perfil público (HTML)
curl -H "Accept: text/html" https://smartopsve.com/asuimagen

# 3. Test de API JSON
curl -H "Accept: application/json" https://smartopsve.com/asuimagen
curl https://smartopsve.com/api/profile/asuimagen

# 4. Test de tenant no encontrado
curl https://smartopsve.com/no-existe
```

## 📊 URLs del Sistema

### 🌐 Perfiles Públicos
```
https://smartopsve.com/asuimagen          → Perfil HTML con SEO
https://smartopsve.com/juan-perez         → Otro perfil
https://smartopsve.com/dr-rodriguez       → Otro perfil
```

### 🔗 APIs JSON
```
https://smartopsve.com/api/profile/asuimagen     → Datos JSON del perfil
https://smartopsve.com/asuimagen/data            → Datos JSON alternativos
```

### ⚙️ Panel Administrativo
```
https://smartopsve.com/mi-negocio/dashboard      → Admin por nombre
https://smartopsve.com/admin-panel/settings      → Configuración
```

### 🛠️ APIs del Sistema
```
https://smartopsve.com/api/profiles/:tenant_id   → API de perfiles autenticada
https://smartopsve.com/api/public/tenant/:slug   → API pública de tenants
https://smartopsve.com/api/health                → Health check
```

## 🔧 Configuración Adicional

### CORS Headers
```javascript
// Ya configurado en app.js
origin: [
  'https://smartopsve.com',
  'https://www.smartopsve.com',
  'https://admin.smartopsve.com'
]
```

### Cache Headers
```javascript
// Configurado automáticamente:
// - Perfiles HTML: 5 min browser, 10 min CDN
// - APIs JSON: 3 min browser, 5 min CDN
```

### SEO Optimization
```html
<!-- Metadatos automáticos en HTML: -->
<title>Nombre Usuario - Título | SmartOps</title>
<meta name="description" content="Bio del usuario">
<meta property="og:title" content="...">
<meta property="og:url" content="https://smartopsve.com/slug">
<link rel="canonical" href="https://smartopsve.com/slug">
```

## 🚨 Troubleshooting

### Error: "Tenant no encontrado"
```
1. Verificar que el tenant existe en la base de datos
2. Verificar que el tenant esté activo (isActive: true)
3. Verificar que el slug sea correcto
```

### Error: "Perfil no configurado"
```
1. El tenant existe pero no tiene perfil
2. Crear perfil desde el panel de administración
3. O usar el script de ejemplo para crear datos de prueba
```

### Error 500 en producción
```
1. Verificar variables de entorno
2. Verificar conexión a MongoDB
3. Revisar logs de Cloud Run:
   gcloud logging read "resource.type=cloud_run_revision"
```

## 📈 Monitoring

### Métricas a Monitorear
```
- Requests por minuto a perfiles públicos
- Tiempo de respuesta de perfiles
- Cache hit ratio en Cloudflare
- Errores 404 vs 500
- Uso de memoria y CPU en Cloud Run
```

### Logs Importantes
```
- "Tenant detectado por slug" → Funcionamiento normal
- "Tenant no encontrado" → 404 esperado
- "Error en perfil público" → Investigar
```

---

## ✅ Checklist de Deployment

- [ ] Código implementado y testeado localmente
- [ ] Variables de entorno configuradas
- [ ] Dockerfile creado y optimizado
- [ ] Build exitoso en Google Cloud
- [ ] Cloud Run service deployado
- [ ] Load Balancer configurado con SSL
- [ ] IP estática reservada y configurada
- [ ] DNS configurado en Cloudflare
- [ ] Page Rules aplicadas
- [ ] SSL/TLS configurado en modo Full (strict)
- [ ] Tests manuales ejecutados
- [ ] Script de testing ejecutado
- [ ] Monitoring configurado
- [ ] Documentación actualizada

**¡Tu sistema SmartOps con perfiles públicos está listo para producción!** 🚀
