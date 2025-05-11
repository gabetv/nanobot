// js/config.js
// console.log("config.js - Fichier chargé."); // Pour débogage initial

// --- Configuration du Jeu ---
const TICK_SPEED = 1000; // Millisecondes par tick de jeu
// Pour tester rapidement le cycle :
const DAY_DURATION = 30 * 1000; // 30 secondes pour le jour
const NIGHT_DURATION = 20 * 1000; // 20 secondes pour la nuit
// Valeurs normales (à décommenter une fois le débogage terminé)
// const DAY_DURATION = 5 * 60 * 1000; 
// const NIGHT_DURATION = 3 * 60 * 1000; 

const COMBAT_ANIMATION_DELAY_BASE = 700; 
const EXPLORATION_COST_ENERGY = 5;
const MAP_SIZE = { width: 15, height: 10 }; 
const BASE_GRID_SIZE = { rows: 7, cols: 9 }; 
const TILE_TYPES = { 
    UNEXPLORED: 0, EMPTY: 1, BASE: 2, 
    RESOURCE_BIOMASS: 10, RESOURCE_NANITES: 11, RESOURCE_CRYSTAL_SHARDS: 12,
    ENEMY_DRONE: 20, ENEMY_SAURIAN: 21, ENEMY_CRYSTAL_GOLEM: 22, ENEMY_SPARK_WISP: 23, // Nouveaux types pour exploration
    UPGRADE_CACHE: 30, 
    IMPASSABLE: 99, IMPASSABLE_CRYSTAL: 100
};
const BASE_COORDINATES = { x: 0, y: 0 }; 
const EQUIPMENT_SLOTS = { weapon: "Arme Principale", armor: "Blindage", utility1: "Utilitaire Alpha", utility2: "Utilitaire Beta" };
const BASE_INITIAL_HEALTH = 500;
const NIGHT_ASSAULT_TICK_INTERVAL = 5000; 
const REPAIR_COST_BASE_HEALTH_BIOMASS = 2;
const REPAIR_COST_BASE_HEALTH_NANITES = 1;
const REPAIR_COST_DEFENSE_HEALTH_BIOMASS = 1;
const FORCE_CYCLE_CHANGE_COST = { biomass: 100, nanites: 50 };
const SELL_REFUND_FACTOR = 0.5;
const BOSS_WAVE_INTERVAL = 5; 
const SPECIAL_EVENT_CHANCE = 0.15; 

const DAMAGE_TYPES = {
    KINETIC: 'kinetic',  
    ENERGY: 'energy',    
};

const explorationEnemyData = {
    'enemy_scavenger_drone': { name: "Drone Pilleur", health: 25, maxHealth:25, attack: 7, defense: 1, damageType: DAMAGE_TYPES.KINETIC, resistances: { energy: 0.1 }, color: '#9ca3af', spritePath: 'https://placehold.co/80x100/9ca3af/e2e8f0?text=DroneS', reward: { biomass: 10, nanites: 5, xp: 15 }, tileTypeEnum: TILE_TYPES.ENEMY_DRONE }, 
    'enemy_rock_mite': { name: "Mite Rocheuse", health: 40, maxHealth:40, attack: 6, defense: 4, damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0.2 }, color: '#78716c', spritePath: 'https://placehold.co/80x100/78716c/e2e8f0?text=MiteR', reward: { biomass: 15, nanites: 3, xp: 20 }, tileTypeEnum: TILE_TYPES.ENEMY_SAURIAN }, 
    'enemy_crystal_golem': { name: "Golem de Cristal", health: 70, maxHealth:70, attack: 12, defense: 6, damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0.3, energy: -0.2 }, color: '#67e8f9', spritePath: 'https://placehold.co/80x100/67e8f9/1a202c?text=GolemC', reward: { biomass: 20, nanites: 15, xp: 50, loot: ['crist_stock'] }, tileTypeEnum: TILE_TYPES.ENEMY_CRYSTAL_GOLEM },
    'enemy_spark_wisp': { name: "Feu Follet Étincelant", health: 30, maxHealth:30, attack: 10, defense: 0, damageType: DAMAGE_TYPES.ENERGY, resistances: { energy: 0.4, kinetic: -0.25 }, color: '#facc15', spritePath: 'https://placehold.co/80x100/facc15/1a202c?text=WispS', reward: { nanites: 20, xp: 35 }, tileTypeEnum: TILE_TYPES.ENEMY_SPARK_WISP }
};

