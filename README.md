# Padel Holo

Rede social de resenha de padel com coleção de cartas. Ganhou a partida? Você captura as cartas holográficas da dupla adversária, abre o pacote e guarda no álbum. Os atributos de cada jogador vêm só das avaliações dos outros: ninguém cria a própria carta.

```bash
npm install
npm run dev
```

## Regras
- **Registrar partida** cria um post no feed. Cada vencedor ganha um pacote com uma cópia da carta de cada perdedor, com os atributos congelados no dia do jogo.
- **Raridade da carta capturada:** Edição Pneu (teve 6/0) > Radiante (virada) > Holo (venceu dupla de OVR maior) > Comum. Só vale depois que um perdedor confirma a derrota; até lá a carta aparece como Comum.
- **Rookie:** a primeira carta de um jogador capturada por qualquer pessoa.
- **Atributos** = média da última avaliação de cada usuário. Qualquer usuário avalia qualquer jogador, menos a si mesmo.
- **Efeito da carta do jogador** vem do nível: Bronze → básico, Prata → holo, Ouro → ouro, Elite → cosmos.
- Jogador que não está no app entra como **provisório**: dá para capturar, mas não confirma derrota até entrar.

## Código
- `src/lib/types.ts`, `rules.ts` — modelo e regras do jogo (raridade, OVR, cartas).
- `src/lib/db.ts` — operações puras sobre os dados; é o contrato do futuro backend.
- `src/lib/store.ts` — store local (localStorage) com seed de demonstração em `seed.ts`. A barra "Modo demo" troca o usuário logado.
- `src/components/HoloCard.*`, `effects.css`, `src/lib/motion.ts`, `textures.ts` — a carta holográfica (física de mola, efeitos, foil em relevo).
- `src/components/PackOpening.*` — abertura de pacote; `Book.*` — álbum com virada de página 3D.
- `src/screens/` — Resenha (feed), Coleção (Álbum, Grade, Lista, Vitrine) e Perfil.

## Próximos passos
1. Backend (Supabase): login, dados compartilhados, convite e reivindicação de carta provisória.
2. Revanche com aposta de carta, card da vergonha, apelidos votados.
3. Resenha semanal em imagem para o WhatsApp; temporadas e missões.
