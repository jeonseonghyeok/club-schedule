import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { Button } from '@/components/common/atoms/Button';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { Dialog } from '@/components/common/organisms/Dialog';
import { ReasonDialog } from '@/components/common/organisms/ReasonDialog';
import { NicknameChangeDialog } from '@/components/Member/organisms/NicknameChangeDialog';
import { RoleChangeDialog } from '@/components/Member/organisms/RoleChangeDialog';
import { MemberNicknameHistoryPanel } from '@/components/Nickname/organisms/MemberNicknameHistory';
import { useBanMember } from '@/modules/stores/server/member/mutations';
import { memberQueries } from '@/modules/stores/server/member/queries';
import type { GroupViewer } from '@/types/GroupDetail';
import { MEMBER_STATUS } from '@/types/Member';
import type { GroupMember } from '@/types/Member';
import {
	canChangeRole,
	canEditOwnNickname,
	canKick,
	getMemberName,
	isActiveMember,
	NICKNAME_LOCKED_MESSAGE,
	ROLE_LABEL,
} from '@/utils/member';

const formatDate = (value: string | null): string => (value ? new Date(value).toLocaleDateString('ko-KR') : '-');

// 정보 줄 오른쪽에 붙는 작은 버튼
const ROW_BUTTON_CLASS = 'min-h-8 shrink-0 px-2.5 py-1 text-xs';

/** 회원 정보에서 여는 다음 대화상자 */
const MEMBER_ACTION = { ROLE: 'role', NICKNAME: 'nickname', KICK: 'kick' } as const;
type MemberAction = (typeof MEMBER_ACTION)[keyof typeof MEMBER_ACTION];

interface MemberActions {
	readonly canEditRole: boolean;
	readonly canEditNickname: boolean;
	readonly canKick: boolean;
}

/**
 * 보는 사람의 권한에 따라 쓸 수 있는 기능(서버 권한과 같은 규칙)
 * - 직책 변경: 리더가 다른 활동 회원(리더 제외)
 * - 닉네임 변경: 모임장·매니저는 모든 활동 회원, 본인은 모임이 허용했을 때
 * - 내보내기: 모임장·매니저가 활동 중인 일반회원
 */
const getMemberActions = (params: {
	member: GroupMember;
	viewer: GroupViewer;
	allowSelfNickname: boolean | null;
}): MemberActions => {
	const { member, viewer, allowSelfNickname } = params;
	const isSelf = member.userKey === viewer.userKey;
	const isActive = isActiveMember(member);
	return {
		canEditRole: !isSelf && canChangeRole(member, viewer.isLeader),
		canEditNickname:
			isActive && (viewer.isManager || (isSelf && canEditOwnNickname({ allowSelfNickname, role: member.role }))),
		canKick: !isSelf && viewer.isManager && canKick(member),
	};
};

interface Props {
	groupId: number;
	userKey: number;
	viewer: GroupViewer;
	/** 모임 설정 — 회원 본인의 닉네임 수정 허용 */
	allowSelfNickname: boolean | null;
	/** 내 정보로 열었을 때만: 모임 탈퇴 */
	onWithdraw?: () => void;
	onClose: () => void;
}

