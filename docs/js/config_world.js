// js/config_world.js
console.log("config_world.js - Fichier chargé et en cours d'analyse...");

// --- ENEMY DATA ---
const enemyData = {
    "mutated_rat_weak": {
        id: "mutated_rat_weak", name: "Rat Mutant Faible",
        description: "Une petite créature agressive, affaiblie mais toujours dangereuse en groupe.",
        health: 25, maxHealth: 25, attack: 8, defense: 2, speed: 12,
        damageType: window.DAMAGE_TYPES?.KINETIC || 'kinetic',
        resistances: { [window.DAMAGE_TYPES?.CORROSIVE || 'corrosive']: -0.25 },
        tags: [window.ENEMY_TAGS?.ORGANIC, window.ENEMY_TAGS?.SWARM].filter(t => t),
        xpValue: 5, lootTable: window.LOOT_TABLE_TIERS?.TIER1_COMMON || "tier1_common",
        spritePath: "images/enemies/mutated_rat.png", combatSize: "small", skills: [], behavior: "aggressive",
        actualTileType: window.TILE_TYPES?.ENEMY_PATROL_WEAK || "enemy_patrol_weak"
    },
    "scavenger_bot_rusted": {
        id: "scavenger_bot_rusted", name: "Bot Pilleur Rouillé",
        description: "Un ancien robot de récupération, maintenant erratique et hostile.",
        health: 40, maxHealth: 40, attack: 10, defense: 6, speed: 8,
        damageType: window.DAMAGE_TYPES?.KINETIC || 'kinetic',
        resistances: { [window.DAMAGE_TYPES?.ENERGY || 'energy']: 0.25, [window.DAMAGE_TYPES?.EXPLOSIVE || 'explosive']: -0.5 },
        tags: [window.ENEMY_TAGS?.MECHANICAL, window.ENEMY_TAGS?.GROUND].filter(t => t),
        xpValue: 12, lootTable: window.LOOT_TABLE_TIERS?.TIER1_UNCOMMON || "tier1_uncommon",
        spritePath: "images/enemies/scavenger_bot.png", combatSize: "medium", skills: [/* ... */], behavior: "defensive",
        actualTileType: window.TILE_TYPES?.ENEMY_PATROL_MEDIUM || "enemy_patrol_medium"
    },
    "training_drone_01": { // NOUVELLE ENTRÉE
        id: "training_drone_01",
        name: "Drone d'Entraînement Mk.I",
        description: "Un drone basique utilisé pour les simulations de combat et l'entraînement.",
        health: 40, maxHealth: 40, attack: 10, defense: 3, speed: 5,
        damageType: window.DAMAGE_TYPES?.KINETIC || 'kinetic',
        resistances: { [window.DAMAGE_TYPES?.ENERGY || 'energy']: 0.1 },
        tags: [window.ENEMY_TAGS?.MECHANICAL, window.ENEMY_TAGS?.RANGED].filter(t => t),
        xpValue: 10,
        lootTable: window.LOOT_TABLE_TIERS?.NONE || "none",
        spritePath: "https://placehold.co/80x100/4299e1/e2e8f0?text=T-DRONE",
        color: "#4299e1",
        combatSize: "small",
        skills: [],
        behavior: "passive_scan",
        actualTileType: null // Pas un ennemi de patrouille par défaut
    },
    // ... autres ennemis ...
};
window.enemyData = enemyData;
// Alias pour explorationEnemyData si c'est la même structure que enemyData pour les patrouilles
window.explorationEnemyData = enemyData;

// --- ENEMY BASE DEFINITIONS ---
// Utilisé par mapManager pour peupler les tuiles avec des bases ennemies
const enemyBaseDefinitions = {
    "outpost_alpha": {
        id: "outpost_alpha", name: "Avant-poste Alpha",
        description: "Un petit avant-poste ennemi légèrement défendu.",
        health: 300, // PV de la structure de la base
        defenders: [ // Groupes de défenseurs à l'intérieur
            { id: "scavenger_bot_rusted", count: 2 },
            { id: "mutated_rat_weak", count: 3 }
        ],
        loot: ["nanite_cluster_small", "biomass_sample", "crystal_shard_raw"], // Loot direct après destruction
        xpReward: 50,
        actualTileType: window.TILE_TYPES?.ENEMY_OUTPOST_TILE || "enemy_outpost_tile", // Type de tuile de la base
        visibleStructureType: window.TILE_TYPES?.PRE_HOSTILE_STRUCTURE || "pre_hostile_structure", // Type de structure visible avant exploration
        onAttackText: "Vous attaquez l'Avant-poste Alpha...",
        onDestroyedText: "L'Avant-poste Alpha est en ruines!"
    },
    // ... autres définitions de bases ...
};
window.enemyBaseDefinitions = enemyBaseDefinitions;


