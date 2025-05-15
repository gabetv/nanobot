// js/config.js
console.log("config.js - Fichier chargé et en cours d'analyse...");

var TICK_SPEED = 1000;
var DAY_DURATION = 5 * 60 * (1000 / TICK_SPEED);
var NIGHT_DURATION = 3 * 60 * (1000 / TICK_SPEED);
var COMBAT_ANIMATION_DELAY_BASE = 700;
// var EXPLORATION_COST_ENERGY = 5; // Ancienne constante, peut être supprimée ou commentée
var EXPLORATION_COST_MOBILITY = 1; // Coût d'un déplacement en points de mobilité
var MAX_MOBILITY_POINTS = 10; // Maximum de points de mobilité
var MOBILITY_RECHARGE_RATE_PER_MINUTE = 1; // Combien de points sont rechargés par minute
var MOBILITY_RECHARGE_TICKS = Math.floor(60 / MOBILITY_RECHARGE_RATE_PER_MINUTE * (1000 / TICK_SPEED)); // Ticks nécessaires pour recharger 1 point

var DEFAULT_MAP_SIZE = { width: 25, height: 20 };
var BASE_GRID_SIZE = { rows: 9, cols: 13 };
var SCAN_ENERGY_COST = 15; // Le scan continue d'utiliser de l'énergie
var SCAN_COOLDOWN_DURATION_SECONDS = 10;
var SCAN_REVEAL_DURATION_SECONDS = 20;
var SCAN_COOLDOWN_DURATION = SCAN_COOLDOWN_DURATION_SECONDS; 
var SCAN_REVEAL_DURATION = SCAN_REVEAL_DURATION_SECONDS;   

var TILE_TYPES = {
    UNEXPLORED: 0, EMPTY_GRASSLAND: 1, EMPTY_DESERT: 2, EMPTY_WATER: 3, FOREST: 4, MOUNTAIN: 5, RUINS: 6, PLAYER_BASE: 7,
    RESOURCE_BIOMASS_PATCH: 10, RESOURCE_NANITE_DEPOSIT: 11, RESOURCE_CRYSTAL_VEIN: 12,
    UPGRADE_CACHE: 15,
    POI_ANCIENT_STRUCTURE: 20, ENEMY_OUTPOST_TILE: 21, MERCHANT_WRECKAGE: 22,
    ENEMY_PATROL_WEAK: 30, ENEMY_PATROL_MEDIUM: 31,
    PRE_EMPTY: 50, PRE_WATER: 51, PRE_ROUGH_TERRAIN: 52, PRE_HIGH_MOUNTAIN: 53,
    PRE_RUIN_SILHOUETTE: 150, PRE_LARGE_CRYSTAL_CLUSTER: 151, PRE_HOSTILE_STRUCTURE: 152, PRE_DISTRESS_SIGNAL: 153,
    IMPASSABLE_DEEP_WATER: 98, IMPASSABLE_HIGH_PEAK: 99
};

var MAP_FEATURE_DATA = {
    [TILE_TYPES.RUINS]: { name: "Ruines Désolées", description: "Vestiges d'une civilisation oubliée." },
    [TILE_TYPES.POI_ANCIENT_STRUCTURE]: { name: "Structure Antique", description: "Une construction énigmatique pulse d'une faible énergie." },
    [TILE_TYPES.ENEMY_OUTPOST_TILE]: { name: "Avant-poste Hostile", description: "Activité ennemie détectée." },
    [TILE_TYPES.MERCHANT_WRECKAGE]: { name: "Épave Marchande", description: "Les restes d'un transporteur." },
    [TILE_TYPES.PRE_RUIN_SILHOUETTE]: { name: "Silhouette de Ruines", description: "Des formes évoquant des constructions anciennes." },
    [TILE_TYPES.PRE_LARGE_CRYSTAL_CLUSTER]: { name: "Grand Amas Cristallin", description: "Une lueur émane de cristaux." },
    [TILE_TYPES.PRE_HOSTILE_STRUCTURE]: { name: "Structure suspecte", description: "Construction d'origine inconnue, potentiellement hostile." },
    [TILE_TYPES.PRE_DISTRESS_SIGNAL]: { name: "Signal de Détresse", description: "Un signal faible émane de cette direction." }
};

