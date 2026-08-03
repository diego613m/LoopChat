#!/bin/bash
# check-security.sh — SIATC Security Pre-Push Hook v2.0 (adaptado para LoopChat)
# Detecta patrones inseguros antes de permitir el push.
#
# Diferencias respecto al check-security.sh de las 10 apps del ecosistema:
#   - LoopChat es un monorepo Yarn Workspaces + Turborepo (Meteor), no una app
#     Vite+Express con pnpm. Build/lint/audit usan comandos de Yarn.
#   - Los controles de patrones SQL (.input(), sql.VarChar, RLS por casId) están
#     inactivos por ahora — LoopChat todavía no habla con la base Azure SQL
#     compartida (llega en la Fase 2 del plan de migración, ver SIATC Memory
#     /planes-implementacion/Migracion-LoopChat-al-Ecosistema-SIATC.md). Se
#     escanean solo dentro de apps/meteor/server/siatc/ — la carpeta donde vivirá
#     el código propio de SIATC (hook de aprobación SSO, etc.), no en el resto
#     del fork de Rocket.Chat, para no generar ruido sobre código que no escribimos.
#
# SECURITY_MODE (variable de entorno):
#   WARN  → nuevos controles son advertencias (no bloquean).
#   BLOCK → todos los controles bloquean el push.
#
# Uso manual: ./check-security.sh
# Uso automático: cp check-security.sh .git/hooks/pre-push (o bash install-hooks.sh)

SECURITY_MODE="${SECURITY_MODE:-BLOCK}"
ERRORS=0
WARNINGS=0
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

# ─── Cache: evitar re-ejecutar el chequeo completo para el mismo commit ──────
CACHE_FILE=".git/.security-check-cache"
CACHE_TTL=600  # segundos
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null)
if [ -f "$CACHE_FILE" ] && [ -n "$CURRENT_COMMIT" ]; then
    CACHED_COMMIT=$(sed -n '1p' "$CACHE_FILE" 2>/dev/null)
    CACHED_TIME=$(sed -n '2p' "$CACHE_FILE" 2>/dev/null)
    NOW=$(date +%s)
    if [ "$CACHED_COMMIT" = "$CURRENT_COMMIT" ] && [ -n "$CACHED_TIME" ] && [ $((NOW - CACHED_TIME)) -lt "$CACHE_TTL" ]; then
        echo -e "\n✅ ${GREEN}Commit ${CURRENT_COMMIT:0:12} ya validado hace $((NOW - CACHED_TIME))s — saltando chequeo completo${NC}\n"
        exit 0
    fi
fi

echo -e "\n🔍 SIATC Security Check v2.0 — LoopChat (modo: ${CYAN}${SECURITY_MODE}${NC})\n───────────────────────────────────────────"

# ─── Función auxiliar ────────────────────────────────────────────────────────
dynamic_check() {
    local label="$1"
    local matches="$2"
    local lines="$3"
    if [ -n "$matches" ]; then
        if [ "$SECURITY_MODE" = "BLOCK" ]; then
            echo -e "${RED}[${label}]${NC} → $matches"
            [ -n "$lines" ] && echo "$lines" | head -5 | sed 's/^/     /'
            ERRORS=$((ERRORS+1))
        else
            echo -e "${YELLOW}[${label}]${NC} (será BLOCK al activar modo BLOCK) → $matches"
            [ -n "$lines" ] && echo "$lines" | head -3 | sed 's/^/     /'
            WARNINGS=$((WARNINGS+1))
        fi
    fi
}

# Carpeta donde vivirá el código propio de SIATC dentro del fork (Fase 2 en adelante).
# Hoy no existe todavía — los checks de abajo simplemente no encuentran archivos, lo
# cual es el comportamiento correcto mientras no haya código propio que revisar.
SIATC_CODE_DIR="apps/meteor/server/siatc"

