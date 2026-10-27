/* 兼容总览重排前的书签，直接定位到拆分后的对应内容。 */
(() => {
  const targets = {
    mindmap: '学生端功能总框架.html#function-map',
    framework: '学生端功能总框架.html#menu-relations',
    shared: '学生端功能总框架.html#shared-modules',
    roles: '学生端功能总框架.html#teacher-student',
    pending: '学生端待补清单.html'
  };
  function followOldLink() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (Object.prototype.hasOwnProperty.call(targets, id)) location.replace(targets[id]);
  }
  window.addEventListener('hashchange', followOldLink);
  followOldLink();
})();
