import { cn, getErrorMessage } from '@/utils';

describe('getErrorMessage', () => {
	it('서버가 내려준 message 를 그대로 보여준다', () => {
		expect(getErrorMessage({ error: 'Conflict', message: '이미 가입된 모임입니다.' })).toBe('이미 가입된 모임입니다.');
	});

	it('에러 바디가 없거나 message 가 비어 있으면 기본 문구를 쓴다', () => {
		expect(getErrorMessage(undefined)).toBe('요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
		expect(getErrorMessage({ error: 'Unknown', message: '  ' })).toBe(
			'요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
		);
	});
});

describe('cn', () => {
	it('충돌하는 Tailwind 클래스는 뒤의 것이 이긴다', () => {
		expect(cn('px-2 text-sm', false, 'px-4')).toBe('text-sm px-4');
	});
});
