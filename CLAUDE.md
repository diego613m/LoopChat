# SIATC — Reglas de Seguridad para Agentes AI (LoopChat)

> ⚠️ **Codificación de este archivo: UTF-8, sin BOM.** Guardar siempre en UTF-8 (no Windows-1252/Latin-1/ANSI). Antes de editar este archivo con cualquier herramienta o editor, confirmar que su codificación de guardado esté configurada como UTF-8 — de lo contrario los acentos, "—" y "✅/❌" se corrompen (mojibake) de forma silenciosa y acumulativa cada vez que se vuelve a guardar con la codificación incorrecta.

## 0. Estado especial de este repo

LoopChat es un **fork de Rocket.Chat** (Meteor + Yarn Workspaces + Turborepo), no una app propia Vite+Express como el resto del ecosistema. Este archivo es una adaptación de la plantilla maestra compartida (`SIATC Memory/plantillas-compartidas/CLAUDE-GEMINI-master.md`) — ver el plan completo en `SIATC Memory/planes-implementacion/Migracion-LoopChat-al-Ecosistema-SIATC.md`.

Diferencias clave respecto al resto de apps del ecosistema:
- **No modificar el código heredado de Rocket.Chat "porque sí".** Este repo es un fork activo — cualquier cambio en `apps/meteor/`, `packages/`, `ee/` fuera de lo explícitamente pedido en el plan de migración debe evitarse, para no acumular deuda de merge contra las actualizaciones futuras de Rocket.Chat upstream.
- **El código propio de SIATC vive exclusivamente en `apps/meteor/server/siatc/`** (carpeta nueva, se crea en la Fase 2 del plan). Es la única carpeta que `check-security.sh` escanea con los controles de patrones (SQL, RLS, etc.) — el resto del fork no se audita con estas reglas porque no lo escribimos nosotros.
- Las reglas 1 a 3 de abajo (autenticación con `verifyToken`, RLS por `casId`, tipos SQL en `.input()`) **todavía no aplican** — LoopChat no habla con la base Azure SQL compartida todavía. Se activan recién cuando se implemente el hook de aprobación SSO (Fase 2). Se dejan documentadas desde ya para que el código que se agregue en `apps/meteor/server/siatc/` las siga desde el primer commit.

Estas reglas aplican a todos los repos del ecosistema SIATC. Son obligatorias en cada cambio de código propio (no heredado de Rocket.Chat).

## 1. Autenticación — Dos middlewares, no uno

⏳ **Pendiente de activar (Fase 2)** — LoopChat todavía no tiene endpoints propios que requieran este patrón. Cuando se agregue el hook de aprobación SSO u otro endpoint propio en `apps/meteor/server/siatc/`:

- **`verifyToken`** → solo acepta `Authorization: Bearer <token>`. Usar en **todos** los endpoints.
- **`verifyTokenForDownload`** → acepta header Y `req.query.token`. Usar **únicamente** en endpoints GET que sirven archivos descargados directamente por el browser (`window.location.href`, Excel, PDF).

**Nunca** agregar `req.query.token` al `verifyToken` principal. Si necesitas un endpoint de descarga, usa `verifyTokenForDownload`.

> Nota: la sesión propia de Rocket.Chat (login de usuarios del chat) la maneja Meteor internamente (`Accounts`), no este patrón — esta regla es para endpoints HTTP propios que se agreguen fuera del framework de cuentas de Meteor.

## 2. Row Level Security (RLS)

⏳ **Pendiente de activar (Fase 2)** — aplica desde que exista código propio que consulte la base Azure SQL compartida.

Todo endpoint que sirva datos (tickets, pagos, penalidades, colaboradores, técnicos) debe filtrar por empresa CAS:

```typescript
if (currentUser.casId !== null) {
    // Usuario empresa CAS — solo ve sus propios datos
    request.input('casId', sql.VarChar(50), currentUser.casId);
    query += ' AND ID_cas = @casId';
}
// casId === null → empleado Sole, ve todo
```

