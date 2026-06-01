import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import { NewCall } from '../../../views';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		New_Call: 'New Call',
		Call: 'Call',
		Enter_username_or_number: 'Enter username or number',
	})
	.buildStoryDecorator();

export default {
	title: 'Experimental/AppActionButtons/Views/NewCall',
	component: NewCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallAppActionsProvider state='new'>
				<Story />
			</MockedMediaCallAppActionsProvider>
		),
	],
} satisfies Meta<typeof NewCall>;

export const NewCallStory: StoryFn<typeof NewCall> = () => {
	return <NewCall />;
};
