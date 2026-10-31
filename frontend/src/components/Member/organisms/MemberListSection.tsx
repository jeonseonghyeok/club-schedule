import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { ReasonDialog } from '@/components/common/organisms/ReasonDialog';
import { MemberInfoDialog } from '@/components/Member/organisms/MemberInfoDialog';
import { useBanMember, useUnbanMember } from '@/modules/stores/server/member/mutations';
import { memberQueries } from '@/modules/stores/server/member/queries';
import type { GroupViewer } from '@/types/GroupDetail';
import { GROUP_ROLE, MEMBER_STATUS } from '@/types/Member';
import type { GroupMember } from '@/types/Member';
import { filterSuspendedMembers, getMemberName, isActiveMember, ROLE_LABEL, sortActiveMembers } from '@/utils/member';

const VIEW = { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' } as const;
type View = (typeof VIEW)[keyof typeof VIEW];

const VIEW_OPTIONS = [
	[VIEW.ACTIVE, '활동'],
	[VIEW.SUSPENDED, '정지'],
] as const satisfies readonly (readonly [View, string])[];

const formatDate = (value: string | null): string => (value ? new Date(value).toLocaleDateString('ko-KR') : '-');

interface MemberRowProps {
	member: GroupMember;
	viewerUserKey: number | null;
	onOpen: (member: GroupMember) => void;
	/** 매니저 이상에게만 — 정지 회원의 재가입 차단·해제 */
	suspendedAction?: { onBan: (member: GroupMember) => void; onUnban: (member: GroupMember) => void; isBusy: boolean };
}

const MemberRow = (props: MemberRowProps) => {
	const { member, viewerUserKey, onOpen, suspendedAction } = props;
	const isActive = isActiveMember(member);
	const name = getMemberName(member);

	const renderSuspendedAction = () => {
		if (!suspendedAction || isActive) return null;
		if (member.banned) {
			return (
				<Button
					variant="secondary"
					className="shrink-0 px-3 py-1 text-brand-800"
					disabled={suspendedAction.isBusy}
					onClick={() => suspendedAction.onUnban(member)}
				>
					벤 해제
				</Button>
			);
		}
		if (member.role !== GROUP_ROLE.MEMBER) return null;
		return (
			<Button
				variant="secondary"
				className="shrink-0 px-3 py-1 text-red-800"
				disabled={suspendedAction.isBusy}
				onClick={() => suspendedAction.onBan(member)}
			>
				벤 처리
			</Button>
		);
	};

	return (
		<li className="flex items-center gap-2">
			<button
				type="button"
				onClick={() => onOpen(member)}
				className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-2.5 text-left hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-600"
			>
				<span
					aria-hidden="true"
					className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600"
				>
					{name.slice(0, 1)}
				</span>
				<span className="min-w-0 flex-1">
					<span className="block truncate font-medium text-gray-900">
						{name}
						{member.userKey === viewerUserKey && <span className="ml-1 text-xs text-gray-500">(나)</span>}
						{member.banned && (
							<span className="ml-1.5 rounded-full bg-red-100 px-2 text-[11px] font-bold text-red-800">차단됨</span>
						)}
					</span>
					{!isActive && (
						<span className="block truncate text-xs text-gray-500">
							{member.status === MEMBER_STATUS.KICKED ? '추방일' : '탈퇴일'} {formatDate(member.leftAt)}
							{member.banReason && ` · 차단 사유: ${member.banReason}`}
						</span>
					)}
				</span>
				{isActive && member.role !== GROUP_ROLE.MEMBER && (
					<span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
						{ROLE_LABEL[member.role]}
					</span>
				)}
			</button>
			{renderSuspendedAction()}
		</li>
	);
};

interface Props {
	groupId: number;
	viewer: GroupViewer;
	allowSelfNickname: boolean | null;
}

/**
 * 멤버 탭 — 회원을 누르면 회원 정보(닉네임 이력 포함)를 연다. 직책 변경·닉네임 변경·내보내기는 보는 사람의 권한에 따라
 * 회원 정보에 나온다. 모임장·매니저는 탈퇴·추방한 회원(정지)도 보고 재가입을 막거나 풀 수 있다.
 */
export const MemberListSection = (props: Props) => {
	const { groupId, viewer, allowSelfNickname } = props;
	const [view, setView] = useState<View>(VIEW.ACTIVE);
	const [show, setShow] = useState({ withdrawn: true, kicked: true });
	const [selectedUserKey, setSelectedUserKey] = useState<number | null>(null);
	const [banTarget, setBanTarget] = useState<GroupMember | null>(null);
	const { data: members, isError } = useQuery({ ...memberQueries.list(groupId) });
	const { mutate: ban, isPending: isBanning } = useBanMember(groupId);
	const { mutate: unban, isPending: isUnbanning } = useUnbanMember(groupId);
	const canManage = viewer.isManager;
	const activeCount = members ? sortActiveMembers(members).length : null;

	const renderBody = () => {
		if (isError) return <EmptyMessage message="멤버 목록을 불러오지 못했습니다." />;
		if (!members) return <EmptyMessage message="로딩 중..." />;
		const rows = view === VIEW.ACTIVE ? sortActiveMembers(members) : filterSuspendedMembers(members, show);
		if (rows.length === 0) return <EmptyMessage message="해당하는 멤버가 없습니다." />;
		return (
			<ul className="flex flex-col">
				{rows.map(member => (
					<MemberRow
						key={member.userKey}
						member={member}
						viewerUserKey={viewer.userKey}
						onOpen={target => setSelectedUserKey(target.userKey)}
						suspendedAction={
							canManage
								? { onBan: setBanTarget, onUnban: target => unban(target.userKey), isBusy: isBanning || isUnbanning }
								: undefined
						}
					/>
				))}
			</ul>
		);
	};

	return (
		<SectionCard
			title={activeCount === null ? '멤버' : `멤버 ${activeCount}명`}
			actions={
				canManage && (
					<div className="flex flex-wrap items-center gap-3">
						<div role="group" aria-label="멤버 보기" className="flex gap-1">
							{VIEW_OPTIONS.map(([value, label]) => (
								<Button
									key={value}
									variant={view === value ? 'primary' : 'secondary'}
									aria-pressed={view === value}
									className="px-3 py-1"
									onClick={() => setView(value)}
								>
									{label}
								</Button>
							))}
						</div>
						{view === VIEW.SUSPENDED && (
							<div className="flex gap-3 text-sm text-gray-700">
								<label className="flex items-center gap-1">
									<input
										type="checkbox"
										checked={show.withdrawn}
										onChange={event => setShow(prev => ({ ...prev, withdrawn: event.target.checked }))}
									/>
									탈퇴
								</label>
								<label className="flex items-center gap-1">
									<input
										type="checkbox"
										checked={show.kicked}
										onChange={event => setShow(prev => ({ ...prev, kicked: event.target.checked }))}
									/>
									추방
								</label>
							</div>
						)}
					</div>
				)
			}
		>
			{renderBody()}
			{selectedUserKey !== null && (
				<MemberInfoDialog
					groupId={groupId}
					userKey={selectedUserKey}
					viewer={viewer}
					allowSelfNickname={allowSelfNickname}
					onClose={() => setSelectedUserKey(null)}
				/>
			)}
			{banTarget && (
				<ReasonDialog
					title="벤 처리 (재가입 차단)"
					reasonLabel="사유"
					confirmLabel="벤 처리"
					isReasonRequired={false}
					isSubmitting={isBanning}
					onSubmit={reason => ban({ userKey: banTarget.userKey, reason }, { onSuccess: () => setBanTarget(null) })}
					onClose={() => setBanTarget(null)}
				/>
			)}
		</SectionCard>
	);
};
