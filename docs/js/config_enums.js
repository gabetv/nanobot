// js/config_enums.js
console.log("config_enums.js - Fichier chargé et en cours d'analyse...");

const DAMAGE_TYPES = {
    KINETIC: 'kinetic',
    ENERGY: 'energy',
    EXPLOSIVE: 'explosive',
    CORROSIVE: 'corrosive',
    THERMAL: 'thermal',
    PSI: 'psi'
};
window.DAMAGE_TYPES = DAMAGE_TYPES; // Rendre global explicitement

const RESOURCE_TYPES = {
    BIOMASS: 'biomass',
    NANITES: 'nanites',
    ENERGY: 'energy',
    CRYSTAL_SHARDS: 'crystal_shards',
    ALLOY_PLATES: 'alloy_plates', // Exemple d'item ressource
    CIRCUIT_BOARDS: 'circuit_boards' // Exemple d'item ressource
};
window.RESOURCE_TYPES = RESOURCE_TYPES;

const STAT_NAMES = {
    health: "Santé",
    maxHealth: "Santé Max",
    currentHealth: "Santé Actuelle",
    attack: "Attaque",
    defense: "Défense",
    speed: "Vitesse",
    range: "Portée",
    critChance: "Chance Critique",
    critDamage: "Dégâts Critiques",
    energyCost: "Coût Énergie",
    cooldown: "Temps de Recharge",
    productionRate: "Taux de Production",
    capacity: "Capacité",
    researchSpeed: "Vitesse Recherche",
    miningSpeed: "Vitesse Minage", // Pour modules
    crystalYield: "Rendement Cristal" // Pour modules
};
window.STAT_NAMES = STAT_NAMES;

const ENEMY_TAGS = {
    ORGANIC: 'organic',
    MECHANICAL: 'mechanical',
    SWARM: 'swarm',
    HEAVY: 'heavy',
    RANGED: 'ranged',
    MELEE: 'melee',
    FLYING: 'flying',
    GROUND: 'ground',
    BOSS: 'boss'
};
window.ENEMY_TAGS = ENEMY_TAGS;

const QUEST_STATUS = {
    LOCKED: 'LOCKED',
    AVAILABLE: 'AVAILABLE',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED', // Signifie que les objectifs sont remplis, récompenses à collecter
    FINISHED: 'FINISHED',   // Signifie que les récompenses ont été données (ou pas d'étape de collecte)
    FAILED: 'FAILED'
};
window.QUEST_STATUS = QUEST_STATUS;

const QUEST_TYPE = {
    MAIN_STORY: 'main_story',
    SIDE_QUEST: 'side_quest',
    TUTORIAL: 'tutorial',
    REPEATABLE: 'repeatable',
    EVENT: 'event'
};
window.QUEST_TYPE = QUEST_TYPE;

const OBJECTIVE_TYPE = {
    COLLECT_RESOURCE: 'collect_resource',
    DEFEAT_ENEMY_TYPE: 'defeat_enemy_type',
    DEFEAT_SPECIFIC_ENEMY: 'defeat_specific_enemy',
    BUILD_BUILDING: 'build_building', // Pour la construction initiale
    BUILD_LEVEL: 'build_level',       // Pour atteindre un certain niveau d'un bâtiment
    RESEARCH_TECH: 'research_tech',
    REACH_LOCATION: 'reach_location',
    EXPLORE_TILE: 'explore_tile', // Explorer une case spécifique
    EXPLORE_TILES: 'explore_tiles', // Explorer un certain nombre de nouvelles cases
    EXPLORE_TILE_TYPE: 'explore_tile_type', // Explorer une case d'un type donné
    INTERACT_POI_TYPE: 'interact_poi_type', // Interagir avec un type de POI
    DESTROY_ENEMY_BASE: 'destroy_enemy_base', // Détruire une base ennemie spécifique
    TALK_TO_NPC: 'talk_to_npc',
    USE_ITEM: 'use_item',
    UPGRADE_MODULE: 'upgrade_module',
    COMPLETE_QUEST: 'complete_quest', // Objectif de type "meta"
    REACH_LEVEL: 'reach_level' // Pour le niveau du Nanobot
};
window.OBJECTIVE_TYPE = OBJECTIVE_TYPE;

const UNLOCK_TYPE = {
    BUILDING: 'building',
    RESEARCH: 'research',
    MODULE: 'module',
    ITEM: 'item',
    FEATURE: 'feature',
    ZONE: 'zone',
    SKILL: 'skill',
    RECIPE: 'recipe'
};
window.UNLOCK_TYPE = UNLOCK_TYPE;

const RARITY_COLORS = {
    common: 'text-gray-300',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-500',
    mythic: 'text-red-500',
    unique: 'text-pink-400',
    consumable_reward: 'text-orange-400' // Pour les récompenses consommables spéciales
};
window.RARITY_COLORS = RARITY_COLORS;

