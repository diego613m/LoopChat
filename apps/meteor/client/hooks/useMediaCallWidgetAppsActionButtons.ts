import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import '@rocket.chat/apps-engine/experimental/MediaCallActionButtons';
import type { IRoom } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ActionButtonUpdatePayload } from '@rocket.chat/ui-contexts/dist/ActionManagerContext';
import type {
	MediaCallAppActionDescriptor,
	MediaCallAppActionsContextValue,
} from '@rocket.chat/ui-voip/dist/experimental/AppActionButtons';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppActionButtons } from './useAppActionButtons';
import { applyRoomFilter, useApplyButtonAuthFilter } from './useApplyButtonFilters';
import { UiKitTriggerTimeoutError } from '../../app/ui-message/client/UiKitTriggerTimeoutError';
import { Utilities } from '../../ee/lib/misc/Utilities';
import { useUiKitActionManager } from '../uikit/hooks/useUiKitActionManager';

type Options = {
	room?: IRoom;
};

const useApplyMediaCallWidgetButtonFilters = (room?: IRoom): ((button: IUIActionButton) => boolean) => {
	const applyAuthFilter = useApplyButtonAuthFilter();
	return useCallback(
		(button: IUIActionButton) => applyAuthFilter(button, room) && (!room || applyRoomFilter(button, room)),
		[applyAuthFilter, room],
	);
};

export const useMediaCallWidgetAppsActionButtons = ({ room }: Options) => {
	const { data } = useAppActionButtons('mediaCallWidgetAction');
	const actionManager = useUiKitActionManager();
	const applyButtonFilters = useApplyMediaCallWidgetButtonFilters(room);
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	return useMemo<MediaCallAppActionsContextValue>(
		() => ({
			actions:
				data?.filter(applyButtonFilters).map(
					(action): MediaCallAppActionDescriptor => ({
						label: t(Utilities.getI18nKeyForApp(action.labelI18n, action.appId)),
						variant: action.variant,
						appId: action.appId,
						actionId: action.actionId,
						...(action.when?.callStates ? { callStates: action.when.callStates } : {}),
					}),
				) || [],
			handleInteraction: async ({ button, sessionState }) => {
				const { promise, resolve } = Promise.withResolvers<Awaited<ReturnType<MediaCallAppActionsContextValue['handleInteraction']>>>();
				const updateHandler: (data: ActionButtonUpdatePayload) => void = ({ appId, actionId, update }) => {
					if (appId !== button.appId || actionId !== button.actionId) {
						return;
					}

					actionManager.off('action_button.update', updateHandler);
					clearTimeout(timeoutId);
					resolve({
						update: {
							...(update.labelI18n && { label: t(Utilities.getI18nKeyForApp(update.labelI18n, appId)) }),
							...(update.variant && { variant: update.variant }),
							...(update.disabled !== undefined && { disabled: update.disabled }),
							...(update.actionId && { actionId: update.actionId }),
						},
					});
				};

				actionManager.on('action_button.update', updateHandler);

				const timeoutId = setTimeout(() => {
					actionManager.off('action_button.update', updateHandler);
					resolve();
				}, 5000);

				await actionManager
					.emitInteraction(button.appId, {
						type: 'actionButton',
						actionId: button.actionId,
						rid: sessionState.roomId,
						payload: {
							context: 'mediaCallWidgetAction',
							callState: sessionState.state,
							callId: sessionState.callId,
						},
					})
					.catch((error) => {
						if (error instanceof UiKitTriggerTimeoutError) {
							dispatchToastMessage({ type: 'error', message: t('The_action_took_too_long_to_complete') });
							return;
						}

						dispatchToastMessage({ type: 'error', message: t('An_error_occurred_while_executing_the_action') });
					});

				return promise;
			},
		}),
		[actionManager, applyButtonFilters, data, dispatchToastMessage, t],
	);
};
