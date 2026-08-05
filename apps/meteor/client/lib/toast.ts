import { Emitter } from '@rocket.chat/emitter';
import type { ReactNode } from 'react';

type ToastMessagePayload =
	| {
			type: 'success' | 'info' | 'warning';
			message: ReactNode | string;
			title?: string;
			options?: object;
	  }
	| {
			type: 'error';
			message: unknown;
			title?: string;
			options?: object;
	  };

const emitter = new Emitter<{
	notify: ToastMessagePayload;
}>();

// SIATC: buffer messages dispatched before ToastMessagesProvider subscribes — un
// login OAuth por redirect (server/siatc/hooks.ts) puede disparar un toast de error
// muy temprano en el arranque de la página, antes de que el provider se monte; sin
// esto el mensaje se emite al vacío (ningún listener todavía) y se pierde para
// siempre, sin ningún error visible. Se entrega al primer subscriber que se registre.
let hasSubscriber = false;
let bufferedMessages: ToastMessagePayload[] = [];

export const dispatchToastMessage = (payload: ToastMessagePayload): void => {
	if (!hasSubscriber) {
		bufferedMessages.push(payload);
		return;
	}
	emitter.emit('notify', payload);
};

export const subscribeToToastMessages = (callback: (payload: ToastMessagePayload) => void): (() => void) => {
	hasSubscriber = true;
	if (bufferedMessages.length) {
		const buffered = bufferedMessages;
		bufferedMessages = [];
		buffered.forEach(callback);
	}
	return emitter.on('notify', callback);
};
