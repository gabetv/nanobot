// js/config_gameplay.js
console.log("config_gameplay.js - Fichier chargé et en cours d'analyse...");

// --- ITEMS ---
const itemsData = {
    "biomass_sample": {
        id: "biomass_sample", name: "Échantillon de Biomasse", type: "resource_component",
        description: "Matière organique brute, peut être traitée.",
        description_long: "Un amas de matière organique non traitée. Elle peut être convertie en ressources utiles ou utilisée dans des processus de bio-ingénierie avancés.",
        stackable: true, maxStack: 100, value: 1, rarity: "common", iconClass: "ti ti-leaf",
    },
    "nanite_cluster_small": {
        id: "nanite_cluster_small", name: "Petit Amas de Nanites", type: "resource_component",
        description: "Un petit groupe de nanites non programmés.",
        description_long: "Ces nanites de base peuvent être utilisés pour la construction, la réparation ou comme composant pour des technologies plus complexes après avoir été correctement programmés.",
        stackable: true, maxStack: 100, value: 2, rarity: "common", iconClass: "ti ti-settings-automation",
    },
    "crystal_shard_raw": {
        id: "crystal_shard_raw", name: "Éclat de Cristal Brut", type: "crafting_material",
        description: "Un fragment de cristal énergétique non raffiné.",
        description_long: "Ces cristaux émettent une faible lueur énergétique. Ils sont instables sous leur forme brute mais peuvent être raffinés pour focaliser des lasers, alimenter des appareils avancés ou améliorer les capacités du Nanobot.",
        stackable: true, maxStack: 50, value: 10, rarity: "uncommon", iconClass: "ti ti-diamond",
    },
    "alloy_plates": {
        id: "alloy_plates", name: "Plaques d'Alliage", type: "crafting_material",
        description: "Plaques métalliques légères et résistantes.",
        description_long: "Fabriquées à partir de minerais raffinés, ces plaques sont essentielles pour les structures et équipements avancés.",
        stackable: true, maxStack: 50, value: 15, rarity: "uncommon", iconClass: "ti ti-layers-intersect",
    },
    "repair_kit_basic": {
        id: "repair_kit_basic", name: "Kit de Réparation Basique", type: "consumable",
        description: "Répare une petite quantité de dégâts sur le Nanobot.",
        description_long: "Un ensemble d'outils et de matériaux de base permettant des réparations rapides sur le terrain. Restaure 50 PV au Nanobot.",
        stackable: true, maxStack: 10, value: 25, rarity: "common", iconClass: "ti ti-tool",
        effects_on_use: function(gs) {
            if (gs && gs.nanobotStats) {
                gs.nanobotStats.currentHealth = Math.min(gs.nanobotStats.health, gs.nanobotStats.currentHealth + 50);
                if (typeof addLogEntry === 'function') addLogEntry("Kit de réparation utilisé. +50 PV.", "success", window.eventLogEl, gs.eventLog);
                if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateNanobotDisplay === 'function') window.uiUpdates.updateNanobotDisplay();
                return true;
            }
            return false;
        },
        consumable: true 
    },
    "repair_kit_advanced": { // Nouvel item pour le craft
        id: "repair_kit_advanced", name: "Kit de Réparation Avancé", type: "consumable",
        description: "Répare une quantité modérée de dégâts sur le Nanobot.",
        description_long: "Un kit de réparation amélioré contenant des nanites spécialisés et des composants de meilleure qualité. Restaure 150 PV au Nanobot.",
        stackable: true, maxStack: 5, value: 75, rarity: "uncommon", iconClass: "ti ti-briefcase",
        effects_on_use: function(gs) {
            if (gs && gs.nanobotStats) {
                gs.nanobotStats.currentHealth = Math.min(gs.nanobotStats.health, gs.nanobotStats.currentHealth + 150);
                if (typeof addLogEntry === 'function') addLogEntry("Kit de réparation avancé utilisé. +150 PV.", "success", window.eventLogEl, gs.eventLog);
                if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateNanobotDisplay === 'function') window.uiUpdates.updateNanobotDisplay();
                return true;
            }
            return false;
        },
        consumable: true
    },
    "laser_pistol_mk1": {
        id: "laser_pistol_mk1", name: "Pistolet Laser Mk1", type: "equipment",
        slot: "WEAPON",
        description: "Une arme laser standard, fiable mais peu puissante.",
        description_long: "Le Pistolet Laser Mk1 est une arme énergétique de base, commune parmi les explorateurs et les forces de sécurité de bas niveau. Il offre une cadence de tir modérée et des dégâts acceptables contre les cibles non blindées.",
        value: 150, rarity: "common", iconClass: "ti ti-flare",
        statBoost: { attack: 8 },
        damageType: (typeof window !== 'undefined' && window.DAMAGE_TYPES) ? window.DAMAGE_TYPES.ENERGY : 'energy',
        visualClass: "item-weapon-laser"
    },
    "blueprint_shield_module_mk1": {
        id: "blueprint_shield_module_mk1", name: "Plan: Module Bouclier Mk1", type: "blueprint",
        description: "Un plan pour fabriquer un module de bouclier de base.",
        description_long: "Ce plan de données contient les schémas nécessaires pour assembler un générateur de bouclier énergétique Mk1 pour le Nexus-7. Nécessite une station d'assemblage de modules.",
        stackable: false, value: 200, rarity: "rare", iconClass: "ti ti-file-settings",
        effects_on_use: function(gs) { 
            if (gs && gs.gameplayFlags) {
                gs.gameplayFlags.shieldModuleMk1RecipeUnlocked = true; 
                if (typeof addLogEntry === 'function') addLogEntry("Recette du Module Bouclier Mk1 apprise !", "success", window.eventLogEl, gs.eventLog);
                // Si une UI de craft existe, la rafraîchir
                if (typeof window.craftingUI !== 'undefined' && typeof window.craftingUI.updateCraftingDisplay === 'function') {
                    window.craftingUI.updateCraftingDisplay();
                }
                return true;
            }
            return false;
        },
        consumable: true
    }
};
window.itemsData = itemsData;

