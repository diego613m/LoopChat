import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
	PeerInfo,
	PeerAutocomplete,
	Widget,
	WidgetFooter,
	WidgetHandle,
	WidgetHeader,
	WidgetContent,
	DevicePicker,
	ActionButton,
} from '../../components';
import { usePeerAutocomplete } from '../../context';
import { useMediaCallView } from '../../context/MediaCallViewContext';
import { useWidgetExternalControls } from '../../context/useWidgetExternalControls';

const NewCall = ({ ButtonSlot }: { ButtonSlot?: ReactNode }) => {
	const { t } = useTranslation();

	const { sessionState, onCall, onSelectPeer } = useMediaCallView();
	const { peerInfo } = sessionState;
	const { toggleWidget } = useWidgetExternalControls();

	const autocomplete = usePeerAutocomplete(onSelectPeer, peerInfo);

	return (
		<Widget>
			<WidgetHandle />
			<WidgetHeader title={t('New_call')}>
				<ActionButton tiny secondary={false} label={t('Close')} icon='cross' onClick={() => toggleWidget()} />
			</WidgetHeader>
			<WidgetContent>
				<PeerAutocomplete {...autocomplete} />
				{peerInfo && (
					<Box mb={8}>
						<PeerInfo {...peerInfo} />
					</Box>
				)}
			</WidgetContent>
			<WidgetFooter>
				{ButtonSlot}
				<ButtonGroup stretch>
					<DevicePicker secondary />
					<Button medium icon='phone' success flexGrow={1} onClick={onCall}>
						{t('Call')}
					</Button>
				</ButtonGroup>
			</WidgetFooter>
		</Widget>
	);
};

export default NewCall;
