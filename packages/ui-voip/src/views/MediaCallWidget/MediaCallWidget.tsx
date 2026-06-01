import { OngoingCall, NewCall, IncomingCall, OutgoingCall, IncomingCallTransfer, OutgoingCallTransfer } from '..';
import OngoingCallWithScreen from './OngoingCallWithScreen';
import { useMediaCallInstance } from '../../context/MediaCallInstanceContext';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import AppActions from '../../experimental/AppActionButtons/components/AppActions';

const MediaCallWidget = () => {
	const { inRoomView } = useMediaCallInstance();
	const {
		sessionState: { state, hidden, transferredBy, peerInfo, supportedFeatures },
	} = useMediaCallView();

	if (hidden || inRoomView) {
		return null;
	}

	const RenderedAppActionsButtonGroup = <AppActions />;

	switch (state) {
		case 'ongoing':
			if ('username' in peerInfo && supportedFeatures.includes('screen-share')) {
				return <OngoingCallWithScreen />;
			}
			return <OngoingCall ButtonSlot={RenderedAppActionsButtonGroup} />;
		case 'new':
			return <NewCall ButtonSlot={RenderedAppActionsButtonGroup} />;
		case 'ringing':
			if (transferredBy) {
				return <IncomingCallTransfer ButtonSlot={RenderedAppActionsButtonGroup} />;
			}
			return <IncomingCall ButtonSlot={RenderedAppActionsButtonGroup} />;
		case 'calling':
			if (transferredBy) {
				return <OutgoingCallTransfer ButtonSlot={RenderedAppActionsButtonGroup} />;
			}
			return <OutgoingCall ButtonSlot={RenderedAppActionsButtonGroup} />;
		case 'closed':
		default:
			return null;
	}
};

export default MediaCallWidget;
