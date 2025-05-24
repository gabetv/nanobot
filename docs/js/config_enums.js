// js/config_enums.js
console.log("config_enums.js - Fichier chargé et en cours d'analyse...");

var TILE_TYPES = {
    UNEXPLORED: 0, EMPTY_GRASSLAND: 1, EMPTY_DESERT: 2, EMPTY_WATER: 3, FOREST: 4, MOUNTAIN: 5, RUINS: 6, PLAYER_BASE: 7,
    RESOURCE_BIOMASS_PATCH: 10, RESOURCE_NANITE_DEPOSIT: 11, RESOURCE_CRYSTAL_VEIN: 12,
    UPGRADE_CACHE: 15,
    POI_ANCIENT_STRUCTURE: 20, ENEMY_OUTPOST_TILE: 21, MERCHANT_WRECKAGE: 22,
    ENEMY_PATROL_WEAK: 30, ENEMY_PATROL_MEDIUM: 31,
    PRE_EMPTY: 50, PRE_WATER: 51, PRE_ROUGH_TERRAIN: 52, PRE_HIGH_MOUNTAIN: 53,
    PRE_RUIN_SILHOUETTE: 150, PRE_LARGE_CRYSTAL_CLUSTER: 151, PRE_HOSTILE_STRUCTURE: 152, PRE_DISTRESS_SIGNAL: 153,
    IMPASSABLE_DEEP_WATER: 98, IMPASSABLE_HIGH_PEAK: 99,
    // NOUVEAUX AJOUTS POUR LES OBSTACLES
    DEBRIS_FIELD: 80, THICK_VINES: 81,
    PRE_DEBRIS_FIELD: 180, PRE_THICK_VINES: 181,
};

var MAP_FEATURE_DATA = {
    [TILE_TYPES.RUINS]: { name: "Ruines Désolées", description: "Vestiges d'une civilisation oubliée." },
    [TILE_TYPES.POI_ANCIENT_STRUCTURE]: {
        name: "Structure Antique",
        description: "Une construction énigmatique pulse d'une faible énergie.",
        // La logique d'interaction complexe pour les POI serait dans un autre fichier config ou directement gérée par le code
    },
    [TILE_TYPES.ENEMY_OUTPOST_TILE]: { name: "Avant-poste Hostile", description: "Activité ennemie détectée." },
    [TILE_TYPES.MERCHANT_WRECKAGE]: { name: "Épave Marchande", description: "Les restes d'un transporteur." },
    [TILE_TYPES.PRE_RUIN_SILHOUETTE]: { name: "Silhouette de Ruines", description: "Des formes évoquant des constructions anciennes." },
    [TILE_TYPES.PRE_LARGE_CRYSTAL_CLUSTER]: { name: "Grand Amas Cristallin", description: "Une lueur émane de cristaux." },
    [TILE_TYPES.PRE_HOSTILE_STRUCTURE]: { name: "Structure suspecte", description: "Construction d'origine inconnue, potentiellement hostile." },
    [TILE_TYPES.PRE_DISTRESS_SIGNAL]: { name: "Signal de Détresse", description: "Un signal faible émane de cette direction." },
    // NOUVEAUX AJOUTS POUR LES OBSTACLES
    [TILE_TYPES.DEBRIS_FIELD]: { name: "Champ de Débris Dens", description: "Passage difficile sans équipement adapté." },
    [TILE_TYPES.THICK_VINES]: { name: "Vignes Épaisses", description: "Une végétation dense bloque le chemin." },
};

var DAMAGE_TYPES = { KINETIC: 'kinetic', ENERGY: 'energy' /* , EXPLOSIVE: 'explosive', etc. */ };

var EQUIPMENT_SLOTS = { weapon: "Arme Principale", armor: "Blindage", utility1: "Utilitaire Alpha", utility2: "Utilitaire Beta" };

var QUEST_STATUS = { LOCKED: 0, AVAILABLE: 1, ACTIVE: 2, COMPLETED: 3, FINISHED: 4 };

console.log("config_enums.js - Énumérations et types définis.");
if (typeof TILE_TYPES === 'undefined' || typeof DAMAGE_TYPES === 'undefined' || typeof QUEST_STATUS === 'undefined' || typeof MAP_FEATURE_DATA === 'undefined') {
    console.error("config_enums.js - ERREUR: TILE_TYPES, DAMAGE_TYPES, QUEST_STATUS ou MAP_FEATURE_DATA n'est pas défini !");
}