// --- BUILDINGS ---
const buildingsData = {
    "biomassCollector": {
        id: "biomassCollector", name: "Collecteur de Biomasse", description: "Récolte passivement de la biomasse.",
        description_long: "Le Collecteur de Biomasse utilise des micro-drones pour récolter la matière organique environnante et la convertir en biomasse utilisable. Nécessite de l'énergie pour fonctionner.",
        type: "production", icon: "images/buildings/biomass_collector.png",
        levels: [
            { level: 1, costToUnlockOrUpgrade: { nanites: 50 }, energyConsumption: 2, production: { biomass: 0.5 }, capacity: { biomass: 100 } },
            { level: 2, costToUpgrade: { nanites: 100, biomass: 50 }, energyConsumption: 3, production: { biomass: 1.0 }, capacity: { biomass: 200 } },
            { level: 3, costToUpgrade: { nanites: 200, biomass: 100, crystal_shard_raw: 5 }, energyConsumption: 5, production: { biomass: 2.0 }, capacity: { biomass: 400 } }
        ]
    },
    "naniteFactory": {
        id: "naniteFactory", name: "Usine de Nanites", description: "Produit des nanites à partir de biomasse.",
        description_long: "L'Usine de Nanites est une installation complexe qui décompose la biomasse au niveau moléculaire pour assembler des nanites de construction. C'est un processus énergivore.",
        type: "production", icon: "images/buildings/nanite_factory.png",
        levels: [
            { level: 1, costToUnlockOrUpgrade: { nanites: 100, biomass: 50 }, energyConsumption: 5, production: { nanites: 0.2 }, inputPerSecond: {biomass: 1.0}, capacity: { nanites: 50 } },
            { level: 2, costToUpgrade: { nanites: 200, biomass: 150 }, energyConsumption: 8, production: { nanites: 0.5 }, inputPerSecond: {biomass: 2.0}, capacity: { nanites: 100 } },
        ]
    },
    "researchLab": {
        id: "researchLab", name: "Laboratoire de Recherche", description: "Permet de rechercher de nouvelles technologies.",
        description_long: "Le Laboratoire de Recherche est essentiel pour analyser des artefacts, développer de nouveaux schémas et améliorer les capacités du Nexus-7. Des niveaux plus élevés accélèrent la recherche.",
        type: "research", icon: "images/buildings/research_lab.png",
        levels: [
            { level: 1, costToUnlockOrUpgrade: { nanites: 150, biomass: 100 }, energyConsumption: 4, researchSpeedFactor: 1.0 },
            { level: 2, costToUpgrade: { nanites: 300, biomass: 200, crystal_shard_raw: 10 }, energyConsumption: 6, researchSpeedFactor: 1.5 },
        ]
    },
    "energyGenerator": {
        id: "energyGenerator", name: "Générateur d'Énergie", description: "Fournit de l'énergie à la base.",
        description_long: "Ce générateur compact utilise une réaction de fusion à froid pour produire une quantité stable d'énergie, essentielle au fonctionnement de tous les autres modules de la base.",
        type: "energy", icon: "images/buildings/energy_generator.png",
        levels: [
            { level: 1, costToUnlockOrUpgrade: { nanites: 100 }, capacity: { energy: 50 } }, // Ne consomme pas, fournit de la capacité
            { level: 2, costToUpgrade: { nanites: 250, biomass: 50 }, capacity: { energy: 100 } },
        ]
    },
    "fabricationStation": { // Nouveau bâtiment pour le craft
        id: "fabricationStation", name: "Station de Fabrication", description: "Permet de fabriquer des objets et composants.",
        description_long: "Une station d'assemblage polyvalente équipée de manipulateurs de précision et d'imprimantes moléculaires pour créer une variété d'objets à partir de ressources de base et de composants.",
        type: "crafting", // Nouveau type
        icon: "images/buildings/fabrication_station.png", // Image à créer
        levels: [
            { level: 1, costToUnlockOrUpgrade: { nanites: 200, alloy_plates: 10 }, energyConsumption: 5, craftSpeedFactor: 1.0, unlockedCategories: ['basic_consumables', 'basic_components'] },
            { level: 2, costToUpgrade: { nanites: 400, crystal_shard_raw: 20, alloy_plates: 20 }, energyConsumption: 8, craftSpeedFactor: 1.5, unlockedCategories: ['advanced_consumables', 'weapon_parts'] }
        ]
    },
    "laserTurret": {
        id: "laserTurret", name: "Tourelle Laser", type: "defense",
        description: "Une tourelle défensive à courte portée.",
        description_long: "La Tourelle Laser standard offre une protection de base contre les menaces terrestres et aériennes de bas niveau. Efficace contre les cibles peu blindées.",
        placementCost: { nanites: 75 },
        baseEnergyConsumption: 3,
        icon: "images/defenses/laser_turret.png", gridVisual: { char: "L", class: "laserTurret" },
        levels: [
            { level: 1, costToUnlockOrUpgrade: { researchId: "basic_turrets" },
              stats: { health: 100, attack: 15, range: 3, fireRate: 1.0, damageType: window.DAMAGE_TYPES?.ENERGY || 'energy' },
              costToUpgradeInstance: { nanites: 20, crystal_shard_raw: 2}
            },
            { level: 2, costToUpgrade: { researchId: "improved_lasers" },
              stats: { health: 150, attack: 22, range: 3.5, fireRate: 1.2, damageType: window.DAMAGE_TYPES?.ENERGY || 'energy' },
              costToUpgradeInstance: { nanites: 30, crystal_shard_raw: 4}
            }
        ]
    },
     "reinforcedWall": {
        id: "reinforcedWall", name: "Mur Renforcé", type: "defense",
        description: "Structure défensive passive qui augmente les PV du noyau.",
        description_long: "Les Murs Renforcés ne possèdent pas d'armement mais augmentent significativement la résistance structurelle du noyau de la base. Ils peuvent aussi bloquer le passage des ennemis.",
        placementCost: { nanites: 50, biomass: 25 },
        baseEnergyConsumption: 0,
        icon: "images/defenses/wall.png", gridVisual: { char: "W", class: "reinforcedWall" },
        levels: [
            { level: 1, costToUnlockOrUpgrade: { nanites: 100 },
              stats: { health: 300 }, baseHealthBonus: 50,
              costToUpgradeInstance: { nanites: 25 }
            },
            { level: 2, costToUpgrade: { nanites: 150, alloy_plates: 5 },
              stats: { health: 500 }, baseHealthBonus: 80,
              costToUpgradeInstance: { nanites: 40, alloy_plates: 2 }
            }
        ]
    }
};
window.buildingsData = buildingsData;

