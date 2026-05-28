# Documento de definición funcional y UX — MVP SEM Digital PunaTech 2026

## 1. Contexto del desafío

El Sistema de Estacionamiento Medido actual funciona mediante talonarios físicos. Los permisionarios compran esos talonarios a la Municipalidad y luego los utilizan para cobrar el estacionamiento en la vía pública.

El sistema actual es simple de operar, pero tiene problemas estructurales:

- No existe trazabilidad digital.
- Los pagos son mayormente en efectivo.
- La Municipalidad no tiene datos en tiempo real.
- Puede haber cobros indebidos.
- Puede no declararse el 100 % de los cobros.
- El conductor puede no recibir comprobante.
- El sistema depende de talonarios manuales.
- La fiscalización efectiva es muy limitada.

El desafío de la hackaton es proponer una solución tecnológica que modernice el SEM, manteniendo a los permisionarios como agentes activos del sistema y garantizando que todo pago, incluso el pago en efectivo, quede registrado electrónicamente.

---

## 2. Problema central que vamos a resolver en el MVP

El problema principal del MVP será:

> **Cómo registrar digitalmente un cobro de estacionamiento, especialmente cuando el pago se realiza en efectivo, sin obligar al conductor a usar una app municipal ni excluir al permisionario del sistema.**

La solución debe transformar una operación informal/manual en una operación digital, trazable y rápida.

---

## 3. Decisión central de producto

Para el MVP se define que:

> **El conductor no tendrá app, usuario ni login municipal.**

El conductor solo debe poder:

1. Estacionar.
2. Pagar.
3. Recibir una confirmación simple del pago.

La operación digital queda del lado del permisionario o del dispositivo municipal.

---

## 4. Actores contemplados en el MVP

### 4.1. Conductor

Es quien estaciona y paga.

Para el MVP:

- No usa app municipal.
- No inicia sesión.
- No se registra.
- No tiene panel.
- No tiene cuenta dentro del sistema.
- Puede pagar con efectivo o con un medio digital mediante Mercado Pago.
- Recibe confirmación visual o física del pago.

---

### 4.2. Permisionario

Es el actor operativo principal.

Su rol se mantiene activo, tal como exige el desafío.

Puede operar con:

- Smartphone con app del sistema.
- POS/dispositivo municipal provisto o autorizado.

Su tarea principal será:

1. Cargar la patente.
2. Seleccionar tiempo o franja correspondiente.
3. Seleccionar forma de pago.
4. Confirmar el cobro.
5. Mostrar comprobante o entregar ticket.

---

### 4.3. Municipalidad

En el MVP, la Municipalidad no opera necesariamente en calle.

Su rol principal es administrativo y de control posterior.

Puede acceder a un panel para ver:

- Pagos registrados.
- Recaudación.
- Pagos en efectivo.
- Pagos digitales.
- Actividad por zona.
- Actividad por permisionario.
- Registros por patente.
- Datos de ocupación y comportamiento de demanda.

**Importante:** no se contempla al inspector municipal como actor principal del MVP, porque el diagnóstico indica que actualmente la normativa prevé mecanismos de control, pero en la práctica no existen inspectores que los apliquen de forma efectiva.

La Municipalidad puede entrar como actor fuerte en futuras etapas, pero la demo inicial no debe depender de su presencia operativa en calle.

---

## 5. Principios de UX

El sistema debe ser extremadamente simple.

El permisionario puede ser una persona con bajo nivel de alfabetización digital, escasa experiencia con tecnología o alguna dificultad motriz.

Por eso, la interfaz debe poder ser utilizada por alguien que simplemente sabe:

- Leer instrucciones cortas.
- Escribir una patente.
- Tocar botones grandes.
- Reconocer una confirmación visual.

---

## 6. Reglas de diseño para el MVP

### 6.1. Pocas pantallas

El flujo debe tener pocos pasos.

Flujo ideal:

```text
Nuevo cobro
→ Ingresar patente
→ Elegir tiempo
→ Elegir forma de pago
→ Confirmar cobro
→ Pago confirmado
```

---

### 6.2. Una decisión por pantalla

Cada pantalla debe pedir una sola acción:

