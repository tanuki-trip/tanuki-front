# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## GitHub Pages deployment

Pull requests run formatting, lint, test, and production-build checks. A push to
`main` runs the same checks and deploys the result to GitHub Pages.

Before the first deployment:

1. In **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Add the Firebase values from `.env.example` as repository-level Actions
   variables in **Settings → Secrets and variables → Actions → Variables**.
   `VITE_MAP_STYLE_URL` is optional.
3. If Firebase Authentication is enabled, add `tanuki-trip.github.io` to the
   Firebase Authentication authorized domains.

When the Firebase variables are omitted, the site still builds and runs in guest
mode. The project site is published under `/tanuki-front/`.
