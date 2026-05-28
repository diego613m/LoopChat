import type { MediaCallAppActionsProviderProps } from './MediaCallAppActionsProvider';
import { MediaCallInstanceContext, useMediaCallInstance } from '../../../context';

const MockedMediaCallAppActionsProvider = ({ children, actions, handleInteraction }: Partial<MediaCallAppActionsProviderProps>) => {
	const instanceContextValue = useMediaCallInstance();

	return (
		<MediaCallInstanceContext.Provider
			value={{
				...instanceContextValue,
				appActions: {
					actions: actions || [
						{
							appId: 'app-id',
							actionId: 'change-label',
							label: 'Click to change label',
						},
						{
							appId: 'app-id',
							actionId: 'change-variant',
							label: 'Click to change label AND variant',
						},
					],
					handleInteraction:
						handleInteraction ||
						(async ({ button, sessionState }) => {
							console.log(`Action clicked in call state`, { button, sessionState });
							const { promise, resolve } =
								Promise.withResolvers<Awaited<ReturnType<MediaCallAppActionsProviderProps['handleInteraction']>>>();
							setTimeout(() => {
								switch (button.actionId) {
									case 'change-label':
										resolve({ update: { label: 'Label changed!' } });
										break;
									case 'change-variant':
										resolve({ update: { label: 'Variant changed!', variant: 'danger' } });
										break;
									default:
										resolve({ update: {} });
								}
							}, 500);
							return promise;
						}),
				},
			}}
		>
			{children}
		</MediaCallInstanceContext.Provider>
	);
};

export default MockedMediaCallAppActionsProvider;