- Ingresar patente.
- Elegir tiempo.
- Elegir forma de pago.
- Confirmar cobro.
- Mostrar comprobante.

No se deben mostrar formularios largos ni muchas opciones juntas.

---

### 6.3. Botones grandes

Los botones deben ser grandes, separados y fáciles de tocar.

Esto ayuda a:

- Personas con poca experiencia digital.
- Personas mayores.
- Personas con dificultades motrices.
- Uso rápido en la vía pública.

---

### 6.4. Lenguaje simple

Evitar lenguaje técnico.

No usar:

- Transacción.
- Validación.
- Liquidación.
- Sincronización.
- Trazabilidad.
- Registro tarifario.
- Operación fiscalizada.

Usar:

- Cobro.
- Patente.
- Tiempo.
- Total.
- Efectivo.
- QR.
- Tarjeta.
- Listo.
- Pago confirmado.
- Nuevo cobro.

---

### 6.5. Confirmaciones claras

Cuando el pago se registra correctamente, debe verse claramente:

```text
✅ Pago confirmado
```

Y deben mostrarse como mínimo:

- Patente.
- Tiempo pagado.
- Hora de vencimiento.
- Forma de pago.
- Código de comprobante.

---

## 7. Caso A — Pago en efectivo con smartphone del permisionario

### Descripción

El permisionario tiene un smartphone con la app del sistema.

El conductor paga en efectivo.

El permisionario registra el cobro desde la app.

El sistema genera un comprobante visual en pantalla.

El permisionario le muestra esa pantalla al conductor.

---

### Flujo feliz

```text
1. El conductor estaciona.
2. El permisionario abre la app.
3. Toca “Nuevo cobro”.
4. Ingresa la patente.
5. Selecciona el tiempo.
6. Selecciona “Efectivo”.
7. Cobra el dinero.
8. Toca “Cobré en efectivo”.
9. El sistema registra el pago.
10. La app muestra “Pago confirmado”.
11. El permisionario muestra la pantalla al conductor.
12. El registro queda disponible para la Municipalidad.
```

---

### Pantalla 1 — Inicio del permisionario

```text
Hola, Juan

Zona: Centro A

[ NUEVO COBRO ]

Cobros de hoy: 12
Total de hoy: $8.400

[ Ver cobros ]
[ Ayuda ]
```

Decisiones:

- El botón principal debe ser “Nuevo cobro”.
- La zona debe aparecer clara.
- No mostrar menú complejo.
- No mostrar tablas.
- No mostrar información administrativa innecesaria.

---

### Pantalla 2 — Ingresar patente

```text
Ingresá la patente

[ AB 123 CD ]

Ejemplo: AB123CD

[ CONTINUAR ]
```

Decisiones:

- Campo grande.
- Ejemplo visible.
- Botón grande.
- Aceptar formato de patente vieja y nueva.
- No pedir datos del conductor.

---

### Pantalla 3 — Elegir tiempo

```text
Elegí el tiempo

[ 1 hora - $700 ]

[ 2 horas - $1.400 ]

[ Más tiempo ]
```

Nota funcional:

La tarifa base indicada en el diagnóstico es de $700 por hora para autos y $300 por hora para motos. El sistema debe poder actualizar estas tarifas periódicamente.

Para la demo, podemos usar auto como caso principal.

---

### Pantalla 4 — Elegir forma de pago

```text
¿Cómo paga?

[ Efectivo ]

[ QR Mercado Pago ]

[ Tarjeta ]
```

Decisiones:

- Para el caso feliz principal se elige “Efectivo”.
- QR y tarjeta se contemplan como alternativas digitales mediante Mercado Pago.
- El conductor no usa app municipal; si paga QR, usa su billetera habitual.

---

### Pantalla 5 — Confirmar cobro en efectivo

```text
Confirmar cobro

Patente: AB 123 CD
Tiempo: 1 hora
Total: $700
Pago: Efectivo

[ COBRÉ EN EFECTIVO ]
```

Decisiones:

- El botón debe decir “Cobré en efectivo”.
- El sistema registra el pago solo después de esta confirmación.
- Esta acción reemplaza al talonario físico.

---

