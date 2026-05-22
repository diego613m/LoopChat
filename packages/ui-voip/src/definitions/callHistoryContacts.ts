export type ExternalCallHistoryContact =
	| {
			number: string;
			name?: string;
	  }
	| {
			number?: string;
			name: string;
	  };

export type InternalCallHistoryContact = {
	_id: string;
	name?: string;
	username?: string;
	displayName?: string;
	voiceCallExtension?: string;
	avatarUrl?: string;
};

export type UnknownCallHistoryContact = {
	unknown: true;
};

export type CallHistoryContact = InternalCallHistoryContact | ExternalCallHistoryContact | UnknownCallHistoryContact;

export const isUnknownCallHistoryContact = (contact: CallHistoryContact): contact is UnknownCallHistoryContact => {
	return 'unknown' in contact && contact.unknown;
};

export const isInternalCallHistoryContact = (contact: CallHistoryContact): contact is InternalCallHistoryContact => {
	return '_id' in contact && Boolean(contact._id);
};

export const isExternalCallHistoryContact = (contact: CallHistoryContact): contact is ExternalCallHistoryContact => {
	return !isUnknownCallHistoryContact(contact) && !isInternalCallHistoryContact(contact);
};
