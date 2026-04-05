(function(){
    // Centralized admin actions for approve/reject across panels
    async function adminApprove(url, method='POST', successMsg='승인되었습니다.'){
        try{
            const resp = await fetch(url, {
                method: method,
                headers: addCsrf({}),
                credentials: 'same-origin'
            });
            await handleResponse(resp, successMsg);
        }catch(e){
            console.error('adminApprove error', e);
            showToast('오류 발생: ' + (e.message||e), 'error');
        }
    }

    async function adminReject(url, method='POST', requestId=null, successMsg='거부되었습니다.'){
        try{
            const reason = prompt('거부 사유를 입력하세요');
            if (reason === null) return;
            const bodyObj = requestId ? { requestId: requestId, rejectReason: reason } : { rejectReason: reason };
            const resp = await fetch(url, {
                method: method,
                headers: addCsrf({'Content-Type':'application/json'}),
                credentials: 'same-origin',
                body: JSON.stringify(bodyObj)
            });
            await handleResponse(resp, successMsg);
        }catch(e){
            console.error('adminReject error', e);
            showToast('오류 발생: ' + (e.message||e), 'error');
        }
    }

    // Utility to insert HTML and execute inline scripts inside it
    function insertHtmlWithScripts(container, html){
        container.innerHTML = html;
        // Execute scripts (inline) found in the inserted HTML
        const scripts = Array.from(container.querySelectorAll('script'));
        scripts.forEach(oldScript => {
            const script = document.createElement('script');
            if (oldScript.src) {
                script.src = oldScript.src;
            } else {
                script.textContent = oldScript.textContent;
            }
            // copy type if present
            if (oldScript.type) script.type = oldScript.type;
            // replace old with new to execute
            oldScript.parentNode.replaceChild(script, oldScript);
        });
    }

    // Tab switching logic: accessible, keyboard support, hash + localStorage persistence, lazy-load panels
    function initAdminTabs(){
        const tabList = document.querySelector('.tabs');
        if (!tabList) return;
        const tabs = Array.from(tabList.querySelectorAll('.tab'));
        const panels = Array.from(document.querySelectorAll('.panel'));

        async function lazyLoadPanelIfNeeded(panelEl, tabEl){
            if (!panelEl || !tabEl) return;
            try{
                if (panelEl.getAttribute('data-loaded') === 'true') return;
                const api = tabEl.getAttribute('data-api');
                const src = tabEl.getAttribute('data-src');
                // show a small loading state
                panelEl.innerHTML = '<div class="muted">로딩 중...</div>';
                if (api && window.renderGroupRequestsJson){
                    // fetch JSON API and render via client renderer
                    const url = api; // api should accept same query params when provided by client-side controls
                    const resp = await fetch(url, { credentials: 'same-origin' });
                    if (!resp.ok) { panelEl.innerHTML = '<div class="muted">내용을 불러오는데 실패했습니다.</div>'; return; }
                    const json = await resp.json();
                    try{ 
                        window.renderGroupRequestsJson(panelEl, json); 
                    }catch(e){ 
                        console.error('renderGroupRequestsJson error', e); 
                        panelEl.innerHTML = '<div class="muted">렌더러 오류</div>'; 
                    }
                    // ensure fragment behaviors (event handlers) are initialized after renderer writes HTML
                    try{ if (window.initFragment) window.initFragment(panelEl.id); }catch(e){ console.error('initFragment error', e); }
                    panelEl.setAttribute('data-loaded', 'true');
                    return;
                }
                if (src){
                    const resp = await fetch(src, { credentials: 'same-origin' });
                    if (!resp.ok) { panelEl.innerHTML = '<div class="muted">내용을 불러오는데 실패했습니다.</div>'; return; }
                    const text = await resp.text();
                    insertHtmlWithScripts(panelEl, text);
                    panelEl.setAttribute('data-loaded', 'true');
                    // call fragment initializer if exists (shared JS handles behavior)
                    try{ if (window.initFragment) window.initFragment(panelEl.id); }catch(e){ console.error('initFragment error', e); }
                    return;
                }
                // nothing to load
                panelEl.innerHTML = '';
             }catch(e){
                 console.error('lazyLoadPanel error', e);
                 if (panelEl) panelEl.innerHTML = '<div class="muted">오류가 발생했습니다.</div>';
             }
         }

        async function setActive(panelId, pushState=true){
            panels.forEach(p => p.classList.toggle('active', p.id === panelId));
            tabs.forEach((t,i) => {
                const isActive = t.getAttribute('data-panel-id') === panelId;
                t.classList.toggle('active', isActive);
                t.setAttribute('tabindex', isActive ? '0' : '-1');
                t.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
            // lazy load the active panel's content if necessary
            const activeTab = tabs.find(t => t.getAttribute('data-panel-id') === panelId);
            const activePanel = document.getElementById(panelId);
            if (activePanel && activeTab) await lazyLoadPanelIfNeeded(activePanel, activeTab);
            // sync hash and localStorage
            if (panelId && pushState){
                try{ location.hash = panelId; }catch(e){}
                try{ localStorage.setItem('adminActivePanel', panelId); }catch(e){}
            }
        }

        // click handlers
        tabs.forEach(t => {
            t.addEventListener('click', () => setActive(t.getAttribute('data-panel-id')));
            t.addEventListener('keydown', (ev) => {
                const idx = tabs.indexOf(t);
                if (ev.key === 'ArrowRight'){
                    const next = tabs[(idx+1)%tabs.length]; next.focus();
                }else if (ev.key === 'ArrowLeft'){
                    const prev = tabs[(idx-1+tabs.length)%tabs.length]; prev.focus();
                }else if (ev.key === 'Home'){
                    tabs[0].focus();
                }else if (ev.key === 'End'){
                    tabs[tabs.length-1].focus();
                }else if (ev.key === 'Enter' || ev.key === ' '){
                    ev.preventDefault(); setActive(t.getAttribute('data-panel-id'));
                }
            });
        });

        // initial selection: priority hash -> server initial -> stored -> first tab
        const hash = location.hash ? location.hash.substring(1) : null;
        const serverInitial = tabList.getAttribute('data-initial-panel') || null;
        let chosen = null;
        if (hash && document.getElementById(hash)) chosen = hash;
        else if (serverInitial && document.getElementById(serverInitial)) chosen = serverInitial;
        else {
            try{ const stored = localStorage.getItem('adminActivePanel'); if (stored && document.getElementById(stored)) chosen = stored; }catch(e){}
        }
        if (!chosen && tabs[0]) chosen = tabs[0].getAttribute('data-panel-id');
        if (chosen) setActive(chosen, true);

        window.addEventListener('hashchange', () => {
            const h = location.hash ? location.hash.substring(1) : null;
            if (h && document.getElementById(h)) setActive(h, false);
        });
    }

    // Initialize after DOMContentLoaded so panels inserted by Thymeleaf are present
    if (document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', initAdminTabs);
    }else{
        initAdminTabs();
    }

    // Export to global scope so templates can call these directly
    window.adminApprove = adminApprove;
    window.adminReject = adminReject;
})();