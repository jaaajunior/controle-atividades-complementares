// js/modules/relatorios.js
import { getAluno, getLancamentos } from '../core/state.js';
import { computeRowResults, computeByYear, computeByCategory, computeTotals } from '../core/calculator.js';
import { formatHoras, formatDate, todayISO } from '../utils/formatters.js';
import { showToast } from '../ui/toast.js';

let logoDataUrlCache = null;

/**
 * Carrega a logo institucional como Data URL para embutir no PDF.
 * Resultado é cacheado para evitar requisições repetidas.
 */
async function loadLogoDataUrl() {
  if (logoDataUrlCache) return logoDataUrlCache;
  try {
    const response = await fetch('assets/img/logo-unifan-icon.png');
    const blob = await response.blob();
    logoDataUrlCache = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return logoDataUrlCache;
  } catch (err) {
    console.warn('Não foi possível carregar a logo institucional para o PDF.', err);
    return null;
  }
}

export function initRelatoriosModule() {
  const pdfBtn = document.getElementById('btn-export-pdf');
  const excelBtn = document.getElementById('btn-export-excel');

  if (pdfBtn) pdfBtn.addEventListener('click', exportPDF);
  if (excelBtn) excelBtn.addEventListener('click', exportExcel);
}

function guardEmpty() {
  if (getLancamentos().length === 0) {
    showToast('Não há lançamentos para gerar relatório.', 'warning');
    return true;
  }
  return false;
}

