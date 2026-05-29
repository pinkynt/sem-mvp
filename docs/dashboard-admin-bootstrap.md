# Dashboard municipal: bootstrap del primer usuario

El dashboard usa Supabase Auth para usuarios municipales y `public.user_profiles` para autorización de la app. No existe endpoint público de bootstrap.

## Crear el primer admin

1. Crear un usuario en Supabase Auth desde el dashboard de Supabase o CLI.
2. Copiar el UUID del usuario.
3. Insertar el perfil municipal activo:

```sql
insert into public.user_profiles (id, email, display_name, role, active)
values ('<auth-user-id>', 'admin@municipalidad.local', 'Administrador SEM', 'admin', true)
on conflict (id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  role = excluded.role,
  active = excluded.active;
```

4. Opcional para auditoría: guardar `dashboard_role = "admin"` en `auth.users.app_metadata` desde Supabase Admin.

El dashboard lee autorización desde `public.user_profiles`; usuarios sin perfil activo no pueden ver datos ni ejecutar APIs.

## Smoke checklist post-migración

Completar esta evidencia después de aplicar la migración y crear el primer admin. No marcar un ítem si no fue ejecutado contra el entorno migrado.

| Fecha/entorno | Responsable | Resultado | Notas |
|---|---|---|---|
| Pendiente | Pendiente | Pendiente | Requiere Supabase migrado y admin activo. |

### Auth y autorización

- [ ] Abrir `/dashboard/operaciones` sin sesión redirige a `/dashboard/login?next=/dashboard/operaciones`.
- [ ] Login con usuario municipal activo vuelve al destino preservado.
- [ ] Usuario autenticado sin `user_profiles.active = true` ve estado no autorizado y no recibe datos.
- [ ] Logout invalida sesión y vuelve a exigir login.
- [ ] Requests anónimos a `/api/dashboard/kpis` y `/api/dashboard/exports/operations.csv` responden 401/403 sin datos.

### Operaciones y export CSV

- [ ] La tabla de operaciones filtra por fecha, estado, medio, zona y patente.
- [ ] El enlace `Exportar CSV filtrado` conserva los mismos parámetros visibles en la URL.
- [ ] El CSV contiene solo filas compatibles con esos filtros.
- [ ] Patentes, nombres con acentos, comas, comillas o saltos de línea abren sin romper columnas.
- [ ] Abrir un detalle de operación muestra pago, sesión, gateway, permisionario, zona, tarifa y estados disponibles.

### Permisionarios, cuentas futuras y tarifas

- [ ] Crear o editar un permisionario mantiene visible el historial operativo.
- [ ] Crear cuenta futura con contraseña manual guarda solo hash, no texto plano.
- [ ] Generar contraseña produce 8 caracteres y el guardado reemplaza por hash.
- [ ] Intentar reutilizar un usuario existente muestra error claro de usuario duplicado.
- [ ] Resetear contraseña actualiza `password_updated_at` sin exponer contraseña previa.
- [ ] Crear nueva tarifa desactiva la anterior y preserva pagos históricos.
- [ ] Intentar DELETE destructivo de tarifa responde 405 con mensaje de seguridad histórica.

### Home, realtime/fallback, responsive y accesibilidad

- [ ] KPIs, gráfico y últimos movimientos cargan con datos o estados vacíos claros.
- [ ] Si realtime no está validado, el panel comunica fallback y refresca por polling.
- [ ] En viewport angosto, tablas y acciones principales siguen siendo utilizables.
- [ ] Navegación por teclado muestra foco visible en login, filtros, tablas, formularios y logout.
- [ ] `git diff -- src/app/permisionario` sigue sin cambios antes del PR.
