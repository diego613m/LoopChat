# Plan de Implementación: Rebranding de Rocket.Chat a LoopChat

Este plan detalla los pasos para renombrar la aplicación de **Rocket.Chat** a **LoopChat** en toda la interfaz de usuario, configuraciones predeterminadas y archivos de traducción (i18n), así como la integración del nuevo diseño de logotipo.

## Revisión del Usuario Requerida

> [!IMPORTANT]
> **Alcance del Renombrado Técnico vs. Visual:**
> Para evitar romper el sistema de dependencias, compilación y empaquetado del monorepositorio (que utiliza Yarn Workspaces y Turborepo), **NO se modificarán los nombres de los paquetes NPM internos** (como `@rocket.chat/meteor` o `@rocket.chat/core-services`) ni las rutas de importación de código. El renombrado se centrará exclusivamente en:
> - Cadenas de texto visibles para el usuario en la interfaz.
> - Archivos de traducción y localización (i18n).
> - Configuraciones predeterminadas del servidor (por ejemplo, el `Site_Name` por defecto en la base de datos).
> - Los logotipos e íconos por defecto de la aplicación.

> [!TIP]
> **Diseño de Logo Generado:**
> He generado una propuesta de logo moderno para **LoopChat** en la ruta de artefactos. El concepto combina una burbuja de chat abstracta con un símbolo de infinito (bucle/loop) usando un degradado de azul eléctrico y morado:
> ![Propuesta de Logotipo de LoopChat](file:///C:/Users/diego/.gemini/antigravity/brain/a52f73be-3958-4c82-abb6-9b921f1f5064/loopchat_logo_1780580497733.png)
> Si apruebas este diseño, lo utilizaremos para generar los diferentes tamaños requeridos por la app (logo principal, logo oscuro, favicon, etc.).

---

## Cambios Propuestos

### Automatización del Rebranding (Script de Reemplazo)

Crearemos un script de Node.js en la carpeta de pruebas/scratch para automatizar la sustitución de nombres de manera segura en archivos específicos.

#### [NEW] [rename-brand.js](file:///C:/Users/diego/.gemini/antigravity/brain/a52f73be-3958-4c82-abb6-9b921f1f5064/scratch/rename-brand.js)
Un script para recorrer carpetas específicas de la aplicación y realizar los siguientes reemplazos de texto (respetando mayúsculas/minúsculas):
- `Rocket.Chat` ➔ `LoopChat`
- `RocketChat` ➔ `LoopChat`
- `rocketchat` ➔ `loopchat`

### Componentes a Modificar

#### [MODIFY] [Configuraciones por Defecto](file:///D:/diego/Documentos/Antigravity/LoopChat/apps/meteor/server/settings/general.ts)
* Modificar el valor por defecto de `Site_Name` de `'Rocket.Chat'` a `'LoopChat'`.
* Modificar URLs de descarga o deep links por defecto relacionados.

#### [MODIFY] [Archivos de Idioma e i18n](file:///D:/diego/Documentos/Antigravity/LoopChat/packages/i18n/src/locales)
* Aplicar el script de renombrado sobre los 67 archivos de traducción `.i18n.json` (incluyendo `es.i18n.json` y `en.i18n.json`) para cambiar todas las menciones a nivel de interfaz de usuario.

#### [MODIFY] [Imágenes y Logotipos por Defecto](file:///D:/diego/Documentos/Antigravity/LoopChat/apps/meteor/public/images/logo)
* Reemplazar los archivos de logos e íconos principales:
  - [logo.png](file:///D:/diego/Documentos/Antigravity/LoopChat/apps/meteor/public/images/logo/logo.png) y [logo_dark.png](file:///D:/diego/Documentos/Antigravity/LoopChat/apps/meteor/public/images/logo/logo_dark.png)
  - [logo.svg](file:///D:/diego/Documentos/Antigravity/LoopChat/apps/meteor/public/images/logo/logo.svg) y [logo_dark.svg](file:///D:/diego/Documentos/Antigravity/LoopChat/apps/meteor/public/images/logo/logo_dark.svg)
  - [favicon-16x16.png](file:///D:/diego/Documentos/Antigravity/LoopChat/apps/meteor/public/images/logo/favicon-16x16.png) y [favicon-32x32.png](file:///D:/diego/Documentos/Antigravity/LoopChat/apps/meteor/public/images/logo/favicon-32x32.png)
  - [icon.svg](file:///D:/diego/Documentos/Antigravity/LoopChat/apps/meteor/public/images/logo/icon.svg)

---

## Plan de Verificación

### Pruebas Automatizadas y de Compilación
* **Validación de Sintaxis:** Ejecutar un chequeo de tipos para asegurar que no se rompieron importaciones de TypeScript:
  ```bash
  yarn typecheck
  ```

### Verificación Manual
1. Inspeccionar visualmente que los archivos modificados (como `packages/i18n/src/locales/en.i18n.json` y `es.i18n.json`) contengan las traducciones con el término "LoopChat" en lugar de "Rocket.Chat".
2. Confirmar que los nuevos recursos gráficos reemplazados se visualicen correctamente en la ruta `apps/meteor/public/images/logo`.
