import { EnchantmentTypes, ItemStack, system, world } from "@minecraft/server";
import { CONFIG } from "./config.js";

const TICKS_PER_SECOND = 20;
const DAY_MS = 24 * 60 * 60 * 1000;
const lastKillPoints = new Map();

let objective;

system.run(() => {
  objective = getOrCreateObjective();
  initializeState();
  ensureOnlinePlayers();
  updateOnlinePlayerNameTags();
  protectRewardRoom();
});

world.afterEvents.playerSpawn.subscribe((event) => {
  if (!event.initialSpawn) {
    return;
  }

  system.run(() => ensurePlayerTeam(event.player));
});

world.afterEvents.entityDie.subscribe((event) => {
  system.run(() => handleEntityDie(event));
});

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const player = event.player;
  const block = event.block;

  if (!isRewardBlock(block)) {
    return;
  }

  if (!canUseRewards(player)) {
    event.cancel = true;
    system.run(() => player.sendMessage("§cApenas vencedores da semana podem usar estes baus."));
  }
});

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (!event.id.startsWith(`${CONFIG.namespace}:`)) {
    return;
  }

  system.run(() => handleScriptEvent(event));
});

system.runInterval(() => {
  checkWeeklyState();
  ensureOnlinePlayers();
  updateOnlinePlayerNameTags();
}, 10 * TICKS_PER_SECOND);

system.runInterval(() => {
  protectRewardRoom();
}, 3 * TICKS_PER_SECOND);

function getOrCreateObjective() {
  let existing = world.scoreboard.getObjective(CONFIG.objectiveId);
  if (existing) {
    return existing;
  }

  return world.scoreboard.addObjective(CONFIG.objectiveId, "MCTeam");
}

function ensureObjective() {
  if (!objective) {
    objective = getOrCreateObjective();
  }

  return objective;
}

function initializeState() {
  const currentWeek = getCurrentWeekId();
  const storedWeek = getScore(CONFIG.scores.week);

  if (storedWeek === undefined) {
    startWeek(currentWeek);
    return;
  }

  checkWeeklyState();
}

function checkWeeklyState() {
  const currentWeek = getCurrentWeekId();
  const state = getState();
  const storedWeek = getScore(CONFIG.scores.week) ?? currentWeek;
  const nowSec = getNowSec();

  if (state === CONFIG.activeState && currentWeek > storedWeek) {
    endWeek(storedWeek);
    return;
  }

  if (state === CONFIG.rewardOpenState && nowSec >= getScore(CONFIG.scores.rewardEndSec)) {
    closeRewards();
    startWeek(currentWeek);
  }
}

function startWeek(weekId) {
  const nextAssignmentRun = (getScore(CONFIG.scores.assignmentRun) ?? 0) + 1;

  setScore(CONFIG.scores.week, weekId);
  setScore(CONFIG.scores.assignmentRun, nextAssignmentRun);
  setScore(CONFIG.scores.state, CONFIG.activeState);
  setScore(CONFIG.scores.winner, CONFIG.winnerNone);
  setScore(CONFIG.scores.rewardEndSec, 0);
  setScore(CONFIG.scores.rewardPrepared, 0);

  for (const team of getTeams()) {
    setScore(team.memberScore, 0);
    setScore(team.pointsScore, 0);
    setScore(team.killsScore, 0);
    setScore(team.deathsScore, 0);
  }

  for (const player of world.getAllPlayers()) {
    clearMcteamTags(player);
  }

  world.sendMessage(`§b[MCTeam] Semana ${weekId} iniciada. As equipes foram reiniciadas.`);
  ensureOnlinePlayers();
}

function endWeek(weekId) {
  const winner = resolveWinner();
  const rewardEndSec = getWeekStartSec(weekId + 1) + CONFIG.schedule.rewardDurationSec;

  setScore(CONFIG.scores.state, CONFIG.rewardOpenState);
  setScore(CONFIG.scores.winner, winner);
  setScore(CONFIG.scores.rewardEndSec, rewardEndSec);
  setScore(CONFIG.scores.rewardPrepared, 0);

  announceWinner(winner);
  prepareRewardRoom(true);
}

