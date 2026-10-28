export const ModalType = { ALERT: 'ALERT', CONFIRM: 'CONFIRM', REASON: 'REASON' } as const;
export type ModalType = (typeof ModalType)[keyof typeof ModalType];

/** 앱 이름 — 상단 레일·PWA manifest·문서 제목과 맞춘다 */
export const APP_NAME = '모요라';