var DAMAGE_TYPES = { KINETIC: 'kinetic', ENERGY: 'energy' };
var BASE_INITIAL_HEALTH = 500;
var EQUIPMENT_SLOTS = { weapon: "Arme Principale", armor: "Blindage", utility1: "Utilitaire Alpha", utility2: "Utilitaire Beta" };
var NIGHT_ASSAULT_TICK_INTERVAL = 5000 / TICK_SPEED;
var REPAIR_COST_BASE_HEALTH_BIOMASS = 2;
var REPAIR_COST_BASE_HEALTH_NANITES = 1;
var REPAIR_COST_DEFENSE_HEALTH_BIOMASS = 1;
var REPAIR_COST_DEFENSE_HEALTH_NANITES = 1;
var FORCE_CYCLE_CHANGE_COST = { biomass: 100, nanites: 50 };
var SELL_REFUND_FACTOR = 0.5;
var BOSS_WAVE_INTERVAL = 5;
var SPECIAL_EVENT_CHANCE = 0.15;
var QUEST_STATUS = { LOCKED: 0, AVAILABLE: 1, ACTIVE: 2, COMPLETED: 3, FINISHED: 4 };

var explorationEnemyData = {
    'drone_scout': { name: "Drone Éclaireur", health: 20, maxHealth:20, attack: 5, defense: 0, reward: {biomass:5, nanites:3, xp:10}, actualTileType: TILE_TYPES.ENEMY_PATROL_WEAK, spritePath: 'https://placehold.co/80x100/718096/e2e8f0?text=ScoutD' },
    'raider_grunt': { name: "Pilleur novice", health: 35, maxHealth:35, attack: 8, defense: 2, reward: {biomass:12, nanites:8, xp:20}, actualTileType: TILE_TYPES.ENEMY_PATROL_WEAK, spritePath: 'https://placehold.co/80x100/e53e3e/e2e8f0?text=Raider' },
    'mutated_creature': { name: "Créature Mutante", health: 50, maxHealth:50, attack: 10, defense: 3, reward: {biomass:20, xp:25}, actualTileType: TILE_TYPES.ENEMY_PATROL_MEDIUM, spritePath: 'https://placehold.co/80x100/48bb78/1a202c?text=Mutant' },
    'heavy_security_bot': { name: "Bot de Sécurité Lourd", health: 70, maxHealth:70, attack: 12, defense: 5, reward: {nanites:25, xp:40, loot:['comp_av']}, actualTileType: TILE_TYPES.ENEMY_PATROL_MEDIUM, spritePath: 'https://placehold.co/80x100/a0aec0/1a202c?text=SecBot' },
    'enemy_crystal_golem': { name: "Golem de Cristal", health: 70, maxHealth:70, attack: 12, defense: 6, damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0.3, energy: -0.2 }, spritePath: 'https://placehold.co/80x100/67e8f9/1a202c?text=GolemC', reward: { biomass: 20, nanites: 15, xp: 50, loot: ['crist_stock'] }, actualTileType: TILE_TYPES.ENEMY_PATROL_MEDIUM },
    'enemy_spark_wisp': { name: "Feu Follet Étincelant", health: 30, maxHealth:30, attack: 10, defense: 0, damageType: DAMAGE_TYPES.ENERGY, resistances: { energy: 0.4, kinetic: -0.25 }, spritePath: 'https://placehold.co/80x100/facc15/1a202c?text=WispS', reward: { nanites: 20, xp: 35 }, actualTileType: TILE_TYPES.ENEMY_PATROL_MEDIUM },
    'enemy_crystal_golem_weak': { name: "Petit Golem de Cristal", health: 50, maxHealth:50, attack: 10, defense: 5, reward: {xp:30, loot:['crist_stock']}, actualTileType: TILE_TYPES.ENEMY_PATROL_MEDIUM, spritePath: 'https://placehold.co/80x100/9f7aea/e2e8f0?text=SmGolem' },
    'enemy_spark_wisp_scout': { name: "Éclaireur Feu Follet", health: 25, maxHealth:25, attack: 8, defense: 0, reward: {nanites:15, xp:20}, actualTileType: TILE_TYPES.ENEMY_PATROL_WEAK, spritePath: 'https://placehold.co/80x100/faf089/1a202c?text=ScWisp' }
};

var enemyBaseDefinitions = {
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
    'crystal_hive_node': {
        id: 'crystal_hive_node', name: "Nœud de Ruche Cristalline",
        actualTileType: TILE_TYPES.ENEMY_OUTPOST_TILE, visibleStructureType: TILE_TYPES.PRE_LARGE_CRYSTAL_CLUSTER,
        health: 400,
        defenders: [ { id: 'enemy_crystal_golem', count: 1 }, { id: 'enemy_spark_wisp', count: 4 } ],
        loot: ['crist_stock_large', 'arte_rare', 'crystal_shards_large_cache'],
        xpReward: 250,
        onDiscoveryText: "Une imposante structure cristalline pulse d'énergie... un nœud de ruche.",
        onAttackText: "Vous attaquez le nœud de la ruche cristalline. Les défenseurs émergent !",
        onDestroyedText: "Le nœud de la ruche explose en une myriade d'éclats. D'importantes ressources cristallines sont exposées."
    }
};

