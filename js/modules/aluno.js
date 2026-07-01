// js/modules/aluno.js
import { getAluno, setAluno, subscribe } from '../core/state.js';
import { validateAluno } from '../utils/validators.js';
import { showToast } from '../ui/toast.js';
import { initials } from '../utils/formatters.js';
import { CURSOS, CURSO_OUTRO_VALUE } from '../data/cursos.js';

export function initAlunoModule() {
  const form = document.getElementById('form-aluno');
  if (!form) return;

  const nomeInput = form.querySelector('#aluno-nome');
  const cursoSelect = form.querySelector('#aluno-curso');
  const cursoOutroWrap = form.querySelector('#aluno-curso-outro-wrap');
  const cursoOutroInput = form.querySelector('#aluno-curso-outro');
  const raInput = form.querySelector('#aluno-ra');
  const semestreInput = form.querySelector('#aluno-semestre');
  const telefoneInput = form.querySelector('#aluno-telefone');

  // popula o select de cursos
  cursoSelect.innerHTML =
    '<option value="">Selecione o curso...</option>' +
    CURSOS.map((c) => `<option value="${c}">${c}</option>`).join('') +
    `<option value="${CURSO_OUTRO_VALUE}">Outro (não está na lista)</option>`;

  cursoSelect.addEventListener('change', () => {
    toggleCursoOutro(cursoSelect.value === CURSO_OUTRO_VALUE);
    if (cursoSelect.value === CURSO_OUTRO_VALUE) cursoOutroInput.focus();
  });

  function toggleCursoOutro(show) {
    cursoOutroWrap.classList.toggle('hidden', !show);
    if (!show) cursoOutroInput.value = '';
  }

  // popula com estado atual (caso já preenchido)
  const aluno = getAluno();
  nomeInput.value = aluno.nome || '';
  raInput.value = aluno.ra || '';
  semestreInput.value = aluno.semestre || '';
  telefoneInput.value = aluno.telefone || '';

  if (aluno.curso) {
    const isListado = CURSOS.includes(aluno.curso);
    if (isListado) {
      cursoSelect.value = aluno.curso;
      toggleCursoOutro(false);
    } else {
      cursoSelect.value = CURSO_OUTRO_VALUE;
      toggleCursoOutro(true);
      cursoOutroInput.value = aluno.curso;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(form);

    // resolve o valor final do curso (selecionado ou digitado em "Outro")
    let cursoFinal = '';
    let cursoErrorTarget = cursoSelect;
    let cursoErrorMsg = null;

    if (!cursoSelect.value) {
      cursoErrorMsg = 'Selecione um curso.';
    } else if (cursoSelect.value === CURSO_OUTRO_VALUE) {
      cursoFinal = cursoOutroInput.value.trim();
      cursoErrorTarget = cursoOutroInput;
      if (!cursoFinal) cursoErrorMsg = 'Informe o nome do curso.';
    } else {
      cursoFinal = cursoSelect.value;
    }

    const data = {
      nome: nomeInput.value.trim(),
      curso: cursoFinal,
      ra: raInput.value.trim(),
      semestre: semestreInput.value.trim(),
      telefone: telefoneInput.value.trim(),
    };

    const { valid, errors } = validateAluno(data);

    if (cursoErrorMsg) {
      applyFieldError(cursoErrorTarget, cursoErrorMsg);
    }
    applyErrors(form, errors, ['curso']); // curso é tratado separadamente acima

    if (!valid || cursoErrorMsg) {
      showToast('Verifique os campos obrigatórios.', 'warning');
      return;
    }

    setAluno(data);
    showToast('Dados do aluno salvos com sucesso.', 'success');
    updateTopbarStudent();
  });

  subscribe(updateTopbarStudent);
  updateTopbarStudent();
}

function clearErrors(form) {
  form.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error'));
}

function applyFieldError(input, message) {
  const field = input.closest('.field');
  if (!field) return;
  field.classList.add('has-error');
  const errorEl = field.querySelector('.field__error');
  if (errorEl) errorEl.textContent = message;
}

function applyErrors(form, errors, skipKeys = []) {
  Object.keys(errors).forEach((key) => {
    if (skipKeys.includes(key)) return;
    const input = form.querySelector(`#aluno-${key}`);
    if (input) applyFieldError(input, errors[key]);
  });
}

export function updateTopbarStudent() {
  const aluno = getAluno();
  const nameEl = document.getElementById('topbar-aluno-nome');
  const courseEl = document.getElementById('topbar-aluno-curso');
  const avatarEl = document.getElementById('student-card-avatar');
  const summaryNome = document.getElementById('summary-card-nome');
  const summaryMeta = document.getElementById('summary-card-meta');

  if (nameEl) nameEl.textContent = aluno.nome || 'Aluno não identificado';
  if (courseEl) courseEl.textContent = aluno.curso ? ` · ${aluno.curso}` : '';
  if (avatarEl) avatarEl.textContent = initials(aluno.nome);
  if (summaryNome) summaryNome.textContent = aluno.nome || 'Aluno não identificado';
  if (summaryMeta) {
    const parts = [aluno.curso, aluno.ra ? `RA ${aluno.ra}` : null, aluno.semestre ? `${aluno.semestre}º semestre` : null].filter(Boolean);
    summaryMeta.textContent = parts.join(' · ') || 'Preencha os dados do aluno na aba correspondente.';
  }
}
