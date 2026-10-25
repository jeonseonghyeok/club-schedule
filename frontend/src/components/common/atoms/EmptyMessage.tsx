interface Props {
	message: string;
}

/** 목록이 비었거나 불러오지 못했을 때 목록 자리에 보여주는 안내 */
export const EmptyMessage = (props: Props) => <p className="py-3 text-sm text-gray-500">{props.message}</p>;