// --- TILE DATA ---
// Informations de base pour les types de tuiles (utilisées par mapManager et explorationUI)
// Les TILE_TYPES doivent être des clés ici, et leurs valeurs des objets de configuration.
const tileData = {
    // Utiliser les constantes de window.TILE_TYPES
    [window.TILE_TYPES?.UNKNOWN || "unknown"]: { name: "Inconnu", type: "system", traversable: false, description: "Zone non identifiée." },
    [window.TILE_TYPES?.EMPTY_SPACE || "empty_space"]: { name: "Espace Vide", type: "terrain", traversable: true, description: "Une étendue vide.", icon: "·", baseMoveCost: 1 },
    [window.TILE_TYPES?.EMPTY_GRASSLAND || "empty_grassland"]: { name: "Prairie", type: "terrain", traversable: true, description: "Vastes plaines.", icon: "🌾", baseMoveCost: 1 },
    [window.TILE_TYPES?.FOREST || "forest"]: { name: "Forêt", type: "terrain", traversable: true, description: "Forêt dense.", icon: "🌲", baseMoveCost: 1.5 },
    // ... Ajoutez TOUS les TILE_TYPES de votre enum ici avec leurs propriétés de base ...
    [window.TILE_TYPES?.IMPASSABLE_DEEP_WATER || "impassable_deep_water"]: { name: "Eau Profonde", type: "obstacle", traversable: false, description: "Infranchissable.", icon: "🌊" },
    [window.TILE_TYPES?.IMPASSABLE_HIGH_PEAK || "impassable_high_peak"]: { name: "Haut Pic", type: "obstacle", traversable: false, description: "Infranchissable.", icon: "🏔️" },
    [window.TILE_TYPES?.DEBRIS_FIELD || "debris_field"]: { name: "Champ de Débris", type: "terrain", traversable: true, description: "Débris métalliques.", icon: "🔩", baseMoveCost: 1.5, needsModule: window.TILE_TYPES?.DEBRIS_FIELD },
    [window.TILE_TYPES?.THICK_VINES || "thick_vines"]: { name: "Vignes Épaisses", type: "terrain", traversable: true, description: "Végétation dense.", icon: "🌿", baseMoveCost: 1.8, needsModule: window.TILE_TYPES?.THICK_VINES },
    [window.TILE_TYPES?.PLAYER_BASE || "player_base"]: { name: "Base Nexus-7", type: "system", traversable: false, description: "Votre base principale." },
    [window.TILE_TYPES?.RESOURCE_BIOMASS_PATCH || "resource_biomass_patch"]: { name: "Patch de Biomasse", type: "resource_node", traversable: true, icon: "🌿" /* ... */ },
    [window.TILE_TYPES?.UPGRADE_CACHE || "upgrade_cache"]: { name: "Cache d'amélioration", type: "poi", traversable: true, icon: "💡" /* ... */ },
    [window.TILE_TYPES?.ENEMY_OUTPOST_TILE || "enemy_outpost_tile"]: { name: "Avant-Poste Ennemi", type: "poi_hostile", traversable: true, icon: "🏰" /* ... */ }
};
window.tileData = tileData;

// MAP_FEATURE_DATA: Pour les noms et descriptions des POI et autres features spécifiques
// Les clés ici doivent correspondre aux valeurs des TILE_TYPES pour les POI.
const MAP_FEATURE_DATA = {
    [window.TILE_TYPES?.UPGRADE_CACHE || "upgrade_cache"]: { name: "Cache d'Amélioration", description: "Un conteneur scellé contenant potentiellement des technologies utiles." },
    [window.TILE_TYPES?.POI_ANCIENT_STRUCTURE || "poi_ancient_structure"]: { name: "Structure Ancienne", description: "Les restes énigmatiques d'une construction d'origine inconnue." },
    [window.TILE_TYPES?.MERCHANT_WRECKAGE || "merchant_wreckage"]: { name: "Épave de Marchand", description: "Les débris d'un vaisseau marchand, peut-être avec une cargaison récupérable." },
    [window.TILE_TYPES?.RUINS || "ruins"]: { name: "Ruines", description: "Vestiges d'une civilisation passée." },
    // ... autres POI ...
};
window.MAP_FEATURE_DATA = MAP_FEATURE_DATA;

// TILE_TYPES_TO_RESOURCE_KEY: Utilisé pour mapper un type de tuile de ressource à la clé de ressource dans gameState.resources
const TILE_TYPES_TO_RESOURCE_KEY = {
    [window.TILE_TYPES?.RESOURCE_BIOMASS_PATCH || "resource_biomass_patch"]: "biomass",
    [window.TILE_TYPES?.RESOURCE_NANITE_DEPOSIT || "resource_nanite_deposit"]: "nanites",
    [window.TILE_TYPES?.RESOURCE_CRYSTAL_VEIN || "resource_crystal_vein"]: "crystal_shards",
    // Ajoutez d'autres si nécessaire
};
window.TILE_TYPES_TO_RESOURCE_KEY = TILE_TYPES_TO_RESOURCE_KEY;


