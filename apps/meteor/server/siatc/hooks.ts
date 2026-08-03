import { Meteor } from 'meteor/meteor';

import { beforeCreateUserCallback } from '../lib/callbacks/beforeCreateUserCallback';
import { callbacks } from '../lib/callbacks';
import { checkApprovalStatus, createPendingRequest } from './pendingApproval';

// ⚠️ Fase 2 del plan de migración de LoopChat (ver SIATC Memory/planes-implementacion/
// Migracion-LoopChat-al-Ecosistema-SIATC.md). Gatea la creación/uso de cuentas de
// LoopChat contra la cola de aprobación compartida de Console (EBM.PendingSSORequests),
// el mismo patrón que ya usan las 10 apps del ecosistema — en vez del mecanismo nativo
// de Rocket.Chat (Accounts_ManuallyApproveNewUsers), decidido con Diego el 2026-08-03
// para mantener un solo lugar de aprobación (Console) para todo el ecosistema.
//
// NO VERIFICADO EN VIVO todavía — este código se escribió leyendo el código fuente real
// de Rocket.Chat (app/authentication/server/startup/index.js, app/2fa/server/loginHandler.ts)
// para replicar el patrón exacto que ya usa el propio framework, pero no hay forma de
// correr un login OAuth real contra Meteor+MongoDB+Casdoor en este entorno. Antes de
// confiar en esto en producción, probar manualmente: (1) login nuevo sin cuenta previa,
// (2) login de alguien ya aprobado, (3) login de alguien desactivado en EBM.Users
// después de haber tenido cuenta activa en LoopChat.

/**
 * Extrae el email de un usuario en construcción a partir de user.services — en el
 * momento en que corre beforeCreateUser, Rocket.Chat todavía no llenó user.emails
 * (eso pasa después, en onCreateUserAsync líneas 235-253 del startup de authentication);
 * hay que leerlo directo del servicio OAuth igual que hace el propio framework ahí.
 */
function extractEmailFromServices(user: { services?: Record<string, { email?: string }> }): string | undefined {
    if (!user.services) return undefined;
    for (const service of Object.values(user.services)) {
        if (service?.email) return service.email;
    }
    return undefined;
}

beforeCreateUserCallback.add(
    async (options: { profile?: { name?: string } }, user: { services?: Record<string, { email?: string; name?: string; username?: string }> }) => {
        const email = extractEmailFromServices(user)?.trim().toLowerCase();

        // Sin email no hay forma de verificar contra EBM.Users — no es un caso de
        // login social (ej. alta manual de admin vía consola de Meteor), se deja pasar.
        if (!email) return options;

        const status = await checkApprovalStatus(email);

        if (status.approved) return options;

        if (status.reason === 'inactive') {
            throw new Meteor.Error('siatc-account-inactive', 'Tu cuenta está desactivada. Contacta a un administrador.');
        }
        if (status.reason === 'pending') {
            throw new Meteor.Error('siatc-account-pending', 'Tu acceso a LoopChat está pendiente de aprobación por un administrador.');
        }
        if (status.reason === 'rejected') {
            throw new Meteor.Error('siatc-account-rejected', 'Tu solicitud de acceso a LoopChat fue rechazada. Contacta a un administrador.');
        }

        // status.reason === 'none' — primera vez que se ve este email, se crea la solicitud.
        const service = Object.values(user.services || {})[0];
        const fullName = service?.name || service?.username || options.profile?.name || '';
        const casdoorUserId = service?.username || '';
        await createPendingRequest(email, fullName, casdoorUserId);

        throw new Meteor.Error('siatc-account-pending', 'Tu acceso a LoopChat quedó pendiente de aprobación por un administrador.');
    },
    callbacks.priority.HIGH,
    'siatc-gate-account-creation',
);

// Defensa en profundidad: si la cuenta ya existe en Rocket.Chat (se creó cuando la
// persona SÍ estaba aprobada) pero después un admin la desactiva en EBM.Users desde
// Console, esto bloquea logins posteriores aunque la cuenta de Rocket.Chat siga activa.
callbacks.add(
    'onValidateLogin',
    async (login: { type: string; user?: { emails?: { address: string }[] } }) => {
        if (login.type === 'resume' || login.type === 'proxy' || login.type === 'cas') return login;

        const email = login.user?.emails?.[0]?.address?.trim().toLowerCase();
        if (!email) return login;

        const status = await checkApprovalStatus(email);
        if (!status.approved && status.reason !== 'none') {
            throw new Meteor.Error('siatc-account-inactive', 'Tu acceso a LoopChat ya no está activo. Contacta a un administrador.');
        }

        return login;
    },
    callbacks.priority.HIGH,
    'siatc-revalidate-account-status',
);
