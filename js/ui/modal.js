// js/ui/modal.js

let currentOverlay = null;

export function openModal({ title, bodyHTML, onMount, width = 640 }) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:${width}px;">
      <div class="modal__head">
        <h3>${title}</h3>
        <button class="modal__close" type="button" aria-label="Fechar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal__body">${bodyHTML}</div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  overlay.querySelector('.modal__close').addEventListener('click', closeModal);

  document.addEventListener('keydown', escListener);

  document.body.appendChild(overlay);
  currentOverlay = overlay;

  if (onMount) onMount(overlay.querySelector('.modal__body'), closeModal);

  return overlay;
}

function escListener(e) {
  if (e.key === 'Escape') closeModal();
}

export function closeModal() {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
    document.removeEventListener('keydown', escListener);
  }
}

export function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    openModal({
      title,
      width: 420,
      bodyHTML: `
        <p style="color:var(--color-text-secondary); margin-bottom: var(--space-6); line-height:1.6;">${message}</p>
        <div class="form-actions" style="margin-top:0; padding-top:0; border-top:none;">
          <button class="btn btn-ghost" data-action="cancel" type="button">Cancelar</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm" type="button">${confirmLabel}</button>
        </div>
      `,
      onMount: (body, close) => {
        body.querySelector('[data-action="cancel"]').addEventListener('click', () => {
          close();
          resolve(false);
        });
        body.querySelector('[data-action="confirm"]').addEventListener('click', () => {
          close();
          resolve(true);
        });
      },
    });
  });
}
