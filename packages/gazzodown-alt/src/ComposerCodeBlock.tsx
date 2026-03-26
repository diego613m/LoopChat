import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

type ComposerCodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

const codeBlockStyle = {
	fontFamily: 'var(--rcx-font-family-mono, monospace)',
	backgroundColor: 'var(--rcx-color-surface-tint, rgba(0, 0, 0, 0.05))',
	borderRadius: '4px',
	padding: '4px 8px',
	display: 'inline',
	whiteSpace: 'pre-wrap' as const,
} as const;

const ComposerCodeBlock = ({ lines }: ComposerCodeBlockProps): ReactElement => {
	const code = useMemo(() => lines.map((line) => line.value.value).join('\n'), [lines]);

	return <code style={codeBlockStyle}>{code}</code>;
};

export default ComposerCodeBlock;
