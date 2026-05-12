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

### Fase 2: Hardening `0.2.x` (Planejado)

- [ ] Otimizar scans de máquina em ambientes grandes.
- [ ] Ampliar testes de integração para escopos e cleanup destrutivo.
- [ ] Melhorar tratamento de permissões e diretórios inacessíveis.
- [ ] Exportar resumos estruturados de operações headless.

### Fase 3: Produto Público `0.3.x` (Planejado)

- [ ] Refinar filtros, ordenações e drill-downs no TUI.
- [ ] Melhorar autocomplete de argumentos na command palette.
- [ ] Adicionar templates de issue e pull request.
- [ ] Validar fluxo completo de release com tag GitHub.

### Fase 4: Estável `1.0.0` (Planejado)

- [ ] Congelar contratos públicos principais.
- [ ] Validar matriz mínima Windows, macOS e Linux.
- [ ] Documentar instalação via npm.
- [ ] Publicar versão estável.

---

## [Unreleased] (Em Desenvolvimento)

Nenhuma mudança não versionada no momento.

---

## [0.1.0] - 2026-05-12

### Adicionado (Added)

- Configuração inicial de CI com GitHub Actions para typecheck, lint, testes e build.
- Workflow de release baseado em tags `v*` com extração de notas do changelog.
- Base CLI/TUI com Node.js, TypeScript, Ink, React, tsup, ESLint, Prettier e Vitest.
- Binários `openpkg` e `opkg` apontando para `dist/cli.js`.
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

### Modificado (Changed)

- Padronizada a marca pública como OpenPkg.
- O pacote npm permaneceu como `openpkg`, com bins `openpkg` e `opkg`.
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
