import type { IUser } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { clientCallbacks } from '@rocket.chat/ui-client';
import { useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useCustomStatusModalHandler } from './useCustomStatusModalHandler';
import MarkdownText from '../../../../components/MarkdownText';
import { UserStatus } from '../../../../components/UserStatus';
import { useExpirationText } from '../../../../components/UserStatusText';
import { useFireGlobalEvent } from '../../../../hooks/useFireGlobalEvent';
import { userStatuses } from '../../../../lib/userStatuses';
import type { UserStatusDescriptor } from '../../../../lib/userStatuses';
import { useStatusDisabledModal } from '../../../../views/admin/customUserStatus/hooks/useStatusDisabledModal';

export const useStatusItems = (user?: IUser): GenericMenuItemProps[] => {
	// We should lift this up to somewhere else if we want to use it in other places

	userStatuses.invisibleAllowed = useSetting('Accounts_AllowInvisibleStatusOption', true);

	const queryClient = useQueryClient();

	useEffect(
		() =>
			userStatuses.watch(() => {
				queryClient.setQueryData(['user-statuses'], Array.from(userStatuses));
			}),
		[queryClient],
	);

	const { t } = useTranslation();

	const fireGlobalStatusEvent = useFireGlobalEvent('user-status-manually-set');
	const setStatus = useEndpoint('POST', '/v1/users.setStatus');
	const setStatusMutation = useMutation({
		mutationFn: async (status: UserStatusDescriptor) => {
			void setStatus({ status: status.statusType, message: userStatuses.isValidType(status.id) ? '' : status.name });
			void clientCallbacks.run('userStatusManuallySet', status);
			await fireGlobalStatusEvent.mutateAsync(status);
		},
	});

	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange', true);

	const { data: statuses } = useQuery({
		queryKey: ['user-statuses'],
		queryFn: async () => {
			await userStatuses.sync();
			return Array.from(userStatuses);
		},
		staleTime: Infinity,
	});

	const handleStatusDisabledModal = useStatusDisabledModal();
	const handleCustomStatus = useCustomStatusModalHandler();
	const customStatusExpiration = useExpirationText(user?.statusExpiresAt);

	if (presenceDisabled || !allowUserStatusMessageChange) {
		return [
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
		];
	}

	const customStatusItem: GenericMenuItemProps = {
		id: 'custom-status',
		onClick: handleCustomStatus,
		...(user?.statusText
			? {
					status: <UserStatus status={user.status} />,
					content: (
						<Box display='flex' flexDirection='column' rowGap={4}>
							<MarkdownText content={user.statusText} parseEmoji variant='inline' />
							{customStatusExpiration && (
								<Box color='secondary-info' display='flex' alignItems='center'>
									<Icon name='clock' size='x16' mie={4} />
									{customStatusExpiration}
								</Box>
							)}
						</Box>
					),
					addon: <Icon name='edit' size='x16' />,
				}
			: {
					icon: 'edit',
					content: t('Custom_Status'),
				}),
	};

	const presenceItems = (statuses ?? []).map(
		(status): GenericMenuItemProps => ({
			id: status.id,
			status: <UserStatus status={status.statusType} />,
			content: <MarkdownText content={status.localizeName ? t(status.name) : status.name} parseEmoji variant='inline' />,
			onClick: () => setStatusMutation.mutate(status),
		}),
	);

	return [customStatusItem, ...presenceItems];
};