### Pantalla 6 — Comprobante visual

```text
✅ Pago confirmado

Patente
AB 123 CD

Válido hasta
11:45

Pago
Efectivo

Código
SEM-48291

[ NUEVO COBRO ]
```

Decisiones:

- Esta pantalla funciona como comprobante visual.
- El permisionario la muestra al conductor.
- El conductor no toca nada.
- La patente debe ser grande.
- La tilde debe ser clara.
- El vencimiento debe ser visible.

---

## 8. Caso B — Pago en efectivo con POS municipal

### Descripción

El permisionario usa un POS o dispositivo municipal.

El conductor paga en efectivo.

El permisionario carga patente y tiempo.

El POS registra el pago.

El POS emite un ticket.

El permisionario entrega el ticket al conductor.

---

### Flujo feliz

```text
1. El conductor estaciona.
2. El permisionario ingresa la patente en el POS.
3. Selecciona el tiempo.
4. Cobra en efectivo.
5. Confirma el cobro en el POS.
6. El POS registra el pago.
7. El POS emite el ticket.
8. El permisionario entrega el ticket al conductor.
9. El registro queda disponible para la Municipalidad.
```

---

### Pantalla POS 1 — Patente

```text
PATENTE

AB123CD

[ OK ]
```

---

### Pantalla POS 2 — Tiempo

```text
TIEMPO

1 - 1 HORA
2 - 2 HORAS
3 - MÁS TIEMPO
```

---

### Pantalla POS 3 — Confirmar

```text
TOTAL: $700

PAGO: EFECTIVO

[ CONFIRMAR ]
```

---

### Pantalla POS 4 — Ticket

```text
PAGO CONFIRMADO

IMPRIMIENDO TICKET
```

---

### Ticket impreso

```text
SEM DIGITAL

Pago confirmado

Patente: AB 123 CD
Tiempo: 1 hora
Válido hasta: 11:45
Pago: Efectivo
Código: SEM-48291

Conserve este comprobante
```

---

## 9. Caso C — Pago digital con QR Mercado Pago

### Descripción

El conductor paga con QR de Mercado Pago generado por el dispositivo del permisionario.

El conductor no usa app municipal.

Usa su billetera habitual.

---

### Flujo desde smartphone

```text
1. El permisionario ingresa patente.
2. Selecciona tiempo.
3. Selecciona “QR Mercado Pago”.
4. La app genera un QR.
5. El conductor escanea el QR con su billetera.
6. Mercado Pago confirma el pago.
7. La app muestra “Pago confirmado”.
8. El registro queda disponible para la Municipalidad.
```

---

### Flujo desde POS

```text
1. El permisionario ingresa patente.
2. Selecciona tiempo.
3. Selecciona “QR”.
4. El POS muestra o imprime el QR.
5. El conductor paga con su billetera.
6. El POS confirma el pago.
7. El POS emite ticket.
8. El registro queda disponible para la Municipalidad.
```

---

## 10. Descuento por pago digital

El diagnóstico indica que la normativa contempla un incentivo al pago digital:

> **20 % de descuento para pagos digitales.**

La diferencia es absorbida por la Municipalidad desde su porción del 20 %, sin afectar el ingreso del permisionario.

Para la demo, se puede mostrar así:

```text
Total efectivo: $700

Total digital: $560
Descuento digital aplicado: 20 %
```

Importante:

- El descuento no debe requerir cálculo manual.
- La app o POS debe calcularlo automáticamente.
- El permisionario no debe decidir el descuento.
- El sistema debe mostrar el total final ya calculado.

---

## 11. Cumplimiento normativo automático

El sistema debe ayudar a cumplir la Ordenanza N.º 12.170 sin depender del conocimiento manual del permisionario o del conductor.

Esto es clave porque actualmente hay desconocimiento sobre horarios permitidos, feriados y zonas habilitadas.

Para el MVP, se recomienda contemplar al menos:

---

### 11.1. Horarios permitidos

El sistema debería saber si en ese momento está permitido cobrar.

Ejemplo de mensaje:

```text
No se puede cobrar ahora

El cobro diurno no está habilitado en este horario.
```

---

### 11.2. Zona asignada

