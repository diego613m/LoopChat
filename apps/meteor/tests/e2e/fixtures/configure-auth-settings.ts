import { request } from '@playwright/test';

import { Users } from './userStates';
import { BASE_API_URL } from '../config/constants';

const headers = {
	'X-Auth-Token': Users.admin.data.loginToken,
	'X-User-Id': Users.admin.data.username,
};

export default async function configureAuthSettings(): Promise<void> {
	const api = await request.newContext();
	const ldapHost = process.env.CI === 'true' ? 'openldap' : 'localhost';

	const settings = [
		{ id: 'SAML_Custom_Default_role_attribute_name', value: 'role' },
		{ id: 'SAML_Custom_Default_provider', value: 'test-sp' },
		{ id: 'SAML_Custom_Default_issuer', value: 'http://localhost:3000/_saml/metadata/test-sp' },
		{ id: 'SAML_Custom_Default_entry_point', value: 'http://localhost:8080/simplesaml/saml2/idp/SSOService.php' },
		{ id: 'SAML_Custom_Default_idp_slo_redirect_url', value: 'http://localhost:8080/simplesaml/saml2/idp/SingleLogoutService.php' },
		{ id: 'SAML_Custom_Default_button_label_text', value: 'SAML test login button' },
		{ id: 'SAML_Custom_Default_button_color', value: '#185925' },
		{ id: 'LDAP_Server_Type', value: '' },
		{ id: 'LDAP_Host', value: ldapHost },
		{ id: 'LDAP_Port', value: 1389 },
		{ id: 'LDAP_Authentication', value: true },
		{ id: 'LDAP_Authentication_UserDN', value: 'cn=admin,dc=space,dc=air' },
		{ id: 'LDAP_Authentication_Password', value: 'adminpassword' },
		{ id: 'LDAP_BaseDN', value: 'ou=users,dc=space,dc=air' },
		{ id: 'LDAP_User_Search_Field', value: 'uid' },
		{ id: 'LDAP_Username_Field', value: 'uid' },
		{ id: 'LDAP_Email_Field', value: 'mail' },
		{ id: 'LDAP_Name_Field', value: 'cn' },
		{ id: 'LDAP_Find_User_After_Login', value: false },
		{ id: 'LDAP_Sync_User_Active_State', value: 'none' },
	];

	try {
		await Promise.all(
			settings.map(async (setting) => {
				const response = await api.post(`${BASE_API_URL}/settings/${setting.id}`, {
					data: { value: setting.value },
					headers,
				});

				if (!response.ok()) {
					throw new Error(`Failed to configure auth setting ${setting.id}`);
				}
			}),
		);
	} finally {
		await api.dispose();
	}
}
