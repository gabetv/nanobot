// js/config_player.js
console.log("config_player.js - Fichier chargé et en cours d'analyse...");

// Assurez-vous que itemsData (pour les coûts en composants) et researchData (pour unlockMethod)
// sont définis avant ce fichier si vous les utilisez dans les définitions ci-dessous.
// TILE_TYPES et DAMAGE_TYPES devraient venir de config_enums.js.

var nanobotModulesData = {
    'armBlade': {
        id: 'armBlade', name: "Lame de Bras",
        description: "Un bras transformable en lame tranchante, augmentant l'attaque.",
        visualClass: 'module-arm-blade', // Classe CSS pour le visuel du nanobot
        unlockMethod: { research: 'weaponizedNanites' }, // ID de la recherche nécessaire
        levels: [
            { level: 1, statBoost: { attack: 5 }, costToUnlockOrUpgrade: { nanites: 50, comp_av: 1 } },
            { level: 2, statBoost: { attack: 8, speed: 1 }, costToUpgrade: { nanites: 100, comp_av: 2, mod_proto: 1 } },
            { level: 3, statBoost: { attack: 12, speed: 2 }, costToUpgrade: { nanites: 200, comp_av: 3, arte_rare: 1 } }
        ]
    },
    'gravLegs': {
        id: 'gravLegs', name: "Jambes Anti-Grav",
        description: "Permet un déplacement rapide et agile, améliorant la vitesse et la défense.",
        visualClasses: ['module-legs-antigrav left', 'module-legs-antigrav right'],
        unlockMethod: { research: 'graviticManipulation' },
        levels: [
            { level: 1, statBoost: { speed: 5, defense: 1 }, costToUnlockOrUpgrade: { nanites: 75, crist_stock: 2 } },
            { level: 2, statBoost: { speed: 8, defense: 2 }, costToUpgrade: { nanites: 150, crist_stock: 3, mod_proto: 1 } }
        ]
    },
    'shieldGeneratorMk1': {
        id: 'shieldGeneratorMk1', name: "Bouclier Énergétique Mk1",
        description: "Génère un champ de force protecteur de base, augmentant la défense et les PV.",
        visualClass: 'module-shield',
        unlockMethod: { building: 'defenseFoundry', buildingLevel: 1 }, // Débloqué par un bâtiment
        levels: [
            { level: 1, statBoost: { defense: 10, health: 20 }, costToUnlockOrUpgrade: { nanites: 100, biomass: 50 } },
            { level: 2, statBoost: { defense: 15, health: 35 }, costToUpgrade: { nanites: 180, biomass: 100, comp_av: 1 } }
        ]
    },
    'shieldGeneratorMk2': {
        id: 'shieldGeneratorMk2', name: "Bouclier Énergétique Mk2",
        description: "Génère un champ de force protecteur amélioré. Remplace le Mk1.",
        visualClass: 'module-shield', // Peut utiliser le même visuel ou un différent
        unlockMethod: { building: 'defenseFoundry', buildingLevel: 2 },
        replaces: 'shieldGeneratorMk1', // Indique quel module il remplace
        levels: [
            { level: 1, statBoost: { defense: 20, health: 50 }, costToUnlockOrUpgrade: { nanites: 250, biomass: 150, mod_proto: 2 } },
            { level: 2, statBoost: { defense: 30, health: 75 }, costToUpgrade: { nanites: 400, biomass: 250, arte_rare: 1 } }
        ]
    }
    // Ajoutez d'autres modules ici
};

var nanobotSkills = {
    'powerStrike': {
        id: 'powerStrike', name: "Frappe Puissante",
        description: "Une attaque concentrée qui inflige 150% des dégâts normaux. Coûte 30 Rage.",
        type: "attack_boost", // Peut être utilisé pour catégoriser ou pour la logique d'IA
        cost: { rage: 30 },
        effect: { damageMultiplier: 1.5 },
        cooldown: 0, // En ticks de jeu (0 = pas de cooldown explicite après utilisation)
        activationMessage: "Nexus-7 concentre son énergie pour une Frappe Puissante !",
        effectMessage: (damage) => `L'attaque inflige ${damage} dégâts critiques !` // Fonction pour message dynamique
    },
    'emergencyShield': {
        id: 'emergencyShield', name: "Bouclier d'Urgence",
        description: "Active un bouclier temporaire qui absorbe 20 dégâts lorsque les PV sont bas. Se recharge.",
        type: "defensive_buff",
        trigger: { healthPercentBelow: 30 }, // Se déclenche si PV < 30%
        effect: { damageAbsorption: 20, duration: 1 /* Durée en rounds de combat */ },
        cooldown: 10, // En ticks de jeu (ex: 10 * (1000 / TICK_SPEED) si TICK_SPEED est défini)
        activationMessage: "Systèmes d'urgence ! Nexus-7 active un Bouclier temporaire !",
        effectMessage: "Le bouclier absorbe les prochains dégâts."
    },
    'adaptiveFocus': {
        id: 'adaptiveFocus', name: "Concentration Adaptative",
        description: "Chaque attaque réussie augmente les dégâts du Nanobot. Perdu si touché.",
        type: "passive_buff_stack",
        trigger: { onNanobotAttackHit: true }, // Se déclenche après une attaque réussie du Nanobot
        effect: { damageBonusPerStack: 2, maxStacks: 3 },
        resetCondition: { onNanobotHit: true }, // Le compteur de stacks est réinitialisé si le Nanobot est touché
        cooldown: 0,
        activationMessage: (stacks) => `Concentration accrue (x${stacks}) !`
    }
    // Ajoutez d'autres compétences ici
};

console.log("config_player.js - Données du joueur (modules, compétences) définies.");
if (typeof nanobotModulesData === 'undefined' || typeof nanobotSkills === 'undefined') {
    console.error("config_player.js - ERREUR: nanobotModulesData ou nanobotSkills n'est pas défini !");
}