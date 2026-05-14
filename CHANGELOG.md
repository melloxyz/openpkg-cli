# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato se baseia em [Keep a Changelog](https://keepachangelog.com/) e segue versionamento semântico conforme o projeto avança rumo à versão estável.

---

## Rumo à Versão 1.0.0 (Estável)

### Fase 1: Fundação Pública `0.1.0` (Concluído)

- [x] Base CLI/TUI executável.
- [x] Sistema de comandos slash.
- [x] Scanners de projetos, caches e cleanup.
- [x] Doctor inicial de ambiente.
- [x] Cleanup com validação defensiva, preview e dry-run.
- [x] Documentação inicial profissional.
- [x] CI, build-check e release workflow.

### Fase 2: Hardening `0.2.x` (Concluído)

- [x] Otimizar scans de máquina em ambientes grandes.
- [x] Ampliar testes de integração para escopos e cleanup destrutivo.
- [x] Melhorar tratamento de permissões e diretórios inacessíveis.
- [x] Exportar resumos estruturados de operações headless.
- [x] Adicionar check automático de updates do ambiente global.
- [x] Entregar comando dedicado `/updates`.

### Fase 3: UX e Operação Pública `0.3.x` (Concluído)

- [x] Refinar paginação, filtros, ordenações e drill-downs no TUI.
- [x] Melhorar autocomplete de argumentos na command palette.
- [x] Tornar a seção "Settings" totalmente funcional e integrada.
- [x] Preparar templates de issue e PR para contribuições externas.
- [x] Validar fluxo completo de release com tag GitHub.

### Fase 4: Arquitetura UI, Revamp Visual e Navegação `0.4.x` (Em Andamento)

- [x] Melhoria geral de UI/UX no TUI para torná-lo mais organizado.
- [x] Melhorar sistema de navegação e fluxos entre telas.
- [ ] Refatoração e separação profissional dos componentes React/Ink (cuidando rigorosamente para não remover lógicas importantes).
- [ ] Polimento de design, responsividade estendida e feedback visual.

### Fase 5: Estável `1.0.0` (Planejado)

- [ ] Congelar contratos públicos principais de comandos e snapshots.
- [ ] Fechar matriz mínima de testes para Windows, macOS e Linux.
- [ ] Documentar instalação via npm e garantir qualidade no CI.
- [ ] Revisar fluxos destrutivos e publicar release estável.

---

## [Unreleased] (Em Desenvolvimento)

### Adicionado (Added)

### Modificado (Changed)

- A navegação da sidebar passou a atualizar a seção ativa diretamente, eliminando o cursor separado e fazendo o conteúdo mudar junto com a seleção.
- O TUI adotou uma direção visual mais monocromática, com azul reservado para destaque, foco e seleção importantes.
- A sidebar passou a expor Dashboard, Packages, Cleanup, Scripts, Registry, Search e Settings como superfície principal da navegação.
- A command palette, os painéis, os stat cards e o shell superior receberam polimento para reduzir ruído visual e reforçar hierarquia.
- As telas de projetos e cleanup passaram a destacar a seleção ativa em azul e a seguir a mesma linguagem visual mais limpa do restante da interface.
- A responsividade do TUI foi refinada com truncamento consistente, caminhos encurtados, sidebar mais estável e símbolos sem emoji para reduzir quebras visuais em terminais variados.

### Corrigido (Fixed)

- O estado da sidebar deixou de divergir da seção ativa, o que eliminou a necessidade de Enter/Right para enxergar a tela selecionada.

---

## [0.3.0] - 2026-05-13

### Adicionado (Added)

- Scripts de smoke para validar o binário local e a instalação do pacote com `pnpm smoke:local`, `pnpm smoke:package` e `pnpm smoke`.
- Templates de issue e PR para padronizar contribuições externas.
- Extração local de release notes baseada no `CHANGELOG.md` para validar tags `vX.X.X` antes da publicação.
- Drill-down compacto para projetos e cleanup em terminais pequenos, com paginação por página e preservação da seleção atual.

### Modificado (Changed)

- As listas de projetos e cleanup passaram a suportar filtros locais com `f`, ordenações com `o` e navegação com `PgUp`, `PgDn`, `Home` e `End`.
- O workflow de release passou a extrair notas usando o script local `src/scripts/release-notes.ts`, validando tag, `package.json` e `CHANGELOG.md` no mesmo fluxo.

---

## [0.2.0] - 2026-05-12

