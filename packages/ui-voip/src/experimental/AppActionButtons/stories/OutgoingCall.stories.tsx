import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import { OutgoingCall } from '../../../views';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Calling: 'Calling',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

export default {
	title: 'Experimental/AppActionButtons/Views/OutgoingCall',
	component: OutgoingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallAppActionsProvider state='calling'>
				<Story />
			</MockedMediaCallAppActionsProvider>
		),
	],
} satisfies Meta<typeof OutgoingCall>;

export const OutgoingCallStory: StoryFn<typeof OutgoingCall> = () => {
	return <OutgoingCall />;
};
