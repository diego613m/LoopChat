import CallHistoryExternalUser from './CallHistoryExternalUser';
import CallHistoryInternalUser from './CallHistoryInternalUser';
import CallHistoryUnknownUser from './CallHistoryUnknownUser';
import { isExternalCallHistoryContact, isInternalCallHistoryContact, type CallHistoryContact } from '../definitions';

type CallHistoryUserProps = {
	contact: CallHistoryContact;
};

const CallHistoryUser = ({ contact }: CallHistoryUserProps) => {
	if (isInternalCallHistoryContact(contact)) {
		return <CallHistoryInternalUser contact={contact} />;
	}

	if (isExternalCallHistoryContact(contact)) {
		return <CallHistoryExternalUser showIcon={false} contact={contact} />;
	}

	return <CallHistoryUnknownUser />;
};

export default CallHistoryUser;
