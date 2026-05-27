import { useMemo, type ReactNode } from 'react';

import { useMediaCallView, type SessionState } from '../../../context';
import type { MediaCallAppActionDescriptor, MediaCallAppActionsContextValue, MediaCallState } from '../context/MediaCallAppActionsContext';
import MediaCallAppActionsContext from '../context/MediaCallAppActionsContext';

export type MediaCallAppActionsProviderProps = {
	children?: ReactNode;
	actions: MediaCallAppActionDescriptor[];
} & Pick<MediaCallAppActionsContextValue, 'handleInteraction'>;

export const sessionStateToCallState = (sessionState: SessionState): MediaCallState => {
	switch (sessionState.state) {
		case 'calling':
			return sessionState.transferredBy ? 'calling-transfer' : 'calling';
		case 'ringing':
			return sessionState.transferredBy ? 'ringing-transfer' : 'ringing';
		case 'ongoing':
			return 'ongoing';
		default:
			return 'new';
	}
};

const MediaCallAppActionsProvider = ({ children, actions, handleInteraction }: MediaCallAppActionsProviderProps) => {
	const view = useMediaCallView();

	const currentCallState = sessionStateToCallState(view.sessionState);

	const value = useMemo<MediaCallAppActionsContextValue>(
		() => ({
			actions: actions.filter(({ callStates }) => !callStates || callStates.includes(currentCallState)),
			handleInteraction,
		}),
		[actions, currentCallState, handleInteraction],
	);

	return <MediaCallAppActionsContext.Provider value={value}>{children}</MediaCallAppActionsContext.Provider>;
};

export default MediaCallAppActionsProvider;
