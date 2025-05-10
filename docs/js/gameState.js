// js/gameState.js
// alert("gameState.js chargé !"); // Pour tester

let gameState = {
    resources: { biomass: 200 * 1000, nanites: 100 * 1000, energy: 50 * 10 }, 
    productionRates: { biomass: 0, nanites: 0 },
    capacity: { energy: 50 * 10 }, 
    buildings: {}, 
    research: {}, 
    gameTime: 0, 
    isDay: true, 
    currentCycleTime: 0,
    eventLog: ["Bienvenue, Nexus-7. Initialisation..."],
    nanobotStats: { 
        baseHealth: 100, currentHealth: 100, baseAttack: 10, baseDefense: 5, baseSpeed: 10, 
        health: 100, attack: 10, defense: 5, speed: 10, 
        level: 1, xp: 0, xpToNext: 100,
        isDefendingBase: false,
        rage: 0,
        focusStacks: 0
    },
    nanobotModuleLevels: {}, 
    inventory: [], 
    nanobotEquipment: { weapon: null, armor: null, utility1: null, utility2: null },
    combatLogSummary: ["Journal de combat initialisé."],
    map: { 
        tiles: [], 
        explored: [], 
        nanobotPos: { x: BASE_COORDINATES.x, y: BASE_COORDINATES.y }, 
        currentEnemyEncounter: null 
    },
    shopStock: ['item_laser_mk1', 'item_plating_basic', 'item_repair_kit_s'],
    purchasedShopItems: [],
    baseStats: {
        currentHealth: BASE_INITIAL_HEALTH,
        maxHealth: BASE_INITIAL_HEALTH,
        defensePower: 0 
    },
    defenses: {}, 
    nightAssault: {
        isActive: false,
        wave: 0,
        enemies: [], 
        lastAttackTime: 0,
        log: ["Journal d'assaut initialisé."] 
    },
    activeCombatSkills: {}
};