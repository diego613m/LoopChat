import { Email } from 'meteor/email';

import { sendMailViaGraph } from './graphMailer';

// SIATC: intercepta TODO correo saliente de Rocket.Chat (verificación de cuenta,
// reset de contraseña, códigos de 2FA, notificaciones — Email.sendAsync es el
// único punto de convergencia real, tanto lo que pasa por Mailer.send/sendNoWrap
// como los envíos nativos de Accounts.sendVerificationEmail/sendResetPasswordEmail/
// sendEnrollmentEmail, que no pasan por Mailer — investigado leyendo el código
// fuente, no por suposición) e intenta mandarlo primero vía Microsoft Graph API.
// Si Graph no está configurado (faltan las 4 variables MS_GRAPH_*) o falla, cae al
// SMTP original configurado en el panel de administración (Resend) — funciona bien
// para el resto de dominios (Gmail, etc.), solo @sole.com.pe necesita Graph.
const originalSendAsync = Email.sendAsync;

const toAddressList = (to: unknown): string => {
	if (!to) return '';
	if (Array.isArray(to))
		return to.map((item) => (typeof item === 'string' ? item : (item as { address?: string })?.address || '')).join(',');
	if (typeof to === 'string') return to;
	return (to as { address?: string })?.address || '';
};

// El tipo del parametro se toma de la propia funcion que envolvemos en vez de escribirlo a mano:
// asi la firma encaja siempre, aunque Rocket.Chat la cambie en una version futura. Escribirla a
// mano fue justo lo que se rompio al pasar de 8.6.0-develop a 8.7.1.
type OpcionesCorreo = Parameters<typeof originalSendAsync>[0];

Email.sendAsync = async function siatcSendAsync(options: OpcionesCorreo) {
	const campos = options as { to?: unknown; subject?: string; html?: string; text?: string };
	const to = toAddressList(campos?.to);
	const html = campos?.html || (campos?.text ? `<pre>${campos.text}</pre>` : '');

	if (to && campos?.subject && html) {
		const sentViaGraph = await sendMailViaGraph(to, campos.subject, html);
		if (sentViaGraph) return;
	}

	return originalSendAsync.call(this, options);
};
