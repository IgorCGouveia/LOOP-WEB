# Registro de decisões (ADRs)

Cada entrada segue o formato de Architecture Decision Record (Michael Nygard): contexto, opções, decisão, motivo e consequências (inclusive o que foi sacrificado).

**Status possíveis:** `Proposta`, que ainda aguarda confirmação do dono do projeto; `Aceita`; `Substituída por ADR-XXXX`; `Descartada`.

Não edite uma ADR aceita pra mudar a decisão. Crie uma nova que a substitua.

| # | Título | Status | Data |
| --- | --- | --- | --- |
| [0001](#adr-0001--access-token-em-memória-e-refresh-em-cookie-httponly) | Access token em memória e refresh em cookie httpOnly | Aceita (registro retroativo) | 2026-09-12 |
| [0002](#adr-0002--rótulos-e-estado-ativo-acessíveis-na-navegação) | Rótulos e estado ativo acessíveis na navegação | Aceita | 2026-11-20 |

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
- **Pendente:** se várias requisições receberem 401 ao mesmo tempo, cada uma dispara o seu próprio refresh. Um refresh compartilhado em andamento resolveria isso. O problema aparece como fora de escopo na issue #1.

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
