import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import { IncomingCall } from '../../../views';
import AppActions from '../components/AppActions';
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
			<MockedMediaCallProvider state='ringing'>
				<MockedMediaCallAppActionsProvider>
					<Story />
				</MockedMediaCallAppActionsProvider>
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof IncomingCall>;

export const IncomingCallStory: StoryFn<typeof IncomingCall> = () => {
	return <IncomingCall ButtonSlot={<AppActions />} />;
};

export const IncomingCallCallStateFilterStory: StoryFn<typeof IncomingCall> = () => {
	return (
		<MockedMediaCallAppActionsProvider
			actions={[
				{ appId: 'app-id', actionId: 'no-change-label', label: 'No filters' },
				{ appId: 'app-id', actionId: 'change-label', label: 'Filters: new, ringing', callStates: ['new', 'ringing'] },
				{
					appId: 'app-id',
					actionId: 'change-variant',
					label: 'Filters: new, calling, ringing-transfer',
					callStates: ['new', 'calling', 'ringing-transfer'],
				},
			]}
		>
			<IncomingCall ButtonSlot={<AppActions />} />
		</MockedMediaCallAppActionsProvider>
	);
};
