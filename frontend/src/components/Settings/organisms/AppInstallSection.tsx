import { Button } from '@/components/common/atoms/Button';
import { Icon } from '@/components/common/atoms/Icon';
import { INSTALL_KIND, useAppInstall } from '@/hooks/useAppInstall';

/**
 * 앱 설치(홈 화면에 추가). Chromium 계열은 브라우저 설치 창을 띄우고,
 * iOS Safari 는 설치 API 가 없어 공유 메뉴 안내를 보여준다.
 */
export const AppInstallSection = () => {
	const { kind, install } = useAppInstall();

	switch (kind) {
		case INSTALL_KIND.INSTALLED:
			return <p className="text-sm text-gray-600">앱으로 실행 중입니다.</p>;
		case INSTALL_KIND.PROMPT:
			return (
				<div className="flex items-center justify-between gap-3">
					<p className="text-sm text-gray-600">홈 화면에 추가하면 앱처럼 바로 열 수 있습니다.</p>
					<Button onClick={() => void install()}>
						<Icon name="download" size={18} />앱 설치
					</Button>
				</div>
			);
		case INSTALL_KIND.IOS:
			return (
				<p className="text-sm text-gray-600">
					Safari 의 <strong>공유</strong> 버튼 → <strong>홈 화면에 추가</strong>를 누르면 앱처럼 쓸 수 있습니다.
				</p>
			);
		case INSTALL_KIND.MANUAL:
			return (
				<p className="text-sm text-gray-600">브라우저 메뉴의 "앱 설치" 또는 "홈 화면에 추가"로 설치할 수 있습니다.</p>
			);
		default: {
			const exhaustive: never = kind;
			return exhaustive;
		}
	}
};
