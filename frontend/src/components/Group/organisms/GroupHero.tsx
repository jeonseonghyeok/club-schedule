import { Button } from '@/components/common/atoms/Button';
import { Icon } from '@/components/common/atoms/Icon';
import { FavoriteToggle } from '@/components/Group/organisms/FavoriteToggle';
import { JoinAction } from '@/components/JoinRequest/organisms/JoinAction';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import type { GroupDetail, GroupViewer } from '@/types/GroupDetail';
import { getGroupName } from '@/utils/group';

const getViewerRoleLabel = (viewer: GroupViewer): string | null => {
	if (viewer.isLeader) return '리더';
	if (viewer.isManager) return '매니저';
	if (viewer.isMember) return '회원';
	return null;
};

interface Props {
	groupId: number;
	detail: GroupDetail;
	/** 모임 전용 앱에서는 그 앱의 대표 색으로 머리 글자를 칠한다 */
	accentColor?: string;
}

/** 모임 화면 머리 카드: 이름·활동 지역·정원·내 역할 + 우선모임 별 / 가입 버튼 */
export const GroupHero = (props: Props) => {
	const { groupId, detail, accentColor } = props;
	const { group, viewer } = detail;
	const roleLabel = getViewerRoleLabel(viewer);
	const promptLogin = useLoginPrompt();

	return (
		<section aria-label="모임 정보" className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-200">
			<span
				aria-hidden="true"
				style={accentColor ? { backgroundColor: accentColor } : undefined}
				className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-lg font-bold text-white"
			>
				{getGroupName(group).slice(0, 1)}
			</span>
			<div className="min-w-0 flex-1">
				<p className="flex items-center gap-1.5">
					<span className="truncate text-base font-bold text-gray-900">{getGroupName(group)}</span>
					{roleLabel && (
						<span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
							{roleLabel}
						</span>
					)}
				</p>
				<p className="mt-0.5 flex items-center gap-1 truncate text-sm text-gray-500">
					{group.regionName && (
						<>
							<Icon name="pin" size={14} />
							<span className="truncate">{group.regionName}</span>
							<span aria-hidden="true">·</span>
						</>
					)}
					정원 {group.capacity ?? 0}명
				</p>
			</div>
			{viewer.isMember && <FavoriteToggle groupId={groupId} viewer={viewer} />}
			{!viewer.isMember && viewer.userKey !== null && <JoinAction groupId={groupId} userKey={viewer.userKey} />}
			{viewer.userKey === null && (
				<Button onClick={() => promptLogin('로그인하면 이 모임에 가입 신청할 수 있어요.')}>가입하기</Button>
			)}
		</section>
	);
};
