// js/core/state.js
// Estado central da aplicação (somente em memória — nada é persistido em disco
// ou em armazenamento do navegador, conforme requisito de "dados apenas durante a sessão").

const listeners = new Set();

const state = {
  aluno: {
    nome: '',
    curso: '',
    ra: '',
    semestre: '',
    telefone: '',
  },
  lancamentos: [], // { id, ano, categoriaId, descricao, data, quantidade?, horasCertificado?, observacoes, createdAt }
};

export function getState() {
  return state;
}

export function getAluno() {
  return state.aluno;
}

export function setAluno(data) {
  state.aluno = { ...state.aluno, ...data };
  emit();
}

export function getLancamentos() {
  return state.lancamentos;
}

export function addLancamento(lancamento) {
  state.lancamentos.push(lancamento);
  emit();
}

export function updateLancamento(id, data) {
  const idx = state.lancamentos.findIndex((l) => l.id === id);
  if (idx === -1) return false;
  state.lancamentos[idx] = { ...state.lancamentos[idx], ...data };
  emit();
  return true;
}

export function removeLancamento(id) {
  state.lancamentos = state.lancamentos.filter((l) => l.id !== id);
  emit();
}

export function getLancamentoById(id) {
  return state.lancamentos.find((l) => l.id === id) || null;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn(state));
}
