import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@/components/common/organisms/Dialog';

interface Props {
	description: string | null;
}

/** 모임 설명: 4줄까지 보여주고 넘치면 "더보기"로 전체를 연다 */
export const GroupDescription = (props: Props) => {
	const { description } = props;
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const element = textRef.current;
		if (!element) return;
		const measure = () => setIsOverflowing(element.scrollHeight > element.clientHeight + 2);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, [description]);

	if (!description) return <p className="text-sm text-gray-400">모임 설명이 없습니다.</p>;

	return (
		<>
			<p ref={textRef} className="line-clamp-4 whitespace-pre-wrap text-gray-800">
				{description}
			</p>
			{isOverflowing && (
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="mt-1 text-sm text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-gray-900"
				>
					더보기 ▾
				</button>
			)}
			{isOpen && (
				<Dialog title="모임 설명" size="md" onClose={() => setIsOpen(false)}>
					<p className="whitespace-pre-wrap text-gray-800">{description}</p>
				</Dialog>
			)}
		</>
	);
};
