import { Imports } from '@rocket.chat/models';

export const executeGetLatestImportOperations = async () => {
	const data = Imports.find(
		{},
		{
			sort: { _updatedAt: -1 },
			limit: 20,
		},
	);

	return data.toArray();
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getLatestImportOperations(): IImport[];
	}
}
