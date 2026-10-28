import { useId } from 'react';
import type { ReactNode } from 'react';

interface Props {
	title: string;
	actions?: ReactNode;
	children: ReactNode;
}

export const SectionCard = (props: Props) => {
	const { title, actions, children } = props;
	const headingId = useId();

	return (
		<section aria-labelledby={headingId} className="rounded-2xl bg-white p-4 ring-1 ring-gray-200 sm:p-5">
			<header className="mb-3 flex flex-wrap items-center justify-between gap-3">
				<h2 id={headingId} className="text-[15px] font-bold text-gray-900">
					{title}
				</h2>
				{actions}
			</header>
			{children}
		</section>
	);
};
