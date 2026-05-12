# Roadmap

Este roteiro reflete o estado atual do OpenPkg e o caminho objetivo até uma versão `1.0.0` estável.

OpenPkg está em desenvolvimento ativo. A v1 prioriza estabilidade do núcleo, previsibilidade operacional, documentação, testes, CI e publicação pública. Módulos profundos de Docker, Python, plugins e indexação em background permanecem planejados para depois do hardening inicial.

## Visão

Construir um Developer Operating Center de terminal para ambientes locais de desenvolvimento: rápido, modular, bonito, seguro para operações destrutivas e útil em fluxos reais de manutenção.

## Estado Atual

A primeira release pública planejada é `0.1.0`, formalizada em `2026-05-12`.

O projeto já possui:

- TUI funcional em Ink/React.
- Execução headless por comando.
- Sistema de comandos slash com aliases e sugestões.
- Scans reais para projetos, caches e artefatos.
- Escopos `workspace`, `developer-home` e `machine`.
- Cache local de snapshots.
- Cleanup real com validações de segurança.
- Preview de espaço, dry-run e resumo pós-cleanup.
- Doctor com package managers, runtimes e sinais iniciais de Docker/Python.
- Testes unitários e fluxos de CI.

## `0.1.0` Entregue

### Fundação

- [x] Base Node.js, TypeScript, Ink, React e tsup.
- [x] Estrutura modular em `src/app`, `src/commands`, `src/modules`, `src/services`, `src/ui`, `src/shared` e `src/types`.
- [x] ESLint, Prettier e Vitest configurados.
- [x] CI, build-check e release workflow no GitHub Actions.
- [x] README, ROADMAP, CHANGELOG, CONTRIBUTING e LICENSE.

### Produto

- [x] Dashboard TUI com sidebar, áreas de conteúdo e footer operacional.
- [x] Paleta de comandos com suporte a `/`.
- [x] Navegação por teclado e atalhos principais.
- [x] Layout responsivo para terminais menores.
- [x] Barras de progresso para scan e deleção.
- [x] Execução headless para automação e smoke tests.

### Núcleo Técnico

- [x] Parser e registry de comandos.
- [x] Built-ins para `/scan`, `/projects`, `/cache`, `/cleanup`, `/doctor`, `/help` e `/settings`.
- [x] Scanner de projetos com detecção de frameworks e package managers.
- [x] Scanner de cleanup para diretórios pesados.
- [x] Cache service para snapshots.
- [x] Cleanup executor com whitelist de alvos e validação defensiva.
- [x] Environment doctor com package managers, runtimes e ferramentas.

## Caminho Para `1.0.0`

### `0.2.x`: Hardening de Scan e Cleanup

- [ ] Medir e otimizar performance de `/scan machine` em máquinas grandes.
- [ ] Melhorar progresso incremental de scans longos.
- [ ] Adicionar mais testes de integração para escopos `workspace`, `developer-home` e `machine`.
- [ ] Cobrir edge cases de permissões, symlinks e diretórios inacessíveis.
- [ ] Exportar resumo estruturado de cleanup em modo headless.
- [ ] Refinar heurísticas de projeto inativo e recomendação segura.

### `0.3.x`: UX e Operação Pública

- [ ] Melhorar paginação e drill-down em terminais pequenos.
- [ ] Adicionar filtros e ordenações em projetos e cleanup.
- [ ] Refinar command palette com autocomplete de argumentos.
- [ ] Adicionar smoke tests documentados para build local e pacote instalado.
- [ ] Validar release workflow com tag `v0.1.0` e notas extraídas do changelog.
- [ ] Preparar templates de issue e PR para contribuições externas.

### `1.0.0`: Estável

- [ ] Garantir `typecheck`, `lint`, `test` e `build` verdes no CI.
- [ ] Documentar instalação via npm e uso dos bins `openpkg` e `opkg`.
- [ ] Fechar matriz mínima de testes para Windows, macOS e Linux.
- [ ] Revisar todo fluxo destrutivo de cleanup com testes e documentação.
- [ ] Congelar contratos públicos principais de comandos e snapshots.
- [ ] Publicar release estável com changelog versionado e tag GitHub.

## Pós-v1

### Docker

- Inspeção de engine, daemon, imagens, volumes, redes e contêineres.
- Visualizações de uso de disco e cache Docker.
- Fluxos seguros de limpeza para artefatos Docker.

### Python

- Detecção profunda de ambientes virtuais.
- Insights para Poetry, uv, pip e caches.
- Saúde de interpretadores e ambientes.

### Linguagens e Runtimes

- Rust.
- Go.
- Java.
- Bun em maior profundidade.

### Plugins e Perfis

- Modelo de carregamento de plugins.
- Comandos de terceiros.
- Scanners externos.
- Perfis de workspace.

### Background Indexing e IA

- Indexação em background.
- Inventário contínuo da máquina.
- Rescans delta-based.
- Diagnósticos assistidos por IA.
- Sugestões de correção e detecção de anomalias.

## Princípios de Produto

- Segurança antes de automação destrutiva.
- Performance perceptível em máquinas grandes.
- UX premium sem sacrificar clareza.
- Arquitetura modular e fácil de contribuir.
- Comportamento previsível em TUI e headless.
