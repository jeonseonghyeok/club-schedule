import '@testing-library/jest-dom/vitest';

// jsdom 은 <dialog> 의 showModal/close 를 구현하지 않는다 — open 속성과 close 이벤트만 흉내 낸다.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
	HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
		this.open = true;
	};
	HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
		if (!this.open) return;
		this.open = false;
		this.dispatchEvent(new Event('close'));
	};
}