// --- ZONE BIOMES DATA ---
const zoneBiomesData = {
    "temperate_forest": {
        name: "Forêt Tempérée", description: "Une forêt luxuriante avec une faune et une flore variées.",
        ambientSound: "sounds/forest_ambience.mp3",
        possibleTiles: [window.TILE_TYPES?.EMPTY_GRASSLAND, window.TILE_TYPES?.FOREST_LIGHT, window.TILE_TYPES?.FOREST_DENSE, window.TILE_TYPES?.HILLS, window.TILE_TYPES?.EMPTY_WATER, window.TILE_TYPES?.RUINS_ANCIENT].filter(t=>t),
        resourceBias: { [window.RESOURCE_TYPES?.BIOMASS || 'biomass']: 1.5, [window.RESOURCE_TYPES?.NANITES || 'nanites']: 0.8, [window.RESOURCE_TYPES?.CRYSTAL_SHARDS || 'crystal_shards']: 0.5 }
    },
    "arid_desert": { // Ajout d'un exemple de biome désert
        name: "Désert Aride", description: "Vastes étendues de sable et de roche, peu de vie visible.",
        ambientSound: "sounds/desert_wind.mp3",
        possibleTiles: [window.TILE_TYPES?.EMPTY_DESERT, window.TILE_TYPES?.HILLS, window.TILE_TYPES?.MOUNTAINS_LOW, window.TILE_TYPES?.RUINS].filter(t=>t),
        resourceBias: { [window.RESOURCE_TYPES?.BIOMASS || 'biomass']: 0.2, [window.RESOURCE_TYPES?.NANITES || 'nanites']: 1.2, [window.RESOURCE_TYPES?.CRYSTAL_SHARDS || 'crystal_shards']: 1.5 }
    }
    // ... autres biomes ...
};
window.zoneBiomesData = zoneBiomesData;

// --- BIOME COLOR MAPPING ---
const biomeColorMapping = {
    "temperate_forest": "#228B22", "arid_desert": "#F0E68C", /* ... */
    [window.TILE_TYPES?.IMPASSABLE_DEEP_WATER || "impassable_deep_water"]: "#1E90FF", // Pour les tuiles spécifiques
    [window.TILE_TYPES?.IMPASSABLE_HIGH_PEAK || "impassable_high_peak"]: "#808080"
};
window.biomeColorMapping = biomeColorMapping;

// --- WORLD ZONES ---
const WORLD_ZONES = {
    "verdant_archipelago": {
        id: "verdant_archipelago", name: "Archipel Verdoyant",
        description: "Une série d'îles luxuriantes et interconnectées.",
        mapSize: { width: 25, height: 20 },
        entryPoint: { x: 3, y: 3 },
        defaultBiome: "temperate_forest", difficultyLevel: 1,
        basePlayerCoordinates: { x: 12, y: 10 },
        tileContentDistribution: {
            "mutated_rat_weak": 0.05,
            "scavenger_bot_rusted": 0.03,
            [String(window.TILE_TYPES?.RESOURCE_BIOMASS_PATCH)]: 0.1, // Clé doit être string
            [String(window.TILE_TYPES?.UPGRADE_CACHE)]: 0.02,
            [String(window.TILE_TYPES?.RUINS_ANCIENT)]: 0.04,
        },
        unlockedZones: ["scorched_sands"],
        travelCost: null
    },
    "scorched_sands": {
        id: "scorched_sands", name: "Sables Brûlants",
        description: "Un désert impitoyable sous un soleil de plomb.",
        mapSize: { width: 30, height: 30 }, entryPoint: {x:1, y:15}, defaultBiome: "arid_desert", difficultyLevel: 3,
        tileContentDistribution: {
            "scavenger_bot_rusted": 0.06, // Plus de bots
            // Ajoutez d'autres ennemis/contenus spécifiques au désert
            [String(window.TILE_TYPES?.RESOURCE_CRYSTAL_VEIN)]: 0.08,
            [String(window.TILE_TYPES?.RUINS)]: 0.05,
        },
        unlockedZones: [],
        travelCost: { nanites: 100 }
    },
    // ... autres zones ...
};
window.WORLD_ZONES = WORLD_ZONES;

// --- GENERAL EXPLORATION CONSTANTS (Déplacé de config_general vers ici car plus pertinent) ---
const EXPLORATION_COST_MOBILITY = 1;
window.EXPLORATION_COST_MOBILITY = EXPLORATION_COST_MOBILITY;

const SCAN_ENERGY_COST = 20;
const SCAN_COOLDOWN_DURATION_SECONDS = 60;
const SCAN_REVEAL_DURATION_SECONDS = 180;
window.SCAN_ENERGY_COST = SCAN_ENERGY_COST;
window.SCAN_COOLDOWN_DURATION_SECONDS = SCAN_COOLDOWN_DURATION_SECONDS;
window.SCAN_REVEAL_DURATION_SECONDS = SCAN_REVEAL_DURATION_SECONDS;

const BASE_COORDINATES = { x: 15, y: 15 };
window.BASE_COORDINATES = BASE_COORDINATES;
const DEFAULT_MAP_SIZE = { width: 30, height: 30 };
window.DEFAULT_MAP_SIZE = DEFAULT_MAP_SIZE;


console.log("config_world.js - Données du monde (zones, ennemis d'exploration, bases) définies.");