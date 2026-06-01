import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import { OngoingCall } from '../../../views';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot().buildStoryDecorator();

export default {
	title: 'Experimental/AppActionButtons/Views/OngoingCall',
	component: OngoingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallAppActionsProvider state='ongoing'>
				<Story />
			</MockedMediaCallAppActionsProvider>
		),
	],
} satisfies Meta<typeof OngoingCall>;

export const OngoingCallStory: StoryFn<typeof OngoingCall> = () => {
	return <OngoingCall />;
};
