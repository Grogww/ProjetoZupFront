# Documentação — ZUP X (Frontend)

> **ZUP — Zeladoria Urbana Participativa** · Município de **Videira/SC**
> Plataforma cívica para registro georreferenciado e acompanhamento de problemas urbanos.

Esta pasta reúne a documentação de projeto do **frontend ZUP X** (React + Vite + TypeScript),
organizada para avaliação. O conteúdo foi extraído diretamente do código-fonte deste repositório
(`src/lib/`, `src/hooks/`, `src/components/`, `src/data/`, `src/pages/`).

> ⚠️ **Importante sobre o escopo deste repositório.** Este é **apenas o frontend**. A **fonte da
> verdade** das regras de negócio é o **backend ProjetoZup** (Node/Express + PostgreSQL/PostGIS):
> <https://github.com/Grogww/ProjetoZup>. Aqui documentamos as regras **como o front as consome,
> reflete e impõe na UI**, e referenciamos o backend para tudo que é servidor-side. Sempre que uma
> regra depende de confirmação no backend, ela aparece marcada com `> ⚠️ A confirmar:`.

> ✅ **Validação cruzada com o backend (2026-06-16).** O código do backend ProjetoZup foi revisado
> (controllers, services, models, rotas e os docs do próprio back). A maioria dos pontos antes
> "a confirmar" foi **resolvida** e aparece nos documentos como **✅ Confirmado no back**, com
> referência ao arquivo. Permanecem em aberto apenas itens que **o próprio backend ainda não
> implementou/documenta** (lógica de validador elegível; reprojeção SIRGAS 2000→WGS84 e geração do
> `center_point`) e decisões do front/processo (troca de tiles; cronograma/equipe). O backend foi
> clonado **fora** deste repositório (pasta irmã `../ProjetoZup-backend`, não versionada aqui).

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
- **`> ⚠️ A confirmar:`** marca pontos cuja decisão final mora no backend e ainda não está
  confirmada pelo contrato visível ao front.
- **Referências de código** aparecem como `caminho/arquivo.ts` e, quando útil, `arquivo.ts:linha`.

## Design / Protótipo

- 🎨 **Figma — Projeto ZUP:** <https://www.figma.com/design/fB532mbV9oncYHSR0l7i8v/Projeto-ZUP?node-id=4-832&t=AWvNV7uY4aME6paB-0>
  — referência visual (telas, fluxo e identidade) que orienta a implementação documentada em
  [06-frontend.md](06-frontend.md).

## Documentos de apoio (já existentes na raiz)

- [`../README.md`](../README.md) — visão geral, stack, como rodar e Docker.
