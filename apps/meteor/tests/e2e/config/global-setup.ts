import addCustomOAuth from '../fixtures/addCustomOAuth';
import configureAuthSettings from '../fixtures/configure-auth-settings';
import injectInitialData from '../fixtures/inject-initial-data';
import insertApp from '../fixtures/insert-apps';

export default async function (): Promise<void> {
	await injectInitialData();
	await configureAuthSettings();

	await insertApp();

	await addCustomOAuth();
}
