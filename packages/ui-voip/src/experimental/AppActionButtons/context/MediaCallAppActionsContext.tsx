import { useContext } from 'react';

import { MediaCallInstanceContext, type SessionState } from '../../../context';

export type AppActionUpdate = {
	actionId?: string;
	label?: string;
	variant?: 'default' | 'danger';
	disabled?: boolean;
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

export const useMediaCallAppActions = () => useContext(MediaCallInstanceContext).appActions || defaultMediaCallAppActionsContextValue;

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
