// Do not disclose if user exists when password is invalid
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

const { _runLoginHandlers } = Accounts;

Accounts._options.ambiguousErrorMessages = true;
Accounts._runLoginHandlers = async function (methodInvocation, options) {
	const result = await _runLoginHandlers.call(Accounts, methodInvocation, options);

	// SIATC: no enmascarar errores de intentos de login por OAuth — la cola de
	// aprobación (server/siatc/hooks.ts) depende de que el código de error real
	// (siatc-account-pending/inactive/rejected) le llegue intacto al cliente para
	// mostrar un aviso claro. El enmascarado a "User not found" existe para no
	// revelar si un usuario existe cuando falla una contraseña — un login OAuth
	// (credencial ya validada por el proveedor externo) no tiene ese mismo riesgo
	// de enumeración de usuarios.
	if (result.error instanceof Meteor.Error && !options?.oauth) {
		result.error = new Meteor.Error(401, 'User not found');
	}

	return result;
};
