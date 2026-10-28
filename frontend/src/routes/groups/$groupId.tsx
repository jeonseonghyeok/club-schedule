import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { AxiosError, HttpStatusCode } from 'axios';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { buttonClassName } from '@/components/common/atoms/Button';
import { Icon } from '@/components/common/atoms/Icon';
import { MenuButton } from '@/components/common/molecules/MenuButton';
import { Tabs, TAB_PANEL_VARIANT } from '@/components/common/organisms/Tabs';
import type { TabItem } from '@/components/common/organisms/Tabs';
import { VisibilityNotice } from '@/components/Group/molecules/VisibilityNotice';
import { GroupHero } from '@/components/Group/organisms/GroupHero';
import {
	HomePanel,
	MANAGE_SECTION_KEYS,
	ManagePanel,
	MembersPanel,
	SchedulePanel,
} from '@/components/Group/organisms/GroupPanels';
import { AppShell } from '@/components/layout/AppShell';
import { MemberInfoDialog } from '@/components/Member/organisms/MemberInfoDialog';
import { MyAttendanceDialog } from '@/components/Member/organisms/MyAttendanceDialog';
import { MyNicknameForm } from '@/components/Member/organisms/MyNicknameForm';
import { ScheduleDialogs } from '@/components/Schedule/organisms/ScheduleDialogs';
import { ModalType } from '@/constants';
import { useGoHome } from '@/hooks/useAppBackNavigation';
import { useModalStore } from '@/modules/stores/client/modal';
import { useScheduleDialogStore } from '@/modules/stores/client/scheduleDialog';
import { authQueries } from '@/modules/stores/server/auth/queries';
import { groupQueries } from '@/modules/stores/server/group/queries';
import { useWithdrawGroup } from '@/modules/stores/server/member/mutations';
import { memberQueries } from '@/modules/stores/server/member/queries';
import type { GroupDetail } from '@/types/GroupDetail';
import { VISIBILITY_TYPE } from '@/types/GroupDetail';
import type { GroupMember } from '@/types/Member';
import { getGroupName } from '@/utils/group';

const GROUP_TAB_KEYS = ['home', 'schedule', 'members', 'manage'] as const;
type GroupTabKey = (typeof GROUP_TAB_KEYS)[number];

const groupSearchSchema = z.object({
	tab: z.enum(GROUP_TAB_KEYS).catch('home'),
	/** 관리 탭 안의 하위 메뉴(없으면 요청) */
	section: z.enum(MANAGE_SECTION_KEYS).optional().catch(undefined),
});

const parseGroupId = (raw: string): number => {
	const groupId = Number(raw);
	if (!Number.isInteger(groupId) || groupId <= 0) throw notFound();
	return groupId;
};

/** 일정 탭은 비공개 모임이 아니면 누구나(비회원은 공개 범위 안의 일정만), 멤버만 멤버 탭, 매니저 이상만 관리 탭 */
const getAvailableTabs = (detail: GroupDetail): GroupTabKey[] => [
	'home',
	...(detail.viewer.isMember || detail.visibilityType !== VISIBILITY_TYPE.PRIVATE ? (['schedule'] as const) : []),
	...(detail.viewer.isMember ? (['members'] as const) : []),
	...(detail.viewer.isManager ? (['manage'] as const) : []),
];

const TAB_LABEL = { home: '홈', schedule: '일정', members: '멤버', manage: '관리' } as const satisfies Record<
	GroupTabKey,
	string
>;

