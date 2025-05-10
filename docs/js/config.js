// js/config.js
// alert("config.js chargé !"); // Pour tester

// --- Configuration du Jeu ---
const TICK_SPEED = 1000;
const DAY_DURATION = 5 * 60 * 1000; 
const NIGHT_DURATION = 3 * 60 * 1000; 
const COMBAT_ANIMATION_DELAY_BASE = 700; 
const EXPLORATION_COST_ENERGY = 5;
const MAP_SIZE = { width: 15, height: 10 };
const TILE_TYPES = { UNEXPLORED: 0, EMPTY: 1, BASE: 2, RESOURCE_BIOMASS: 10, RESOURCE_NANITES: 11, ENEMY_DRONE: 20, ENEMY_SAURIAN: 21, UPGRADE_CACHE: 30, IMPASSABLE: 99 };
const BASE_COORDINATES = { x: 0, y: 0 };
const EQUIPMENT_SLOTS = { weapon: "Arme Principale", armor: "Blindage", utility1: "Utilitaire Alpha", utility2: "Utilitaire Beta" };
const BASE_INITIAL_HEALTH = 500;
const NIGHT_ASSAULT_TICK_INTERVAL = 5000; 
const REPAIR_COST_BASE_HEALTH_BIOMASS = 2;
const REPAIR_COST_BASE_HEALTH_NANITES = 1;
const REPAIR_COST_DEFENSE_HEALTH_BIOMASS = 1;
const FORCE_CYCLE_CHANGE_COST = { biomass: 100, nanites: 50 };