// --- RESEARCH ---
const researchData = {
    "basic_construction": {
        id: "basic_construction", name: "Construction Basique", description: "Débloque les fondations de la construction de base.",
        description_long: "Cette recherche fondamentale permet au Nexus-7 de comprendre et d'appliquer les principes de base de l'assemblage structurel, ouvrant la voie à la construction des premiers modules de la base.",
        time: 60, cost: { nanites: 50 },
        unlocksBuilding: "biomassCollector",
        grantsFeature: "base_building_panel"
    },
    "nanite_engineering": {
        id: "nanite_engineering", name: "Ingénierie Nanitique", description: "Permet la production de nanites.",
        description_long: "Approfondit la compréhension du comportement des nanites, permettant leur réplication contrôlée et la construction de l'Usine de Nanites.",
        time: 120, cost: { biomass: 100, nanites: 50 },
        requirements: { research: ["basic_construction"] },
        unlocksBuilding: "naniteFactory"
    },
    "energy_systems_1": {
        id: "energy_systems_1", name: "Systèmes Énergétiques Niv. 1", description: "Débloque le générateur d'énergie.",
        description_long: "Recherche sur les technologies de production d'énergie compactes, nécessaire pour alimenter une base en expansion.",
        time: 90, cost: { nanites: 75 },
        requirements: { research: ["basic_construction"] },
        unlocksBuilding: "energyGenerator"
    },
    "basic_fabrication": { // Nouvelle recherche pour débloquer la station de fabrication
        id: "basic_fabrication", name: "Fabrication de Base", description: "Débloque la Station de Fabrication.",
        description_long: "Permet la construction d'une station d'assemblage pour fabriquer des objets et composants plus complexes.",
        time: 150, cost: { nanites: 120, biomass: 70 },
        requirements: { research: ["nanite_engineering"], buildings: { researchLab: 1 } },
        unlocksBuilding: "fabricationStation",
        grantsFeature: "crafting_panel_access" // Flag pour débloquer l'onglet
    },
    "advanced_repair_systems": { // Nouvelle recherche pour débloquer la recette
        id: "advanced_repair_systems", name: "Systèmes de Réparation Avancés", description: "Débloque la recette du Kit de Réparation Avancé.",
        description_long: "Recherche sur des nanites de réparation plus efficaces et des matériaux composites pour améliorer les kits de réparation.",
        time: 200, cost: { nanites: 180, crystal_shard_raw: 15 },
        requirements: { research: ["basic_fabrication"], buildings: { researchLab: 1 } },
        // grantsRecipe: "craft_repair_kit_advanced" // La recette sera débloquée par sa propre condition `unlockCondition`
    },
    "basic_turrets": {
        id: "basic_turrets", name: "Tourelles Basiques", description: "Débloque la construction de Tourelles Laser.",
        description_long: "Permet la fabrication et le déploiement de systèmes défensifs automatisés de base, les Tourelles Laser.",
        time: 180, cost: { nanites: 100, biomass: 50 },
        requirements: { buildings: { researchLab: 1 } },
        unlocksBuildingTechnology: "laserTurret"
    },
    "improved_lasers": {
        id: "improved_lasers", name: "Lasers Améliorés", description: "Améliore l'efficacité des tourelles laser.",
        description_long: "Recherche avancée sur la focalisation et la puissance des lasers, permettant d'améliorer les tourelles existantes.",
        time: 300, cost: { nanites: 250, crystal_shard_raw: 10 },
        requirements: { research: ["basic_turrets"], buildings: { researchLab: 2 } },
    },
    "nanobot_armor_plating_1": {
        id: "nanobot_armor_plating_1", name: "Blindage Nanobot Niv. 1", description: "Augmente la défense de base du Nanobot.",
        description_long: "Développe un alliage léger mais résistant applicable à la coque du Nexus-7, améliorant sa capacité à encaisser les dégâts.",
        time: 240, cost: { nanites: 150, alloy_plates: 10 },
        requirements: { buildings: { researchLab: 1 } },
        grantsStatBoost: { defense: 5 }
    }
};
window.researchData = researchData;

