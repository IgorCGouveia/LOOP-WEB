# loop-web

Cliente web da **LOOP API**, um app de acompanhamento de hábitos com check-ins diários, sequências (streaks) e área administrativa.

SPA em React + TypeScript, servida como site estático.

## Stack

| Camada | Escolha |
| --- | --- |
| Build / dev server | Vite |
| UI | React 19, Tailwind CSS v4 |
| Roteamento | React Router v7 |
| Dados do servidor | TanStack Query + Axios |
| Estado de sessão | Zustand (só em memória) |
| Validação | Zod |
| Testes | Vitest, Testing Library, MSW, jsdom |
| Lint | oxlint |

## Pré-requisitos

- Node.js 24 ou mais recente (mesma versão de `@types/node`)
- Uma instância da LOOP API rodando (por padrão em `http://localhost:3333`)

## Primeiros passos

```bash
npm ci
cp .env.example .env   # ajuste VITE_API_URL se a API não estiver em localhost:3333
npm run dev
```

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `VITE_API_URL` | sim | URL base da LOOP API. A API precisa aceitar CORS com credenciais vindas da origem do front, porque o cookie de refresh viaja em todas as requisições (`withCredentials`). |

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Dev server com HMR |
| `npm run build` | Checagem de tipos (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run lint` | oxlint |
| `npm test` | Vitest (jsdom + Testing Library + MSW; ver [Testes](#testes)) |

## Estrutura

```
src/
├── api/          cliente HTTP, envelope de resposta e um módulo por recurso da API
├── components/   primitivas de UI compartilhadas (ui, ícones, toast, diálogo)
├── features/     uma pasta por domínio: auth, habits, profile, admin
├── lib/          schemas Zod, QueryClient e chaves de query, helpers (datas, check-ins, erros de formulário, título, foco)
├── routes/       navegação e guards de rota (Protected, PublicOnly, Admin)
└── test/         setup do Vitest, servidor MSW, render com providers e fixtures
```

## Autenticação

- O **access token** fica só em memória (Zustand). Ele nunca vai pro `localStorage`.
- O **refresh token** fica num cookie `httpOnly` controlado pela API.
- No boot, a app chama `/refresh` pra recuperar a sessão depois de um F5 (`src/features/auth/bootstrap.ts`).
- Quando uma requisição autenticada recebe 401, a app renova a sessão e repete a requisição. Só existe **um `/refresh` em andamento por vez**: os 401 paralelos e o boot aguardam a mesma promise (`refreshSession` em `src/api/client.ts`).
- Só uma **recusa da credencial** (401/403 do `/refresh`) encerra a sessão. Rede fora, timeout ou 5xx deixam a sessão como está. No boot, a app entra no estado `unreachable` e as rotas protegidas mostram "Tentar de novo" em vez de mandar pro login.
- **Sair** só leva ao login depois que o servidor confirma o `POST /logout`. Se ele falhar, a sessão continua e um toast oferece tentar de novo (`useLogout`).
- Encerrar a sessão sempre limpa o store **e** o cache do TanStack Query (`clearLocalSession`). As chaves de query de dados do usuário levam o id da sessão (`src/lib/queryKeys.ts`).

Estados da sessão (`AuthStatus`):

| Status | Quando | O que as rotas protegidas fazem |
| --- | --- | --- |
| `checking` | boot, aguardando `/refresh` | spinner "Verificando sessão..." |
| `authenticated` | sessão válida | renderizam a página |
| `guest` | sem sessão, ou o servidor recusou a credencial | redirecionam pro `/login` |
| `unreachable` | `/refresh` do boot falhou por rede ou 5xx | "Não foi possível falar com a API" + retry |

Justificativas: [ADR-0001](DECISIONS.md#adr-0001--access-token-em-memória-e-refresh-em-cookie-httponly), [ADR-0003](DECISIONS.md#adr-0003--refresh-compartilhado-e-falha-transitória-sem-logout), [ADR-0004](DECISIONS.md#adr-0004--logout-só-conclui-quando-o-servidor-confirma) e [ADR-0007](DECISIONS.md#adr-0007--fim-de-sessão-único-e-chaves-de-query-por-usuário).

## Deploy

O build é estático. `public/_redirects` manda todas as rotas pro `index.html`, pra que o fallback da SPA funcione em hosts como Netlify e Cloudflare Pages.

## Acessibilidade

Regras que o código segue. Siga as mesmas ao mexer na UI:

- Os ícones de `components/icons.tsx` são **decorativos por padrão** (`aria-hidden`). Um ícone sozinho que carrega significado precisa de `role="img"` e `aria-label`.
- Quando um texto precisa sumir em telas pequenas, use `sr-only` e não `hidden`, pra ele continuar no leitor de tela.
- Indique a página ativa da navegação com `aria-current`, usando o `NavLink` do React Router.
- **Formulários:** todo campo passa por `<Field>`, que liga rótulo, `aria-invalid` e `aria-describedby` à mensagem de erro. Use `useFocusFirstInvalid` pra levar o foco ao primeiro campo inválido depois do submit. Erros que não são de um campo usam `<FormError>` (`role="alert"`). Um grupo de controles sem `aria-invalid` (ex. dias da semana) se marca com `data-invalid` e `tabIndex={-1}`.
- **Toggles** expõem o estado com `aria-pressed`, não só com cor.
- **Carregamento:** use `PageSpinner`, `SkeletonList` ou `LoadingRegion`. Eles anunciam o estado (`role="status"`, `aria-busy`). Nunca use `Skeleton` solto fora de um deles.
- **Erros de query:** use `<QueryError>` com `refetch`. Lista vazia usa `<EmptyState>`. Nunca renderize um cabeçalho de tabela sem linhas.
- **Toasts** caem numa live region: sucesso `polite`, erro `assertive`. Eles pausam no hover/foco e têm botão de fechar.
- **Diálogo de confirmação:** `role="alertdialog"`, foco inicial em "Cancelar", Tab preso, Escape cancela e o foco volta pra quem abriu.
- **Páginas:** chame `usePageTitle(...)` e use `<PageHeader>`. O h1 recebe foco quando a página é aberta por navegação.
- **Contraste:** texto sobre `accent`/`danger` usa `text-bg` (escuro). Bordas de campo usam `border-border-strong` (≥ 3:1).

Contexto no [ADR-0002](DECISIONS.md#adr-0002--rótulos-e-estado-ativo-acessíveis-na-navegação), [ADR-0005](DECISIONS.md#adr-0005--texto-escuro-sobre-accent-e-danger) e [ADR-0006](DECISIONS.md#adr-0006--título-por-página-e-foco-no-h1-ao-navegar).

## Primitivos de UI

`src/components/ui.tsx` concentra o vocabulário visual. Prefira os primitivos a classes avulsas:

| Primitivo | Uso |
| --- | --- |
| `Page width="sm \| md \| lg \| xl"` | contêiner da página (24, 32, 42 e 48rem; padrão `lg`). Não passe `max-w-*` por className. |
| `PageHeader title subtitle actions eyebrow` | h1 da página + espaçamento abaixo dele |
| `Button variant` / `linkButtonClass(variant)` | `primary`, `secondary`, `danger`, `dangerSolid`, `ghost`, `link` (ação com padding de botão), `inlineLink` (link dentro de texto ou tabela) |
| `Field`, `Input`, `Select`, `Textarea`, `FormError` | formulários acessíveis |
| `SkeletonList size="line \| row \| card"`, `LoadingRegion`, `PageSpinner` | carregamento |
| `QueryError`, `EmptyState` | erro e vazio |

Contexto no [ADR-0010](DECISIONS.md#adr-0010--larguras-nomeadas-e-pageheader).

## Testes

- `src/test/server.ts` exporta um servidor MSW. Cada teste registra os próprios handlers com `server.use(...)`, usando paths com prefixo `*` (ex. `'*/me/habits'`). Requisição sem handler falha o teste.
- `src/test/setup.ts` desliga retries de query e, entre testes, reseta os handlers, o cache e o store de sessão.
- `src/test/render.tsx` tem `renderApp(routes, path)`, com os mesmos providers do `main.tsx`, e `login()` pra abrir uma sessão.
- Testes de regressão citam a issue no nome ou num comentário (ex. `Regression for #14`).

## Documentação do projeto

- [CHANGELOG.md](CHANGELOG.md): mudanças por versão, no formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
- [DECISIONS.md](DECISIONS.md): registro de decisões de arquitetura (ADRs).

## Licença

[MIT](LICENSE)