function closeRewards() {
  setScore(CONFIG.scores.state, CONFIG.rewardClosedState);
  protectRewardRoom(true);
  world.sendMessage("§b[MCTeam] A premiacao semanal foi encerrada.");
}

function resolveWinner() {
  const blue = CONFIG.teams.blue;
  const red = CONFIG.teams.red;
  const bluePoints = getScore(blue.pointsScore) ?? 0;
  const redPoints = getScore(red.pointsScore) ?? 0;

  if (bluePoints > redPoints) return CONFIG.winnerBlue;
  if (redPoints > bluePoints) return CONFIG.winnerRed;

  const blueKills = getScore(blue.killsScore) ?? 0;
  const redKills = getScore(red.killsScore) ?? 0;

  if (blueKills > redKills) return CONFIG.winnerBlue;
  if (redKills > blueKills) return CONFIG.winnerRed;

  const blueDeaths = getScore(blue.deathsScore) ?? 0;
  const redDeaths = getScore(red.deathsScore) ?? 0;

  if (blueDeaths < redDeaths) return CONFIG.winnerBlue;
  if (redDeaths < blueDeaths) return CONFIG.winnerRed;

  return CONFIG.winnerAll;
}

function announceWinner(winner) {
  const blue = CONFIG.teams.blue;
  const red = CONFIG.teams.red;
  const scoreLine = `§9Azul ${getScore(blue.pointsScore) ?? 0}§r x §c${getScore(red.pointsScore) ?? 0} Vermelha`;

  if (winner === CONFIG.winnerBlue) {
    world.sendMessage(`§b[MCTeam] Semana encerrada. Equipe §9Azul§r venceu. ${scoreLine}`);
    return;
  }

  if (winner === CONFIG.winnerRed) {
    world.sendMessage(`§b[MCTeam] Semana encerrada. Equipe §cVermelha§r venceu. ${scoreLine}`);
    return;
  }

  world.sendMessage(`§b[MCTeam] Semana encerrada em empate. A premiacao foi dividida para todos. ${scoreLine}`);
}

function ensureOnlinePlayers() {
  if (getState() !== CONFIG.activeState) {
    for (const player of world.getAllPlayers()) {
      if (!hasValidTeamForWeek(player)) {
        player.sendMessage("§e[MCTeam] A premiacao esta aberta. Novas equipes serao atribuidas na proxima semana.");
      }
    }
    return;
  }

  const players = shuffle([...world.getAllPlayers()]);
  for (const player of players) {
    ensurePlayerTeam(player);
  }
}

function ensurePlayerTeam(player) {
  if (getState() !== CONFIG.activeState) {
    return;
  }

  if (hasValidTeamForWeek(player)) {
    return;
  }

  clearMcteamTags(player);
  const team = chooseBalancedTeam();
  assignTeam(player, team);
}

function hasValidTeamForWeek(player) {
  const weekId = getScore(CONFIG.scores.week);
  const assignmentRun = getScore(CONFIG.scores.assignmentRun);
  return getPlayerTeam(player) !== undefined && player.hasTag(weekTag(weekId)) && player.hasTag(runTag(assignmentRun));
}

function chooseBalancedTeam() {
  const blueMembers = getScore(CONFIG.teams.blue.memberScore) ?? 0;
  const redMembers = getScore(CONFIG.teams.red.memberScore) ?? 0;

  if (blueMembers < redMembers) return CONFIG.teams.blue;
  if (redMembers < blueMembers) return CONFIG.teams.red;

  return Math.random() < 0.5 ? CONFIG.teams.blue : CONFIG.teams.red;
}

function assignTeam(player, team) {
  const weekId = getScore(CONFIG.scores.week);
  const assignmentRun = getScore(CONFIG.scores.assignmentRun);

  player.addTag(teamTag(team.id));
  player.addTag(weekTag(weekId));
  player.addTag(runTag(assignmentRun));
  addScore(team.memberScore, 1);
  updatePlayerNameTag(player);
  player.sendMessage(`§b[MCTeam] Voce entrou na equipe ${team.colorCode}${team.name}§r.`);
}