// --- NANOBOT MODULES ---
const nanobotModulesData = {
    "mining_drill_arm_mk1": {
        id: "mining_drill_arm_mk1", name: "Bras Foreur Mk1", type: "arm_module",
        description: "Un bras équipé d'une foreuse pour l'extraction de minerais.",
        description_long: "Ce module remplace l'un des manipulateurs standards du Nexus-7 par un bras robuste équipé d'une foreuse au diamant polycristallin, optimisé pour l'extraction rapide de minerais et de cristaux.",
        slot: "arm_primary",
        unlockMethod: { research: "nanite_engineering" },
        visualClass: "module-arm-drill",
        abilities: { canTraverse: [window.TILE_TYPES?.DEBRIS_FIELD] },
        levels: [
            { level: 1, costToUnlockOrUpgrade: { nanites: 100, alloy_plates: 5 }, statBoost: { miningSpeed: 0.2, crystalYield: 0.05 } },
            { level: 2, costToUpgrade: { nanites: 200, alloy_plates: 10, crystal_shard_raw: 5 }, statBoost: { miningSpeed: 0.4, crystalYield: 0.1 } }
        ]
    },
    "combat_blade_arm_mk1": {
        id: "combat_blade_arm_mk1", name: "Bras Lame de Combat Mk1", type: "arm_module",
        description: "Un bras équipé d'une lame énergétique pour le combat rapproché.",
        description_long: "Conçu pour le combat direct, ce module dote le Nexus-7 d'une lame à haute fréquence capable de trancher la plupart des blindages légers. Augmente les dégâts de mêlée.",
        slot: "arm_secondary",
        unlockMethod: { research: "nanobot_armor_plating_1" },
        visualClass: "module-arm-blade",
        replaces: "mining_drill_arm_mk1",
        levels: [
            { level: 1, costToUnlockOrUpgrade: { nanites: 150, crystal_shard_raw: 10 }, statBoost: { attack: 8, critChance: 0.02 } },
            { level: 2, costToUpgrade: { nanites: 300, crystal_shard_raw: 20, alloy_plates: 10 }, statBoost: { attack: 15, critChance: 0.05 } }
        ]
    },
    "plasma_cutter_arm_mk1": {
        id: "plasma_cutter_arm_mk1", name: "Découpeur Plasma Mk1", type: "arm_module",
        description: "Un bras avec un découpeur plasma pour les matériaux organiques denses.",
        description_long: "Ce module projette un jet de plasma focalisé capable de trancher les matériaux organiques résistants comme les vignes épaisses.",
        slot: "arm_utility",
        unlockMethod: { research: "energy_systems_1" },
        visualClass: "module-arm-cutter",
        abilities: { canTraverse: [window.TILE_TYPES?.THICK_VINES] },
        levels: [
            { level: 1, costToUnlockOrUpgrade: { nanites: 120, crystal_shard_raw: 8 }, statBoost: { /* miningSpeed: 0.1, attack: 2 */ } } // Exemple de stats
        ]
    }
};
window.nanobotModulesData = nanobotModulesData;


