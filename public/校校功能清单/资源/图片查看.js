(() => {
  'use strict';
  const anchors = [...document.querySelectorAll('a[data-feature-screenshot], a[data-screenshot-gallery]')];
  if (!anchors.length) return;
  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return;
  dialog.className = 'screenshot-viewer';
  dialog.setAttribute('aria-labelledby', 'screenshot-viewer-title');
  const head = document.createElement('div'); head.className = 'screenshot-viewer-head';
  const title = document.createElement('h2'); title.id = 'screenshot-viewer-title';
  const close = document.createElement('button'); close.type = 'button'; close.textContent = '关闭';
  head.append(title, close);
  const canvas = document.createElement('div'); canvas.className = 'screenshot-viewer-canvas';
  const img = document.createElement('img'); canvas.append(img);
  const caption = document.createElement('p'); caption.className = 'screenshot-viewer-caption';
  const controls = document.createElement('div'); controls.className = 'screenshot-viewer-controls';
  const pager = document.createElement('div');
  const previous = document.createElement('button'); previous.type = 'button'; previous.textContent = '上一张';
  const counter = document.createElement('span'); counter.className = 'screenshot-viewer-counter'; counter.setAttribute('aria-live', 'polite');
  const next = document.createElement('button'); next.type = 'button'; next.textContent = '下一张';
  pager.append(previous, counter, next);
  const original = document.createElement('a'); original.target = '_blank'; original.rel = 'noopener'; original.textContent = '在新标签查看原图';
  controls.append(pager, original); dialog.append(head, canvas, caption, controls); document.body.append(dialog);
  let group = [], position = 0, opener = null;
  function show(index) {
    position = Math.max(0, Math.min(index, group.length - 1));
    const anchor = group[position];
    title.textContent = anchor.dataset.title;
    caption.textContent = anchor.dataset.caption;
    img.src = anchor.href; img.alt = anchor.dataset.title + '。' + anchor.dataset.caption;
    original.href = anchor.href;
    counter.textContent = `${position + 1} / ${group.length}`;
    previous.disabled = position === 0; next.disabled = position === group.length - 1;
  }
  for (const anchor of anchors) anchor.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); opener = anchor;
    const galleryKey = item => item.hasAttribute('data-feature-screenshot')
      ? 'feature:' + item.dataset.featureScreenshot : 'gallery:' + item.dataset.screenshotGallery;
    group = anchors.filter(item => galleryKey(item) === galleryKey(anchor));
    show(group.indexOf(anchor)); dialog.showModal(); close.focus();
  });
  close.addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => show(position - 1)); next.addEventListener('click', () => show(position + 1));
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(position - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(position + 1); }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { img.removeAttribute('src'); if (opener?.isConnected) opener.focus(); });
})();