const LOOT_TABLE_TIERS = {
    NONE: "none",
    TIER1_COMMON: "tier1_common",
    TIER1_UNCOMMON: "tier1_uncommon",
    TIER1_RARE: "tier1_rare",
    TIER2_COMMON: "tier2_common",
    TIER2_UNCOMMON: "tier2_uncommon",
    TIER2_RARE: "tier2_rare",
    TIER3_EPIC: "tier3_epic",
    BOSS_UNIQUE: "boss_unique"
};
window.LOOT_TABLE_TIERS = LOOT_TABLE_TIERS;

const EQUIPMENT_SLOTS = {
    WEAPON: "Arme",
    ARMOR_CORE: "Noyau d'Armure",
    SHIELD_GENERATOR: "Générateur de Bouclier",
    MOBILITY_SYSTEM: "Système de Mobilité",
    UTILITY_A: "Utilitaire Alpha",
    UTILITY_B: "Utilitaire Beta",
    PROCESSOR: "Processeur Auxiliaire"
};
window.EQUIPMENT_SLOTS = EQUIPMENT_SLOTS;

const TILE_TYPES = {
    // System / Meta types
    UNKNOWN: "unknown",
    PLAYER_BASE: "player_base",
    BASE_CORE_TILE: "base_core_tile",
    DEFENSE_PLATFORM: "defense_platform",

    // Pre-generation types (used by mapManager to determine actualType)
    PRE_EMPTY: "pre_empty",                     // Default, becomes grassland or desert etc.
    PRE_WATER: "pre_water",                     // Becomes shallow or deep water
    PRE_ROUGH_TERRAIN: "pre_rough_terrain",     // Becomes hills or mountains
    PRE_HIGH_MOUNTAIN: "pre_high_mountain",     // Becomes impassable peak
    PRE_DEBRIS_FIELD: "pre_debris_field",       // Becomes debris field
    PRE_THICK_VINES: "pre_thick_vines",         // Becomes thick vines
    PRE_RUIN_SILHOUETTE: "pre_ruin_silhouette", // For visual cue on map
    PRE_HOSTILE_STRUCTURE: "pre_hostile_structure", // For visual cue of enemy base

    // Actual traversable/interactable types
    EMPTY_SPACE: "empty_space",                 // Truly empty, rare
    EMPTY_GRASSLAND: "empty_grassland",
    EMPTY_DESERT: "empty_desert",
    EMPTY_WATER: "empty_water",                 // Shallow, traversable water

    FOREST: "forest",                           // Generic forest type (can be main type for forest_light/dense if needed)
    FOREST_LIGHT: "forest_light",
    FOREST_DENSE: "forest_dense",
    HILLS: "hills",
    MOUNTAIN: "mountain",                       // Traversable mountains
    MOUNTAINS_LOW: "mountains_low",             // Specific low mountains

    RUINS: "ruins",                             // Generic ruins (can be main type for ancient_ruins)
    RUINS_ANCIENT: "ruins_ancient",

    DEBRIS_FIELD: "debris_field",               // Traversable, may require module
    DEBRIS_FIELD_LIGHT: "debris_field_light",
    DEBRIS_FIELD_DENSE: "debris_field_dense",
    THICK_VINES: "thick_vines",                 // Traversable, may require module

    // Resource node types (often also POIs, content defines specifics)
    RESOURCE_BIOMASS_PATCH: "resource_biomass_patch",
    RESOURCE_NANITE_DEPOSIT: "resource_nanite_deposit",
    RESOURCE_CRYSTAL_VEIN: "resource_crystal_vein",
    CRYSTAL_OUTCROP: "crystal_outcrop",
    BIOMASS_RICH_PATCH: "biomass_rich_patch",
    NANITE_DEPOSIT_EXPOSED: "nanite_deposit_exposed",

    // Points of Interest (POIs) - can also be the actualType
    UPGRADE_CACHE: "upgrade_cache",
    POI_ANCIENT_STRUCTURE: "poi_ancient_structure",
    MERCHANT_WRECKAGE: "merchant_wreckage",
    CAVE_ENTRANCE: "cave_entrance",
    POI_DISTRESS_SIGNAL: "poi_distress_signal",
    POI_CRASHED_SHIP: "poi_crashed_ship",

    // Hostile tile types (where content is the enemy/base)
    ENEMY_OUTPOST_TILE: "enemy_outpost_tile",   // The tile type of an enemy base structure
    ENEMY_PATROL_WEAK: "enemy_patrol_weak",
    ENEMY_PATROL_MEDIUM: "enemy_patrol_medium",
    ENEMY_OUTPOST: "enemy_outpost", // As used in tileData, likely refers to ENEMY_OUTPOST_TILE

    // Impassable tile types
    IMPASSABLE_DEEP_WATER: "impassable_deep_water",
    IMPASSABLE_HIGH_PEAK: "impassable_high_peak",
    MOUNTAINS_IMPASSABLE: "mountains_impassable", // Likely maps to IMPASSABLE_HIGH_PEAK
    WATER_DEEP: "water_deep"                      // Likely maps to IMPASSABLE_DEEP_WATER
};
window.TILE_TYPES = TILE_TYPES;

console.log("config_enums.js - Énumérations et types définis.");