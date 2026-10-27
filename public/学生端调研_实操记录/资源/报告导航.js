(() => {
  const side = document.getElementById('report-sidebar');
  const toggle = document.getElementById('nav-toggle');
  const scrim = document.getElementById('nav-scrim');
  const mobile = matchMedia('(max-width:760px)');
  if (!side || !toggle || !scrim) return;
  const setOpen = (open, restore = false) => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '关闭目录' : '打开目录';
    scrim.hidden = !open;
    side.inert = mobile.matches && !open;
    if (open) side.querySelector('a[aria-current="page"]')?.focus({preventScroll:true});
    else if (restore) toggle.focus({preventScroll:true});
  };
  toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
  scrim.addEventListener('click', () => setOpen(false, true));
  document.getElementById('nav-close')?.addEventListener('click', () => setOpen(false, true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) setOpen(false, true);
    if (event.key === 'Tab' && mobile.matches && document.body.classList.contains('nav-open')) {
      const nodes = Array.from(side.querySelectorAll('a,summary,button')).filter(n => n.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
    }
  });
  side.addEventListener('click', event => {
    if (event.target.closest('a') && mobile.matches) setOpen(false);
  });
  mobile.addEventListener('change', () => setOpen(false));
  setOpen(false);
  const links = Array.from(side.querySelectorAll('a[data-section]'));
  const targets = links.map(link => ({link,node:document.getElementById(link.dataset.section)})).filter(x => x.node);
  const tree = side.querySelector('.nav-tree');
  let lastSection = null;
  let queued = false;
  const mark = () => {
    queued = false;
    const eligible = targets.filter(x => x.node.getClientRects().length);
    let current = eligible[0];
    for (const x of eligible) if (x.node.getBoundingClientRect().top <= (mobile.matches ? 110 : 65)) current = x;
    for (const x of targets) {
      const active = x === current;
      x.link.classList.toggle('is-reading', active);
      if (active) x.link.setAttribute('aria-current','location');
      else x.link.removeAttribute('aria-current');
    }
    if (current && lastSection !== current.link.dataset.section && tree && !tree.matches(':hover') && !tree.contains(document.activeElement)) {
      const item = current.link.getBoundingClientRect(), area = tree.getBoundingClientRect();
      if (item.top < area.top + 15 || item.bottom > area.bottom - 15) tree.scrollTop += item.top - area.top - 80;
    }
    lastSection = current?.link.dataset.section;
  };
  addEventListener('scroll', () => {if (!queued) {queued=true;requestAnimationFrame(mark);}}, {passive:true});
  addEventListener('hashchange', () => requestAnimationFrame(mark));
  document.addEventListener('toggle', () => requestAnimationFrame(mark), true);
  mark();
  // 图片加载会改变章节位置，保持当前位置标识准确。
  document.querySelectorAll('main img').forEach(img => img.addEventListener('load', mark, {once:true}));
})();
