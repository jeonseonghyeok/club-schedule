/*
 * 모요라 서비스 워커 — 앱 화면(정적 파일)만 캐시한다. /api 는 항상 네트워크(로그인·데이터 최신성).
 * - 페이지 이동: 네트워크 우선, 오프라인이면 캐시해 둔 index.html
 * - /assets/*: 파일명에 해시가 붙어 바뀌지 않으므로 캐시 우선
 * - 그 밖의 정적 파일(아이콘·manifest): 캐시를 먼저 주고 뒤에서 갱신
 * 배포마다 CACHE_VERSION 을 바꿀 필요는 없다(index.html 은 네트워크 우선, 에셋은 새 해시로 들어온다).
 */
const CACHE_VERSION = 'moyora-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', event => {
	event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL)));
	self.skipWaiting();
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches
			.keys()
			.then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
			.then(() => self.clients.claim()),
	);
});

const putInCache = async (request, response) => {
	if (!response || !response.ok || response.type === 'opaque') return response;
	const cache = await caches.open(CACHE_VERSION);
	await cache.put(request, response.clone());
	return response;
};

self.addEventListener('fetch', event => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then(response => putInCache('/', response))
				.catch(async () => (await caches.match('/')) ?? Response.error()),
		);
		return;
	}

	if (url.pathname.startsWith('/assets/')) {
		event.respondWith(
			caches.match(request).then(cached => cached ?? fetch(request).then(response => putInCache(request, response))),
		);
		return;
	}

	event.respondWith(
		caches.match(request).then(cached => {
			const network = fetch(request)
				.then(response => putInCache(request, response))
				.catch(() => cached);
			return cached ?? network;
		}),
	);
});
