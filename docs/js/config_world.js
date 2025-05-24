// js/config_world.js
console.log("config_world.js - Fichier chargé et en cours d'analyse...");

// Assurez-vous que TILE_TYPES, DAMAGE_TYPES, itemsData (si utilisé pour loot) sont définis avant ce fichier.
// Ces variables sont déclarées avec 'var' dans leurs fichiers respectifs pour être globales.

var TILE_TYPES_TO_RESOURCE_KEY = {
    [TILE_TYPES.RESOURCE_BIOMASS_PATCH]: 'biomass',
    [TILE_TYPES.RESOURCE_NANITE_DEPOSIT]: 'nanites',
    [TILE_TYPES.RESOURCE_CRYSTAL_VEIN]: 'crystal_shards'
    // Add other direct TILE_TYPE to resource string key mappings here if needed
};

var explorationEnemyData = { // VOTRE explorationEnemyData EXISTANT, VÉRIFIEZ QU'IL EST COMPLET
    'drone_scout': { name: "Drone Éclaireur", health: 20, maxHealth:20, attack: 5, defense: 0, reward: {biomass:5, nanites:3, xp:10}, actualTileType: TILE_TYPES.ENEMY_PATROL_WEAK, spritePath: 'https://placehold.co/80x100/718096/e2e8f0?text=ScoutD' },
    'raider_grunt': { name: "Pilleur novice", health: 35, maxHealth:35, attack: 8, defense: 2, reward: {biomass:12, nanites:8, xp:20}, actualTileType: TILE_TYPES.ENEMY_PATROL_WEAK, spritePath: 'https://placehold.co/80x100/e53e3e/e2e8f0?text=Raider' },
    'mutated_creature': { name: "Créature Mutante", health: 50, maxHealth:50, attack: 10, defense: 3, reward: {biomass:20, xp:25}, actualTileType: TILE_TYPES.ENEMY_PATROL_MEDIUM, spritePath: 'https://placehold.co/80x100/48bb78/1a202c?text=Mutant' },
    'heavy_security_bot': { name: "Bot de Sécurité Lourd", health: 70, maxHealth:70, attack: 12, defense: 5, reward: {nanites:25, xp:40, loot:['comp_av']}, actualTileType: TILE_TYPES.ENEMY_PATROL_MEDIUM, spritePath: 'https://placehold.co/80x100/a0aec0/1a202c?text=SecBot' },
    'enemy_crystal_golem': { name: "Golem de Cristal", health: 70, maxHealth:70, attack: 12, defense: 6, damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0.3, energy: -0.2 }, spritePath: 'https://placehold.co/80x100/67e8f9/1a202c?text=GolemC', reward: { biomass: 20, nanites: 15, xp: 50, loot: ['crist_stock'] }, actualTileType: TILE_TYPES.ENEMY_PATROL_MEDIUM },
    'enemy_spark_wisp': { name: "Feu Follet Étincelant", health: 30, maxHealth:30, attack: 10, defense: 0, damageType: DAMAGE_TYPES.ENERGY, resistances: { energy: 0.4, kinetic: -0.25 }, spritePath: 'https://placehold.co/80x100/facc15/1a202c?text=WispS', reward: { nanites: 20, xp: 35 }, actualTileType: TILE_TYPES.ENEMY_PATROL_MEDIUM },
    'enemy_crystal_golem_weak': { name: "Petit Golem de Cristal", health: 50, maxHealth:50, attack: 10, defense: 5, reward: {xp:30, loot:['crist_stock']}, actualTileType: TILE_TYPES.ENEMY_PATROL_MEDIUM, spritePath: 'https://placehold.co/80x100/9f7aea/e2e8f0?text=SmGolem' },
    'enemy_spark_wisp_scout': { name: "Éclaireur Feu Follet", health: 25, maxHealth:25, attack: 8, defense: 0, reward: {nanites:15, xp:20}, actualTileType: TILE_TYPES.ENEMY_PATROL_WEAK, spritePath: 'https://placehold.co/80x100/faf089/1a202c?text=ScWisp' }
};

var enemyBaseDefinitions = { // VOTRE enemyBaseDefinitions EXISTANT
    'outpost_alpha': {
        id: 'outpost_alpha', name: "Avant-poste Alpha",
        actualTileType: TILE_TYPES.ENEMY_OUTPOST_TILE, visibleStructureType: TILE_TYPES.PRE_HOSTILE_STRUCTURE,
        health: 250,
        defenders: [ { id: 'raider_grunt', count: 2 }, { id: 'drone_scout', count: 1 } ],
        loot: ['comp_av', 'nanites_medium_cache', 'item_repair_kit_s'],
        xpReward: 100,
        onDiscoveryText: "Un avant-poste ennemi rudimentaire bloque le passage.",
        onAttackText: "Vous engagez l'avant-poste Alpha !",
        onDestroyedText: "L'avant-poste Alpha est neutralisé. La voie est libre et des ressources ont été récupérées."
    },
    'crystal_hive_node': { /* ... Votre définition ... */ }
};