function handleEntityDie(event) {
  const dead = event.deadEntity;
  if (dead.typeId !== "minecraft:player" || getState() !== CONFIG.activeState) {
    return;
  }

  const deadTeam = getPlayerTeam(dead);
  if (!deadTeam) {
    return;
  }

  addScore(deadTeam.pointsScore, CONFIG.scoring.death);
  addScore(deadTeam.deathsScore, 1);
  addPlayerScore(dead, "deaths", 1);

  const killer = event.damageSource?.damagingEntity;
  if (!killer || killer.typeId !== "minecraft:player" || killer.name === dead.name) {
    broadcastScore("morte");
    return;
  }

  const killerTeam = getPlayerTeam(killer);
  if (!killerTeam) {
    broadcastScore("morte");
    return;
  }

  if (killerTeam.id === deadTeam.id) {
    addScore(killerTeam.pointsScore, CONFIG.scoring.friendlyKillPenalty);
    killer.sendMessage("§c[MCTeam] Fogo amigo: sua equipe perdeu 5 pontos.");
    broadcastScore("fogo amigo");
    return;
  }

  if (!canScoreKillPoint(killer, dead)) {
    killer.sendMessage("§e[MCTeam] Abate repetido em cooldown: a morte contou, mas o ponto de abate nao.");
    broadcastScore("morte");
    return;
  }

  addScore(killerTeam.pointsScore, CONFIG.scoring.enemyKill);
  addScore(killerTeam.killsScore, 1);
  addPlayerScore(killer, "kills", 1);
  broadcastScore("abate");
}

function canScoreKillPoint(killer, dead) {
  const key = `${killer.name}|${dead.name}`;
  const now = getNowSec();
  const previous = lastKillPoints.get(key) ?? 0;

  if (now - previous < CONFIG.scoring.repeatedKillCooldownSec) {
    return false;
  }

  lastKillPoints.set(key, now);
  return true;
}

function prepareRewardRoom(announce = false) {
  const dimension = world.getDimension(CONFIG.rewardRoom.dimensionId);

  buildRewardRoomShell(dimension);

  if ((getScore(CONFIG.scores.rewardPrepared) ?? 0) === 1) {
    return;
  }

  let filledChests = 0;

  for (const location of CONFIG.rewardRoom.chestLocations) {
    const block = dimension.getBlock(location);
    if (!block) {
      continue;
    }

    block.setType("minecraft:chest");
    const container = block.getComponent("minecraft:inventory")?.container;
    if (!container) {
      continue;
    }

    container.clearAll();
    filledChests += 1;
    for (let slot = 0; slot < container.size; slot += 1) {
      if (Math.random() > 0.45) {
        continue;
      }

      container.setItem(slot, createLootItem());
    }
  }

  for (const location of CONFIG.rewardRoom.dropLocations) {
    dimension.spawnItem(createLootItem(), location);
  }

  if (filledChests > 0) {
    setScore(CONFIG.scores.rewardPrepared, 1);
  }

  if (announce) {
    world.sendMessage("§b[MCTeam] A sala de premiacao esta aberta por 24 horas.");
    world.sendMessage(`§b[MCTeam] Coordenadas da sala: overworld ${formatLocation(CONFIG.rewardRoom.entrance)}. Vencedores podem usar /scriptevent mcteam:reward_tp.`);
  }
}

function createLootItem() {
  const loot = weightedPick(CONFIG.rewardLoot);
  const item = new ItemStack(loot.item, loot.amount);

  if (loot.enchantments) {
    applyEnchantments(item, loot.enchantments);
  }

  return item;
}

function applyEnchantments(item, enchantments) {
  const enchantable = item.getComponent("minecraft:enchantable");
  if (!enchantable) {
    return;
  }

  for (const enchantment of enchantments) {
    const type = EnchantmentTypes.get(enchantment.id);
    if (!type) {
      continue;
    }

    try {
      enchantable.addEnchantment({ type, level: enchantment.level });
    } catch {
      // O item pode recusar encantamentos especificos dependendo da versao do jogo.
    }
  }
}

