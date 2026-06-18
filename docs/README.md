# Documentação — ZUP X (Frontend)

> **ZUP — Zeladoria Urbana Participativa** · Município de **Videira/SC**
> Plataforma cívica para registro georreferenciado e acompanhamento de problemas urbanos.

Esta pasta documenta o **frontend ZUP X** (React + Vite + TypeScript): a aplicação web que os
cidadãos e os órgãos municipais usam para registrar e acompanhar ocorrências de zeladoria urbana.
O conteúdo descreve a aplicação tal como ela existe no código (`src/lib/`, `src/hooks/`,
`src/components/`, `src/data/`, `src/pages/`).

As regras de negócio são definidas e validadas no **backend ProjetoZup** (Node/Express +
PostgreSQL/PostGIS, <https://github.com/Grogww/ProjetoZup>), que é a API consumida por esta
aplicação. A documentação aqui presente trata de como o frontend **implementa, reflete e aplica na
interface** essas regras; o comportamento de servidor é descrito apenas na medida em que o cliente
depende dele. Onde uma regra ainda não existe no backend, o texto indica a limitação de forma
objetiva.

## Índice

| # | Documento | Conteúdo | Prioridade |
|---|-----------|----------|-----------|
| 1 | [Regras de Negócio](01-regras-de-negocio.md) | `RN-xx` — geofencing, duplicidade, validação comunitária, máquina de estados, reincidência, votação, janela de edição | **Prioritário** |
| 2 | [Requisitos Funcionais e Não Funcionais](02-requisitos.md) | `RF-xx` / `RNF-xx` com rastreabilidade ao código | **Prioritário** |
| 3 | [Plano de Projeto](03-plano-de-projeto.md) | Escopo, cronograma, marcos, estado atual, roadmap, versionamento | **Prioritário** |
| 4 | [Perfis e Permissões](04-perfis-e-permissoes.md) | Papéis, matriz Perfil × Ação, autorização no cliente | **Prioritário** |
| 5 | [Backend & Contrato de API (visão do front)](05-backend-contrato.md) | Endpoints consumidos, auth (CPF/JWT), variáveis de ambiente, decisões técnicas | Importante |
| 6 | [Documentação Técnica do Frontend](06-frontend.md) | Estrutura de componentes, rotas, estado, camada de mapa, identidade visual | Importante |
| 7 | [Modelo de Dados (contrato)](07-modelo-de-dados.md) | ER do contrato consumido, decisões geoespaciais, integridade referencial | Importante |
| 8 | [Diagramas consolidados](08-diagramas.md) | Casos de uso, ER, máquina de estados, sequência, arquitetura | Apoio |
| 9 | [Como rodar o projeto](09-como-rodar.md) | Pré-requisitos, `.env`, instalação, Docker, Swagger | Apoio |

---

## Convenções

- **Idioma:** português. **Diagramas:** Mermaid.
- **Identificadores:** `RN-` (regra de negócio), `RF-` (requisito funcional), `RNF-` (requisito não
  funcional) para rastreabilidade.
- **Referências de código** aparecem como `caminho/arquivo.ts` e, quando útil, `arquivo.ts:linha`.

## Design / Protótipo

- 🎨 **Figma — Projeto ZUP:** <https://www.figma.com/design/fB532mbV9oncYHSR0l7i8v/Projeto-ZUP?node-id=4-832&t=AWvNV7uY4aME6paB-0>
  — referência visual (telas, fluxo e identidade) que orienta a implementação documentada em
  [06-frontend.md](06-frontend.md).

## Documentos de apoio (já existentes na raiz)

- [`../README.md`](../README.md) — visão geral, stack, como rodar e Docker.
