import { useMemo, type ReactNode } from 'react';

import { useMediaCallView } from '../../../context';
import type { MediaCallAppActionDescriptor, MediaCallAppActionsContextValue } from '../context/MediaCallAppActionsContext';
import MediaCallAppActionsContext, { sessionStateToCallState } from '../context/MediaCallAppActionsContext';

export type MediaCallAppActionsProviderProps = {
	children?: ReactNode;
	actions: MediaCallAppActionDescriptor[];
} & Pick<MediaCallAppActionsContextValue, 'handleInteraction'>;

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
