// js/modules/historico.js
import { BAREMA } from '../data/barema.js';
import { getLancamentos, removeLancamento, subscribe } from '../core/state.js';
import { computeRowResults, getAllYears } from '../core/calculator.js';
import { formatHoras, formatDate } from '../utils/formatters.js';
import { confirmDialog } from '../ui/modal.js';
import { showToast } from '../ui/toast.js';

let filters = { ano: '', categoriaId: '', termo: '' };

export function initHistoricoModule() {
  const tbody = document.getElementById('historico-tbody');
  const emptyState = document.getElementById('historico-empty');
  const tableWrap = document.getElementById('historico-table-wrap');
  const anoFilter = document.getElementById('filtro-ano');
  const categoriaFilter = document.getElementById('filtro-categoria');
  const termoFilter = document.getElementById('filtro-termo');

  categoriaFilter.innerHTML =
    '<option value="">Todas as categorias</option>' +
    BAREMA.map((c) => `<option value="${c.id}">${c.code}. ${c.label}</option>`).join('');

  function renderYearOptions() {
    const years = getAllYears(getLancamentos());
    const current = anoFilter.value;
    anoFilter.innerHTML =
      '<option value="">Todos os anos</option>' + years.map((y) => `<option value="${y}">${y}</option>`).join('');
    anoFilter.value = current;
  }

  anoFilter.addEventListener('change', () => {
    filters.ano = anoFilter.value;
    render();
  });
  categoriaFilter.addEventListener('change', () => {
    filters.categoriaId = categoriaFilter.value;
    render();
  });
  termoFilter.addEventListener('input', () => {
    filters.termo = termoFilter.value.trim().toLowerCase();
    render();
  });

  function render() {
    renderYearOptions();
    const rows = computeRowResults(getLancamentos())
      .filter((r) => (filters.ano ? String(r.ano) === String(filters.ano) : true))
      .filter((r) => (filters.categoriaId ? r.categoriaId === filters.categoriaId : true))
      .filter((r) =>
        filters.termo
          ? r.descricao.toLowerCase().includes(filters.termo) || (r.observacoes || '').toLowerCase().includes(filters.termo)
          : true
      )
      .sort((a, b) => (b.data || '').localeCompare(a.data || ''));

    if (rows.length === 0) {
      tableWrap.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    tableWrap.classList.remove('hidden');
    emptyState.classList.add('hidden');

    tbody.innerHTML = rows
      .map((r) => {
        const quantidadeCell = r.category?.type === 'per_event' ? `${r.quantidade} × ${r.category.valuePerUnit}h` : '—';
        const excedenteBadge =
          r.horasExcedentes > 0
            ? `<span class="badge badge-danger">${formatHoras(r.horasExcedentes)}</span>`
            : `<span class="badge badge-success">0h</span>`;
        return `
        <tr>
          <td>${r.ano}</td>
          <td>${r.category ? `${r.category.code}. ${r.category.label}` : '—'}</td>
          <td>${escapeHTML(r.descricao)}</td>
          <td>${formatDate(r.data)}</td>
          <td>${quantidadeCell}</td>
          <td>${formatHoras(r.horasInformadas)}</td>
          <td><span class="badge badge-neutral">${formatHoras(r.horasAproveitadas)}</span></td>
          <td>${excedenteBadge}</td>
          <td title="${escapeHTML(r.observacoes || '')}">${truncate(r.observacoes, 28)}</td>
          <td>
            <div class="table-actions">
              <button class="btn-icon" data-edit="${r.id}" title="Editar" aria-label="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-icon" data-delete="${r.id}" title="Excluir" aria-label="Excluir">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
      })
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => window.__startEditLancamento(btn.dataset.edit));
    });
    tbody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await confirmDialog({
          title: 'Excluir lançamento',
          message: 'Esta ação não pode ser desfeita. Deseja realmente excluir este lançamento?',
          confirmLabel: 'Excluir',
          danger: true,
        });
        if (ok) {
          removeLancamento(btn.dataset.delete);
          showToast('Lançamento excluído.', 'success');
        }
      });
    });
  }

  subscribe(render);
  render();
}

function truncate(text, max) {
  if (!text) return '—';
  return text.length > max ? escapeHTML(text.slice(0, max)) + '…' : escapeHTML(text);
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
