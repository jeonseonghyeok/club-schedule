import { getGroupAppPath, getIconLetter } from '@/utils/appIcon';

describe('appIcon', () => {
	it('이름 첫 글자(영문은 대문자), 비면 기본 글자', () => {
		expect(getIconLetter('독서모임')).toBe('독');
		expect(getIconLetter('  runners')).toBe('R');
		expect(getIconLetter(null)).toBe('모');
	});

	it('전용 앱 주소는 끝에 / 가 붙는다(설치 범위)', () => {
		expect(getGroupAppPath(6)).toBe('/g/6/');
	});
});
