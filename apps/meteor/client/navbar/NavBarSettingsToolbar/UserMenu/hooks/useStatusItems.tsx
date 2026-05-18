import { Box } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetting, useUser } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCustomStatusModalHandler } from './useCustomStatusModalHandler';
import MarkdownText from '../../../../components/MarkdownText';
import { UserStatus } from '../../../../components/UserStatus';
import { useExpirationText } from '../../../../components/UserStatusText';
import { useStatusDisabledModal } from '../../../../views/admin/customUserStatus/hooks/useStatusDisabledModal';

export const useStatusItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const user = useUser();

	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);
	const handleStatusDisabledModal = useStatusDisabledModal();
	const handleCustomStatus = useCustomStatusModalHandler();

	const statusText = user?.statusText || t(user?.status ?? 'offline');
	const expirationText = useExpirationText(user?.statusExpiresAt);

	return [
		...(presenceDisabled
			? [
					{
						id: 'presence-disabled',
						content: (
							<Box fontScale='p2'>
								<Box mbe={4} wordBreak='break-word' style={{ whiteSpace: 'normal' }}>
									{t('User_status_disabled')}
								</Box>
								<Box is='a' color='info' onClick={handleStatusDisabledModal}>
									{t('Learn_more')}
								</Box>
							</Box>
						),
					},
				]
			: []),
		{
			id: 'current-status',
			status: <UserStatus status={presenceDisabled ? 'disabled' : user?.status} />,
			content: (
				<>
					<MarkdownText content={statusText} parseEmoji variant='inlineWithoutBreaks' withTruncatedText />
					{expirationText && (
						<Box color='hint' fontScale='c1'>
							{expirationText}
						</Box>
					)}
				</>
			),
			onClick: handleCustomStatus,
			disabled: presenceDisabled,
		},
	];
};