check_file() {
    local f="$1"

    # C1: req.query.token fuera de verifyTokenForDownload
    if grep -q "req\.query\.token" "$f" 2>/dev/null; then
        if ! grep -q "verifyTokenForDownload" "$f" 2>/dev/null; then
            echo -e "${RED}[C1-CRÍTICO]${NC} req.query.token sin verifyTokenForDownload → $f"
            grep -n "req\.query\.token" "$f" | sed 's/^/     /'
            ERRORS=$((ERRORS+1))
        fi
    fi

    # C2: Paths de Windows hardcodeados
    if grep -q "C:.Users." "$f" 2>/dev/null; then
        echo -e "${RED}[C2-CRÍTICO]${NC} Path hardcodeado de Windows → $f"
        grep -n "C:.Users." "$f" | sed 's/^/     /'
        ERRORS=$((ERRORS+1))
    fi

    # C3: path.normalize + replace (path traversal inseguro)
    if grep -q "path\.normalize" "$f" 2>/dev/null; then
        local ln
        ln=$(grep -n "path\.normalize" "$f" | head -1 | cut -d: -f1)
        if [ -n "$ln" ]; then
            local ctx
            ctx=$(sed -n "${ln},$((ln+2))p" "$f" 2>/dev/null)
            if echo "$ctx" | grep -q "\.replace"; then
                echo -e "${RED}[C3-CRÍTICO]${NC} path.normalize+replace detectado (usar path.resolve+startsWith) → $f:$ln"
                ERRORS=$((ERRORS+1))
            fi
        fi
    fi

    # C5/C9: .input() sin tipo SQL explícito (patrón mssql — solo aplica a código propio SIATC)
    local sql_hit
    sql_hit=$(grep -nP "\.input\(['\"][^'\"]+['\"]\s*,\s*(?!sql\.)" "$f" 2>/dev/null | grep -v "^\s*//" || true)
    if [ -n "$sql_hit" ]; then
        echo -e "${YELLOW}[C9-ADVERTENCIA]${NC} .input() sin tipo SQL explícito → $f"
        echo "$sql_hit" | sed 's/^/     /'
        WARNINGS=$((WARNINGS+1))
    fi

    # C11: .request().query() directo sin .input()
    local c11_hit
    c11_hit=$(grep -nP "\.request\(\)\.(query|execute)\(" "$f" 2>/dev/null | grep -v "^\s*//" || true)
    if [ -n "$c11_hit" ]; then
        echo -e "${YELLOW}[C11-ADVERTENCIA]${NC} .request().query() sin .input() — verificar parámetros → $f"
        echo "$c11_hit" | sed 's/^/     /'
        WARNINGS=$((WARNINGS+1))
    fi

    # C5-SQLTYPES: sql.VarChar / sql.NVarChar sin longitud
    local varChar_lines varChar_hit
    varChar_lines=$(grep -nP "sql\.(VarChar|NVarChar)[^(]" "$f" 2>/dev/null | grep -v "^\s*//" || true)
    varChar_hit=$(echo "$varChar_lines" | grep -c . || true)
    if [ "${varChar_hit:-0}" -gt 0 ]; then
        dynamic_check "C5-SQLTYPES: sql.VarChar/NVarChar sin longitud — especificar sql.VarChar(N)" \
                      "$f (${varChar_hit} ocurrencias)" "$varChar_lines"
    fi

    # C10-ERRORES: err.message expuesto en respuesta HTTP sin safeError()
    local errMsg_hit errMsg_lines
    errMsg_lines=$(grep -nE "\.json\(.*err(or)?\.message|res\..*\(.*err(or)?\.message" "$f" 2>/dev/null \
                   | grep -v "safeError\|NODE_ENV\|// sec-ok" || true)
    errMsg_hit=$(echo "$errMsg_lines" | grep -c . || true)
    if [ "${errMsg_hit:-0}" -gt 0 ]; then
        dynamic_check "C10-ERRORES: err.message expuesto en HTTP — usar safeError()" \
                      "$f (${errMsg_hit} ocurrencias)" "$errMsg_lines"
    fi

    # C12-LOGINJECT: console.log/error/warn con datos de request sin sanitizeLog()
    local log_lines log_hit
    log_lines=$(grep -nE "console\.(log|error|warn).*req\.(body|params|query|file)" "$f" 2>/dev/null \
                | grep -v "sanitizeLog\|// sec-ok" || true)
    log_hit=$(echo "$log_lines" | grep -c . || true)
    if [ "${log_hit:-0}" -gt 0 ]; then
        dynamic_check "C12-LOGINJECT: datos de req en console sin sanitizeLog() — riesgo de log injection" \
                      "$f (${log_hit} ocurrencias)" "$log_lines"
    fi

    # C10-RLS: código propio SIATC con endpoints pero sin casId/casRUC (verificar RLS)
    if grep -qE "app\.(get|post|put|delete|patch)\(" "$f" 2>/dev/null; then
        if ! grep -qE "casId|casRUC" "$f" 2>/dev/null; then
            echo -e "${YELLOW}[C10-RLS-ADVERTENCIA]${NC} endpoint sin referencia a casId/casRUC — verificar RLS → $f"
            WARNINGS=$((WARNINGS+1))
        fi
    fi
}

