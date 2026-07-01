// js/utils/formatters.js

export function formatHoras(value) {
  const n = Number(value) || 0;
  const rounded = Math.round(n * 100) / 100;
  return `${rounded.toLocaleString('pt-BR')}h`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  const [y, m, d] = isoString.split('-');
  if (!y || !m || !d) return isoString;
  return `${d}/${m}/${y}`;
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('pt-BR');
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