async function exportPDF() {
  if (guardEmpty()) return;
  if (typeof window.jspdf === 'undefined') {
    showToast('Biblioteca de PDF não carregada.', 'danger');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const aluno = getAluno();
  const lancamentos = getLancamentos();
  const rows = computeRowResults(lancamentos);
  const byYear = computeByYear(lancamentos);
  const byCategory = computeByCategory(lancamentos).filter((c) => c.quantidadeLancamentos > 0);
  const totals = computeTotals(lancamentos);

  const marginX = 36;
  let y = 40;

  // Cabeçalho institucional
  doc.setFillColor(15, 52, 96);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 56, 'F');

  const logoDataUrl = await loadLogoDataUrl();
  const textStartX = logoDataUrl ? marginX + 44 : marginX;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', marginX, 10, 36, 36);
    } catch (err) {
      console.warn('Falha ao inserir a logo no PDF.', err);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('UNIFAN — Centro Universitário Anísio Teixeira', textStartX, 24);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Atividades Complementares', textStartX, 40);

  doc.setTextColor(20, 30, 40);
  y = 78;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Dados do aluno', marginX, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const infoLines = [
    `Nome: ${aluno.nome || '—'}`,
    `Curso: ${aluno.curso || '—'}`,
    `RA: ${aluno.ra || '—'}`,
    `Semestre: ${aluno.semestre || '—'}`,
    `Telefone: ${aluno.telefone || '—'}`,
  ];
  infoLines.forEach((line, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    doc.text(line, marginX + col * 260, y + row * 14);
  });
  y += 36;

  // Tabela completa de lançamentos
  doc.autoTable({
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Ano', 'Categoria', 'Descrição', 'Data', 'Qtd.', 'Informadas', 'Aproveitadas', 'Excedentes']],
    body: rows
      .sort((a, b) => (a.data || '').localeCompare(b.data || ''))
      .map((r) => [
        r.ano,
        `${r.category?.code ?? ''}. ${r.category?.label ?? ''}`,
        r.descricao,
        formatDate(r.data),
        r.category?.type === 'per_event' ? `${r.quantidade}` : '—',
        formatHoras(r.horasInformadas),
        formatHoras(r.horasAproveitadas),
        formatHoras(r.horasExcedentes),
      ]),
    styles: { fontSize: 7.5, cellPadding: 4 },
    headStyles: { fillColor: [15, 52, 96], textColor: 255 },
    alternateRowStyles: { fillColor: [244, 249, 254] },
    columnStyles: { 2: { cellWidth: 180 } },
  });

  y = doc.lastAutoTable.finalY + 24;
  if (y > 480) {
    doc.addPage();
    y = 40;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Resumo por ano', marginX, y);
  y += 8;
  doc.autoTable({
    startY: y + 8,
    margin: { left: marginX, right: marginX },
    head: [['Ano', 'Lançamentos', 'Informadas', 'Aproveitadas', 'Excedentes']],
    body: byYear
      .filter((d) => d.quantidadeLancamentos > 0)
      .map((d) => [d.ano, d.quantidadeLancamentos, formatHoras(d.horasInformadas), formatHoras(d.horasAproveitadas), formatHoras(d.horasExcedentes)]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [26, 95, 168], textColor: 255 },
    tableWidth: 320,
  });

  const afterYearY = doc.lastAutoTable.finalY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Resumo por categoria', marginX + 340, y - 8);
  doc.autoTable({
    startY: y + 8,
    margin: { left: marginX + 340, right: marginX },
    head: [['Cat.', 'Aproveitadas', 'Excedentes']],
    body: byCategory.map((d) => [`${d.category.code}`, formatHoras(d.horasAproveitadas), formatHoras(d.horasExcedentes)]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [26, 95, 168], textColor: 255 },
  });

  const finalY = Math.max(afterYearY, doc.lastAutoTable.finalY) + 26;

  doc.setFillColor(232, 242, 252);
  doc.roundedRect(marginX, finalY, doc.internal.pageSize.getWidth() - marginX * 2, 50, 4, 4, 'F');
  doc.setTextColor(15, 52, 96);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total geral aproveitado: ${formatHoras(totals.totalAproveitado)}`, marginX + 16, finalY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total informado: ${formatHoras(totals.totalInformado)}    |    Total excedente: ${formatHoras(totals.totalExcedente)}    |    Certificados: ${totals.totalCertificados}`, marginX + 16, finalY + 38);

  doc.setFontSize(7.5);
  doc.setTextColor(140, 150, 160);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} pelo sistema Controle de Atividades Complementares.`, marginX, doc.internal.pageSize.getHeight() - 16);

  const filename = `Relatorio_Atividades_Complementares_${(aluno.nome || 'aluno').replace(/\s+/g, '_')}_${todayISO()}.pdf`;
  doc.save(filename);
  showToast('Relatório PDF gerado com sucesso.', 'success');
}

function exportExcel() {
  if (guardEmpty()) return;
  if (typeof XLSX === 'undefined') {
    showToast('Biblioteca de Excel não carregada.', 'danger');
    return;
  }

  const aluno = getAluno();
  const lancamentos = getLancamentos();
  const rows = computeRowResults(lancamentos);
  const byYear = computeByYear(lancamentos).filter((d) => d.quantidadeLancamentos > 0);
  const byCategory = computeByCategory(lancamentos).filter((d) => d.quantidadeLancamentos > 0);
  const totals = computeTotals(lancamentos);

  const wb = XLSX.utils.book_new();

  // Aba 1: Dados do aluno
  const alunoSheet = XLSX.utils.aoa_to_sheet([
    ['Controle de Atividades Complementares — UNIFAN'],
    [],
    ['Nome', aluno.nome || ''],
    ['Curso', aluno.curso || ''],
    ['RA', aluno.ra || ''],
    ['Semestre', aluno.semestre || ''],
    ['Telefone', aluno.telefone || ''],
    [],
    ['Total informado (h)', round2(totals.totalInformado)],
    ['Total aproveitado (h)', round2(totals.totalAproveitado)],
    ['Total excedente (h)', round2(totals.totalExcedente)],
    ['Total de certificados', totals.totalCertificados],
  ]);
  alunoSheet['!cols'] = [{ wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, alunoSheet, 'Dados do Aluno');

  // Aba 2: Lançamentos completos
  const lancHeader = ['Ano', 'Categoria', 'Descrição', 'Data', 'Quantidade', 'Horas Informadas', 'Horas Aproveitadas', 'Horas Excedentes', 'Observações'];
  const lancBody = rows
    .sort((a, b) => (a.data || '').localeCompare(b.data || ''))
    .map((r) => [
      r.ano,
      `${r.category?.code ?? ''}. ${r.category?.label ?? ''}`,
      r.descricao,
      formatDate(r.data),
      r.category?.type === 'per_event' ? r.quantidade : '',
      round2(r.horasInformadas),
      round2(r.horasAproveitadas),
      round2(r.horasExcedentes),
      r.observacoes || '',
    ]);
  const lancSheet = XLSX.utils.aoa_to_sheet([lancHeader, ...lancBody]);
  lancSheet['!cols'] = [{ wch: 6 }, { wch: 45 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, lancSheet, 'Lançamentos');

  // Aba 3: Resumo por ano
  const anoHeader = ['Ano', 'Lançamentos', 'Horas Informadas', 'Horas Aproveitadas', 'Horas Excedentes'];
  const anoBody = byYear.map((d) => [d.ano, d.quantidadeLancamentos, round2(d.horasInformadas), round2(d.horasAproveitadas), round2(d.horasExcedentes)]);
  const anoSheet = XLSX.utils.aoa_to_sheet([anoHeader, ...anoBody]);
  anoSheet['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, anoSheet, 'Resumo por Ano');

  // Aba 4: Resumo por categoria
  const catHeader = ['Código', 'Categoria', 'Tipo de Regra', 'Lançamentos', 'Horas Aproveitadas', 'Horas Excedentes'];
  const catBody = byCategory.map((d) => [
    d.category.code,
    d.category.label,
    d.category.type === 'annual_limit' ? `Até ${d.category.limit}h/ano` : `${d.category.valuePerUnit}h por unidade`,
    d.quantidadeLancamentos,
    round2(d.horasAproveitadas),
    round2(d.horasExcedentes),
  ]);
  const catSheet = XLSX.utils.aoa_to_sheet([catHeader, ...catBody]);
  catSheet['!cols'] = [{ wch: 8 }, { wch: 55 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, catSheet, 'Resumo por Categoria');

  const filename = `Relatorio_Atividades_Complementares_${(aluno.nome || 'aluno').replace(/\s+/g, '_')}_${todayISO()}.xlsx`;
  XLSX.writeFile(wb, filename);
  showToast('Planilha Excel gerada com sucesso.', 'success');
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
