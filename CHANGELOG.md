# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato baseia-se nos princípios de [Keep a Changelog](https://keepachangelog.com/), adaptado para o estágio inicial de desenvolvimento do OpenPgk.

---

## Rumo à Versão 1.0.0 (Estável)

Acompanhe o que já foi implementado e o que está planejado até o lançamento da versão `1.0.0`.

### Fase 1: Fundação & Varredura (Concluído)
- [x] CLI/TUI interativa com navegação lateral e suporte a teclado
- [x] Execução de comandos nativos com paleta de comandos (`/scan`, `/cleanup`, etc.)
- [x] Varredura de sistema de arquivos e cache de snapshots

### Fase 2: Limpeza & Segurança (Em andamento)
- [x] Descoberta e limpeza de alvos (`node_modules`, `dist`, `.next`, etc.)
- [x] Proteção e avaliações de risco durante o fluxo de deleção
- [ ] Relatórios e sumarização pós-limpeza (dry-run)

### Fase 3: Módulos Inteligentes & Plugins (Planejado)
- [x] Reconhecimento inicial de ecossistema Docker e Python
- [ ] Gestão detalhada de módulos Docker (volumes, imagens, etc.)
- [ ] Implementação da arquitetura de plugins e comandos de terceiros

### Fase 4: Estabilidade & Produção (Planejado)
- [ ] Indexação e varredura assíncronas em segundo plano
- [ ] Experiência "premium" e responsividade garantida sob estresse
- [ ] Lançamento da versão 1.0.0

---

## [Unreleased] (Em Desenvolvimento)

### Adicionado (Added)
- Configuração de CI com GitHub Actions para validação automatizada de código (Typecheck, Lint, Testes) e garantia de build.
- Base CLI/TUI com TypeScript, Ink, tsup, ESLint, Prettier e Vitest.
- Painel interativo com foco no uso do terminal (sidebar, paleta de comandos, atalhos de teclado).
- Execução de comandos sem interface (headless) para ambientes automatizados.
- Sistema nativo de comandos slash (`/scan`, `/projects`, `/cache`, `/cleanup`, `/doctor`, `/help`, `/settings`).
- Descoberta e varredura de projetos em escopos como `workspace`, `developer-home` e `machine`.
- Mapeamento avançado para limpeza de: `node_modules`, `.pnpm-store`, `.npm`, `.turbo`, `.next`, `dist` e `build`.
- Fluxo de exclusão de artefatos contendo seleção múltipla, opções seguras e processo de confirmação de deleção para evitar acidentes.
- Caching de snapshots para acelerar o processo repetitivo de escaneamento.
- Identificação inicial de Python e Docker na busca e diagnósticos do sistema.
- Reconhecimento automático de frameworks (React, Next.js, Vue, Angular, Electron, APIs nativas Node).
- Detecção nativa do gerenciador de pacote utilizando o arquivo `package.json` ou identificando "lockfiles".
- Adição das documentações oficiais (README, ROADMAP, CHANGELOG, CONTRIBUTING e LICENSE).

### Modificado (Changed)
- Aprimoramento no cálculo de espaço dos diretórios, evitando perdas métricas e resultados de fallback falsos no tempo de execução.
- Suporte abrangente à entrada de opções `--scope=...` ou de forma posicional, ex.: `/scan machine`.
- Processo de escaneamento modernizado para ser capaz de achar subprojetos agrupados ou pastas aninhadas.
- Melhoria visual para visualização de espaços ocupados, agrupamento inteligente e uma prévia de espaço antes da exclusão.
- Seção Doctor foi otimizada para evidenciar dependências essenciais de maneira direta.

### Corrigido (Fixed)
- Ajustado o erro onde as varreduras às vezes ignoravam diretórios `node_modules` válidos.
- Ajustado o parser de projetos permitindo ler perfeitamente sub-arquivos `package.json` dentro do mesmo espaço.
- Ajuste de contagem e renderização quando os medidores via processo worker não estão acessíveis.