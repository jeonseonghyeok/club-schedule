import { useNavigate, useRouter, useRouterState } from '@tanstack/react-router';
import type { HistoryLocation } from '@tanstack/history';
import { useEffect, useRef } from 'react';
import { TOAST_DURATION_MS } from '@/components/layout/ToastHost';
import { useToastStore } from '@/modules/stores/client/toast';

/**
 * 앱 전체 뒤로가기 규칙(네이티브 앱처럼)
 * - 홈은 항상 기록의 맨 아래(인덱스 0)에 둔다. 다른 화면을 바로 열었으면(우선모임 자동 이동·공유 링크·새로고침)
 *   그 아래에 홈을 끼워 넣는다.
 * - 홈이 아닌 화면에서 뒤로가기 → 몇 단계를 거쳐 왔든 홈으로.
 * - 닫을 수 있는 대화상자·시트가 열려 있으면 뒤로가기는 그것부터 닫는다.
 * - 홈에서 뒤로가기 → 첫 번째는 안내만 띄우고 머문다. 안내가 떠 있는 동안 한 번 더 누르면 앱을 나간다.
 *   (홈 위에 "종료 확인용" 기록을 하나 더 쌓아 두고, 첫 뒤로가기가 그것을 소비하게 한다.
 *    두 번째는 기록이 더 없으므로 브라우저·PWA 가 그대로 앱을 나간다.)
 */

const HOME_PATH = '/';
const HOME_HREF = '/?list=1';
export const EXIT_CONFIRM_MESSAGE = '뒤로가기를 한 번 더 누르시면 종료합니다.';

const indexOf = (location: HistoryLocation): number => location.state.__TSR_index;
const isHome = (location: HistoryLocation): boolean => location.pathname === HOME_PATH;

export const useAppBackNavigation = (): void => {
	const router = useRouter();
	const { history } = router;
	const showToast = useToastStore(state => state.actions.showToast);
	const href = useRouterState({ select: state => state.location.href });
	const reguardTimer = useRef<number | undefined>(undefined);

	// 화면이 바뀔 때마다 기록 모양을 맞춘다
	useEffect(() => {
		const location = history.location;
		if (indexOf(location) !== 0) return;
		if (isHome(location)) {
			if (!location.state.exitGuard) history.push(location.href, { exitGuard: true });
			return;
		}
		// 홈 아닌 화면이 맨 아래 → 홈을 아래에 넣고 지금 화면을 그 위로
		const current = { href: location.href, state: { ...location.state } };
		history.replace(HOME_HREF);
		history.flush();
		history.push(current.href, current.state);
	}, [history, href]);

	useEffect(() => {
		const unblock = history.block({
			enableBeforeUnload: false,
			blockerFn: ({ currentLocation, nextLocation, action }) => {
				if (action !== 'BACK' && action !== 'GO') return false;
				const currentIndex = indexOf(currentLocation);
				const nextIndex = indexOf(nextLocation);
				if (nextIndex >= currentIndex) return false;

				// 가장 위에 열린 대화상자부터 닫고 화면은 그대로 둔다
				const openDialogs = document.querySelectorAll<HTMLDialogElement>('dialog[open][data-dismissible="true"]');
				const topDialog = openDialogs[openDialogs.length - 1];
				if (topDialog) {
					topDialog.close();
					return true;
				}

				if (isHome(currentLocation) && currentLocation.state.exitGuard) {
					// 종료 확인용 기록을 소비해 홈(맨 아래)으로 내려간다 — 다음 뒤로가기는 앱을 나간다
					showToast(EXIT_CONFIRM_MESSAGE);
					window.clearTimeout(reguardTimer.current);
					reguardTimer.current = window.setTimeout(() => {
						const now = history.location;
						if (isHome(now) && indexOf(now) === 0 && !now.state.exitGuard) {
							history.push(now.href, { exitGuard: true });
						}
					}, TOAST_DURATION_MS);
					return false;
				}

				// 홈 아닌 화면(또는 위로 쌓인 홈): 맨 아래 홈으로 한 번에 간다
				if (nextIndex === 0) return false;
				window.setTimeout(() => history.go(-currentIndex, { ignoreBlocker: true }), 0);
				return true;
			},
		});
		return () => {
			unblock();
			window.clearTimeout(reguardTimer.current);
		};
	}, [history, showToast]);
};

/** 화면 안의 "홈으로"(상단 뒤로·하단 탭 홈) — 기록을 쌓지 않고 맨 아래 홈으로 돌아간다 */
export const useGoHome = (): (() => void) => {
	const router = useRouter();
	const navigate = useNavigate();
	return () => {
		const index = indexOf(router.history.location);
		if (index > 0) {
			router.history.go(-index, { ignoreBlocker: true });
			return;
		}
		void navigate({ to: HOME_PATH, search: { list: 1 }, replace: true });
	};
};
