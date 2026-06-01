import { Emitter } from '@rocket.chat/emitter';
import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import type { RefObject } from 'react';
import { createContext, useContext } from 'react';

import type { PeerAutocompleteOptions } from '../components';
import type { PeerInfo } from './definitions';
import type { MediaCallAppActionsContextValue } from '../experimental/AppActionButtons';

export type Signals = {
	toggleWidget: { peerInfo?: PeerInfo };
};

export type MediaCallInstanceContextValue = {
	instance: MediaSignalingSession | undefined;
	signalEmitter: Emitter<Signals>;
	audioElement: RefObject<HTMLAudioElement> | undefined;
	openRoomId: string | undefined;
	inRoomView: boolean;
	setOpenRoomId: (openRoomId: string | undefined) => void;
	getAutocompleteOptions: (filter: string) => Promise<PeerAutocompleteOptions[]>;
	setInRoomView: (inRoomView: boolean) => void;
	appActions?: MediaCallAppActionsContextValue;
};

export const MediaCallInstanceContext = createContext<MediaCallInstanceContextValue>({
	instance: undefined,
	signalEmitter: new Emitter<Signals>(),
	audioElement: undefined,
	openRoomId: undefined,
	setOpenRoomId: () => undefined,
	getAutocompleteOptions: () => Promise.resolve([]),
	inRoomView: false,
	setInRoomView: () => undefined,
});

export const useMediaCallInstance = (): MediaCallInstanceContextValue => useContext(MediaCallInstanceContext);
