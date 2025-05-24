// js/config_gameplay.js
console.log("config_gameplay.js - Fichier chargé et en cours d'analyse...");

// Assurez-vous que DAMAGE_TYPES, TILE_TYPES (de config_enums.js) sont définis avant.
// Assurez-vous que nanobotModulesData (de config_player.js) est défini avant si researchData y fait référence pour grantsModule.

var itemsData = {
    'comp_av': { id: 'comp_av', name: "Composant Avancé", slot: null, description: "Matériau de fabrication pour modules et équipements de haut niveau.", cost: null, rarity: "material" },
    'mod_proto': { id: 'mod_proto', name: "Module Prototypé", slot: null, description: "Un prototype de module, instable mais puissant. Utilisé dans des crafts avancés.", cost: null, rarity: "material"},
    'nanites_medium_cache': { id: 'nanites_medium_cache', name: "Cache Moyenne de Nanites", slot: null, consumable: true, description: "Une cache de nanites à usage unique. Fournit 150 Nanites.", onUse: (gs) => { gs.resources.nanites = (gs.resources.nanites || 0) + 150; if(typeof addLogEntry === 'function' && typeof eventLogEl !== 'undefined' && gs && gs.eventLog) addLogEntry("Cache de nanites activée: +150 Nanites!", "success", eventLogEl, gs.eventLog); return true; }, cost: null, rarity: "consumable_reward" },
    'item_repair_kit_s': { id: 'item_repair_kit_s', name: "Kit de Réparation (S)", slot: null, consumable: true, description: "Restaure instantanément 25 PV au Nanobot.", onUse: (gs) => { if(!gs || !gs.nanobotStats) return false; if(gs.nanobotStats.currentHealth < gs.nanobotStats.health) { gs.nanobotStats.currentHealth = Math.min(gs.nanobotStats.health, gs.nanobotStats.currentHealth + 25); if(typeof addLogEntry === 'function' && typeof eventLogEl !== 'undefined' && gs && gs.eventLog) addLogEntry("Kit de réparation utilisé: +25 PV.", "success", eventLogEl, gs.eventLog); if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateNanobotDisplay === 'function') uiUpdates.updateNanobotDisplay(); else if(typeof updateNanobotDisplay === 'function') updateNanobotDisplay(); return true;} else { if(typeof addLogEntry === 'function' && typeof eventLogEl !== 'undefined' && gs && gs.eventLog) addLogEntry("PV du Nanobot déjà au maximum.", "info", eventLogEl, gs.eventLog); return false;} }, cost: {nanites: 50}, rarity: "common" },
    'crist_stock': { id: 'crist_stock', name: "Stock de Cristal", slot: null, description: "Cristaux bruts, nécessaires pour certaines technologies avancées.", cost: null, rarity: "material"},
    'crist_stock_large': { id: 'crist_stock_large', name: "Grand Stock de Cristal", slot: null, consumable: true, description: "Une grande quantité de cristaux bruts. Fournit 75 Cristaux.", onUse: (gs) => { gs.resources.crystal_shards = (gs.resources.crystal_shards || 0) + 75; if(typeof addLogEntry === 'function' && typeof eventLogEl !== 'undefined' && gs && gs.eventLog) addLogEntry("Vous récupérez un grand stock de cristaux, +75 Cristaux!", "success", eventLogEl, gs.eventLog); return true; }, cost: null, rarity: "consumable_reward"},
    'arte_rare': { id: 'arte_rare', name: "Artefact Rare", slot: null, description: "Une relique d'une technologie perdue, de grande valeur.", cost: null, rarity: "rare_material"},
    'crystal_shards_large_cache': {id: 'crystal_shards_large_cache', name: "Grande Cache d'Éclats de Cristal", slot:null, consumable: true, description: "Une grande cache d'éclats de cristal purifiés. Fournit 200 Éclats de Cristal.", onUse: (gs) => { gs.resources.crystal_shards = (gs.resources.crystal_shards || 0) + 200; if(typeof addLogEntry === 'function' && typeof eventLogEl !== 'undefined' && gs && gs.eventLog) addLogEntry("Grande cache de cristaux: +200 Éclats!", "success", eventLogEl, gs.eventLog); return true;}, cost:null, rarity:"consumable_reward"},
    'frag_alien': {id: 'frag_alien', name: "Fragment Alien", slot: null, description: "Fragment technologique d'origine inconnue, potentiellement utile.", cost: null, rarity: "material"},

    'item_laser_mk1': { id: 'item_laser_mk1', name: "Laser de Précision Mk1", slot: "weapon", description: "Un laser compact offrant des dégâts Énergétiques constants.", statBoost: { attack: 8 }, damageType: DAMAGE_TYPES.ENERGY, visualClass: 'item-weapon-laser', cost: { nanites: 150, biomass: 50 }, rarity: "uncommon" },
    'item_nanosword': { id: 'item_nanosword', name: "Épée Nanotechnologique", slot: "weapon", description: "Une lame physique affûtée, infligeant des dégâts Cinétiques précis.", statBoost: { attack: 10, speed: -1 }, damageType: DAMAGE_TYPES.KINETIC, visualClass: 'module-arm-blade', cost: { nanites: 120, biomass: 80 }, rarity: "uncommon" },
    'item_plating_basic': { id: 'item_plating_basic', name: "Plaquage Standard", slot: "armor", description: "Plaques de blindage basiques mais fiables pour le Nexus-7.", statBoost: { defense: 5, health: 10 }, visualClass: 'item-armor-plating', cost: { nanites: 100, biomass: 100 }, rarity: "common" },
    'item_advanced_scope': { id: 'item_advanced_scope', name: "Viseur Avancé", slot: "utility2", description: "Améliore la précision des systèmes d'armes, augmentant légèrement l'attaque.", statBoost: { attack: 3, speed: -1 }, cost: { nanites: 200 }, rarity: "uncommon" },
    // Item de Lore
    'lore_fragment_alpha': {
        id: 'lore_fragment_alpha', name: "Fragment de Données (Alpha)", slot: null, consumable: true,
        description: "Un fragment de données ancien. L'utiliser pourrait révéler des informations.",
        onUse: (gs) => {
            if (typeof unlockLoreEntry === 'function' && typeof loreData !== 'undefined') { // loreData est défini dans config_lore.js
                unlockLoreEntry('origin_signal_01'); // ID d'une entrée dans loreData
                if (typeof addLogEntry === 'function' && typeof eventLogEl !== 'undefined' && gs && gs.eventLog) {
                    addLogEntry("Fragment de données déchiffré. Nouvelle entrée de Lore ajoutée.", "success", eventLogEl, gs.eventLog);
                }
            } else {
                console.error("onUse lore_fragment_alpha: unlockLoreEntry ou loreData manquant!");
                if (typeof addLogEntry === 'function' && typeof eventLogEl !== 'undefined' && gs && gs.eventLog) {
                     addLogEntry("Erreur système: Impossible de traiter le fragment de données.", "error", eventLogEl, gs.eventLog);
                }
            }
            return true; // Consomme l'item
        },
        rarity: "lore"
    }
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
// Validation pour buildingsData (s'assurer que les dépendances comme DAMAGE_TYPES sont chargées)
if (typeof DAMAGE_TYPES !== 'undefined') {
    for (const id in buildingsData) { if (!buildingsData[id].levels || !Array.isArray(buildingsData[id].levels) || buildingsData[id].levels.length === 0) { console.error(`ERREUR buildingsData: Bâtiment '${id}' n'a pas de tableau 'levels' valide ou est vide.`); } else { if (buildingsData[id].energyConsumption !== undefined && buildingsData[id].levels[0].energyConsumption === undefined) { buildingsData[id].levels[0].energyConsumption = buildingsData[id].energyConsumption; } buildingsData[id].levels.forEach((lvlData, index) => { if (index === 0) { if (!lvlData.costToUnlockOrUpgrade) { console.error(`ERREUR buildingsData: Niveau 1 de '${id}' manque 'costToUnlockOrUpgrade'.`); } } else { if (!lvlData.costToUpgrade && index < buildingsData[id].levels.length -1 ) { /* console.warn(`AVERTISSEMENT buildingsData: Niveau ${lvlData.level || (index + 1)} de '${id}' manque 'costToUpgrade' mais n'est pas le dernier.`); */ } } if (buildingsData[id].type === "defense" && (!lvlData.stats || lvlData.stats.health === undefined)) { console.error(`ERREUR buildingsData: Défense '${id}' niveau ${lvlData.level || (index + 1)} manque stats.health.`); } if (buildingsData[id].type === "defense" && lvlData.energyConsumption === undefined) { lvlData.energyConsumption = buildingsData[id].energyConsumption || 0; } }); } if (buildingsData[id].type === "defense" && !buildingsData[id].placementCost) { console.error(`ERREUR buildingsData: Défense '${id}' manque 'placementCost'.`); } }
} else {
    console.warn("config_gameplay.js: DAMAGE_TYPES non défini, validation de buildingsData sautée pour les types de dégâts.");
}


