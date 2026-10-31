import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, buttonClassName } from '@/components/common/atoms/Button';
import { INSTALL_KIND, useAppInstall } from '@/hooks/useAppInstall';
import { getIconLetter } from '@/utils/appIcon';
import { buildKakaoTalkExternalUrl, detectInAppBrowser, IN_APP_BROWSER } from '@/utils/inAppBrowser';

interface Props {
	groupId: number;
	appName: string;
	themeColor: string;
	/** 개발 서버에서만 — 설치 없이 앱 화면을 확인한다 */
	onDevBypass?: () => void;
}

const Steps = (props: { items: readonly ReactNode[] }) => (
	<ol className="flex list-decimal flex-col gap-1.5 pl-5 text-left text-sm text-gray-700">
		{props.items.map((item, index) => (
			<li key={index}>{item}</li>
		))}
	</ol>
);

/**
 * 모임 전용 앱 주소(/g/{id}/)를 브라우저로 열었을 때 — 설치해서 쓰는 앱이라 화면 대신 설치 방법만 보여준다.
 * 설치할 수 없는 곳(카카오톡 등 앱 안의 웹 보기)에서는 Chrome·Safari 로 여는 방법을 안내한다.
 */
export const InstallGate = (props: Props) => {
	const { groupId, appName, themeColor, onDevBypass } = props;
	const { kind, install } = useAppInstall();
	const [isInstalled, setIsInstalled] = useState(false);
	const inAppBrowser = detectInAppBrowser(navigator.userAgent);

	useEffect(() => {
		const onInstalled = () => setIsInstalled(true);
		window.addEventListener('appinstalled', onInstalled);
		return () => window.removeEventListener('appinstalled', onInstalled);
	}, []);

	const renderGuide = () => {
		if (isInstalled) {
			return <p className="text-sm text-gray-700">설치되었습니다. 홈 화면의 {appName} 앱을 눌러 여세요.</p>;
		}
		if (inAppBrowser === IN_APP_BROWSER.KAKAOTALK) {
			return (
				<>
					<p className="text-sm text-gray-700">
						카카오톡 안에서는 앱을 설치할 수 없어요. 기본 브라우저로 열어 설치하세요.
					</p>
					<a href={buildKakaoTalkExternalUrl(window.location.href)} className={buttonClassName('primary', 'w-full')}>
						브라우저로 열기
					</a>
				</>
			);
		}
		if (inAppBrowser === IN_APP_BROWSER.OTHER) {
			return (
				<Steps
					items={[
						'화면 오른쪽 위(또는 아래)의 ⋯ 메뉴를 누르세요.',
						'“다른 브라우저로 열기” 또는 “Chrome/Safari로 열기”를 고르세요.',
						'열린 브라우저에서 이 화면의 안내대로 설치하세요.',
					]}
				/>
			);
		}
		if (kind === INSTALL_KIND.PROMPT) {
			return (
				<Button className="w-full" onClick={() => void install()}>
					앱 설치
				</Button>
			);
		}
		if (kind === INSTALL_KIND.IOS) {
			return (
				<Steps
					items={[
						'Safari 아래쪽(또는 위쪽)의 공유 버튼을 누르세요.',
						'“홈 화면에 추가”를 고르고 “추가”를 누르세요.',
						`홈 화면에 생긴 ${appName} 앱을 여세요.`,
					]}
				/>
			);
		}
		return (
			<>
				<Steps
					items={[
						'브라우저 메뉴(⋮)를 누르세요.',
						'“앱 설치” 또는 “홈 화면에 추가”를 고르세요.',
						`설치된 ${appName} 앱을 여세요.`,
					]}
				/>
				<p className="text-xs text-gray-500">이미 설치했다면 홈 화면(바탕화면)의 앱으로 여세요.</p>
			</>
		);
	};

	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-5 px-6 py-12 text-center">
			<span
				aria-hidden="true"
				style={{ backgroundColor: themeColor }}
				className="flex size-20 items-center justify-center rounded-3xl text-4xl font-extrabold text-white shadow-sm"
			>
				{getIconLetter(appName)}
			</span>
			<div>
				<h1 className="text-xl font-bold text-gray-900">{appName}</h1>
				<p className="mt-1 text-sm text-gray-600">이 모임은 앱으로 이용해요. 홈 화면에 설치한 뒤 열어 주세요.</p>
			</div>
			<section
				aria-label="설치 방법"
				className="flex w-full flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-200"
			>
				{renderGuide()}
			</section>
			<Link
				to="/groups/$groupId"
				params={{ groupId: String(groupId) }}
				search={{ tab: 'home' }}
				className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700"
			>
				설치하지 않고 모요라에서 모임 보기
			</Link>
			{onDevBypass && (
				<button type="button" onClick={onDevBypass} className="text-xs text-gray-400 underline">
					개발용: 설치 없이 앱 화면 보기
				</button>
			)}
		</main>
	);
};
