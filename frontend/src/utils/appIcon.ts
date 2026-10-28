/** 모요라 기본 대표 색 — 전용 앱 색을 정하지 않은 모임 */
export const DEFAULT_APP_COLOR = '#1b5a46';
export const APP_ICON_SIZE = 512;

/** 리더가 고르기 쉬운 대표 색(흰 글자가 잘 보이는 진한 색) */
export const APP_COLOR_PRESETS = [
	'#1b5a46',
	'#1d4e89',
	'#5b3a8c',
	'#a23b55',
	'#b4531f',
	'#3f4a3c',
	'#0f6b74',
	'#7a5c1e',
] as const;

const FONT_FAMILY =
	"'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
// 마스커블 아이콘의 안전 영역(가운데 80%) 안에 글자가 들어가도록
const LETTER_RATIO = 0.46;

/** 아이콘에 쓸 글자 — 이름의 첫 글자(공백 제외), 영문은 대문자 */
export const getIconLetter = (name: string | null): string => (name?.trim().charAt(0) || '모').toUpperCase();

/**
 * 모임 전용 앱 아이콘: 대표 색 바탕 + 흰 글자, 512px PNG 를 base64(접두사 없음)로 돌려준다.
 * 가장자리까지 색을 채워 일반·마스커블 아이콘 양쪽으로 쓴다.
 */
export const renderAppIconPng = async (params: { letter: string; color: string }): Promise<string> => {
	const canvas = document.createElement('canvas');
	canvas.width = APP_ICON_SIZE;
	canvas.height = APP_ICON_SIZE;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('아이콘을 그릴 수 없습니다.');
	context.fillStyle = params.color;
	context.fillRect(0, 0, APP_ICON_SIZE, APP_ICON_SIZE);
	context.fillStyle = '#ffffff';
	context.font = `800 ${Math.round(APP_ICON_SIZE * LETTER_RATIO)}px ${FONT_FAMILY}`;
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	// 한글은 글꼴 기준선 탓에 살짝 위로 떠 보여 조금 내린다
	context.fillText(params.letter, APP_ICON_SIZE / 2, APP_ICON_SIZE * 0.53);
	const dataUrl = canvas.toDataURL('image/png');
	return dataUrl.slice(dataUrl.indexOf(',') + 1);
};

export const getGroupAppPath = (groupId: number): string => `/g/${groupId}/`;