// --- Définitions de Données ---
const buildingsData = { 
    'biomassHarvester': { name: "Collecteur de Biomasse", type:"production", description: "Récolte la Biomasse.", levels: [ { cost: { biomass: 50 }, production: { biomass: 1 }, energyConsumption: 2 }, { cost: { biomass: 120, nanites: 20 }, production: { biomass: 3 }, energyConsumption: 4 } ] },
    'naniteFactory': { name: "Usine de Nanites", type:"production", description: "Assemble des Nanites.", levels: [ { cost: { biomass: 80, nanites: 10 }, production: { nanites: 0.5 }, energyConsumption: 5 }, { cost: { biomass: 200, nanites: 50 }, production: { nanites: 1.5 }, energyConsumption: 8 } ] },
    'powerPlant': { name: "Générateur d'Énergie", type:"utility", description: "Fournit de l'Énergie.", levels: [ { cost: { biomass: 60, nanites: 20 }, capacity: { energy: 50 } }, { cost: { biomass: 150, nanites: 50 }, capacity: { energy: 100 } } ] },
    'researchLab': { name: "Laboratoire de Recherche", type:"utility", description: "Débloque des technologies.", levels: [ { cost: { biomass: 100, nanites: 100 }, researchSpeedFactor: 1, energyConsumption: 10 }, { cost: { biomass: 250, nanites: 250 }, researchSpeedFactor: 1.5, energyConsumption: 15 } ] },
    'defenseFoundry': { name: "Fonderie Défensive", type:"utility", description: "Fabrique modules défensifs pour Nexus-7.", levels: [ { cost: { biomass: 200, nanites: 150 }, energyConsumption: 15, grantsModule: 'shieldGeneratorMk1' }, { cost: { biomass: 500, nanites: 400 }, energyConsumption: 25, grantsModule: 'shieldGeneratorMk2' }] },
    'laserTurret': { name: "Tourelle Laser MkI", type: "defense", description: "Tourelle défensive automatisée à courte portée.", levels: [ { cost: { biomass: 100, nanites: 75 }, stats: { attack: 5, health: 100 }, energyConsumption: 5 }, { cost: { biomass: 250, nanites: 150 }, stats: { attack: 10, health: 180 }, energyConsumption: 8 },{ cost: { biomass: 500, nanites: 350 }, stats: { attack: 18, health: 300 }, energyConsumption: 12 } ] },
    'reinforcedWall': { name: "Mur Renforcé", type: "defense", description: "Augmente les points de vie maximum du Noyau.", levels: [ { cost: { biomass: 150, nanites: 50 }, baseHealthBonus: 200, energyConsumption: 1 }, { cost: { biomass: 300, nanites: 120 }, baseHealthBonus: 450, energyConsumption: 2 } ] }
};
const nanobotModulesData = { 
    'armBlade': { id: 'armBlade', name: "Lame de Bras", description: "Un bras transformable en lame tranchante.", visualClass: 'module-arm-blade', unlockMethod: { research: 'weaponizedNanites' }, levels: [ { level: 1, statBoost: { attack: 5 }, costToUnlockOrUpgrade: { nanites: 50, comp_av: 1 } }, { level: 2, statBoost: { attack: 8, speed: 1 }, costToUpgrade: { nanites: 100, comp_av: 2, mod_proto: 1 } }, { level: 3, statBoost: { attack: 12, speed: 2 }, costToUpgrade: { nanites: 200, comp_av: 3, arte_rare: 1 } } ] },
    'gravLegs': { id: 'gravLegs', name: "Jambes Anti-Grav", description: "Permet un déplacement rapide et agile.", visualClasses: ['module-legs-antigrav left', 'module-legs-antigrav right'], unlockMethod: { research: 'graviticManipulation' }, levels: [ { level: 1, statBoost: { speed: 5, defense: 1 }, costToUnlockOrUpgrade: { nanites: 75, crist_stock: 2 } }, { level: 2, statBoost: { speed: 8, defense: 2 }, costToUpgrade: { nanites: 150, crist_stock: 3, mod_proto: 1 } } ] },
    'shieldGeneratorMk1': { id: 'shieldGeneratorMk1', name: "Bouclier Énergétique Mk1", description: "Génère un champ de force protecteur de base.", visualClass: 'module-shield', unlockMethod: { building: 'defenseFoundry', buildingLevel: 1 }, levels: [ { level: 1, statBoost: { defense: 10, health: 20 }, costToUnlockOrUpgrade: { nanites: 100, biomass: 50 } }, { level: 2, statBoost: { defense: 15, health: 35 }, costToUpgrade: { nanites: 180, biomass: 100, comp_av: 1 } } ] },
    'shieldGeneratorMk2': { id: 'shieldGeneratorMk2', name: "Bouclier Énergétique Mk2", description: "Génère un champ de force protecteur amélioré. Remplace Mk1.", visualClass: 'module-shield', unlockMethod: { building: 'defenseFoundry', buildingLevel: 2 }, replaces: 'shieldGeneratorMk1', levels: [ { level: 1, statBoost: { defense: 20, health: 50 }, costToUnlockOrUpgrade: { nanites: 250, biomass: 150, mod_proto: 2 } }, { level: 2, statBoost: { defense: 30, health: 75 }, costToUpgrade: { nanites: 400, biomass: 250, arte_rare: 1 } } ] }
};
const researchData = { 
    'naniteSwarm': { name: "Tempête de Nanites", description: "Arme dévastatrice.", cost: { biomass: 500, nanites: 1000 }, time: 300, requirements: { buildings: { researchLab: 1 } }, grantsStatBoost: { attack: 15 } },
    'graviticManipulation': { name: "Manipulation Gravitique", description: "Développement de modules de déplacement.", cost: { biomass: 300, nanites: 200 }, time: 180, requirements: { buildings: { researchLab: 1 } }, grantsModule: 'gravLegs' },
    'combatAlgorithms': { name: "Algorithmes de Combat", description: "Améliore l'efficacité au combat.", cost: { biomass: 150, nanites: 300 }, time: 120, requirements: { buildings: { researchLab: 1 } }, grantsStatBoost: { attack: 5, defense: 3 } },
    'weaponizedNanites': { name: "Nanites Armés", description: "Intègre des nanites offensives.", cost: { biomass: 400, nanites: 250 }, time: 240, requirements: { buildings: { researchLab: 2 } }, grantsModule: 'armBlade' },
    'ecoSymbiosis': { name: "Symbiose Écologique", description: "Contrôle des formes de vie.", cost: { biomass: 1000, nanites: 500 }, time: 600, requirements: { buildings: { researchLab: 2 }, research: ['naniteSwarm'] }, grantsStatBoost: { health: 50, speed: -2 } }
};
const itemsData = {
    'item_laser_mk1': { id: 'item_laser_mk1', name: "Laser de Précision Mk1", slot: "weapon", description: "Un laser compact offrant une bonne puissance de feu initiale.", statBoost: { attack: 8 }, visualClass: 'item-weapon-laser', cost: { nanites: 150, biomass: 50 }, rarity: "uncommon" },
    'item_plating_basic': { id: 'item_plating_basic', name: "Plaquage Standard", slot: "armor", description: "Plaques de blindage basiques mais fiables.", statBoost: { defense: 5, health: 10 }, visualClass: 'item-armor-plating', cost: { nanites: 100, biomass: 100 }, rarity: "common" },
    'item_repair_kit_s': { id: 'item_repair_kit_s', name: "Kit de Réparation (S)", slot: "utility1", description: "Restaure instantanément 25 PV. Consommable (non implémenté).", statBoost: { health_regen_on_use: 25 }, cost: { nanites: 75 }, rarity: "common" },
    'item_advanced_scope': { id: 'item_advanced_scope', name: "Viseur Avancé", slot: "utility2", description: "Améliore la précision, augmentant légèrement l'attaque.", statBoost: { attack: 3, speed: -1 }, cost: { nanites: 200 }, rarity: "uncommon" },
    'comp_av': { id: 'comp_av', name: "Composant Avancé", slot: null, description: "Matériau de fabrication.", cost: null, rarity: "material" },
    'crist_stock': { id: 'crist_stock', name: "Cristal de Stockage", slot: null, description: "Matériau de fabrication.", cost: null, rarity: "material" },
    'mod_proto': { id: 'mod_proto', name: "Module Prototypé", slot: null, description: "Matériau de fabrication.", cost: null, rarity: "material" },
    'frag_alien': { id: 'frag_alien', name: "Fragment Alien", slot: null, description: "Matériau de fabrication.", cost: null, rarity: "material" },
    'arte_rare': { id: 'arte_rare', name: "Artefact Rare", slot: null, description: "Objet de grande valeur ou puissant.", cost: null, rarity: "rare_material" }
};
const nightAssaultEnemies = [ 
    { id: 'swarm_drone', name: "Drone d'Essaim", baseHealth: 15, baseAttack: 2, reward: { biomass: 2, nanites: 1 }, spritePath: 'images/assault_drone.png' }, 
    { id: 'assault_bot', name: "Bot d'Assaut", baseHealth: 40, baseAttack: 5, reward: { biomass: 5, nanites: 3 }, spritePath: 'images/assault_bot.png' },
    { id: 'heavy_crawler', name: "Rampant Lourd", baseHealth: 80, baseAttack: 3, reward: { biomass: 8, nanites: 2 }, spritePath: 'images/assault_crawler.png' } 
];
const nanobotSkills = {
    'powerStrike': { id: 'powerStrike', name: "Frappe Puissante", description: "Une attaque concentrée qui inflige 150% des dégâts normaux.", type: "attack_boost", cost: { rage: 30 }, effect: { damageMultiplier: 1.5 }, cooldown: 0, activationMessage: "Nexus-7 concentre son énergie pour une Frappe Puissante !", effectMessage: (damage) => `L'attaque inflige ${damage} dégâts critiques !` },
    'emergencyShield': { id: 'emergencyShield', name: "Bouclier d'Urgence", description: "Active un bouclier temporaire qui absorbe 20 dégâts.", type: "defensive_buff", trigger: { healthPercentBelow: 30 }, effect: { damageAbsorption: 20, duration: 1 }, cooldown: 10 * TICK_SPEED, activationMessage: "Systèmes d'urgence ! Nexus-7 active un Bouclier temporaire !", effectMessage: "Le bouclier absorbe les prochains dégâts." },
    'adaptiveFocus': { id: 'adaptiveFocus', name: "Concentration Adaptative", description: "Chaque attaque réussie augmente les dégâts.", type: "passive_buff_stack", trigger: { onNanobotAttackHit: true }, effect: { damageBonusPerStack: 2, maxStacks: 3 }, resetCondition: { onNanobotHit: true }, cooldown: 0, activationMessage: (stacks) => `Concentration accrue (x${stacks}) !` }
};