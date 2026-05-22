import type { IPushToken } from '@rocket.chat/core-typings';

type PushUpdateOptions = {
	id?: string;
	token: IPushToken['token'];
	authToken: string;
	appName: string;
	userId: string | null;
	metadata?: Record<string, unknown>;
};
declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'raix:push-update'(options: PushUpdateOptions): Promise<Omit<IPushToken, 'authToken'>>;
		'raix:push-setuser'(options: { id: string; userId: string }): Promise<boolean>;
	}
}
