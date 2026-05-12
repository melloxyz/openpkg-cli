# Roadmap (Roteiro)

Este roteiro reflete o estado atual do OpenPgk e a direção planejada do projeto.

O OpenPgk está em desenvolvimento ativo, portanto, as prioridades podem mudar conforme o desempenho, a UX (experiência do usuário) e o suporte às plataformas evoluem.

## Visão

Construir um centro de controle de terminal de nível de produção para ambientes de desenvolvedor que seja rápido, moderno e operacionalmente útil nos fluxos de trabalho do dia a dia.

## Estágio Atual

O OpenPgk está atualmente no estágio de base mais operações iniciais.

O projeto já possui:

- uma interface de usuário de terminal (TUI) funcional
- um sistema de comandos funcional
- varredura real do sistema de arquivos
- execução real de limpeza
- reconhecimento inicial de Docker e Python
- layouts responsivos
- snapshots (instantâneos) de varredura em cache

## Entregues

### Plataforma Base

- base de CLI/TUI em Node.js com TypeScript
- configuração de projeto com pnpm
- pipeline de build tsup
- configurações do ESLint, Prettier e Vitest
- estrutura de projeto modular alinhada com o crescimento futuro

### Experiência de Terminal

- shell do aplicativo TUI baseada em Ink
- navegação por barra lateral
- fluxos de trabalho priorizando o uso do teclado
- paleta de comandos com suporte a barra (`/`)
- modo de execução CLI "headless" (sem interface)
- comportamento de layout responsivo para terminais menores
- feedback de progresso para varreduras e fluxos de exclusão

### Sistema de Comandos

- analisador (parser) e registro de comandos
- sugestões de comandos com busca aproximada (fuzzy)
- comandos embutidos para scan, projects, cache, cleanup, doctor, help e settings
- suporte a comandos de escopo com opções (`--scope=...`) e parâmetros posicionais como `/scan machine`

### Varredura e Descoberta

- descoberta recursiva de alvos de limpeza
- descoberta de projetos em todo o escopo do workspace, pastas de desenvolvimento e máquina
- cálculo de tamanho de diretórios com fallback (solução de contingência) em tempo de execução
- detecção de frameworks para projetos:
  - React
  - Next.js
  - Vue
  - Angular
  - Electron
  - APIs Node
  - projetos Python iniciais
- detecção de gerenciadores de pacotes utilizando:
  - lockfiles
  - `packageManager` no arquivo `package.json`
  - sinais iniciais de ferramentas em Python como Poetry, uv e pip

### Operações de Limpeza

- inventário em tempo real de candidatos à limpeza
- fluxo de limpeza com seleção múltipla
- selecionar todos (select all)
- selecionar candidatos seguros (safe candidates)
- pré-visualização do espaço que será recuperado antes da exclusão
- exclusão real com verificações de segurança
- atualização automática após a exclusão

### Diagnósticos

- detecção de disponibilidade dos gerenciadores de pacotes
- detecção de runtimes/ferramentas para:
  - npm
  - pnpm
  - yarn
  - bun
  - python
  - docker
  - go
  - rustc
  - java
- recomendação de saída (output) para ferramentas ausentes

### Sinais de Ecossistemas Iniciais

- sinais de projetos relacionados ao Docker
- sinais de projetos relacionados ao Python
- visibilidade de projetos que incluem configurações Docker ou compose

## Em Andamento / Próximas Prioridades Imediatas

### Desempenho e Escala

- agilizar varreduras em nível de máquina com indexação incremental
- melhorar a granularidade da varredura para que o progresso reflita a movimentação real de arquivos e diretórios
- reduzir a sobrecarga no cálculo repetido do tamanho de diretórios
- adicionar invalidação de cache mais inteligente por raiz e diretório

### Profundidade de UX do TUI

- melhor paginação para terminais muito pequenos
- painéis de detalhes mais ricos e visualizações aprofundadas (drill-down views)
- melhorias na interatividade da paleta de comandos
- filtros e ordenações mais eficientes nas visualizações de projetos e de limpeza

### Inteligência de Limpeza

- heurísticas de segurança mais detalhadas
- melhor detecção de projetos inativos
- relatórios de simulação de exclusão (dry-run)
- exportação de resumos estruturados da limpeza

## Planejado

### Módulo Docker

- saúde do mecanismo (engine) e do daemon Docker
- inspeção de imagens, volumes, redes e contêineres
- visualizações de cache e uso de disco
- fluxos seguros de limpeza para artefatos Docker

### Módulo Python

- detecção de ambientes virtuais
- insights sobre ambientes Poetry e uv
- inspeção de cache do pip
- avaliações de saúde de interpretadores e ambientes

### Módulos de Outras Linguagens e Runtimes

- Rust
- Go
- Java
- ferramentas específicas do ecossistema Bun

### Operações em Projetos

- metadados de projetos mais completos
- agrupamento por workspace
- heurísticas de atividade recente
- visualizações de projetos com base em perfis

### Arquitetura de Plugins

- modelo de carregamento de plugins
- comandos de terceiros
- scanners externos e módulos customizados

### Serviços em Segundo Plano

- indexação em background
- inventário contínuo da máquina
- varreduras baseadas em alterações (delta-based rescans)

### IA e Diagnósticos

- orientação assistida por IA para integridade do ambiente
- sugestões de correção de problemas
- detecção de anomalias para crescimento de cache e uso de disco

## Direção a Longo Prazo

### Preparação para Produção

- cobertura mais sólida de plataforma cruzada (cross-platform)
- expansão da cobertura de testes em cenários variados de varredura
- tratamento defensivo de permissões
- modelo persistente de estabilidade para preferências e estado

### Experiência de Produto

- refinamento de interface tipo dashboard terminal "premium"
- atalhos de fluxo de trabalho para a manutenção diária
- visibilidade operacional mais aprofundada para máquinas de desenvolvedores

## Marcos de Lançamento (Milestones)

### Versão 0.1.x

Foco:

- estabilizar a base existente
- melhorar o desempenho das varreduras por toda a máquina
- aprofundar fluxos de trabalho de limpeza e diagnóstico

### Versão 0.2.x

Foco:

- disponibilizar módulos mais eficientes para Docker e Python
- melhorar a inteligência do projeto
- aprimorar a UX (experiência do usuário) no terminal e o sistema de filtros

### Versão 0.3.x

Foco:

- introduzir arquitetura de plugins
- iniciar indexação em background e suporte a perfis

## Orientação para Contribuições

O projeto deve continuar favorecendo:

- limites de módulos bem definidos
- comportamento multiplataforma
- fluxos de trabalho que priorizem o teclado
- operações destrutivas com segurança
- responsividade ao processar sistemas de arquivos extensos de desenvolvedores