# Modelo de datos — MVP SEM Digital PunaTech 2026

Propuesta de modelo de datos derivada del [documento de definición funcional y UX](./definicion_funcional_ux_sem_digital_punatech_2026.md) y del flujo del permisionario ya implementado (`src/app/permisionario/page.tsx`).

Stack objetivo: **PostgreSQL / Supabase**.

---

## 1. Decisiones de diseño (el *por qué*)

Tres decisiones gobiernan el resto del modelo:

### 1.1. `payments` guarda montos congelados, no calculados

Las tarifas cambian con el tiempo (lo exige el doc funcional). Si un cobro referenciara la tarifa viva, al actualizar un precio se corrompería la recaudación histórica.

Por eso `base_amount`, `discount_amount` y `final_amount` se **snapshotean** en el momento del cobro. La tabla `tariffs` se usa solo para **calcular** durante el flujo, nunca para **leer** un cobro pasado.

### 1.2. El medio de pago se guarda granular, no colapsado a "digital"

La UI muestra `efectivo` / `digital` en el badge, pero el panel municipal necesita distinguir QR de tarjeta. Por eso se almacena `payment_method` con valores `efectivo | qr | tarjeta`. **"Digital" es un derivado** (`payment_method != 'efectivo'`), no un dato almacenado.

### 1.3. `payment_status` es real, no decorativo

El QR de Mercado Pago tiene un hueco temporal: se genera → el conductor escanea → MP confirma. Ese cobro nace `pending` y pasa a `confirmed` por webhook. El efectivo nace `confirmed` directo. Sin esto, el Caso C no se puede modelar de forma honesta.

---

## 2. Tablas

### `zones`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Ej: "Centro A" |
| `allowed_schedule` | jsonb | Horarios permitidos (cumplimiento normativo, sección 11.1) |
| `is_active` | boolean | default `true` |
| `created_at` | timestamptz | |

### `tariffs`

Tarifa vigente por tipo de vehículo, versionada por fecha. Permite "actualizar periódicamente" sin romper el historial.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `vehicle_type` | text | enum: `auto` \| `moto` |
| `hourly_rate` | integer | Pesos enteros (700, 300) |
| `digital_discount_pct` | integer | default `20` |
| `effective_from` | timestamptz | |
| `effective_to` | timestamptz | nullable — `null` = vigente |

### `permit_holders` (permisionarios)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `full_name` | text | Ej: "Juan Pérez" |
| `legajo` | text | unique |
| `assigned_zone_id` | uuid FK → `zones` | |
| `device_type` | text | enum: `smartphone` \| `pos` |
| `status` | text | enum: `active` \| `inactive` |
| `created_at` | timestamptz | |

### `payments` (cobros) — entidad central

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `receipt_code` | text | unique — "SEM-48291" |
| `license_plate` | text | normalizada: "AB123CD" |
| `vehicle_type` | text | enum: `auto` \| `moto` |
| `zone_id` | uuid FK → `zones` | |
| `permit_holder_id` | uuid FK → `permit_holders` | |
| `device_type` | text | enum: `smartphone` \| `pos` (snapshot) |
| `duration_minutes` | integer | 60, 120, 180 |
| `start_time` | timestamptz | |
| `end_time` | timestamptz | "válido hasta 11:45" |
| `base_amount` | integer | snapshot (`hourly_rate * horas`) |
| `discount_amount` | integer | snapshot (0 o 20%) |
| `final_amount` | integer | snapshot (lo efectivamente cobrado) |
| `payment_method` | text | enum: `efectivo` \| `qr` \| `tarjeta` |
| `payment_status` | text | enum: `pending` \| `confirmed` \| `cancelled` |
| `created_at` | timestamptz | |
| `confirmed_at` | timestamptz | nullable |

### `payment_gateway_refs` (solo pagos digitales — Caso C)

Aislada de `payments` para no ensuciar la entidad principal con campos de Mercado Pago que solo aplican a una parte de los cobros.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `payment_id` | uuid FK → `payments` | unique |
| `provider` | text | default `'mercadopago'` |
| `external_id` | text | id de pago en MP |
| `preference_id` | text | preferencia / QR generado |
| `raw_status` | text | estado crudo del webhook |
| `created_at` | timestamptz | |

---

## 3. Trazabilidad pantalla → modelo

| Pantalla del flujo | Qué escribe en el modelo |
|---|---|
| Vehículo (auto/moto) | `vehicle_type` + busca `tariffs.hourly_rate` |
| Patente | `license_plate` |
| Tiempo (1h/2h/3h) | `duration_minutes`, `end_time` |
| Forma de pago | `payment_method` |
| Confirmar | calcula `base/discount/final_amount`, crea `payment` |
| "Cobré en efectivo" | `payment_status = confirmed` directo |
| QR Mercado Pago | `payment_status = pending` + fila en `payment_gateway_refs` |
| Comprobante | lee `receipt_code`, `end_time`, `payment_method` |
| Home (total / últimos cobros) | agrega `SUM(final_amount)`, últimos `payments` del permisionario |
| Panel municipal | agrega por `zone_id`, `payment_method`, `payment_status` |

---

## 4. Convenciones y puntos abiertos

- **Plata como `integer` en pesos enteros**, no decimal/float. Las tarifas del SEM son enteras y se evitan errores de redondeo en el 20% (la UI ya usa `Math.round`). Si más adelante hay fraccionamiento por 15 min (sección 11.5), se sigue en enteros.
- **Patente normalizada** (`AB123CD`) para la búsqueda por patente del panel municipal; el formato presentable (`AB 123 CD`) es solo presentación, no almacenamiento.
- **`devices` como entidad propia**: pendiente de definir. Para el MVP se deja `device_type` como snapshot en `payments`, lo cual alcanza para la demo. Si se necesita trazar *qué* POS físico emitió cada cobro, se promueve a tabla.