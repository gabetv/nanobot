// js/config_general.js
console.log("config_general.js - Fichier chargé et en cours d'analyse...");

// --- Vitesse du Jeu ---
const TICK_SPEED = 1000; // Millisecondes par tick de jeu (1000ms = 1 seconde).
window.TICK_SPEED = TICK_SPEED;

// --- Ressources Initiales et Mobilité ---
const INITIAL_RESOURCES = {
    biomass: 25000, // Augmenté
    nanites: 10000, // Augmenté
    energy: 0,      // Énergie *disponible* initiale. La capacité est ajoutée par les générateurs.
    crystal_shards: 5000, // Augmenté
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
    repairCostPerHp: { // Coût pour réparer 1 PV du noyau
        nanites: 2,
        biomass: 1
    },
    defenseRepairCostFactor: 0.5 // Facteur du coût de construction initial pour réparer une défense
};
window.BASE_STATS_CONFIG = BASE_STATS_CONFIG;

// Initial health and defense for the base, could also be part of BASE_STATS_CONFIG.initial
const BASE_INITIAL_HEALTH = 500; // Utilisé dans gameplayLogic si BASE_STATS_CONFIG.initial n'est pas trouvé
window.BASE_INITIAL_HEALTH = BASE_INITIAL_HEALTH;
const REPAIR_COST_BASE_HEALTH_BIOMASS = 1; // Utilisé dans gameplayLogic si BASE_STATS_CONFIG.repairCostPerHp n'est pas trouvé
const REPAIR_COST_BASE_HEALTH_NANITES = 2;
window.REPAIR_COST_BASE_HEALTH_BIOMASS = REPAIR_COST_BASE_HEALTH_BIOMASS;
window.REPAIR_COST_BASE_HEALTH_NANITES = REPAIR_COST_BASE_HEALTH_NANITES;

const REPAIR_COST_DEFENSE_HEALTH_BIOMASS = 0.5; // Facteur par PV, ou coût fixe par PV
const REPAIR_COST_DEFENSE_HEALTH_NANITES = 1;
window.REPAIR_COST_DEFENSE_HEALTH_BIOMASS = REPAIR_COST_DEFENSE_HEALTH_BIOMASS;
window.REPAIR_COST_DEFENSE_HEALTH_NANITES = REPAIR_COST_DEFENSE_HEALTH_NANITES;


const BASE_GRID_SIZE = { rows: 9, cols: 13 };
window.BASE_GRID_SIZE = BASE_GRID_SIZE;

const SELL_REFUND_FACTOR = 0.5; // 50% des ressources investies sont remboursées lors de la vente d'une défense
window.SELL_REFUND_FACTOR = SELL_REFUND_FACTOR;


// --- Cycle Jour/Nuit et Assauts ---
const DAY_NIGHT_CYCLE_CONFIG = {
    duration: 600, // Durée totale d'un cycle en secondes (ex: 600s = 10 minutes).
    dayDurationFactor: 0.7, // 70% du cycle est jour.
    // nightTimeProductionModifier et nightTimeEnemyAggressionModifier sont des concepts, leur application est dans la logique de jeu.
};
window.DAY_NIGHT_CYCLE_CONFIG = DAY_NIGHT_CYCLE_CONFIG;

// Pour simplifier, on peut dériver DAY_DURATION et NIGHT_DURATION ici
const DAY_DURATION = DAY_NIGHT_CYCLE_CONFIG.duration * DAY_NIGHT_CYCLE_CONFIG.dayDurationFactor; // en secondes
const NIGHT_DURATION = DAY_NIGHT_CYCLE_CONFIG.duration * (1 - DAY_NIGHT_CYCLE_CONFIG.dayDurationFactor); // en secondes
window.DAY_DURATION = DAY_DURATION;
window.NIGHT_DURATION = NIGHT_DURATION;

const FORCE_CYCLE_CHANGE_COST = { biomass: 50, nanites: 25 };
window.FORCE_CYCLE_CHANGE_COST = FORCE_CYCLE_CHANGE_COST;


const NIGHT_ASSAULT_CONFIG = {
    timeBetweenAssaults: DAY_DURATION + NIGHT_DURATION, // Un assaut par cycle complet jour/nuit après le premier.
    warningTime: 60, // Secondes d'avertissement avant le début de l'assaut.
    baseThreatIncreasePerDay: 5,
    maxConcurrentEnemies: 15,
    enemySpawnDelay: 1.5, // Secondes
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
    // costToExploreTile a été déplacé vers EXPLORATION_COST_MOBILITY dans config_world.js
    // scanCost a été déplacé vers SCAN_ENERGY_COST dans config_world.js
    scanRadius: 3, // Rayon du scan en cases (carré de (2*Rayon+1))
    baseInteractionPoints: 3, // Interactions pour explorer une case "explorable"
    revealRadiusOnMove: 1, // Cases révélées (visibles mais non explorées) autour du nanobot
    eventLogMaxEntries: 50 // Max entrées dans les journaux UI
};
window.EXPLORATION_SETTINGS = EXPLORATION_SETTINGS;

// DEFAULT_MAP_SIZE et BASE_COORDINATES sont maintenant dans config_world.js

// --- Version du Jeu (pour la gestion des sauvegardes) ---
const GAME_VERSION_CONFIG_CHECK = "1.1.4"; // Doit correspondre à `currentVersion` dans main.js
window.GAME_VERSION_CONFIG_CHECK = GAME_VERSION_CONFIG_CHECK;

// --- Initial Capacities (Optionnel, si la base a des capacités de stockage initiales) ---
const INITIAL_CAPACITIES = {
    biomass: 50000, // Augmenté
    nanites: 30000, // Augmenté
    energy: 50, // Capacité énergétique de base du noyau avant tout générateur
    crystal_shards: 5000 // Augmenté
};
window.INITIAL_CAPACITIES = INITIAL_CAPACITIES;


console.log("config_general.js - Constantes générales définies.");