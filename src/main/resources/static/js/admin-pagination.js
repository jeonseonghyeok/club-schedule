/* Common pagination renderer for admin pages
   Exports: renderPagination(pagingData, onPageClick)
   - pagingData: { totalCount, currentPage, size, totalPages, startPage, endPage, items }
   - onPageClick: function(page) called when a page button is clicked
   Natural Template mode: when location.protocol === 'file:' generates fake data for UI
*/
(function(global){
    function createButton(label, cls, disabled, handler){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pagination-btn ' + (cls || '');
        btn.textContent = label;
        if (disabled) btn.disabled = true;
        if (handler) btn.addEventListener('click', handler);
        return btn;
    }

    function renderPagination(pagingData, onPageClick){
        if (location.protocol === 'file:'){
            // fake data for local testing: ensure pagingData shape
            const total = 42;
            const size = pagingData && pagingData.size ? pagingData.size : 10;
            const current = pagingData && pagingData.currentPage ? pagingData.currentPage : 1;
            const totalPages = Math.max(1, Math.ceil(total/size));
            pagingData = {
                totalCount: total,
                currentPage: current,
                size: size,
                totalPages: totalPages,
                startPage: 1,
                endPage: Math.min(5, totalPages),
                items: []
            };
        }

        const container = document.createElement('div');
        container.className = 'admin-pagination';

        const prevDisabled = pagingData.currentPage <= 1;
        const nextDisabled = pagingData.currentPage >= pagingData.totalPages;

        const prev = createButton('이전', 'prev', prevDisabled, function(){ if (!prevDisabled && onPageClick) onPageClick(pagingData.currentPage - 1); });
        container.appendChild(prev);

        for (let p = pagingData.startPage; p <= pagingData.endPage; p++){
            const isActive = p === pagingData.currentPage;
            const btn = createButton(String(p), isActive ? 'active' : '', false, (function(page){ return function(){ if (onPageClick) onPageClick(page); }; })(p));
            if (isActive) btn.setAttribute('aria-current','page');
            container.appendChild(btn);
        }

        const next = createButton('다음', 'next', nextDisabled, function(){ if (!nextDisabled && onPageClick) onPageClick(pagingData.currentPage + 1); });
        container.appendChild(next);

        return container;
    }

    // attach to global
    global.adminPagination = global.adminPagination || {};
    global.adminPagination.renderPagination = renderPagination;

})(window);
