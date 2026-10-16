# Sistema de Teleprompter Inteligente

Console de operação de teleprompter para jornalistas: gerenciamento de roteiros, controle de velocidade e tamanho da fonte, espelhamento, modo apresentador e documentação de requisitos e arquitetura.

Feito com React 19, Vite e Tailwind CSS v4. Os roteiros ficam salvos no `localStorage` do navegador.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
npm run preview
```

## Publicar no GitHub Pages

1. Suba o projeto para um repositório no GitHub (branch `main`).
2. No repositório, vá em **Settings > Pages** e em **Source** escolha **GitHub Actions**.
3. A cada `git push` na `main`, o workflow `.github/workflows/deploy.yml` faz o build e publica o site em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