var researchData = {
    'basic_navigation': { name: "Navigation de Base", description: "Permet le voyage vers des zones proches et améliore la vitesse d'exploration.", cost: { biomass: 100, nanites: 50}, time: 60, requirements: { buildings: { researchLab: 1}}, grantsStatBoost: { speed: 2} },
    'advanced_geology': { name: "Géologie Avancée", description: "Permet l'identification et l'accès à des zones riches en cristaux.", cost: {biomass: 250, nanites: 150, crist_stock: 5}, time: 180, requirements: {buildings: {researchLab: 1}, research: ['basic_navigation']}},
    'combatAlgorithms': { name: "Algorithmes de Combat", description: "Améliore l'efficacité au combat du Nexus-7.", cost: { biomass: 150, nanites: 300 }, time: 120, requirements: { buildings: { researchLab: 1 } }, grantsStatBoost: { attack: 5, defense: 3 } },
    'weaponizedNanites': { name: "Nanites Armés", description: "Intègre des nanites offensives dans les systèmes du Nexus-7.", cost: { biomass: 400, nanites: 250 }, time: 240, requirements: { buildings: { researchLab: 2 } }, grantsModule: 'armBlade' },
    'graviticManipulation': { name: "Manipulation Gravitique", description: "Développement de modules de déplacement avancés.", cost: { biomass: 300, nanites: 200, arte_rare: 1 }, time: 180, requirements: { buildings: { researchLab: 2 } }, grantsModule: 'gravLegs' },
    'advanced_tooling': {
        name: "Outillage Avancé",
        description: "Débloque la fabrication de manipulateurs robustes pour interagir avec des environnements difficiles.",
        cost: { biomass: 200, nanites: 150, comp_av: 1 },
        time: 150, // secondes
        requirements: { buildings: { researchLab: 1 } },
        grantsModule: 'drillArm' // ID du module défini dans config_player.js
    },
    'plasma_containment': {
        name: "Confinement Plasma",
        description: "Permet la création d'outils à base de plasma pour des applications de découpe précises.",
        cost: { biomass: 350, nanites: 250, crist_stock: 3 },
        time: 200, // secondes
        requirements: { buildings: { researchLab: 2 }, research: ['weaponizedNanites'] }, // Exemple de dépendance
        grantsModule: 'plasmaCutter' // ID du module défini dans config_player.js
    }
};