El sistema debería mostrar la zona del permisionario y no obligarlo a elegirla manualmente.

```text
Zona: Centro A
```

---

### 11.3. Tarifa automática

El sistema debe calcular el importe.

El permisionario no debe escribir el monto manualmente.

---

### 11.4. Feriados y días no laborables

El sistema debe bloquear o advertir cuando no corresponda el cobro diurno.

---

### 11.5. Fraccionamiento tarifario

La ordenanza contempla fraccionamiento cada 15 minutos a partir de la segunda hora de estadía.

Para la demo, se puede dejar indicado como regla automática futura o mostrarlo de manera simplificada en “Más tiempo”.

---

## 12. Registro interno del sistema

Todo pago, sea efectivo o digital, debe generar un registro electrónico.

Datos mínimos:

```text
ID de pago
Código de comprobante
Patente
Tipo de vehículo
Zona
Permisionario
Dispositivo usado
Fecha
Hora de inicio
Hora de vencimiento
Tiempo contratado
Monto base
Descuento aplicado
Monto final
Medio de pago
Estado del pago
```

Ejemplo:

```text
Código: SEM-48291
Patente: AB 123 CD
Tipo: Auto
Zona: Centro A
Permisionario: Juan Pérez
Dispositivo: Smartphone
Fecha: 28/05/2026
Hora inicio: 10:45
Válido hasta: 11:45
Tiempo: 1 hora
Monto base: $700
Descuento: $0
Monto final: $700
Pago: Efectivo
Estado: Confirmado
```

---

## 13. Panel municipal para la demo

El panel municipal debe ser simple.

No debe depender de inspectores.

Debe mostrar la trazabilidad que hoy no existe.

---

### Pantalla 1 — Dashboard

Cards sugeridas:

```text
Pagos registrados hoy
Recaudación registrada
Pagos en efectivo
Pagos digitales
Permisionarios activos
Zonas activas
```

---

### Pantalla 2 — Pagos registrados

Tabla sugerida:

```text
Patente | Zona | Permisionario | Medio | Monto | Dispositivo | Estado
AB 123 CD | Centro A | Juan Pérez | Efectivo | $700 | Smartphone | Confirmado
AC 456 EF | Centro B | Marta Díaz | QR MP | $560 | POS | Confirmado
```

---

### Pantalla 3 — Consulta por patente

Esta pantalla permite demostrar trazabilidad, sin hablar de inspector.

```text
Buscar patente

[ AB 123 CD ]

Resultado:

✅ Pago activo

Patente: AB 123 CD
Válido hasta: 11:45
Zona: Centro A
Pago: Efectivo
Código: SEM-48291
```

Uso en demo:

- Mostrar que cualquier pago registrado puede encontrarse por patente.
- Explicar que esto habilita control posterior, auditoría y futuras integraciones.

---

## 14. Qué no entra en el MVP

Para mantener foco en la hackaton, no desarrollar todavía:

- App del conductor.
- Login del conductor.
- Inspector municipal como actor principal.
- Denuncias ciudadanas.
- Sanciones.
- Reclamos.
- Registro social completo del permisionario.
- Asignación dinámica avanzada de zonas.
- Casos donde ninguna de las partes tenga dispositivo.
- Liquidación completa de dinero.
- Backoffice administrativo complejo.

Estos puntos pueden mencionarse como evolución futura.

---

## 15. Qué sí debe mostrar la demo

La demo debe demostrar el flujo completo de trazabilidad.

### Demo recomendada

#### Parte 1 — Pago en efectivo con smartphone

1. Permisionario entra a la app.
2. Toca “Nuevo cobro”.
3. Ingresa patente.
4. Selecciona 1 hora.
5. Selecciona efectivo.
6. Confirma “Cobré en efectivo”.
7. Muestra pantalla “Pago confirmado”.

---

#### Parte 2 — Pago digital con QR Mercado Pago

1. Permisionario ingresa patente.
2. Selecciona tiempo.
3. Selecciona QR Mercado Pago.
4. Se muestra QR.
5. Se simula confirmación de pago.
6. Se muestra “Pago confirmado” con descuento digital aplicado.

---

#### Parte 3 — Panel municipal

