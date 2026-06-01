import type { MediaCallInstanceContextValue } from '../../../context/MediaCallInstanceContext';
import MockedMediaCallProvider, { type MockedMediaCallProviderProps } from '../../../providers/MockedMediaCallProvider';

export type MockedMediaCallAppActionsProviderProps = MockedMediaCallProviderProps & Partial<MediaCallInstanceContextValue['appActions']>;
type HandleInteractionReturn = Awaited<ReturnType<NonNullable<MediaCallInstanceContextValue['appActions']>['handleInteraction']>>;

const MockedMediaCallAppActionsProvider = ({ children, actions, handleInteraction, ...rest }: MockedMediaCallAppActionsProviderProps) => {
	return (
		<MockedMediaCallProvider
			{...rest}
			appActions={{
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
						const { promise, resolve } = Promise.withResolvers<HandleInteractionReturn>();
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
			}}
		>
			{children}
		</MockedMediaCallProvider>
	);
};

export default MockedMediaCallAppActionsProvider;
