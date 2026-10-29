import { useState } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { Icon } from '@/components/common/atoms/Icon';
import { ModalType } from '@/constants';
import { INSTALL_KIND, useAppInstall } from '@/hooks/useAppInstall';
import { useModalStore } from '@/modules/stores/client/modal';
import { getIconLetter } from '@/utils/appIcon';

const dismissKey = (groupId: number): string => `moyora:install-banner-dismissed:${groupId}`;

const readDismissed = (groupId: number): boolean => {
	try {
		return localStorage.getItem(dismissKey(groupId)) === '1';
	} catch {
		return false;
	}
};

interface Props {
	groupId: number;
	appName: string;
	themeColor: string;
}

/**
 * 전용 앱 홈 상단 설치 안내 — 설치 창을 띄울 수 있거나(안드로이드·PC 크롬) iOS 일 때만 보인다.
 * 닫으면 이 모임에서는 다시 띄우지 않는다(브라우저에 기억).
 */
export const InstallBanner = (props: Props) => {
	const { groupId, appName, themeColor } = props;
	const { kind, install } = useAppInstall();
	const openModal = useModalStore(state => state.actions.openModal);
	const [isDismissed, setIsDismissed] = useState(() => readDismissed(groupId));

	if (isDismissed || (kind !== INSTALL_KIND.PROMPT && kind !== INSTALL_KIND.IOS)) return null;

	const dismiss = () => {
		setIsDismissed(true);
		try {
			localStorage.setItem(dismissKey(groupId), '1');
		} catch {
			// 저장소를 못 쓰면 이번 화면에서만 닫는다
		}
	};

	const onInstall = () => {
		if (kind === INSTALL_KIND.PROMPT) {
			void install();
			return;
		}
		openModal({
			type: ModalType.ALERT,
			message: `Safari 아래쪽의 공유 버튼을 누르고 "홈 화면에 추가"를 고르면 ${appName} 앱이 홈 화면에 생깁니다.`,
		});
	};

	return (
		<aside aria-label="앱 설치 안내" className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-gray-200">
			<span
				aria-hidden="true"
				style={{ backgroundColor: themeColor }}
				className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white"
			>
				{getIconLetter(appName)}
			</span>
			<p className="min-w-0 flex-1 text-sm text-gray-700">
				<strong className="block text-gray-900">{appName} 앱 설치</strong>홈 화면에서 바로 열고 일정을 확인하세요.
			</p>
			<Button className="shrink-0 px-3" onClick={onInstall}>
				{kind === INSTALL_KIND.PROMPT ? '설치' : '방법 보기'}
			</Button>
			<button
				type="button"
				aria-label="설치 안내 닫기"
				onClick={dismiss}
				className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				<Icon name="plus" size={18} className="rotate-45" />
			</button>
		</aside>
	);
};
