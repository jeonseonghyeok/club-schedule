package com.moyora.clubschedule.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moyora.clubschedule.dto.GroupScheduleCreateDto;
import com.moyora.clubschedule.dto.GroupScheduleEditDto;
import com.moyora.clubschedule.exception.GroupAccessDeniedException;
import com.moyora.clubschedule.exception.ScheduleNotFoundException;
import com.moyora.clubschedule.mapper.GroupScheduleHistoryMapper;
import com.moyora.clubschedule.mapper.GroupScheduleMapper;
import com.moyora.clubschedule.mapper.ScheduleAttendanceMapper;
import com.moyora.clubschedule.vo.GroupScheduleHistoryVo;
import com.moyora.clubschedule.vo.GroupScheduleVo;
import com.moyora.clubschedule.vo.GroupScheduleVo.ScheduleStatus;
import com.moyora.clubschedule.vo.GroupSchedulePolicyVo.VisibilityType;
import com.moyora.clubschedule.vo.Notification;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupScheduleService {

    private final GroupScheduleMapper        groupScheduleMapper;
    private final GroupScheduleHistoryMapper groupScheduleHistoryMapper;
    private final ScheduleAttendanceMapper   scheduleAttendanceMapper;
    private final ScheduleAttendanceService  scheduleAttendanceService;
    private final GroupPermissionService     groupPermissionService;
    private final GroupManageService         groupManageService;
    private final NotificationService        notificationService;

    // ── 조회 ──────────────────────────────────────────────────────────────────

    /**
     * 그룹 일정 조회.
     * 멤버는 전체 조회, 비회원은 group_schedule_policy.visibility_type에 따라 제한된다.
     *  PRIVATE — 비회원에게 아무 일정도 노출하지 않음
     *  PARTIAL — 확정된 향후 일정 중, "3일 이내 건수"와 "3건" 중 더 큰 쪽만큼만 노출
     *  PUBLIC  — 확정된 향후 일정 전체 노출
     */
    @Transactional(readOnly = true)
    public List<GroupScheduleVo> listSchedules(Long groupId, Long userKey) {
        return listSchedules(groupId, userKey, null, null);
    }

    /** from/to는 null 허용 — 둘 다 null이면 그룹의 전체 일정을 조회(관리 화면 등에서 사용) */
    @Transactional(readOnly = true)
    public List<GroupScheduleVo> listSchedules(Long groupId, Long userKey, LocalDateTime from, LocalDateTime to) {
        List<GroupScheduleVo> all = groupScheduleMapper.selectByGroupId(groupId, from, to);
        if (groupManageService.isMember(groupId, userKey)) {
            return all;
        }

        VisibilityType visibility = groupPermissionService.resolveVisibilityType(groupId);
        if (visibility == VisibilityType.PRIVATE) {
            return List.of();
        }

        LocalDateTime now = LocalDateTime.now();
        List<GroupScheduleVo> confirmedFuture = all.stream()
                .filter(s -> s.getStatus() == ScheduleStatus.CONFIRMED)
                .filter(s -> !s.getStartAt().isBefore(now))
                .sorted(Comparator.comparing(GroupScheduleVo::getStartAt))
                .collect(Collectors.toList());

        if (visibility == VisibilityType.PUBLIC) {
            return confirmedFuture;
        }

        // PARTIAL: 향후 3일 이내 건수와 3건 중 더 큰 쪽을 노출
        LocalDateTime cutoff = now.plusDays(3);
        long within3Days = confirmedFuture.stream()
                .filter(s -> !s.getStartAt().isAfter(cutoff))
                .count();
        int limit = (int) Math.max(within3Days, 3);
        return confirmedFuture.stream().limit(limit).collect(Collectors.toList());
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
        GroupScheduleVo created = groupScheduleMapper.selectByScheduleId(dto.getScheduleId());

        if (created.getStatus() == ScheduleStatus.CONFIRMED) {
            scheduleAttendanceService.attend(dto.getGroupId(), dto.getScheduleId(), dto.getCreatedBy());
        }
        return created;
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

        scheduleAttendanceService.attend(groupId, scheduleId, schedule.getCreatedBy());

        notificationService.createNotification(Notification.builder()
                .userKey(schedule.getCreatedBy())
                .sourceTable("SCHEDULE")
                .sourceId(scheduleId)
                .category("APPROVE")
                .title("일정 신청이 승인되었습니다")
                .content(schedule.getTitle() + " 일정이 승인되었습니다.")
                .isRead(false)
                .build());

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

        notificationService.createNotification(Notification.builder()
                .userKey(schedule.getCreatedBy())
                .sourceTable("SCHEDULE")
                .sourceId(scheduleId)
                .category("REJECT")
                .title("일정 신청이 거부되었습니다")
                .content(schedule.getTitle() + " 일정 신청이 거부되었습니다.")
                .isRead(false)
                .build());

        return groupScheduleMapper.selectByScheduleId(scheduleId);
    }

    // ── 수정 ──────────────────────────────────────────────────────────────────

    /**
     * 일정 수정.
     * 수정 전 스냅샷을 group_schedule_history에 저장하고 group_schedule를 업데이트한다.
     * change_reason 필수, max_attendance 정원 검증 포함.
     */
    @Transactional
    public GroupScheduleVo editSchedule(Long groupId, Long scheduleId,
                                        GroupScheduleEditDto dto, Long operatorUserKey) {
        GroupScheduleVo schedule = getAndValidateGroup(scheduleId, groupId);

        if (dto.getChangeReason() == null || dto.getChangeReason().isBlank()) {
            throw new IllegalArgumentException("변경 사유는 필수입니다.");
        }

        groupPermissionService.validateEditPermission(groupId, operatorUserKey, schedule);

        if (dto.getMaxAttendance() > 0) {
            int confirmed = scheduleAttendanceMapper.countConfirmedAttendees(scheduleId);
            if (dto.getMaxAttendance() < confirmed) {
                throw new IllegalArgumentException(
                        String.format("현재 참가 확정 인원(%d명)보다 정원이 작을 수 없습니다.", confirmed));
            }
        }

        GroupScheduleHistoryVo history = new GroupScheduleHistoryVo();
        history.setScheduleId(schedule.getScheduleId());
        history.setGroupId(schedule.getGroupId());
        history.setChangedBy(operatorUserKey);
        history.setChangeReason(dto.getChangeReason());
        history.setTitle(schedule.getTitle());
        history.setContent(schedule.getContent());
        history.setLocationName(schedule.getLocationName());
        history.setLatitude(schedule.getLatitude());
        history.setLongitude(schedule.getLongitude());
        history.setStartAt(schedule.getStartAt());
        history.setEndAt(schedule.getEndAt());
        history.setMaxAttendance(schedule.getMaxAttendance());
        history.setStatus(schedule.getStatus());
        groupScheduleHistoryMapper.insertHistory(history);

        dto.setScheduleId(scheduleId);
        dto.setGroupId(groupId);
        groupScheduleMapper.updateSchedule(dto);

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
