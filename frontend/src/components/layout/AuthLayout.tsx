import type { ReactNode } from 'react';

interface Props {
	title: string;
	description?: string;
	children: ReactNode;
}

export const AuthLayout = (props: Props) => {
	const { title, description, children } = props;

	return (
		<main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<section className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
				<h1 className="text-xl font-bold text-gray-900">{title}</h1>
				{description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
				<div className="mt-6">{children}</div>
			</section>
		</main>
	);
};