function protectRewardRoom(forceExit = false) {
  const state = getState();

  for (const player of world.getAllPlayers()) {
    if (!isInRewardRoom(player) || (!forceExit && state === CONFIG.rewardOpenState && canUseRewards(player))) {
      continue;
    }

    player.teleport(CONFIG.rewardRoom.exit, {
      dimension: world.getDimension(CONFIG.rewardRoom.dimensionId)
    });
    player.sendMessage("§c[MCTeam] Voce nao tem acesso a sala de premiacao.");
  }
}

function canUseRewards(player) {
  const winner = getScore(CONFIG.scores.winner);
  const weekId = getScore(CONFIG.scores.week);
  const assignmentRun = getScore(CONFIG.scores.assignmentRun);
  if (getState() !== CONFIG.rewardOpenState) {
    return false;
  }

  if (!player.hasTag(weekTag(weekId)) || !player.hasTag(runTag(assignmentRun))) {
    return false;
  }

  if (winner === CONFIG.winnerAll) {
    return getPlayerTeam(player) !== undefined;
  }

  const team = getPlayerTeam(player);
  return (winner === CONFIG.winnerBlue && team?.id === "blue") || (winner === CONFIG.winnerRed && team?.id === "red");
}

function isRewardBlock(block) {
  if (block.typeId !== "minecraft:chest" && block.typeId !== "minecraft:trapped_chest" && block.typeId !== "minecraft:barrel") {
    return false;
  }

  return block.dimension.id === CONFIG.rewardRoom.dimensionId && isInside(block.location, CONFIG.rewardRoom.min, CONFIG.rewardRoom.max);
}

function isInRewardRoom(player) {
  return player.dimension.id === CONFIG.rewardRoom.dimensionId && isInside(player.location, CONFIG.rewardRoom.min, CONFIG.rewardRoom.max);
}

function isInside(location, min, max) {
  return location.x >= min.x && location.x <= max.x
    && location.y >= min.y && location.y <= max.y
    && location.z >= min.z && location.z <= max.z;
}

function handleScriptEvent(event) {
  const command = event.id.slice(`${CONFIG.namespace}:`.length);
  const message = event.message.trim();

  if (command === "status") {
    sendStatus(event.sourceEntity);
    return;
  }

  if (command === "force_end_week") {
    endWeek(getScore(CONFIG.scores.week));
    return;
  }

  if (command === "reset_week") {
    startWeek(getCurrentWeekId());
    return;
  }

  if (command === "open_rewards") {
    setScore(CONFIG.scores.state, CONFIG.rewardOpenState);
    setScore(CONFIG.scores.rewardEndSec, getNowSec() + CONFIG.schedule.rewardDurationSec);
    setScore(CONFIG.scores.rewardPrepared, 0);
    if ((getScore(CONFIG.scores.winner) ?? CONFIG.winnerNone) === CONFIG.winnerNone) {
      setScore(CONFIG.scores.winner, resolveWinner());
    }
    prepareRewardRoom(true);
    return;
  }

  if (command === "close_rewards") {
    closeRewards();
    return;
  }

  if (command === "reward_tp") {
    teleportToRewards(event.sourceEntity);
    return;
  }

  if (command === "set_team") {
    handleSetTeam(message, event.sourceEntity);
    return;
  }
}