1. Mostrar dashboard.
2. Mostrar los pagos recién registrados.
3. Buscar una patente.
4. Mostrar que el pago existe, está activo y tiene comprobante.

---

## 16. Justificación para la hackaton

La propuesta cumple con los tres criterios principales del jurado:

---

### 16.1. Factibilidad técnica

La solución se apoya en componentes conocidos y disponibles:

- App web/mobile simple para permisionarios.
- POS o dispositivo autorizado.
- Integración con Mercado Pago.
- Base de datos centralizada.
- Panel administrativo para la Municipalidad.
- Registro por patente.

El flujo se mantiene corto y rápido, evitando el problema del antecedente anterior, donde las demoras de hasta 1 o 2 minutos por transacción hacían inviable la operación en vía pública.

---

### 16.2. Innovación

La innovación no está en crear una app más para el conductor, sino en digitalizar una operación que hoy ocurre en papel.

El sistema convierte el cobro en efectivo en un registro digital auditable.

Además, permite:

- Eliminar talonarios físicos.
- Incorporar pagos digitales.
- Aplicar descuentos automáticamente.
- Evitar cálculos manuales.
- Prevenir cobros fuera de horario.
- Generar datos en tiempo real.
- Mantener al permisionario dentro del sistema.

---

### 16.3. Experiencia de usuario

La experiencia está pensada para adopción real en calle.

El permisionario no necesita aprender un sistema complejo.

El conductor no necesita descargar una app.

El flujo es simple:

```text
Patente
→ Tiempo
→ Pago
→ Confirmación
```

---

## 17. Stack tecnológico sugerido para la demo

### Frontend

**React / Next.js**

Justificación:

- Permite prototipado rápido.
- Sirve para crear una demo navegable.
- Puede simular app mobile y panel municipal.
- Fácil de compartir entre equipo.

---

### Backend

**Node.js / NestJS o Express**

Justificación:

- Desarrollo rápido.
- Buena integración con APIs.
- Permite endpoints simples para pagos, patentes y registros.

---

### Base de datos

**PostgreSQL o Supabase**

Justificación:

- Modelo relacional claro.
- Fácil de consultar.
- Permite registrar pagos, permisionarios, zonas y comprobantes.

---

### Pagos

**Mercado Pago**

Justificación:

- Requisito obligatorio del desafío.
- Permite QR, transferencia, tarjeta de débito y crédito.
- Es una plataforma conocida por usuarios argentinos.

---

### Demo rápida

Para hackaton, se puede simular la confirmación de Mercado Pago si no se llega a una integración completa.

La demo debe dejar claro dónde ocurriría la integración real.

---

## 18. Modelo de datos mínimo

### Tabla: `payments`

```text
id
receipt_code
license_plate
vehicle_type
zone_id
permit_holder_id
device_type
start_time
end_time
duration_minutes
base_amount
discount_amount
final_amount
payment_method
payment_status
created_at
```

---

### Tabla: `permit_holders`

```text
id
full_name
legajo
assigned_zone_id
status
device_type
```

---

### Tabla: `zones`

```text
id
name
allowed_schedule
is_active
```

---

## 19. Mensaje de pitch

```text
No buscamos que el ciudadano descargue otra app para estacionar.

Buscamos modernizar el sistema sin romper la dinámica real de la calle.

El conductor paga como siempre.

El permisionario sigue trabajando, pero ahora registra el cobro en segundos.

Y la Municipalidad obtiene algo que hoy no tiene: datos, trazabilidad y control digital sobre cada pago.
```

---

## 20. Resumen ejecutivo

El MVP propone un SEM digital simple, inclusivo y trazable.

El permisionario registra cada cobro desde un smartphone o POS municipal.

El conductor no necesita app ni usuario.

Si paga en efectivo, el sistema genera un comprobante digital o ticket.

Si paga con QR, la operación se procesa mediante Mercado Pago.

En todos los casos, el pago queda registrado electrónicamente por patente, zona, horario, monto, medio de pago y permisionario.

La propuesta elimina el talonario físico, mantiene al permisionario como actor activo y le da a la Municipalidad información en tiempo real para administrar mejor el sistema.
