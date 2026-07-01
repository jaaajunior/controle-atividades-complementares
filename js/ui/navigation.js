// js/ui/navigation.js

const viewChangeListeners = new Set();

export function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');
  const menuToggle = document.querySelector('.topbar__menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.view;
      goToView(target);
      if (sidebar.classList.contains('is-open')) {
        sidebar.classList.remove('is-open');
        backdrop.classList.remove('is-open');
      }
    });
  });

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('is-open');
      backdrop.classList.toggle('is-open');
    });
  }
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-open');
    });
  }

  function goToView(viewId) {
    views.forEach((v) => v.classList.toggle('is-active', v.id === `view-${viewId}`));
    navItems.forEach((b) => b.classList.toggle('is-active', b.dataset.view === viewId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    viewChangeListeners.forEach((fn) => fn(viewId));
  }

  // expõe globalmente para outros módulos navegarem programaticamente
  window.__appGoToView = goToView;
}

export function onViewChange(fn) {
  viewChangeListeners.add(fn);
}

export function navigateTo(viewId) {
  if (window.__appGoToView) window.__appGoToView(viewId);
}
