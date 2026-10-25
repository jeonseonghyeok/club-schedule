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
		<section aria-labelledby={headingId} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<header className="mb-3 flex flex-wrap items-center justify-between gap-3">
				<h2 id={headingId} className="text-base font-bold text-gray-900">
					{title}
				</h2>
				{actions}
			</header>
			{children}
		</section>
	);
};
