import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupSettingsSection } from '@/components/Group/organisms/GroupSettingsSection';
import { getGroupSettings, updateGroup, updateGroupPolicy, updateGroupRegion } from '@/modules/api/group/group';
import { useModalStore } from '@/modules/stores/client/modal';
import { renderWithProviders } from '@/test/render';
import type { GroupSettings } from '@/types/GroupSettings';

vi.mock('@/modules/api/group/group', async importOriginal => ({
	...(await importOriginal<typeof import('@/modules/api/group/group')>()),
	getGroupSettings: vi.fn(),
	updateGroup: vi.fn(),
	updateGroupPolicy: vi.fn(),
	updateGroupRegion: vi.fn(),
}));

const settings: GroupSettings = {
	groupId: 4,
	name: '모임01',
	description: null,
	capacity: 50,
	autoApprove: false,
	allowSelfNickname: true,
	regionName: null,
	latitude: null,
	longitude: null,
	appEnabled: false,
	appName: null,
	appShortName: null,
	appThemeColor: null,
	activeMemberCount: 17,
	policy: {
		minRoleToCreate: 'LEADER',
		requiresApproval: false,
		defManagerCanManageSchedule: true,
		requiresAttendanceApproval: false,
		visibilityType: 'PARTIAL',
	},
};

describe('GroupSettingsSection', () => {
	afterEach(() => {
		act(() => useModalStore.getState().actions.closeModal());
	});

	it('정원을 현재 회원 수보다 작게 하면 저장하지 않고 안내한다', async () => {
		vi.mocked(getGroupSettings).mockResolvedValue(settings);
		renderWithProviders(<GroupSettingsSection groupId={4} viewerIsLeader={false} />);

		const capacity = await screen.findByLabelText('정원');
		await userEvent.clear(capacity);
		await userEvent.type(capacity, '10');
		await userEvent.click(screen.getByRole('button', { name: '기본 정보 저장' }));

		expect(await screen.findByText('현재 회원 수(17명)보다 작게 할 수 없습니다.')).toBeInTheDocument();
		expect(updateGroup).not.toHaveBeenCalled();
	});

	it('기본 정보를 저장한다', async () => {
		vi.mocked(getGroupSettings).mockResolvedValue(settings);
		vi.mocked(updateGroup).mockResolvedValue({ ...settings, name: '독서 모임', autoApprove: true });
		renderWithProviders(<GroupSettingsSection groupId={4} viewerIsLeader={false} />);

		const name = await screen.findByLabelText('모임 이름');
		await userEvent.clear(name);
		await userEvent.type(name, '독서 모임');
		await userEvent.click(screen.getByRole('checkbox', { name: /가입 신청 자동 승인/ }));
		await userEvent.click(screen.getByRole('button', { name: '기본 정보 저장' }));

		await waitFor(() =>
			expect(updateGroup).toHaveBeenCalledWith({
				groupId: 4,
				payload: { name: '독서 모임', description: '', capacity: 50, autoApprove: true, allowSelfNickname: true },
			}),
		);
		expect(await screen.findByRole('dialog', { description: '모임 정보가 저장되었습니다.' })).toBeInTheDocument();
	});

	it('매니저에게 운영 정책은 읽기 전용이다', async () => {
		vi.mocked(getGroupSettings).mockResolvedValue(settings);
		renderWithProviders(<GroupSettingsSection groupId={4} viewerIsLeader={false} />);

		expect(await screen.findByText('운영 정책은 리더만 바꿀 수 있습니다.')).toBeInTheDocument();
		expect(screen.getByLabelText('일정 등록')).toBeDisabled();
		expect(screen.queryByRole('button', { name: '운영 정책 저장' })).not.toBeInTheDocument();
	});

	it('리더는 일반회원 일정 등록을 열 수 있다(LEADER 값은 "리더·매니저만"으로 보인다)', async () => {
		vi.mocked(getGroupSettings).mockResolvedValue(settings);
		vi.mocked(updateGroupPolicy).mockResolvedValue({
			...settings,
			policy: { ...settings.policy, minRoleToCreate: 'MEMBER', requiresApproval: true },
		});
		renderWithProviders(<GroupSettingsSection groupId={4} viewerIsLeader />);

		const scope = await screen.findByLabelText('일정 등록');
		expect(scope).toHaveValue('MANAGER');
		await userEvent.selectOptions(scope, 'MEMBER');
		await userEvent.click(screen.getByRole('checkbox', { name: /일반회원 일정은 승인 후 확정/ }));
		await userEvent.click(screen.getByRole('button', { name: '운영 정책 저장' }));

		await waitFor(() =>
			expect(updateGroupPolicy).toHaveBeenCalledWith({
				groupId: 4,
				policy: {
					minRoleToCreate: 'MEMBER',
					requiresApproval: true,
					defManagerCanManageSchedule: true,
					requiresAttendanceApproval: false,
					visibilityType: 'PARTIAL',
				},
			}),
		);
	});

	it('활동 지역 이름만 바꾸면 좌표 없이 저장한다', async () => {
		vi.mocked(getGroupSettings).mockResolvedValue({
			...settings,
			regionName: '강남역',
			latitude: 37.49,
			longitude: 127.02,
		});
		vi.mocked(updateGroupRegion).mockResolvedValue({ ...settings, regionName: '역삼동' });
		renderWithProviders(<GroupSettingsSection groupId={4} viewerIsLeader />);

		expect(await screen.findByText('지도 탭에 표시됩니다.')).toBeInTheDocument();
		const input = screen.getByLabelText('대표 활동 지역');
		await userEvent.clear(input);
		await userEvent.type(input, '역삼동');
		await userEvent.click(screen.getByRole('button', { name: '활동 지역 저장' }));

		await waitFor(() =>
			expect(updateGroupRegion).toHaveBeenCalledWith({
				groupId: 4,
				region: { regionName: '역삼동', latitude: null, longitude: null },
			}),
		);
	});
});
