package com.moyora.clubschedule.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moyora.clubschedule.exception.GroupAccessDeniedException;
import com.moyora.clubschedule.mapper.NicknameHistoryMapper;
import com.moyora.clubschedule.mapper.UserMapper;
import com.moyora.clubschedule.vo.NicknameHistoryVo;
import com.moyora.clubschedule.vo.UserVo;

import lombok.RequiredArgsConstructor;

/**
 * 계정 닉네임과 모임 닉네임 일괄 변경. 계정 닉네임은 계정당 하나이고, 모임 닉네임은 모임마다 따로 둔다
 * (가입 때 계정 닉네임을 복사). 계정 닉네임을 바꿀 때 고른 모임의 닉네임도 같이 바꿀 수 있다 — 모임이 본인 수정을
 * 허용하거나 내가 모임장·매니저인 모임만.
 */
@Service
@RequiredArgsConstructor
public class NicknameService {

    private final UserMapper userMapper;
    private final NicknameHistoryMapper nicknameHistoryMapper;
    private final GroupManageService groupManageService;

    /** 계정 닉네임 변경 + 이력 */
    @Transactional
    public void updateAccountNickname(Long userKey, String nickname) {
        UserVo user = userMapper.selectByUserKey(userKey);
        String current = user != null ? user.getNickname() : null;
        if (nickname.equals(current)) return;
        userMapper.updateNickname(userKey, nickname);
        NicknameHistoryVo history = new NicknameHistoryVo();
        history.setUserKey(userKey);
        history.setOldNickname(current);
        history.setNewNickname(nickname);
        history.setChangedBy(userKey);
        nicknameHistoryMapper.insert(history);
    }

    /**
     * 고른 모임들의 내 닉네임을 같은 이름으로 바꾼다. 모임마다 따로 저장해, 한 모임이 실패(수정 불가·이름 중복)해도
     * 나머지는 바뀐다. 결과 {updated:[{groupId, groupNickname}], skipped:[{groupId, message}]}
     */
    public Map<String, Object> applyToGroups(Long userKey, String nickname, List<Long> groupIds) {
        List<Map<String, Object>> updated = new ArrayList<>();
        List<Map<String, Object>> skipped = new ArrayList<>();
        for (Long groupId : groupIds) {
            try {
                String saved = groupManageService.updateMyNickname(groupId, userKey, nickname);
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("groupId", groupId);
                row.put("groupNickname", saved);
                updated.add(row);
            } catch (GroupAccessDeniedException | IllegalStateException | IllegalArgumentException e) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("groupId", groupId);
                row.put("message", e.getMessage());
                skipped.add(row);
            }
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("updated", updated);
        result.put("skipped", skipped);
        return result;
    }

    /** 내 계정·모든 모임 닉네임 이력(최신순) */
    public List<NicknameHistoryVo> getMyHistory(Long userKey) {
        return nicknameHistoryMapper.selectByUser(userKey);
    }
}
