import { MongoClient } from 'mongodb';

import * as constants from './config/constants';
import { provideContainerFor } from './containers/provideContainer';
import { Users } from './fixtures/userStates';
import { Registration } from './page-objects';
import { getUserInfo } from './utils/getUserInfo';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

const resetTestData = async () => {
	const connection = await MongoClient.connect(constants.URL_MONGODB);

	const usernamesToDelete = [Users.ldapUser1, Users.ldapUser2, Users.ldapUser3].map(({ data: { username } }) => username);
	await connection
		.db()
		.collection('users')
		.deleteMany({
			username: {
				$in: usernamesToDelete,
			},
		});

	// Also clear any LDAP-related users that might exist
	await connection
		.db()
		.collection('users')
		.deleteMany({
			'services.ldap': { $exists: true },
		});
};

test.describe('LDAP', () => {
	test.skip(!constants.IS_EE, 'Enterprise Only');

	const container = provideContainerFor('LDAP');

	test.beforeAll(async ({ api }) => {
		await resetTestData();

		// The LDAP settings are injected by the Playwright global setup; the suite only enables the feature.
		expect((await setSettingValueById(api, 'LDAP_Enable', true)).status()).toBe(200);

		await container.startUp();
	});

	test.afterAll(async () => {
		await container.cleanUp();
		await resetTestData();
	});

	test('Connection Test', async ({ api }) => {
		await test.step('Expect to successfully execute a connection test', async () => {
			const response = await api.post('/ldap.testConnection', {});
			expect(response.status()).toBe(200);
			const result = await response.json();
			expect(result.success).toBe(true);
		});
	});

	test('User Search Test', async ({ api }) => {
		await test.step('Expect to successfully search for LDAP users', async () => {
			const response = await api.post('/ldap.testSearch', {
				username: 'alan.bean',
			});
			expect(response.status()).toBe(200);
			const result = await response.json();
			expect(result.success).toBe(true);
		});
	});

	test('Login using LDAP credentials', async ({ page, api }) => {
		const poRegistration = new Registration(page);
		await page.goto('/home');

		await test.step('Expect to be able to login with LDAP credentials', async () => {
			await expect(poRegistration.username).toBeVisible({ timeout: 10000 });
			await expect(poRegistration.inputPassword).toBeVisible({ timeout: 10000 });
			await poRegistration.username.fill('alan.bean');
			await poRegistration.inputPassword.fill('ldappassword');
			await poRegistration.btnLogin.click();

			await expect(page).toHaveURL('/home');
			await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();
		});

		await test.step('Expect LDAP user data to have been mapped to the correct fields', async () => {
			const user = await getUserInfo(api, 'alan.bean');

			expect(user).toBeDefined();
			expect(user?.username).toBe('alan.bean');
			expect(user?.name).toBe('Alan Bean');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('alan.bean@space.air');
		});
	});
});
