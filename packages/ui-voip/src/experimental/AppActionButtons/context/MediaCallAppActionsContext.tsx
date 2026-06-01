import { useContext } from 'react';

import { MediaCallInstanceContext, type SessionState } from '../../../context';

export type AppActionUpdate = {
	actionId?: string;
	label?: string;
	variant?: 'default' | 'danger';
	disabled?: boolean;
};

export type MediaCallWidgetState = 'calling' | 'ringing' | 'ongoing';

export type MediaCallAppActionDescriptor = {
	appId: string;
	actionId: string;
	label: string;
	variant?: 'danger';
	callStates?: MediaCallWidgetState[];
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

