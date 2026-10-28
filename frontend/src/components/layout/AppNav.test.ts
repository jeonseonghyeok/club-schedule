import { getActiveNav, NAV_KEY } from '@/components/layout/AppNav';

describe('getActiveNav', () => {
	it('모임 화면은 홈, 관리자 화면은 설정 아래로 본다', () => {
		expect(getActiveNav('/')).toBe(NAV_KEY.HOME);
		expect(getActiveNav('/groups/4')).toBe(NAV_KEY.HOME);
		expect(getActiveNav('/map')).toBe(NAV_KEY.MAP);
		expect(getActiveNav('/settings')).toBe(NAV_KEY.SETTINGS);
		expect(getActiveNav('/admin')).toBe(NAV_KEY.SETTINGS);
	});
});
