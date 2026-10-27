(() => {
  'use strict';
  const form = document.getElementById('filters');
  if (form) {
    const fields = Object.fromEntries(['search','priority','role','relationship'].map(id => [id, document.getElementById(id)]));
    const rows = [...document.querySelectorAll('.catalog-row')];
    const result = document.getElementById('result-count');
    function applyFilters() {
      const query = fields.search.value.trim().toLocaleLowerCase();
      const level = fields.priority.value, role = fields.role.value, relationship = fields.relationship.value;
      let total = 0, core = 0;
      for (const row of rows) {
        const roles = row.dataset.roles.split('|');
        const relation = row.dataset.relationship;
        const show = (!query || row.dataset.search.toLocaleLowerCase().includes(query)) &&
          (!level || row.dataset.priority === level) &&
          (!role || (role === 'both' ? roles.length === 2 : roles.includes(role))) &&
          (!relationship || (relationship === '同步联动' ? relation === '同步联动' : relationship === 'ordinary' ? roles.length === 2 && relation !== '同步联动' : roles.length === 1));
        row.hidden = !show;
        if (show) { total++; if (row.dataset.priority === '核心') core++; }
      }
      result.textContent = `显示 ${total} 项功能：${core} 核心，${total - core} 次要。`;
    }
    form.addEventListener('input', applyFilters);
    form.addEventListener('change', applyFilters);
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('reset', () => requestAnimationFrame(applyFilters));
    applyFilters();
  }
  const toggle = document.getElementById('nav-toggle'), sidebar = document.getElementById('sidebar'), scrim = document.getElementById('scrim');
  function setOpen(open, restoreFocus = false) {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    scrim.hidden = !open;
    if (open) sidebar.querySelector('a')?.focus();
    else if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
  scrim.addEventListener('click', () => setOpen(false, true));
  sidebar.addEventListener('click', event => { if (event.target.closest('a') && matchMedia('(max-width:760px)').matches) setOpen(false); });
  document.addEventListener('keydown', event => {
    if (!document.body.classList.contains('nav-open')) return;
    if (event.key === 'Escape') { setOpen(false, true); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...sidebar.querySelectorAll('a, summary')].filter(node => node.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
})();