const GroupPage = () => {
	const { groupId: rawGroupId } = Route.useParams();
	const groupId = parseGroupId(rawGroupId);
	const { tab, section = 'requests' } = Route.useSearch();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const { data: detail } = useSuspenseQuery({ ...groupQueries.detail(groupId) });
	const { close } = useScheduleDialogStore(state => state.actions);
	const openModal = useModalStore(state => state.actions.openModal);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [myInfo, setMyInfo] = useState<GroupMember | null>(null);
	const { mutate: withdraw } = useWithdrawGroup(groupId);
	const goHome = useGoHome();
	const { viewer } = detail;

	// 다른 모임으로 이동하거나 화면을 떠나면 열려 있던 일정 모달을 닫는다
	useEffect(() => close, [groupId, close]);

	const available = getAvailableTabs(detail);
	const selected = available.includes(tab) ? tab : 'home';
	const renderPanel = (key: GroupTabKey) => {
		switch (key) {
			case 'home':
				return <HomePanel groupId={groupId} detail={detail} />;
			case 'schedule':
				return <SchedulePanel groupId={groupId} detail={detail} />;
			case 'members':
				return <MembersPanel groupId={groupId} detail={detail} />;
			case 'manage':
				return (
					<ManagePanel
						groupId={groupId}
						detail={detail}
						section={section}
						onSectionChange={next => navigate({ search: prev => ({ ...prev, section: next }), replace: true })}
					/>
				);
			default: {
				const exhaustive: never = key;
				return exhaustive;
			}
		}
	};
	const tabs: readonly TabItem<GroupTabKey>[] = available.map(key => ({
		key,
		label: TAB_LABEL[key],
		render: () => renderPanel(key),
	}));

	const openMyInfo = async () => {
		try {
			const members = await queryClient.fetchQuery(memberQueries.list(groupId));
			const me = members.find(member => member.userKey === viewer.userKey);
			if (me) setMyInfo(me);
			else openModal({ type: ModalType.ALERT, message: '내 정보를 찾을 수 없습니다.' });
		} catch {
			openModal({ type: ModalType.ALERT, message: '내 정보를 불러오지 못했습니다.' });
		}
	};

	const confirmWithdraw = () => {
		setMyInfo(null);
		if (viewer.isLeader) {
			openModal({ type: ModalType.ALERT, message: '리더는 다른 회원에게 리더를 넘긴 뒤 탈퇴할 수 있습니다.' });
			return;
		}
		openModal({
			type: ModalType.CONFIRM,
			message: '이 모임에서 탈퇴하시겠습니까?\n앞으로의 일정 참가 신청도 함께 취소됩니다.',
			confirmLabel: '탈퇴',
			onConfirm: () =>
				withdraw(undefined, {
					onSuccess: () => {
						goHome();
						openModal({ type: ModalType.ALERT, message: '모임에서 탈퇴했습니다.' });
					},
				}),
		});
	};

	return (
		<>
			<AppShell
				title={getGroupName(detail.group)}
				isLoggedIn={viewer.userKey !== null}
				leading={
					<button
						type="button"
						onClick={goHome}
						aria-label="홈으로"
						className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-600"
					>
						<Icon name="chevronLeft" />
					</button>
				}
				actions={
					viewer.isMember && (
						<MenuButton
							label="모임 메뉴 더보기"
							icon={<Icon name="more" size={22} strokeWidth={3} />}
							items={[
								{ label: '내 참가 이력', onSelect: () => setIsHistoryOpen(true) },
								{ label: '내 정보 · 모임 닉네임', onSelect: () => void openMyInfo() },
								{ label: '모임 탈퇴', onSelect: confirmWithdraw, tone: 'danger' },
							]}
						/>
					)
				}
			>
				<GroupHero groupId={groupId} detail={detail} />
				{!viewer.isMember && <VisibilityNotice visibilityType={detail.visibilityType} />}
				<Tabs
					label="모임 메뉴"
					tabs={tabs}
					selected={selected}
					// 탭 이동은 기록을 쌓지 않는다 — 뒤로가기는 탭이 아니라 홈으로 간다
					onSelect={key => navigate({ search: prev => ({ ...prev, tab: key }), replace: true })}
					panelVariant={TAB_PANEL_VARIANT.PLAIN}
				/>
			</AppShell>
			<ScheduleDialogs groupId={groupId} viewer={viewer} />
			{isHistoryOpen && <MyAttendanceDialog groupId={groupId} onClose={() => setIsHistoryOpen(false)} />}
			{myInfo && (
				<MemberInfoDialog
					groupId={groupId}
					member={myInfo}
					canEditRole={false}
					canKick={false}
					onKick={() => {}}
					onWithdraw={confirmWithdraw}
					onClose={() => setMyInfo(null)}
				>
					{/* 모임이 막아둬도 리더는 자기 닉네임을 바꿀 수 있다 */}
					{(viewer.isLeader || detail.group.allowSelfNickname) && (
						<MyNicknameForm
							groupId={groupId}
							groupNickname={myInfo.groupNickname}
							onSaved={() => {
								setMyInfo(null);
								openModal({ type: ModalType.ALERT, message: '모임 닉네임이 저장되었습니다.' });
							}}
						/>
					)}
				</MemberInfoDialog>
			)}
		</>
	);
};

const GroupNotFound = () => (
	<main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-12">
		<h1 className="text-xl font-bold text-gray-900">모임을 찾을 수 없습니다.</h1>
		<Link to="/" search={{ list: 1 }} className={buttonClassName('secondary')}>
			목록으로
		</Link>
	</main>
);

export const Route = createFileRoute('/groups/$groupId')({
	validateSearch: groupSearchSchema,
	// 로그인은 강제하지 않는다 — 비회원은 모임 소개와 공개 범위 안의 일정을 본다
	loader: async ({ context, params }) => {
		const groupId = parseGroupId(params.groupId);
		await context.queryClient.ensureQueryData(authQueries.me());
		try {
			await context.queryClient.ensureQueryData(groupQueries.detail(groupId));
		} catch (error) {
			if (error instanceof AxiosError && error.response?.status === HttpStatusCode.NotFound) throw notFound();
			throw error;
		}
	},
	component: GroupPage,
	notFoundComponent: GroupNotFound,
});
