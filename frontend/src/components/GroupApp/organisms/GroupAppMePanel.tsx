import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { LoginCard } from '@/components/Auth/organisms/LoginCard';
import { LogoutButton } from '@/components/Auth/organisms/LogoutButton';
import { Button } from '@/components/common/atoms/Button';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { MyAttendanceDialog } from '@/components/Member/organisms/MyAttendanceDialog';
import { MyNicknameForm } from '@/components/Member/organisms/MyNicknameForm';
import { AppInstallSection } from '@/components/Settings/organisms/AppInstallSection';
import { ModalType } from '@/constants';
import { useModalStore } from '@/modules/stores/client/modal';
import { memberQueries } from '@/modules/stores/server/member/queries';
import type { GroupDetail } from '@/types/GroupDetail';

interface Props {
	groupId: number;
	detail: GroupDetail;
}

/** 전용 앱 "내 정보" — 로그인·모임 닉네임·참가 이력·앱 설치·로그아웃 */
export const GroupAppMePanel = (props: Props) => {
	const { groupId, detail } = props;
	const { viewer, group } = detail;
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const openModal = useModalStore(state => state.actions.openModal);
	const { data: members } = useQuery({ ...memberQueries.list(groupId), enabled: viewer.isMember });
	const me = members?.find(member => member.userKey === viewer.userKey);
	const canEditNickname = viewer.isMember && (viewer.isLeader || !!group.allowSelfNickname);

	return (
		<>
			{viewer.userKey === null ? (
				<LoginCard title="로그인" message="로그인하면 모임에 가입하고 일정에 참가할 수 있어요." />
			) : (
				viewer.isMember && (
					<SectionCard title="내 활동">
						<Button variant="secondary" onClick={() => setIsHistoryOpen(true)}>
							내 참가 이력
						</Button>
						{canEditNickname && me && (
							<MyNicknameForm
								groupId={groupId}
								groupNickname={me.groupNickname}
								onSaved={() => openModal({ type: ModalType.ALERT, message: '모임 닉네임이 저장되었습니다.' })}
							/>
						)}
					</SectionCard>
				)
			)}
			<SectionCard title="앱">
				<AppInstallSection />
				<Link
					to="/groups/$groupId"
					params={{ groupId: String(groupId) }}
					search={{ tab: 'home' }}
					className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
				>
					모요라에서 다른 모임도 보기 ›
				</Link>
			</SectionCard>
			{viewer.userKey !== null && <LogoutButton />}
			{isHistoryOpen && <MyAttendanceDialog groupId={groupId} onClose={() => setIsHistoryOpen(false)} />}
		</>
	);
};
