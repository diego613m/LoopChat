import { Button } from '@rocket.chat/fuselage';
import { memo, useCallback, useState } from 'react';

import { type SessionState } from '../../../context';
import { useAppActionButtonStates } from '../context/AppActionButtonStatesContext';
import type {
	AppActionButtonState,
	MediaCallAppActionDescriptor,
	MediaCallAppActionsContextValue,
	MediaCallState,
} from '../context/MediaCallAppActionsContext';

export type AppActionButtonProps = MediaCallAppActionDescriptor & {
	sessionState: SessionState;
	currentRoomId?: string;
	currentState: MediaCallState;
} & Pick<MediaCallAppActionsContextValue, 'handleInteraction'>;

/**
 * Wraps setState so every update is also mirrored into the shared button-states
 * ref (from AppActionButtonStatesContext).  When this button unmounts because the
 * widget transitions to a new view and then remounts inside the next view, the
 * lazy useState initialiser reads the persisted entry and the user never sees a
 * stale label/variant/disabled.
 */
function usePersistentButtonState(
	buttonKey: string,
	initialState: AppActionButtonState,
): [AppActionButtonState, (updater: (prev: AppActionButtonState) => AppActionButtonState) => void] {
	const buttonStatesRef = useAppActionButtonStates();

	const [state, setLocalState] = useState<AppActionButtonState>(
		// Lazy initialiser — runs only on mount.  If a previous interaction already
		// stored a value for this key, restore it; otherwise fall back to props.
		() => buttonStatesRef?.current.get(buttonKey) ?? initialState,
	);

	const setState = useCallback(
		(updater: (prev: AppActionButtonState) => AppActionButtonState) => {
			setLocalState((prev) => {
				const next = updater(prev);
				// Keep the shared ref in sync so a future remount can restore this state.
				buttonStatesRef?.current.set(buttonKey, next);
				return next;
			});
		},
		[buttonStatesRef, buttonKey],
	);

	return [state, setState];
}

const AppActionButton = memo(function AppActionButton({
	appId,
	actionId,
	label,
	variant,
	handleInteraction,
	sessionState,
	currentState,
	currentRoomId,
}: AppActionButtonProps) {
	const buttonKey = `${appId}-${actionId}`;

	const [state, setState] = usePersistentButtonState(buttonKey, {
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
	}, [handleInteraction, appId, state.actionId, sessionState, currentState, currentRoomId, setState]);

	return (
		<Button danger={state.variant === 'danger'} disabled={state.disabled} onClick={onClick} medium flexGrow={1}>
			{state.label}
		</Button>
	);
});

export default AppActionButton;