var QUEST_DATA = {
    'main_01_survival_basics': {
        id: 'main_01_survival_basics', title: "Survie Élémentaire", type: "main",
        description: "Sécurisez la zone et rassemblez les premières ressources vitales.",
        unlockConditions: () => true,
        objectives: [
            { type: "collect_resource", resource: "biomass", amount: 100, text: "Collecter 100 Biomasse" },
            { type: "explore_tiles", count: 5, text: "Explorer 5 cases via le mode actif" } // adapté pour le nouveau mode
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
        // L'interaction avec un POI se fait maintenant via les actions de la tuile active.
        // L'objectif pourrait être de trouver une feature spécifique via scan, ou d'utiliser une action spécifique sur le POI.
        // Pour l'instant, on garde "interact_poi_type" qui devrait toujours fonctionner.
        objectives: [ { type: "interact_poi_type", poiType: TILE_TYPES.POI_ANCIENT_STRUCTURE, count: 1, text: "Trouver et examiner une Structure Antique" } ],
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


console.log("config_gameplay.js - Données de gameplay (items, bâtiments, recherches, quêtes) définies.");
if (typeof itemsData === 'undefined' || typeof buildingsData === 'undefined' || typeof researchData === 'undefined' || typeof QUEST_DATA === 'undefined') {
    console.error("config_gameplay.js - ERREUR: itemsData, buildingsData, researchData ou QUEST_DATA n'est pas défini !");
}