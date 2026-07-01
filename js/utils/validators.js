// js/utils/validators.js

export function required(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

export function isPositiveNumber(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0;
}

export function isValidYear(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 2000 && n <= 2100;
}

/**
 * Valida o formulário de lançamento de atividade.
 * @param {object} data
 * @param {object} category - definição da categoria (BAREMA item)
 * @returns {{valid: boolean, errors: Object<string,string>}}
 */
export function validateLancamento(data, category) {
  const errors = {};

  if (!required(data.ano) || !isValidYear(data.ano)) {
    errors.ano = 'Informe um ano válido.';
  }
  if (!required(data.categoriaId)) {
    errors.categoriaId = 'Selecione uma categoria.';
  }
  if (!required(data.descricao)) {
    errors.descricao = 'Descrição obrigatória.';
  }
  if (!required(data.data)) {
    errors.data = 'Informe a data do certificado.';
  }

  if (category) {
    if (category.type === 'per_event') {
      if (!required(data.quantidade) || !isPositiveNumber(data.quantidade)) {
        errors.quantidade = 'Informe uma quantidade válida (maior que zero).';
      }
    } else if (category.type === 'annual_limit') {
      if (!required(data.horasCertificado) || !isPositiveNumber(data.horasCertificado)) {
        errors.horasCertificado = 'Informe as horas do certificado (maior que zero).';
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateAluno(data) {
  const errors = {};
  if (!required(data.nome)) errors.nome = 'Informe o nome completo.';
  if (!required(data.curso)) errors.curso = 'Informe o curso.';
  if (!required(data.ra)) errors.ra = 'Informe o RA.';
  return { valid: Object.keys(errors).length === 0, errors };
}
