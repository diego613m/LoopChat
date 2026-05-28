import type { ReactNode } from 'react';

import MediaCallInstanceProvider from './MediaCallInstanceProvider';
import MediaCallViewProvider from './MediaCallViewProvider';
import type { MediaCallAppActionsContextValue } from '../experimental/AppActionButtons';

type MediaCallProviderProps = {
	children: ReactNode;
	appActions?: MediaCallAppActionsContextValue;
};

const MediaCallProvider = ({ children, appActions }: MediaCallProviderProps) => {
	return (
		<MediaCallInstanceProvider appActions={appActions}>
			<MediaCallViewProvider>{children}</MediaCallViewProvider>
		</MediaCallInstanceProvider>
	);
};

export default MediaCallProvider;