var itemsData = {
    'comp_av': { id: 'comp_av', name: "Composant Avancé", slot: null, description: "Matériau de fabrication pour modules et équipements de haut niveau.", cost: null, rarity: "material" },
    'mod_proto': { id: 'mod_proto', name: "Module Prototypé", slot: null, description: "Un prototype de module, instable mais puissant. Utilisé dans des crafts avancés.", cost: null, rarity: "material"},
    'nanites_medium_cache': { id: 'nanites_medium_cache', name: "Cache Moyenne de Nanites", slot: null, consumable: true, description: "Une cache de nanites à usage unique. Fournit 150 Nanites.", onUse: (gs) => { gs.resources.nanites = (gs.resources.nanites || 0) + 150; if(typeof addLogEntry === 'function') addLogEntry("Cache de nanites activée: +150 Nanites!", "success", eventLogEl, gs.eventLog); return true; }, cost: null, rarity: "consumable_reward" },
    'item_repair_kit_s': { id: 'item_repair_kit_s', name: "Kit de Réparation (S)", slot: null, consumable: true, description: "Restaure instantanément 25 PV au Nanobot.", onUse: (gs) => { if(gs.nanobotStats.currentHealth < gs.nanobotStats.health) { gs.nanobotStats.currentHealth = Math.min(gs.nanobotStats.health, gs.nanobotStats.currentHealth + 25); if(typeof addLogEntry === 'function') addLogEntry("Kit de réparation utilisé: +25 PV.", "success", eventLogEl, gs.eventLog); if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateNanobotDisplay === 'function') uiUpdates.updateNanobotDisplay(); return true;} else { if(typeof addLogEntry === 'function') addLogEntry("PV du Nanobot déjà au maximum.", "info", eventLogEl, gs.eventLog); return false;} }, cost: {nanites: 50}, rarity: "common" },
    'crist_stock': { id: 'crist_stock', name: "Stock de Cristal", slot: null, description: "Cristaux bruts, nécessaires pour certaines technologies avancées.", cost: null, rarity: "material"},
    'crist_stock_large': { id: 'crist_stock_large', name: "Grand Stock de Cristal", slot: null, consumable: true, description: "Une grande quantité de cristaux bruts. Fournit 75 Cristaux.", onUse: (gs) => { gs.resources.crystal_shards = (gs.resources.crystal_shards || 0) + 75; if(typeof addLogEntry === 'function') addLogEntry("Vous récupérez un grand stock de cristaux, +75 Cristaux!", "success", eventLogEl, gs.eventLog); return true; }, cost: null, rarity: "consumable_reward"},
    'arte_rare': { id: 'arte_rare', name: "Artefact Rare", slot: null, description: "Une relique d'une technologie perdue, de grande valeur.", cost: null, rarity: "rare_material"},
    'crystal_shards_large_cache': {id: 'crystal_shards_large_cache', name: "Grande Cache d'Éclats de Cristal", slot:null, consumable: true, description: "Une grande cache d'éclats de cristal purifiés. Fournit 200 Éclats de Cristal.", onUse: (gs) => { gs.resources.crystal_shards = (gs.resources.crystal_shards || 0) + 200; if(typeof addLogEntry === 'function') addLogEntry("Grande cache de cristaux: +200 Éclats!", "success", eventLogEl, gs.eventLog); return true;}, cost:null, rarity:"consumable_reward"},
    'frag_alien': {id: 'frag_alien', name: "Fragment Alien", slot: null, description: "Fragment technologique d'origine inconnue, potentiellement utile.", cost: null, rarity: "material"},

    'item_laser_mk1': { id: 'item_laser_mk1', name: "Laser de Précision Mk1", slot: "weapon", description: "Un laser compact offrant des dégâts Énergétiques constants.", statBoost: { attack: 8 }, damageType: DAMAGE_TYPES.ENERGY, visualClass: 'item-weapon-laser', cost: { nanites: 150, biomass: 50 }, rarity: "uncommon" },
    'item_nanosword': { id: 'item_nanosword', name: "Épée Nanotechnologique", slot: "weapon", description: "Une lame physique affûtée, infligeant des dégâts Cinétiques précis.", statBoost: { attack: 10, speed: -1 }, damageType: DAMAGE_TYPES.KINETIC, visualClass: 'module-arm-blade', cost: { nanites: 120, biomass: 80 }, rarity: "uncommon" },
    'item_plating_basic': { id: 'item_plating_basic', name: "Plaquage Standard", slot: "armor", description: "Plaques de blindage basiques mais fiables pour le Nexus-7.", statBoost: { defense: 5, health: 10 }, visualClass: 'item-armor-plating', cost: { nanites: 100, biomass: 100 }, rarity: "common" },
    'item_advanced_scope': { id: 'item_advanced_scope', name: "Viseur Avancé", slot: "utility2", description: "Améliore la précision des systèmes d'armes, augmentant légèrement l'attaque.", statBoost: { attack: 3, speed: -1 }, cost: { nanites: 200 }, rarity: "uncommon" }
};

