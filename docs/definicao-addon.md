# Definicao do addon: Guerra Semanal Azul vs Vermelha

## Objetivo

Criar um addon para Minecraft Bedrock que separa automaticamente todos os jogadores em duas equipes permanentes durante uma semana: equipe azul e equipe vermelha.

O addon nao deve ter lobby, fila de espera ou confirmacao manual. O jogador entra no mundo e, se ainda nao tiver uma equipe valida para a semana atual, recebe uma equipe automaticamente.

Ao final de cada semana, a equipe com melhor pontuacao vence e recebe acesso a uma premiacao.

## Equipes

- Equipe azul
- Equipe vermelha

Cada jogador pode pertencer a apenas uma equipe por semana.

A equipe do jogador deve ficar salva de forma persistente, para que ele continue na mesma equipe ao sair e entrar novamente durante a mesma semana.

## Ciclo semanal

O addon trabalha em ciclos semanais.

No inicio de uma nova semana:

- As equipes podem ser reiniciadas.
- Os pontos das equipes devem voltar para zero.
- Os jogadores devem receber nova equipe ao entrar, seguindo a regra de equilibrio.
- O historico da semana anterior pode ser salvo, se for util para ranking futuro.

No final da semana:

- O addon calcula a equipe vencedora.
- A premiacao fica disponivel apenas para jogadores da equipe vencedora.
- Depois da janela de premiacao, o sistema prepara ou inicia o proximo ciclo semanal.

## Atribuicao automatica de equipe

Quando um jogador entra:

1. O addon verifica se ele ja tem uma equipe atribuida na semana atual.
2. Se ele ja tiver equipe, nada muda.
3. Se ele nao tiver equipe, o addon conta quantos jogadores existem em cada equipe naquela semana.
4. O jogador e colocado na equipe com menos membros.
5. Se as duas equipes tiverem a mesma quantidade de membros, a escolha pode ser aleatoria.

Regra obrigatoria de equilibrio:

- Uma equipe pode ter no maximo 1 jogador a mais que a outra.
- Uma equipe nunca pode ficar com 2 ou mais jogadores a mais que a outra apos uma atribuicao automatica.

Exemplos:

- Azul: 3, Vermelha: 3 -> proximo jogador pode ir aleatoriamente para azul ou vermelha.
- Azul: 4, Vermelha: 3 -> proximo jogador deve ir para vermelha.
- Azul: 5, Vermelha: 3 -> estado invalido; o sistema deve corrigir quando possivel.

## Atribuicao durante jogo ativo

Se um jogador novo entrar enquanto a partida semanal ja esta ativa, ele tambem recebe equipe automaticamente.

Nesse caso, o sistema deve manter o equilibrio geral das equipes. Se houver empate, o addon pode escolher aleatoriamente. Se uma equipe estiver maior, o novo jogador deve ir para a menor.

Nao existe bloqueio de entrada, lobby ou espera.

## Pontuacao

Cada equipe possui uma pontuacao semanal.

Eventos de pontuacao:

- Quando um jogador mata outro jogador, a equipe do assassino ganha ponto.
- Quando um jogador morre, a equipe do jogador morto perde ponto.
- A perda de ponto acontece mesmo que a morte nao tenha sido causada diretamente por um jogador da outra equipe.

Sugestao inicial de valores:

- Abate de jogador inimigo: +1 ponto para a equipe do jogador que matou.
- Morte do jogador: -1 ponto para a equipe do jogador que morreu.
- Morte causada por ambiente, queda, lava, mob ou outro motivo sem assassino jogador: -1 ponto para a equipe do jogador morto.

Regra recomendada para evitar abuso:

- Se um jogador matar outro jogador da propria equipe, nao deve somar ponto. Nesse caso a equipe perde 5 pontos

## Vencedor semanal

Ao encerrar a semana, o addon compara as pontuacoes:

- Se azul tiver mais pontos, azul vence.
- Se vermelha tiver mais pontos, vermelha vence.
- Se houver empate, usar uma regra de desempate.

Regras de desesempate:

- Equipe com mais abates vence.
- Equipe com menos mortes vence.
- Se continuar empatado, nenhuma equipe vence e a premiação é divida para todos.

## Premiacoes

A premiacao deve ser simples de entender e dificil de explorar.

Ideia principal:

- Criar uma area de recompensa protegida.
- Apenas jogadores da equipe vencedora podem entrar durante uma janela de horario especifica.
- Durante essa janela, o addon libera recompensas.

Possiveis formatos de premiacao:

1. Chuva de itens
   - O addon joga itens no chao em pontos definidos da area de recompensa.
   - Exemplos: diamantes, esmeraldas, netherite scrap, macas douradas, flechas especiais, pocao, ferramentas encantadas.

