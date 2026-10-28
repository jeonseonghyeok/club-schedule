import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useUpdateGroupApp } from '@/modules/stores/server/group/mutations';
import type { GroupSettings } from '@/types/GroupSettings';
import { cn } from '@/utils';
import { APP_COLOR_PRESETS, DEFAULT_APP_COLOR, getGroupAppPath, getIconLetter } from '@/utils/appIcon';

// 백엔드 group.app_name VARCHAR(30)
const APP_NAME_MAX = 30;

interface Props {
	groupId: number;
	settings: GroupSettings;
}

/** 모임 전용 앱(시스템 관리자가 켠 모임만) — 앱 이름·대표 색, 아이콘 미리보기, 주소 공유 */
export const GroupAppForm = (props: Props) => {
	const { groupId, settings } = props;
	const nameId = useId();
	const colorId = useId();
	const [appName, setAppName] = useState(settings.appName ?? '');
	const [color, setColor] = useState(settings.appThemeColor ?? DEFAULT_APP_COLOR);
	const openModal = useModalStore(state => state.actions.openModal);
	const { mutate: save, isPending } = useUpdateGroupApp(groupId);
	const appPath = getGroupAppPath(groupId);
	const appUrl = `${window.location.origin}${appPath}`;
	const trimmedName = appName.trim();
	const isUnchanged =
		trimmedName === (settings.appName ?? '') && color.toLowerCase() === (settings.appThemeColor ?? DEFAULT_APP_COLOR);

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		save(
			{ appName: trimmedName || null, themeColor: color.toLowerCase(), groupName: settings.name },
			{ onSuccess: () => openModal({ type: ModalType.ALERT, message: '전용 앱 설정이 저장되었습니다.' }) },
		);
	};

	const copyAddress = async () => {
		try {
			await navigator.clipboard.writeText(appUrl);
			openModal({ type: ModalType.ALERT, message: '전용 앱 주소를 복사했습니다.' });
		} catch {
			openModal({ type: ModalType.ALERT, message: `주소를 직접 복사해 주세요: ${appUrl}` });
		}
	};

	return (
		<form onSubmit={submit} className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<span
					aria-hidden="true"
					style={{ backgroundColor: color }}
					className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold text-white"
				>
					{getIconLetter(trimmedName || settings.name)}
				</span>
				<div className="min-w-0 text-sm">
					<p className="font-semibold text-gray-900">{trimmedName || settings.name}</p>
					<p className="truncate text-gray-500">{appUrl}</p>
				</div>
			</div>
			<div className="flex flex-col gap-1">
				<label htmlFor={nameId} className="text-sm font-medium text-gray-800">
					앱 이름
				</label>
				<input
					id={nameId}
					type="text"
					value={appName}
					maxLength={APP_NAME_MAX}
					placeholder={settings.name}
					onChange={event => setAppName(event.target.value)}
					className="rounded-lg border border-gray-300 px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-brand-600 sm:text-sm"
				/>
				<p className="text-xs text-gray-500">비워 두면 모임 이름을 씁니다. 홈 화면 아이콘 아래에 보이는 이름입니다.</p>
			</div>
			<fieldset className="flex flex-col gap-2">
				<legend className="mb-1 text-sm font-medium text-gray-800">대표 색</legend>
				<div className="flex flex-wrap items-center gap-2">
					{APP_COLOR_PRESETS.map(preset => (
						<button
							key={preset}
							type="button"
							aria-label={`대표 색 ${preset}`}
							aria-pressed={color.toLowerCase() === preset}
							onClick={() => setColor(preset)}
							style={{ backgroundColor: preset }}
							className={cn(
								'size-9 rounded-full ring-offset-2 focus-visible:outline-2 focus-visible:outline-brand-600',
								color.toLowerCase() === preset && 'ring-2 ring-gray-900',
							)}
						/>
					))}
					<label htmlFor={colorId} className="ml-1 flex items-center gap-1.5 text-sm text-gray-600">
						직접
						<input
							id={colorId}
							type="color"
							value={color}
							onChange={event => setColor(event.target.value)}
							className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-white"
						/>
					</label>
				</div>
			</fieldset>
			<div className="flex flex-wrap justify-between gap-2">
				<span className="flex gap-2">
					<a
						href={appPath}
						target="_blank"
						rel="noreferrer"
						className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-brand-700 ring-1 ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-600"
					>
						전용 앱 열기
					</a>
					<Button variant="secondary" onClick={() => void copyAddress()}>
						주소 복사
					</Button>
				</span>
				<Button type="submit" disabled={isPending || isUnchanged}>
					{isPending ? '저장 중…' : '전용 앱 저장'}
				</Button>
			</div>
		</form>
	);
};
