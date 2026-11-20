# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Fixed

- Em telas abaixo de `sm`, os links da navegação e o botão "Sair" chegavam ao leitor de tela sem nome. Agora o rótulo fica oculto só visualmente (`sr-only`) e continua sendo anunciado ([#1](https://github.com/IgorCGouveia/LOOP-WEB/issues/1)).
- O link da página atual agora expõe `aria-current="page"` ([#1](https://github.com/IgorCGouveia/LOOP-WEB/issues/1)).
- Os ícones SVG passaram a ser decorativos (`aria-hidden`), então o leitor de tela não anuncia mais um gráfico vazio.
- O `npm test` voltava erro porque o `src/test/setup.ts`, apontado em `vite.config.ts`, não existia. O arquivo foi criado e registra os matchers do jest-dom.
- **Sessão:** quando o token expirava com várias requisições em voo, cada uma disparava o próprio `/refresh` e o usuário podia cair no login logo depois de uma renovação bem-sucedida. Agora só existe um refresh em andamento por vez, compartilhado também pelo boot ([#10](https://github.com/IgorCGouveia/LOOP-WEB/issues/10)).
- **Sessão:** rede fora, timeout ou 5xx no `/refresh` não mandam mais pro login. No boot aparece "Não foi possível falar com a API" com "Tentar de novo"; no meio da sessão, só a tela que fez a chamada mostra o erro ([#11](https://github.com/IgorCGouveia/LOOP-WEB/issues/11)).
- **Sessão:** depois de sair, a próxima pessoa a logar na mesma aba via os hábitos da anterior. Encerrar a sessão agora limpa também o cache de queries, e as chaves de dados do usuário levam o id da sessão ([#3](https://github.com/IgorCGouveia/LOOP-WEB/issues/3)).
- **Sessão:** um `POST /logout` com falha era ignorado e um reload restaurava a sessão. Agora a app só vai pro login quando o servidor confirma; se falhar, a sessão continua e um toast oferece tentar de novo ([#5](https://github.com/IgorCGouveia/LOOP-WEB/issues/5)).
- **Sessão:** um 401 sem sessão (ex. senha errada no login) não tenta mais refresh e mostra a mensagem da própria API em vez de "Sessão expirada".
- **Perfil:** depois de trocar o nome, o cabeçalho continuava com o nome antigo até um reload ([#26](https://github.com/IgorCGouveia/LOOP-WEB/issues/26)).
- **Perfil:** uma falha ao deletar a conta não dava nenhum aviso. Salvar com todos os campos em branco também não fazia nada visível ([#20](https://github.com/IgorCGouveia/LOOP-WEB/issues/20)).
- **Hábitos:** o histórico mostrava cada check-in um dia antes em fusos negativos, como `America/Sao_Paulo` ([#14](https://github.com/IgorCGouveia/LOOP-WEB/issues/14)).
- **Hábitos:** check-in seguido de "Desfazer último" aparecia como dois check-ins no histórico, aqui e na tela admin ([#17](https://github.com/IgorCGouveia/LOOP-WEB/issues/17)).
- **Hábitos:** um erro ao carregar ou um hábito inexistente deixavam o detalhe num skeleton eterno. Na edição, o formulário aparecia em branco e salvar sobrescrevia a agenda real com a padrão. Agora há estados de erro (com retry) e de "não encontrado", e o formulário só aparece com o hábito carregado ([#15](https://github.com/IgorCGouveia/LOOP-WEB/issues/15)).
- **Hábitos:** apagar a descrição na edição não tinha efeito, porque o texto antigo voltava ([#21](https://github.com/IgorCGouveia/LOOP-WEB/issues/21)).
- **Hábitos:** "Meta por dia" ou "A cada quantos dias" vazios bloqueavam o envio sem mostrar erro. Erros de campo que nenhuma tela mostra agora caem na mensagem geral ([#18](https://github.com/IgorCGouveia/LOOP-WEB/issues/18)).
- **Hábitos:** check-in e desfazer podiam rodar juntos, e o streak exibido virava o da resposta que chegasse por último ([#13](https://github.com/IgorCGouveia/LOOP-WEB/issues/13), [#27](https://github.com/IgorCGouveia/LOOP-WEB/issues/27)).
- **Exclusões:** os botões de deletar (hábito, conta e usuário no admin) ficavam clicáveis durante a requisição e podiam disparar DELETEs duplicados ([#13](https://github.com/IgorCGouveia/LOOP-WEB/issues/13)).
- **Admin:** falhas de carregamento nas telas admin e no histórico apareciam como cabeçalhos sem nada embaixo ([#12](https://github.com/IgorCGouveia/LOOP-WEB/issues/12)). Listas vazias também ([#24](https://github.com/IgorCGouveia/LOOP-WEB/issues/24)).
- **Acessibilidade:** o diálogo de confirmação não era anunciado como diálogo, o Tab escapava dele, o Escape não fazia nada, o foco se perdia ao fechar, e um Enter perdido confirmava a exclusão. Agora o foco inicial fica em "Cancelar" ([#2](https://github.com/IgorCGouveia/LOOP-WEB/issues/2)).
- **Acessibilidade:** erros de formulário não eram ligados ao campo nem anunciados. Agora o campo recebe `aria-invalid` e `aria-describedby`, o foco vai pro primeiro campo inválido, e o erro geral é um alerta ([#4](https://github.com/IgorCGouveia/LOOP-WEB/issues/4)).
- **Acessibilidade:** spinners e skeletons eram silenciosos e agora anunciam "Carregando..." ([#6](https://github.com/IgorCGouveia/LOOP-WEB/issues/6)).
- **Acessibilidade:** toasts não eram anunciados e sumiam em 3s. Agora ficam em live regions (sucesso educado, erro assertivo), duram mais, pausam no hover/foco e têm botão de fechar ([#7](https://github.com/IgorCGouveia/LOOP-WEB/issues/7)).
- **Acessibilidade:** texto branco nos botões primário e destrutivo e a borda dos campos estavam abaixo do contraste WCAG AA ([#8](https://github.com/IgorCGouveia/LOOP-WEB/issues/8)).
- **Acessibilidade:** o título da aba era sempre "LOOP" e o foco não mudava ao trocar de página ([#9](https://github.com/IgorCGouveia/LOOP-WEB/issues/9)).
- **Acessibilidade:** os dias da semana selecionados eram indicados só pela cor. Agora expõem `aria-pressed` num grupo nomeado ([#19](https://github.com/IgorCGouveia/LOOP-WEB/issues/19)).

### Changed

- A navegação usa o `NavLink` do React Router no lugar do cálculo manual de link ativo. Agora a comparação é feita por segmento de URL: `/admin/usuarios` não fica mais ativo em um path como `/admin/usuariosX`.
- Botões primário e destrutivo usam texto escuro, e os campos ganharam uma borda mais forte (`--color-border-strong`) ([#8](https://github.com/IgorCGouveia/LOOP-WEB/issues/8)).
- `Page` recebe uma largura nomeada (`width="sm|md|lg|xl"`) em vez de `className`, e passou a renderizar o `<main>`. A base do `Button` virou `inline-flex` ([#16](https://github.com/IgorCGouveia/LOOP-WEB/issues/16)).
- Links e ações usam as variantes `link`/`inlineLink` do `Button`. A exclusão no admin usa `<Button variant="danger">` ([#22](https://github.com/IgorCGouveia/LOOP-WEB/issues/22)).
- `PageTitle` foi substituído por `PageHeader`, com título, subtítulo, ações e sobretítulo ([#25](https://github.com/IgorCGouveia/LOOP-WEB/issues/25)).
- `AuthStatus` ganhou o estado `'unreachable'` ([#11](https://github.com/IgorCGouveia/LOOP-WEB/issues/11)).

### Added

- `README.md`, `CHANGELOG.md` e `DECISIONS.md`.
- Testes de regressão de acessibilidade da navegação (`src/routes/Nav.test.tsx`).
- Primitivos `SkeletonList`, `LoadingRegion`, `QueryError`, `FormError` e `PageHeader` ([#23](https://github.com/IgorCGouveia/LOOP-WEB/issues/23), [#12](https://github.com/IgorCGouveia/LOOP-WEB/issues/12), [#25](https://github.com/IgorCGouveia/LOOP-WEB/issues/25)).
- Helpers `formatCalendarDate`, `netCheckins`, `usePageTitle`, `useFocusFirstInvalid` e `useLogout`.
- Infra de testes com MSW (`src/test/`) e testes de regressão para as issues de comportamento (sessão, formulários, diálogo, toasts, histórico, telas admin, navegação).
- ADRs 0003 a 0010 em `DECISIONS.md`. As seções de autenticação, acessibilidade, primitivos de UI e testes do README foram atualizadas.

## [0.0.0] - 2026-09-12

### Added

- Scaffold do cliente: Vite, React, TypeScript, Tailwind, React Router, TanStack Query.
- Autenticação com refresh token em cookie e access token em memória.
- Telas de hábitos (lista, detalhe, formulário, check-in e desfazer), perfil e área admin.
- Toasts, diálogo de confirmação e ícones.
- `_redirects` pra fallback da SPA em deploy estático.

[Unreleased]: https://github.com/IgorCGouveia/LOOP-WEB/compare/a6ba88b...HEAD
[0.0.0]: https://github.com/IgorCGouveia/LOOP-WEB/commits/a6ba88b