const ZONE_DATA = {
    'sector_x9': {
        id: 'sector_x9', name: "Secteur X-9 Désolé", description: "Zone désolée, idéale pour les premières collectes.",
        mapSize: { width: 15, height: 10 }, entryPoint: { x: 0, y: 0 },
        tileDistribution: { RESOURCE_BIOMASS: 0.15, RESOURCE_NANITES: 0.10, enemy_scavenger_drone: 0.05, enemy_rock_mite: 0.03, UPGRADE_CACHE: 0.03, IMPASSABLE: 0.1 }, 
        enemyTypesOnMap: ['enemy_scavenger_drone', 'enemy_rock_mite'], 
        unlockCondition: null 
    },
    'crystal_forest': {
        id: 'crystal_forest', name: "Forêt de Cristal Luminescente", description: "Ressources riches, créatures cristallines agressives.",
        mapSize: { width: 20, height: 15 }, entryPoint: { x: 0, y: 7 },
        tileDistribution: { RESOURCE_BIOMASS: 0.10, RESOURCE_NANITES: 0.08, RESOURCE_CRYSTAL_SHARDS: 0.12, enemy_crystal_golem: 0.06, enemy_spark_wisp: 0.04, UPGRADE_CACHE: 0.04, IMPASSABLE_CRYSTAL: 0.15 },
        enemyTypesOnMap: ['enemy_crystal_golem', 'enemy_spark_wisp'],
        unlockCondition: { research: 'graviticManipulation' }, 
        travelCost: { nanites: 200, energy: 50 } 
    }
};

