# Sistema de Teleprompter Inteligente

Console de operação de teleprompter para jornalistas: gerenciamento de roteiros, controle de velocidade e tamanho da fonte, espelhamento, modo apresentador e documentação de requisitos e arquitetura.

## O que o console faz

- **Tom e títulos sem poluir a leitura:** cada bloco tem um tom (URGENTE, POLICIAL, SÉRIO, SERVIÇO, SÉRIE, LEVE) e uma dica opcional de interpretação. O tom aparece na margem (faixa colorida), na barra superior e na barra **“A seguir”**, sempre com ícone + palavra (nunca só cor).
- **Alerta de mudança de tom:** quando o próximo bloco tem tom bem diferente (diferença de “peso emocional” >= 2), a barra inferior avisa com 25 s de antecedência (barra de progresso) e, nos últimos 8 s, mostra a dica de interpretação. Configurável: Completo, Só cor ou Desligado. O tempo restante é estimado pela rolagem e pela velocidade (com voice tracking passará a usar a posição da fala).
- **Zoom ao vivo (RF07):** fonte (`+` / `−`) e espaçamento ajustáveis sem pausar a rolagem; a palavra sob o marcador é preservada.
- **Alto contraste (RF08):** fundo preto com texto branco ou amarelo (tecla `C`).
- **Marcador visual (RF09):** linha contínua com setas, posição ajustável (tecla `G`).
- As preferências de exibição ficam salvas no navegador.

### Atalhos

| Tecla | Ação |
| --- | --- |
| Espaço | Iniciar / pausar |
| ↑ ↓ | Ajuste manual |
| ← → | Trocar de bloco |
| + − | Tamanho do texto |
| C | Alternar contraste (Normal, Branco, Amarelo) |
| G | Ligar / desligar o marcador |
| Esc | Sair do modo apresentador |

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
