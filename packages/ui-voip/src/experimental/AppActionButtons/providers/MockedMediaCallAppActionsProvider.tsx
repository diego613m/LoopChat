import type { MediaCallAppActionsProviderProps } from './MediaCallAppActionsProvider';
import MediaCallAppActionsProvider from './MediaCallAppActionsProvider';

const MockedMediaCallAppActionsProvider = ({ children, actions }: Partial<MediaCallAppActionsProviderProps>) => {
	return (
		<MediaCallAppActionsProvider
			actions={
				actions || [
					{
						appId: 'app-id',
						actionId: 'change-label',
						label: 'Click to change label',
						handleInteraction(callState) {
							console.log(`Action clicked in call state: ${callState}`);
							const { promise, resolve } = Promise.withResolvers<{ update: { disabled: boolean; label: string } }>();
							setTimeout(() => resolve({ update: { disabled: false, label: 'New label' } }), 500);
							return promise;
						},
					},
					{
						appId: 'app-id',
						actionId: 'change-variant',
						label: 'Click to change label AND variant',
						handleInteraction(callState) {
							console.log(`Action clicked in call state: ${callState}`);
							const { promise, resolve } = Promise.withResolvers<{ update: { disabled: boolean; label: string; variant: 'danger' } }>();
							setTimeout(() => resolve({ update: { disabled: false, label: 'New label and variant', variant: 'danger' } }), 500);
							return promise;
						},
					},
				]
			}
		>
			{children}
		</MediaCallAppActionsProvider>
	);
};

export default MockedMediaCallAppActionsProvider;
