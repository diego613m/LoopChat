import { ButtonGroup, Button, Divider } from '@rocket.chat/fuselage';

import { useMediaCallAppActions, type MediaCallAppActionDescriptor } from '../context/MediaCallAppActionsContext';

export type AppActionsProps = {
	callState: MediaCallAppActionDescriptor['handleInteraction'] extends (callState: infer CallState) => void ? CallState : never;
};

const AppActions = ({ callState }: AppActionsProps) => {
	const { actions, updateAction } = useMediaCallAppActions();

	if (!actions.length) {
		return null;
	}

	return (
		<>
			<ButtonGroup vertical stretch>
				{actions.map(({ appId, actionId, disabled, label, variant, handleInteraction }) => (
					<Button
						key={appId.concat(actionId)}
						disabled={disabled}
						medium
						danger={variant === 'danger'}
						flexGrow={1}
						onClick={async () => {
							updateAction(appId, actionId, {
								disabled: true,
							});

							const update = await handleInteraction(callState);

							updateAction(appId, actionId, { disabled: false, ...update?.update });
						}}
					>
						{label}
					</Button>
				))}
			</ButtonGroup>
			<Divider />
		</>
	);
};

export default AppActions;
