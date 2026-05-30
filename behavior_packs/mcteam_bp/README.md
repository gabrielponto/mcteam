# MCTeam - Guerra Semanal

Behavior Pack para Minecraft Bedrock que divide jogadores automaticamente entre equipe azul e equipe vermelha, conta pontuacao semanal e libera uma sala de premiacao para a equipe vencedora.

## Regras implementadas

- Nao existe lobby ou espera.
- Jogador sem equipe recebe uma equipe ao entrar.
- A atribuicao equilibra os times e permite no maximo 1 jogador de diferenca.
- As equipes sao reiniciadas a cada ciclo semanal.
- Abate de inimigo soma 1 ponto para a equipe do assassino.
- Toda morte tira 1 ponto da equipe do jogador morto, inclusive mortes por ambiente.
- Abate de jogador da mesma equipe nao soma ponto e aplica -5 pontos na equipe do assassino.
- Em empate, vence a equipe com mais abates.
- Se os abates tambem empatarem, vence a equipe com menos mortes.
- Se continuar empatado, a premiacao e liberada para todos os jogadores que tinham equipe.
- Abates repetidos do mesmo assassino contra a mesma vitima entram em cooldown de 120 segundos para evitar farm.
- O nome acima do jogador recebe prefixo e cor da equipe quando a plataforma permitir alterar `nameTag`.
- A cada morte, o placar das equipes e anunciado para todos.
- A sala de premiacao e gerada automaticamente nas coordenadas configuradas.

## Defaults configurados

- Fechamento semanal: segunda-feira 00:00 UTC.
- Janela de premiacao: 24 horas.
- Sala de premiacao: overworld, area de `x=0..15`, `y=70..85`, `z=0..15`.
- Entrada da sala de premiacao: `x=7.5`, `y=71`, `z=7.5`.
- Saida de jogadores sem acesso: `x=0`, `y=80`, `z=-8`.
- Recompensa: baus exclusivos na sala e alguns drops controlados.

Os valores podem ser ajustados em `scripts/config.js`.

## Comandos administrativos

Execute como operador usando `/scriptevent`.

```mcfunction
/scriptevent mcteam:status
/scriptevent mcteam:force_end_week
/scriptevent mcteam:reset_week
/scriptevent mcteam:set_team <player> <blue|red>
/scriptevent mcteam:open_rewards
/scriptevent mcteam:close_rewards
/scriptevent mcteam:reward_tp
```

## Instalacao

Use uma destas opcoes:

- Importe `dist/mcteam-guerra-semanal.mcpack` no Minecraft.
- Se o `.mcpack` nao aparecer, importe `dist/mcteam-guerra-semanal.mcaddon`.
- Manualmente, copie a pasta `behavior_packs/mcteam_bp` para a pasta `behavior_packs` do mundo.

Behavior Packs nao aparecem em recursos globais. Depois de importar, abra as configuracoes do mundo e procure na aba de Behavior Packs.

O manifesto exige Minecraft Bedrock `1.21.0` ou superior e usa `@minecraft/server` `1.11.0` para maximizar a chance de aparecer na tela de Behavior Packs. Versoes mais novas do Minecraft devem suprir essa dependencia com uma versao mais recente da API.
