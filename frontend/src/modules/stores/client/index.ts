import { isEqual } from 'lodash-es';
import type { StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

type StoreInitializer<T> = StateCreator<T, [['zustand/devtools', never], ['zustand/immer', never]]>;

/**
 * 클라이언트 전역 스토어 생성 래퍼: devtools(스토어 이름 필수) + immer + isEqual 비교.
 * 객체를 반환하는 셀렉터도 깊은 비교로 리렌더를 막으므로 shallow 를 따로 붙이지 않는다.
 * TODO: 새로고침 후에도 유지해야 하는 스토어가 생기면 persist 옵션 인자를 추가한다.
 */
export const createStore = <T>(initializer: StoreInitializer<T>, name: string) =>
	createWithEqualityFn<T>()(devtools(immer(initializer), { name, enabled: import.meta.env.DEV }), isEqual);
