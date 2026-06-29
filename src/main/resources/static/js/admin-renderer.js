(function(){
    // Users panel renderer: listens to 'admin:search:results' and renders a table
    function formatDateTime(s){
        if(!s) return '';
        // try parse ISO or MySQL datetime
        const d = new Date(s);
        if (isNaN(d)) return s;
        const pad = (n)=>String(n).padStart(2,'0');
        return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function extractItems(data){
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.content)) return data.content;
        if (Array.isArray(data.items)) return data.items;
        // fallback: find the first array-valued property
        for (const k in data){
            if (Array.isArray(data[k])) return data[k];
        }
        return [];
    }

    function getField(obj, candidates){
        for (let i=0;i<candidates.length;i++){
            const c = candidates[i];
            if (obj && Object.prototype.hasOwnProperty.call(obj, c) && obj[c] != null) return obj[c];
        }
        return '';
    }

    function renderUsers(common, data){
        // flexible: accept raw array or paged object
        const items = extractItems(data) || [];
        common.innerHTML = '';

        const headerInfo = document.createElement('div');
        headerInfo.style.marginBottom = '8px';
        const totalCount = (data && (data.total || data.length || (Array.isArray(data) && data.length) || (data.totalCount))) || items.length;
        headerInfo.textContent = '총 ' + totalCount + '명';
        common.appendChild(headerInfo);

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.className = 'admin-users-table';

        const thStyle = 'border:1px solid #ddd;padding:8px;text-align:left;background:#f7f7f7;';
        const tdStyle = 'border:1px solid #eee;padding:8px;';

        const thead = document.createElement('thead');
        const hr = document.createElement('tr');
        // columns: 사용자키, 카카오ID, 닉네임, 가입일, 권한 (표시명은 한국어)
        ['사용자키','카카오ID','닉네임','가입일','권한'].forEach(h => {
            const th = document.createElement('th');
            th.setAttribute('style', thStyle);
            th.textContent = h;
            hr.appendChild(th);
        });
        thead.appendChild(hr);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        if (items.length === 0){
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.setAttribute('style', tdStyle + 'text-align:center;');
            td.colSpan = 5;
            td.textContent = '조회 결과가 없습니다.';
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            items.forEach(it => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'default';

                // Attempt to read fields in multiple possible naming conventions
                const userKey = getField(it, ['userKey','user_key','id','userId']);
                const kakaoApiId = getField(it, ['kakaoApiId','kakao_api_id','kakaoId']);
                const nickname = getField(it, ['nickname','nickName','nick','name']);
                const createdAt = getField(it, ['createdAt','created_at','created','createdDate']);
                const systemRole = getField(it, ['systemRole','system_role','role']);

                const c1 = document.createElement('td'); c1.setAttribute('style', tdStyle); c1.textContent = userKey != null ? userKey : '';
                tr.appendChild(c1);
                const c2 = document.createElement('td'); c2.setAttribute('style', tdStyle); c2.textContent = kakaoApiId != null ? kakaoApiId : '';
                tr.appendChild(c2);
                const c3 = document.createElement('td'); c3.setAttribute('style', tdStyle); c3.textContent = nickname != null ? nickname : '';
                tr.appendChild(c3);
                const c4 = document.createElement('td'); c4.setAttribute('style', tdStyle); c4.textContent = formatDateTime(createdAt);
                tr.appendChild(c4);
                const c5 = document.createElement('td'); c5.setAttribute('style', tdStyle); c5.textContent = systemRole != null ? systemRole : '';
                tr.appendChild(c5);

                tbody.appendChild(tr);
            });
        }
        table.appendChild(tbody);
        common.appendChild(table);
    }

    // Generic renderer used for groups, group requests, group joins
    function friendlyHeader(key){
        if (!key) return '';
        // common mappings for nicer display
        const map = {
            groupId: '그룹번호', group_no: '그룹번호', group: '그룹', name: '이름', title: '제목', description: '설명', requester: '요청자', owner: '주최자', createdAt: '생성일', created_at: '생성일', createdDate: '생성일', status: '상태', kakaoApiId: '카카오ID'
			,leaderUserKey: '리더번호', capacity: '수용인원', currentMemberCount: '현재인원', autoApprove: '자동승인', schedulePolicy: '일정 등록 권한 정책', groupRequestId: '그룹요청번호', requestNo: '요청번호', groupNo: '그룹번호', joinRequestNo: '가입요청번호'
        };
        if (map[key]) return map[key];
        // snake_case -> words
        let s = key.replace(/_/g, ' ');
        // camelCase -> insert spaces
        s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
        // capitalize first
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function isDateKey(key){
        return /date|created|time|At|at/i.test(key);
    }

    function renderGeneric(common, data, panelId){
        const items = extractItems(data) || [];
        common.innerHTML = '';

        const headerInfo = document.createElement('div');
        headerInfo.style.marginBottom = '8px';
        const totalCount = (data && (data.total || data.length || (Array.isArray(data) && data.length) || data.totalCount)) || items.length;
        headerInfo.textContent = '총 ' + totalCount + '건';
        common.appendChild(headerInfo);

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.className = 'admin-generic-table';

        const thStyle = 'border:1px solid #ddd;padding:8px;text-align:left;background:#f7f7f7;';
        const tdStyle = 'border:1px solid #eee;padding:8px;';

        const thead = document.createElement('thead');
        const hr = document.createElement('tr');

        // Determine columns: preferred order per panel, then keys from first item
        const preferred = {
			//리더명,상태 추가 필요
            groupsPanel: ['groupId','name','leaderUserKey','capacity','currentMemberCount','autoApprove','schedulePolicy','defSubCanMember','defSubCanNickname','groupRequestId','createdAt','updatedAt'],
            groupRequestsPanel: ['requestNo','group','groupNo','requester','createdAt','status'],
            groupJoinsPanel: ['joinRequestNo','group','groupNo','requester','createdAt','status']
        };

        let columns = [];
        if (items.length > 0){
            const firstKeys = Object.keys(items[0]).filter(k => {
                const v = items[0][k];
                return (['string','number','boolean'].includes(typeof v)) || isDateKey(k);
            });
			// ② 현재 패널(panelId)에 지정된 '선호하는 컬럼 순서'가 있는지 확인
			const pref = preferred[panelId] || [];
			pref.forEach(k => { 
	            // 내가 지정한 키(k)가 실제 백엔드 데이터(firstKeys)에 존재할 때만 컬럼에 추가!
	            if (firstKeys.indexOf(k) !== -1 && columns.indexOf(k) === -1) {
	                columns.push(k); 
	            } 
	        });
        }

        // If no items, show a default column
        if (columns.length === 0) columns = ['결과'];

        columns.forEach(col => {
            const th = document.createElement('th');
            th.setAttribute('style', thStyle);
            th.textContent = friendlyHeader(col);
            hr.appendChild(th);
        });
        thead.appendChild(hr);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        if (items.length === 0){
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.setAttribute('style', tdStyle + 'text-align:center;');
            td.colSpan = columns.length;
            td.textContent = '조회 결과가 없습니다.';
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            items.forEach(it => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'default';
                columns.forEach(col => {
                    const td = document.createElement('td');
                    td.setAttribute('style', tdStyle);
                    let val = '';
                    if (col === '결과'){
                        val = JSON.stringify(it);
                    } else {
                        if (Object.prototype.hasOwnProperty.call(it, col)) val = it[col];
                        else {
                            // try alternate naming: snake/camel
                            const alt = col.replace(/([A-Z])/g, '_$1').toLowerCase();
                            if (Object.prototype.hasOwnProperty.call(it, alt)) val = it[alt];
                        }
                    }
                    if (isDateKey(col) || isDateKey(String(val))) td.textContent = formatDateTime(val);
                    else td.textContent = (val != null ? String(val) : '');
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }
        table.appendChild(tbody);
        common.appendChild(table);
    }

    function renderGroupRequests(common, data) {
        const items = extractItems(data) || [];
        common.innerHTML = '';

        const total = (data && (data.totalCount || data.total)) || items.length;
        const header = document.createElement('div');
        header.style.marginBottom = '8px';
        header.textContent = '총 ' + total + '건';
        common.appendChild(header);

        const thStyle = 'border:1px solid #ddd;padding:8px;text-align:left;background:#f7f7f7;';
        const tdStyle = 'border:1px solid #eee;padding:8px;vertical-align:middle;';

        const table = document.createElement('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;';

        const statusLabel = {PENDING:'대기', APPROVED:'승인', REJECTED:'거부', CANCELLED:'취소'};

        const thead = document.createElement('thead');
        const hr = document.createElement('tr');
        ['신청번호', '모임명', '요청자(userKey)', '신청일시', '상태'].forEach(function(h) {
            const th = document.createElement('th');
            th.setAttribute('style', thStyle);
            th.textContent = h;
            hr.appendChild(th);
        });
        thead.appendChild(hr);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        if (items.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.setAttribute('style', tdStyle + 'text-align:center;');
            td.colSpan = 5;
            td.textContent = '조회 결과가 없습니다.';
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            items.forEach(function(it) {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.addEventListener('click', function() { openGroupRequestDetail(it); });
                [it.requestId, it.groupName, it.userKey, formatDateTime(it.requestedAt), statusLabel[it.status] || it.status].forEach(function(v) {
                    const td = document.createElement('td');
                    td.setAttribute('style', tdStyle);
                    td.textContent = v != null ? String(v) : '';
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }
        table.appendChild(tbody);
        common.appendChild(table);
    }

    async function approveGroupRequest(requestId, groupName) {
        if (!confirm('[' + groupName + '] 신청을 승인하시겠습니까?')) return;
        try {
            const res = await fetch('/admin/api/group-requests/' + requestId + '/approve', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                const groupId = data.groupId;
                if (confirm('승인되었습니다.\n생성된 그룹 페이지로 이동하시겠습니까? (/groups/' + groupId + ')')) {
                    window.open('/groups/' + groupId, '_blank');
                }
                window.dispatchEvent(new CustomEvent('admin:reload:panel', { detail: { panelId: 'groupRequestsPanel' } }));
            } else {
                const body = await res.json().catch(function() { return {}; });
                alert('승인 실패: ' + (body.error || res.status));
            }
        } catch(err) {
            alert('오류: ' + err.message);
        }
    }

    function openGroupRequestDetail(item) {
        const modal = document.getElementById('grDetailModal');
        if (!modal) return;
        const body = document.getElementById('grDetailBody');
        const actionsDiv = document.getElementById('grDetailActions');
        if (!body) return;

        const thStyle = 'text-align:left;padding:7px 14px 7px 0;color:#64748b;font-weight:600;white-space:nowrap;vertical-align:top;width:140px;border-bottom:1px solid #f1f5f9;';
        const tdStyle = 'padding:7px 0;word-break:break-word;border-bottom:1px solid #f1f5f9;';
        const statusLabelMap = {PENDING:'대기', APPROVED:'승인', REJECTED:'거부', CANCELLED:'취소'};

        const isPending  = item.status === 'PENDING';
        const isApproved = item.status === 'APPROVED';
        const isRejected = item.status === 'REJECTED';

        // 항상 표시
        const fields = [
            ['신청번호',        item.requestId],
            ['모임명',          item.groupName],
            ['요청자(userKey)', item.userKey],
            ['신청 설명',       item.description || '-'],
            ['신청일시',        formatDateTime(item.requestedAt)],
            ['상태',            statusLabelMap[item.status] || item.status || '-']
        ];

        // PENDING이 아닐 때만 처리 결과 표시
        if (!isPending) {
            fields.push(['처리자(userKey)',  item.updatedBy != null ? item.updatedBy : '-']);
            fields.push(['상태 변경일시',    item.statusUpdatedAt ? formatDateTime(item.statusUpdatedAt) : '-']);
        }
        if (isRejected) {
            fields.push(['거부 사유', item.rejectReason || '-']);
        }

        body.innerHTML = '';
        fields.forEach(function(pair) {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.setAttribute('style', thStyle);
            th.textContent = pair[0];
            const td = document.createElement('td');
            td.setAttribute('style', tdStyle);
            td.textContent = pair[1] != null ? String(pair[1]) : '-';
            tr.appendChild(th);
            tr.appendChild(td);
            body.appendChild(tr);
        });

        // 액션 영역 초기화
        if (actionsDiv) {
            actionsDiv.innerHTML = '';

            if (isPending) {
                actionsDiv.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:16px;';
                const approveBtn = document.createElement('button');
                approveBtn.textContent = '승인';
                approveBtn.setAttribute('style', 'padding:8px 20px;background:#1976d2;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.95rem;');
                approveBtn.onclick = function() { modal.style.display = 'none'; approveGroupRequest(item.requestId, item.groupName); };

                const rejectBtn = document.createElement('button');
                rejectBtn.textContent = '거부';
                rejectBtn.setAttribute('style', 'padding:8px 20px;background:#d32f2f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.95rem;');
                rejectBtn.onclick = function() { modal.style.display = 'none'; openRejectModal(item.requestId, item.groupName); };

                actionsDiv.appendChild(approveBtn);
                actionsDiv.appendChild(rejectBtn);
            } else if (isApproved && item.groupId) {
                actionsDiv.style.cssText = 'margin-top:14px;';
                const link = document.createElement('a');
                link.href = '/groups/' + item.groupId;
                link.target = '_blank';
                link.textContent = '모임 바로가기 →';
                link.setAttribute('style', 'color:#1976d2;text-decoration:none;font-weight:600;font-size:0.95rem;');
                actionsDiv.appendChild(link);
            } else {
                actionsDiv.style.cssText = '';
            }
        }

        modal.style.display = 'flex';
    }

    function openRejectModal(requestId, groupName) {
        const modal = document.getElementById('grRejectModal');
        if (!modal) return;
        modal.dataset.requestId = requestId;
        const titleEl = document.getElementById('grRejectModalTitle');
        if (titleEl) titleEl.textContent = '[' + groupName + '] 거부 사유 선택';
        const reasonSel = document.getElementById('grRejectReason');
        if (reasonSel) reasonSel.selectedIndex = 0;
        const customInput = document.getElementById('grRejectCustomInput');
        if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }
        modal.style.display = 'flex';
    }

    function onResults(e){
        const detail = e.detail || {};
        const panelId = detail.panelId;
        const data = detail.data;
        if (!panelId) return;
        const perId = 'admin-common-results-' + panelId;
        let common = document.getElementById(perId);
        if (!common) common = document.getElementById('admin-common-results');
        if (!common) return;

        switch(panelId){
            case 'usersPanel':
                renderUsers(common, data);
                break;
            case 'groupsPanel':
                renderGeneric(common, data, 'groupsPanel');
                break;
            case 'groupRequestsPanel':
                renderGroupRequests(common, data);
                break;
            case 'groupJoinsPanel':
                renderGeneric(common, data, 'groupJoinsPanel');
                break;
            default:
                // fallback to generic rendering
                renderGeneric(common, data, panelId);
        }

        // pagination: if we have a pagination wrapper in the DOM, render controls
        try{
            const pagingWrapperSelector = '.pagination-wrapper';
            let pagingWrapper = common.querySelector(pagingWrapperSelector);
            if (!pagingWrapper){
                // create one at the end of the common area
                pagingWrapper = document.createElement('div');
                pagingWrapper.className = 'pagination-wrapper';
                pagingWrapper.style.marginTop = '12px';
                common.appendChild(pagingWrapper);
            }
            // clear
            pagingWrapper.innerHTML = '';

            // determine pagingData shape
            let pagingData = null;
            if (data && (typeof data.totalCount !== 'undefined' || typeof data.total !== 'undefined' || data.items || data.content)){
                // normalize
                pagingData = {
                    totalCount: data.totalCount || data.total || (Array.isArray(data) ? data.length : 0),
                    currentPage: data.currentPage || data.page || 1,
                    size: data.size || data.pageSize || data.size || 25,
                    totalPages: data.totalPages || data.totalPages || Math.ceil((data.totalCount || data.total || (Array.isArray(data) ? data.length : 0)) / (data.size || 25)),
                    startPage: data.startPage || 1,
                    endPage: data.endPage || Math.min(5, Math.ceil((data.totalCount || data.total || (Array.isArray(data) ? data.length : 0)) / (data.size || 25))),
                    items: data.items || data.content || (Array.isArray(data) ? data : [])
                };
            }

            if (window.adminPagination && typeof window.adminPagination.renderPagination === 'function'){
                const onPageClick = function(p){
                    // dispatch a simple custom event to notify admin.js to load that page
                    const ev = new CustomEvent('admin:pagination:click', { detail: { panelId: panelId, page: p } });
                    window.dispatchEvent(ev);
                };
                const node = window.adminPagination.renderPagination(pagingData || {}, onPageClick);
                pagingWrapper.appendChild(node);
            }

        }catch(err){
            console.warn('Pagination render failed', err);
        }
    }

    window.addEventListener('admin:search:results', onResults);
})();