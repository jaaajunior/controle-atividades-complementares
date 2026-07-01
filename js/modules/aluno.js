// js/modules/aluno.js
import { getAluno, setAluno, subscribe } from '../core/state.js';
import { validateAluno } from '../utils/validators.js';
import { showToast } from '../ui/toast.js';
import { initials } from '../utils/formatters.js';

export function initAlunoModule() {
  const form = document.getElementById('form-aluno');
  if (!form) return;

  const fields = {
    nome: form.querySelector('#aluno-nome'),
    curso: form.querySelector('#aluno-curso'),
    ra: form.querySelector('#aluno-ra'),
    semestre: form.querySelector('#aluno-semestre'),
    telefone: form.querySelector('#aluno-telefone'),
  };

  // popula com estado atual (caso já preenchido)
  const aluno = getAluno();
  Object.keys(fields).forEach((key) => {
    if (fields[key]) fields[key].value = aluno[key] || '';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      nome: fields.nome.value.trim(),
      curso: fields.curso.value.trim(),
      ra: fields.ra.value.trim(),
      semestre: fields.semestre.value.trim(),
      telefone: fields.telefone.value.trim(),
    };

    const { valid, errors } = validateAluno(data);
    clearErrors(form);
    if (!valid) {
      applyErrors(form, errors);
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

function applyErrors(form, errors) {
  Object.keys(errors).forEach((key) => {
    const input = form.querySelector(`#aluno-${key}`);
    if (input) {
      const field = input.closest('.field');
      field.classList.add('has-error');
      const errorEl = field.querySelector('.field__error');
      if (errorEl) errorEl.textContent = errors[key];
    }
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