// --- QUESTS ---
const questData = { 
    "tutorial_build_harvester": {
        id: "tutorial_build_harvester", title: "Première Récolte", type: window.QUEST_TYPE?.TUTORIAL || 'tutorial',
        description: "Le Nexus-7 a besoin de biomasse. Construisez un Collecteur de Biomasse pour commencer la récolte.",
        objectives: [
            { id: "build_collector", type: window.OBJECTIVE_TYPE?.BUILD_BUILDING || 'build_building', buildingId: "biomassCollector", targetLevel: 1, text: "Construire un Collecteur de Biomasse (Niv. 1)" }
        ],
        rewards: { xp: 50, items: [{itemId: "nanite_cluster_small", quantity: 5}], unlocksQuest: "tutorial_research_nanites"},
        startMessage: "Les réserves de biomasse sont basses. La construction d'un collecteur est prioritaire.",
        completeMessage: "Excellent ! Le collecteur est opérationnel et la biomasse commence à affluer."
    },
    "tutorial_research_nanites": {
        id: "tutorial_research_nanites", title: "Ingénierie de Base", type: window.QUEST_TYPE?.TUTORIAL || 'tutorial',
        description: "Pour progresser, le Nexus-7 doit pouvoir produire ses propres nanites. Recherchez l'Ingénierie Nanitique.",
        prerequisites: { questsCompleted: ["tutorial_build_harvester"] },
        objectives: [
            { id: "research_nanites", type: window.OBJECTIVE_TYPE?.RESEARCH_TECH || 'research_tech', researchId: "nanite_engineering", text: "Rechercher 'Ingénierie Nanitique'" }
        ],
        rewards: { xp: 75, resources: { nanites: 50 }, unlocksBuilding: "naniteFactory" },
        startMessage: "La production autonome de nanites est cruciale. Lancez la recherche appropriée.",
        completeMessage: "Recherche terminée ! Vous pouvez maintenant construire des Usines de Nanites."
    }
};
window.QUEST_DATA = questData; 

