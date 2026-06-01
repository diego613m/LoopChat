import { ButtonGroup, Divider } from '@rocket.chat/fuselage';
import { useCallback, useMemo } from 'react';

import AppActionButton from './AppActionButton';
import { useMediaCallInstance, useMediaCallView } from '../../../context';
import { useAppActionOverrides } from '../context/AppActionOverridesContext';
import type { MediaCallAppActionDescriptor, MediaCallAppActionsContextValue } from '../context/MediaCallAppActionsContext';
import { sessionStateToCallState } from '../context/MediaCallAppActionsContext';

const AppActions = () => {
	const { sessionState } = useMediaCallView();
	const { appActions, openRoomId } = useMediaCallInstance();
	const { overrides, setOverride } = useAppActionOverrides();

	const currentCallState = sessionStateToCallState(sessionState);


	const handleInteraction = useCallback<MediaCallAppActionsContextValue['handleInteraction']>(
		async (interaction) => {
			if (!appActions) {
				return;
			}

			const { key, ...button } = interaction.button as Pick<MediaCallAppActionDescriptor, 'appId' | 'actionId'> & { key: string };

			const result = await appActions.handleInteraction({ ...interaction, button });

			if (result?.update) {
				setOverride(key, result.update);
			}

			return result;
		},
		[appActions, setOverride],
	);

	const visibleActions = useMemo(() => {
		// Merge persisted overrides into the base action descriptors so that
		// AppActionButton is always initialised with the latest label/variant/actionId,
		// even after being remounted due to a widget-state transition.
		return appActions?.actions
			.map((originalAction) => {
				const action = { ...originalAction, key: `${originalAction.appId}-${originalAction.actionId}` };
				return action.key in overrides ? { ...action, ...overrides[action.key] } : action;
			})
			.filter(({ callStates }) => !callStates || callStates.includes(currentCallState));
	}, [appActions, overrides, currentCallState]);

	return (
		<>
			<ButtonGroup vertical stretch>
				{visibleActions?.map(({ key, appId, actionId, label, variant }) => (
					<AppActionButton
						key={key}
						buttonKey={key}
						appId={appId}
						actionId={actionId}
						label={label}
						variant={variant}
						sessionState={sessionState}
						currentState={currentCallState}
						currentRoomId={openRoomId}
						handleInteraction={handleInteraction}
					/>
				))}
			</ButtonGroup>
			<Divider />
		</>
	);
};

export default AppActions;
