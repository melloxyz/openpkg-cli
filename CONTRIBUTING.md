# Contribuindo

Obrigado por contribuir com o OpenPgk.

Este projeto ainda está em desenvolvimento ativo, por isso, as contribuições devem favorecer clareza, segurança, modularidade e comportamento multiplataforma em vez de adições rápidas e pontuais.

## Princípios

- mantenha a CLI/TUI sempre com o teclado em primeiro lugar (keyboard-first)
- preserve as fronteiras modulares entre `commands`, `services`, `ui` e `modules`
- prefira implementações multiplataforma (cross-platform)
- trate os fluxos de limpeza e de exclusão como recursos de alto risco
- otimize o desempenho para computadores com um grande volume de código
- mantenha layouts de terminal legíveis independentemente do tamanho do terminal

## Configuração do Ambiente de Desenvolvimento

Requisitos:

- Node.js 20+
- pnpm

Instale as dependências:

```bash
pnpm install
```

Execute em modo de desenvolvimento:

```bash
pnpm dev
```

Crie o build:

```bash
pnpm build
```

## Verificações de Qualidade

Antes de enviar alterações, execute:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Diretrizes de Código

- use TypeScript com tipagem estrita
- mantenha arquivos focados em uma única responsabilidade
- prefira serviços pequenos e combináveis no lugar de grandes módulos acoplados
- evite introduzir premissas específicas de uma plataforma sem adotar verificações (guards)
- mantenha a segurança como padrão para operações destrutivas
- preserve a clareza e seja descritivo em comportamentos de comando
- atualize a documentação quando alterar funcionalidades com as quais o usuário interage

## Diretrizes de Interface (UI)

- preserve a navegação totalmente baseada em teclado
- garanta a responsividade para terminais estreitos
- evite congestionar telas com decorações desnecessárias
- prefira uma rápida compreensão da tela à poluição visual

## Expectativas com Relação aos Testes

Adicione ou atualize os testes quando fizer alterações em:

- processamento (parsing) de comandos
- comportamento de limpeza
- varredura (scanning) no sistema de arquivos
- detecção do gerenciador de pacotes
- verificações de segurança

Vitest é o nosso executor de testes (test runner) atual.

## Escopo dos Pull Requests (PRs)

Boas contribuições geralmente incluem:

- um recurso ou correção bem focado
- documentação atualizada quando apropriada
- testes cobrindo as modificações de comportamento implementadas
- ausência de refatorações misturadas na mesma alteração que não tenham a ver com o código principal modificado

## Áreas que Requerem Cuidado Extra

- execução da limpeza
- travessia no sistema de arquivos (filesystem traversal)
- varredura em toda a máquina
- exibições de progresso e responsividade na TUI
- lógicas de detecção de Docker e Python

## Dúvidas e Orientações

Se uma alteração afetar arquitetura, segurança ou o desempenho de varreduras, prefira primeiro alinhá-la com as metas estipuladas no arquivo [ROADMAP.md](ROADMAP.md).