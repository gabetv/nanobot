// js/gameState.js
console.log("gameState.js - Fichier chargé et en cours d'analyse...");

// La variable `gameState` sera déclarée globalement par `var gameState;` dans main.js
// et initialisée là-bas. Ce fichier fournit la structure initiale.

/**
 * Retourne la structure initiale de l'objet gameState.
 * Les valeurs spécifiques (comme les ressources initiales) peuvent être tirées de config.js.
 */
function getInitialGameState() {
    // Utiliser les constantes de config_*.js via window pour plus de robustesse
    const initialResources = typeof window.INITIAL_RESOURCES !== 'undefined' ? { ...window.INITIAL_RESOURCES } : {
        biomass: 25000, nanites: 10000, energy: 0, crystal_shards: 5000,
        totalEnergyConsumed: 0, energyConsumedByDefenses: 0,
        mobility: typeof window.MAX_MOBILITY_POINTS !== 'undefined' ? window.MAX_MOBILITY_POINTS : 10,
    };

    const initialNanobotStats = typeof window.NANOBOT_INITIAL_STATS !== 'undefined' ? { ...window.NANOBOT_INITIAL_STATS } : {
        level: 1, xp: 0,
        xpToNext: (typeof window.LEVEL_XP_THRESHOLDS !== 'undefined' && window.LEVEL_XP_THRESHOLDS.length > 0) ? window.LEVEL_XP_THRESHOLDS[0] : 100,
        health: 100, currentHealth: 100, attack: 10, defense: 5, speed: 10,
        baseHealth: 100, baseAttack: 10, baseDefense: 5, baseSpeed: 10, // Ajout des stats de base
        critChance: 0.05, critDamage: 1.5, energyRegen: 0.5, rageMax: 100,
        resistances: {}, // Initialiser les résistances
        lastMapScanTime: 0, // Pour le cooldown du scan de carte
        isDefendingBase: false,
        baseDefensePosition: null, // { row, col }
        baseDefenseTargetEnemyId: null,
        baseDefensePatrolIndex: 0,
        baseDefenseLastActionTime: 0
    };

    const initialBaseStats = typeof window.BASE_STATS_CONFIG !== 'undefined' ? { ...window.BASE_STATS_CONFIG.initial } : {
        maxHealth: 500, currentHealth: 500, defensePower: 0,
    };

    // `currentVersion` est défini dans main.js
    const gameVersion = typeof currentVersion !== 'undefined' ? currentVersion : "0.0.0";

    // Items de départ pour test
    const startingInventory = [
        "repair_kit_basic",
        "repair_kit_basic",
        "laser_pistol_mk1",
        "alloy_plates",
        "alloy_plates",
        "alloy_plates",
        "alloy_plates",
        "alloy_plates",
        "crystal_shard_raw",
        "crystal_shard_raw",
        "crystal_shard_raw",
        "nanite_cluster_small",
        "nanite_cluster_small",
        "nanite_cluster_small",
        "nanite_cluster_small",
        "nanite_cluster_small",
    ];


    return {
        gameTime: 0,
        isDay: true,
        dayNightCycleTimer: 0,
        currentDay: 1,
        gameSpeed: 1,

        resources: initialResources,
        productionRates: { biomass: 0, nanites: 0, crystal_shards: 0 },
        capacity: { biomass: 50000, nanites: 30000, energy: 0, crystal_shards: 5000 }, // Energy capacity est à 0 initialement, augmentée par les générateurs

        buildings: {},
        defenses: {},
        baseGrid: [], // Sera initialisé par initializeBaseGrid()

        research: {},
        activeResearch: null,

        nanobotStats: initialNanobotStats,
        nanobotModuleLevels: {},
        nanobotEquipment: {
             WEAPON: null, ARMOR_CORE: null, SHIELD_GENERATOR: null,
             MOBILITY_SYSTEM: null, UTILITY_A: null, UTILITY_B: null, PROCESSOR: null
        }, // Utiliser les clés de EQUIPMENT_SLOTS
        nanobotSkills: {}, // Objet: { skillId: { cooldownRemaining: X, ...autresDonneesSiBesoin } }

        inventory: startingInventory,

        map: {
            tiles: {}, // Sera { zoneId: [[tile, ...], ...], ... }
            nanobotPos: { x: 0, y: 0 },
            selectedTile: null, // {x, y} de la tuile sélectionnée sur la carte du monde
            activeExplorationTileCoords: null, // {x, y} pour l'UI d'exploration active
            // discoveredTiles et scannedTiles pourraient être gérés par les propriétés des tuiles elles-mêmes (isExplored, isScannedFromMap)
        },
        currentZoneId: (typeof window.EXPLORATION_SETTINGS !== 'undefined' ? window.EXPLORATION_SETTINGS.initialZoneId : 'verdant_archipelago'),
        unlockedZones: [(typeof window.EXPLORATION_SETTINGS !== 'undefined' ? window.EXPLORATION_SETTINGS.initialZoneId : 'verdant_archipelago')], // Zone de départ est débloquée

        baseStats: initialBaseStats,
        nightAssault: {
            isActive: false,
            wave: 0,
            timerToNextAssault: (typeof window.NIGHT_ASSAULT_CONFIG !== 'undefined' ? window.NIGHT_ASSAULT_CONFIG.timeBetweenAssaults : 1200),
            enemies: [],
            spawnQueue: [],
            log: [], // Log spécifique à l'assaut
            deficitWarningLogged: 0, // Pour éviter spam de log de déficit énergétique
            lastAttackTime: 0 // Pour NIGHT_ASSAULT_TICK_INTERVAL
        },
        // nanobotAssistingBase: false, // Remplacé par nanobotStats.isDefendingBase

        quests: {},
        activeStoryEvents: [],
        completedStoryEvents: [],

        shopStock: [], // Sera une liste d'objets: [{itemId, quantity, cost, isUnique, restockTime}, ...]
        purchasedShopItems: [], // Liste des IDs des items uniques déjà achetés
        lastShopRestockTime: 0,

        tutorialCompleted: false,
        tutorialCurrentStepId: null, // Pour suivre l'étape actuelle si le joueur quitte/revient
        gameplayFlags: {
            crystalShardsUnlocked: false // Exemple
        },
        mobilityRechargeTimer: 0,
        
        placementMode: { // Pour la construction de défenses
            isActive: false,
            selectedDefenseType: null,
            selectedDefenseLevel: 1
        },

        version: gameVersion, // Version du jeu au moment de la création de cet état
        explorationLog: [], // Log pour l'exploration
        eventLog: [], // Log principal d'événements
        combatLogSummary: [] // Log résumé pour le panneau nanobot (si utilisé)
    };
}


