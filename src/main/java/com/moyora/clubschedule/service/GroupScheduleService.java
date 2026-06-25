package com.moyora.clubschedule.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moyora.clubschedule.dto.GroupScheduleCreateDto;
import com.moyora.clubschedule.exception.GroupAccessDeniedException;
import com.moyora.clubschedule.exception.ScheduleNotFoundException;
import com.moyora.clubschedule.mapper.GroupScheduleMapper;
import com.moyora.clubschedule.vo.GroupScheduleVo;
import com.moyora.clubschedule.vo.GroupScheduleVo.ScheduleStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupScheduleService {

    private final GroupScheduleMapper   groupScheduleMapper;
    private final GroupPermissionService groupPermissionService;

    // ── 조회 ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<GroupScheduleVo> listSchedules(Long groupId) {
        return groupScheduleMapper.selectByGroupId(groupId);
    }

    @Transactional(readOnly = true)
    public int countSchedules(Long groupId) {
        return groupScheduleMapper.countByGroupId(groupId);
    }

    // ── 생성 ──────────────────────────────────────────────────────────────────

    /**
     * 일정 생성.
     * GroupPermissionService가 역할·정책을 검사하고 초기 status를 결정한다.
     */
    @Transactional
    public GroupScheduleVo createSchedule(GroupScheduleCreateDto dto) {
        ScheduleStatus initialStatus =
                groupPermissionService.resolveCreatePermission(dto.getGroupId(), dto.getCreatedBy());
        dto.setStatus(initialStatus);

        groupScheduleMapper.insertSchedule(dto);
        return groupScheduleMapper.selectByScheduleId(dto.getScheduleId());
    }

    // ── 승인 / 반려 ───────────────────────────────────────────────────────────

    /**
     * 일정 승인 (PENDING → CONFIRMED).
     * LEADER 또는 MANAGE_SCHEDULE 권한을 가진 MANAGER만 가능.
     */
    @Transactional
    public GroupScheduleVo approveSchedule(Long groupId, Long scheduleId, Long operatorUserKey) {
        GroupScheduleVo schedule = getAndValidateGroup(scheduleId, groupId);
        requireStatus(schedule, ScheduleStatus.PENDING, "승인");

        groupPermissionService.validateApprovePermission(groupId, operatorUserKey);
        groupScheduleMapper.updateScheduleStatus(scheduleId, ScheduleStatus.CONFIRMED, operatorUserKey);
        return groupScheduleMapper.selectByScheduleId(scheduleId);
    }

    /**
     * 일정 반려 (PENDING → REJECTED).
     * LEADER 또는 MANAGE_SCHEDULE 권한을 가진 MANAGER만 가능.
     */
    @Transactional
    public GroupScheduleVo rejectSchedule(Long groupId, Long scheduleId, Long operatorUserKey) {
        GroupScheduleVo schedule = getAndValidateGroup(scheduleId, groupId);
        requireStatus(schedule, ScheduleStatus.PENDING, "반려");

        groupPermissionService.validateApprovePermission(groupId, operatorUserKey);
        groupScheduleMapper.updateScheduleStatus(scheduleId, ScheduleStatus.REJECTED, operatorUserKey);
        return groupScheduleMapper.selectByScheduleId(scheduleId);
    }

    // ── 취소 ──────────────────────────────────────────────────────────────────

    /**
     * 일정 취소 (PENDING·CONFIRMED → CANCELLED).
     * - 본인 PENDING 일정: 누구나 취소 가능
     * - 그 외: LEADER 또는 MANAGE_SCHEDULE 권한을 가진 MANAGER만 가능
     */
    @Transactional
    public GroupScheduleVo cancelSchedule(Long groupId, Long scheduleId, Long operatorUserKey) {
        GroupScheduleVo schedule = getAndValidateGroup(scheduleId, groupId);

        if (schedule.getStatus() == ScheduleStatus.CANCELLED
                || schedule.getStatus() == ScheduleStatus.REJECTED) {
            throw new IllegalStateException("이미 취소되었거나 반려된 일정입니다.");
        }

        groupPermissionService.validateCancelPermission(
                groupId, operatorUserKey,
                schedule.getCreatedBy(), schedule.getStatus());

        groupScheduleMapper.updateScheduleStatus(scheduleId, ScheduleStatus.CANCELLED, null);
        return groupScheduleMapper.selectByScheduleId(scheduleId);
    }

    // ── 내부 유틸 ─────────────────────────────────────────────────────────────

    /** scheduleId로 조회 후, 해당 그룹 소속인지 검증 */
    private GroupScheduleVo getAndValidateGroup(Long scheduleId, Long groupId) {
        GroupScheduleVo s = groupScheduleMapper.selectByScheduleId(scheduleId);
        if (s == null) throw new ScheduleNotFoundException(scheduleId);
        if (!s.getGroupId().equals(groupId)) {
            throw new GroupAccessDeniedException("해당 그룹의 일정이 아닙니다.");
        }
        return s;
    }

    /** 기대 status가 아니면 예외 */
    private void requireStatus(GroupScheduleVo s, ScheduleStatus expected, String action) {
        if (s.getStatus() != expected) {
            throw new IllegalStateException(
                    String.format("%s 상태인 일정만 %s할 수 있습니다. 현재 상태: %s",
                            expected, action, s.getStatus()));
        }
    }
}
