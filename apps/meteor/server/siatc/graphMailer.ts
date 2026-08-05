import { ConfidentialClientApplication } from '@azure/msal-node';

// Mismo patrón ya probado en producción en 9 apps del ecosistema (ver
// SIATC Console/server/lib/mailer.ts) — confirmado en vivo que el SMTP externo
// (Resend) es aceptado por el servidor de Microsoft 365 de sole.com.pe
// ("Delivered" en Resend) pero el correo se descarta en silencio después
// (no llega a bandeja, spam ni cuarentena) — una política de seguridad del
// tenant que no se puede evitar del lado del remitente. La única vía
// confirmada que sí entrega a @sole.com.pe es Microsoft Graph API, enviando
// desde un buzón interno del mismo tenant (experienciaalcliente@sole.com.pe).
const MS_GRAPH_TENANT_ID = process.env.MS_GRAPH_TENANT_ID || '';
const MS_GRAPH_CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID || '';
const MS_GRAPH_CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET || '';
const MS_GRAPH_SENDER_EMAIL = process.env.MS_GRAPH_SENDER_EMAIL || '';

let msalApp: ConfidentialClientApplication | null = null;

/** true si logró enviar por Graph; false si no está configurado o falló (el llamador decide el fallback). */
export async function sendMailViaGraph(to: string, subject: string, html: string): Promise<boolean> {
	if (!MS_GRAPH_TENANT_ID || !MS_GRAPH_CLIENT_ID || !MS_GRAPH_CLIENT_SECRET || !MS_GRAPH_SENDER_EMAIL) {
		return false;
	}

	try {
		if (!msalApp) {
			msalApp = new ConfidentialClientApplication({
				auth: {
					clientId: MS_GRAPH_CLIENT_ID,
					authority: `https://login.microsoftonline.com/${MS_GRAPH_TENANT_ID}`,
					clientSecret: MS_GRAPH_CLIENT_SECRET,
				},
			});
		}

		const tokenResponse = await msalApp.acquireTokenByClientCredential({
			scopes: ['https://graph.microsoft.com/.default'],
		});
		if (!tokenResponse?.accessToken) throw new Error('No se pudo obtener el token de acceso de Graph');

		const message = {
			message: {
				subject,
				body: { contentType: 'HTML', content: html },
				toRecipients: to
					.split(',')
					.map((address) => address.trim())
					.filter(Boolean)
					.map((address) => ({ emailAddress: { address } })),
			},
			saveToSentItems: 'true',
		};

		const response = await fetch(`https://graph.microsoft.com/v1.0/users/${MS_GRAPH_SENDER_EMAIL}/sendMail`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${tokenResponse.accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) throw new Error(`Graph API respondió ${response.status}: ${await response.text()}`);
		return true;
	} catch (err) {
		console.error('[SIATC] Error enviando correo vía Microsoft Graph, se intentará SMTP:', err);
		return false;
	}
}