function initializeBaseGrid() {
    if (!gameState) {
        console.error("initializeBaseGrid: gameState non défini.");
        return;
    }
    if (!window.BASE_GRID_SIZE || typeof window.BASE_GRID_SIZE.rows !== 'number' || typeof window.BASE_GRID_SIZE.cols !== 'number') {
        console.error("initializeBaseGrid: BASE_GRID_SIZE non défini ou invalide.");
        gameState.baseGrid = [];
        return;
    }

    gameState.baseGrid = [];
    for (let r = 0; r < window.BASE_GRID_SIZE.rows; r++) {
        const row = [];
        for (let c = 0; c < window.BASE_GRID_SIZE.cols; c++) {
            row.push(null);
        }
        gameState.baseGrid.push(row);
    }
    console.log(`Grille de base ${window.BASE_GRID_SIZE.rows}x${window.BASE_GRID_SIZE.cols} initialisée.`);
}


function calculateInitialGameState() {
    if (!gameState) {
        console.error("calculateInitialGameState: gameState non défini.");
        return;
    }
    console.log("gameState.js: calculateInitialGameState CALLED");

    // Appeler les fonctions avec les noms corrects et s'assurer qu'elles existent
    if (typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption(); else console.warn("calculateProductionAndConsumption non défini");
    if (typeof calculateResourceCapacities === 'function') calculateResourceCapacities(); else console.warn("calculateResourceCapacities non défini");
    if (typeof calculateNanobotStats === 'function') calculateNanobotStats(); else console.warn("calculateNanobotStats non défini");
    if (typeof calculateBaseStats === 'function') calculateBaseStats(); else console.warn("calculateBaseStats non défini");


    if (gameState.nanobotStats) {
        gameState.nanobotStats.currentHealth = Math.min(gameState.nanobotStats.currentHealth, gameState.nanobotStats.health);
        // Assurer xpToNext est correct au cas où il aurait été mal sauvegardé
        if (typeof window.LEVEL_XP_THRESHOLDS !== 'undefined' && gameState.nanobotStats.level > 0 && gameState.nanobotStats.level <= window.LEVEL_XP_THRESHOLDS.length) {
            gameState.nanobotStats.xpToNext = window.LEVEL_XP_THRESHOLDS[gameState.nanobotStats.level - 1];
        } else if (typeof window.LEVEL_XP_THRESHOLDS !== 'undefined' && gameState.nanobotStats.level > window.LEVEL_XP_THRESHOLDS.length) {
            gameState.nanobotStats.xpToNext = Infinity; // Niveau max atteint
        }
        // Initialiser les skills débloqués au niveau 1 si la config existe
        if (typeof window.NANOBOT_SKILLS_CONFIG !== 'undefined' && gameState.nanobotStats.level === 1) {
            for (const skillId in window.NANOBOT_SKILLS_CONFIG) {
                const skillConfig = window.NANOBOT_SKILLS_CONFIG[skillId];
                if (skillConfig.unlock && skillConfig.unlock.level === 1) {
                    if (!gameState.nanobotSkills[skillId]) {
                        gameState.nanobotSkills[skillId] = { cooldownRemaining: 0 };
                    }
                }
            }
        }
        // S'assurer que les nouvelles propriétés de défense de base du nanobot sont là
        if (typeof gameState.nanobotStats.baseDefensePosition === 'undefined') gameState.nanobotStats.baseDefensePosition = null;
        if (typeof gameState.nanobotStats.baseDefenseTargetEnemyId === 'undefined') gameState.nanobotStats.baseDefenseTargetEnemyId = null;
        if (typeof gameState.nanobotStats.baseDefensePatrolIndex === 'undefined') gameState.nanobotStats.baseDefensePatrolIndex = 0;
        if (typeof gameState.nanobotStats.baseDefenseLastActionTime === 'undefined') gameState.nanobotStats.baseDefenseLastActionTime = 0;

    }
    if (gameState.baseStats) {
        gameState.baseStats.currentHealth = Math.min(gameState.baseStats.currentHealth, gameState.baseStats.maxHealth);
    }

    if (!gameState.currentZoneId || (typeof window.WORLD_ZONES !== 'undefined' && !window.WORLD_ZONES[gameState.currentZoneId])) {
        gameState.currentZoneId = (typeof window.EXPLORATION_SETTINGS !== 'undefined' ? window.EXPLORATION_SETTINGS.initialZoneId : 'verdant_archipelago');
        console.warn(`currentZoneId invalide ou manquant, réinitialisé à ${gameState.currentZoneId}`);
    }
    
    if (gameState.map && gameState.currentZoneId && (!gameState.map.nanobotPos || typeof gameState.map.nanobotPos.x === 'undefined')) {
        const zoneConf = (typeof window.WORLD_ZONES !== 'undefined' && window.WORLD_ZONES[gameState.currentZoneId]) ? window.WORLD_ZONES[gameState.currentZoneId] : null;
        const defaultStartPos = { x: Math.floor((zoneConf?.mapSize?.width || (window.DEFAULT_MAP_SIZE || {width:30}).width) / 2), y: Math.floor((zoneConf?.mapSize?.height || (window.DEFAULT_MAP_SIZE || {height:30}).height) / 2) };
        gameState.map.nanobotPos = zoneConf && zoneConf.entryPoint ? { ...zoneConf.entryPoint } : defaultStartPos;
        console.warn(`Position du nanobot non définie pour la zone ${gameState.currentZoneId}, réinitialisée à (${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y})`);
    }
    // Assurer que `tiles` est un objet (qui contiendra des sous-objets par zoneId)
    if (gameState.map && typeof gameState.map.tiles !== 'object') {
        gameState.map.tiles = {};
    }

    // Assurer l'existence des tableaux de logs pour éviter les erreurs si `addLogEntry` est appelé avant
    if (!Array.isArray(gameState.explorationLog)) gameState.explorationLog = [];
    if (!Array.isArray(gameState.eventLog)) gameState.eventLog = [];
    if (!Array.isArray(gameState.combatLogSummary)) gameState.combatLogSummary = [];
    if (gameState.nightAssault && !Array.isArray(gameState.nightAssault.log)) gameState.nightAssault.log = [];


    console.log("Calculs initiaux de l'état de jeu terminés (depuis gameState.js).");
}


console.log("gameState.js - Fonctions pour gameState définies.");