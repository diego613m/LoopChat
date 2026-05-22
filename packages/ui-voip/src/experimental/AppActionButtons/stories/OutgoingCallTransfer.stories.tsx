import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import { OutgoingCallTransfer } from '../../../views';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Transferred_call__from__to: '{{from}} transferred call to',
		Transferring_call: 'Transferring call',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

export default {
	title: 'V2/Experimental/AppActionButtons/Views/OutgoingCallTransfer',
	component: OutgoingCallTransfer,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallProvider transferredBy='Joy'>
				<MockedMediaCallAppActionsProvider>
					<Story />
				</MockedMediaCallAppActionsProvider>
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof OutgoingCallTransfer>;

export const OutgoingCallTransferStory: StoryFn<typeof OutgoingCallTransfer> = () => {
	return <OutgoingCallTransfer />;
};
