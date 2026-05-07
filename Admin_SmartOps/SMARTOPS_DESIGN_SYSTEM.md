# SmartOps Design System

Este documento describe cómo usar el sistema de diseño de SmartOps en el dashboard administrativo.

## Colores

### Paleta de Colores Principal

```typescript
// Colores principales de SmartOps
smartops-blue: '#3956FF'        // Azul principal
smartops-blue-hover: '#00D9C3'  // Azul hover/acento
smartops-dark: '#1d1f21'        // Negro/gris oscuro
smartops-white: '#ffffff'       // Blanco
smartops-gray: '#f8f9fa'        // Gris claro
```

### Uso en Tailwind CSS

```jsx
// Clases de texto
className="text-smartops-blue"
className="text-smartops-blue-hover"
className="text-smartops-dark"
className="text-smartops-white"
className="text-smartops-gray"

// Clases de fondo
className="bg-smartops-blue"
className="bg-smartops-blue-hover"
className="bg-smartops-dark"
className="bg-smartops-white"
className="bg-smartops-gray"

// Clases de borde
className="border-smartops-blue"
className="border-smartops-blue-hover"
className="border-smartops-dark"
className="border-smartops-white"
className="border-smartops-gray"
```

### Variables CSS

Los colores también están disponibles como variables CSS:

```css
--primary: 220 100% 60%;        /* SmartOps Blue */
--accent: 180 100% 42%;         /* SmartOps Blue Hover */
--background: 0 0% 100%;        /* SmartOps White */
--foreground: 240 10% 3.9%;     /* SmartOps Dark */
--secondary: 248 100% 97%;      /* SmartOps Gray */
```

## Tipografías

### Fuentes Disponibles

```typescript
// Fuentes principales
font-montserrat: ['Montserrat', 'sans-serif']  // Fuente principal
font-ramsha: ['Ramsha', 'sans-serif']          // Fuente secundaria
```

### Uso en Componentes

```jsx
// Aplicar fuente Montserrat
className="font-montserrat"

// Aplicar fuente Ramsha
className="font-ramsha"

// Combinar con otros estilos
className="font-montserrat font-semibold text-smartops-dark"
```

## Componentes UI

### Botones

```jsx
import { Button } from '@/components/ui/button'

// Variantes de SmartOps
<Button variant="smartops">Botón Principal</Button>
<Button variant="smartopsOutline">Botón Outline</Button>
<Button variant="smartopsSecondary">Botón Secundario</Button>

// Variantes estándar (también usan colores de SmartOps)
<Button variant="default">Botón Default</Button>
<Button variant="outline">Botón Outline</Button>
<Button variant="secondary">Botón Secondary</Button>
```

### Tarjetas

```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card className="border-smartops-gray">
  <CardHeader>
    <CardTitle className="text-smartops-dark">Título</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-smartops-dark/60 font-montserrat">Contenido</p>
  </CardContent>
</Card>
```

## Utilidades

### Archivo de Utilidades

```typescript
import { smartopsColors, smartopsColorClasses, smartopsButtonStyles } from '@/lib/smartops-colors'

// Colores como valores
const blueColor = smartopsColors.blue // '#3956FF'

// Clases de Tailwind
const blueTextClass = smartopsColorClasses.blue // 'text-smartops-blue'

// Estilos de botones predefinidos
const primaryButtonClass = smartopsButtonStyles.primary
```

## Gradientes

### Gradientes Predefinidos

```jsx
// Gradiente principal SmartOps
className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover"

// Gradiente inverso
className="bg-gradient-to-r from-smartops-blue-hover to-smartops-blue"

// Gradiente neutro
className="bg-gradient-to-r from-smartops-gray to-smartops-dark"
```

## Mejores Prácticas

1. **Consistencia**: Usa siempre los colores de SmartOps para mantener la identidad visual
2. **Contraste**: Asegúrate de que el texto sea legible sobre los fondos
3. **Jerarquía**: Usa `smartops-dark` para texto principal y `smartops-dark/60` para texto secundario
4. **Interactividad**: Usa `smartops-blue-hover` para estados hover
5. **Fuentes**: Usa `font-montserrat` como fuente principal para todo el texto

## Ejemplos de Uso

### Métricas Card

```jsx
<Card className="border-smartops-gray">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-smartops-dark mb-2 font-montserrat">
          Today's Money
        </p>
        <p className="text-2xl font-bold text-smartops-dark font-montserrat">
          $53k
        </p>
      </div>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-smartops-blue to-smartops-blue-hover flex items-center justify-center">
        <DollarSign className="w-6 h-6 text-smartops-white" />
      </div>
    </div>
  </CardContent>
</Card>
```

### Botón de Acción

```jsx
<Button variant="smartops" className="font-montserrat">
  Crear Nuevo Proyecto
</Button>
```

### Texto con Jerarquía

```jsx
<div>
  <h1 className="text-2xl font-bold text-smartops-dark font-montserrat">
    Título Principal
  </h1>
  <p className="text-sm text-smartops-dark/60 font-montserrat">
    Descripción secundaria
  </p>
</div>
``` 