# SEM Digital

> Modernización integral del Sistema de Estacionamiento Medido (SEM) de la Municipalidad de Salta. MVP construido durante **PunaTech 2026** para el track **Municipalidad de Salta — Diagnóstico SEM**.

---

## Equipo Pinkynt

| Integrante | GitHub | Rol |
|---|---|---|
| Joaquin Wojcik | [@joaquinwojcik](https://github.com/joaquinwojcik) | Dev |
| Ignacio Medina | [@nic0der-im](https://github.com/nic0der-im) | Dev |
| Luis Atamanzcuk | [@G4ncia](https://github.com/G4ncia) | PM / Marketing |

Repositorio: <https://github.com/pinkynt/sem-mvp> (público)

---

## Track

**PunaTech — Municipalidad de Salta · Diagnóstico SEM**
Premio: ARS 1.500.000 · Criterios: factibilidad técnica, innovación y experiencia de usuario (ponderación igual).

---

## Problema

Hoy el SEM de Salta funciona con **talonarios manuales**: ~900 permisionarios cobran en efectivo cuadra por cuadra y la Municipalidad no tiene trazabilidad, control ni datos en tiempo real. Esto habilita cobros indebidos, sub-declaración de recaudación y excluye los medios de pago digitales que la Ordenanza N.º 12.170 ya autoriza.

Un intento previo de digitalización (2024–2025) fue suspendido porque la plataforma de pago tardaba hasta **2 minutos por transacción** — inviable en la vía pública.

## Solución

**SEM Digital** es una plataforma web que digitaliza el 100 % de los cobros (efectivo o digital) sin obligar al conductor a instalar nada y sin sacar al permisionario del flujo.

Decisión central de producto:

> **El conductor no tiene app, ni login, ni usuario.** Solo estaciona, paga y recibe confirmación. Toda la operación digital queda del lado del permisionario.

---

## Entregables del track

### 1. Flujo de pago del conductor

1. El conductor estaciona.
2. El permisionario carga la patente y selecciona tiempo (prepago) o inicia sesión abierta (pospago).
3. Selecciona forma de pago: **Mercado Pago** (QR, transferencia, débito o crédito) o **efectivo**.
4. Si es digital → Mercado Pago resuelve la transacción en segundos y el sistema registra el cobro con `payment_id` real.
5. Si es efectivo → el permisionario confirma el cobro y el sistema genera el registro digital con sello horario, monto y patente.
6. El conductor recibe confirmación (pantalla o comprobante físico opcional). No necesita registrarse en nada.

### 2. Rol del permisionario

Se mantiene como **actor operativo principal del sistema** (cumple el requisito de inclusión social):

- Tiene cuenta propia con login (`/permisionario`), sesión JWT en cookie httpOnly.
- Opera desde su smartphone o desde un POS provisto.
- Gestiona el ciclo completo: alta de patente → cobro → cierre de sesión.
- **Su ingreso queda garantizado**: el 80 % de cada cobro es suyo (igual que con talonarios). El 20 % de cuota municipal se descuenta automáticamente. El descuento del 20 % por pago digital lo absorbe la Municipalidad — el permisionario no pierde nada.
- Ya no tiene que ir a la Municipalidad a comprar talonarios.

### 3. Mecanismo de trazabilidad en efectivo

Cada cobro en efectivo se registra digitalmente en el momento, con:

- Patente, monto, tarifa aplicada, duración, zona/cuadra del permisionario.
- Timestamp del servidor (no del dispositivo).
- ID del permisionario que cobra.
- Marca `payment_method = "cash"` para auditoría diferenciada.
- Comprobante consultable por patente y por permisionario.

La Municipalidad ve en su panel administrativo el desglose efectivo vs digital por zona, hora y permisionario, lo que permite detectar anomalías (ej. permisionario con 0 % cash mientras sus vecinos tienen 70 %).

### 4. Stack tecnológico y justificación

| Pieza | Elección | Por qué |
|---|---|---|
| Framework web | **Next.js 16 (App Router) + React 19** | Mismo runtime para frontend y APIs, server actions reducen latencia percibida, deploy trivial. |
| Tipado | **TypeScript 5** | Confiabilidad en un dominio con muchas reglas de negocio (tarifas, fracciones, descuentos). |
| Backend / DB | **Supabase (Postgres + RLS)** | Postgres administrado con auth, row-level security y SDKs cliente/servidor listos. Acelera el MVP sin sacrificar consistencia. |
| Pagos | **Mercado Pago (QR Point of Interaction + Webhooks)** | Requisito del track. QR dinámico es la modalidad más rápida en calle (segundos, no minutos — resuelve el bloqueo del intento 2024–2025). |
| Sesión permisionario | **JWT firmado (jose) + cookie httpOnly + scrypt** | Sesión propia liviana, sin depender de Supabase Auth para el rol operativo. |
| UI | **Tailwind CSS v4 + lucide-react** | Iteración rápida, accesibilidad con botones grandes y alto contraste (UX para permisionarios con baja alfabetización digital). |
| Validación | **Zod** | Schemas compartidos entre cliente y servidor. |
| Dashboard | **Recharts + @tanstack/react-table** | Tablas y gráficos del panel municipal. |
| QR | **qrcode** | Generación de QR para el flujo de cobro Mercado Pago. |
| Infra dev/prod | **Docker + docker-compose** | Reproducibilidad entre máquinas del equipo y en demo. |

### 5. Demo funcional

Prototipo navegable corriendo en local (instrucciones más abajo). Cubre los 3 flujos: cobro pospago, prepago, y panel admin municipal.

---

## Cómo correr localmente

Requisitos: Docker + docker-compose.

```bash
# 1. Clonar
git clone https://github.com/pinkynt/sem-mvp.git
cd sem-mvp

# 2. Configurar entorno
cp .env.example .env   # cargar credenciales de Supabase + Mercado Pago

# 3. Levantar el stack de desarrollo
docker compose up -d node
```

App disponible en <http://localhost:3000>.
App en prod disponible en: <https://pinkynt-app-yehgud-d5782d-149-50-159-23.traefik.me>

# Accesos

## Dashboard

Usuario: polo@muni.salta
Clave: mate2026

## App Permisionario

Usuario: permizonacentro
Clave: permi2026


Rutas principales:

- `/` — landing
- `/permisionario` — login y operación del permisionario
- `/dashboard` — panel administrativo de la Municipalidad

### Build de producción

```bash
docker compose up app --build
```

App de producción expuesta en el puerto `3011`.

### Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mercado Pago (Point of Interaction)
MERCADOPAGO_APPLICATION_ID=
MERCADOPAGO_USER_ID=
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_STORE_EXTERNAL_ID=
MERCADOPAGO_POS_EXTERNAL_ID=
MERCADOPAGO_WEBHOOK_SECRET=
MERCADOPAGO_PROVISIONING_KEY=

# Sesión permisionario (firmar JWT)
PERMIT_HOLDER_SESSION_SECRET=
```

---

## Videos

- **Pitch + demo:** https://youtu.be/mDJD-E954tM

---

## Herramientas de IA utilizadas

Declaración explícita conforme a la regla 4 del hackathon:

- **Claude Code** (Anthropic) — desarrollo asistido, refactors y pair-programming.
- **OpenCode** con suscripción de GPT — desarrollo asistido.
- **Cursor** — IDE con asistencia AI.
- **Codex** — generación de código.
- **ChatGPT** (OpenAI) — exploración de soluciones y redacción.
- **Kimi Code** — desarrollo asistido.
- **Remotion + GPT 5.5** — generación de la presentación / video del pitch.

Todo el código, decisiones de arquitectura y validaciones de producto fueron revisados y aprobados por el equipo humano.

## Datasets

Ninguno. El proyecto no incorpora datasets externos. Los datos del dominio (tarifas, horarios, zonas) provienen exclusivamente de la **Ordenanza Municipal N.º 12.170** de Salta y de la documentación entregada por la Municipalidad para el desafío.

---

## Documentación adicional

En `docs/` están los documentos de contexto y diseño:

- `problema-a-resolver.md` — enunciado oficial del desafío.
- `definicion_funcional_ux_sem_digital_punatech_2026.md` — definición funcional y UX.
- `modelo_de_datos_sem_digital.md` — modelo de datos.
- `frontend-data-integration.md` — integración frontend / datos.
- `manual_identidad_sem_digital_municipalidad_salta.md` — manual de identidad visual.
- `dashboard-admin-bootstrap.md` — bootstrap del panel municipal.

---

## Licencia

Código entregado bajo los términos del hackathon PunaTech 2026 para evaluación del jurado.