> Nota: en el hook de aprobación SSO (Fase 2), esto aplica a cualquier consulta propia contra `EBM.Users`/`EBM.PendingSSORequests` que necesite filtrar por CAS — a definir en el momento de implementar esa fase.

## 3. Tipos SQL Explícitos en .input()

⏳ **Pendiente de activar (Fase 2)** — aplica desde el primer `.input()` que se escriba en `apps/meteor/server/siatc/`.

Todos los `.input()` deben declarar el tipo SQL. Nunca pasar `req.params` o `req.body` directamente:

```typescript
// ✅ Correcto
.input('id', sql.UniqueIdentifier, req.params.id)
.input('name', sql.VarChar(100), req.body.name)
.input('amount', sql.Decimal(10, 2), amount)

// ❌ Incorrecto — susceptible a type confusion
.input('id', req.params.id)
```

Tipos de referencia por campo:
| Campo | Tipo SQL |
|---|---|
| EBM.Users.Id | `sql.UniqueIdentifier` |
| ID penalidad (hex 4 bytes) | `sql.VarChar(8)` |
| CAS ID | `sql.VarChar(50)` |
| RUC | `sql.VarChar(20)` |
| Nombres, textos | `sql.VarChar(N)` |
| Montos | `sql.Decimal(10, 2)` |

## 4. Path Traversal — path.resolve + startsWith

Aplica ya, si se agrega cualquier endpoint propio que sirva archivos desde una carpeta base:

```typescript
// ✅ Correcto
const fullPath = path.resolve(BASE_DIR, userInput);
if (!fullPath.startsWith(path.resolve(BASE_DIR) + path.sep)) {
    return res.status(400).json({ error: 'Ruta inválida.' });
}

// ❌ Incorrecto — la regex no cubre todos los casos de traversal
const safePath = path.normalize(input).replace(/^(\.\.[\/\\])+/, '');
```

## 5. Variables de Entorno — Sin Paths Hardcodeados

Aplica ya, para cualquier configuración propia (ej. credenciales de conexión a la base Azure SQL en Fase 2):

```typescript
// ✅ Correcto
const STORAGE_PATH = process.env.STORAGE_PATH || '';
if (!STORAGE_PATH) return res.status(503).json({ error: 'Almacenamiento no configurado.' });

// ❌ Incorrecto — ruta local que no existe en el servidor Dokploy
const STORAGE_PATH = 'C:\\Users\\someone\\OneDrive\\...';
```

## 6. Guards de Producción

Aplica ya, para cualquier warning de configuración propio que se agregue:

```typescript
// ✅ Correcto
if (process.env.NODE_ENV === 'production' && !(process.env.ALLOWED_ORIGINS || '').trim()) {
    console.warn('WARNING: ALLOWED_ORIGINS no configurado.');
}
```

## 7. AppConfigContext — Autenticación en /api/applications

**No aplica a LoopChat.** Este patrón es específico del frontend Vite+React compartido por las otras 10 apps (`AppConfigContext.tsx`) — LoopChat no lo usa ni lo necesita, su frontend es el propio de Meteor/Fuselage.

## 8. Antes de hacer push

Ejecutar el verificador automático (adaptado a Yarn/Turborepo — ver comentarios en el propio script):
```bash
./check-security.sh
```

O instalar como hook permanente:
```bash
bash install-hooks.sh
```

### 8.1 `git push` — usar siempre un timeout largo

El hook `pre-push` corre `check-security.sh` completo antes de dejar pasar el push. En este repo en particular, si `node_modules` está instalado, el `typecheck`/`lint`/`audit` de un monorepo del tamaño de Rocket.Chat pueden tardar **considerablemente más** que en las otras 10 apps — no asumir que 5 minutos alcanzan aquí; verificar el tiempo real la primera vez que se corra con dependencias instaladas y ajustar el timeout del agente en consecuencia.