var ZONE_DATA = { // VOTRE ZONE_DATA EXISTANT, VÉRIFIEZ QU'IL EST COMPLET
    'verdant_archipelago': {
        id: 'verdant_archipelago',
        name: "Archipel Verdoyant",
        mapSize: { width: 25, height: 20 },
        entryPoint: { x: 3, y: 3 },
        basePlayerCoordinates: { x: 3, y: 3 }, // Coordonnées du Noyau dans cette zone
        baseTerrainLayout: [], // Peut être rempli par mapManager ou défini statiquement ici
        visibleStructureLayout: [], // Idem
        tileContentDistribution: { // Chance de trouver ce contenu sur une tuile générique explorable
            [TILE_TYPES.RESOURCE_BIOMASS_PATCH]: 0.10, // Réduit un peu pour faire de la place aux nouveaux obstacles
            [TILE_TYPES.RESOURCE_NANITE_DEPOSIT]: 0.03,
            [TILE_TYPES.FOREST]: 0.12,
            [TILE_TYPES.RUINS]: 0.03,
            [TILE_TYPES.UPGRADE_CACHE]: 0.02,
            [TILE_TYPES.POI_ANCIENT_STRUCTURE]: 0.01,
            'drone_scout': 0.04,
            'raider_grunt': 0.03,
            'outpost_alpha': 0.01,
            // AJOUT DE NOUVEAUX OBSTACLES DANS LA DISTRIBUTION
            [TILE_TYPES.DEBRIS_FIELD]: 0.05, // 5% de chance d'avoir un champ de débris
            [TILE_TYPES.THICK_VINES]: 0.04,  // 4% de chance d'avoir des vignes
        },
        patrolEnemyPool: ['drone_scout', 'raider_grunt']
    },
    'crystal_caves': {
        id: 'crystal_caves',
        name: "Grottes Cristallines",
        mapSize: { width: 20, height: 20 },
        entryPoint: { x: 1, y: 10 },
        baseTerrainLayout: [],
        visibleStructureLayout: [],
        tileContentDistribution: {
            [TILE_TYPES.RESOURCE_NANITE_DEPOSIT]: 0.10,
            [TILE_TYPES.RESOURCE_CRYSTAL_VEIN]: 0.15,
            [TILE_TYPES.MOUNTAIN]: 0.20,
            'enemy_crystal_golem_weak': 0.08,
            [TILE_TYPES.UPGRADE_CACHE]: 0.04,
            'crystal_hive_node': 0.015,
            [TILE_TYPES.DEBRIS_FIELD]: 0.06, // Aussi dans les grottes
        },
        patrolEnemyPool: ['enemy_crystal_golem_weak', 'enemy_spark_wisp_scout'],
        unlockCondition: { research: 'advanced_geology' }
    }
    // Add other zones here
};

// BASE_COORDINATES est crucial et doit être défini après ZONE_DATA.
// Il pointe vers la base du joueur dans la zone de départ.
// Assurez-vous que DEFAULT_MAP_SIZE est défini (normalement dans config_general.js)
var BASE_COORDINATES = (ZONE_DATA['verdant_archipelago'] && ZONE_DATA['verdant_archipelago'].basePlayerCoordinates)
                       ? { ...ZONE_DATA['verdant_archipelago'].basePlayerCoordinates }
                       : { x: Math.floor((typeof DEFAULT_MAP_SIZE !== 'undefined' ? DEFAULT_MAP_SIZE.width : 10) / 2), y: Math.floor((typeof DEFAULT_MAP_SIZE !== 'undefined' ? DEFAULT_MAP_SIZE.height : 10) / 2) };


console.log("config_world.js - Données du monde (zones, ennemis d'exploration, bases) définies.");
if (typeof ZONE_DATA === 'undefined' || typeof explorationEnemyData === 'undefined' || typeof enemyBaseDefinitions === 'undefined' || typeof TILE_TYPES_TO_RESOURCE_KEY === 'undefined' || typeof BASE_COORDINATES === 'undefined') {
    console.error("config_world.js - ERREUR: Une ou plusieurs structures de données du monde ne sont pas définies !");
}