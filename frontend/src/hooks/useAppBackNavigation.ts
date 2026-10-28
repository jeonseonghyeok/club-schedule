import { useRouter, useRouterState } from '@tanstack/react-router';
import type { HistoryLocation, RouterHistory } from '@tanstack/history';
import { useEffect } from 'react';
import { TOAST_DURATION_MS } from '@/components/layout/ToastHost';
import { useToastStore } from '@/modules/stores/client/toast';

/**
 * 앱 전체 뒤로가기 규칙(네이티브 앱처럼). "앱"은 모요라(/) 또는 모임 전용 앱(/g/{id}/)이고, 각자 시작 화면(루트)이 있다.
 * - 루트는 항상 기록의 맨 아래(인덱스 0)에 둔다. 다른 화면을 바로 열었으면(우선모임 자동 이동·공유 링크·새로고침)
 *   그 아래에 루트를 끼워 넣는다.
 * - 루트가 아닌 화면에서 뒤로가기 → 몇 단계를 거쳐 왔든 루트로.
 * - 닫을 수 있는 대화상자·시트가 열려 있으면 뒤로가기는 그것부터 닫는다.
 * - 루트에서 뒤로가기 → 첫 번째는 "한 번 더 누르면 종료" 안내만 띄우고 머문다. 안내가 떠 있는 동안 한 번 더 누르면 나간다.
 *
 * 브라우저 제약과 대응
 * - Chrome 은 사용자가 페이지를 누르기 전에 스크립트가 쌓은 기록을 뒤로가기 때 건너뛴다(history manipulation
 *   intervention). 그래서 기록(루트 끼워 넣기·종료 확인 기록)은 첫 탭/키 입력 뒤에 쌓는다.
 * - Android Chrome 은 CloseWatcher 가 있어 기록 없이 뒤로가기를 받을 수 있고, 사용자 입력 전에도 하나는 만들 수 있다.
 *   링크로 막 열린 화면에서 바로 누른 뒤로가기도 루트로 보내기 위해 Android 에서는 이것을 쓴다.
 */

const MAIN_ROOT_HREF = '/?list=1';
const GROUP_APP_PATH = /^\/g\/(\d+)\//;
export const EXIT_CONFIRM_MESSAGE = '뒤로가기를 한 번 더 누르시면 종료합니다.';

const indexOf = (location: HistoryLocation): number => location.state.__TSR_index;

/** 지금 화면이 속한 앱의 루트 주소 */
export const getRootHref = (pathname: string): string => {
	const groupApp = GROUP_APP_PATH.exec(pathname);
	return groupApp ? `/g/${groupApp[1]}/` : MAIN_ROOT_HREF;
};

/** 앱의 시작 화면인지 — 모요라는 홈, 모임 전용 앱은 홈 탭 */
export const isRoot = (location: Pick<HistoryLocation, 'pathname' | 'search'>): boolean => {
	if (location.pathname === '/') return true;
	const groupApp = GROUP_APP_PATH.exec(location.pathname);
	if (!groupApp || location.pathname !== `/g/${groupApp[1]}/`) return false;
	const tab = new URLSearchParams(location.search).get('tab');
	return tab === null || tab === 'home';
};

// 사용자 활성화(탭·키 입력)로 인정되는 이벤트 — 터치의 pointerdown 은 해당하지 않는다
const ACTIVATION_EVENTS = ['pointerup', 'keydown', 'touchend'] as const;

const hasUserActivation = (): boolean => navigator.userActivation?.hasBeenActive ?? true;

/** Android 의 시스템 뒤로가기는 CloseWatcher 로 받는다(데스크톱에서는 Esc 에 반응하므로 쓰지 않는다) */
const canUseCloseWatcher = (): boolean => !!window.CloseWatcher && /Android/i.test(navigator.userAgent);

/** 맨 아래 루트로 — 루트가 맨 아래가 아니면(기록이 없으면) 지금 기록을 루트로 바꾼다 */
const goToRoot = (history: RouterHistory): void => {
	const location = history.location;
	const index = indexOf(location);
	if (index > 0) {
		history.go(-index, { ignoreBlocker: true });
		return;
	}
	history.replace(getRootHref(location.pathname));
};

const createHistoryKey = (): string => Math.random().toString(36).slice(2, 8);

