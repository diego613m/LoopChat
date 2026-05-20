import type { UIActionButtonContext } from '../definition/ui';
import type { IUIKitResponse, UIKitInteractionType } from '../definition/uikit/IUIKitInteractionType';
import '../definition/uikit/UIKitInteractionResponder';
import '../definition/ui/IUIActionButtonDescriptor';

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
		variant?: 'danger';
	};

	export interface IUIKitActionButtonUpdateResponse extends IUIKitResponse {
		type: `${UIKitInteractionType.ACTION_BUTTON_UPDATE}`;
		/** New action ID to replace the one that triggered the interaction. */
		actionId?: string;
		/** New i18n key for the button label. */
		labelI18n?: string;
		/** New visual variant for the button. */
		variant?: 'danger';
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention -- We need the correct name to augment
	interface UIKitInteractionResponder {
		/**
		 * @experimental
		 *
		 * Signals to the UI that the action button which triggered this interaction
		 * should have its properties updated in place. Any combination of the optional
		 * fields (`actionId`, `labelI18n`, `variant`) may be provided; at least one
		 * must be present (enforced by the parameter type).
		 */
		updateActionButtonResponse(updateData: IUIKitActionButtonUpdateParam): IUIKitActionButtonUpdateResponse;
	}
}

declare module '@rocket.chat/apps-engine/definition/ui/IUIActionButtonDescriptor' {
	export interface IUIActionButtonDescriptor {
		context: UIActionButtonContext | `${UIActionButtonContext} | 'mediaCallWidgetAction'`;
		// alo: string;
	}
}

