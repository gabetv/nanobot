// js/gameState.js
// console.log("gameState.js - Fichier chargé.");

let gameState = {
    resources: { biomass: 200 * 1000, nanites: 100 * 1000, energy: 50 * 10, crystal_shards: 0 },
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
        focusStacks: 0,
        lastScanTime: 0 // NOUVEAU: Pour le cooldown du scan
    },
    nanobotModuleLevels: {},
    inventory: [],
    nanobotEquipment: { weapon: null, armor: null, utility1: null, utility2: null },
    combatLogSummary: ["Journal de combat initialisé."],
    currentZoneId: 'sector_x9',
    unlockedZones: ['sector_x9'],
    map: {
        tiles: [], // Sera initialisé par generateMap avec les nouvelles propriétés
        explored: [], // Sera initialisé par generateMap
        nanobotPos: { x: 0, y: 0 }, // Sera défini par generateMap
        zoneId: 'sector_x9', // Sera défini par generateMap
        currentEnemyEncounter: null
    },
    shopStock: ['item_laser_mk1', 'item_nanosword', 'item_plating_basic', 'item_repair_kit_s'],
    purchasedShopItems: [],
    baseGrid: [],
    placementMode: {
        isActive: false,
        selectedDefenseType: null,
        selectedDefenseLevel: 1
    },
    baseStats: {
        currentHealth: (typeof BASE_INITIAL_HEALTH !== 'undefined' ? BASE_INITIAL_HEALTH : 500),
        maxHealth: (typeof BASE_INITIAL_HEALTH !== 'undefined' ? BASE_INITIAL_HEALTH : 500),
        defensePower: 0
    },
    defenses: {},
    nightAssault: {
        isActive: false,
        wave: 0,
        enemies: [],
        lastAttackTime: 0,
        log: ["Journal d'assaut initialisé."],
        currentEvent: null,
        globalModifiers: {}
    },
    activeCombatSkills: {},
    activeResearch: null
};

// L'initialisation de gameState.map.nanobotPos est maintenant gérée dans generateMap et loadGame
// if (typeof ZONE_DATA !== 'undefined' && ZONE_DATA[gameState.currentZoneId] && ZONE_DATA[gameState.currentZoneId].entryPoint) {
//     gameState.map.nanobotPos = { ...ZONE_DATA[gameState.currentZoneId].entryPoint };
// } else if (typeof BASE_COORDINATES !== 'undefined') {
//     gameState.map.nanobotPos = { ...BASE_COORDINATES };
// }
// console.log("gameState.js - Fin du fichier.");