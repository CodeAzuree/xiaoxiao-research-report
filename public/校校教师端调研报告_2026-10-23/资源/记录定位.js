/* Stable fragment navigation for local research reports. */
(() => {
  let userMoved = false;
  let generation = 0;
  const stop = () => { userMoved = true; };
  for (const name of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
    document.addEventListener(name, stop, {passive: true});
  }
  const target = () => {
    if (!location.hash || location.hash === '#') return null;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); }
    catch { return null; }
    return document.getElementById(id);
  };
  const reveal = node => {
    for (let item = node; item; item = item.parentElement) {
      if (item.tagName === 'DETAILS') item.open = true;
      if (item.hidden) item.hidden = false;
      item.classList.remove('hidden');
      if (item.style.display === 'none') item.style.removeProperty('display');
    }
  };
  const offset = node => {
    let space = Math.max(20, parseFloat(getComputedStyle(node).scrollMarginTop) || 0);
    for (const header of document.querySelectorAll('nav, .mobile-nav')) {
      if (header.closest('aside, .report-sidebar')) continue;
      const style = getComputedStyle(header);
      const box = header.getBoundingClientRect();
      if (['sticky', 'fixed'].includes(style.position) && box.height > 0 && box.top <= 1) {
        space = Math.max(space, box.bottom + 16);
      }
    }
    return space;
  };
  const align = (reset = false) => {
    if (reset) userMoved = false;
    const node = target();
    if (!node || userMoved) return;
    reveal(node);
    const run = ++generation;
    // The first frame opens collapsed ancestors; the second uses the new layout.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (run !== generation || userMoved || node !== target()) return;
      const top = Math.max(0, window.scrollY + node.getBoundingClientRect().top - offset(node));
      window.scrollTo({top, behavior: 'instant'});
    }));
  };
  addEventListener('hashchange', () => align(true));
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname ||
        url.search !== location.search || !url.hash || url.hash !== location.hash) return;
    event.preventDefault();
    align(true); // Clicking the same fragment does not dispatch hashchange.
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => align(), {once: true});
  } else align();
  addEventListener('load', () => align(), {once: true});
  document.fonts?.ready.then(() => align());
})();
