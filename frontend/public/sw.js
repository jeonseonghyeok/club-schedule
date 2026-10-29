/*
 * 모요라 서비스 워커
 * - 앱 화면(정적 파일)을 캐시한다.
 * - /api 조회(GET)는 항상 네트워크로 받고, 받은 응답을 저장해 두었다가 오프라인일 때만 돌려준다
 *   (지하철 등에서 마지막으로 본 모임·일정을 보여주기 위함). 로그인·장소 검색은 저장하지 않는다.
 *   로그아웃하면 화면이 API 캐시를 지운다(LogoutButton).
 * - 페이지 이동: 네트워크 우선, 오프라인이면 캐시해 둔 index.html
 * - /assets/*: 파일명에 해시가 붙어 바뀌지 않으므로 캐시 우선
 * - 그 밖의 정적 파일(아이콘·manifest): 캐시를 먼저 주고 뒤에서 갱신
 * 배포마다 CACHE_VERSION 을 바꿀 필요는 없다(index.html 은 네트워크 우선, 에셋은 새 해시로 들어온다).
 */
const CACHE_VERSION = 'moyora-v1';
const API_CACHE = 'moyora-api-v1';
const API_NO_STORE = ['/api/login/', '/api/places', '/api/auth/logout'];
const APP_SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', event => {
	event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL)));
	self.skipWaiting();
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches
			.keys()
			.then(keys =>
				Promise.all(keys.filter(key => key !== CACHE_VERSION && key !== API_CACHE).map(key => caches.delete(key))),
			)
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
	if (url.origin !== self.location.origin) return;

	if (url.pathname.startsWith('/api/')) {
		if (API_NO_STORE.some(prefix => url.pathname.startsWith(prefix))) return;
		event.respondWith(
			fetch(request)
				.then(async response => {
					if (response.ok && response.status !== 204) {
						const cache = await caches.open(API_CACHE);
						await cache.put(request, response.clone());
					}
					return response;
				})
				.catch(async () => (await caches.match(request, { cacheName: API_CACHE })) ?? Response.error()),
		);
		return;
	}

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
