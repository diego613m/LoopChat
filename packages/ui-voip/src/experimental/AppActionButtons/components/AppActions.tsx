import { ButtonGroup, Divider } from '@rocket.chat/fuselage';

import AppActionButton from './AppActionButton';
import { useMediaCallInstance, useMediaCallView } from '../../../context';
import { sessionStateToCallState } from '../context/MediaCallAppActionsContext';

const AppActions = () => {
	const { sessionState } = useMediaCallView();
	const { appActions, openRoomId } = useMediaCallInstance();

	if (!appActions) {
		return null;
	}

	const currentCallState = sessionStateToCallState(sessionState);
	const actions = appActions.actions.filter(({ callStates }) => !callStates || callStates.includes(currentCallState));

	return (
		<>
			<ButtonGroup vertical stretch>
				{actions.map(({ appId, actionId, label, variant }) => (
					<AppActionButton
						key={`${appId}-${actionId}`}
						appId={appId}
						actionId={actionId}
						label={label}
						variant={variant}
						sessionState={sessionState}
						currentState={currentCallState}
						currentRoomId={openRoomId}
						handleInteraction={appActions.handleInteraction}
					/>
				))}
			</ButtonGroup>
			<Divider />
		</>
	);
};

export default AppActions;
