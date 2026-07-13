package com.moyora.clubschedule.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moyora.clubschedule.exception.GroupAccessDeniedException;
import com.moyora.clubschedule.exception.ScheduleNotFoundException;
import com.moyora.clubschedule.mapper.GroupMemberMapper;
import com.moyora.clubschedule.mapper.GroupScheduleMapper;
import com.moyora.clubschedule.mapper.GroupSchedulePolicyMapper;
import com.moyora.clubschedule.mapper.ScheduleAttendanceCheckHistoryMapper;
import com.moyora.clubschedule.mapper.ScheduleAttendanceMapper;
import com.moyora.clubschedule.vo.GroupRole;
import com.moyora.clubschedule.vo.GroupSchedulePolicyVo;
import com.moyora.clubschedule.vo.GroupScheduleVo;
import com.moyora.clubschedule.vo.GroupScheduleVo.ScheduleStatus;
import com.moyora.clubschedule.vo.ScheduleAttendanceCheckHistoryVo;
import com.moyora.clubschedule.vo.ScheduleAttendanceVo;
import com.moyora.clubschedule.vo.ScheduleAttendanceVo.AttendanceStatus;
import com.moyora.clubschedule.vo.ScheduleAttendanceVo.ActualStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScheduleAttendanceService {

    private final ScheduleAttendanceMapper             attendanceMapper;
    private final ScheduleAttendanceCheckHistoryMapper checkHistoryMapper;
    private final GroupScheduleMapper                  scheduleMapper;
    private final GroupSchedulePolicyMapper            policyMapper;
    private final GroupMemberMapper                    memberMapper;

    // ── 참가 신청 ─────────────────────────────────────────────────────────────

    @Transactional
    public ScheduleAttendanceVo attend(Long groupId, Long scheduleId, Long userKey) {
        GroupScheduleVo schedule = requireSchedule(scheduleId, groupId);

        if (schedule.getStatus() != ScheduleStatus.CONFIRMED) {
            throw new IllegalStateException("승인된 일정에만 참가 신청할 수 있습니다.");
        }

        ScheduleAttendanceVo existing = attendanceMapper.selectLatest(scheduleId, userKey);
        if (existing != null && existing.getStatus() == AttendanceStatus.PENDING
                || existing != null && existing.getStatus() == AttendanceStatus.CONFIRMED) {
            throw new IllegalStateException("이미 참가 신청 중이거나 참가 확정된 일정입니다.");
        }

        // 이전 이력 무효화
        attendanceMapper.invalidateLatest(scheduleId, userKey);

        // 신청 이력은 항상 PENDING으로 먼저 남긴다
        ScheduleAttendanceVo pendingVo = new ScheduleAttendanceVo();
        pendingVo.setScheduleId(scheduleId);
        pendingVo.setUserKey(userKey);
        pendingVo.setStatus(AttendanceStatus.PENDING);
        pendingVo.setActualStatus(ActualStatus.NONE);
        pendingVo.setUpdatedBy(userKey);
        attendanceMapper.insertAttendance(pendingVo);

        // 생성자/역할/정책상 즉시 자동승인 대상이면 승인 이력을 이어서 남긴다(본인 처리)
        AttendanceStatus resolvedStatus = resolveInitialStatus(groupId, schedule, userKey);
        if (resolvedStatus == AttendanceStatus.CONFIRMED) {
            attendanceMapper.invalidateLatest(scheduleId, userKey);
            return insertNewRow(scheduleId, userKey, AttendanceStatus.CONFIRMED, userKey, userKey);
        }

        return attendanceMapper.selectById(pendingVo.getAttendanceId());
    }

    // ── 참가 취소 (본인) ──────────────────────────────────────────────────────

    @Transactional
    public void cancelAttend(Long groupId, Long scheduleId, Long userKey) {
        GroupScheduleVo schedule = requireSchedule(scheduleId, groupId);
        requireBeforeStart(schedule);

        ScheduleAttendanceVo att = requireLatest(scheduleId, userKey);
        if (att.getStatus() == AttendanceStatus.CANCELLED
                || att.getStatus() == AttendanceStatus.REJECTED) {
            throw new IllegalStateException("이미 취소되었거나 거부된 참가 신청입니다.");
        }

        attendanceMapper.invalidateLatest(scheduleId, userKey);
        insertNewRow(scheduleId, userKey, AttendanceStatus.CANCELLED, null, userKey);
    }

    // ── 참가자 목록 ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ScheduleAttendanceVo> listAttendees(Long groupId, Long scheduleId) {
        requireSchedule(scheduleId, groupId);
        return attendanceMapper.selectActiveList(scheduleId);
    }

    // ── 참가 이력(신청/승인/거부/취소) ────────────────────────────────────────────

    /** is_latest 무관 전체 행을 시간순으로 반환 — status 값이 곧 액션(신청/확정/거부/취소)을 의미한다. */
    @Transactional(readOnly = true)
    public List<ScheduleAttendanceVo> listHistory(Long groupId, Long scheduleId) {
        requireSchedule(scheduleId, groupId);
        return attendanceMapper.selectHistoryByScheduleId(scheduleId);
    }

    // ── 승인 ──────────────────────────────────────────────────────────────────

    @Transactional
    public ScheduleAttendanceVo approveAttendance(Long groupId, Long scheduleId,
                                                   Long targetUserKey, Long operatorUserKey) {
        GroupScheduleVo schedule = requireSchedule(scheduleId, groupId);
        validateAttendanceManagerPermission(groupId, schedule, operatorUserKey);

        ScheduleAttendanceVo att = requireLatest(scheduleId, targetUserKey);
        if (att.getStatus() != AttendanceStatus.PENDING) {
            throw new IllegalStateException("대기 중인 참가 신청만 승인할 수 있습니다.");
        }

        attendanceMapper.invalidateLatest(scheduleId, targetUserKey);
        return insertNewRow(scheduleId, targetUserKey, AttendanceStatus.CONFIRMED,
                operatorUserKey, operatorUserKey);
    }

    // ── 거부 ──────────────────────────────────────────────────────────────────

    @Transactional
    public void rejectAttendance(Long groupId, Long scheduleId,
                                  Long targetUserKey, Long operatorUserKey) {
        GroupScheduleVo schedule = requireSchedule(scheduleId, groupId);
        validateAttendanceManagerPermission(groupId, schedule, operatorUserKey);

        ScheduleAttendanceVo att = requireLatest(scheduleId, targetUserKey);
        if (att.getStatus() != AttendanceStatus.PENDING) {
            throw new IllegalStateException("대기 중인 참가 신청만 거부할 수 있습니다.");
        }

        attendanceMapper.invalidateLatest(scheduleId, targetUserKey);
        insertNewRow(scheduleId, targetUserKey, AttendanceStatus.REJECTED, operatorUserKey, operatorUserKey);
    }

    // ── 강제 취소 (매니저/리더 전용) ──────────────────────────────────────────────

    /** 일정 생성자 단독 권한으로는 불가 — 매니저 이상만 강제취소할 수 있다(승인/거부보다 좁은 권한). */
    @Transactional
    public void forceCancel(Long groupId, Long scheduleId,
                             Long targetUserKey, Long operatorUserKey) {
        GroupScheduleVo schedule = requireSchedule(scheduleId, groupId);
        requireBeforeStart(schedule);
        requireManagerRole(groupId, operatorUserKey);

        requireLatest(scheduleId, targetUserKey);
        attendanceMapper.invalidateLatest(scheduleId, targetUserKey);
        insertNewRow(scheduleId, targetUserKey, AttendanceStatus.CANCELLED, null, operatorUserKey);
    }

    // ── 출석 체크 (정정 가능, 이력 기록) ──────────────────────────────────────────

    /**
     * 출석 체크(실제 참석 여부). 최초 체크 이후에도 정정 가능하며, 매 호출마다
     * 변경 전/후 값을 schedule_attendance_check_history에 남긴다.
     * 권한은 참가 승인/거부/강제취소와 동일하게 일정 생성자 또는 MANAGER 이상.
     */
    @Transactional
    public ScheduleAttendanceVo checkActual(Long groupId, Long scheduleId,
                                             Long targetUserKey, ActualStatus actualStatus,
                                             Long operatorUserKey, String changeReason) {
        GroupScheduleVo schedule = requireSchedule(scheduleId, groupId);
        validateAttendanceManagerPermission(groupId, schedule, operatorUserKey);

        ScheduleAttendanceVo att = requireLatest(scheduleId, targetUserKey);
        if (att.getStatus() != AttendanceStatus.CONFIRMED) {
            throw new IllegalStateException("참가 확정된 멤버만 출석 체크할 수 있습니다.");
        }

        ScheduleAttendanceCheckHistoryVo history = new ScheduleAttendanceCheckHistoryVo();
        history.setAttendanceId(att.getAttendanceId());
        history.setScheduleId(scheduleId);
        history.setUserKey(targetUserKey);
        history.setPreviousActualStatus(att.getActualStatus());
        history.setNewActualStatus(actualStatus);
        history.setChangedBy(operatorUserKey);
        history.setChangeReason(changeReason);
        checkHistoryMapper.insertHistory(history);

        attendanceMapper.updateActualStatus(att.getAttendanceId(), actualStatus, operatorUserKey);
        return attendanceMapper.selectById(att.getAttendanceId());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private GroupScheduleVo requireSchedule(Long scheduleId, Long groupId) {
        GroupScheduleVo s = scheduleMapper.selectByScheduleId(scheduleId);
        if (s == null) throw new ScheduleNotFoundException(scheduleId);
        if (!s.getGroupId().equals(groupId)) {
            throw new GroupAccessDeniedException("해당 그룹의 일정이 아닙니다.");
        }
        return s;
    }

    /** 승인/거부/취소/강제취소 공용 — 항상 새 행을 INSERT한다(호출 전에 invalidateLatest 필요). */
    private ScheduleAttendanceVo insertNewRow(Long scheduleId, Long userKey, AttendanceStatus status,
                                               Long processedByUserKey, Long updatedBy) {
        ScheduleAttendanceVo vo = new ScheduleAttendanceVo();
        vo.setScheduleId(scheduleId);
        vo.setUserKey(userKey);
        vo.setStatus(status);
        vo.setActualStatus(ActualStatus.NONE);
        vo.setProcessedByUserKey(processedByUserKey);
        vo.setUpdatedBy(updatedBy);
        attendanceMapper.insertAttendance(vo);
        return attendanceMapper.selectById(vo.getAttendanceId());
    }

    private ScheduleAttendanceVo requireLatest(Long scheduleId, Long userKey) {
        ScheduleAttendanceVo att = attendanceMapper.selectLatest(scheduleId, userKey);
        if (att == null) throw new IllegalStateException("참가 신청 내역이 없습니다.");
        return att;
    }

    private void requireBeforeStart(GroupScheduleVo schedule) {
        if (LocalDateTime.now().isAfter(schedule.getStartAt())) {
            throw new IllegalStateException("일정 시작 이후에는 참가 취소/변경이 불가합니다.");
        }
    }

    /** 일정 등록자이거나 MANAGER 이상이면 허용 */
    private void validateAttendanceManagerPermission(Long groupId, GroupScheduleVo schedule,
                                                      Long operatorUserKey) {
        if (schedule.getCreatedBy().equals(operatorUserKey)) return;
        requireManagerRole(groupId, operatorUserKey);
    }

    private void requireManagerRole(Long groupId, Long userKey) {
        String roleStr = memberMapper.selectRoleByGroupAndUser(groupId, userKey);
        GroupRole role = GroupRole.from(roleStr);
        if (role == GroupRole.MEMBER) {
            throw new GroupAccessDeniedException("매니저 이상 권한이 필요합니다.");
        }
    }

    private AttendanceStatus resolveInitialStatus(Long groupId, GroupScheduleVo schedule, Long userKey) {
        if (userKey.equals(schedule.getCreatedBy())) {
            return AttendanceStatus.CONFIRMED;   // 일정 생성자 본인은 항상 자동승인
        }

        String roleStr = memberMapper.selectRoleByGroupAndUser(groupId, userKey);
        GroupRole role;
        try { role = GroupRole.valueOf(roleStr.toUpperCase()); }
        catch (Exception e) { role = GroupRole.MEMBER; }

        if (role == GroupRole.LEADER || role == GroupRole.MANAGER) {
            return AttendanceStatus.CONFIRMED;
        }

        GroupSchedulePolicyVo policy = policyMapper.selectByGroupId(groupId);
        if (policy == null) policy = GroupSchedulePolicyVo.defaultPolicy(groupId);

        return policy.isRequiresAttendanceApproval()
                ? AttendanceStatus.PENDING
                : AttendanceStatus.CONFIRMED;
    }
}
