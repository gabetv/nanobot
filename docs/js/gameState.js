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
        focusStacks: 0
    },
    nanobotModuleLevels: {}, 
    inventory: [], 
    nanobotEquipment: { weapon: null, armor: null, utility1: null, utility2: null },
    combatLogSummary: ["Journal de combat initialisé."],
    currentZoneId: 'sector_x9', 
    unlockedZones: ['sector_x9'], 
    map: { 
        tiles: [], 
        explored: [], 
        nanobotPos: { x: 0, y: 0 }, // Sera correctement initialisé dans init() après chargement de config.js
        zoneId: 'sector_x9', 
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
        currentHealth: (typeof BASE_INITIAL_HEALTH !== 'undefined' ? BASE_INITIAL_HEALTH : 500), // Utiliser la constante si définie
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

// S'assurer que nanobotPos est initialisé avec les valeurs de config.js si elles sont disponibles
// Cela se fera plus proprement dans init() après que tous les scripts soient chargés.