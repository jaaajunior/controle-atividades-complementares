// js/modules/dashboard.js
import { getLancamentos, subscribe } from '../core/state.js';
import { computeTotals, computeByCategory, computeByYear } from '../core/calculator.js';
import { formatHoras, formatNumber } from '../utils/formatters.js';

let categoryChart = null;
let yearChart = null;

const PALETTE = [
  '#0f3460', '#1a5fa8', '#2477c9', '#4a9bdb', '#7fbce8',
  '#f5a623', '#1e9e6b', '#d64550', '#5a6b7d', '#0a2647', '#8b9bab',
];

export function initDashboardModule() {
  subscribe(render);
  render();
}

function render() {
  const lancamentos = getLancamentos();
  renderStatCards(lancamentos);
  renderCategorySummary(lancamentos);
  renderAnnualProgress(lancamentos);
  renderCategoryChart(lancamentos);
  renderYearChart(lancamentos);
}

function renderStatCards(lancamentos) {
  const totals = computeTotals(lancamentos);
  setText('stat-aproveitadas', formatHoras(totals.totalAproveitado));
  setText('stat-excedentes', formatHoras(totals.totalExcedente));
  setText('stat-informado', formatHoras(totals.totalInformado));
  setText('stat-certificados', formatNumber(totals.totalCertificados));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderCategorySummary(lancamentos) {
  const wrap = document.getElementById('dashboard-categoria-summary');
  if (!wrap) return;
  const data = computeByCategory(lancamentos).filter((d) => d.quantidadeLancamentos > 0);

  if (data.length === 0) {
    wrap.innerHTML = emptyMini('Nenhuma atividade lançada ainda.');
    return;
  }

  wrap.innerHTML = data
    .sort((a, b) => b.horasAproveitadas - a.horasAproveitadas)
    .map(
      (d) => `
      <div class="progress-item">
        <div class="progress-item__head">
          <strong>${d.category.code}. ${d.category.label}</strong>
          <span>${formatHoras(d.horasAproveitadas)}${d.horasExcedentes > 0 ? ` <span style="color:var(--color-danger)">(+${formatHoras(d.horasExcedentes)} exced.)</span>` : ''}</span>
        </div>
      </div>`
    )
    .join('');
}

function renderAnnualProgress(lancamentos) {
  const wrap = document.getElementById('dashboard-progress-anual');
  if (!wrap) return;

  const byCategory = computeByCategory(lancamentos).filter(
    (d) => d.category.type === 'annual_limit' && d.quantidadeLancamentos > 0
  );

  if (byCategory.length === 0) {
    wrap.innerHTML = emptyMini('Nenhuma categoria com limite anual lançada ainda.');
    return;
  }

  wrap.innerHTML = byCategory
    .map((d) => {
      const pct = Math.min(100, (d.horasAproveitadas / d.category.limit) * 100);
      const fillClass = d.horasExcedentes > 0 ? 'is-full' : pct >= 80 ? 'is-warning' : '';
      return `
      <div class="progress-item">
        <div class="progress-item__head">
          <strong>${d.category.label}</strong>
          <span>${formatHoras(d.horasAproveitadas)} / ${d.category.limit}h</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
        </div>
      </div>`;
    })
    .join('');
}

function renderCategoryChart(lancamentos) {
  const canvas = document.getElementById('chart-categoria');
  if (!canvas || typeof Chart === 'undefined') return;

  const data = computeByCategory(lancamentos).filter((d) => d.quantidadeLancamentos > 0);

  if (categoryChart) categoryChart.destroy();

  if (data.length === 0) {
    return;
  }

  categoryChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: data.map((d) => `${d.category.code}. ${d.category.label}`),
      datasets: [
        {
          data: data.map((d) => d.horasAproveitadas),
          backgroundColor: data.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${formatHoras(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

function renderYearChart(lancamentos) {
  const canvas = document.getElementById('chart-ano');
  if (!canvas || typeof Chart === 'undefined') return;

  const data = computeByYear(lancamentos).filter((d) => d.quantidadeLancamentos > 0 || d.horasInformadas > 0);

  if (yearChart) yearChart.destroy();

  if (data.length === 0) return;

  yearChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.map((d) => d.ano),
      datasets: [
        {
          label: 'Aproveitadas',
          data: data.map((d) => d.horasAproveitadas),
          backgroundColor: '#1a5fa8',
          borderRadius: 4,
        },
        {
          label: 'Excedentes',
          data: data.map((d) => d.horasExcedentes),
          backgroundColor: '#f5a623',
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true },
      },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatHoras(ctx.parsed.y)}`,
          },
        },
      },
    },
  });
}

function emptyMini(text) {
  return `<p style="color:var(--color-text-muted); font-size: var(--fs-sm); padding: var(--space-4) 0;">${text}</p>`;
}
