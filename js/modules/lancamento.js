// js/modules/lancamento.js
import { BAREMA, getCategoryById } from '../data/barema.js';
import { addLancamento, updateLancamento, getLancamentoById } from '../core/state.js';
import { validateLancamento } from '../utils/validators.js';
import { generateId } from '../utils/id.js';
import { showToast } from '../ui/toast.js';
import { todayISO } from '../utils/formatters.js';

let editingId = null;

export function initLancamentoModule() {
  const form = document.getElementById('form-lancamento');
  if (!form) return;

  const categoriaSelect = form.querySelector('#lanc-categoria');
  const anoInput = form.querySelector('#lanc-ano');
  const descricaoInput = form.querySelector('#lanc-descricao');
  const dataInput = form.querySelector('#lanc-data');
  const observacoesInput = form.querySelector('#lanc-observacoes');
  const dynamicFieldWrap = form.querySelector('#lanc-campo-dinamico');
  const categoryHint = form.querySelector('#lanc-categoria-hint');
  const submitBtn = form.querySelector('#lanc-submit-btn');
  const cancelEditBtn = form.querySelector('#lanc-cancel-edit');

  // popula select de categorias
  categoriaSelect.innerHTML =
    '<option value="">Selecione a categoria...</option>' +
    BAREMA.map((c) => `<option value="${c.id}">${c.code}. ${c.label}</option>`).join('');

  dataInput.value = todayISO();
  anoInput.value = new Date().getFullYear();

  categoriaSelect.addEventListener('change', () => renderDynamicField());

  function renderDynamicField(prefillValue) {
    const category = getCategoryById(categoriaSelect.value);
    if (!category) {
      dynamicFieldWrap.innerHTML = '';
      categoryHint.textContent = '';
      return;
    }

    if (category.type === 'per_event') {
      dynamicFieldWrap.innerHTML = `
        <div class="field">
          <label for="lanc-quantidade">Quantidade de ${category.unitLabel}</label>
          <input type="number" id="lanc-quantidade" min="1" step="1" placeholder="Ex: 2" value="${prefillValue ?? ''}" />
          <span class="field__error"></span>
          <span class="field__hint">Cada ${category.unitLabel.replace(/\(ões\)|\(es\)/g, '')} vale ${category.valuePerUnit}h. Sem limite anual.</span>
        </div>`;
      categoryHint.textContent = `Cálculo: quantidade × ${category.valuePerUnit}h. Não há limite de horas por ano nesta categoria.`;
    } else {
      dynamicFieldWrap.innerHTML = `
        <div class="field">
          <label for="lanc-horas">Horas do certificado</label>
          <input type="number" id="lanc-horas" min="0.5" step="0.5" placeholder="Ex: 20" value="${prefillValue ?? ''}" />
          <span class="field__error"></span>
          <span class="field__hint">Limite institucional: ${category.limit}h por ano nesta categoria.</span>
        </div>`;
      categoryHint.textContent = `Limite anual desta categoria: ${category.limit}h. Horas que ultrapassarem o limite no ano serão contabilizadas como excedentes.`;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const category = getCategoryById(categoriaSelect.value);

    const data = {
      ano: Number(anoInput.value),
      categoriaId: categoriaSelect.value,
      descricao: descricaoInput.value.trim(),
      data: dataInput.value,
      observacoes: observacoesInput.value.trim(),
    };

    if (category?.type === 'per_event') {
      const qtyInput = document.getElementById('lanc-quantidade');
      data.quantidade = qtyInput ? Number(qtyInput.value) : null;
    } else if (category?.type === 'annual_limit') {
      const horasInput = document.getElementById('lanc-horas');
      data.horasCertificado = horasInput ? Number(horasInput.value) : null;
    }

    const { valid, errors } = validateLancamento(data, category);
    clearErrors(form);
    if (!valid) {
      applyErrors(form, errors);
      showToast('Verifique os campos destacados.', 'warning');
      return;
    }

    if (editingId) {
      updateLancamento(editingId, data);
      showToast('Lançamento atualizado com sucesso.', 'success');
      exitEditMode();
    } else {
      addLancamento({ id: generateId(), createdAt: Date.now(), ...data });
      showToast('Atividade lançada com sucesso.', 'success');
    }

    form.reset();
    dataInput.value = todayISO();
    anoInput.value = new Date().getFullYear();
    dynamicFieldWrap.innerHTML = '';
    categoryHint.textContent = '';
  });

  cancelEditBtn.addEventListener('click', () => {
    exitEditMode();
    form.reset();
    dataInput.value = todayISO();
    anoInput.value = new Date().getFullYear();
    dynamicFieldWrap.innerHTML = '';
    categoryHint.textContent = '';
  });

  function clearErrors(form) {
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error'));
  }

  function applyErrors(form, errors) {
    const map = { ano: 'lanc-ano', categoriaId: 'lanc-categoria', descricao: 'lanc-descricao', data: 'lanc-data', quantidade: 'lanc-quantidade', horasCertificado: 'lanc-horas' };
    Object.keys(errors).forEach((key) => {
      const inputId = map[key];
      const input = document.getElementById(inputId);
      if (input) {
        const field = input.closest('.field');
        field.classList.add('has-error');
        const errorEl = field.querySelector('.field__error');
        if (errorEl) errorEl.textContent = errors[key];
      }
    });
  }

  function exitEditMode() {
    editingId = null;
    submitBtn.textContent = 'Lançar atividade';
    cancelEditBtn.classList.add('hidden');
    document.getElementById('lancamento-form-title').textContent = 'Novo lançamento de atividade';
  }

  // API para o módulo de histórico iniciar edição
  window.__startEditLancamento = (id) => {
    const lanc = getLancamentoById(id);
    if (!lanc) return;
    editingId = id;

    categoriaSelect.value = lanc.categoriaId;
    anoInput.value = lanc.ano;
    descricaoInput.value = lanc.descricao;
    dataInput.value = lanc.data;
    observacoesInput.value = lanc.observacoes || '';

    const category = getCategoryById(lanc.categoriaId);
    const prefill = category?.type === 'per_event' ? lanc.quantidade : lanc.horasCertificado;
    renderDynamicField(prefill);

    submitBtn.textContent = 'Salvar alterações';
    cancelEditBtn.classList.remove('hidden');
    document.getElementById('lancamento-form-title').textContent = 'Editando lançamento';

    if (window.__appGoToView) window.__appGoToView('lancamento');
    document.getElementById('view-lancamento').scrollIntoView({ behavior: 'smooth' });
  };
}
