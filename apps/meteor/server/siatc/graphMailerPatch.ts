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

Email.sendAsync = async function siatcSendAsync(options: { to?: unknown; subject?: string; html?: string; text?: string }) {
	const to = toAddressList(options?.to);
	const html = options?.html || (options?.text ? `<pre>${options.text}</pre>` : '');

	if (to && options?.subject && html) {
		const sentViaGraph = await sendMailViaGraph(to, options.subject, html);
		if (sentViaGraph) return;
	}

	return originalSendAsync.call(this, options as Parameters<typeof originalSendAsync>[0]);
};
