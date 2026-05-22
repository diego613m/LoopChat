import { createContext, useContext } from 'react';

type AppActionUpdate = Partial<Pick<MediaCallAppAction, 'label' | 'variant' | 'disabled'>>;

export type MediaCallAppActionDescriptor = {
	appId: string;
	actionId: string;
	label: string;
	variant?: 'danger';
	handleInteraction: (
		callState: 'new' | 'calling' | 'calling-transfer' | 'ringing' | 'ringing-transfer' | 'ongoing',
	) => Promise<{ update: AppActionUpdate } | void>;
};

export type MediaCallAppAction = MediaCallAppActionDescriptor & {
	disabled: boolean;
};

export type MediaCallAppActionsContextValue =
	| {
			actions: MediaCallAppAction[];
			updateAction: (appId: string, actionId: string, update: AppActionUpdate) => void;
	  }
	| never;

export const defaultMediaCallAppActionsContextValue: MediaCallAppActionsContextValue = {
	actions: [],
	updateAction: () => {
		/* no-op */
	},
};

const MediaCallAppActionsContext = createContext<MediaCallAppActionsContextValue>(defaultMediaCallAppActionsContextValue);

export const useMediaCallAppActions = () => useContext(MediaCallAppActionsContext);

export default MediaCallAppActionsContext;