# ─── Recorrer solo el código propio de SIATC (no el fork completo de Rocket.Chat) ─
if [ -d "$SIATC_CODE_DIR" ]; then
    while IFS= read -r -d '' f; do
        check_file "$f"
    done < <(find "$SIATC_CODE_DIR" \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" \) \
        ! -path "*/node_modules/*" -print0 2>/dev/null)
else
    echo -e "${CYAN}  ℹ ${SIATC_CODE_DIR}/ todavía no existe — sin código propio de SIATC que revisar aún${NC}"
fi

# ─── Typecheck (Meteor + TypeScript, sin build completo) ────────────────────
echo -e "\n📐 Verificando TypeScript (apps/meteor)..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  ⚠ Dependencias no instaladas (node_modules ausente) — ejecuta 'yarn install' primero. Omitiendo typecheck.${NC}"
    WARNINGS=$((WARNINGS+1))
else
    TYPECHECK_OUT=$(cd apps/meteor && yarn typecheck 2>&1)
    TYPECHECK_EXIT=$?
    if [ $TYPECHECK_EXIT -ne 0 ]; then
        echo -e "${RED}[C8-CRÍTICO]${NC} 'yarn typecheck' (apps/meteor) falló"
        echo "$TYPECHECK_OUT" | tail -40 | sed 's/^/     /'
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}  ✓ TypeScript OK${NC}"
    fi
fi

# ─── Lint (turbo run lint, todo el monorepo) ─────────────────────────────────
echo -e "\n🧹 Verificando lint..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  ⚠ Dependencias no instaladas — omitiendo lint${NC}"
    WARNINGS=$((WARNINGS+1))
else
    LINT_OUT=$(yarn lint 2>&1)
    LINT_EXIT=$?
    if [ $LINT_EXIT -ne 0 ]; then
        echo -e "${RED}[C6-CRÍTICO]${NC} 'yarn lint' reportó errores"
        echo "$LINT_OUT" | tail -40 | sed 's/^/     /'
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}  ✓ Lint OK${NC}"
    fi
fi

# ─── Audit de dependencias (Yarn Berry) ──────────────────────────────────────
echo -e "\n🔒 Verificando dependencias (yarn npm audit)..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  ⚠ Dependencias no instaladas — omitiendo audit${NC}"
    WARNINGS=$((WARNINGS+1))
else
    AUDIT_OUT=$(yarn npm audit --severity critical 2>&1)
    AUDIT_EXIT=$?
    if [ $AUDIT_EXIT -ne 0 ]; then
        echo -e "${YELLOW}[C7-ADVERTENCIA]${NC} yarn npm audit detectó vulnerabilidades críticas"
        echo "$AUDIT_OUT" | tail -15 | sed 's/^/     /'
        WARNINGS=$((WARNINGS+1))
    else
        echo -e "${GREEN}  ✓ Sin vulnerabilidades críticas${NC}"
    fi
fi

# ─── Resultado final ──────────────────────────────────────────────────────────
echo -e "\n───────────────────────────────────────────"
if [ "$ERRORS" -gt 0 ]; then
    echo -e "${RED}❌ Push BLOQUEADO — $ERRORS error(es) crítico(s), $WARNINGS advertencia(s)${NC}"
    echo -e "   Corrige los problemas listados antes de hacer push.\n"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    if [ "$SECURITY_MODE" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  Push permitido con $WARNINGS advertencia(s) — modo WARN activo${NC}"
        echo -e "   Estas advertencias se convertirán en BLOQUEOS al completar Etapa 3.\n"
    else
        echo -e "${YELLOW}⚠️  Push permitido con $WARNINGS advertencia(s)${NC}\n"
    fi
    [ -n "$CURRENT_COMMIT" ] && { echo "$CURRENT_COMMIT" > "$CACHE_FILE"; date +%s >> "$CACHE_FILE"; }
    exit 0
else
    echo -e "${GREEN}✅ OK — Sin problemas de seguridad detectados${NC}\n"
    [ -n "$CURRENT_COMMIT" ] && { echo "$CURRENT_COMMIT" > "$CACHE_FILE"; date +%s >> "$CACHE_FILE"; }
    exit 0
fi
