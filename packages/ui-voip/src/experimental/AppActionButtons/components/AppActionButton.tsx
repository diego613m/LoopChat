import { Button } from '@rocket.chat/fuselage';
import { useCallback, useState } from 'react';

import { type SessionState } from '../../../context';
import type {
	AppActionUpdate,
	MediaCallAppActionDescriptor,
	MediaCallAppActionsContextValue,
	MediaCallState,
} from '../context/MediaCallAppActionsContext';

export type AppActionButtonProps = {
	buttonKey: string;
	sessionState: SessionState;
	currentRoomId?: string;
	currentState: MediaCallState;
} & Pick<MediaCallAppActionDescriptor, 'appId' | 'actionId'> &
	AppActionUpdate &
	Pick<MediaCallAppActionsContextValue, 'handleInteraction'>;

const AppActionButton = ({
	buttonKey,
	appId,
	actionId,
	label,
	variant,
	handleInteraction,
	sessionState,
	currentState,
	currentRoomId,
}: AppActionButtonProps) => {
	// Only transient click state lives here. All persistent updates (label,
	// variant, actionId) are written back to AppActionOverridesContext by
	// AppActions so they survive widget-state transitions and remounts.
	const [disabled, setDisabled] = useState(false);

	const onClick = useCallback(async () => {
		setDisabled(true);

		const result = await handleInteraction({
			button: { key: buttonKey, appId, actionId } as Pick<MediaCallAppActionDescriptor, 'appId' | 'actionId'>,
			sessionState: { ...sessionState, state: currentState, roomId: currentRoomId },
		});

		setDisabled(result?.update.disabled ?? false);
	}, [handleInteraction, buttonKey, appId, actionId, sessionState, currentState, currentRoomId]);

	return (
		<Button danger={variant === 'danger'} disabled={disabled} onClick={onClick} medium flexGrow={1}>
			{label}
		</Button>
	);
};

export default AppActionButton;
