import type { ReactNode } from 'react';

import MediaCallInstanceProvider from './MediaCallInstanceProvider';
import MediaCallViewProvider from './MediaCallViewProvider';
import MediaCallAppActionsContext, {
	defaultMediaCallAppActionsContextValue,
} from '../experimental/AppActionButtons/context/MediaCallAppActionsContext';

type MediaCallProviderProps = {
	children: ReactNode;
};

const MediaCallProvider = ({ children }: MediaCallProviderProps) => {
	return (
		<MediaCallInstanceProvider>
			<MediaCallViewProvider>
				<MediaCallAppActionsContext.Provider value={defaultMediaCallAppActionsContextValue}>{children}</MediaCallAppActionsContext.Provider>
			</MediaCallViewProvider>
		</MediaCallInstanceProvider>
	);
};

export default MediaCallProvider;
