import { useRef } from 'react';

import { OngoingCall, NewCall, IncomingCall, OutgoingCall, IncomingCallTransfer, OutgoingCallTransfer } from '..';
import OngoingCallWithScreen from './OngoingCallWithScreen';
import { useMediaCallInstance } from '../../context/MediaCallInstanceContext';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import AppActionButtonStatesContext from '../../experimental/AppActionButtons/context/AppActionButtonStatesContext';
import type { AppActionButtonState } from '../../experimental/AppActionButtons/context/MediaCallAppActionsContext';

/**
 * MediaCallWidget owns the AppActionButtonStatesContext ref so that button state
 * (labels, variants, disabled flags mutated by server responses) survives the
 * view-swaps driven by the call-state machine.  MediaCallWidget itself stays
 * mounted for the widget's entire lifetime; individual views (NewCall,
 * OutgoingCall, …) are swapped in and out below it, taking their AppActionButton
 * instances with them — but the ref here outlasts all of those remounts.
 */
const MediaCallWidget = () => {
	const buttonStatesRef = useRef<Map<string, AppActionButtonState>>(new Map());

	const { inRoomView } = useMediaCallInstance();
	const {
		sessionState: { state, hidden, transferredBy, peerInfo, supportedFeatures },
	} = useMediaCallView();

	if (hidden || inRoomView) {
		return null;
	}

	let view: React.ReactElement | null;

	switch (state) {
		case 'ongoing':
			if ('username' in peerInfo && supportedFeatures.includes('screen-share')) {
				view = <OngoingCallWithScreen />;
			} else {
				view = <OngoingCall />;
			}
			break;
		case 'new':
			view = <NewCall />;
			break;
		case 'ringing':
			view = transferredBy ? <IncomingCallTransfer /> : <IncomingCall />;
			break;
		case 'calling':
			view = transferredBy ? <OutgoingCallTransfer /> : <OutgoingCall />;
			break;
		default:
			view = null;
	}

	return <AppActionButtonStatesContext.Provider value={buttonStatesRef}>{view}</AppActionButtonStatesContext.Provider>;
};

export default MediaCallWidget;
