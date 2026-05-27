import { ButtonGroup, Divider } from '@rocket.chat/fuselage';

import AppActionButton from './AppActionButton';
import { useMediaCallAppActions } from '../context/MediaCallAppActionsContext';

const AppActions = () => {
	const { actions, handleInteraction } = useMediaCallAppActions();

	if (!actions.length) {
		return null;
	}

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
						handleInteraction={handleInteraction}
					/>
				))}
			</ButtonGroup>
			<Divider />
		</>
	);
};

export default AppActions;
