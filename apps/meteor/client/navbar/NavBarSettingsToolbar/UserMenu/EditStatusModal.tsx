import { UserStatus as UserStatusType } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	Field,
	FieldLabel,
	FieldRow,
	FieldError,
	FieldHint,
	TextInput,
	InputBox,
	Select,
	Callout,
	Margins,
	Modal,
	Button,
	Box,
	ModalHeader,
	ModalIcon,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useSetting, useEndpoint, useUser } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import type { ReactElement, ChangeEvent, ComponentProps, FormEvent } from 'react';
import { useState, useCallback, useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../../components/MarkdownText';
import { UserStatus } from '../../../components/UserStatus';
import UserStatusMenu from '../../../components/UserStatusMenu';
import { useExpirationText } from '../../../components/UserStatusText';
import { useFormatTime } from '../../../hooks/useFormatTime';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../../lib/constants';

type EditStatusModalProps = {
	onClose: () => void;
};

type DurationOption = {
	value: string;
	getLabel: (t: TFunction, formatTime: (d: Date) => string, now: Date) => string;
	getExpiresAt?: (now: Date) => Date;
};

const DURATION_OPTIONS: DurationOption[] = [
	{ value: '', getLabel: (t) => t('Status_dont_clear') },
	{
		value: '30',
		getLabel: (t, formatTime, now) => `${t('Status_30_minutes')} (${formatTime(new Date(now.getTime() + 30 * 60_000))})`,
		getExpiresAt: (now) => new Date(now.getTime() + 30 * 60_000),
	},
	{
		value: '60',
		getLabel: (t, formatTime, now) => `${t('Status_1_hour')} (${formatTime(new Date(now.getTime() + 60 * 60_000))})`,
		getExpiresAt: (now) => new Date(now.getTime() + 60 * 60_000),
	},
	{
		value: '240',
		getLabel: (t, formatTime, now) => `${t('Status_4_hours')} (${formatTime(new Date(now.getTime() + 240 * 60_000))})`,
		getExpiresAt: (now) => new Date(now.getTime() + 240 * 60_000),
	},
	{
		value: 'today',
		getLabel: (t, formatTime, now) =>
			`${t('Today')} (${formatTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999))})`,
		getExpiresAt: (now) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
	},
	{ value: 'custom', getLabel: (t) => t('Status_choose_date_and_time') },
];

const EditStatusModal = ({ onClose }: EditStatusModalProps): ReactElement => {
	const user = useUser();
	const allowUserStatusMessageChange = useSetting('Accounts_AllowUserStatusMessageChange');
	const dispatchToastMessage = useToastMessageDispatch();
	const [customStatus, setCustomStatus] = useLocalStorage<string>('Local_Custom_Status', '');
	const initialStatusText = user?.statusText ?? customStatus ?? '';

	const { t } = useTranslation();
	const modalId = useId();
	const [statusText, setStatusText] = useState(initialStatusText);
	const [statusType, setStatusType] = useState(user?.status ?? UserStatusType.ONLINE);
	const [statusTextError, setStatusTextError] = useState<string | undefined>();
	const [durationError, setDurationError] = useState<string | undefined>();
	const [duration, setDuration] = useState('');
	const [customDate, setCustomDate] = useState(() => new Date().toLocaleDateString('en-CA'));
	const [customTime, setCustomTime] = useState(() => new Date().toTimeString().slice(0, 5));
	const minCustomDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

	const setUserStatus = useEndpoint('POST', '/v1/users.setStatus');
	const formatTime = useFormatTime();

	const currentStatusText = user?.statusText || t(user?.status ?? 'offline');
	const expirationText = useExpirationText(user?.statusExpiresAt);
	const defaultStatusLabel = `${t(statusType)} (${t('Default')})`;

	const durationOptions: SelectOption[] = useMemo(
		() => DURATION_OPTIONS.map(({ value, getLabel }) => [value, getLabel(t, formatTime, new Date())]),
		[t, formatTime],
	);

	const computeExpiresAt = useCallback((): Date | undefined => {
		if (duration === 'custom') {
			if (!customDate || !customTime) {
				return undefined;
			}
			const [year, month, day] = customDate.split('-').map(Number);
			const [hours, mins] = customTime.split(':').map(Number);
			const parsedDate = new Date(year, month - 1, day, hours, mins, 0, 0);
			return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
		}

		const option = DURATION_OPTIONS.find((o) => o.value === duration);
		return option?.getExpiresAt?.(new Date());
	}, [duration, customDate, customTime]);

	const handleStatusText = useEffectEvent((e: ChangeEvent<HTMLInputElement>): void => {
		const { value } = e.currentTarget;
		setStatusText(value);
		setStatusTextError(
			value.length > USER_STATUS_TEXT_MAX_LENGTH ? t('Max_length_is', { length: USER_STATUS_TEXT_MAX_LENGTH }) : undefined,
		);
	});

	const handleSaveStatus = useCallback(async () => {
		try {
			const expiresAt = computeExpiresAt();
			if (duration === 'custom' && !expiresAt) {
				setDurationError(t('Status_choose_date_and_time'));
				return;
			}
			if (duration === 'custom' && expiresAt && expiresAt <= new Date()) {
				setDurationError(t('Status_expiration_must_be_future'));
				return;
			}
			setDurationError(undefined);
			await setUserStatus({
				message: statusText,
				status: statusType,
				...(expiresAt && { expiresAt: expiresAt.toISOString() }),
			});
			setCustomStatus(statusText);
			dispatchToastMessage({ type: 'success', message: t('StatusMessage_Changed_Successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}

		onClose();
	}, [onClose, setUserStatus, statusText, statusType, computeExpiresAt, setCustomStatus, dispatchToastMessage, t, duration]);

	return (
		<Modal
			aria-labelledby={`${modalId}-title`}
			wrapperFunction={(props: ComponentProps<typeof Box>) => (
				<Box
					is='form'
					onSubmit={(e: FormEvent) => {
						e.preventDefault();
						handleSaveStatus();
					}}
					{...props}
				/>
			)}
		>
			<ModalHeader>
				<ModalIcon name='info' />
				<ModalTitle id={`${modalId}-title`}>{t('Status_set_your_status')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent fontScale='p2'>
				<Box display='flex' flexDirection='column' rowGap={12}>
					<Field>
						<FieldLabel>{t('Status_current')}</FieldLabel>
						<Box display='flex' alignItems='center' mbs={8}>
							<UserStatus status={user?.status} />
							<Box mis={8}>
								<MarkdownText content={currentStatusText} parseEmoji variant='inlineWithoutBreaks' />
								{expirationText && (
									<Box color='hint' fontScale='c1'>
										{expirationText}
									</Box>
								)}
							</Box>
						</Box>
					</Field>
					<Field>
						<FieldLabel htmlFor={`${modalId}-status-message`}>{t('Status')}</FieldLabel>
						<FieldRow>
							<TextInput
								id={`${modalId}-status-message`}
								aria-label={t('Status')}
								error={statusTextError}
								disabled={!allowUserStatusMessageChange}
								flexGrow={1}
								value={statusText}
								onChange={handleStatusText}
								placeholder={defaultStatusLabel}
								className={css`
									align-items: center;

									& > .rcx-input-box__addon {
										order: -1;
										margin-inline-end: 0.5rem;
									}
								`}
								addon={<UserStatusMenu margin='none' initialStatus={statusType} onChange={setStatusType} placement='bottom-start' />}
							/>
						</FieldRow>
						{!allowUserStatusMessageChange && <FieldHint>{t('StatusMessage_Change_Disabled')}</FieldHint>}
						{allowUserStatusMessageChange && <FieldHint>{t('Status_you_can_use_emoji')}</FieldHint>}
						<FieldError>{statusTextError}</FieldError>
					</Field>
					<Field>
						<FieldLabel htmlFor={`${modalId}-clear-after`}>{t('Status_clear_after')}</FieldLabel>
						<FieldRow>
							<Select
								id={`${modalId}-clear-after`}
								value={duration}
								options={durationOptions}
								onChange={(value) => setDuration(String(value))}
							/>
						</FieldRow>
						{duration === 'custom' && (
							<Box display='flex' mi='neg-x4' mbs={8}>
								<Margins inline={4}>
									<InputBox
										aria-label='Expiration date'
										type='date'
										flexGrow={1}
										value={customDate}
										onChange={(e: ChangeEvent<HTMLInputElement>) => {
											setCustomDate(e.currentTarget.value);
											setDurationError(undefined);
										}}
										min={minCustomDate}
									/>
									<InputBox
										aria-label='Expiration time'
										type='time'
										flexGrow={1}
										value={customTime}
										onChange={(e: ChangeEvent<HTMLInputElement>) => {
											setCustomTime(e.currentTarget.value);
											setDurationError(undefined);
										}}
									/>
								</Margins>
							</Box>
						)}
						{durationError && <FieldError>{durationError}</FieldError>}
					</Field>
					<Callout type='info'>{t('Status_new_status_warning')}</Callout>
				</Box>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button secondary onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button primary type='submit' disabled={!!statusTextError}>
						{t('Save')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default EditStatusModal;
