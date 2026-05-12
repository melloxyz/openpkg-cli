<div align="center">
<img src=".openpkg/assets/openpkg-logo.png" alt="OpenPgk logo" width="520" style="margin: 25px 0 25px;" />

<div aria-hidden="true" style="height: 12px;"></div>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Ink-7-000000?style=flat-square" alt="Ink" />
  <img src="https://img.shields.io/badge/Zod-4-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/pnpm-10-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Vitest-4-6E9F18?style=flat-square&logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/ESLint-10-4B32C3?style=flat-square&logo=eslint&logoColor=white" alt="ESLint" />
  <img src="https://img.shields.io/badge/Prettier-3-F7B93E?style=flat-square&logo=prettier&logoColor=black" alt="Prettier" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="Licença MIT" />
</p>

</div>

O OpenPgk é um centro de controle de desenvolvedor para o terminal, focado no uso do teclado.

Ele foi projetado para ajudar os desenvolvedores a inspecionar e gerenciar ambientes locais, gerenciadores de pacotes, runtimes, caches, projetos, artefatos pesados em disco, diagnósticos e fluxos de limpeza a partir de uma experiência TUI/CLI rápida e unificada.

## Status

O OpenPgk está atualmente em desenvolvimento ativo.

O projeto já possui uma base executável com varreduras reais, diagnósticos, execução de limpeza e uma interface de terminal (TUI) responsiva, mas o produto ainda não é considerado estável. Espere iterações rápidas, mudanças de comportamento e módulos inacabados enquanto a arquitetura ainda está em expansão.

## Objetivos

O OpenPgk não tem a intenção de ser apenas um wrapper (encapsulador) em torno de gerenciadores de pacotes.

O objetivo a longo prazo é fornecer um centro de operações de desenvolvedor multiplataforma para:

- gerenciadores de pacotes
- runtimes
- projetos locais
- caches e artefatos de build
- fluxos de limpeza
- diagnósticos e saúde do ambiente
- visibilidade de Docker e contêineres
- Python e outras ferramentas poliglotas
- futuros plugins, perfis, indexação e diagnósticos assistidos por IA

## Funcionalidades Atuais

A implementação atual inclui:

- TUI interativa construída com Ink e React
- navegação lateral com gerenciamento de foco por teclado
- paleta de comandos com comandos "slash" (`/`) e sugestões aproximadas (fuzzy)
- execução de comandos CLI "headless" (sem interface) para ambientes não interativos
- descoberta de projetos no escopo do workspace, diretórios de desenvolvedor ou na máquina toda
- descoberta de alvos de limpeza para `node_modules`, `.pnpm-store`, `.npm`, `.turbo`, `.next`, `dist` e `build`
- execução real de limpeza com fluxo de confirmação e atualização em tempo real
- detecção de frameworks de projeto para React, Next.js, Vue, Angular, Electron, APIs Node e suporte inicial a Python
- detecção de gerenciador de pacotes via lockfiles e campo `packageManager` no `package.json`
- sinais de Docker e Python exibidos em diagnósticos e metadados de projetos
- snapshots (instantâneos) de varredura em cache para uso repetido mais rápido
- manipulação de layout responsivo para diferentes tamanhos de terminal
- feedback de progresso durante varreduras e fluxos de exclusão

## Tecnologias Utilizadas

- Node.js
- TypeScript
- Ink
- `@inkjs/ui`
- execa
- chalk
- gradient-string
- boxen
- zod
- fast-glob
- tsup
- Vitest
- ESLint
- Prettier
- pnpm

## Instalação

### Requisitos

- Node.js 20 ou superior
- pnpm

### Configuração Local

```bash
pnpm install
pnpm dev
```

### Build

```bash
pnpm build
```

### Verificações de Qualidade

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## Executando o OpenPgk

### TUI Interativa

```bash
pnpm dev
```

Ou após o build:

```bash
node dist/cli.js
```

### Comandos Sem Interface (Headless)

Exemplos:

```bash
node dist/cli.js /doctor
node dist/cli.js /projects workspace
node dist/cli.js /cleanup machine
node dist/cli.js /cleanup workspace --delete-safe
node dist/cli.js /scan machine
```

## Referência de Comandos

### Comandos Suportados

- `/scan`
- `/projects`
- `/cache`
- `/cleanup`
- `/doctor`
- `/help`
- `/settings`

### Variantes de Escopo

O scanner suporta sintaxe de escopo tanto baseada em opções quanto posicional.

Exemplos:

```bash
/scan --scope=workspace
/scan workspace
/scan machine
/projects machine
/cleanup workspace
/cache machine
```

### Escopos Suportados

- `workspace`: escaneia apenas o diretório de trabalho atual
- `developer-home`: escaneia raízes comuns de desenvolvedores como Desktop, Projects, Code, dev e Developer
- `machine`: escaneia amplamente o diretório home do usuário atual para descobrir projetos e artefatos de desenvolvedor

## Navegação por Teclado

### Global

- `Tab`: alternar o foco entre a barra lateral e o conteúdo
- `h` / `Seta para Esquerda`: mover o foco para a barra lateral
- `l` / `Seta para Direita`: mover o foco para o conteúdo
- `j` / `Seta para Baixo`: mover a seleção
- `k` / `Seta para Cima`: mover a seleção
- `/`: abrir a paleta de comandos
- `r`: recarregar a seção atual
- `Ctrl+C`: sair

### Telas de Limpeza

- `Espaço`: alternar seleção
- `s`: selecionar todos os alvos de limpeza visíveis
- `a`: selecionar todos os alvos de limpeza seguros
- `c`: limpar seleção
- `x`: preparar para exclusão
- `y`: confirmar exclusão
- `Esc`: cancelar exclusão

## Modelo de Segurança da Limpeza

A limpeza é uma operação destrutiva real.

Atualmente, o OpenPgk protege o fluxo de exclusão através de:

- limitação da exclusão a nomes conhecidos de diretórios de limpeza
- recusa da exclusão da raiz do sistema de arquivos
- verificação de que o alvo ainda existe e é um diretório
- exigência de uma etapa de confirmação na TUI interativa
- atualização do inventário de limpeza após a exclusão

Mesmo com essas proteções, analise os candidatos a exclusão cuidadosamente antes de confirmá-los.

## Detecção de Projetos

O OpenPgk atualmente escaneia sinais de projetos como:

- `package.json`
- `pyproject.toml`
- `requirements.txt`
- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.yaml`
- `compose.yml`
- `compose.yaml`

Ele usa esses arquivos para inferir:

- nome do projeto
- framework
- gerenciador de pacotes
- status de atividade
- tamanho
- sinais de Docker e Python

## Estrutura do Repositório

```text
src/
├── app/
├── commands/
├── core/
├── hooks/
├── modules/
├── plugins/
├── services/
├── shared/
├── types/
├── ui/
└── utils/
```

## Notas de Arquitetura

A base de código atual é intencionalmente modular e organizada em torno de preocupações separáveis:

- `commands/`: análise (parsing), registro e definições de comandos nativos
- `modules/dashboard/`: orquestração e execução de comandos com manutenção de estado
- `services/`: inspeção de ambiente, varredura, cache e execução de limpeza
- `ui/`: layout do terminal, painéis, listas, telas e superfícies de interação
- `shared/` e `types/`: constantes reutilizáveis, esquemas e contratos

Essa estrutura tem a intenção de suportar adições futuras, como sistemas de plugins, módulos específicos para linguagens, perfis de workspace e indexação em segundo plano, sem um forte acoplamento entre os recursos.

## Roadmap (Roteiro)

Consulte o arquivo [ROADMAP.md](ROADMAP.md) para verificar o status de entrega atual e o trabalho planejado.

## Licença

Este projeto é licenciado sob a Licença MIT.

Veja o arquivo [LICENSE](LICENSE) para obter detalhes.