var buildingsData = {
    'biomassHarvester': { name: "Collecteur de Biomasse", type:"production", description: "Récolte la Biomasse organique environnante.", levels: [ { level: 1, costToUnlockOrUpgrade: { biomass: 50 }, production: { biomass: 1 }, energyConsumption: 2 }, { level: 2, costToUpgrade: { biomass: 120, nanites: 20 }, production: { biomass: 3 }, energyConsumption: 4 }, { level: 3, costToUpgrade: { biomass: 250, nanites: 50, comp_av: 1 }, production: { biomass: 6 }, energyConsumption: 6 } ] },
    'naniteFactory': { name: "Usine de Nanites", type:"production", description: "Assemble des Nanites à partir de matériaux bruts.", levels: [ { level: 1, costToUnlockOrUpgrade: { biomass: 80, nanites: 10 }, production: { nanites: 0.5 }, energyConsumption: 5 }, { level: 2, costToUpgrade: { biomass: 200, nanites: 50 }, production: { nanites: 1.5 }, energyConsumption: 8 }, { level: 3, costToUpgrade: { biomass: 400, nanites: 120, comp_av: 1 }, production: { nanites: 3 }, energyConsumption: 12 } ] },
    'powerPlant': { name: "Générateur d'Énergie", type:"utility", description: "Fournit l'énergie nécessaire au fonctionnement des modules.", levels: [ { level: 1, costToUnlockOrUpgrade: { biomass: 60, nanites: 20 }, capacity: { energy: 50 }, energyConsumption: 0 }, { level: 2, costToUpgrade: { biomass: 150, nanites: 50 }, capacity: { energy: 100 }, energyConsumption: 0 }, { level: 3, costToUpgrade: { biomass: 300, nanites: 100, comp_av: 1 }, capacity: { energy: 200 }, energyConsumption: 0 } ] },
    'researchLab': { name: "Laboratoire de Recherche", type:"utility", description: "Permet de débloquer de nouvelles technologies et améliorations.", levels: [ { level: 1, costToUnlockOrUpgrade: { biomass: 100, nanites: 100 }, researchSpeedFactor: 1, energyConsumption: 10 }, { level: 2, costToUpgrade: { biomass: 250, nanites: 250, comp_av: 1 }, researchSpeedFactor: 1.5, energyConsumption: 15 } ] },
    'defenseFoundry': { name: "Fonderie Défensive", type:"utility", description: "Produit et améliore les modules défensifs pour le Nexus-7 et la base.", levels: [ { level: 1, costToUnlockOrUpgrade: { biomass: 200, nanites: 150 }, energyConsumption: 15, grantsModule: 'shieldGeneratorMk1' }, { level: 2, costToUpgrade: { biomass: 500, nanites: 400, mod_proto:1 }, energyConsumption: 25, grantsModule: 'shieldGeneratorMk2' }] },
    'laserTurret': { name: "Tourelle Laser MkI", type: "defense", description: "Tourelle défensive automatisée, efficace contre les cibles uniques.", placementCost: { biomass: 75, nanites: 50 }, energyConsumption: 5, levels: [ { level: 1, stats: { attack: 8, health: 120, damageType: DAMAGE_TYPES.ENERGY, range: 90, attackSpeed: 0.8 }, costToUnlockOrUpgrade: { biomass: 100, nanites: 75 }, energyConsumption: 5 }, { level: 2, stats: { attack: 15, health: 200, damageType: DAMAGE_TYPES.ENERGY, range: 100, attackSpeed: 1 }, costToUpgrade: { biomass: 250, nanites: 150, comp_av:1 }, energyConsumption: 7 },{ level: 3, stats: { attack: 25, health: 320, damageType: DAMAGE_TYPES.ENERGY, range: 110, attackSpeed: 1.2 }, costToUpgrade: { biomass: 500, nanites: 350, mod_proto:1, arte_rare:1 }, energyConsumption: 10 } ] },
    'gatlingTurret': { name: "Tourelle Gatling", type: "defense", description: "Tourelle à haute cadence de tir, idéale contre les groupes d'ennemis.", placementCost: { biomass: 100, nanites: 30 }, energyConsumption: 8, levels: [ { level: 1, stats: { attack: 4, health: 150, attackSpeed: 2.5, damageType: DAMAGE_TYPES.KINETIC, range: 70 }, costToUnlockOrUpgrade: { biomass: 120, nanites: 60 }, energyConsumption: 8 }, { level: 2, stats: { attack: 7, health: 250, attackSpeed: 3.0, damageType: DAMAGE_TYPES.KINETIC, range: 80 }, costToUpgrade: { biomass: 280, nanites: 140, comp_av: 1 }, energyConsumption: 12 }, ] },
    'reinforcedWall': { name: "Mur Renforcé", type: "defense", description: "Structure défensive passive augmentant les PV du Noyau et bloquant les ennemis.", placementCost: { biomass: 50, nanites: 10 }, energyConsumption: 1, levels: [ { level: 1, baseHealthBonus: 250, stats: { health: 300 }, costToUnlockOrUpgrade: { biomass: 150, nanites: 50 }, energyConsumption: 1 }, { level: 2, baseHealthBonus: 500, stats: { health: 600 }, costToUpgrade: { biomass: 300, nanites: 120, comp_av:1 }, energyConsumption: 1 } ] }
};
for (const id in buildingsData) { if (!buildingsData[id].levels || !Array.isArray(buildingsData[id].levels) || buildingsData[id].levels.length === 0) { console.error(`ERREUR buildingsData: Bâtiment '${id}' n'a pas de tableau 'levels' valide ou est vide.`); } else { if (buildingsData[id].energyConsumption !== undefined && buildingsData[id].levels[0].energyConsumption === undefined) { buildingsData[id].levels[0].energyConsumption = buildingsData[id].energyConsumption; } buildingsData[id].levels.forEach((lvlData, index) => { if (index === 0) { if (!lvlData.costToUnlockOrUpgrade) { console.error(`ERREUR buildingsData: Niveau 1 de '${id}' manque 'costToUnlockOrUpgrade'.`); } } else { if (!lvlData.costToUpgrade && index < buildingsData[id].levels.length -1 ) { /* console.warn(`AVERTISSEMENT buildingsData: Niveau ${lvlData.level} de '${id}' manque 'costToUpgrade' mais n'est pas le dernier.`); */ } } if (buildingsData[id].type === "defense" && (!lvlData.stats || lvlData.stats.health === undefined)) { console.error(`ERREUR buildingsData: Défense '${id}' niveau ${lvlData.level} manque stats.health.`); } if (buildingsData[id].type === "defense" && lvlData.energyConsumption === undefined) { lvlData.energyConsumption = buildingsData[id].energyConsumption || 0; } }); } if (buildingsData[id].type === "defense" && !buildingsData[id].placementCost) { console.error(`ERREUR buildingsData: Défense '${id}' manque 'placementCost'.`); } }

