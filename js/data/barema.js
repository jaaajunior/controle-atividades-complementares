// js/data/barema.js
// Definição oficial e imutável do barema de Atividades Complementares da UNIFAN.
// type: "annual_limit"  -> usuário informa horas do certificado; soma por ano é limitada.
// type: "per_event"     -> usuário informa quantidade; horas = quantidade x valuePerUnit (sem limite).

export const BAREMA = [
  {
    id: 'congresso_apresentacao',
    code: 1,
    label: 'Apresentação de trabalhos em congresso',
    type: 'per_event',
    valuePerUnit: 20,
    unitLabel: 'apresentação(ões)',
  },
  {
    id: 'cursos_afins',
    code: 2,
    label: 'Cursos afins',
    type: 'annual_limit',
    limit: 70,
  },
  {
    id: 'estagio_extracurricular',
    code: 3,
    label: 'Estágios extracurriculares (com comprovação)',
    type: 'annual_limit',
    limit: 60,
  },
  {
    id: 'monitoria',
    code: 4,
    label: 'Monitoria',
    type: 'annual_limit',
    limit: 70,
  },
  {
    id: 'nepex',
    code: 5,
    label: 'Participação em grupos de estudo, pesquisa e extensão (NEPEX)',
    type: 'annual_limit',
    limit: 70,
  },
  {
    id: 'eventos_palestras_debates',
    code: 6,
    label: 'Participação em eventos científico-culturais (palestras e debates)',
    type: 'annual_limit',
    limit: 30,
  },
  {
    id: 'eventos_seminarios_congressos',
    code: 7,
    label: 'Participação em eventos científico-culturais (seminários, simpósios, congressos, encontros e similares)',
    type: 'annual_limit',
    limit: 40,
  },
  {
    id: 'projetos_comunitarios',
    code: 8,
    label: 'Participação em projetos comunitários',
    type: 'annual_limit',
    limit: 80,
  },
  {
    id: 'organizacao_eventos',
    code: 9,
    label: 'Organização de eventos científico-culturais (seminários, simpósios, congressos, encontros e similares)',
    type: 'per_event',
    valuePerUnit: 20,
    unitLabel: 'evento(s)',
  },
  {
    id: 'organizacao_palestras',
    code: 10,
    label: 'Organização de palestras e debates',
    type: 'per_event',
    valuePerUnit: 5,
    unitLabel: 'evento(s)',
  },
  {
    id: 'publicacao_artigo',
    code: 11,
    label: 'Publicação de artigo em revista indexada',
    type: 'per_event',
    valuePerUnit: 40,
    unitLabel: 'publicação(ões)',
  },
];

export function getCategoryById(id) {
  return BAREMA.find((c) => c.id === id) || null;
}

export const DEFAULT_YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027];
