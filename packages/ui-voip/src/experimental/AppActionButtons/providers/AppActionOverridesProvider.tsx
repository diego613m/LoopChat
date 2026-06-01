import { useCallback, useState, type ReactNode } from 'react';

import AppActionOverridesContext from '../context/AppActionOverridesContext';
import type { AppActionUpdate } from '../context/MediaCallAppActionsContext';

const AppActionOverridesProvider = ({ children }: { children: ReactNode }) => {
	const [overrides, setOverrides] = useState<Record<string, AppActionUpdate>>({});

	const setOverride = useCallback((key: string, update: AppActionUpdate) => {
		setOverrides((prev) => ({ ...prev, [key]: { ...prev[key], ...update } }));
	}, []);

	return <AppActionOverridesContext.Provider value={{ overrides, setOverride }}>{children}</AppActionOverridesContext.Provider>;
};

export default AppActionOverridesProvider;
