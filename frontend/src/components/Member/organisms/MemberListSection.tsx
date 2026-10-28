import { useQuery } from '@tanstack/react-query';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { memberQueries } from '@/modules/stores/server/member/queries';
import { GROUP_ROLE } from '@/types/Member';
import { getMemberName, ROLE_LABEL, sortActiveMembers } from '@/utils/member';

interface Props {
	groupId: number;
	viewerUserKey: number | null;
}

/** 멤버 탭: 활동 회원 목록(읽기 전용) — 내보내기·권한은 관리 탭 */
export const MemberListSection = (props: Props) => {
	const { groupId, viewerUserKey } = props;
	const { data: members, isError } = useQuery({ ...memberQueries.list(groupId) });

	const renderBody = () => {
		if (isError) return <EmptyMessage message="멤버 목록을 불러오지 못했습니다." />;
		if (!members) return <EmptyMessage message="로딩 중..." />;
		const active = sortActiveMembers(members);
		if (active.length === 0) return <EmptyMessage message="활동 중인 멤버가 없습니다." />;
		return (
			<ul className="flex flex-col">
				{active.map(member => (
					<li key={member.userKey} className="flex items-center gap-3 py-2.5">
						<span
							aria-hidden="true"
							className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600"
						>
							{getMemberName(member).slice(0, 1)}
						</span>
						<span className="min-w-0 flex-1 truncate font-medium text-gray-900">
							{getMemberName(member)}
							{member.userKey === viewerUserKey && <span className="ml-1 text-xs text-gray-500">(나)</span>}
						</span>
						{member.role !== GROUP_ROLE.MEMBER && (
							<span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
								{ROLE_LABEL[member.role]}
							</span>
						)}
					</li>
				))}
			</ul>
		);
	};

	return (
		<SectionCard title={members ? `멤버 ${sortActiveMembers(members).length}명` : '멤버'}>{renderBody()}</SectionCard>
	);
};
