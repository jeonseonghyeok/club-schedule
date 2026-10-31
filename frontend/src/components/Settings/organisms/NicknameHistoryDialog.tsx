import { useQuery } from '@tanstack/react-query';
import { EmptyMessage } from '@/components/common/atoms/EmptyMessage';
import { Dialog, DIALOG_SIZE } from '@/components/common/organisms/Dialog';
import { NicknameHistoryList } from '@/components/Nickname/molecules/NicknameHistoryList';
import { userQueries } from '@/modules/stores/server/user/queries';

interface Props {
	onClose: () => void;
}

/** 내 계정·모든 모임 닉네임 변경 이력 */
export const NicknameHistoryDialog = (props: Props) => {
	const { data: items, isError } = useQuery({ ...userQueries.nicknameHistory() });

	const renderBody = () => {
		if (isError) return <EmptyMessage message="이력을 불러오지 못했습니다." />;
		if (!items) return <EmptyMessage message="로딩 중..." />;
		return <NicknameHistoryList items={items} showScope />;
	};

	return (
		<Dialog title="닉네임 변경 이력" size={DIALOG_SIZE.MD} onClose={props.onClose}>
			<div className="max-h-[60vh] overflow-y-auto">{renderBody()}</div>
		</Dialog>
	);
};
