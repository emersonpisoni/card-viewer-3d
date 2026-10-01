# Padel Holo

Cards holográficos de jogadores de padel, inspirados em [poke-holo](https://poke-holo.simey.me/).
O jogador sobe a foto, preenche os atributos e escolhe o efeito holo; o card reage à luz conforme o mouse, o dedo ou o giroscópio do celular.

```bash
npm install
npm run dev
```

## Como funciona

- `src/lib/motion.ts` — física de mola. Escreve variáveis CSS (`--rotate-x`, `--pointer-x`, `--background-x`, …) direto no elemento, sem re-render do React.
- `src/components/effects.css` — os 8 efeitos (Básico, Holo, Reverse, Radiante, Glitter, Cosmos, Ouro, Rainbow), todos em CSS puro com gradientes, `mix-blend-mode` e ruído SVG.
- `src/lib/textures.ts` — texturas de foil geradas em SVG (quadra, bolinhas, losangos, ondas, estrelas) + grão de metal escovado. A gravação serve de máscara para o brilho e de mapa de altura para o relevo (sombra e realce deslocados conforme a luz).
- `src/components/HoloCard.css` — layout do card; tudo dimensionado em `cqw`, então o card escala de miniatura até tela cheia.
- Raridade da moldura (Bronze / Prata / Ouro / Elite) vem do OVR = média dos 8 atributos.
- Os dados ficam no `localStorage` (as fotos são reduzidas para 900px).

## Roadmap

1. Backend + login (Supabase/Firebase) e link público `/p/<usuario>` para compartilhar o card.
2. Exportar PNG/vídeo curto do card brilhando para stories.
3. Atributos validados: autoavaliação + votos de parceiros/adversários, ou integração com rankings/torneios.
4. Evolução do card com resultados de partidas; efeitos desbloqueáveis por conquistas.
5. Monetização: efeitos premium, card físico impresso holográfico, cards oficiais para clubes/torneios.
