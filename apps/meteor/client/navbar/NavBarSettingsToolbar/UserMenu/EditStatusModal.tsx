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
	Margins,
	Modal,
	Button,
	Box,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useSetting, useEndpoint, useUser } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent, ComponentProps, FormEvent } from 'react';
import { useState, useCallback, useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import UserStatusMenu from '../../../components/UserStatusMenu';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../../lib/constants';
import { STATUS_DURATION_OPTIONS } from '../../../lib/statusDurations';

type EditStatusModalProps = {
	onClose: () => void;
};

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

	const setUserStatus = useEndpoint('POST', '/v1/users.setStatus');

	const defaultStatusLabel = `${t(statusType)} (${t('Default')})`;

	const durationOptions: SelectOption[] = useMemo(() => STATUS_DURATION_OPTIONS.map(({ value, labelKey }) => [value, t(labelKey)]), [t]);

	const handleStatusText = useEffectEvent((e: ChangeEvent<HTMLInputElement>): void => {
		const { value } = e.currentTarget;
		setStatusText(value);
		setStatusTextError(
			value.length > USER_STATUS_TEXT_MAX_LENGTH ? t('Max_length_is', { length: USER_STATUS_TEXT_MAX_LENGTH }) : undefined,
		);
	});

	const handleSaveStatus = useCallback(async () => {
		try {
			const expiresAt = STATUS_DURATION_OPTIONS.find((o) => o.value === duration)?.getExpiresAt?.({
				now: new Date(),
				customDate,
				customTime,
			});
			if (duration === 'custom') {
				if (!expiresAt) {
					setDurationError(t('Status_choose_date_and_time'));
					return;
				}
				if (expiresAt <= new Date()) {
					setDurationError(t('Status_expiration_must_be_future'));
					return;
				}
			}
			setDurationError(undefined);
			await setUserStatus({
				message: statusText,
				status: statusType,
				...(expiresAt && { expiresAt: expiresAt.toISOString() }),
			});
			setCustomStatus(statusText);
			dispatchToastMessage({ type: 'success', message: t('StatusMessage_Changed_Successfully') });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [onClose, setUserStatus, statusText, statusType, duration, customDate, customTime, setCustomStatus, dispatchToastMessage, t]);

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
				<ModalTitle id={`${modalId}-title`}>{t('Status_set_your_status')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent fontScale='p2'>
				<Box display='flex' flexDirection='column' rowGap={12}>
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
										aria-label={t('Status_expiration_date')}
										type='date'
										flexGrow={1}
										value={customDate}
										onChange={(e: ChangeEvent<HTMLInputElement>) => {
											setCustomDate(e.currentTarget.value);
											setDurationError(undefined);
										}}
										min={new Date().toLocaleDateString('en-CA')}
									/>
									<InputBox
										aria-label={t('Status_expiration_time')}
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
						<FieldHint>{t('Status_new_status_warning')}</FieldHint>
					</Field>
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