function sendStatus(target) {
  const blue = CONFIG.teams.blue;
  const red = CONFIG.teams.red;
  const lines = [
    `§b[MCTeam] Semana: ${getScore(CONFIG.scores.week)} | Estado: ${stateName(getState())}`,
    `§9Azul§r membros=${getScore(blue.memberScore) ?? 0} pontos=${getScore(blue.pointsScore) ?? 0} abates=${getScore(blue.killsScore) ?? 0} mortes=${getScore(blue.deathsScore) ?? 0}`,
    `§cVermelha§r membros=${getScore(red.memberScore) ?? 0} pontos=${getScore(red.pointsScore) ?? 0} abates=${getScore(red.killsScore) ?? 0} mortes=${getScore(red.deathsScore) ?? 0}`,
    `Vencedor: ${winnerName(getScore(CONFIG.scores.winner) ?? CONFIG.winnerNone)}`,
    `Sala de recompensa: ${CONFIG.rewardRoom.dimensionId} ${formatLocation(CONFIG.rewardRoom.entrance)}`
  ];

  if (target?.typeId === "minecraft:player") {
    for (const line of lines) target.sendMessage(line);
    return;
  }

  for (const line of lines) world.sendMessage(line);
}

function handleSetTeam(message, source) {
  const [playerName, requestedTeam] = splitPlayerTeamMessage(message);
  const team = CONFIG.teams[requestedTeam];
  const player = world.getAllPlayers().find((candidate) => candidate.name === playerName);

  if (!player || !team) {
    sendToSource(source, "§c[MCTeam] Uso: /scriptevent mcteam:set_team <player> <blue|red>");
    return;
  }

  const oldTeam = getPlayerTeam(player);
  if (oldTeam) {
    addScore(oldTeam.memberScore, -1);
  }

  clearMcteamTags(player);
  assignTeam(player, team);
  sendToSource(source, `§b[MCTeam] ${player.name} foi movido para ${team.name}.`);
}

function teleportToRewards(source) {
  if (source?.typeId !== "minecraft:player") {
    sendToSource(source, "§c[MCTeam] Este comando precisa ser usado por um jogador.");
    return;
  }

  if (!canUseRewards(source)) {
    source.sendMessage("§c[MCTeam] Voce nao tem acesso a premiacao agora.");
    return;
  }

  source.teleport(CONFIG.rewardRoom.entrance, {
    dimension: world.getDimension(CONFIG.rewardRoom.dimensionId)
  });
  source.sendMessage("§b[MCTeam] Voce foi enviado para a sala de premiacao.");

  system.runTimeout(() => {
    if (getState() === CONFIG.rewardOpenState) {
      prepareRewardRoom();
    }
  }, TICKS_PER_SECOND);
}

function buildRewardRoomShell(dimension) {
  const min = CONFIG.rewardRoom.min;
  const max = CONFIG.rewardRoom.max;
  const wallTop = Math.min(max.y, min.y + 6);

  for (let x = min.x; x <= max.x; x += 1) {
    for (let z = min.z; z <= max.z; z += 1) {
      setBlockType(dimension, { x, y: min.y, z }, "minecraft:polished_deepslate");
      setBlockType(dimension, { x, y: wallTop, z }, "minecraft:glass");
    }
  }

  for (let y = min.y + 1; y < wallTop; y += 1) {
    for (let x = min.x; x <= max.x; x += 1) {
      setBlockType(dimension, { x, y, z: min.z }, "minecraft:blue_stained_glass");
      setBlockType(dimension, { x, y, z: max.z }, "minecraft:red_stained_glass");
    }

    for (let z = min.z; z <= max.z; z += 1) {
      setBlockType(dimension, { x: min.x, y, z }, "minecraft:blue_stained_glass");
      setBlockType(dimension, { x: max.x, y, z }, "minecraft:red_stained_glass");
    }

    for (let x = min.x + 1; x < max.x; x += 1) {
      for (let z = min.z + 1; z < max.z; z += 1) {
        setBlockType(dimension, { x, y, z }, "minecraft:air");
      }
    }
  }
}

function setBlockType(dimension, location, typeId) {
  const block = dimension.getBlock(location);
  if (!block) {
    return;
  }

  block.setType(typeId);
}

