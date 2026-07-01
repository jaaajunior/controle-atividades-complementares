# Controle de Atividades Complementares — UNIFAN

Sistema web para lançamento de certificados de Atividades Complementares e cálculo automático da carga horária válida, conforme o barema institucional da UNIFAN.

## Características

- **100% client-side**: sem backend, sem banco de dados, sem login.
- Todo o processamento e cálculo ocorre no navegador.
- Os dados permanecem **apenas durante a sessão** (não há persistência em disco ou no navegador) — ao recarregar a página, tudo é reiniciado.
- Exportação de relatórios em **PDF** e **Excel**.
- Pronto para publicação no **GitHub Pages**, sem etapa de build.

## Estrutura do projeto

```
index.html              → estrutura e telas da aplicação
css/                     → variables, base, layout, components, responsive
js/
  data/barema.js         → definição oficial das 11 categorias do barema
  core/state.js          → estado central (aluno + lançamentos)
  core/calculator.js     → motor de cálculo (aproveitadas / excedentes)
  utils/                 → formatadores, validadores, geração de IDs
  ui/                    → navegação, modal, notificações (toast)
  modules/
    aluno.js             → tela "Dados do Aluno"
    lancamento.js        → formulário de lançamento (campos dinâmicos)
    historico.js         → tabela, filtros e pesquisa
    dashboard.js         → cards e gráficos (Chart.js)
    resumo.js             → totais por ano e por categoria
    relatorios.js         → exportação PDF (jsPDF) e Excel (SheetJS)
  app.js                 → ponto de entrada
```

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub e envie todos os arquivos deste projeto (mantendo a estrutura de pastas).
2. No GitHub, acesse **Settings → Pages**.
3. Em "Source", selecione a branch `main` (ou `master`) e a pasta `/ (root)`.
4. Salve. O GitHub fornecerá uma URL pública (ex: `https://seuusuario.github.io/nome-do-repositorio/`).

Não é necessário nenhum passo de build — os arquivos são servidos diretamente.

## Como testar localmente

Como o projeto usa módulos ES6 (`import`/`export`), é necessário servir os arquivos por HTTP (abrir o `index.html` diretamente com `file://` não funciona devido a restrições de CORS dos navegadores).

Qualquer servidor estático simples funciona, por exemplo:

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .
```

Depois acesse `http://localhost:8080`.

## Regras do barema implementadas

| # | Categoria | Regra |
|---|-----------|-------|
| 1 | Apresentação de trabalhos em congresso | 20h por apresentação (sem limite anual) |
| 2 | Cursos afins | até 70h/ano |
| 3 | Estágios extracurriculares (com comprovação) | até 60h/ano |
| 4 | Monitoria | até 70h/ano |
| 5 | Grupos de estudo/pesquisa/extensão (NEPEX) | até 70h/ano |
| 6 | Eventos científico-culturais (palestras e debates) | até 30h/ano |
| 7 | Eventos científico-culturais (seminários, simpósios, etc.) | até 40h/ano |
| 8 | Projetos comunitários | até 80h/ano |
| 9 | Organização de eventos científico-culturais | 20h por evento (sem limite anual) |
| 10 | Organização de palestras e debates | 5h por evento (sem limite anual) |
| 11 | Publicação de artigo em revista indexada | 40h por publicação (sem limite anual) |

Para as categorias com limite anual, os anos são controlados separadamente (2021 a 2027, com possibilidade de incluir anos futuros automaticamente ao lançar uma atividade em um novo ano). A alocação de horas dentro do limite segue a ordem cronológica dos certificados lançados.

## Customização da identidade visual

As cores institucionais (tons de azul UNIFAN) e tipografia estão centralizadas em `css/variables.css`, facilitando ajustes futuros sem alterar os demais arquivos.
