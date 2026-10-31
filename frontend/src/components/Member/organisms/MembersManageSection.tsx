import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { ReasonDialog } from '@/components/common/organisms/ReasonDialog';
import { GroupNicknameForm } from '@/components/Member/organisms/GroupNicknameForm';
import { MemberInfoDialog } from '@/components/Member/organisms/MemberInfoDialog';
import { MemberNicknameHistory } from '@/components/Nickname/organisms/MemberNicknameHistory';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { useBanMember, useUnbanMember } from '@/modules/stores/server/member/mutations';
import { memberQueries } from '@/modules/stores/server/member/queries';
import { GROUP_ROLE, MEMBER_STATUS } from '@/types/Member';
import type { GroupMember } from '@/types/Member';
import { cn } from '@/utils';
import {
	canChangeRole,
	canKick,
	filterSuspendedMembers,
	getMemberName,
	isActiveMember,
	ROLE_LABEL,
	sortActiveMembers,
} from '@/utils/member';

const VIEW = { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' } as const;
type View = (typeof VIEW)[keyof typeof VIEW];

const formatDate = (value: string | null): string => (value ? new Date(value).toLocaleDateString('ko-KR') : '-');

/** 내보내기(활동 회원) / 재가입 차단(이미 나간 회원) 사유 입력 */
type BanTarget = { kind: 'kick' | 'ban'; member: GroupMember } | null;

interface Props {
	groupId: number;
	viewerIsLeader: boolean;
}

interface MemberRowProps {
	member: GroupMember;
	viewerIsLeader: boolean;
	onOpen: (member: GroupMember) => void;
	onBan: (member: GroupMember) => void;
	onUnban: (member: GroupMember) => void;
	isBusy: boolean;
}

const MemberRow = (props: MemberRowProps) => {
	const { member, viewerIsLeader, onOpen, onBan, onUnban, isBusy } = props;
	const isActive = isActiveMember(member);
	const name = getMemberName(member);
	const editable = canChangeRole(member, viewerIsLeader);

	return (
		<li className="flex items-center justify-between gap-2 py-2">
			<div className="min-w-0">
				<button
					type="button"
					onClick={() => onOpen(member)}
					title={editable ? '클릭해서 정보 확인 · 역할 변경' : '클릭해서 정보 확인'}
					className={cn(
						'font-semibold text-gray-900 hover:underline focus-visible:outline-2 focus-visible:outline-gray-900',
						editable && 'underline decoration-dotted',
					)}
				>
					{name}
					{/* 정지(탈퇴/추방)된 회원은 더 이상 직책이 없으므로 활동 회원만 붙인다 */}
					{isActive && ` (${ROLE_LABEL[member.role]})`}
				</button>
				{member.banned && (
					<span className="ml-1.5 rounded-full bg-red-100 px-2 text-[11px] font-bold text-red-800">차단됨</span>
				)}
				<p className="text-xs text-gray-500">
					가입일 {formatDate(member.joinedAt)}
					{!isActive && member.leftAt && (
						<span className="font-semibold text-red-700">
							{' '}
							· {member.status === MEMBER_STATUS.KICKED ? '추방일' : '탈퇴일'} {formatDate(member.leftAt)}
						</span>
					)}
					{member.banReason && ` · 차단 사유: ${member.banReason}`}
				</p>
			</div>
			{!isActive &&
				(member.banned ? (
					<Button
						variant="secondary"
						className="px-3 py-1 text-brand-800"
						disabled={isBusy}
						onClick={() => onUnban(member)}
					>
						벤 해제
					</Button>
				) : (
					member.role === GROUP_ROLE.MEMBER && (
						<Button
							variant="secondary"
							className="px-3 py-1 text-red-800"
							disabled={isBusy}
							onClick={() => onBan(member)}
						>
							벤 처리
						</Button>
					)
				))}
		</li>
	);
};

/** 관리 탭 "회원 관리": 활동 / 정지(탈퇴·추방 필터) */
export const MembersManageSection = (props: Props) => {
	const { groupId, viewerIsLeader } = props;
	const [view, setView] = useState<View>(VIEW.ACTIVE);
	const [show, setShow] = useState({ withdrawn: true, kicked: true });
	const [selected, setSelected] = useState<GroupMember | null>(null);
	const [banTarget, setBanTarget] = useState<BanTarget>(null);
	const { data: members, isError } = useQuery({ ...memberQueries.list(groupId) });
	const { mutate: ban, isPending: isBanning } = useBanMember(groupId);
	const { mutate: unban, isPending: isUnbanning } = useUnbanMember(groupId);
	const openModal = useModalStore(state => state.actions.openModal);

	const renderList = () => {
		if (isError) return <EmptyMessage message="회원 목록을 불러오지 못했습니다." />;
		if (!members) return <EmptyMessage message="로딩 중..." />;
		const rows = view === VIEW.ACTIVE ? sortActiveMembers(members) : filterSuspendedMembers(members, show);
		if (rows.length === 0) return <EmptyMessage message="해당하는 회원이 없습니다." />;
		return (
			<ul className="divide-y divide-gray-100">
				{rows.map(member => (
					<MemberRow
						key={member.userKey}
						member={member}
						viewerIsLeader={viewerIsLeader}
						onOpen={setSelected}
						onBan={target => setBanTarget({ kind: 'ban', member: target })}
						onUnban={target => unban(target.userKey)}
						isBusy={isBanning || isUnbanning}
					/>
				))}
			</ul>
		);
	};

	return (
		<SectionCard
			title="회원 관리"
			actions={
				<div className="flex flex-wrap items-center gap-3">
					<div role="group" aria-label="회원 보기" className="flex gap-1">
						{(
							[
								[VIEW.ACTIVE, '활동'],
								[VIEW.SUSPENDED, '정지'],
							] as const
						).map(([value, label]) => (
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
			}
		>
			{renderList()}
			{selected && (
				<MemberInfoDialog
					groupId={groupId}
					member={selected}
					canEditRole={canChangeRole(selected, viewerIsLeader)}
					canKick={canKick(selected)}
					onKick={member => {
						setSelected(null);
						setBanTarget({ kind: 'kick', member });
					}}
					onClose={() => setSelected(null)}
				>
					{/* 모임 닉네임은 모임장·매니저가 관리한다(모임 설정과 무관하게 항상 바꿀 수 있다) */}
					{isActiveMember(selected) && (
						<GroupNicknameForm
							groupId={groupId}
							userKey={selected.userKey}
							groupNickname={selected.groupNickname ?? selected.displayName}
							onSaved={() => {
								setSelected(null);
								openModal({ type: ModalType.ALERT, message: '회원 닉네임이 저장되었습니다.' });
							}}
						/>
					)}
					<MemberNicknameHistory groupId={groupId} userKey={selected.userKey} />
				</MemberInfoDialog>
			)}
			{banTarget && (
				<ReasonDialog
					title={banTarget.kind === 'kick' ? '회원 내보내기' : '벤 처리 (재가입 차단)'}
					reasonLabel="사유"
					confirmLabel={banTarget.kind === 'kick' ? '내보내기' : '벤 처리'}
					isReasonRequired={false}
					isSubmitting={isBanning}
					onSubmit={reason =>
						ban({ userKey: banTarget.member.userKey, reason }, { onSuccess: () => setBanTarget(null) })
					}
					onClose={() => setBanTarget(null)}
				/>
			)}
		</SectionCard>
	);
};
