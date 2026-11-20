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
| `npm test` | Vitest (ver [Problemas conhecidos](#problemas-conhecidos)) |

## Estrutura

```
src/
├── api/          cliente HTTP, envelope de resposta e um módulo por recurso da API
├── components/   primitivas de UI compartilhadas (ui, ícones, toast, diálogo)
├── features/     uma pasta por domínio: auth, habits, profile, admin
├── lib/          schemas Zod e helpers de erro de formulário
└── routes/       navegação e guards de rota (Protected, PublicOnly, Admin)
```

## Autenticação

- O **access token** fica só em memória (Zustand). Ele nunca vai pro `localStorage`.
- O **refresh token** fica num cookie `httpOnly` controlado pela API.
- No boot, a app chama `/refresh` uma vez pra recuperar a sessão depois de um F5.
- Quando uma requisição recebe 401, a app tenta um único refresh e repete a requisição. Se o refresh falhar, a sessão é encerrada.

A justificativa está no [ADR-0001](DECISIONS.md#adr-0001--access-token-em-memória-e-refresh-em-cookie-httponly).

## Deploy

O build é estático. `public/_redirects` manda todas as rotas pro `index.html`, pra que o fallback da SPA funcione em hosts como Netlify e Cloudflare Pages.

## Acessibilidade

Regras que o código segue. Siga as mesmas ao mexer na UI:

- Os ícones de `components/icons.tsx` são **decorativos por padrão** (`aria-hidden`). Um ícone sozinho que carrega significado precisa de `role="img"` e `aria-label`.
- Quando um texto precisa sumir em telas pequenas, use `sr-only` e não `hidden`, pra ele continuar no leitor de tela.
- Indique a página ativa da navegação com `aria-current`, usando o `NavLink` do React Router.

Contexto no [ADR-0002](DECISIONS.md#adr-0002--rótulos-e-estado-ativo-acessíveis-na-navegação).

## Problemas conhecidos

- `vite.config.ts` aponta `test.setupFiles` pra `src/test/setup.ts`, mas esse arquivo não existe. Por isso o `npm test` ainda não roda.

## Documentação do projeto

- [CHANGELOG.md](CHANGELOG.md): mudanças por versão, no formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
- [DECISIONS.md](DECISIONS.md): registro de decisões de arquitetura (ADRs).

## Licença

[MIT](LICENSE)
