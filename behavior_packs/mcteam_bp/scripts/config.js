export const CONFIG = {
  namespace: "mcteam",
  objectiveId: "mcteam",
  activeState: 0,
  rewardOpenState: 1,
  rewardClosedState: 2,
  winnerNone: 0,
  winnerBlue: 1,
  winnerRed: 2,
  winnerAll: 3,
  teams: {
    blue: {
      id: "blue",
      name: "Azul",
      colorCode: "§9",
      prefix: "§9[Azul]§r",
      memberScore: "$mcteam.blue.members",
      pointsScore: "$mcteam.blue.points",
      killsScore: "$mcteam.blue.kills",
      deathsScore: "$mcteam.blue.deaths"
    },
    red: {
      id: "red",
      name: "Vermelha",
      colorCode: "§c",
      prefix: "§c[Vermelha]§r",
      memberScore: "$mcteam.red.members",
      pointsScore: "$mcteam.red.points",
      killsScore: "$mcteam.red.kills",
      deathsScore: "$mcteam.red.deaths"
    }
  },
  scores: {
    week: "$mcteam.week",
    assignmentRun: "$mcteam.assignment_run",
    state: "$mcteam.state",
    winner: "$mcteam.winner",
    rewardEndSec: "$mcteam.reward_end_sec",
    rewardPrepared: "$mcteam.reward_prepared"
  },
  scoring: {
    enemyKill: 1,
    death: -1,
    friendlyKillPenalty: -5,
    repeatedKillCooldownSec: 120
  },
  schedule: {
    // Segunda-feira 00:00 UTC. A premiacao fica aberta por 24h.
    rewardDurationSec: 24 * 60 * 60
  },
  rewardRoom: {
    dimensionId: "minecraft:overworld",
    min: { x: 0, y: 70, z: 0 },
    max: { x: 15, y: 85, z: 15 },
    entrance: { x: 7.5, y: 71, z: 7.5 },
    exit: { x: 0, y: 80, z: -8 },
    chestLocations: [
      { x: 4, y: 71, z: 4 },
      { x: 6, y: 71, z: 4 },
      { x: 8, y: 71, z: 4 },
      { x: 10, y: 71, z: 4 }
    ],
    dropLocations: [
      { x: 5.5, y: 73, z: 8.5 },
      { x: 7.5, y: 73, z: 8.5 },
      { x: 9.5, y: 73, z: 8.5 }
    ]
  },
  rewardLoot: [
    { item: "minecraft:diamond", amount: 16, weight: 5 },
    { item: "minecraft:emerald", amount: 24, weight: 4 },
    { item: "minecraft:golden_apple", amount: 4, weight: 2 },
    { item: "minecraft:netherite_scrap", amount: 2, weight: 2 },
    { item: "minecraft:experience_bottle", amount: 16, weight: 4 },
    { item: "minecraft:totem_of_undying", amount: 1, weight: 2 },
    {
      item: "minecraft:diamond_sword",
      amount: 1,
      weight: 2,
      enchantments: [
        { id: "minecraft:sharpness", level: 5 },
        { id: "minecraft:unbreaking", level: 3 }
      ]
    },
    {
      item: "minecraft:diamond_sword",
      amount: 1,
      weight: 3,
      enchantments: [
        { id: "minecraft:smite", level: 4 },
        { id: "minecraft:unbreaking", level: 3 }
      ]
    },
    {
      item: "minecraft:diamond_sword",
      amount: 1,
      weight: 1,
      enchantments: [
        { id: "minecraft:smite", level: 4 },
        { id: "minecraft:unbreaking", level: 3 },
        { id: "minecraft:mending", level: 1 }
      ]
    },
    {
      item: "minecraft:diamond_sword",
      amount: 1,
      weight: 1,
      enchantments: [
        { id: "minecraft:smite", level: 5 },
        { id: "minecraft:unbreaking", level: 3 },
      ]
    },
    {
      item: "minecraft:diamond_sword",
      amount: 1,
      weight: 1,
      enchantments: [
        { id: "minecraft:smite", level: 5 },
        { id: "minecraft:unbreaking", level: 3 },
        { id: "minecraft:mending", level: 1 }
      ]
    },
    {
      item: "minecraft:diamond_sword",
      amount: 1,
      weight: 1,
      enchantments: [
        { id: "minecraft:sharpness", level: 4 },
        { id: "minecraft:unbreaking", level: 3 },
        { id: "minecraft:mending", level: 1 }
      ]
    },
    {
      item: "minecraft:diamond_pickaxe",
      amount: 1,
      weight: 3,
      enchantments: [
        { id: "minecraft:efficiency", level: 4 },
        { id: "minecraft:unbreaking", level: 3 }
      ]
    },
    {
      item: "minecraft:diamond_pickaxe",
      amount: 1,
      weight: 2,
      enchantments: [
        { id: "minecraft:efficiency", level: 5 },
        { id: "minecraft:unbreaking", level: 3 }
      ]
    },
    {
      item: "minecraft:diamond_pickaxe",
      amount: 1,
      weight: 1,
      enchantments: [
        { id: "minecraft:efficiency", level: 4 },
        { id: "minecraft:unbreaking", level: 3 },
        { id: "minecraft:mending", level: 1 }
      ]
    },
    {
      item: "minecraft:diamond_pickaxe",
      amount: 1,
      weight: 1,
      enchantments: [
        { id: "minecraft:efficiency", level: 5 },
        { id: "minecraft:unbreaking", level: 3 },
        { id: "minecraft:mending", level: 1 }
      ]
    },
    {
      item: "minecraft:bow",
      amount: 1,
      weight: 3,
      enchantments: [
        { id: "minecraft:power", level: 4 },
        { id: "minecraft:unbreaking", level: 3 }
      ]
    },
    { 
      item: "minecraft:bow",
      amount: 1,
      weight: 1,
      enchantments: [
        { id: "minecraft:power", level: 4 },
        { id: "minecraft:unbreaking", level: 3 },
        { id: "minecraft:infinity", level: 1 }
      ]
    },
    {
      item: "minecraft:bow",
      amount: 1,
      weight: 2,
      enchantments: [
        { id: "minecraft:power", level: 5 },
        { id: "minecraft:unbreaking", level: 3 }
      ]
    },
    {
      item: "minecraft:bow",
      amount: 1,
      weight: 1,
      enchantments: [
        { id: "minecraft:power", level: 5 },
        { id: "minecraft:unbreaking", level: 3 },
        { id: "minecraft:infinity", level: 1 }
      ]
    },
    {
      item: "minecraft:bow",
      amount: 1,
      weight: 2,
      enchantments: [
        { id: "minecraft:power", level: 5 },
        { id: "minecraft:unbreaking", level: 3 },
        { id: "minecraft:mending", level: 1 }
      ]
    },
  ]
};
