// js/modules/resumo.js
import { getLancamentos, subscribe } from '../core/state.js';
import { computeByYear, computeByCategory, computeTotals } from '../core/calculator.js';
import { formatHoras } from '../utils/formatters.js';
import { DEFAULT_YEARS } from '../data/barema.js';

let selectedYear = 'todos';

export function initResumoModule() {
  const tabsWrap = document.getElementById('resumo-year-tabs');
  if (!tabsWrap) return;

  subscribe(render);
  render();

  tabsWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.year-tab');
    if (!btn) return;
    selectedYear = btn.dataset.year;
    render();
  });
}

function render() {
  const lancamentos = getLancamentos();
  renderYearTabs(lancamentos);
  renderTotalBanner(lancamentos);
  renderByYearTable(lancamentos);
  renderByCategoryTable(lancamentos);
}

function renderYearTabs(lancamentos) {
  const wrap = document.getElementById('resumo-year-tabs');
  const byYear = computeByYear(lancamentos);
  const years = Array.from(new Set([...DEFAULT_YEARS, ...byYear.map((y) => y.ano)])).sort((a, b) => a - b);

  wrap.innerHTML =
    `<button class="year-tab ${selectedYear === 'todos' ? 'is-active' : ''}" data-year="todos">Todos os anos</button>` +
    years
      .map((y) => `<button class="year-tab ${String(selectedYear) === String(y) ? 'is-active' : ''}" data-year="${y}">${y}</button>`)
      .join('');
}

function renderTotalBanner(lancamentos) {
  const filtered = selectedYear === 'todos' ? lancamentos : lancamentos.filter((l) => String(l.ano) === String(selectedYear));
  const totals = computeTotals(filtered);

  document.getElementById('resumo-total-value').textContent = formatHoras(totals.totalAproveitado);
  document.getElementById('resumo-total-label').textContent =
    selectedYear === 'todos'
      ? `Total geral de horas aproveitadas (${totals.totalCertificados} certificado${totals.totalCertificados === 1 ? '' : 's'})`
      : `Total de horas aproveitadas em ${selectedYear} (${totals.totalCertificados} certificado${totals.totalCertificados === 1 ? '' : 's'})`;

  document.getElementById('resumo-total-excedente').textContent = `Excedentes: ${formatHoras(totals.totalExcedente)}`;
}

function renderByYearTable(lancamentos) {
  const tbody = document.getElementById('resumo-ano-tbody');
  if (!tbody) return;
  const byYear = computeByYear(lancamentos);

  tbody.innerHTML = byYear
    .map(
      (y) => `
      <tr>
        <td><strong>${y.ano}</strong></td>
        <td>${y.quantidadeLancamentos}</td>
        <td>${formatHoras(y.horasInformadas)}</td>
        <td><span class="badge badge-neutral">${formatHoras(y.horasAproveitadas)}</span></td>
        <td>${y.horasExcedentes > 0 ? `<span class="badge badge-danger">${formatHoras(y.horasExcedentes)}</span>` : '<span class="badge badge-success">0h</span>'}</td>
      </tr>`
    )
    .join('');
}

function renderByCategoryTable(lancamentos) {
  const tbody = document.getElementById('resumo-categoria-tbody');
  if (!tbody) return;
  const filtered = selectedYear === 'todos' ? lancamentos : lancamentos.filter((l) => String(l.ano) === String(selectedYear));
  const byCategory = computeByCategory(filtered);

  tbody.innerHTML = byCategory
    .map((c) => {
      const limitText = c.category.type === 'annual_limit' ? `${c.category.limit}h/ano` : `${c.category.valuePerUnit}h/${c.category.unitLabel.split(' ')[0]}`;
      return `
      <tr>
        <td>${c.category.code}</td>
        <td>${c.category.label}</td>
        <td><span class="category-type-tag">${limitText}</span></td>
        <td>${c.quantidadeLancamentos}</td>
        <td><span class="badge badge-neutral">${formatHoras(c.horasAproveitadas)}</span></td>
        <td>${c.horasExcedentes > 0 ? `<span class="badge badge-danger">${formatHoras(c.horasExcedentes)}</span>` : '<span class="badge badge-success">0h</span>'}</td>
      </tr>`;
    })
    .join('');
}