### Adicionado (Added)

- Serviço de checagem remota de updates para `npm`, `pnpm`, `yarn`, `bun` e `Node`.
- Comando `/updates` para uso TUI e headless.
- Cache dedicado para resultados remotos de updates com reaproveitamento no Doctor.
- Progresso incremental para scans de projetos e cleanup.
- Progresso por alvo para preview e exclusão de cleanup.
- Resumo estruturado de execução de cleanup no snapshot e no modo headless.
- Testes de integração do controller para `workspace`, `developer-home` e `machine`.

### Modificado (Changed)

- O Doctor passou a enriquecer o diagnóstico com status de atualização do ambiente global.
- `--cached` em `Doctor` e `/updates` passou a usar apenas dados remotos já armazenados.
- O scanner de projetos ficou mais tolerante a `package.json` inválido para o schema.
- O cálculo de tamanho e os scanners ficaram mais resilientes a caminhos inacessíveis e symlinks.
- O scanner passou a emitir progresso incremental por descoberta e processamento.

---

## [0.1.0] - 2026-05-12

### Adicionado (Added)

- Configuração inicial de CI com GitHub Actions para typecheck, lint, testes e build.
- Workflow de release baseado em tags `v*` com extração de notas do changelog.
- Base CLI/TUI com Node.js, TypeScript, Ink, React, tsup, ESLint, Prettier e Vitest.
- Binários `openpkg` e `opkg` apontando para `dist/cli.js`.
- Scripts de publicação com `prepack` e `prepublishOnly` para validar a CLI antes do empacotamento e do `npm publish`.
- Painel interativo com sidebar, conteúdo principal, footer operacional e atalhos de teclado.
- Paleta de comandos com suporte a comandos slash e sugestões fuzzy.
- Execução headless para comandos em ambientes não interativos.
- Sistema de comandos para `/scan`, `/projects`, `/cache`, `/cleanup`, `/doctor`, `/help` e `/settings`.
- Suporte aos escopos `workspace`, `developer-home` e `machine` por argumento posicional ou `--scope`.
- Scanner de projetos com detecção de React, Next.js, Vue, Angular, Electron, APIs Node e Python inicial.
- Detecção de package manager via lockfiles e campo `packageManager` no `package.json`.
- Sinais iniciais de Docker e Python em projetos e diagnósticos.
- Scanner de cleanup para `node_modules`, `.pnpm-store`, `.npm`, `.turbo`, `.next`, `dist` e `build`.
- Cache local de snapshots em `.openpkg/cache.json`.
- Preview de espaço estimado antes da exclusão.
- Dry-run explícito para cleanup headless.
- Resumo pós-cleanup com itens deletados, falhas e espaço estimado recuperado.
- Documentação inicial com README, ROADMAP, CONTRIBUTING, CHANGELOG e LICENSE MIT.
- Documentação de instalação global, execução via `npx` e desinstalação da CLI.

### Modificado (Changed)

- Padronizada a marca pública como OpenPkg.
- O pacote npm permaneceu como `openpkg`, com bins `openpkg` e `opkg`.
- O pacote publicado passou a incluir o asset do logo para renderização correta do README no npm.
- O comando headless `/cleanup --delete-safe` passou a exigir `--confirm` para deletar de fato.
- `/cleanup --delete-safe` sem confirmação passou a executar preview/dry-run.
- O cálculo de espaço foi reforçado para evitar resultados falsos de tamanho zero quando possível.
- O scanner passou a lidar melhor com subprojetos e pastas aninhadas.
- A UX do TUI foi ajustada para responsividade em diferentes tamanhos de terminal.
- A seção Doctor foi organizada para mostrar disponibilidade de ferramentas essenciais.

### Corrigido (Fixed)

- Corrigida a descoberta de diretórios `node_modules` válidos que podiam ser ignorados.
- Corrigida a leitura de `package.json` em subprojetos dentro do mesmo workspace.
- Corrigida a renderização de métricas quando o fallback de tamanho era necessário.
- Corrigida a variação visual da sidebar em navegação até Settings.

### Segurança (Security)

- Adicionada validação defensiva antes de qualquer exclusão real.
- Bloqueada exclusão de raiz do sistema de arquivos.
- Bloqueada exclusão de diretórios fora da whitelist de cleanup.
- Bloqueada exclusão quando o tipo do alvo não corresponde ao nome do diretório.
- Exigida confirmação explícita em headless para deleção segura automatizada.