const buildingsData = { 
    'biomassHarvester': { name: "Collecteur de Biomasse", type:"production", description: "Récolte la Biomasse.", levels: [ { level: 1, costToUnlockOrUpgrade: { biomass: 50 }, production: { biomass: 1 }, energyConsumption: 2 }, { level: 2, costToUpgrade: { biomass: 120, nanites: 20 }, production: { biomass: 3 }, energyConsumption: 4 } ] },
    'naniteFactory': { name: "Usine de Nanites", type:"production", description: "Assemble des Nanites.", levels: [ { level: 1, costToUnlockOrUpgrade: { biomass: 80, nanites: 10 }, production: { nanites: 0.5 }, energyConsumption: 5 }, { level: 2, costToUpgrade: { biomass: 200, nanites: 50 }, production: { nanites: 1.5 }, energyConsumption: 8 } ] },
    'powerPlant': { name: "Générateur d'Énergie", type:"utility", description: "Fournit de l'Énergie.", levels: [ { level: 1, costToUnlockOrUpgrade: { biomass: 60, nanites: 20 }, capacity: { energy: 50 } }, { level: 2, costToUpgrade: { biomass: 150, nanites: 50 }, capacity: { energy: 100 } } ] },
    'researchLab': { name: "Laboratoire de Recherche", type:"utility", description: "Débloque des technologies.", levels: [ { level: 1, costToUnlockOrUpgrade: { biomass: 100, nanites: 100 }, researchSpeedFactor: 1, energyConsumption: 10 }, { level: 2, costToUpgrade: { biomass: 250, nanites: 250 }, researchSpeedFactor: 1.5, energyConsumption: 15 } ] },
    'defenseFoundry': { name: "Fonderie Défensive", type:"utility", description: "Fabrique modules défensifs pour Nexus-7.", levels: [ { level: 1, costToUnlockOrUpgrade: { biomass: 200, nanites: 150 }, energyConsumption: 15, grantsModule: 'shieldGeneratorMk1' }, { level: 2, costToUpgrade: { biomass: 500, nanites: 400 }, energyConsumption: 25, grantsModule: 'shieldGeneratorMk2' }] },
    'laserTurret': { name: "Tourelle Laser MkI", type: "defense", description: "Tourelle défensive automatisée, infligeant des dégâts Énergétiques.", placementCost: { biomass: 20, nanites: 15 }, levels: [ { level: 1, stats: { attack: 5, health: 100, damageType: DAMAGE_TYPES.ENERGY, range: 80 }, costToUnlockOrUpgrade: { biomass: 100, nanites: 75 }, energyConsumption: 5 }, { level: 2, stats: { attack: 10, health: 180, damageType: DAMAGE_TYPES.ENERGY, range: 90 }, costToUpgrade: { biomass: 250, nanites: 150, comp_av:1 }, energyConsumption: 8 },{ level: 3, stats: { attack: 18, health: 300, damageType: DAMAGE_TYPES.ENERGY, range: 100 }, costToUpgrade: { biomass: 500, nanites: 350, mod_proto:1 }, energyConsumption: 12 } ] },
    'gatlingTurret': { name: "Tourelle Gatling", type: "defense", description: "Tourelle à cadence rapide infligeant des dégâts Cinétiques.", placementCost: { biomass: 25, nanites: 10 }, levels: [ { level: 1, stats: { attack: 3, health: 120, attackSpeed: 1.5, damageType: DAMAGE_TYPES.KINETIC, range: 70 }, costToUnlockOrUpgrade: { biomass: 120, nanites: 60 }, energyConsumption: 6 }, { level: 2, stats: { attack: 5, health: 200, attackSpeed: 2.0, damageType: DAMAGE_TYPES.KINETIC, range: 80 }, costToUpgrade: { biomass: 280, nanites: 140, comp_av: 1 }, energyConsumption: 9 }, ] },
    'reinforcedWall': { name: "Mur Renforcé", type: "defense", description: "Augmente les points de vie maximum du Noyau et constitue une barrière.", placementCost: { biomass: 30, nanites: 10 }, levels: [ { level: 1, baseHealthBonus: 200, stats: { health: 250 }, costToUnlockOrUpgrade: { biomass: 150, nanites: 50 }, energyConsumption: 1 }, { level: 2, baseHealthBonus: 450, stats: { health: 500 }, costToUpgrade: { biomass: 300, nanites: 120 }, energyConsumption: 2 } ] }
};

for (const id in buildingsData) { /* ... (Validation de buildingsData, identique à la version précédente) ... */ }

