// js/config_player.js
console.log("config_player.js - Fichier chargé et en cours d'analyse...");

// Assurez-vous que TILE_TYPES (de config_enums.js) est défini avant.
// Assurez-vous que itemsData (pour les coûts) et researchData (pour unlockMethod)
// sont définis avant ce fichier si vous les utilisez dans les définitions ci-dessous.

var nanobotModulesData = {
    'armBlade': {
        id: 'armBlade', name: "Lame de Bras",
        description: "Un bras transformable en lame tranchante, augmentant l'attaque.",
        visualClass: 'module-arm-blade',
        unlockMethod: { research: 'weaponizedNanites' },
        levels: [ // Assurez-vous que 'levels' est un tableau non vide
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
        levels: [ // Assurez-vous que 'levels' est un tableau non vide
            { level: 1, statBoost: { speed: 5, defense: 1 }, costToUnlockOrUpgrade: { nanites: 75, crist_stock: 2 } },
            { level: 2, statBoost: { speed: 8, defense: 2 }, costToUpgrade: { nanites: 150, crist_stock: 3, mod_proto: 1 } }
        ]
    },

    // VÉRIFIEZ ATTENTIVEMENT CES DEUX ENTRÉES :
    'shieldGeneratorMk1': {
        id: 'shieldGeneratorMk1', name: "Bouclier Énergétique Mk1",
        description: "Génère un champ de force protecteur de base, augmentant la défense et les PV.",
        visualClass: 'module-shield',
        unlockMethod: { building: 'defenseFoundry', buildingLevel: 1 },
        levels: [ // DOIT ÊTRE PRÉSENT ET ÊTRE UN TABLEAU NON VIDE
            { level: 1, statBoost: { defense: 10, health: 20 }, costToUnlockOrUpgrade: { nanites: 100, biomass: 50 } },
            { level: 2, statBoost: { defense: 15, health: 35 }, costToUpgrade: { nanites: 180, biomass: 100, comp_av: 1 } }
        ]
    },
    'shieldGeneratorMk2': {
        id: 'shieldGeneratorMk2', name: "Bouclier Énergétique Mk2",
        description: "Génère un champ de force protecteur amélioré. Remplace le Mk1.",
        visualClass: 'module-shield',
        unlockMethod: { building: 'defenseFoundry', buildingLevel: 2 },
        replaces: 'shieldGeneratorMk1', // Indique quel module il remplace
        levels: [ // DOIT ÊTRE PRÉSENT ET ÊTRE UN TABLEAU NON VIDE
            { level: 1, statBoost: { defense: 20, health: 50 }, costToUnlockOrUpgrade: { nanites: 250, biomass: 150, mod_proto: 2 } },
            { level: 2, statBoost: { defense: 30, health: 75 }, costToUpgrade: { nanites: 400, biomass: 250, arte_rare: 1 } }
        ]
    },
    // NOUVEAUX MODULES POUR LES OBSTACLES (vérifiez aussi leur structure 'levels')
    'drillArm': {
        id: 'drillArm', name: "Bras Foreuse",
        description: "Un bras robuste équipé d'une foreuse pour percer les obstacles friables.",
        visualClass: 'module-arm-drill',
        unlockMethod: { research: 'advanced_tooling' },
        canTraverse: (typeof TILE_TYPES !== 'undefined' ? [TILE_TYPES.DEBRIS_FIELD] : []), // Vérifier que TILE_TYPES est défini
        levels: [
            { level: 1, statBoost: { attack: 2 }, costToUnlockOrUpgrade: { nanites: 100, comp_av: 1, biomass: 75 } },
            { level: 2, statBoost: { attack: 4 }, costToUpgrade: { nanites: 180, comp_av: 2, mod_proto: 1 } }
        ]
    },
    'plasmaCutter': {
        id: 'plasmaCutter', name: "Découpeur Plasma",
        description: "Émet un jet de plasma capable de trancher la végétation dense ou les fines plaques métalliques.",
        visualClass: 'module-arm-cutter',
        unlockMethod: { research: 'plasma_containment' },
        canTraverse: (typeof TILE_TYPES !== 'undefined' ? [TILE_TYPES.THICK_VINES] : []), // Vérifier que TILE_TYPES est défini
        levels: [
            { level: 1, statBoost: { attack: 1 }, costToUnlockOrUpgrade: { nanites: 120, comp_av: 1, crist_stock: 2 } },
            { level: 2, statBoost: { attack: 3 }, costToUpgrade: { nanites: 200, comp_av: 2, arte_rare: 1 } }
        ]
    }
};

var nanobotSkills = { /* ... Votre nanobotSkills existant ... */
    'powerStrike': { id: 'powerStrike', name: "Frappe Puissante", description: "Une attaque concentrée qui inflige 150% des dégâts normaux.", type: "active_attack_boost", target: "enemy", cost: { rage: 30 }, effect: { damageMultiplier: 1.5 }, cooldown: 2, activationMessage: "Nexus-7 concentre son énergie pour une Frappe Puissante !", effectMessage: (damage) => `L'attaque inflige ${damage} dégâts critiques !`},
    'repairNanites': { id: 'repairNanites', name: "Nanites Réparateurs", description: "Restaure une petite quantité de PV.", type: "active_heal", target: "self", cost: { energy: 10 }, effect: { healAmount: 20 }, cooldown: 3, activationMessage: "Nexus-7 active ses nanites réparateurs !", effectMessage: (healedAmount) => `Nexus-7 se répare de ${healedAmount} PV.`},
    'overchargeShot': { id: 'overchargeShot', name: "Tir Surchargé", description: "Prochaine attaque ignore 25% de la défense ennemie.", type: "active_buff_self_next_attack", target: "self", cost: { rage: 15, energy: 5 }, effect: { defensePiercing: 0.25, duration: 1 }, cooldown: 4, activationMessage: "Nexus-7 surcharge ses systèmes d'armes !", effectMessage: () => `La prochaine attaque du Nexus-7 perforera mieux les blindages !`},
    'emergencyShield': { id: 'emergencyShield', name: "Bouclier d'Urgence", description: "Bouclier temporaire absorbant 20 dégâts.", type: "passive_defensive_buff", trigger: { healthPercentBelow: 30 }, effect: { damageAbsorption: 20, duration: 1 }, cooldown: 5, activationMessage: "Systèmes d'urgence ! Bouclier temporaire activé !", effectMessage: "Le bouclier absorbe les prochains dégâts." },
    'adaptiveFocus': { id: 'adaptiveFocus', name: "Concentration Adaptative", description: "Chaque attaque réussie augmente les dégâts.", type: "passive_buff_stack", trigger: { onNanobotAttackHit: true }, effect: { damageBonusPerStack: 2, maxStacks: 3 }, resetCondition: { onNanobotHit: true }, cooldown: 0, activationMessage: (stacks) => `Concentration accrue (x${stacks}) !` }
};

console.log("config_player.js - Données du joueur (modules, compétences) définies.");
if (typeof nanobotModulesData === 'undefined' || typeof nanobotSkills === 'undefined') {
    console.error("config_player.js - ERREUR: nanobotModulesData ou nanobotSkills n'est pas défini !");
}
// Vérification supplémentaire pour les modules problématiques
if (nanobotModulesData && (!nanobotModulesData.shieldGeneratorMk1 || !nanobotModulesData.shieldGeneratorMk1.levels)) {
    console.error("config_player.js - ERREUR DE CONFIG: shieldGeneratorMk1 est mal défini ou manque 'levels'.", nanobotModulesData.shieldGeneratorMk1);
}
if (nanobotModulesData && (!nanobotModulesData.shieldGeneratorMk2 || !nanobotModulesData.shieldGeneratorMk2.levels)) {
    console.error("config_player.js - ERREUR DE CONFIG: shieldGeneratorMk2 est mal défini ou manque 'levels'.", nanobotModulesData.shieldGeneratorMk2);
}