// --- SHOP INVENTORY ---
const shopInventoryData = {
    "shop_repair_kit_basic": {
        itemId: "repair_kit_basic", quantity: 5, cost: { nanites: 30 }, restockTime: 3600 
    },
    "shop_alloy_plates": {
        itemId: "alloy_plates", quantity: 20, cost: { crystal_shards: 5, nanites: 50 }, restockTime: 7200 
    },
    "shop_blueprint_shield_mk1": {
        itemId: "blueprint_shield_module_mk1", quantity: 1, cost: { crystal_shards: 100, nanites: 250 }, isUnique: true 
    }
};
window.shopInventoryData = shopInventoryData;

// --- TUTORIAL STEPS ---
const tutorialSteps = {
    "gameStart": {
        id: "gameStart", title: "Bienvenue, Opérateur Nexus-7",
        text: "Vos systèmes sont en ligne. Objectif principal : survivre et établir une base opérationnelle. Commencez par explorer votre interface. La section 'Base' vous permettra de construire et rechercher.",
        targetElementHighlight: "#base-section .sub-nav-button[data-subtab='engineering-subtab']",
        position: 'center',
    },
    "firstBuilding": {
        id: "firstBuilding", title: "Construire votre Premier Module",
        text: "La biomasse est essentielle. Trouvez le 'Collecteur de Biomasse' dans le panneau d'Ingénierie et cliquez sur 'Débloquer' ou 'Construire'.",
        targetElementHighlight: "#buildings-section div[data-tooltip-id='biomassCollector'] button",
        targetTab: { main: 'base-section', sub: 'engineering-subtab' },
        position: 'right-center',
    },
    // ... autres étapes
};
window.tutorialSteps = tutorialSteps;

// --- CRAFTING RECIPES ---
const craftingRecipesData = {
    "craft_repair_kit_advanced": {
        id: "craft_repair_kit_advanced",
        name: "Kit de Réparation Avancé",
        description: "Restaure une quantité modérée de PV.",
        output: { itemId: "repair_kit_advanced", quantity: 1 },
        ingredients: [
            { type: "item", id: "repair_kit_basic", quantity: 2 },
            { type: "item", id: "nanite_cluster_small", quantity: 3 },
            { type: "resource", id: "crystal_shards", quantity: 5 }
        ],
        craftTime: 10, // secondes, pour l'instant instantané
        requiredBuilding: "fabricationStation", 
        requiredBuildingLevel: 1,
        unlockCondition: { research: "advanced_repair_systems" } 
    },
    "craft_alloy_plates_basic": {
        id: "craft_alloy_plates_basic",
        name: "Plaques d'Alliage (Basique)",
        description: "Fabrique des plaques d'alliage de base.",
        output: { itemId: "alloy_plates", quantity: 2 },
        ingredients: [
            { type: "resource", id: "nanites", quantity: 50 },
            { type: "resource", id: "biomass", quantity: 20 } // Exemple, peut être un minerai plus tard
        ],
        craftTime: 15,
        requiredBuilding: "fabricationStation",
        requiredBuildingLevel: 1,
        unlockCondition: { research: "basic_fabrication" } 
    },
     "craft_laser_pistol_mk1": {
        id: "craft_laser_pistol_mk1",
        name: "Pistolet Laser Mk1 (Fabrication)",
        description: "Assemble un pistolet laser de base.",
        output: { itemId: "laser_pistol_mk1", quantity: 1 },
        ingredients: [
            { type: "item", id: "alloy_plates", quantity: 5 },
            { type: "item", id: "crystal_shard_raw", quantity: 10 },
            { type: "resource", id: "nanites", quantity: 100 }
        ],
        craftTime: 120,
        requiredBuilding: "fabricationStation",
        requiredBuildingLevel: 2, // Nécessite une station améliorée par exemple
        unlockCondition: { research: "improved_lasers" } // Supposons que la recherche des lasers améliorés débloque aussi le craft
    },
};
window.craftingRecipesData = craftingRecipesData;


console.log("config_gameplay.js - Données de gameplay (items, bâtiments, recherches, quêtes) définies.");