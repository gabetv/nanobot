// js/config_general.js
console.log("config_general.js - Fichier chargé et en cours d'analyse...");

// --- Vitesse du Jeu ---
const TICK_SPEED = 1000; // Millisecondes par tick de jeu (1000ms = 1 seconde).
window.TICK_SPEED = TICK_SPEED;

// --- Ressources Initiales et Mobilité ---
const INITIAL_RESOURCES = {
    biomass: 25000, 
    nanites: 10000, 
    energy: 0,      
    crystal_shards: 5000, // Reste élevé pour test
    mobility: 10,
    totalEnergyConsumed: 0,
    energyConsumedByDefenses: 0
};
window.INITIAL_RESOURCES = INITIAL_RESOURCES;

const MAX_MOBILITY_POINTS = 10;
window.MAX_MOBILITY_POINTS = MAX_MOBILITY_POINTS;
const MOBILITY_RECHARGE_TIME_PER_POINT = 30; // Secondes
window.MOBILITY_RECHARGE_TIME_PER_POINT = MOBILITY_RECHARGE_TIME_PER_POINT;

// --- Configuration de la Base et des Défenses ---
const BASE_STATS_CONFIG = {
    initial: {
        maxHealth: 500,
        currentHealth: 500,
        defensePower: 0,
    },
    repairCostPerHp: { 
        nanites: 2,
        biomass: 1
    },
    defenseRepairCostFactor: 0.5 
};
window.BASE_STATS_CONFIG = BASE_STATS_CONFIG;

const BASE_INITIAL_HEALTH = 500; 
window.BASE_INITIAL_HEALTH = BASE_INITIAL_HEALTH;
const REPAIR_COST_BASE_HEALTH_BIOMASS = 1; 
const REPAIR_COST_BASE_HEALTH_NANITES = 2;
window.REPAIR_COST_BASE_HEALTH_BIOMASS = REPAIR_COST_BASE_HEALTH_BIOMASS;
window.REPAIR_COST_BASE_HEALTH_NANITES = REPAIR_COST_BASE_HEALTH_NANITES;

const REPAIR_COST_DEFENSE_HEALTH_BIOMASS = 0.5; 
const REPAIR_COST_DEFENSE_HEALTH_NANITES = 1;
window.REPAIR_COST_DEFENSE_HEALTH_BIOMASS = REPAIR_COST_DEFENSE_HEALTH_BIOMASS;
window.REPAIR_COST_DEFENSE_HEALTH_NANITES = REPAIR_COST_DEFENSE_HEALTH_NANITES;


const BASE_GRID_SIZE = { rows: 9, cols: 13 };
window.BASE_GRID_SIZE = BASE_GRID_SIZE;

const SELL_REFUND_FACTOR = 0.5; 
window.SELL_REFUND_FACTOR = SELL_REFUND_FACTOR;


// --- Cycle Jour/Nuit et Assauts ---
const DAY_NIGHT_CYCLE_CONFIG = {
    duration: 600, 
    dayDurationFactor: 0.7, 
};
window.DAY_NIGHT_CYCLE_CONFIG = DAY_NIGHT_CYCLE_CONFIG;

const DAY_DURATION = DAY_NIGHT_CYCLE_CONFIG.duration * DAY_NIGHT_CYCLE_CONFIG.dayDurationFactor; 
const NIGHT_DURATION = DAY_NIGHT_CYCLE_CONFIG.duration * (1 - DAY_NIGHT_CYCLE_CONFIG.dayDurationFactor); 
window.DAY_DURATION = DAY_DURATION;
window.NIGHT_DURATION = NIGHT_DURATION;

const FORCE_CYCLE_CHANGE_COST = { biomass: 50, nanites: 25 };
window.FORCE_CYCLE_CHANGE_COST = FORCE_CYCLE_CHANGE_COST;


const NIGHT_ASSAULT_CONFIG = {
    timeBetweenAssaults: DAY_DURATION + NIGHT_DURATION, 
    warningTime: 60, 
    baseThreatIncreasePerDay: 5,
    maxConcurrentEnemies: 15,
    enemySpawnDelay: 1.5, 
    wavesPerAssaultMin: 2,
    wavesPerAssaultMax: 5,
    enemiesPerWaveBase: 3,
    enemiesPerWaveFactorByThreat: 0.1
};
window.NIGHT_ASSAULT_CONFIG = NIGHT_ASSAULT_CONFIG;

// --- Progression du Joueur (Nanobot) ---
const LEVEL_XP_THRESHOLDS = [
    100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, Infinity
];
window.LEVEL_XP_THRESHOLDS = LEVEL_XP_THRESHOLDS;

// --- Exploration du Monde ---
const EXPLORATION_SETTINGS = {
    initialZoneId: 'verdant_archipelago',
    scanRadius: 3, 
    baseInteractionPoints: 3, 
    revealRadiusOnMove: 1, 
    eventLogMaxEntries: 50 
};
window.EXPLORATION_SETTINGS = EXPLORATION_SETTINGS;

// --- Version du Jeu (pour la gestion des sauvegardes) ---
const GAME_VERSION_CONFIG_CHECK = "1.1.4"; 
window.GAME_VERSION_CONFIG_CHECK = GAME_VERSION_CONFIG_CHECK;

// --- Initial Capacities (Optionnel, si la base a des capacités de stockage initiales) ---
const INITIAL_CAPACITIES = {
    biomass: 50000, 
    nanites: 30000, 
    energy: 50, 
    crystal_shards: 5000 
};
window.INITIAL_CAPACITIES = INITIAL_CAPACITIES;

// --- Coût d'accélération de recherche ---
const INSTANT_RESEARCH_CRYSTAL_COST_PER_10_SECONDS = 1; // 1 cristal pour 10 secondes de recherche
window.INSTANT_RESEARCH_CRYSTAL_COST_PER_10_SECONDS = INSTANT_RESEARCH_CRYSTAL_COST_PER_10_SECONDS;


console.log("config_general.js - Constantes générales définies.");