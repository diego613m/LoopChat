import { Box, Icon } from '@rocket.chat/fuselage';
import { useTooltipOpen, useTooltipClose } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useExpirationText } from './useExpirationText';

const STATUS_LABEL_KEYS: Record<string, string> = {
	online: 'Online',
	away: 'Away',
	busy: 'Busy',
	offline: 'Offline',
};

export function useStatusTooltip(statusText?: string, statusExpiresAt?: Date | string, status?: string) {
	const { t } = useTranslation();
	const expirationText = useExpirationText(statusExpiresAt);
	const openTooltip = useTooltipOpen();
	const closeTooltip = useTooltipClose();

	const handleMouseEnter = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			if (!statusText) {
				return;
			}
			const statusLabelKey = status ? STATUS_LABEL_KEYS[status] : undefined;
			const headline = statusLabelKey ? `${t(statusLabelKey)} - ${statusText}` : statusText;
			openTooltip(
				<Box>
					<Box fontScale='p2'>{headline}</Box>
					{expirationText && (
						<Box color='secondary-info' display='flex' alignItems='center'>
							<Icon name='clock' size='x16' mie={4} />
							{expirationText}
						</Box>
					)}
				</Box>,
				e.currentTarget,
			);
		},
		[statusText, status, expirationText, openTooltip, t],
	);

	return {
		hasStatusText: !!statusText,
		handleMouseEnter,
		handleMouseLeave: closeTooltip,
	};
}
