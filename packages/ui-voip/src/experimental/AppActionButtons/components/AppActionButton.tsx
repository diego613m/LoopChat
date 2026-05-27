import { Button } from '@rocket.chat/fuselage';
import { useCallback, useState } from 'react';

import { useMediaCallInstance, useMediaCallView } from '../../../context';
import type { MediaCallAppActionDescriptor, MediaCallAppActionsContextValue } from '../context/MediaCallAppActionsContext';
import { sessionStateToCallState } from '../providers/MediaCallAppActionsProvider';

export type AppActionButtonProps = MediaCallAppActionDescriptor & {
	key: string;
} & Pick<MediaCallAppActionsContextValue, 'handleInteraction'>;

const AppActionButton = ({ appId, actionId, label, variant, handleInteraction }: AppActionButtonProps) => {
	const { sessionState } = useMediaCallView();
	const { openRoomId } = useMediaCallInstance();

	const [disabled, setDisabled] = useState(false);
	const [buttonLabel, setButtonLabel] = useState(label);
	const [buttonVariant, setButtonVariant] = useState(variant);

	const [currentActionId, setCurrentActionId] = useState(actionId);

	const onClick = useCallback(async () => {
		setDisabled(true);

		const result = await handleInteraction({
			button: { appId, actionId: currentActionId },
			sessionState: { ...sessionState, state: sessionStateToCallState(sessionState), roomId: openRoomId },
		});

		setDisabled(result?.update.disabled ?? false);

		if (!result) {
			setDisabled(false);
			return;
		}

		if (result.update.label !== undefined) {
			setButtonLabel(result.update.label);
		}
		if (result.update.variant !== undefined) {
			setButtonVariant(result.update.variant);
		}
		if (result.update.actionId !== undefined) {
			setCurrentActionId(result.update.actionId);
		}
	}, [appId, currentActionId, handleInteraction, openRoomId, sessionState]);

	return (
		<Button danger={buttonVariant === 'danger'} disabled={disabled} onClick={onClick} medium flexGrow={1}>
			{buttonLabel}
		</Button>
	);
};

export default AppActionButton;
