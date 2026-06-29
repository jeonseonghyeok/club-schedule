(function(){
    function selectPanelById(panelId, pushState=true){
        const tabs = Array.from(document.querySelectorAll('.tabs .tab'));
        const panels = Array.from(document.querySelectorAll('.panel'));
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });

        const tab = document.querySelector(`[data-panel-id="${panelId}"]`);
        const panel = document.getElementById(panelId);
        if (tab) tab.classList.add('active');
        if (panel){
            panel.style.display = 'block';
            panel.classList.add('active');

            // on first show, load data for the panel if configured
            if (!panel.dataset.loaded || panel.dataset.loaded === 'false'){
                if (panelConfigs[panelId]){
                    const cfg = panelConfigs[panelId];
                    loadPanelPage(panelId, {updateState: false});
                    panel.dataset.loaded = 'true';
                }
            }
        }

    }

    function handleTabClick(e){
        e.preventDefault();
        const tab = e.currentTarget;
        const panelId = tab.getAttribute('data-panel-id');
        if (panelId) selectPanelById(panelId);
    }

    // --- New: common search logic (paging removed) ---
    const panelConfigs = {
        usersPanel: {
            formSelector: '#users-search-form',
            pagingSelector: '.paging[data-panel-id="usersPanel"]',
            endpoint: '/admin/api/users'
        },
        groupsPanel: {
            formSelector: '#groups-search-form',
            pagingSelector: '.paging[data-panel-id="groupsPanel"]',
            endpoint: '/admin/api/groups'
        },
        groupRequestsPanel: {
            formSelector: '#gr-search-form',
            pagingSelector: '.paging[data-panel-id="groupRequestsPanel"]',
            endpoint: '/admin/api/group-requests'
        },
        groupJoinsPanel: {
            formSelector: '#gj-search-form',
            pagingSelector: '.paging[data-panel-id="groupJoinsPanel"]',
            endpoint: '/admin/api/group-joins'
        }
    };

    function buildParamsFromForm(form){
        const params = new URLSearchParams();

        // cond1: single select determines which field to search by
        const cond1Field = (form.querySelector('[name="cond1Field"]') || {}).value || '';
        if (cond1Field){
            if (cond1Field === 'role'){
                const roleEl = form.querySelector('[name="cond1Role"]');
                if (roleEl && roleEl.value) params.set('role', roleEl.value);
            } else {
                const valEl = form.querySelector('[name="cond1Value"]');
                if (valEl && valEl.value) params.set(cond1Field, valEl.value);
            }
        }

        // include date ranges and other named fields excluding cond1 helpers
        Array.from(form.elements).forEach(el => {
            if (!el.name) return;
            if (['cond1Field','cond1Value','cond1Role'].includes(el.name)) return;
            if ((el.type === 'date' || el.type === 'number' || el.type === 'search' || el.type === 'text' || el.tagName.toLowerCase() === 'select') && el.value !== ''){
                params.set(el.name, el.value);
            }
        });

        return params;
    }

    // Dispatch results for external renderer
    function dispatchResults(panelId, data){
        const perId = 'admin-common-results-' + panelId;
        let common = document.getElementById(perId);
        if (!common) common = document.getElementById('admin-common-results');
        if (common){
            common.dataset.panel = panelId;
            // clear previous content — renderer can refill
            common.innerHTML = '';
        }
        const ev = new CustomEvent('admin:search:results', { detail: { panelId: panelId, data: data } });
        window.dispatchEvent(ev);
    }

    async function loadPanelPage(panelId, options = {}){
        const cfg = panelConfigs[panelId];
        if (!cfg) return;
        const form = document.querySelector(cfg.formSelector);
        if (!form) return;
        const params = buildParamsFromForm(form);
        // honor explicit page/size passed via options
        if (options.page) params.set('page', String(options.page));
        if (options.size) params.set('size', String(options.size));
        const url = cfg.endpoint + (params.toString() ? ('?' + params.toString()) : '');
        try{
            const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
            if (!res.ok) throw new Error('서버 응답 오류: ' + res.status);
            const data = await res.json();
            dispatchResults(panelId, data);
            if (options.updateState){
                const state = { panel: panelId };
                const qs = new URLSearchParams();
                qs.set('panel', panelId);
                history.pushState(state, '', location.pathname + '?' + qs.toString());
            }
        }catch(err){
            const perId = 'admin-common-results-' + panelId;
            let common = document.getElementById(perId);
            if (!common) common = document.getElementById('admin-common-results');
            if (common) common.innerHTML = '<div class="error">오류: ' + (err.message || err) + '</div>';
            console.error(err);
        }
    }

    // paging handlers removed

    function attachFormHandlers(cfg, panelId){
        const form = document.querySelector(cfg.formSelector);
        if (!form) return;
        const searchBtn = form.querySelector('button[type="button"]');
        if (searchBtn) searchBtn.addEventListener('click', () => {
            loadPanelPage(panelId, {updateState:false});
        });
        form.addEventListener('submit', (e) => { e.preventDefault(); if (searchBtn) searchBtn.click(); });

        // attach cond1 toggle and placeholder updates if exists
        const fieldSel = form.querySelector('[name="cond1Field"]');
        if (fieldSel){
            const valueInput = form.querySelector('[name="cond1Value"]');
            const roleSelect = form.querySelector('[name="cond1Role"]');
            const toggle = () => {
                const v = fieldSel.value;
                // role -> show role select
                if (v === 'role'){
                    if (valueInput) valueInput.style.display = 'none';
                    if (roleSelect) roleSelect.style.display = '';
                } else {
                    if (valueInput) valueInput.style.display = '';
                    if (roleSelect) roleSelect.style.display = 'none';
                }
                // update placeholder for combined fields
                if (v === 'requester'){
                    if (valueInput) valueInput.placeholder = 'ID 또는 이름 입력하세요';
                } else if (v === 'group'){
                    if (valueInput) valueInput.placeholder = '그룹번호 또는 그룹명 입력하세요';
                } else if (v === 'groupNo'){
                    if (valueInput) valueInput.placeholder = '그룹번호 입력하세요';
                } else if (v === 'name'){
                    if (valueInput) valueInput.placeholder = '이름 입력하세요';
                } else {
                    if (valueInput) valueInput.placeholder = '값을 입력하세요';
                }
            };
            fieldSel.addEventListener('change', toggle);
            toggle();
        }
    }

    function init(){
        const tabList = document.querySelector('.tabs');
        if (!tabList) return;
        const tabs = Array.from(tabList.querySelectorAll('.tab'));
        tabs.forEach(t => {
            t.addEventListener('click', handleTabClick);
            t.addEventListener('keyup', function(e){ if (e.key === 'Enter' || e.key === ' ') { t.click(); } });
        });

        // wire form handlers for configured panels
        Object.keys(panelConfigs).forEach(pid => {
            attachFormHandlers(panelConfigs[pid], pid);
        });

        // Determine initial panel from querystring (?panel=...) or default to the first tab
        const qs = new URLSearchParams(location.search);
        const panelFromQs = qs.get('panel');
        const initial = panelFromQs || (tabs[0] && tabs[0].getAttribute('data-panel-id'));
        if (initial) selectPanelById(initial);

        // handle back/forward
        window.addEventListener('popstate', function(evt){
            const panelId = evt.state?.panel || new URLSearchParams(location.search).get('panel');
            if (panelId) selectPanelById(panelId);
        });

        // pagination click events
        window.addEventListener('admin:pagination:click', function(ev){
            const d = ev.detail || {};
            const p = d.page || 1;
            const panelId = d.panelId;
            if (panelId) loadPanelPage(panelId, { page: p, updateState: false });
        });

        // Ensure panels have a default display style when server-side rendering applies
        document.querySelectorAll('.panel').forEach(p => {
            if (!p.style.display) p.style.display = 'none';
        });

        // 승인/거부 후 패널 재조회
        window.addEventListener('admin:reload:panel', function(ev) {
            const panelId = ev.detail && ev.detail.panelId;
            if (panelId) loadPanelPage(panelId, { updateState: false });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();