function broadcastScore(reason) {
  const blue = CONFIG.teams.blue;
  const red = CONFIG.teams.red;
  const bluePoints = getScore(blue.pointsScore) ?? 0;
  const redPoints = getScore(red.pointsScore) ?? 0;
  const blueKills = getScore(blue.killsScore) ?? 0;
  const redKills = getScore(red.killsScore) ?? 0;
  const blueDeaths = getScore(blue.deathsScore) ?? 0;
  const redDeaths = getScore(red.deathsScore) ?? 0;

  world.sendMessage(`§b[MCTeam] Placar apos ${reason}: §9Azul ${bluePoints}§r x §c${redPoints} Vermelha§r`);
  world.sendMessage(`§7Abates: §9${blueKills}§7 x §c${redKills}§7 | Mortes: §9${blueDeaths}§7 x §c${redDeaths}`);
}

function updateOnlinePlayerNameTags() {
  for (const player of world.getAllPlayers()) {
    updatePlayerNameTag(player);
  }
}

function updatePlayerNameTag(player) {
  const team = getPlayerTeam(player);
  if (!team) {
    return;
  }

  try {
    player.nameTag = `${team.prefix} ${team.colorCode}${player.name}§r`;
  } catch {
    // Algumas versoes/plataformas podem impedir alteracao do nameTag de Player.
  }
}

function splitPlayerTeamMessage(message) {
  const parts = message.split(/\s+/).filter(Boolean);
  const team = parts.pop();
  return [parts.join(" "), team];
}

function sendToSource(source, message) {
  if (source?.typeId === "minecraft:player") {
    source.sendMessage(message);
    return;
  }

  world.sendMessage(message);
}

function getPlayerTeam(player) {
  if (player.hasTag(teamTag("blue"))) return CONFIG.teams.blue;
  if (player.hasTag(teamTag("red"))) return CONFIG.teams.red;
  return undefined;
}

function clearMcteamTags(player) {
  for (const tag of player.getTags()) {
    if (tag.startsWith(`${CONFIG.namespace}.`)) {
      player.removeTag(tag);
    }
  }
}

function teamTag(teamId) {
  return `${CONFIG.namespace}.team.${teamId}`;
}

function weekTag(weekId) {
  return `${CONFIG.namespace}.week.${weekId}`;
}

function runTag(assignmentRun) {
  return `${CONFIG.namespace}.run.${assignmentRun}`;
}

function getTeams() {
  return [CONFIG.teams.blue, CONFIG.teams.red];
}

function getState() {
  return getScore(CONFIG.scores.state) ?? CONFIG.activeState;
}

function getScore(participant) {
  try {
    return ensureObjective().getScore(participant);
  } catch {
    return undefined;
  }
}

function setScore(participant, value) {
  ensureObjective().setScore(participant, value);
}

function addScore(participant, amount) {
  setScore(participant, (getScore(participant) ?? 0) + amount);
}

function addPlayerScore(player, kind, amount) {
  const scoreName = `$mcteam.player.${kind}.${getScore(CONFIG.scores.week)}.${player.name}`;
  try {
    addScore(scoreName, amount);
  } catch {
    // Estatisticas globais continuam sendo a fonte principal se o nome exceder algum limite da scoreboard.
  }
}

function getCurrentWeekId() {
  const day = Math.floor(Date.now() / DAY_MS);
  return Math.floor((day + 3) / 7);
}

function getWeekStartSec(weekId) {
  return (weekId * 7 - 3) * 24 * 60 * 60;
}

function getNowSec() {
  return Math.floor(Date.now() / 1000);
}

function stateName(state) {
  if (state === CONFIG.activeState) return "ativa";
  if (state === CONFIG.rewardOpenState) return "premiacao aberta";
  if (state === CONFIG.rewardClosedState) return "premiacao encerrada";
  return "desconhecido";
}

function winnerName(winner) {
  if (winner === CONFIG.winnerBlue) return "Azul";
  if (winner === CONFIG.winnerRed) return "Vermelha";
  if (winner === CONFIG.winnerAll) return "Todos";
  return "Nenhum";
}

function formatLocation(location) {
  return `x=${location.x}, y=${location.y}, z=${location.z}`;
}

function weightedPick(options) {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let cursor = Math.random() * total;

  for (const option of options) {
    cursor -= option.weight;
    if (cursor <= 0) {
      return option;
    }
  }

  return options[options.length - 1];
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }

  return items;
}
