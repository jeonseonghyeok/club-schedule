(function(){
    // Initialize fragment behaviors after HTML is injected into the panel.
    // Exposed as window.initFragment(panelId)

    // small HTML escaper for safe insertion
    function escapeHtml(s){
        if (!s && s !== 0) return '';
        return String(s)
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#39;');
    }

    // Format a date/time string into Korean style: yyyy년MM월dd일 HH:mm
    function formatKoreanDate(s){
        if (!s && s !== 0) return '';
        try{
            // Accept either a Date-like value or ISO string
            const d = (s instanceof Date) ? s : new Date(String(s));
            if (Number.isNaN(d.getTime())) return escapeHtml(String(s));
            const y = d.getFullYear();
            const m = String(d.getMonth()+1).padStart(2,'0');
            const day = String(d.getDate()).padStart(2,'0');
            const hh = String(d.getHours()).padStart(2,'0');
            const mm = String(d.getMinutes()).padStart(2,'0');
            return y + '년' + m + '월' + day + '일 ' + hh + ':' + mm;
        }catch(e){
            return escapeHtml(String(s));
        }
    }

    // Modal show/hide helpers
    function showDetailModal(contentHtml){
        // remove existing
        const existing = document.getElementById('gr-detail-overlay');
        if (existing) existing.remove();
        const prevActive = document.activeElement;
        const overlay = document.createElement('div');
        overlay.id = 'gr-detail-overlay';
        overlay.setAttribute('role','dialog');
        overlay.setAttribute('aria-modal','true');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = 'rgba(0,0,0,0.45)';

        const box = document.createElement('div');
        box.style.background = '#fff';
        box.style.padding = '18px';
        box.style.borderRadius = '10px';
        box.style.maxWidth = '820px';
        box.style.width = '94%';
        box.style.boxShadow = '0 20px 60px rgba(2,6,23,0.2)';
        box.innerHTML = contentHtml;

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label','닫기');
        closeBtn.textContent = '✕';
        closeBtn.style.position = 'absolute';
        closeBtn.style.right = '16px';
        closeBtn.style.top = '12px';
        closeBtn.style.border = 'none';
        closeBtn.style.background = 'transparent';
        closeBtn.style.fontSize = '18px';
        closeBtn.style.cursor = 'pointer';

        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.appendChild(closeBtn);
        wrapper.appendChild(box);
        overlay.appendChild(wrapper);

        function removeModal(){
            window.removeEventListener('keydown', onKey);
            overlay.remove();
            try{ if (prevActive && typeof prevActive.focus === 'function') prevActive.focus(); }catch(e){}
        }
        function onKey(ev){
            if (ev.key === 'Escape') removeModal();
        }
        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) removeModal();
        });
        closeBtn.addEventListener('click', removeModal);
        window.addEventListener('keydown', onKey);

        document.body.appendChild(overlay);
        // focus the first focusable element inside the box for accessibility
        const focusable = box.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
        // wire internal close button inside content if present
        const internalClose = overlay.querySelector('#gr-detail-close');
        if (internalClose) internalClose.addEventListener('click', removeModal);
    }

    function buildDetailHtml(item){
        const parts = [];
        parts.push('<h2 style="margin-top:0">' + escapeHtml(item.groupName || '') + '</h2>');
        parts.push('<div style="color:#64748b;margin-bottom:12px;">요청자: ' + escapeHtml(item.userKey || '') + ' · 요청일: ' + escapeHtml(formatKoreanDate(item.requestedAt)) + '</div>');
        parts.push('<dl style="display:grid;grid-template-columns:120px 1fr;gap:8px 12px;">');
        parts.push('<dt class="muted">Request ID</dt><dd>' + escapeHtml(item.requestId) + '</dd>');
        parts.push('<dt class="muted">상태</dt><dd>' + escapeHtml(item.status || '') + '</dd>');
        parts.push('<dt class="muted">거부사유</dt><dd>' + escapeHtml(item.rejectReason || '') + '</dd>');
        parts.push('<dt class="muted">상세설명</dt><dd>' + (item.description ? '<pre style="white-space:pre-wrap;margin:0">' + escapeHtml(item.description) + '</pre>' : '') + '</dd>');
        parts.push('</dl>');
        parts.push('<div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">');
        if (item.status === 'PENDING'){
            parts.push('<button type="button" onclick="adminApprove(\'/group-requests/' + item.requestId + '/approve\', \'POST\', \'승인되었습니다.\')">승인</button>');
            parts.push('<button type="button" onclick="adminReject(\'/group-requests/' + item.requestId + '/reject\', \'POST\', ' + item.requestId + ', \'거부되었습니다.\')">거부</button>');
        }
        parts.push('<button type="button" id="gr-detail-close" style="background:#f1f5f9;padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0">닫기</button>');
        parts.push('</div>');
        return parts.join('\n');
    }

    function showGroupRequestDetail(panel, requestId){
        try{
            const map = panel._grItemsMap || {};
            const item = map[requestId] || (panel._grItems || []).find(i => String(i.requestId) === String(requestId));
            if (!item){
                if (window.showToast) window.showToast('상세 정보를 불러올 수 없습니다.','error');
                return;
            }
            const html = buildDetailHtml(item);
            showDetailModal(html);
        }catch(e){
            console.error('showGroupRequestDetail error', e);
            if (window.showToast) window.showToast('상세보기 중 오류가 발생했습니다.','error');
        }
    }

    function initGroupRequests(panel){
        if (!panel) return;
        // make initialization idempotent to avoid registering duplicate event handlers
        if (panel.dataset.grRequestsInit === 'true') return;
        try{
            const select = panel.querySelector('#gr-status');
            const input = panel.querySelector('#gr-groupName');
            const sizeSelect = panel.querySelector('#gr-size');
            const searchBtn = panel.querySelector('#gr-search');
            const prevBtn = panel.querySelector('#gr-prev');
            const nextBtn = panel.querySelector('#gr-next');
            const currentPageEl = panel.querySelector('#gr-current-page');
            const totalPagesEl = panel.querySelector('#gr-total-pages');

            // debounce helper for keyboard input
            function debounce(fn, wait){
                let t;
                return function(...args){
                    clearTimeout(t);
                    t = setTimeout(() => fn.apply(this,args), wait);
                };
            }

            function buildUrl(page){
                const s = select ? select.value : '';
                const g = input ? input.value.trim() : '';
                const sz = sizeSelect ? parseInt(sizeSelect.value || '10', 10) : 10;
                const params = new URLSearchParams();
                if (s) params.set('status', s);
                if (g) params.set('groupName', g);
                if (page && page > 1) params.set('page', page);
                if (sz && sz !== 10) params.set('size', sz);

                const base = '/admin/api/group-requests';
                const qs = params.toString();
                return qs ? base + '?' + qs : base;
            }

            // update UI to reflect loading state for controls inside panel
            function setLoadingState(isLoading){
                const btn = panel.querySelector('#gr-search');
                const inputs = panel.querySelectorAll('#gr-status, #gr-groupName, #gr-size, #gr-jump');
                if (btn){
                    if (isLoading){
                        btn.disabled = true;
                        btn.dataset.orig = btn.textContent;
                        btn.textContent = '조회…';
                    } else {
                        btn.disabled = false;
                        if (btn.dataset.orig) btn.textContent = btn.dataset.orig;
                    }
                }
                inputs.forEach(i => i && (i.disabled = isLoading));
            }

            function fetchIntoPanel(page){
                const url = buildUrl(page);
                // abort previous request for this panel if any
                try{
                    if (panel._grAbortController){
                        console.debug('aborting previous group-requests fetch for panel', panel.id);
                        panel._grAbortController.abort();
                    }
                }catch(e){/* ignore */}
                const controller = new AbortController();
                panel._grAbortController = controller;

                showPanelLoading(panel);
                setLoadingState(true);
                console.debug('fetching group-requests', url, 'panel', panel.id);
                fetch(url, { credentials: 'same-origin', signal: controller.signal }).then(resp => {
                    setLoadingState(false);
                    // clear controller after successful response read
                    panel._grAbortController = null;
                    if (!resp.ok) throw new Error('네트워크 오류');
                    return resp.json();
                }).then(json => {
                    // render JSON into panel
                    if (window.renderGroupRequestsJson){
                        window.renderGroupRequestsJson(panel, json);
                    } else {
                        panel.innerHTML = '<div class="muted">렌더러가 없습니다.</div>';
                        if (window.showToast) window.showToast('렌더러가 없습니다.','error');
                    }
                    if (window.initFragment) window.initFragment(panel.id);
                }).catch(e => {
                    // Ignore aborts (expected when a newer request is made)
                    if (e && e.name === 'AbortError') return;
                    console.error(e);
                    setLoadingState(false);
                    panel._grAbortController = null;
                    panel.innerHTML = '<div class="muted">내용을 불러오는데 실패했습니다.</div>';
                    if (window.showToast) window.showToast('내용을 불러오는데 실패했습니다.','error');
                });
            }
            // expose the fetch function on the panel so external callers can trigger it
            // (keeps compatibility with code that may call panel._fetchIntoPanel)
            try{ panel._fetchIntoPanel = fetchIntoPanel; }catch(e){}

            // fetchIntoPanel is deprecated in favor of the global fetchGroupRequests function
            // event handlers below will call window.fetchGroupRequests(panel.id, page)

            function showPanelLoading(p){
                // If controls exist, only replace the table area with a skeleton to avoid flushing search inputs
                const tableContainerId = 'gr-table';
                const existingControls = p.querySelector('#gr-controls');
                const tableHtml = (function(){
                    let html = '';
                    html += '<table border="1" class="admin-table">';
                    html += '<thead><tr><th>Request ID</th><th>User Key</th><th>Group Name</th><th>Requested At</th><th>Status</th><th>Actions</th></tr></thead>';
                    html += '<tbody>';
                    for (let i=0;i<6;i++){
                        html += '<tr>';
                        html += '<td class="muted">&nbsp;</td>';
                        html += '<td class="muted">&nbsp;</td>';
                        html += '<td class="muted">&nbsp;</td>';
                        html += '<td class="muted">&nbsp;</td>';
                        html += '<td class="muted">&nbsp;</td>';
                        html += '<td class="muted">&nbsp;</td>';
                        html += '</tr>';
                    }
                    html += '</tbody></table>';
                    return html;
                })();

                if (existingControls){
                    let tableContainer = p.querySelector('#' + tableContainerId);
                    if (!tableContainer){
                        tableContainer = document.createElement('div');
                        tableContainer.id = tableContainerId;
                        // insert after controls
                        existingControls.parentNode.insertBefore(tableContainer, existingControls.nextSibling);
                    }
                    tableContainer.innerHTML = tableHtml;
                    // also clear pagination region if present
                    const pag = p.querySelector('#gr-pagination');
                    if (pag) pag.innerHTML = '';
                } else {
                }
            }

            if (searchBtn){
                searchBtn.addEventListener('click', () => fetchIntoPanel(1));
            }
            if (input){
                // keep Enter behavior but debounce to avoid accidental double requests
                const debounced = debounce(() => fetchIntoPanel(1), 150);
                input.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter'){
                        ev.preventDefault();
                        debounced();
                    }
                });
            }
            if (sizeSelect){
                sizeSelect.addEventListener('change', () => fetchIntoPanel(1));
            }

            if (prevBtn){
                prevBtn.addEventListener('click', () => {
                    const cur = parseInt(currentPageEl ? currentPageEl.textContent || '1' : '1');
                    const target = Math.max(1, cur-1);
                    fetchIntoPanel(target);
                });
            }
            if (nextBtn){
                nextBtn.addEventListener('click', () => {
                    const cur = parseInt(currentPageEl ? currentPageEl.textContent || '1' : '1');
                    const tp = parseInt(totalPagesEl ? totalPagesEl.textContent || '1' : '1');
                    const target = Math.min(tp, cur+1);
                    fetchIntoPanel(target);
                });
            }

            // pagination buttons are created by renderGroupRequestsJson; don't duplicate them here

            // support a "jump to page" small control, if present in DOM
            const jumpInput = panel.querySelector('#gr-jump');
            const jumpBtn = panel.querySelector('#gr-jump-btn');
            if (jumpBtn && jumpInput && totalPagesEl){
                jumpBtn.addEventListener('click', () => {
                    const tp = parseInt(totalPagesEl.textContent || '1');
                    let v = parseInt((jumpInput.value||'').trim()||'1', 10);
                    if (isNaN(v) || v < 1) v = 1;
                    if (v > tp) v = tp;
                    fetchIntoPanel(v);
                });
            }

            // delegated click handler for group name links inside this panel
            panel.addEventListener('click', function(ev){
                const t = ev.target;
                if (t && t.classList && t.classList.contains('gr-name-link')){
                    const rid = t.getAttribute('data-request-id');
                    if (rid) showGroupRequestDetail(panel, rid);
                }
            });

            // mark as initialized to prevent duplicate event registration
            panel.dataset.grRequestsInit = 'true';

        }catch(e){
            console.error('initGroupRequests error', e);
            if (window.showToast) window.showToast('초기화 중 오류가 발생했습니다.','error');
        }
    }

    // renderer: take JSON and write markup into panel
    function renderGroupRequestsJson(panel, data){
        try{
            const items = data.items || [];
            // keep items accessible for detail lookup; map by requestId
            panel._grItems = items;
            panel._grItemsMap = {};
            items.forEach(i => { if (i && i.requestId != null) panel._grItemsMap[String(i.requestId)] = i; });
            const total = data.total || 0;
            const page = data.page || 1;
            const size = data.size || 10;
            const totalPages = Math.max(1, Math.ceil(total / size));
            const selectedStatus = data.selectedStatus || '';
            const selectedGroupName = data.selectedGroupName || '';

            // Controls area (preserve if already present)
            let controls = panel.querySelector('#gr-controls');
            if (!controls){
                let ch = '';
                ch += '<div id="gr-controls" style="display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap;">';
                ch += '<label for="gr-status">상태:</label>';
                ch += '<select id="gr-status">';
                ch += '<option value=""' + (selectedStatus === '' ? ' selected' : '') + '>전체</option>';
                ch += '<option value="PENDING"' + (selectedStatus === 'PENDING' ? ' selected' : '') + '>대기(PENDING)</option>';
                ch += '<option value="APPROVED"' + (selectedStatus === 'APPROVED' ? ' selected' : '') + '>승인(APPROVED)</option>';
                ch += '<option value="REJECTED"' + (selectedStatus === 'REJECTED' ? ' selected' : '') + '>거부(REJECTED)</option>';
                ch += '<option value="CANCELLED"' + (selectedStatus === 'CANCELLED' ? ' selected' : '') + '>취소(CANCELLED)</option>';
                ch += '</select>';
                ch += '<label for="gr-groupName">그룹명:</label>';
                ch += '<input id="gr-groupName" type="search" placeholder="그룹명으로 검색" value="' + (selectedGroupName ? selectedGroupName.replace(/"/g,'&quot;') : '') + '" />';
                ch += '<label for="gr-size">페이지당:</label>';
                ch += '<select id="gr-size">';
                ch += '<option value="10"' + (size === 10 ? ' selected' : '') + '>10</option>';
                ch += '<option value="25"' + (size === 25 ? ' selected' : '') + '>25</option>';
                ch += '<option value="50"' + (size === 50 ? ' selected' : '') + '>50</option>';
                ch += '</select>';
                ch += '<button type="button" id="gr-search">조회</button>';
                ch += '</div>';
                // insert controls at top
                panel.insertAdjacentHTML('afterbegin', ch);
                controls = panel.querySelector('#gr-controls');
            } else {
                // update values without replacing DOM to preserve focus/state
                const sel = controls.querySelector('#gr-status'); if (sel) sel.value = selectedStatus;
                const inp = controls.querySelector('#gr-groupName'); if (inp) inp.value = selectedGroupName;
                const sz = controls.querySelector('#gr-size'); if (sz) sz.value = size;
            }

            // Table area (replace contents)
            let tableContainer = panel.querySelector('#gr-table');
            let tableHtml = '';
            tableHtml += '<table border="1" class="admin-table">';
            tableHtml += '<thead><tr><th>Request ID</th><th>User Key</th><th>Group Name</th><th>Requested At</th><th>Status</th><th>Actions</th></tr></thead>';
            tableHtml += '<tbody>';
            if (items.length === 0){
                tableHtml += '<tr><td colspan="6">조회된 결과가 없습니다.</td></tr>';
            } else {
                items.forEach(r => {
                    tableHtml += '<tr>';
                    tableHtml += '<td>' + (r.requestId || '') + '</td>';
                    tableHtml += '<td>' + (r.userKey || '') + '</td>';
                    // render group name as a button to open detail modal
                    tableHtml += '<td><button type="button" class="gr-name-link" data-request-id="' + escapeHtml(r.requestId) + '" style="background:none;border:none;color:#2563eb;cursor:pointer;padding:0;font-weight:600">' + escapeHtml(r.groupName || '') + '</button></td>';
                    tableHtml += '<td>' + (r.requestedAt ? escapeHtml(formatKoreanDate(r.requestedAt)) : '') + '</td>';
                    tableHtml += '<td>' + (r.status || '') + '</td>';
                    tableHtml += '<td>';
                    if (r.status === 'PENDING'){
                        tableHtml += '<button type="button" onclick="adminApprove(\'/group-requests/' + r.requestId + '/approve\', \'POST\', \'승인되었습니다.\')">승인</button>';
                        tableHtml += '<button type="button" onclick="adminReject(\'/group-requests/' + r.requestId + '/reject\', \'POST\', ' + r.requestId + ', \'거부되었습니다.\')">거부</button>';
                    }
                    tableHtml += '</td>';
                    tableHtml += '</tr>';
                });
            }
            tableHtml += '</tbody></table>';

            if (!tableContainer){
                const div = document.createElement('div');
                div.id = 'gr-table';
                div.innerHTML = tableHtml;
                // append after controls
                controls.parentNode.insertBefore(div, controls.nextSibling);
                tableContainer = div;
            } else {
                tableContainer.innerHTML = tableHtml;
            }

            // Pagination area (replace or create)
            let pag = panel.querySelector('#gr-pagination');
            let pagHtml = '';
            pagHtml += '<div style="margin-top:12px; display:flex; align-items:center; gap:8px;">';
            pagHtml += '<div class="muted">총 <span id="gr-total-count">' + total + '</span>건</div>';
            pagHtml += '<div id="gr-pagination-controls" style="margin-left:auto; display:flex; gap:6px; align-items:center;">';
            pagHtml += '<span>페이지 <span id="gr-current-page">' + page + '</span> / <span id="gr-total-pages">' + totalPages + '</span></span>';
            // page buttons window
            pagHtml += '<span id="gr-page-buttons" style="display:flex; gap:6px; margin-left:8px;"></span>';
            pagHtml += '</div></div>';

            if (!pag){
                const divp = document.createElement('div');
                divp.id = 'gr-pagination';
                divp.innerHTML = pagHtml;
                // append after table
                const after = panel.querySelector('#gr-table');
                if (after) after.parentNode.insertBefore(divp, after.nextSibling);
                else panel.appendChild(divp);
                pag = divp;
            } else {
                pag.innerHTML = pagHtml;
            }

            // create page buttons inside pag
            const pageButtonsContainer = pag.querySelector('#gr-page-buttons');
            if (pageButtonsContainer){
                // create buttons window similar to previous logic
                const windowSize = 7;
                let start = Math.max(1, page - Math.floor(windowSize/2));
                let end = Math.min(totalPages, start + windowSize - 1);
                if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);

                if (start > 1){
                    const b = document.createElement('button'); b.type='button'; b.textContent='<<';
                    b.addEventListener('click', () => fetchIntoPanel(1));
                    pageButtonsContainer.appendChild(b);
                }

                for (let i=start;i<=end;i++){
                    const b = document.createElement('button'); b.type='button'; b.textContent = i;
                    if (i === page){ b.disabled = true; b.classList.add('active'); b.setAttribute('aria-current','page'); }
                    b.addEventListener('click', () => fetchIntoPanel(i));
                    pageButtonsContainer.appendChild(b);
                }

                if (end < totalPages){
                    const b = document.createElement('button'); b.type='button'; b.textContent='>>';
                    b.addEventListener('click', () => fetchIntoPanel(totalPages));
                    pageButtonsContainer.appendChild(b);
                }
            }

            // after DOM updates, ensure fragment behaviors are initialized (wires events if controls were newly created)
            // Note: don't call initFragment repeatedly here — callers (fetchIntoPanel / admin.js lazy loader) will call it.

        }catch(e){
            console.error('renderGroupRequestsJson error', e);
            panel.innerHTML = '<div class="muted">렌더링 오류</div>';
            if (window.showToast) window.showToast('렌더링 중 오류가 발생했습니다.','error');
        }
    }

    // general initializer called after fragment insertion
    function initFragment(panelId){
        try{
            const panel = document.getElementById(panelId);
            if (!panel) return;
            // detect fragment type by presence of known ids
            if (panel.querySelector('#gr-status') || panel.querySelector('#gr-groupName')){
                initGroupRequests(panel);
            }
            // future fragment types can be initialized here
        }catch(e){
            console.error('initFragment global error', e);
        }
    }

    window.initFragment = initFragment;
    window.renderGroupRequestsJson = renderGroupRequestsJson;

    // Global helper to trigger a group-requests fetch for a panel.
    // Usage: window.fetchGroupRequests(panelId, page)
    window.fetchGroupRequests = function(panelId, page){
        try{
            if (!panelId) return Promise.reject(new Error('panelId is required'));
            const panel = document.getElementById(panelId);
            if (!panel) return Promise.reject(new Error('panel not found: ' + panelId));
            // If panel exposes internal fetch, call it
            if (typeof panel._fetchIntoPanel === 'function'){
                try{ panel._fetchIntoPanel(page); return Promise.resolve(true); }catch(e){ return Promise.reject(e); }
            }
            // fallback: try to click the search button inside panel
            const btn = panel.querySelector('#gr-search');
            if (btn){ btn.click(); return Promise.resolve(true); }
            return Promise.reject(new Error('no fetch or search control available on panel ' + panelId));
        }catch(e){ return Promise.reject(e); }
    };

})();