const nanobotModulesData = { 
    'armBlade': { id: 'armBlade', name: "Lame de Bras", description: "Un bras transformable en lame tranchante.", visualClass: 'module-arm-blade', unlockMethod: { research: 'weaponizedNanites' }, levels: [ { level: 1, statBoost: { attack: 5 }, costToUnlockOrUpgrade: { nanites: 50, comp_av: 1 } }, { level: 2, statBoost: { attack: 8, speed: 1 }, costToUpgrade: { nanites: 100, comp_av: 2, mod_proto: 1 } }, { level: 3, statBoost: { attack: 12, speed: 2 }, costToUpgrade: { nanites: 200, comp_av: 3, arte_rare: 1 } } ] },
    'gravLegs': { id: 'gravLegs', name: "Jambes Anti-Grav", description: "Permet un déplacement rapide et agile.", visualClasses: ['module-legs-antigrav left', 'module-legs-antigrav right'], unlockMethod: { research: 'graviticManipulation' }, levels: [ { level: 1, statBoost: { speed: 5, defense: 1 }, costToUnlockOrUpgrade: { nanites: 75, crist_stock: 2 } }, { level: 2, statBoost: { speed: 8, defense: 2 }, costToUpgrade: { nanites: 150, crist_stock: 3, mod_proto: 1 } } ] },
    'shieldGeneratorMk1': { id: 'shieldGeneratorMk1', name: "Bouclier Énergétique Mk1", description: "Génère un champ de force protecteur de base.", visualClass: 'module-shield', unlockMethod: { building: 'defenseFoundry', buildingLevel: 1 }, levels: [ { level: 1, statBoost: { defense: 10, health: 20 }, costToUnlockOrUpgrade: { nanites: 100, biomass: 50 } }, { level: 2, statBoost: { defense: 15, health: 35 }, costToUpgrade: { nanites: 180, biomass: 100, comp_av: 1 } } ] },
    'shieldGeneratorMk2': { id: 'shieldGeneratorMk2', name: "Bouclier Énergétique Mk2", description: "Génère un champ de force protecteur amélioré. Remplace Mk1.", visualClass: 'module-shield', unlockMethod: { building: 'defenseFoundry', buildingLevel: 2 }, replaces: 'shieldGeneratorMk1', levels: [ { level: 1, statBoost: { defense: 20, health: 50 }, costToUnlockOrUpgrade: { nanites: 250, biomass: 150, mod_proto: 2 } }, { level: 2, statBoost: { defense: 30, health: 75 }, costToUpgrade: { nanites: 400, biomass: 250, arte_rare: 1 } } ] }
};
const researchData = { 
    'naniteSwarm': { name: "Tempête de Nanites", description: "Arme dévastatrice.", cost: { biomass: 500, nanites: 1000 }, time: 300, requirements: { buildings: { researchLab: 1 } }, grantsStatBoost: { attack: 15 } },
    'graviticManipulation': { name: "Manipulation Gravitique", description: "Développement de modules de déplacement et accès à de nouvelles zones.", cost: { biomass: 300, nanites: 200 }, time: 180, requirements: { buildings: { researchLab: 1 } }, grantsModule: 'gravLegs' }, 
    'combatAlgorithms': { name: "Algorithmes de Combat", description: "Améliore l'efficacité au combat.", cost: { biomass: 150, nanites: 300 }, time: 120, requirements: { buildings: { researchLab: 1 } }, grantsStatBoost: { attack: 5, defense: 3 } },
    'weaponizedNanites': { name: "Nanites Armés", description: "Intègre des nanites offensives.", cost: { biomass: 400, nanites: 250 }, time: 240, requirements: { buildings: { researchLab: 2 } }, grantsModule: 'armBlade' },
    'ecoSymbiosis': { name: "Symbiose Écologique", description: "Contrôle des formes de vie.", cost: { biomass: 1000, nanites: 500 }, time: 600, requirements: { buildings: { researchLab: 2 }, research: ['naniteSwarm'] }, grantsStatBoost: { health: 50, speed: -2 } }
};
const itemsData = {
    'item_laser_mk1': { id: 'item_laser_mk1', name: "Laser de Précision Mk1", slot: "weapon", description: "Un laser compact offrant des dégâts Énergétiques.", statBoost: { attack: 8 }, damageType: DAMAGE_TYPES.ENERGY, visualClass: 'item-weapon-laser', cost: { nanites: 150, biomass: 50 }, rarity: "uncommon" },
    'item_nanosword': { id: 'item_nanosword', name: "Épée Nanotechnologique", slot: "weapon", description: "Une lame physique infligeant des dégâts Cinétiques.", statBoost: { attack: 10, speed: -1 }, damageType: DAMAGE_TYPES.KINETIC, visualClass: 'module-arm-blade', cost: { nanites: 120, biomass: 80 }, rarity: "uncommon" },
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
    { id: 'swarm_drone', name: "Drone d'Essaim", baseHealth: 15, baseAttack: 2, damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0, energy: 0.2 }, reward: { biomass: 2, nanites: 1 }, spritePath: 'https://placehold.co/10x10/e53e3e/e2e8f0?text=D' }, 
    { id: 'assault_bot', name: "Bot d'Assaut", baseHealth: 40, baseAttack: 5, damageType: DAMAGE_TYPES.ENERGY, resistances: { kinetic: 0.1, energy: -0.15 }, reward: { biomass: 5, nanites: 3 }, spritePath: 'https://placehold.co/10x10/dd6b20/e2e8f0?text=B' },
    { id: 'heavy_crawler', name: "Rampant Lourd", baseHealth: 80, baseAttack: 3, damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0.25, energy: 0.1 }, reward: { biomass: 8, nanites: 2 }, spritePath: 'https://placehold.co/10x10/d69e2e/e2e8f0?text=C' } 
];
const bossDefinitions = {
    'siegeBreaker': { id: 'siegeBreaker', name: "Briseur de Siège Alpha", baseHealth: 500, baseAttack: 25, defense: 5, speed: 0.8, damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0.3, energy: 0.1 }, reward: { biomass: 150, nanites: 75, xp: 200, loot: ['arte_rare'] }, spritePath: 'https://placehold.co/100x120/7f1d1d/fef2f2?text=BOSS', abilities: [ { type: 'aoe_stomp', chance: 0.2, damage: 15, radius: 60 }, { type: 'regen', chance: 0.1, amount: 25 } ], visualSize: { width: 30, height: 30 } }
};
const nightEvents = [
    { id: 'flying_swarm', name: "Vol Nuptial Agressif", description: "Une nuée d'unités volantes ignore vos défenses au sol et cible directement le noyau !", 
      effect: (nightAssaultState, baseGrid, defenses) => { 
          if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultLogEl && nightAssaultState && nightAssaultState.log) {
              addLogEntry("ALERTE: Des unités volantes ennemies sont détectées !", "error", nightAssaultLogEl, nightAssaultState.log); 
          }
          if(nightAssaultState && nightAssaultState.enemies) {
              nightAssaultState.enemies.forEach(enemy => { 
                  enemy.isFlying = true; 
                  if(enemy.typeInfo) enemy.typeInfo.name += " (Volant)"; 
              }); 
          }
      }, 
      duration: NIGHT_DURATION 
    },
    { id: 'dense_fog', name: "Brouillard Étrange", description: "Un brouillard dense réduit la portée de toutes les tourelles de 30% !", 
      effect: (nightAssaultState, baseGrid, defenses) => { 
          if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultLogEl && nightAssaultState && nightAssaultState.log) {
              addLogEntry("Un brouillard étrange et dense s'installe, réduisant la visibilité...", "warning", nightAssaultLogEl, nightAssaultState.log); 
          }
          if(nightAssaultState) {
            nightAssaultState.globalModifiers = nightAssaultState.globalModifiers || {}; 
            nightAssaultState.globalModifiers.turretRangeFactor = 0.7; 
          }
      }, 
      revertEffect: (nightAssaultState) => { 
          if (nightAssaultState && nightAssaultState.globalModifiers) delete nightAssaultState.globalModifiers.turretRangeFactor; 
          if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultLogEl && nightAssaultState && nightAssaultState.log) {
              addLogEntry("Le brouillard se dissipe.", "info", nightAssaultLogEl, nightAssaultState.log); 
          }
      }, 
      duration: NIGHT_DURATION 
    }
];
const nanobotSkills = {
    'powerStrike': { id: 'powerStrike', name: "Frappe Puissante", description: "Une attaque concentrée qui inflige 150% des dégâts normaux.", type: "attack_boost", cost: { rage: 30 }, effect: { damageMultiplier: 1.5 }, cooldown: 0, activationMessage: "Nexus-7 concentre son énergie pour une Frappe Puissante !", effectMessage: (damage) => `L'attaque inflige ${damage} dégâts critiques !` },
    'emergencyShield': { id: 'emergencyShield', name: "Bouclier d'Urgence", description: "Active un bouclier temporaire qui absorbe 20 dégâts.", type: "defensive_buff", trigger: { healthPercentBelow: 30 }, effect: { damageAbsorption: 20, duration: 1 }, cooldown: 10 * TICK_SPEED, activationMessage: "Systèmes d'urgence ! Nexus-7 active un Bouclier temporaire !", effectMessage: "Le bouclier absorbe les prochains dégâts." },
    'adaptiveFocus': { id: 'adaptiveFocus', name: "Concentration Adaptative", description: "Chaque attaque réussie augmente les dégâts.", type: "passive_buff_stack", trigger: { onNanobotAttackHit: true }, effect: { damageBonusPerStack: 2, maxStacks: 3 }, resetCondition: { onNanobotHit: true }, cooldown: 0, activationMessage: (stacks) => `Concentration accrue (x${stacks}) !` }
};

// console.log("config.js - Fin du fichier.");