2. Baus exclusivos
   - O addon gera ou libera baus dentro da area de premiacao.
   - Apenas jogadores da equipe vencedora conseguem abrir os baus.
   - Os baus podem ter loot aleatorio controlado.

3. Loja temporaria dos vencedores
   - Jogadores vencedores ganham acesso a NPCs ou comandos de troca por tempo limitado.
   - Evita excesso de itens jogados no chao e reduz risco de lag.

4. Sala de evento
   - Uma sala protegida abre em horario definido.
   - O addon teleporta ou permite entrada apenas da equipe vencedora.
   - Ao fim do horario, todos sao removidos da sala.

Recomendacao inicial:

Usar uma sala de premiacao com baus exclusivos e alguns drops controlados. Baus sao mais previsiveis, reduzem lag e permitem balancear melhor a recompensa.

## Dados que o addon precisa salvar

Dados globais:

- Semana atual.
- Pontuacao da equipe azul.
- Pontuacao da equipe vermelha.
- Total de abates da equipe azul.
- Total de abates da equipe vermelha.
- Total de mortes da equipe azul.
- Total de mortes da equipe vermelha.
- Estado da semana: ativa, encerrada, premiacao aberta ou premiacao encerrada.
- Equipe vencedora da semana, quando houver.

Dados por jogador:

- Identificador persistente do jogador.
- Nome atual do jogador.
- Equipe da semana atual.
- Semana em que a equipe foi atribuida.
- Abates semanais.
- Mortes semanais.
- Se ja resgatou premio, caso a premiacao seja limitada por jogador.

## Eventos principais

### Entrada de jogador

Quando um jogador entra no mundo:

- Verificar semana atual.
- Verificar se o jogador tem equipe valida.
- Se nao tiver, atribuir equipe equilibrada.
- Aplicar tag, scoreboard ou propriedade dinamica indicando a equipe.
- Enviar mensagem informando a equipe.

### Morte de jogador

Quando um jogador morre:

- Identificar a equipe do jogador morto.
- Subtrair ponto da equipe do morto.
- Incrementar mortes da equipe do morto.
- Se houver assassino jogador:
  - Identificar a equipe do assassino.
  - Se for equipe inimiga, somar ponto para a equipe do assassino.
  - Incrementar abates da equipe do assassino.
  - Se for mesma equipe, aplicar regra de fogo amigo, se configurada.

### Encerramento semanal

No momento definido para encerrar a semana:

- Bloquear novas alteracoes de pontuacao da semana encerrada.
- Calcular vencedora.
- Salvar resultado.
- Anunciar resultado no chat.
- Preparar a premiacao.

### Premiacao

Durante a janela de premiacao:

- Permitir acesso apenas aos vencedores.
- Liberar baus, drops ou loja temporaria.
- Impedir que jogadores da equipe perdedora entrem ou abram recompensas.
- Opcionalmente impedir que vencedores resgatem mais de uma vez.

## Comandos administrativos sugeridos

- `/scriptevent mcteam:status`
  - Mostra semana atual, pontuacao e quantidade de membros por equipe.

- `/scriptevent mcteam:force_end_week`
  - Encerra a semana manualmente.

- `/scriptevent mcteam:reset_week`
  - Reinicia pontuacao e atribuicoes da semana.

- `/scriptevent mcteam:set_team <player> <blue|red>`
  - Define equipe manualmente em caso de correcao administrativa.

- `/scriptevent mcteam:open_rewards`
  - Abre manualmente a sala de premiacao.

- `/scriptevent mcteam:close_rewards`
  - Fecha manualmente a sala de premiacao.

## Regras anti-abuso recomendadas

- Nao pontuar abates entre jogadores da mesma equipe.
- Registrar mortes por ambiente para evitar suicidio estrategico sem consequencia.
- Considerar cooldown para abates repetidos entre os mesmos jogadores.
- Impedir acesso da equipe perdedora a baus e drops da premiacao.
- Limitar resgate de premio por jogador, se a recompensa for muito valiosa.
- Registrar logs administrativos de fechamento da semana e abertura da premiacao.

## Decisoes pendentes

- Dia e horario exatos de fechamento da semana.
- Duração da janela de premiacao.
- Se as equipes serao redefinidas toda semana ou se os jogadores permanecem na mesma equipe por varias semanas.
- Lista final de recompensas.
- Se fogo amigo deve apenas nao pontuar ou tambem punir.
- Se pontos podem ficar negativos.
- Se jogador novo pode entrar na equipe vencedora depois da semana encerrada ou se deve aguardar a proxima semana.

