# Configuración de Entornos - SmartOps Admin

## Descripción
Este proyecto está configurado para trabajar con diferentes entornos (desarrollo local y producción en Google Cloud).

## URLs de API
- **Desarrollo local**: `http://localhost:5001/api`
- **Producción**: `https://smartops-api-147414442.us-west1.run.app/api`

## Configuración Automática
El sistema detecta automáticamente el entorno:
- En **desarrollo** (`npm run dev`): usa la URL local
- En **producción** (`npm run build`): usa la URL de Google Cloud

## Variables de Entorno (Opcional)
Si necesitas personalizar las URLs, puedes crear archivos de entorno:

### Para desarrollo local
Crear archivo `.env.local`:
```env
VITE_API_URL=http://localhost:5001/api
VITE_ENV=development
```

### Para producción
Crear archivo `.env.production`:
```env
VITE_API_URL=https://smartops-api-147414442.us-west1.run.app/api
VITE_ENV=production
```

## Comandos de Desarrollo

### Desarrollo local
```bash
npm run dev
```
- Usa automáticamente `http://localhost:5001/api`

### Construcción para producción
```bash
npm run build
```
- Usa automáticamente `https://smartops-api-147414442.us-west1.run.app/api`

### Vista previa de producción
```bash
npm run preview
```
- Usa la configuración de producción

## Debug
En desarrollo, la configuración se muestra en la consola del navegador para verificar que esté usando la URL correcta.

## Archivos de Configuración
- `src/lib/config.ts`: Configuración centralizada
- `src/lib/api.ts`: Cliente HTTP con configuración automática
- `vite.config.ts`: Configuración de Vite para variables de entorno 