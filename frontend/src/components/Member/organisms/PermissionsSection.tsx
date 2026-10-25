import { useQuery } from '@tanstack/react-query';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { useSetMemberPermissions } from '@/modules/stores/server/member/mutations';
import { memberQueries } from '@/modules/stores/server/member/queries';
import { GROUP_ROLE, PERMISSION_PRESET } from '@/types/Member';
import type { GroupMember, PermissionPreset } from '@/types/Member';
import { getMemberName, isActiveMember } from '@/utils/member';

const PRESETS = [
	{
		key: PERMISSION_PRESET.SCHEDULE_MANAGER,
		label: '일정관리자',
		description: '일정 등록 즉시 승인 + 일정 승인/반려/수정/취소',
	},
	{ key: PERMISSION_PRESET.ATTENDANCE_MANAGER, label: '출석관리자', description: '참가 신청 승인/거부 + 참석 체크' },
] as const satisfies readonly { key: PermissionPreset; label: string; description: string }[];

interface Props {
	groupId: number;
}

/** 리더 전용: 매니저에게 권한 묶음(일정관리자·출석관리자)을 주거나 회수 */
export const PermissionsSection = (props: Props) => {
	const { groupId } = props;
	const { data: members, isError } = useQuery({ ...memberQueries.list(groupId) });
	const { mutate: setPermissions, isPending } = useSetMemberPermissions(groupId);

	const toggle = (manager: GroupMember, preset: PermissionPreset, checked: boolean) => {
		const current = new Set(manager.presets ?? []);
		if (checked) current.add(preset);
		else current.delete(preset);
		setPermissions({ userKey: manager.userKey, presets: [...current] });
	};

	const renderBody = () => {
		if (isError) return <EmptyMessage message="회원 목록을 불러오지 못했습니다." />;
		if (!members) return <EmptyMessage message="로딩 중..." />;
		const managers = members.filter(member => isActiveMember(member) && member.role === GROUP_ROLE.MANAGER);
		if (managers.length === 0)
			return <EmptyMessage message="매니저가 없습니다. 회원 관리에서 먼저 매니저로 승격시키세요." />;
		return (
			<ul className="divide-y divide-gray-100">
				{managers.map(manager => (
					<li key={manager.userKey} className="flex flex-wrap items-center justify-between gap-2 py-2">
						<span className="font-semibold">{getMemberName(manager)}</span>
						<fieldset className="flex flex-wrap gap-4 text-sm">
							<legend className="sr-only">{getMemberName(manager)} 권한</legend>
							{PRESETS.map(preset => (
								<label key={preset.key} title={preset.description} className="flex items-center gap-1">
									<input
										type="checkbox"
										disabled={isPending}
										checked={(manager.presets ?? []).includes(preset.key)}
										onChange={event => toggle(manager, preset.key, event.target.checked)}
									/>
									{preset.label}
								</label>
							))}
						</fieldset>
					</li>
				))}
			</ul>
		);
	};

	return <SectionCard title="권한 관리 (리더 전용)">{renderBody()}</SectionCard>;
};
