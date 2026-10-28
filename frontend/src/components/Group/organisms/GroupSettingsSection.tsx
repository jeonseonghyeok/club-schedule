import { useQuery } from '@tanstack/react-query';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { SectionCard } from '@/components/common/molecules/SectionCard';
import { GroupAppForm } from '@/components/Group/organisms/GroupAppForm';
import { GroupInfoForm } from '@/components/Group/organisms/GroupInfoForm';
import { GroupPolicyForm } from '@/components/Group/organisms/GroupPolicyForm';
import { GroupRegionForm } from '@/components/Group/organisms/GroupRegionForm';
import { groupQueries } from '@/modules/stores/server/group/queries';

interface Props {
	groupId: number;
	viewerIsLeader: boolean;
}

/** 관리 탭 "모임 설정": 기본 정보(리더·매니저) + 운영 정책(리더 수정, 매니저 열람) */
export const GroupSettingsSection = (props: Props) => {
	const { groupId, viewerIsLeader } = props;
	const { data: settings, isError } = useQuery({ ...groupQueries.settings(groupId) });

	if (isError) {
		return (
			<SectionCard title="모임 설정">
				<EmptyMessage message="모임 설정을 불러오지 못했습니다." />
			</SectionCard>
		);
	}
	if (!settings) {
		return (
			<SectionCard title="모임 설정">
				<EmptyMessage message="로딩 중..." />
			</SectionCard>
		);
	}

	return (
		<>
			<SectionCard title="모임 기본 정보">
				<GroupInfoForm groupId={groupId} settings={settings} />
			</SectionCard>
			{settings.appEnabled && (
				<SectionCard title="전용 앱">
					<GroupAppForm groupId={groupId} settings={settings} />
				</SectionCard>
			)}
			<SectionCard title="활동 지역">
				<GroupRegionForm groupId={groupId} settings={settings} />
			</SectionCard>
			<SectionCard title="운영 정책">
				<GroupPolicyForm groupId={groupId} policy={settings.policy} canEdit={viewerIsLeader} />
			</SectionCard>
		</>
	);
};
