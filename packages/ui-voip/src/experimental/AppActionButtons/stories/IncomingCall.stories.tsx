import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import { IncomingCall } from '../../../views';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Incoming_call: 'Incoming call',
		Reject: 'Reject',
		Accept: 'Accept',
	})
	.buildStoryDecorator();

export default {
	title: 'V2/Experimental/AppActionButtons/Views/IncomingCall',
	component: IncomingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallProvider>
				<MockedMediaCallAppActionsProvider>
					<Story />
				</MockedMediaCallAppActionsProvider>
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof IncomingCall>;

export const IncomingCallStory: StoryFn<typeof IncomingCall> = () => {
	return <IncomingCall />;
};
