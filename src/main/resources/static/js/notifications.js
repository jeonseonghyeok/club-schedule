(function () {
    const bellBtn = document.getElementById('notifBellBtn');
    const dropdown = document.getElementById('notifDropdown');
    const badge = document.getElementById('notifBadge');
    const listEl = document.getElementById('notifList');
    const emptyEl = document.getElementById('notifEmpty');
    const markAllBtn = document.getElementById('notifMarkAllBtn');
    const tabs = dropdown ? Array.from(dropdown.querySelectorAll('.notif-tab')) : [];
    if (!bellBtn || !dropdown) return;

    const CATEGORY_ICON = { APPROVE: '✅', REJECT: '❌', NOTICE: '📢' };

    let items = [];
    let filter = 'ALL';

    function timeText(iso) {
        if (!iso) return '';
        try { return new Date(iso).toLocaleString(); } catch (e) { return ''; }
    }

    function setBadge(count) {
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : String(count);
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    async function refreshUnreadCount() {
        try {
            const res = await fetch('/api/notifications/unread-count', { credentials: 'same-origin' });
            if (!res.ok) return;
            const data = await res.json();
            setBadge(data.count || 0);
        } catch (e) { /* 무시 */ }
    }

    function render() {
        if (!listEl) return;
        const filtered = filter === 'UNREAD' ? items.filter(i => !i.isRead) : items;
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';
        filtered.forEach(item => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:8px;padding:8px 4px;border-radius:8px;cursor:pointer;' + (item.isRead ? '' : 'background:#eff6ff;');
            row.onmouseenter = () => { row.style.background = '#f8fafc'; };
            row.onmouseleave = () => { row.style.background = item.isRead ? '' : '#eff6ff'; };

            const icon = document.createElement('div');
            icon.style.cssText = 'font-size:16px;flex-shrink:0;';
            icon.textContent = CATEGORY_ICON[item.category] || '📢';

            const body = document.createElement('div');
            body.style.cssText = 'flex:1;min-width:0;';
            const titleLine = document.createElement('div');
            titleLine.style.cssText = 'font-weight:' + (item.isRead ? '500' : '700') + ';font-size:13px;color:#0f172a;';
            titleLine.textContent = item.title || '';
            const contentLine = document.createElement('div');
            contentLine.style.cssText = 'font-size:12px;color:#64748b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            contentLine.textContent = item.content || '';
            const timeLine = document.createElement('div');
            timeLine.style.cssText = 'font-size:11px;color:#94a3b8;margin-top:2px;';
            timeLine.textContent = timeText(item.createdAt);
            body.appendChild(titleLine); body.appendChild(contentLine); body.appendChild(timeLine);

            row.appendChild(icon); row.appendChild(body);
            row.addEventListener('click', () => onItemClick(item));
            listEl.appendChild(row);
        });
    }

    async function onItemClick(item) {
        if (!item.isRead) {
            try {
                await fetch('/api/notifications/' + item.notificationId + '/read', { method: 'PATCH', credentials: 'same-origin' });
                item.isRead = true;
                render();
                refreshUnreadCount();
            } catch (e) { /* 무시 */ }
        }
        closeDropdown();
        if (item.targetUrl) location.href = item.targetUrl;
    }

    async function loadList() {
        if (listEl) listEl.innerHTML = '<div style="padding:16px 0;text-align:center;color:#94a3b8;font-size:13px;">불러오는 중...</div>';
        try {
            const res = await fetch('/api/notifications?limit=20', { credentials: 'same-origin' });
            if (!res.ok) throw new Error('failed');
            items = await res.json();
            render();
        } catch (e) {
            if (listEl) listEl.innerHTML = '<div style="padding:16px 0;text-align:center;color:#94a3b8;font-size:13px;">알림을 불러오지 못했습니다.</div>';
        }
    }

    function openDropdown() {
        dropdown.style.display = 'block';
        loadList();
        document.addEventListener('click', outsideClickHandler);
    }
    function closeDropdown() {
        dropdown.style.display = 'none';
        document.removeEventListener('click', outsideClickHandler);
    }
    function outsideClickHandler(ev) {
        if (!dropdown.contains(ev.target) && ev.target !== bellBtn) closeDropdown();
    }

    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const opening = dropdown.style.display !== 'block';
        if (opening) openDropdown(); else closeDropdown();
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            tabs.forEach(t => { t.classList.remove('active'); t.style.background = '#f1f5f9'; t.style.color = '#0b1220'; });
            tab.classList.add('active'); tab.style.background = '#0f172a'; tab.style.color = '#fff';
            filter = tab.dataset.filter;
            render();
        });
    });

    if (markAllBtn) {
        markAllBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                await fetch('/api/notifications/read-all', { method: 'PATCH', credentials: 'same-origin' });
                items.forEach(i => { i.isRead = true; });
                render();
                refreshUnreadCount();
            } catch (e2) { /* 무시 */ }
        });
    }

    refreshUnreadCount();
})();
