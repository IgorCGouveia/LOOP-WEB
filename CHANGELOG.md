# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Fixed

- Em telas abaixo de `sm`, os links da navegação e o botão "Sair" chegavam ao leitor de tela sem nome. Agora o rótulo fica oculto só visualmente (`sr-only`) e continua sendo anunciado ([#1](https://github.com/IgorCGouveia/LOOP-WEB/issues/1)).
- O link da página atual agora expõe `aria-current="page"` ([#1](https://github.com/IgorCGouveia/LOOP-WEB/issues/1)).
- Os ícones SVG passaram a ser decorativos (`aria-hidden`), então o leitor de tela não anuncia mais um gráfico vazio.

### Changed

- A navegação usa o `NavLink` do React Router no lugar do cálculo manual de link ativo. Agora a comparação é feita por segmento de URL: `/admin/usuarios` não fica mais ativo em um path como `/admin/usuariosX`.

### Added

- `README.md`, `CHANGELOG.md` e `DECISIONS.md`.

## [0.0.0] - 2026-09-12

### Added

- Scaffold do cliente: Vite, React, TypeScript, Tailwind, React Router, TanStack Query.
- Autenticação com refresh token em cookie e access token em memória.
- Telas de hábitos (lista, detalhe, formulário, check-in e desfazer), perfil e área admin.
- Toasts, diálogo de confirmação e ícones.
- `_redirects` pra fallback da SPA em deploy estático.

[Unreleased]: https://github.com/IgorCGouveia/LOOP-WEB/compare/a6ba88b...HEAD
[0.0.0]: https://github.com/IgorCGouveia/LOOP-WEB/commits/a6ba88b