/**
 * 루트 아닌 화면이 맨 아래일 때 루트를 아래에 넣고 지금 화면을 그 위로 다시 올린다.
 * 라우터의 history.replace/push 는 차단기(blocker)가 있으면 비동기로 처리되어 둘이 하나로 합쳐질 수 있으므로
 * (루트 기록이 사라짐) 브라우저 기록 API 로 순서대로 직접 쓴다. 라우터는 이 호출을 감지해 위치를 맞춘다.
 */
const insertRootBelow = (location: HistoryLocation): void => {
	const rootKey = createHistoryKey();
	window.history.replaceState({ __TSR_index: 0, key: rootKey, __TSR_key: rootKey }, '', getRootHref(location.pathname));
	const pageKey = createHistoryKey();
	window.history.pushState({ ...location.state, __TSR_index: 1, key: pageKey, __TSR_key: pageKey }, '', location.href);
};

// 종료 안내가 떠 있는 동안은 종료 확인(기록·CloseWatcher)을 다시 걸지 않는다 — 그 사이 뒤로가기는 앱을 나가야 한다
let exitArmedUntil = 0;
let closeWatcher: CloseWatcher | null = null;

const armExit = () => {
	useToastStore.getState().actions.showToast(EXIT_CONFIRM_MESSAGE);
	exitArmedUntil = Date.now() + TOAST_DURATION_MS;
};

const ensureCloseWatcher = (history: RouterHistory) => {
	if (!canUseCloseWatcher() || !window.CloseWatcher || closeWatcher) return;
	if (Date.now() < exitArmedUntil) return;
	const watcher = new window.CloseWatcher();
	watcher.onclose = () => {
		closeWatcher = null;
		if (isRoot(history.location)) armExit();
		else goToRoot(history);
	};
	closeWatcher = watcher;
};

/**
 * 앱 시작 직후(첫 렌더 전)에 부른다 — 화면이 데이터를 불러오는 동안 누른 뒤로가기도 받기 위해
 * Android 의 CloseWatcher 를 미리 걸어 둔다.
 */
export const startBackNavigation = (history: RouterHistory): void => ensureCloseWatcher(history);

export const useAppBackNavigation = (): void => {
	const router = useRouter();
	const { history } = router;
	const showToast = useToastStore(state => state.actions.showToast);
	const href = useRouterState({ select: state => state.location.href });

	useEffect(() => {
		const useWatcher = canUseCloseWatcher();

		const ensureHistoryShape = () => {
			if (!hasUserActivation()) return;
			const location = history.location;
			if (indexOf(location) !== 0) return;
			if (isRoot(location)) {
				// Android 는 CloseWatcher 가 종료 확인을 맡으므로 기록을 더 쌓지 않는다
				if (!useWatcher && !location.state.exitGuard && Date.now() >= exitArmedUntil) {
					history.push(location.href, { exitGuard: true });
				}
				return;
			}
			insertRootBelow(location);
		};

		const onActivation = () => {
			ensureHistoryShape();
			ensureCloseWatcher(history);
		};

		onActivation();
		ACTIVATION_EVENTS.forEach(type => window.addEventListener(type, onActivation, { capture: true }));
		return () => ACTIVATION_EVENTS.forEach(type => window.removeEventListener(type, onActivation, { capture: true }));
	}, [history, href]);

	useEffect(
		() =>
			history.block({
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

					if (isRoot(currentLocation) && currentLocation.state.exitGuard) {
						// 종료 확인 기록을 소비해 루트(맨 아래)로 내려간다 — 안내가 떠 있는 동안 뒤로가기는 앱을 나간다
						showToast(EXIT_CONFIRM_MESSAGE);
						exitArmedUntil = Date.now() + TOAST_DURATION_MS;
						return false;
					}

					// 루트 아닌 화면(또는 위로 쌓인 루트): 맨 아래 루트로 한 번에 간다
					if (nextIndex === 0) return false;
					window.setTimeout(() => history.go(-currentIndex, { ignoreBlocker: true }), 0);
					return true;
				},
			}),
		[history, showToast],
	);
};

/** 화면 안의 "홈으로"(상단 뒤로·하단 탭 홈) — 기록을 쌓지 않고 맨 아래 루트로 돌아간다 */
export const useGoHome = (): (() => void) => {
	const router = useRouter();
	return () => goToRoot(router.history);
};
