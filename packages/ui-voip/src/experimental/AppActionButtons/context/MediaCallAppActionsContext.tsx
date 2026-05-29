import { createContext, useContext } from 'react';

import type { SessionState } from '../../../context';

export type AppActionUpdate = Partial<Pick<MediaCallAppActionDescriptor, 'actionId' | 'label' | 'variant'>> & { disabled?: boolean };

/**
 * The mutable state of a single app action button, persisted across widget view
 * transitions (e.g. NewCall → OutgoingCall) via AppActionButtonStatesContext.
 */
export type AppActionButtonState = {
	label: string;
	variant?: 'danger';
	actionId: string;
	disabled: boolean;
};

export type MediaCallState = 'new' | 'calling' | 'calling-transfer' | 'ringing' | 'ringing-transfer' | 'ongoing';

export type MediaCallAppActionDescriptor = {
	appId: string;
	actionId: string;
	label: string;
	variant?: 'danger';
	callStates?: MediaCallState[];
};

export type MediaCallAppActionsContextValue =
	| {
			actions: MediaCallAppActionDescriptor[];
			handleInteraction: (interaction: {
				button: Pick<MediaCallAppActionDescriptor, 'appId' | 'actionId'>;
				sessionState: { state: MediaCallState; roomId?: string } & Omit<SessionState, 'state'>;
			}) => Promise<{ update: AppActionUpdate } | void>;
	  }
	| never;

export const defaultMediaCallAppActionsContextValue: MediaCallAppActionsContextValue = {
	actions: [],
	handleInteraction: Promise.resolve,
};

const MediaCallAppActionsContext = createContext<MediaCallAppActionsContextValue>(defaultMediaCallAppActionsContextValue);

export const useMediaCallAppActions = () => useContext(MediaCallAppActionsContext);

export default MediaCallAppActionsContext;

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