**Todo agente que ejecute `git push` en este repo DEBE usar un timeout explícito de al menos 300000 ms (5 minutos)**, no el valor por defecto de su herramienta de shell. Un timeout corto no cancela el hook — solo mata el proceso de la terminal del agente a mitad de camino, dejando el push a medio subir sin ningún error real de Git ni del hook.

Si el push aun así no termina dentro de ese margen, verificar con `git ls-remote <remoto> <rama>` cuál de los remotos (GitHub/Forgejo) quedó desactualizado y reintentar el push únicamente contra ese remoto.

### 8.2 Confirmar con el usuario antes de comitear y pushear cambios de código

Cuando el usuario pida un cambio o mejora de código, el agente DEBE implementarlo y verificarlo (`yarn typecheck`/`yarn lint`/`check-security.sh`) primero, y **recién después preguntar explícitamente si se procede con el commit y push, aclarando a qué rama** — nunca comitear/pushear el código de la aplicación por iniciativa propia sin esa confirmación.

Una vez que el usuario confirma:
1. Comitear y pushear el cambio de código a la rama indicada (con el timeout de la regla 8.1).
2. Abrir/enriquecer la bitácora correspondiente en SIATC Memory (regla 10.1) y sincronizarla con su propio commit y push (regla 10.4) — este paso sigue siendo obligatorio y no requiere una segunda confirmación, ya que aplica a la documentación del cambio, no al código de producción.

**Por qué esto es distinto de comitear sin preguntar:** el código de una aplicación productiva (o su rama de feature) es un cambio de mayor impacto que una nota de memoria — el usuario decide cuándo y a qué rama sube su propio trabajo. La bitácora de SIATC Memory es responsabilidad exclusiva del agente y no necesita esa misma pausa.

## 9. Decisiones de Seguridad Descartadas Permanentemente

Estas medidas fueron evaluadas y **descartadas de forma deliberada** para el resto del ecosistema. No son olvidos ni deuda técnica — no deben reimplementarse ni levantarse como hallazgos en auditorías futuras. Aplican a los endpoints propios de SIATC que se agreguen en `apps/meteor/server/siatc/`; **no** aplican a la sesión propia de usuarios del chat, que Meteor gestiona con su propio mecanismo de cuentas, fuera del alcance de esta sección.

### 9.1 Cookies HttpOnly para tokens JWT

**Descartado:** Los JWT propios de SIATC (no la sesión de Meteor) se almacenan en memoria del cliente y viajan en el header `Authorization: Bearer <token>`. No se usan cookies.

**Motivo:** La arquitectura SSO multi-app sobre `.siatc.cloud` requiere que el JavaScript del browser pueda leer y compartir el token entre subdominios. `HttpOnly` impide ese acceso y rompe el SSO.

**Mitigaciones activas que sustituyen HttpOnly:**
- JWT blacklist en Redis con TTL = tiempo restante del token (logout inmediato)
- Rate limiting persistente en Redis (general + auth por app)
- `secure: true` y `sameSite: lax` en la cookie de sesión donde aplica
- Expiración de token en 12 horas

### 9.2 Rechazar requests sin header `Origin` en CORS

**Descartado:** El patrón `if (!origin || allowedOrigins.includes(origin))` en todas las apps permite requests sin header `Origin`. No se cambiará a rechazar `!origin` en producción.

**Motivo:** CORS protege navegadores, no APIs. Un atacante con servidor propio puede fabricar cualquier `Origin`. Rechazar `!origin` solo rompe clientes legítimos que no son navegadores (AppSheet, scripts de migración, Postman del equipo, llamadas server-to-server) sin agregar protección real.

**Por qué no es una brecha:** El JWT sigue siendo obligatorio en cada endpoint mediante `verifyToken`. Un request sin `Origin` y sin token válido recibe 401. La protección real es el JWT, no CORS.

