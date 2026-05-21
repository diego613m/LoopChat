import type { MediaCallState } from '../definition/ui/IUIActionButtonDescriptor';
import type { IUIKitResponse, UIKitInteractionType } from '../definition/uikit/IUIKitInteractionType';
import type { IUIKitActionButtonIncomingInteraction } from '../definition/uikit/UIKitIncomingInteractionTypes';
import '../definition/uikit/UIKitInteractionResponder';
import '../definition/ui/IUIActionButtonDescriptor';
import '../definition/uikit/UIKitInteractionContext';
import type { IUIKitActionButtonMediaCallWidgetIncomingInteraction } from '../definition/uikit/UIKitInteractionContext';

declare module '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder' {
	/**
	 * Fields that can be selectively updated on the action button that triggered the interaction.
	 * At least one field must be provided.
	 */
	export type IUIKitActionButtonUpdateParam = {
		/** Replaces the action ID registered for this button. */
		actionId?: string;
		/** Replaces the i18n key used to render the button label. */
		labelI18n?: string;
		/** Replaces the visual variant of the button. */
		variant?: 'danger' | 'default';
		/** Disables the button if `true`, enables it if `false`. */
		disabled?: boolean;
	};

	export interface IUIKitActionButtonUpdateResponse extends IUIKitResponse {
		type: 'action_button.update';
		update: IUIKitActionButtonUpdateParam;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention -- We need the correct name to augment
	interface UIKitInteractionResponder {
		/**
		 * @experimental
		 *
		 * Signals to the UI that the action button which triggered this interaction
		 * should have its properties updated in place. Any combination of the optional
		 * fields (`actionId`, `labelI18n`, `variant`, `disabled`) may be provided; at least one
		 * must be present (enforced by the parameter type).
		 */
		updateActionButtonResponse(update: IUIKitActionButtonUpdateParam): IUIKitActionButtonUpdateResponse;
	}
}

declare module '@rocket.chat/apps-engine/definition/ui/IUIActionButtonDescriptor' {
	export type MediaCallState = 'new' | 'calling' | 'calling-transfer' | 'ringing' | 'ringing-transfer' | 'ongoing';

	export type MediaCallWidgetActionButtonDescriptor = IUIActionButtonDescriptorBase & {
		context: 'mediaCallWidgetAction';
		when?: IUActionButtonWhen & { callStates?: MediaCallState[] };
	};

	interface IUIActionButtonDescriptorMap {
		mediaCallWidgetAction: MediaCallWidgetActionButtonDescriptor;
	}
}

export function isMediaCallWidgetIncomingInteraction(
	interaction: IUIKitActionButtonIncomingInteraction,
): interaction is IUIKitActionButtonMediaCallWidgetIncomingInteraction {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- valid for experimental feature
	return interaction.buttonContext === 'mediaCallWidgetAction';
}

declare module '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionContext' {
	export interface IUIKitActionButtonMediaCallWidgetIncomingInteraction extends IUIKitActionButtonIncomingInteraction {
		callState: MediaCallState;
		callId?: string;
	}
}
