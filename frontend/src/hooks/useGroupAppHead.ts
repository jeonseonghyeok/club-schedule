import { useEffect } from 'react';

interface GroupAppHead {
	groupId: number;
	appName: string;
	themeColor: string;
	/** false 면 모요라 기본값을 그대로 둔다 */
	isEnabled: boolean;
}

const setLink = (rel: string, href: string): (() => void) => {
	const element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
	if (!element) return () => {};
	const previous = element.getAttribute('href');
	element.setAttribute('href', href);
	return () => {
		if (previous !== null) element.setAttribute('href', previous);
	};
};

const setMeta = (name: string, content: string): (() => void) => {
	const element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
	if (!element) return () => {};
	const previous = element.getAttribute('content');
	element.setAttribute('content', content);
	return () => {
		if (previous !== null) element.setAttribute('content', previous);
	};
};

/**
 * 모임 전용 앱 화면에서 문서 머리(manifest·아이콘·색·제목)를 그 모임 것으로 바꾼다 — 이 화면에서 설치하면
 * 모요라가 아니라 모임 앱으로 설치된다. 화면을 떠나면 원래대로 돌린다.
 * (주소로 바로 들어온 경우는 nginx 가 index.html 의 manifest 링크를 미리 바꿔 준다)
 */
export const useGroupAppHead = (head: GroupAppHead): void => {
	const { groupId, appName, themeColor, isEnabled } = head;

	useEffect(() => {
		if (!isEnabled) return;
		const previousTitle = document.title;
		document.title = appName;
		const restores = [
			setLink('manifest', `/api/groups/${groupId}/app-manifest`),
			setLink('apple-touch-icon', `/api/groups/${groupId}/app-icon.png`),
			setMeta('theme-color', themeColor),
			setMeta('apple-mobile-web-app-title', appName),
		];
		return () => {
			document.title = previousTitle;
			restores.forEach(restore => restore());
		};
	}, [groupId, appName, themeColor, isEnabled]);
};
