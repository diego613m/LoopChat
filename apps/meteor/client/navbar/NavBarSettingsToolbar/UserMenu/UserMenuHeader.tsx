import type { IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';

type UserMenuHeaderProps = { user: IUser };

const UserMenuHeader = ({ user }: UserMenuHeaderProps) => {
	const displayName = useUserDisplayName(user);

	return (
		<Box display='flex' flexDirection='row' alignItems='center' minWidth='x208'>
			<Box mie={4}>
				<UserAvatar size='x36' username={user?.username || ''} etag={user?.avatarETag} />
			</Box>
			<Box mis={4} fontScale='p2' fontWeight='700' withTruncatedText flexGrow={1} flexShrink={1}>
				{displayName}
			</Box>
		</Box>
	);
};

export default UserMenuHeader;
