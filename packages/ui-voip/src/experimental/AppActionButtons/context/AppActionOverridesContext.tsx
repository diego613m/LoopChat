import { createContext, useContext } from 'react';

import type { AppActionUpdate } from './MediaCallAppActionsContext';

type AppActionOverridesContextValue = {
	/** Persisted button state updates, keyed by `${appId}-${actionId}`. */
	overrides: Record<string, AppActionUpdate>;
	/** Merges `update` into the stored entry for `key`. */
	setOverride: (key: string, update: AppActionUpdate) => void;
};

const AppActionOverridesContext = createContext<AppActionOverridesContextValue>({
	overrides: {},
	setOverride: () => undefined,
});

export const useAppActionOverrides = () => useContext(AppActionOverridesContext);

export default AppActionOverridesContext;
