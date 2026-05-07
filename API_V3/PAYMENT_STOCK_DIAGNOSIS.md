# Diagnóstico y Solución: Actualización de Stock en Pagos

## 🔍 Problema Identificado

El sistema **SÍ está diseñado** para actualizar el stock cuando se aprueba un pago, pero puede haber problemas en la configuración del inventario que impiden que esto funcione correctamente.

## 📋 Análisis del Código

### Flujo de Aprobación de Pagos

1. **Endpoint de aprobación**: `/api/checkout/payments/:paymentId/approve`
2. **Controlador**: `CheckoutController.approvePayment()`
3. **Servicio**: `PaymentService.approvePayment()`
4. **Método clave**: `PaymentService.processOrderPaymentApproval()`

### Código que Actualiza el Stock

```javascript
// En src/core/payments/services/payment.service.js, líneas 254-365
const inventoryUpdates = order.items.map(item => {
  const filter = {
    tenant_id: order.tenant_id,
    product_id: item.product,
  };
  if (item.variant) filter.variant_id = item.variant;
  return {
    updateOne: {
      filter: {
        ...filter,
        current_stock: { $gte: item.quantity },
        reserved_stock: { $gte: item.quantity }
      },
      update: {
        $inc: {
          current_stock: -item.quantity,
          reserved_stock: -item.quantity
        }
      }
    }
  };
});
```

## 🚨 Posibles Causas del Problema

### 1. **Problema Crítico: Modelo de Inventario**
- El modelo `Inventory` requiere `variant_id` como **obligatorio**
- Si un producto no tiene variantes, no se puede crear inventario
- Esto causa que no se encuentren registros de inventario al aprobar pagos

### 2. **Stock Insuficiente**
- No hay suficiente `current_stock` o `reserved_stock`
- La validación falla y no se actualiza el inventario

### 3. **Stock Negativo o Inválido**
- `reserved_stock` mayor que `current_stock`
- Valores negativos en el inventario

### 4. **Problema de Transacciones**
- Error en la transacción de MongoDB
- Rollback automático sin notificación clara

## 🔧 Scripts de Diagnóstico y Corrección

### Script 1: Diagnóstico General
```bash
node src/scripts/diagnosePaymentStock.js
```
**Qué hace:**
- Busca pagos pendientes
- Verifica inventario para cada item
- Simula aprobación para detectar problemas
- Muestra pagos recientemente aprobados

### Script 2: Verificación de Inventario
```bash
node src/scripts/fixInventoryForPayments.js
```
**Qué hace:**
- Verifica inventarios sin `variant_id`
- Identifica productos sin variantes
- Detecta stock negativo o inválido
- Genera sugerencias de corrección

### Script 3: Corrección Automática
```bash
node src/scripts/autoFixInventory.js
```
**Qué hace:**
- Corrige stock negativo
- Ajusta stock reservado inválido
- Reporta inventarios problemáticos

### Script 4: Prueba de Aprobación
```bash
node src/scripts/testPaymentApproval.js
```
**Qué hace:**
- Busca un pago pendiente
- Muestra estado ANTES de aprobar
- Ejecuta aprobación real
- Muestra estado DESPUÉS de aprobar
- Verifica que el stock se actualice correctamente

## 🛠️ Pasos para Solucionar

### Paso 1: Ejecutar Diagnóstico
```bash
# 1. Diagnóstico general
node src/scripts/diagnosePaymentStock.js

# 2. Verificación de inventario
node src/scripts/fixInventoryForPayments.js
```

### Paso 2: Corregir Problemas Identificados

#### A. Si hay inventarios sin `variant_id`:
```bash
# Opción 1: Crear variantes por defecto
# (Requiere script adicional)

# Opción 2: Modificar modelo de inventario
# Hacer variant_id opcional en src/features/inventory/models/Inventory.js
```

#### B. Si hay stock negativo o inválido:
```bash
# Corrección automática
node src/scripts/autoFixInventory.js
```

### Paso 3: Probar Aprobación
```bash
# Crear un pago pendiente usando el checkout
# Luego ejecutar:
node src/scripts/testPaymentApproval.js
```

## 🔍 Verificación Manual

### 1. Verificar que el pago se apruebe correctamente:
```bash
curl -X PATCH "http://localhost:3000/api/checkout/payments/{paymentId}/approve" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### 2. Verificar el inventario después de la aprobación:
```bash
# Consultar directamente en MongoDB
db.inventories.find({
  tenant_id: "tu-tenant-id",
  product_id: ObjectId("product-id")
})
```

### 3. Verificar logs del servidor:
```bash
# Buscar en los logs:
grep "processOrderPaymentApproval" logs/app.log
grep "inventory" logs/app.log
```

## 🚨 Problemas Comunes y Soluciones

### Problema: "Stock insuficiente o reserva insuficiente"
**Causa:** No hay suficiente `current_stock` o `reserved_stock`
**Solución:**
1. Verificar que los productos tengan inventario creado
2. Asegurar que el stock reservado se haya creado durante el checkout
3. Corregir stock negativo con el script automático

### Problema: "INVENTARIO NO ENCONTRADO"
**Causa:** Producto sin variantes o inventario no creado
**Solución:**
1. Crear variantes por defecto para productos sin variantes
2. O modificar el modelo para hacer `variant_id` opcional
3. Crear registros de inventario faltantes

### Problema: "Error al actualizar el inventario"
**Causa:** Error en la transacción de MongoDB
**Solución:**
1. Verificar conectividad a la base de datos
2. Revisar logs de MongoDB
3. Verificar que no haya restricciones de índice únicas

## 📊 Monitoreo Continuo

### Logs a Monitorear:
```bash
# En los logs del servidor, buscar:
- "processOrderPaymentApproval"
- "inventory"
- "Stock insuficiente"
- "INVENTARIO NO ENCONTRADO"
```

### Métricas a Verificar:
- Número de pagos aprobados vs stock actualizado
- Tiempo de respuesta en aprobaciones
- Errores en transacciones de inventario

## 🆘 Contacto y Soporte

Si después de ejecutar estos scripts sigues teniendo problemas:

1. **Ejecuta todos los scripts de diagnóstico**
2. **Guarda los logs completos**
3. **Documenta los pasos que seguiste**
4. **Proporciona ejemplos específicos de pagos que fallan**

Los scripts te darán información detallada sobre qué está causando el problema específico en tu sistema. 