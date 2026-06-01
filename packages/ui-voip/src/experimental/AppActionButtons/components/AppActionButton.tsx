import { Button } from '@rocket.chat/fuselage';
import { useCallback, useState } from 'react';

import { type SessionState } from '../../../context';
import type { MediaCallAppActionDescriptor, MediaCallAppActionsContextValue, MediaCallState } from '../context/MediaCallAppActionsContext';

export type AppActionButtonProps = MediaCallAppActionDescriptor & {
	sessionState: SessionState;
	currentRoomId?: string;
	currentState: MediaCallState;
} & Pick<MediaCallAppActionsContextValue, 'handleInteraction'>;

const AppActionButton = ({
	appId,
	actionId,
	label,
	variant,
	handleInteraction,
	sessionState,
	currentState,
	currentRoomId,
}: AppActionButtonProps) => {
	const [state, setState] = useState({
		label,
		variant,
		actionId,
		disabled: false,
	});

	const onClick = useCallback(async () => {
		setState((prevState) => ({ ...prevState, disabled: true }));

		const result = await handleInteraction({
			button: { appId, actionId: state.actionId },
			sessionState: { ...sessionState, state: currentState, roomId: currentRoomId },
		});

		const disabled = result?.update.disabled ?? false;

		setState((prevState) => ({ ...prevState, disabled }));

		if (!result) {
			return;
		}

		setState((prevState) => ({
			...prevState,
			...(result.update.label && { label: result.update.label }),
			...(result.update.variant && { variant: result.update.variant }),
			...(result.update.actionId && { actionId: result.update.actionId }),
		}));
	}, [handleInteraction, appId, state.actionId, sessionState, currentState, currentRoomId]);

	return (
		<Button danger={state.variant === 'danger'} disabled={state.disabled} onClick={onClick} medium flexGrow={1}>
			{state.label}
		</Button>
	);
};

export default AppActionButton;