var nanobotModulesData = {
    'armBlade': { id: 'armBlade', name: "Lame de Bras", description: "Un bras transformable en lame tranchante.", visualClass: 'module-arm-blade', unlockMethod: { research: 'weaponizedNanites' }, levels: [ { level: 1, statBoost: { attack: 5 }, costToUnlockOrUpgrade: { nanites: 50, comp_av: 1 } }, { level: 2, statBoost: { attack: 8, speed: 1 }, costToUpgrade: { nanites: 100, comp_av: 2, mod_proto: 1 } }, { level: 3, statBoost: { attack: 12, speed: 2 }, costToUpgrade: { nanites: 200, comp_av: 3, arte_rare: 1 } } ] },
    'gravLegs': { id: 'gravLegs', name: "Jambes Anti-Grav", description: "Permet un déplacement rapide et agile.", visualClasses: ['module-legs-antigrav left', 'module-legs-antigrav right'], unlockMethod: { research: 'graviticManipulation' }, levels: [ { level: 1, statBoost: { speed: 5, defense: 1 }, costToUnlockOrUpgrade: { nanites: 75, crist_stock: 2 } }, { level: 2, statBoost: { speed: 8, defense: 2 }, costToUpgrade: { nanites: 150, crist_stock: 3, mod_proto: 1 } } ] },
    'shieldGeneratorMk1': { id: 'shieldGeneratorMk1', name: "Bouclier Énergétique Mk1", description: "Génère un champ de force protecteur de base.", visualClass: 'module-shield', unlockMethod: { building: 'defenseFoundry', buildingLevel: 1 }, levels: [ { level: 1, statBoost: { defense: 10, health: 20 }, costToUnlockOrUpgrade: { nanites: 100, biomass: 50 } }, { level: 2, statBoost: { defense: 15, health: 35 }, costToUpgrade: { nanites: 180, biomass: 100, comp_av: 1 } } ] },
    'shieldGeneratorMk2': { id: 'shieldGeneratorMk2', name: "Bouclier Énergétique Mk2", description: "Génère un champ de force protecteur amélioré. Remplace Mk1.", visualClass: 'module-shield', unlockMethod: { building: 'defenseFoundry', buildingLevel: 2 }, replaces: 'shieldGeneratorMk1', levels: [ { level: 1, statBoost: { defense: 20, health: 50 }, costToUnlockOrUpgrade: { nanites: 250, biomass: 150, mod_proto: 2 } }, { level: 2, statBoost: { defense: 30, health: 75 }, costToUpgrade: { nanites: 400, biomass: 250, arte_rare: 1 } } ] }
};

