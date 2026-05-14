import type { IMessage } from '../messages';
import type { IRoom } from '../rooms';
import { UIActionButtonContext, type MediaCallState } from '../ui';
import type { IUser } from '../users';
import type { IUIKitSurface } from './IUIKitSurface';
import type {
	IUIKitIncomingInteractionContextualBarContainer,
	IUIKitIncomingInteractionMessageContainer,
	IUIKitIncomingInteractionModalContainer,
} from './UIKitIncomingInteractionContainer';

export interface IUIKitBaseIncomingInteraction {
	appId: string;
	user: IUser;
	actionId?: string;
	room?: IRoom;
	triggerId?: string;
	threadId?: string;
}

export interface IUIKitBlockIncomingInteraction extends IUIKitBaseIncomingInteraction {
	value?: string;
	message?: IMessage;
	triggerId: string;
	actionId: string;
	blockId: string;
	room: IUIKitBaseIncomingInteraction['room'];
	container:
		| IUIKitIncomingInteractionModalContainer
		| IUIKitIncomingInteractionContextualBarContainer
		| IUIKitIncomingInteractionMessageContainer;
}

export interface IUIKitViewSubmitIncomingInteraction extends IUIKitBaseIncomingInteraction {
	view: IUIKitSurface;
	triggerId: string;
}

export interface IUIKitViewCloseIncomingInteraction extends IUIKitBaseIncomingInteraction {
	view: IUIKitSurface;
	isCleared: boolean;
}

export interface IUIKitActionButtonIncomingInteraction extends IUIKitBaseIncomingInteraction {
	buttonContext: UIActionButtonContext;
	actionId: string;
	triggerId: string;
	room: IRoom;
	message?: IMessage;
	threadId?: string;
}

export interface IUIKitActionButtonMessageBoxIncomingInteraction extends IUIKitActionButtonIncomingInteraction {
	buttonContext: UIActionButtonContext.MESSAGE_BOX_ACTION;
	text?: string;
	threadId?: string;
}

export function isMessageBoxIncomingInteraction(
	interaction: IUIKitActionButtonIncomingInteraction,
): interaction is IUIKitActionButtonMessageBoxIncomingInteraction {
	return interaction.buttonContext === UIActionButtonContext.MESSAGE_BOX_ACTION;
}

export interface IUIKitActionButtonMediaCallWidgetIncomingInteraction extends IUIKitActionButtonIncomingInteraction {
	buttonContext: UIActionButtonContext.MEDIA_CALL_WIDGET_ACTION;
	callState: MediaCallState;
	callId?: string;
}

export function isMediaCallWidgetIncomingInteraction(
	interaction: IUIKitActionButtonIncomingInteraction,
): interaction is IUIKitActionButtonMediaCallWidgetIncomingInteraction {
	return interaction.buttonContext === UIActionButtonContext.MEDIA_CALL_WIDGET_ACTION;
}
