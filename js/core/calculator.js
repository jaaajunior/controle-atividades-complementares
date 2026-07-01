// js/core/calculator.js
// Motor de cálculo do barema. Funções puras: recebem lançamentos e devolvem
// estruturas calculadas, sem efeitos colaterais.

import { BAREMA, getCategoryById, DEFAULT_YEARS } from '../data/barema.js';

/**
 * Calcula horas informadas de um lançamento bruto, antes de aplicar limites.
 */
function horasInformadasDoLancamento(lanc, category) {
  if (!category) return 0;
  if (category.type === 'per_event') {
    return (Number(lanc.quantidade) || 0) * category.valuePerUnit;
  }
  return Number(lanc.horasCertificado) || 0;
}

/**
 * Retorna os lançamentos com campos calculados por linha:
 * horasInformadas, horasAproveitadas, horasExcedentes.
 * Para categorias "annual_limit", a alocação é cumulativa em ordem cronológica
 * (data do certificado, depois data de criação) dentro do par categoria+ano,
 * de forma que o limite anual seja respeitado de forma determinística.
 */
export function computeRowResults(lancamentos) {
  const byGroup = new Map(); // key: categoriaId|ano -> array of lancamentos (annual_limit only)

  lancamentos.forEach((lanc) => {
    const category = getCategoryById(lanc.categoriaId);
    if (category && category.type === 'annual_limit') {
      const key = `${lanc.categoriaId}|${lanc.ano}`;
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(lanc);
    }
  });

  // Ordena cada grupo cronologicamente e calcula alocação cumulativa
  const allocation = new Map(); // lancamento.id -> { aproveitadas, excedentes }
  byGroup.forEach((group, key) => {
    const [categoriaId] = key.split('|');
    const category = getCategoryById(categoriaId);
    const sorted = [...group].sort((a, b) => {
      const dataCompare = (a.data || '').localeCompare(b.data || '');
      if (dataCompare !== 0) return dataCompare;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    let acumulado = 0;
    sorted.forEach((lanc) => {
      const informadas = horasInformadasDoLancamento(lanc, category);
      const espacoRestante = Math.max(0, category.limit - acumulado);
      const aproveitadas = Math.min(informadas, espacoRestante);
      const excedentes = informadas - aproveitadas;
      acumulado += informadas;
      allocation.set(lanc.id, { aproveitadas, excedentes });
    });
  });

  return lancamentos.map((lanc) => {
    const category = getCategoryById(lanc.categoriaId);
    const horasInformadas = horasInformadasDoLancamento(lanc, category);

    let horasAproveitadas = horasInformadas;
    let horasExcedentes = 0;

    if (category && category.type === 'annual_limit') {
      const alloc = allocation.get(lanc.id);
      if (alloc) {
        horasAproveitadas = alloc.aproveitadas;
        horasExcedentes = alloc.excedentes;
      }
    }

    return {
      ...lanc,
      category,
      horasInformadas,
      horasAproveitadas,
      horasExcedentes,
    };
  });
}

/**
 * Agrupa resultados por categoria + ano (apenas categorias annual_limit fazem
 * sentido aqui, mas a função cobre todas para uso genérico).
 */
export function computeByCategoryYear(lancamentos) {
  const rows = computeRowResults(lancamentos);
  const map = new Map(); // key categoriaId|ano

  rows.forEach((row) => {
    const key = `${row.categoriaId}|${row.ano}`;
    if (!map.has(key)) {
      map.set(key, {
        categoriaId: row.categoriaId,
        category: row.category,
        ano: row.ano,
        horasInformadas: 0,
        horasAproveitadas: 0,
        horasExcedentes: 0,
        quantidadeLancamentos: 0,
      });
    }
    const entry = map.get(key);
    entry.horasInformadas += row.horasInformadas;
    entry.horasAproveitadas += row.horasAproveitadas;
    entry.horasExcedentes += row.horasExcedentes;
    entry.quantidadeLancamentos += 1;
  });

  return Array.from(map.values());
}

/**
 * Agrega por categoria (somando todos os anos).
 */
export function computeByCategory(lancamentos) {
  const rows = computeRowResults(lancamentos);
  const map = new Map();

  BAREMA.forEach((cat) => {
    map.set(cat.id, {
      category: cat,
      horasInformadas: 0,
      horasAproveitadas: 0,
      horasExcedentes: 0,
      quantidadeLancamentos: 0,
    });
  });

  rows.forEach((row) => {
    if (!row.category) return;
    const entry = map.get(row.categoriaId);
    entry.horasInformadas += row.horasInformadas;
    entry.horasAproveitadas += row.horasAproveitadas;
    entry.horasExcedentes += row.horasExcedentes;
    entry.quantidadeLancamentos += 1;
  });

  return Array.from(map.values());
}

/**
 * Agrega por ano (somando todas as categorias).
 */
export function computeByYear(lancamentos) {
  const rows = computeRowResults(lancamentos);
  const years = new Set(DEFAULT_YEARS);
  rows.forEach((r) => years.add(Number(r.ano)));

  const map = new Map();
  Array.from(years).sort((a, b) => a - b).forEach((ano) => {
    map.set(ano, {
      ano,
      horasInformadas: 0,
      horasAproveitadas: 0,
      horasExcedentes: 0,
      quantidadeLancamentos: 0,
    });
  });

  rows.forEach((row) => {
    const ano = Number(row.ano);
    if (!map.has(ano)) {
      map.set(ano, { ano, horasInformadas: 0, horasAproveitadas: 0, horasExcedentes: 0, quantidadeLancamentos: 0 });
    }
    const entry = map.get(ano);
    entry.horasInformadas += row.horasInformadas;
    entry.horasAproveitadas += row.horasAproveitadas;
    entry.horasExcedentes += row.horasExcedentes;
    entry.quantidadeLancamentos += 1;
  });

  return Array.from(map.values()).sort((a, b) => a.ano - b.ano);
}

/**
 * Totais gerais do dashboard.
 */
export function computeTotals(lancamentos) {
  const rows = computeRowResults(lancamentos);
  return rows.reduce(
    (acc, row) => {
      acc.totalInformado += row.horasInformadas;
      acc.totalAproveitado += row.horasAproveitadas;
      acc.totalExcedente += row.horasExcedentes;
      acc.totalCertificados += 1;
      return acc;
    },
    { totalInformado: 0, totalAproveitado: 0, totalExcedente: 0, totalCertificados: 0 }
  );
}

/**
 * Lista de anos distintos presentes nos lançamentos + anos padrão.
 */
export function getAllYears(lancamentos) {
  const years = new Set(DEFAULT_YEARS);
  lancamentos.forEach((l) => years.add(Number(l.ano)));
  return Array.from(years).sort((a, b) => a - b);
}