var researchData = { 
    'basic_navigation': { name: "Navigation de Base", description: "Permet le voyage vers des zones proches et améliore la vitesse d'exploration.", cost: { biomass: 100, nanites: 50}, time: 60, requirements: { buildings: { researchLab: 1}}, grantsStatBoost: { speed: 2} }, 
    'advanced_geology': { name: "Géologie Avancée", description: "Permet l'identification et l'accès à des zones riches en cristaux.", cost: {biomass: 250, nanites: 150, crist_stock: 5}, time: 180, requirements: {buildings: {researchLab: 1}, research: ['basic_navigation']}}, 
    'combatAlgorithms': { name: "Algorithmes de Combat", description: "Améliore l'efficacité au combat du Nexus-7.", cost: { biomass: 150, nanites: 300 }, time: 120, requirements: { buildings: { researchLab: 1 } }, grantsStatBoost: { attack: 5, defense: 3 } },
    'weaponizedNanites': { name: "Nanites Armés", description: "Intègre des nanites offensives dans les systèmes du Nexus-7.", cost: { biomass: 400, nanites: 250 }, time: 240, requirements: { buildings: { researchLab: 2 } }, grantsModule: 'armBlade' },
    'graviticManipulation': { name: "Manipulation Gravitique", description: "Développement de modules de déplacement avancés.", cost: { biomass: 300, nanites: 200, arte_rare: 1 }, time: 180, requirements: { buildings: { researchLab: 2 } }, grantsModule: 'gravLegs' },
};

var TILE_TYPES_TO_RESOURCE_KEY = {
    [TILE_TYPES.RESOURCE_BIOMASS_PATCH]: 'biomass',
    [TILE_TYPES.RESOURCE_NANITE_DEPOSIT]: 'nanites',
    [TILE_TYPES.RESOURCE_CRYSTAL_VEIN]: 'crystal_shards'
};

var ZONE_DATA = {
    'verdant_archipelago': {
        id: 'verdant_archipelago',
        name: "Archipel Verdoyant",
        mapSize: { width: 25, height: 20 },
        entryPoint: { x: 3, y: 3 },
        basePlayerCoordinates: { x: 3, y: 3 },
        baseTerrainLayout: [], 
        visibleStructureLayout: [], 
        tileContentDistribution: { 
            [TILE_TYPES.RESOURCE_BIOMASS_PATCH]: 0.12,
            [TILE_TYPES.RESOURCE_NANITE_DEPOSIT]: 0.04,
            [TILE_TYPES.FOREST]: 0.15,
            [TILE_TYPES.RUINS]: 0.03,
            [TILE_TYPES.UPGRADE_CACHE]: 0.02,
            [TILE_TYPES.POI_ANCIENT_STRUCTURE]: 0.01,
            'drone_scout': 0.04, 
            'raider_grunt': 0.03, 
            'outpost_alpha': 0.01, 
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
        },
        patrolEnemyPool: ['enemy_crystal_golem_weak', 'enemy_spark_wisp_scout'],
        unlockCondition: { research: 'advanced_geology' } 
    }
};

var BASE_COORDINATES = (ZONE_DATA['verdant_archipelago'] && ZONE_DATA['verdant_archipelago'].basePlayerCoordinates)
                       ? { ...ZONE_DATA['verdant_archipelago'].basePlayerCoordinates }
                       : { x: Math.floor((typeof DEFAULT_MAP_SIZE !== 'undefined' ? DEFAULT_MAP_SIZE.width : 10) / 2), y: Math.floor((typeof DEFAULT_MAP_SIZE !== 'undefined' ? DEFAULT_MAP_SIZE.height : 10) / 2) };


