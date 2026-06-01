import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import { OngoingCall } from '../../../views';
import AppActions from '../components/AppActions';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot().buildStoryDecorator();

export default {
	title: 'V2/Experimental/AppActionButtons/Views/OngoingCall',
	component: OngoingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallProvider state='ongoing'>
				<MockedMediaCallAppActionsProvider>
					<Story />
				</MockedMediaCallAppActionsProvider>
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof OngoingCall>;

export const OngoingCallStory: StoryFn<typeof OngoingCall> = () => {
	return <OngoingCall ButtonSlot={<AppActions />} />;
};
