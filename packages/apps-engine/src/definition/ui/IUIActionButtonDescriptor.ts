import type { UIActionButtonContext } from './UIActionButtonContext';

export enum RoomTypeFilter {
	PUBLIC_CHANNEL = 'public_channel',
	PRIVATE_CHANNEL = 'private_channel',
	PUBLIC_TEAM = 'public_team',
	PRIVATE_TEAM = 'private_team',
	PUBLIC_DISCUSSION = 'public_discussion',
	PRIVATE_DISCUSSION = 'private_discussion',
	DIRECT = 'direct',
	DIRECT_MULTIPLE = 'direct_multiple',
	LIVE_CHAT = 'livechat',
}

export enum MessageActionContext {
	MESSAGE = 'message',
	MESSAGE_MOBILE = 'message-mobile',
	THREADS = 'threads',
	STARRED = 'starred',
}

export interface IUActionButtonWhen {
	roomTypes?: Array<RoomTypeFilter>;
	messageActionContext?: Array<MessageActionContext>;
	hasOnePermission?: Array<string>;
	hasAllPermissions?: Array<string>;
	hasOneRole?: Array<string>;
	hasAllRoles?: Array<string>;
}

type IUIActionButtonDescriptorBase = {
	actionId: string;
	labelI18n: string;
	variant?: 'danger';
	category?: 'default' | 'ai';
};

export type MediaCallState = 'new' | 'calling' | 'calling-transfer' | 'ringing' | 'ringing-transfer' | 'ongoing';

type IMediaCallWidgetActionButtonDescriptor = IUIActionButtonDescriptorBase & {
	context: UIActionButtonContext.MEDIA_CALL_WIDGET_ACTION;
	when?: IUActionButtonWhen & { callStates?: MediaCallState[] };
};

type IOtherActionButtonDescriptor = IUIActionButtonDescriptorBase & {
	context: Exclude<UIActionButtonContext, UIActionButtonContext.MEDIA_CALL_WIDGET_ACTION>;
	when?: IUActionButtonWhen;
};

export type IUIActionButtonDescriptor = IMediaCallWidgetActionButtonDescriptor | IOtherActionButtonDescriptor;

export type IUIActionButton = IUIActionButtonDescriptor & { appId: string };
