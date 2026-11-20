# Registro de decisões (ADRs)

Cada entrada segue o formato de Architecture Decision Record (Michael Nygard): contexto, opções, decisão, motivo e consequências (inclusive o que foi sacrificado).

**Status possíveis:** `Proposta`, que ainda aguarda confirmação do dono do projeto; `Aceita`; `Substituída por ADR-XXXX`; `Descartada`.

Não edite uma ADR aceita pra mudar a decisão. Crie uma nova que a substitua.

| # | Título | Status | Data |
| --- | --- | --- | --- |
| [0001](#adr-0001--access-token-em-memória-e-refresh-em-cookie-httponly) | Access token em memória e refresh em cookie httpOnly | Aceita (registro retroativo) | 2026-09-12 |
| [0002](#adr-0002--rótulos-e-estado-ativo-acessíveis-na-navegação) | Rótulos e estado ativo acessíveis na navegação | Aceita | 2026-11-20 |
| [0003](#adr-0003--refresh-compartilhado-e-falha-transitória-sem-logout) | Refresh compartilhado e falha transitória sem logout | Aceita | 2026-11-20 |
| [0004](#adr-0004--logout-só-conclui-quando-o-servidor-confirma) | Logout só conclui quando o servidor confirma | Aceita | 2026-11-20 |
| [0005](#adr-0005--texto-escuro-sobre-accent-e-danger) | Texto escuro sobre accent e danger | Aceita | 2026-11-20 |
| [0006](#adr-0006--título-por-página-e-foco-no-h1-ao-navegar) | Título por página e foco no h1 ao navegar | Proposta | 2026-11-20 |
| [0007](#adr-0007--fim-de-sessão-único-e-chaves-de-query-por-usuário) | Fim de sessão único e chaves de query por usuário | Proposta | 2026-11-20 |
| [0008](#adr-0008--description-null-limpa-a-descrição-no-patch) | `description: null` limpa a descrição no PATCH | Aceita | 2026-11-20 |
| [0009](#adr-0009--histórico-dobra-eventos-undo-no-client) | Histórico dobra eventos UNDO no client | Proposta | 2026-11-20 |
| [0010](#adr-0010--larguras-nomeadas-e-pageheader) | Larguras nomeadas e PageHeader | Proposta | 2026-11-20 |

---

## ADR-0001 — Access token em memória e refresh em cookie httpOnly

- **Status:** Aceita (registro retroativo, reconstruído a partir dos comentários em `src/App.tsx` e `src/api/client.ts`)
- **Data:** 2026-09-12

### Contexto

A SPA precisa autenticar contra a LOOP API e manter a sessão depois de um reload. Qualquer token que o JavaScript consegue ler fica exposto se houver XSS.

### Opções

1. Guardar o access token e o refresh token no `localStorage`.
2. Guardar o access token só em memória e o refresh token num cookie `httpOnly`.

### Decisão

Opção 2. No boot, a app chama `/refresh` uma vez. Um 401 dispara um único refresh e a requisição original é repetida. O `/refresh` usa uma instância Axios separada, sem interceptors, pra que um 401 dele próprio não entre em loop.

### Consequências

- Um XSS não consegue roubar o refresh token. O access token só existe enquanto a aba está aberta.
- **Sacrificado:** todo F5 custa uma ida extra à API antes da primeira tela autenticada. A API também precisa aceitar CORS com credenciais.
- **Pendente:** se várias requisições receberem 401 ao mesmo tempo, cada uma dispara o seu próprio refresh. Um refresh compartilhado em andamento resolveria isso. O problema aparece como fora de escopo na issue #1. *(Nota de 2026-11-20: resolvido pela [ADR-0003](#adr-0003--refresh-compartilhado-e-falha-transitória-sem-logout).)*

---

## ADR-0002 — Rótulos e estado ativo acessíveis na navegação

- **Status:** Aceita (issue [#1](https://github.com/IgorCGouveia/LOOP-WEB/issues/1))
- **Data:** 2026-11-20

### Contexto

Abaixo do breakpoint `sm`, os rótulos da navegação usavam `hidden` (`display: none`), o que também os remove da árvore de acessibilidade. Os links e o botão "Sair" ficavam só com um SVG sem nome. A página ativa aparecia só pela cor e pela borda.

### Opções

**Nome acessível:**

1. `sr-only sm:not-sr-only` no rótulo: uma única fonte de texto.
2. `aria-label` no link ou botão e manter o `hidden`: duas fontes do mesmo texto.

**Estado ativo:**

1. `NavLink` do React Router: `aria-current` sai da mesma comparação que define o estilo.
2. Manter o cálculo manual de ativo e adicionar `aria-current` à mão.

**Ícones:** `aria-hidden` como padrão no componente `Icon`, ou só nos ícones da navegação.

### Decisão

- Nome acessível: **`sr-only`** (opção 1).
- Estado ativo: **`NavLink`** (opção 1), com `end` em `/habitos` pra manter o comportamento atual.
- Ícones: **`aria-hidden` como padrão no `Icon`**. Hoje todo ícone aparece ao lado de um texto visível.

### Motivo

- Com uma única fonte de texto, o nome anunciado nunca fica diferente do rótulo visível (WCAG 2.5.3, *Label in Name*). Um `aria-label` pode ficar desatualizado em silêncio quando alguém muda o texto.
- No `NavLink`, o estilo e o `aria-current` vêm do mesmo `isActive`, então os dois não têm como discordar. De quebra, a comparação por segmento corrige o caso `/admin/usuariosX`.
- Um SVG sem `<title>` não tem nada útil pra anunciar em lugar nenhum do app. Por isso o padrão decorativo é seguro, e cada ícone novo já nasce correto.

### Consequências

- **Sacrificado:** `not-sr-only` força `position: static` no rótulo a partir de `sm`. Se um dia o rótulo precisar de outro `position`, essas classes vão conflitar.
- **Sacrificado:** um ícone que precise carregar significado sozinho tem que optar por isso explicitamente (`aria-hidden={false}`, `role="img"`, `aria-label`). Esquecer disso o deixa mudo.
- **Mantido:** em `/habitos/:id` nenhum link aparece ativo, como já era antes. Pra marcar "Hábitos" nas subrotas, basta remover o `end`.

---

## ADR-0003 — Refresh compartilhado e falha transitória sem logout

- **Status:** Aceita (issues [#10](https://github.com/IgorCGouveia/LOOP-WEB/issues/10) e [#11](https://github.com/IgorCGouveia/LOOP-WEB/issues/11); o modelo de estado foi escolhido pelo dono do projeto)
- **Data:** 2026-11-20

### Contexto

Cada requisição que recebia 401 disparava o próprio `POST /refresh`. Se a API rotaciona o refresh token com detecção de reuso, o segundo refresh é recusado e derruba a sessão que o primeiro acabou de renovar. O efeito duplo do StrictMode no boot tinha a mesma corrida. Além disso, qualquer falha do `/refresh` (rede, timeout de cold start, 5xx) era tratada como "não logado": o usuário ia pro login com um cookie válido e perdia o que estava digitando.

### Opções

**Concorrência:** uma promise de refresh compartilhada no módulo, ou uma fila de requisições pendentes.

**Falha transitória no boot:**

1. Novo `AuthStatus` `'unreachable'`, com tela de "API indisponível" e retry.
2. Ficar em `'checking'` e repetir com backoff até ter uma resposta definitiva.

### Decisão

- Uma promise compartilhada (`refreshSession` em `src/api/client.ts`). Os 401 paralelos, o boot e o efeito duplo do StrictMode aguardam a mesma promise. O efeito no store acontece uma vez por refresh, dentro dela.
- Só 401/403 do `/refresh` encerram a sessão. Rede e 5xx não mexem no store: no meio da sessão, o erro original volta pra quem chamou; no boot, o status vira **`'unreachable'`** (opção 1).
- Um 401 de requisição **sem** `Authorization` (ex. senha errada no `/login`) não tenta refresh e devolve o erro da própria API.

### Motivo

- Um refresh por expiração dá um único resultado de sessão, com ou sem rotação de token.
- Um status explícito deixa a tela honesta ("não consegui falar com a API") e dá ao usuário um botão, em vez de um spinner infinito ou um login desnecessário.

### Consequências

- Todo consumidor de `AuthStatus` precisa tratar `'unreachable'`. Hoje: `ProtectedRoute` e `AdminRoute` mostram `SessionUnreachable`; `PublicOnlyRoute` deixa o login acessível; `Nav` só aparece em `'authenticated'`.
- **Sacrificado:** não há retry automático. Se a API voltar, o usuário precisa clicar em "Tentar de novo" (ou recarregar).
- Testes: `src/api/client.test.ts` e `src/routes/navigation.test.tsx`.

---

## ADR-0004 — Logout só conclui quando o servidor confirma

- **Status:** Aceita (issue [#5](https://github.com/IgorCGouveia/LOOP-WEB/issues/5); política escolhida pelo dono do projeto)
- **Data:** 2026-11-20

### Contexto

O cookie de refresh é `httpOnly`, então só o servidor consegue invalidá-lo. Se o `POST /logout` falhava, o erro era engolido e a app mostrava o login. O próximo reload restaurava a sessão anterior em silêncio, inclusive pra outra pessoa no mesmo navegador.

### Opções

1. Bloquear: manter a sessão local e mostrar um erro com retry até o `/logout` funcionar.
2. Limpar o estado local e avisar que a sessão no servidor pode continuar ativa.
3. Guardar um "logout pendente" e repeti-lo antes do próximo refresh de boot.

### Decisão

Opção 1, num hook único (`useLogout`) usado pelo "Sair" e pela exclusão de conta. Um 401/403 do `/logout` conta como sucesso: o servidor já não reconhece a sessão (ex. conta recém-deletada).

### Motivo

É a única opção em que a tela de login nunca mente: se ela aparece, um reload não traz a sessão de volta.

### Consequências

- **Sacrificado:** offline, o usuário não consegue "sair" na hora. Ele fica na tela atual com um toast de erro e "Tentar de novo".
- Depois de deletar a conta, se o `/logout` falhar por rede, a pessoa continua em `/perfil` com o retry.
- Teste: `src/features/auth/logout.test.tsx`.

---

## ADR-0005 — Texto escuro sobre accent e danger

- **Status:** Aceita (issue [#8](https://github.com/IgorCGouveia/LOOP-WEB/issues/8); direção da paleta escolhida pelo dono do projeto)
- **Data:** 2026-11-20

### Contexto

Os botões primários usavam texto branco sobre `--color-accent` `#8b7bff` (3.29:1; 2.55:1 no hover) e o "Confirmar" destrutivo usava branco sobre `--color-danger` `#ff6b6b` (2.78:1). O mínimo do WCAG AA pra esse tamanho de texto é 4.5:1. A borda dos campos (`#242832` sobre `#0b0d12`) tinha 1.32:1, abaixo dos 3:1 exigidos pra contraste não textual.

### Opções

1. Manter os fundos e trocar o texto dos botões pelo `--color-bg` escuro.
2. Criar tokens `-strong` mais escuros pros fundos e manter o texto branco.

### Decisão

Opção 1. Pra borda dos campos, foi criado o token `--color-border-strong` `#5f6879`. A borda de cards e divisórias continua com `--color-border`.

| Par | Contraste |
| --- | --- |
| `bg` sobre `accent` / `accent-hover` | 5.90:1 / 7.62:1 |
| `bg` sobre `danger` / `danger-hover` | 7.00:1 / 8.39:1 |
| `border-strong` contra `bg` / `surface` | 3.46:1 / 3.26:1 |

### Motivo

É a menor mudança visual: as cores da marca ficam iguais. Como o hover clareia o fundo, o contraste sobe no hover em vez de cair.

### Consequências

- Texto sobre `accent`/`danger` passa a ser sempre `text-bg`. Isso vale também pros dias da semana selecionados.
- **Sacrificado:** botões preenchidos ficam com texto escuro, uma mudança de identidade visual.

---

## ADR-0006 — Título por página e foco no h1 ao navegar

- **Status:** Proposta (issue [#9](https://github.com/IgorCGouveia/LOOP-WEB/issues/9))
- **Data:** 2026-11-20

### Contexto

O `document.title` era sempre "LOOP" e nada movia o foco numa troca de rota. O leitor de tela não anunciava a página nova, e o foco ficava num link que tinha acabado de sumir.

### Opções

1. Um hook `usePageTitle(title)` chamado por cada página, com o `PageHeader` focando o h1 no mount.
2. Um mapa central rota → título, com um efeito no `AppRoutes`.

### Decisão

Opção 1. O título fica como `"<página> · LOOP"`. O h1 do `PageHeader` tem `tabIndex={-1}` e recebe foco quando a entrada do histórico não é a inicial (`location.key !== 'default'`).

### Motivo

A página de detalhe precisa do nome do hábito no título, e só ela o conhece. Focar no mount do `PageHeader` também cobre as páginas que carregam antes de mostrar o h1: o foco vai pro h1 quando ele aparece.

### Consequências

- O foco não muda no primeiro carregamento nem em mudanças de estado dentro da página.
- Um redirect (`<Navigate>`) cria uma entrada nova no histórico, então o h1 de destino recebe foco.
- **Sacrificado:** toda página nova precisa lembrar de chamar `usePageTitle` e usar `PageHeader`. Não existe uma checagem central.

---

## ADR-0007 — Fim de sessão único e chaves de query por usuário

- **Status:** Proposta (issue [#3](https://github.com/IgorCGouveia/LOOP-WEB/issues/3))
- **Data:** 2026-11-20

### Contexto

Três caminhos encerravam a sessão (logout, exclusão de conta, refresh recusado no interceptor). Todos limpavam só o Zustand. A próxima pessoa a logar na mesma aba via os hábitos da anterior até o refetch chegar, ou de vez, se o refetch falhasse.

### Decisão

- O `QueryClient` virou um singleton (`src/lib/queryClient.ts`), compartilhado pelo provider e pelo código fora do React.
- `clearLocalSession()` (`src/features/auth/session.ts`) é o único jeito de encerrar a sessão no client: limpa o store **e** chama `queryClient.clear()`.
- Toda chave de dado do usuário começa com `['session', userId, ...]` (`src/lib/queryKeys.ts`). Até numa troca de identidade sem logout, a sessão nova nunca reusa entradas da anterior.

### Consequências

- Toda query nova de dado do usuário precisa usar `queryKeys`. Uma chave literal escapa dessa proteção.
- **Sacrificado:** um logout seguido de login com o mesmo usuário refaz todas as requisições, sem cache quente.

---

## ADR-0008 — `description: null` limpa a descrição no PATCH

- **Status:** Aceita (issue [#21](https://github.com/IgorCGouveia/LOOP-WEB/issues/21); representação escolhida pelo dono do projeto)
- **Data:** 2026-11-20

### Contexto

Na edição, apagar a descrição virava `undefined`, então a chave sumia do PATCH parcial e a API mantinha o texto antigo.

### Decisão

Na edição, se a descrição original não era vazia e o campo ficou vazio, o PATCH manda `description: null`. Se as duas estavam vazias, a chave continua omitida. `UpdateHabitVal` aceita `null`, e a edição valida com `UpdateHabitVal` (não mais com `CreateHabitVal`).

### Motivo

`Habit.description` já é `string | null` na resposta da API. `null` é a representação de "sem descrição" no próprio contrato.

### Consequências

- **Pendente:** o contrato do PATCH não está neste repositório. Se a API recusar `null`, troque pelo valor de limpeza documentado nela (provavelmente `''`).
- Teste: `src/features/habits/HabitFormPage.test.tsx`.

---

## ADR-0009 — Histórico dobra eventos UNDO no client

- **Status:** Proposta (issue [#17](https://github.com/IgorCGouveia/LOOP-WEB/issues/17))
- **Data:** 2026-11-20

### Contexto

A API guarda check-ins como um log de eventos: desfazer cria uma linha `UNDO`. O histórico mostrava cada evento como um check-in, então check-in + desfazer aparecia como dois check-ins no mesmo dia.

### Opções

1. Dobrar o log em check-ins líquidos.
2. Mostrar as linhas `UNDO` com um rótulo diferente.

### Decisão

Opção 1, num helper puro (`netCheckins` em `src/lib/checkins.ts`) usado pelo detalhe do hábito e pela tela admin do usuário. Cada `UNDO` cancela o `CHECKIN` mais recente anterior a ele no mesmo hábito e dia. O pareamento usa `checkedAt`, e a saída preserva a ordem da API. Na tela admin, o corte em 20 acontece depois da dobra.

### Consequências

- Se a API passar a filtrar `UNDO` no servidor, o helper vira um no-op.
- **Sacrificado:** o histórico deixa de mostrar que houve um desfazer. Se isso for útil pra auditoria, a opção 2 pode voltar como visão separada.

---

## ADR-0010 — Larguras nomeadas e PageHeader

- **Status:** Proposta (issues [#16](https://github.com/IgorCGouveia/LOOP-WEB/issues/16), [#22](https://github.com/IgorCGouveia/LOOP-WEB/issues/22), [#23](https://github.com/IgorCGouveia/LOOP-WEB/issues/23), [#25](https://github.com/IgorCGouveia/LOOP-WEB/issues/25))
- **Data:** 2026-11-20

### Contexto

`Page` fixava `max-w-2xl` e as páginas sobrescreviam isso com outra classe `max-w-*` via `className`. Quem vencia era a ordem do CSS gerado, não a ordem escrita. O h1 tinha cinco cópias de estilo, os skeletons de lista eram montados à mão em cada tela, e os links usavam classes avulsas.

### Decisão

- `Page` recebe `width: 'sm' | 'md' | 'lg' | 'xl'` (24, 32, 42 e 48rem) e não aceita mais `className`. O `Page` também passou a ser o `<main>` da página.
- `PageHeader` (título, subtítulo, ações e sobretítulo) é o dono do h1 e do espaçamento abaixo dele. O antigo `PageTitle` saiu.
- A base do `Button` é `inline-flex items-center justify-center gap-2`. Ícone + texto não precisam mais de `flex` no call site.
- Novas variantes: `link` (ação com padding de botão, pra parear com `danger`) e `inlineLink` (link dentro de texto ou célula de tabela).
- `SkeletonList({ rows, size })`, com um gap único e uma altura por tipo (`line`, `row`, `card`).

### Consequências

- `danger` e `ghost` passam a ser `inline-flex`. Antes elas não tinham utilitário de display.
- **Sacrificado:** uma página que precise de uma largura fora das quatro exige um token novo, não uma classe avulsa.