/** 회원 정보 — 닉네임·직책·가입일, 닉네임 변경 이력(회원 누구나), 권한에 따라 직책 변경·닉네임 변경·내보내기 */
export const MemberInfoDialog = (props: Props) => {
	const { groupId, userKey, viewer, allowSelfNickname, onWithdraw, onClose } = props;
	const [action, setAction] = useState<MemberAction | null>(null);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const historyId = useId();
	// 목록 캐시에서 읽어 직책·닉네임을 바꾸면 바로 반영된다
	const { data: members, isError } = useQuery({ ...memberQueries.list(groupId) });
	const { mutate: ban, isPending: isBanning } = useBanMember(groupId);
	const member = members?.find(item => item.userKey === userKey);

	const renderBody = () => {
		if (isError) return <EmptyMessage message="회원 정보를 불러오지 못했습니다." />;
		if (!members) return <EmptyMessage message="로딩 중..." />;
		if (!member) return <EmptyMessage message="회원을 찾을 수 없습니다." />;
		const isActive = isActiveMember(member);
		const actions = getMemberActions({ member, viewer, allowSelfNickname });

		return (
			<>
				<dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
					<dt className="font-semibold text-gray-500">닉네임</dt>
					<dd className="flex min-w-0 items-center gap-1.5">
						<span className="min-w-0 flex-1 truncate">{getMemberName(member)}</span>
						{actions.canEditNickname && (
							<Button
								variant="secondary"
								className={ROW_BUTTON_CLASS}
								onClick={() => setAction(MEMBER_ACTION.NICKNAME)}
							>
								닉네임 변경
							</Button>
						)}
						<Button
							variant="secondary"
							aria-label="닉네임 변경 이력"
							aria-expanded={isHistoryOpen}
							aria-controls={historyId}
							className={ROW_BUTTON_CLASS}
							onClick={() => setIsHistoryOpen(prev => !prev)}
						>
							변경 이력
						</Button>
					</dd>
					{/* 정지(탈퇴/추방)된 회원은 더 이상 직책이 없으므로 퇴장일을 대신 보여준다 */}
					{isActive && (
						<>
							<dt className="font-semibold text-gray-500">직책</dt>
							<dd className="flex min-w-0 items-center gap-1.5">
								<span className="min-w-0 flex-1 truncate">{ROLE_LABEL[member.role]}</span>
								{actions.canEditRole && (
									<Button
										variant="secondary"
										className={ROW_BUTTON_CLASS}
										onClick={() => setAction(MEMBER_ACTION.ROLE)}
									>
										직책 변경
									</Button>
								)}
							</dd>
						</>
					)}
					<dt className="font-semibold text-gray-500">가입일</dt>
					<dd>{formatDate(member.joinedAt)}</dd>
					{!isActive && member.leftAt && (
						<>
							<dt className="font-semibold text-gray-500">
								{member.status === MEMBER_STATUS.KICKED ? '추방일' : '탈퇴일'}
							</dt>
							<dd className="font-semibold text-red-700">{formatDate(member.leftAt)}</dd>
						</>
					)}
				</dl>
				{isActive && member.userKey === viewer.userKey && !actions.canEditNickname && (
					<p className="mt-3 text-xs text-gray-500">{NICKNAME_LOCKED_MESSAGE}</p>
				)}
				{isHistoryOpen && (
					<section aria-label="닉네임 변경 이력" className="mt-3 border-t border-gray-100 pt-2">
						<MemberNicknameHistoryPanel id={historyId} groupId={groupId} userKey={member.userKey} />
					</section>
				)}
				{(actions.canKick || onWithdraw) && (
					<div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
						{actions.canKick && (
							<Button variant="secondary" className="text-red-800" onClick={() => setAction(MEMBER_ACTION.KICK)}>
								내보내기
							</Button>
						)}
						{onWithdraw && (
							<Button variant="secondary" className="ml-auto text-red-800" onClick={onWithdraw}>
								모임 탈퇴
							</Button>
						)}
					</div>
				)}
			</>
		);
	};

	const closeAction = () => setAction(null);

	return (
		<>
			<Dialog title="회원 정보" onClose={onClose}>
				{renderBody()}
			</Dialog>
			{member && action === MEMBER_ACTION.ROLE && (
				<RoleChangeDialog groupId={groupId} member={member} onClose={closeAction} />
			)}
			{member && action === MEMBER_ACTION.NICKNAME && (
				<NicknameChangeDialog
					groupId={groupId}
					member={member}
					isSelf={member.userKey === viewer.userKey}
					onClose={closeAction}
				/>
			)}
			{member && action === MEMBER_ACTION.KICK && (
				<ReasonDialog
					title={`${getMemberName(member)}님 내보내기`}
					reasonLabel="사유"
					confirmLabel="내보내기"
					isReasonRequired={false}
					isSubmitting={isBanning}
					onSubmit={reason =>
						ban(
							{ userKey: member.userKey, reason },
							{
								onSuccess: () => {
									closeAction();
									onClose();
								},
							},
						)
					}
					onClose={closeAction}
				/>
			)}
		</>
	);
};
