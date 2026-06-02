import { Button, ButtonGroup, Divider } from '@rocket.chat/fuselage';
import { useCallback } from 'react';

import { useMediaCallInstance, useMediaCallView } from '../../../context';
import { useAppActionOverrides } from '../context/AppActionOverridesContext';
import { useMediaCallAppActions, type MediaCallAppAction } from '../context/MediaCallAppActionsContext';

const AppActions = () => {
	const {
		sessionState: { callId, state: currentCallState },
	} = useMediaCallView();
	const appActions = useMediaCallAppActions();
	const { openRoomId } = useMediaCallInstance();
	const { overrides, setOverride } = useAppActionOverrides();

	const onClick = useCallback(
		async (key: MediaCallAppAction['key'], appId: string, actionId: string) => {
			setOverride(key, { disabled: true });

			const interaction = {
				button: { appId, actionId },
				sessionState: { callId: callId as string, roomId: openRoomId },
			};

			const result = await appActions.handleInteraction(interaction);

			const disabled = result?.update?.disabled ?? false;

			setOverride(key, { ...result?.update, disabled });
		},
		[appActions, setOverride, callId, openRoomId],
	);

	if (currentCallState !== 'ringing' && currentCallState !== 'calling' && currentCallState !== 'ongoing') {
		return [];
	}

	// Merge persisted overrides into the base action descriptors so that
	// AppActionButton is always initialised with the latest label/variant/actionId,
	// even after being remounted due to a widget-state transition.
	const visibleActions = appActions.actions
		.filter(({ callStates }) => !callStates || callStates.includes(currentCallState))
		.map((action) => {
			return action.key in overrides ? { ...action, ...overrides[action.key] } : action;
		});

	return (
		<>
			<ButtonGroup vertical stretch>
				{visibleActions.map(({ key, label, variant, disabled, appId, actionId }) => (
					<Button key={key} danger={variant === 'danger'} disabled={disabled} onClick={() => onClick(key, appId, actionId)}>
						{label}
					</Button>
				))}
			</ButtonGroup>
			<Divider />
		</>
	);
};

export default AppActions;
