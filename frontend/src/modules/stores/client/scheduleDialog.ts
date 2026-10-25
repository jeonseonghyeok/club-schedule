import { createStore } from '.';

/**
 * 모임 화면의 일정 모달 흐름. 홈·일정·관리 탭 어디서든 같은 모달을 열기 때문에 화면 단위로 공유한다.
 * 일정은 id 로만 들고 있고, 내용은 항상 쿼리 캐시에서 읽어 처리 후에도 최신 상태를 보여준다.
 */
export type ScheduleDialogView =
	| { type: 'none' }
	| { type: 'day'; dateMs: number }
	/** fromDayMs 가 있으면 "←"로 그 날짜 목록으로 돌아간다 */
	| { type: 'detail'; scheduleId: number; fromDayMs: number | null }
	| { type: 'create'; dateMs: number }
	| { type: 'edit'; scheduleId: number }
	| { type: 'duplicate'; scheduleId: number }
	| { type: 'attendees'; scheduleId: number };

export interface ScheduleDialogStore {
	view: ScheduleDialogView;
	actions: {
		open: (view: ScheduleDialogView) => void;
		close: () => void;
	};
}

export const useScheduleDialogStore = createStore<ScheduleDialogStore>(
	set => ({
		view: { type: 'none' },
		actions: {
			open: view => {
				set({ view }, false, 'scheduleDialog/open');
			},
			close: () => {
				set({ view: { type: 'none' } }, false, 'scheduleDialog/close');
			},
		},
	}),
	'scheduleDialog',
);