var nightAssaultEnemies = [
    { id: 'swarm_drone', name: "Drone d'Essaim", baseHealth: 15, baseAttack: 2, speed: 4, attackRange: 5, damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0, energy: 0.2 }, reward: { biomass: 2, nanites: 1 }, spritePath: 'https://placehold.co/8x8/e53e3e/ffffff?text=d', visualClass: 'drone' },
    { id: 'assault_bot', name: "Bot d'Assaut", baseHealth: 40, baseAttack: 5, speed: 2.5, attackRange: 10, damageType: DAMAGE_TYPES.ENERGY, resistances: { kinetic: 0.1, energy: -0.15 }, reward: { biomass: 5, nanites: 3 }, spritePath: 'https://placehold.co/10x10/dd6b20/ffffff?text=B', visualClass: 'bot' },
    { id: 'heavy_crawler', name: "Rampant Lourd", baseHealth: 80, baseAttack: 3, speed: 1.5, attackRange: 15, damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0.25, energy: 0.1 }, reward: { biomass: 8, nanites: 2 }, spritePath: 'https://placehold.co/12x12/d69e2e/1a202c?text=C', visualClass: 'crawler' }
];
var bossDefinitions = {
    'siegeBreaker': { id: 'siegeBreaker', name: "Briseur de Siège Alpha", baseHealth: 500, baseAttack: 25, defense: 5, speed: 0.8, attackRange: 25, damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0.3, energy: 0.1 }, reward: { biomass: 150, nanites: 75, xp: 200, loot: ['arte_rare', 'mod_proto'] }, spritePath: 'https://placehold.co/100x120/7f1d1d/fef2f2?text=BOSS', abilities: [ { type: 'aoe_stomp', name: "Piétinement Destructeur", chance: 0.2, damage: 15, radius: 60, cooldown: 3, lastUsed: 0 }, { type: 'regen', name: "Régénération d'Urgence", chance: 0.1, amount: 25, healthThreshold: 0.4, cooldown: 5, lastUsed: 0 } ], visualSize: { width: 30, height: 30 } }
};
var nightEvents = [
    { id: 'flying_swarm', name: "Vol Nuptial Agressif", description: "Une nuée d'unités volantes ignore vos défenses au sol et cible directement le noyau !",
      effect: (nightAssaultState) => { if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultState?.log) addLogEntry("ALERTE: Unités volantes ennemies détectées !", "error", nightAssaultLogEl, nightAssaultState.log); if(nightAssaultState && nightAssaultState.enemies) { nightAssaultState.enemies.forEach(enemy => { enemy.isFlying = true; if(enemy.typeInfo) enemy.typeInfo.name += " (Volant)"; }); } },
      duration: NIGHT_DURATION * TICK_SPEED
    },
    { id: 'dense_fog', name: "Brouillard Étrange", description: "Un brouillard dense réduit la portée de toutes les tourelles de 30% !",
      effect: (nightAssaultState) => { if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultState?.log) addLogEntry("Brouillard étrange réduisant la visibilité...", "warning", nightAssaultLogEl, nightAssaultState.log); if(nightAssaultState) { nightAssaultState.globalModifiers = nightAssaultState.globalModifiers || {}; nightAssaultState.globalModifiers.turretRangeFactor = 0.7; } },
      revertEffect: (nightAssaultState) => { if (nightAssaultState && nightAssaultState.globalModifiers) delete nightAssaultState.globalModifiers.turretRangeFactor; if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultState?.log) addLogEntry("Le brouillard se dissipe.", "info", nightAssaultLogEl, nightAssaultState.log); },
      duration: NIGHT_DURATION * TICK_SPEED
    }
];
var nanobotSkills = {
    'powerStrike': { id: 'powerStrike', name: "Frappe Puissante", description: "Attaque concentrée à 150% dégâts.", type: "attack_boost", cost: { rage: 30 }, effect: { damageMultiplier: 1.5 }, cooldown: 0, activationMessage: "Nexus-7 concentre son énergie pour une Frappe Puissante !", effectMessage: (damage) => `L'attaque inflige ${damage} dégâts critiques !` },
    'emergencyShield': { id: 'emergencyShield', name: "Bouclier d'Urgence", description: "Bouclier temporaire absorbant 20 dégâts.", type: "defensive_buff", trigger: { healthPercentBelow: 30 }, effect: { damageAbsorption: 20, duration: 1 }, cooldown: 10 , activationMessage: "Systèmes d'urgence ! Bouclier temporaire activé !", effectMessage: "Le bouclier absorbe les prochains dégâts." },
    'adaptiveFocus': { id: 'adaptiveFocus', name: "Concentration Adaptative", description: "Chaque attaque réussie augmente les dégâts.", type: "passive_buff_stack", trigger: { onNanobotAttackHit: true }, effect: { damageBonusPerStack: 2, maxStacks: 3 }, resetCondition: { onNanobotHit: true }, cooldown: 0, activationMessage: (stacks) => `Concentration accrue (x${stacks}) !` }
};

