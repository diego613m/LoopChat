import { useMemo, useReducer, type ReactNode } from 'react';

import type {
	MediaCallAppAction,
	MediaCallAppActionDescriptor,
	MediaCallAppActionsContextValue,
} from '../context/MediaCallAppActionsContext';
import MediaCallAppActionsContext from '../context/MediaCallAppActionsContext';

export type MediaCallAppActionsProviderProps = {
	children?: ReactNode;
	actions: MediaCallAppActionDescriptor[];
};

type DispatchAction = {
	type: 'updateAction';
	payload: { appId: string; actionId: string; update: Pick<MediaCallAppAction, 'label' | 'variant' | 'disabled'> };
};

const MediaCallAppActionsProvider = ({ children, actions }: MediaCallAppActionsProviderProps) => {
	const [actionsState, dispatch] = useReducer(
		(state: MediaCallAppActionsContextValue['actions'], action: DispatchAction): MediaCallAppActionsContextValue['actions'] => {
			if (action.type === 'updateAction') {
				return state.map((appAction) =>
					appAction.appId === action.payload.appId && appAction.actionId === action.payload.actionId
						? { ...appAction, ...action.payload.update }
						: appAction,
				);
			}

			return state;
		},
		actions.map((action) => ({ ...action, disabled: false }) as MediaCallAppAction),
	);

	const value = useMemo<MediaCallAppActionsContextValue>(
		() => ({
			actions: actionsState,
			updateAction: (appId, actionId, update) => dispatch({ type: 'updateAction', payload: { appId, actionId, update } }),
		}),
		[actionsState, dispatch],
	);

	return <MediaCallAppActionsContext.Provider value={value}>{children}</MediaCallAppActionsContext.Provider>;
};

export default MediaCallAppActionsProvider;
