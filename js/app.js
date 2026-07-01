// js/app.js
import { initNavigation } from './ui/navigation.js';
import { initAlunoModule } from './modules/aluno.js';
import { initLancamentoModule } from './modules/lancamento.js';
import { initHistoricoModule } from './modules/historico.js';
import { initDashboardModule } from './modules/dashboard.js';
import { initResumoModule } from './modules/resumo.js';
import { initRelatoriosModule } from './modules/relatorios.js';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initAlunoModule();
  initLancamentoModule();
  initHistoricoModule();
  initDashboardModule();
  initResumoModule();
  initRelatoriosModule();
});
