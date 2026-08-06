/* eslint-disable new-cap -- la librería mssql expone sus tipos SQL como funciones en PascalCase, no son constructores */
import { getReadPool, getWritePool, sql } from './db';

// AppCode que identifica a LoopChat en GAC_APP_TB_CONSOLE_APPLICATIONS y en
// EBM.PendingSSORequests — decidido con Diego el 2026-08-03. Si se renombra
// ahí, actualizar acá también.
export const APP_CODE = 'LOOP';
export const APP_LABEL = 'LoopChat';

export type ApprovalStatus =
	| { approved: true }
	| { approved: false; reason: 'inactive' }
	| { approved: false; reason: 'pending' }
	| { approved: false; reason: 'rejected'; rejectionReason: string | null }
	| { approved: false; reason: 'none' };

/**
 * Revisa si el email ya es un usuario aprobado para LoopChat en EBM.Users.
 * Mismo patrón de consulta que Flow/server/routes/ssoAuth.ts (líneas 53-67),
 * pero sin cargar rol/permisos — LoopChat no sincroniza roles de SIATC a
 * roles de Rocket.Chat en esta fase, solo gatea la creación de la cuenta.
 */
export async function checkApprovalStatus(email: string): Promise<ApprovalStatus> {
	const pool = await getReadPool();

	const userResult = await pool.request().input('email', sql.NVarChar(sql.MAX), email).input('app', sql.NVarChar(sql.MAX), APP_CODE).query(`
            SELECT CAST(IsActive AS BIT) as is_active
            FROM EBM.Users
            WHERE Email = @email AND (Apps LIKE '%' + @app + '%' OR Apps LIKE '%ADMIN%')
        `);
	const user = userResult.recordset[0];

	if (user) {
		return user.is_active ? { approved: true } : { approved: false, reason: 'inactive' };
	}

	const pendingResult = await pool
		.request()
		.input('email', sql.NVarChar(sql.MAX), email)
		.query(`SELECT TOP 1 Status, RejectionReason FROM EBM.PendingSSORequests WHERE Email = @email ORDER BY RequestedAt DESC`);
	const existing = pendingResult.recordset[0];

	if (existing?.Status === 'pending') {
		return { approved: false, reason: 'pending' };
	}
	if (existing?.Status === 'rejected') {
		return { approved: false, reason: 'rejected', rejectionReason: existing.RejectionReason ?? null };
	}
	return { approved: false, reason: 'none' };
}

/**
 * Crea la solicitud de aprobación en la cola compartida de Console. checkApprovalStatus()
 * decide si hace falta llamar acá (solo cuando reason === 'none'), pero ese chequeo no es
 * atómico con este INSERT -- dos requests casi simultáneas (doble click, doble pestaña)
 * pueden pasar el chequeo antes de que cualquiera inserte. El índice único filtrado
 * UX_PendingSSORequests_Email_Pending (Email, WHERE Status='pending') rechaza la segunda
 * con "duplicate key"; se trata como éxito (alguien más ya ganó la carrera), no como error.
 */
export async function createPendingRequest(email: string, fullName: string, casdoorUserId: string): Promise<void> {
	const pool = await getWritePool();
	try {
		await pool
			.request()
			.input('email', sql.VarChar(255), email)
			.input('fullName', sql.VarChar(200), fullName || null)
			.input('provider', sql.VarChar(50), 'sso')
			.input('casdoorUserId', sql.VarChar(100), casdoorUserId || '')
			.input('appCode', sql.VarChar(20), APP_CODE).query(`
	            INSERT INTO EBM.PendingSSORequests (Email, FullName, Provider, CasdoorUserId, AppCode)
	            VALUES (@email, @fullName, @provider, @casdoorUserId, @appCode)
	        `);
	} catch (err: unknown) {
		const msg = (err as Error)?.message || '';
		if (!msg.includes('duplicate key')) throw err;
	}
}