**Lo que CORS sí hace en este ecosistema:** Impide que scripts en dominios no autorizados usen las credenciales del usuario logueado para llamar a la API desde el browser del usuario. Eso funciona correctamente con el patrón actual.

## 10. Reglas de Memoria y Documentación (Obsidian)

- **Lectura Obligatoria al Iniciar**: Antes de realizar cualquier análisis de código, propuesta de mejora, o modificación en esta aplicación, el agente DEBE buscar y leer las notas relevantes de la bitácora, planes e informes ubicados en la carpeta /home/diego613/Antigravity/01-Trabajo-Sole-SIATC/Ecosistema SIATC/SIATC Memory/ para entender el historial del proyecto, decisiones previas y patrones de diseño existentes. Para este repo en particular, leer primero `planes-implementacion/Migracion-LoopChat-al-Ecosistema-SIATC.md`.

### 10.1 Bitácoras de Cambio (post-commit)
- Al completar cualquier tarea o modificación, el agente DEBE abrir la nota autogenerada de Obsidian correspondiente a este cambio en /home/diego613/Antigravity/01-Trabajo-Sole-SIATC/Ecosistema SIATC/SIATC Memory/bitacora-cambios/ y enriquecerla obligatoriamente con:
  - **Arquitectura del Cambio**: Explicación técnica detallada de la lógica implementada y las decisiones tomadas.
  - **Archivos y Funciones Clave**: Detalle de qué archivos y métodos principales fueron modificados o creados.
  - **Modificaciones de BD o .env**: Registro explícito de cualquier script SQL ejecutado, nuevas columnas/tablas, o variables de entorno añadidas.

### 10.2 Planes de Implementación
- Cuando el usuario solicite un **Plan de Implementación**, el agente DEBE generar un documento .md estructurado en /home/diego613/Antigravity/01-Trabajo-Sole-SIATC/Ecosistema SIATC/SIATC Memory/planes-implementacion/<Nombre-Plan>.md con el siguiente contenido:
  - **Objetivo**: Descripción del problema, alcance y qué soluciona.
  - **Cambios Propuestos en BD**: Tablas, columnas, tipos de datos SQL y scripts ALTER/CREATE.
  - **Cambios Propuestos en Backend**: APIs, middlewares, controladores, types y nuevas variables .env.
  - **Cambios Propuestos en Frontend**: Páginas, componentes, hooks y clases CSS/tokens de estilo.
  - **Plan de Verificación**: Estrategia de pruebas locales y pasos para validar en el VPS.
  - **Plan de Reversión (Rollback)**: Pasos técnicos detallados para deshacer los cambios si algo falla en producción.

### 10.3 Informes de Análisis y Auditorías
- Cuando el usuario solicite un **Informe de Análisis** o **Auditoría**, el agente DEBE generar un documento .md estructurado en /home/diego613/Antigravity/01-Trabajo-Sole-SIATC/Ecosistema SIATC/SIATC Memory/auditorias-analisis/<Nombre-Informe>.md con el siguiente contenido:
  - **Alcance**: Qué componentes, módulos o vulnerabilidades se auditan.
  - **Hallazgos**: Lista detallada de fallos detectados, clasificados por gravedad (Alta, Media, Baja), con su impacto respectivo.
  - **Recomendaciones**: Soluciones técnicas propuestas con código de ejemplo y mejores prácticas.
  - **Conclusiones**: Estado de salud general del sistema respecto al análisis.

### 10.4 Auto-Sincronización
- Inmediatamente después de crear o editar cualquier archivo dentro de SIATC Memory (bitácora, plan de implementación o informe de auditoría), el agente DEBE abrir una terminal en la ruta de la memoria (/home/diego613/Antigravity/01-Trabajo-Sole-SIATC/Ecosistema SIATC/SIATC Memory/), hacer git add, git commit y git push para sincronizar los cambios de inmediato con Forgejo y asegurar la disponibilidad en tiempo real para el equipo.