var QUEST_DATA = {
    'main_01_survival_basics': {
        id: 'main_01_survival_basics', title: "Survie Élémentaire", type: "main",
        description: "Sécurisez la zone et rassemblez les premières ressources vitales.",
        unlockConditions: () => true,
        objectives: [
            { type: "collect_resource", resource: "biomass", amount: 100, text: "Collecter 100 Biomasse" },
            { type: "explore_tiles", count: 15, text: "Explorer 15 cases environnantes" }
        ],
        rewards: { xp: 50, items: ['item_repair_kit_s'] },
        nextQuest: 'main_02_build_harvester'
    },
    'main_02_build_harvester': {
        id: 'main_02_build_harvester', title: "Première Infrastructure", type: "main",
        description: "Construisez un Collecteur de Biomasse pour automatiser la récolte.",
        unlockConditions: (gs) => gs.quests['main_01_survival_basics']?.status === QUEST_STATUS.FINISHED,
        objectives: [ { type: "build_level", buildingId: "biomassHarvester", level: 1, text: "Construire Collecteur de Biomasse (Niv.1)" } ],
        rewards: { xp: 75, resources: { nanites: 50 } },
        nextQuest: 'side_01_clear_scouts'
    },
    'side_01_clear_scouts': {
        id: 'side_01_clear_scouts', title: "Nettoyage de Zone", type: "side",
        description: "Des drones éclaireurs hostiles ont été repérés. Éliminez-les pour sécuriser davantage les alentours.",
        unlockConditions: (gs) => gs.quests['main_02_build_harvester']?.status === QUEST_STATUS.FINISHED,
        objectives: [ { type: "defeat_enemy_type", enemyId: "drone_scout", count: 3, text: "Éliminer 3 Drones Éclaireurs" } ],
        rewards: { xp: 100, resources: { biomass: 70 } }
    },
    'explore_ruin_01': {
        id: 'explore_ruin_01', title: "Vestiges Anciens", type: "exploration",
        description: "Une étrange silhouette de ruine a été repérée. Allez l'investiguer.",
        unlockConditions: (gs) => gs.nanobotStats.level >= 2,
        objectives: [ { type: "interact_poi_type", poiType: TILE_TYPES.POI_ANCIENT_STRUCTURE, count: 1, text: "Trouver et examiner des Ruines Antiques" } ],
        rewards: { xp: 75, items: ['mod_proto'] }
    },
    'clear_outpost_01': {
        id: 'clear_outpost_01', title: "Menace Locale", type: "combat",
        description: "Un avant-poste hostile a été détecté dans l'Archipel Verdoyant. Neutralisez-le.",
        unlockConditions: (gs) => gs.quests['main_01_survival_basics']?.status === QUEST_STATUS.FINISHED,
        objectives: [ { type: "destroy_enemy_base", baseId: "outpost_alpha", zoneId: "verdant_archipelago", text: "Détruire l'Avant-poste Alpha" } ],
        rewards: { xp: 200, resources: { biomass: 100, nanites: 100 }, items: ['comp_av', 'comp_av'] }
    }
};

console.log("config.js - Fin du fichier, toutes les constantes (avec var pour test) devraient être définies.");
if (typeof ZONE_DATA === 'undefined' || typeof buildingsData === 'undefined' || typeof itemsData === 'undefined' || typeof QUEST_DATA === 'undefined' ||
    typeof TILE_TYPES === 'undefined' || typeof DAMAGE_TYPES === 'undefined' || typeof explorationEnemyData === 'undefined' ||
    typeof enemyBaseDefinitions === 'undefined' || typeof nanobotModulesData === 'undefined' || typeof researchData === 'undefined' ||
    typeof nightAssaultEnemies === 'undefined' || typeof bossDefinitions === 'undefined' || typeof nightEvents === 'undefined' ||
    typeof nanobotSkills === 'undefined' || typeof QUEST_STATUS === 'undefined' || typeof TILE_TYPES_TO_RESOURCE_KEY === 'undefined') {
    console.error("config.js - ERREUR CRITIQUE POST-VERIFICATION: Une ou plusieurs structures de données de config ne sont pas définies !");
} else {
    console.log("config.js - POST-VERIFICATION: Toutes les structures de données principales semblent définies.");
}