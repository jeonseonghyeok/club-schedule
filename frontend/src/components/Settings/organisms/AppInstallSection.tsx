import { Button } from '@/components/common/atoms/Button';
import { Icon } from '@/components/common/atoms/Icon';
import { useStandaloneDisplay } from '@/hooks/useStandaloneDisplay';
import { usePwaStore } from '@/modules/stores/client/pwa';

const IOS_PATTERN = /iphone|ipad|ipod/i;

/**
 * 앱 설치(홈 화면에 추가). Chromium 계열은 브라우저 설치 창을 띄우고,
 * iOS Safari 는 설치 API 가 없어 공유 메뉴 안내를 보여준다.
 */
export const AppInstallSection = () => {
	const isStandalone = useStandaloneDisplay();
	const installPrompt = usePwaStore(state => state.installPrompt);
	const { setInstallPrompt } = usePwaStore(state => state.actions);

	if (isStandalone) return <p className="text-sm text-gray-600">앱으로 실행 중입니다.</p>;

	if (installPrompt) {
		const install = async () => {
			await installPrompt.prompt();
			await installPrompt.userChoice;
			// 같은 이벤트로는 다시 띄울 수 없다
			setInstallPrompt(null);
		};
		return (
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm text-gray-600">홈 화면에 추가하면 앱처럼 바로 열 수 있습니다.</p>
				<Button onClick={() => void install()}>
					<Icon name="download" size={18} />앱 설치
				</Button>
			</div>
		);
	}

	if (IOS_PATTERN.test(navigator.userAgent)) {
		return (
			<p className="text-sm text-gray-600">
				Safari 의 <strong>공유</strong> 버튼 → <strong>홈 화면에 추가</strong>를 누르면 앱처럼 쓸 수 있습니다.
			</p>
		);
	}

	return <p className="text-sm text-gray-600">브라우저 메뉴의 "앱 설치" 또는 "홈 화면에 추가"로 설치할 수 있습니다.</p>;
};
