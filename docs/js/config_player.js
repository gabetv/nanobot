// js/config_player.js
console.log("config_player.js - Fichier chargé et en cours d'analyse...");

const NANOBOT_INITIAL_STATS = {
    level: 1,
    xp: 0,
    // xpToNext est calculé dynamiquement ou pris de LEVEL_XP_THRESHOLDS dans gameState.js
    // Il est préférable de l'initialiser dans getInitialGameState pour utiliser la config globale.
    // xpToNext: (typeof window.LEVEL_XP_THRESHOLDS !== 'undefined' && window.LEVEL_XP_THRESHOLDS.length > 0) ? window.LEVEL_XP_THRESHOLDS[0] : 100,

    baseHealth: 100,        // Points de vie de base du Nanobot (non modifiés par les buffs temporaires)
    baseAttack: 10,         // Attaque de base
    baseDefense: 5,         // Défense de base
    baseSpeed: 10,          // Vitesse de base

    health: 100,            // Points de vie maximum actuels (incluant bonus permanents)
    currentHealth: 100,     // Points de vie actuels
    attack: 10,             // Attaque actuelle (incluant bonus)
    defense: 5,             // Défense actuelle (incluant bonus)
    speed: 10,              // Vitesse actuelle (incluant bonus)

    critChance: 0.05,       // 5% de chance de coup critique de base (peut être augmenté à 0.10 ou plus pour tester)
    critDamage: 1.5,        // Multiplicateur de dégâts pour un coup critique (150%)

    energyRegen: 0.5,       // Régénération d'énergie par seconde (si applicable en combat ou exploration)
    rageMax: 100,           // Rage maximale pour les compétences (si applicable)
    resistances: {},        // Initialiser les résistances { DAMAGE_TYPE: 0.1 (10% resistance), etc. }

    lastMapScanTime: 0,     // Timestamp du dernier scan de carte pour le cooldown
    isDefendingBase: false  // Si le nanobot participe activement à la défense de la base
};
window.NANOBOT_INITIAL_STATS = NANOBOT_INITIAL_STATS;

// nanobotModulesData est maintenant dans config_gameplay.js pour une meilleure organisation.

const NANOBOT_SKILLS_CONFIG = {
    "power_strike": {
        id: "power_strike",
        name: "Frappe Puissante",
        description: "Une attaque concentrée qui inflige des dégâts modérés.",
        icon: "ti-bolt",
        type: "active_damage",
        target: "enemy",
        cost: { rage: 20 },
        cooldown: 2, // En tours
        baseDamage: 12, // Dégâts de base fixes
        damageMultiplier: 1.2, // Multiplie l'attaque du Nanobot
        damageType: (typeof window !== 'undefined' && window.DAMAGE_TYPES) ? window.DAMAGE_TYPES.KINETIC : 'kinetic',
        unlock: { level: 1 } // Débloqué dès le début
    },
    "repair_wave": { // Renommé en Emergency_Repairs, et devient un soin instantané plus conséquent
        id: "repair_wave", // Garder l'ID pour compatibilité si sauvegardes existent
        name: "Réparations d'Urgence",
        description: "Active des protocoles de réparation d'urgence pour restaurer une quantité modérée de PV.",
        icon: "ti-ambulance",
        type: "active_heal",
        target: "self",
        cost: { energy: 15 },
        cooldown: 4,
        healAmount: 35,
        unlock: { level: 2 } // Changé pour déblocage plus tardif
    },
    "tactical_shield": {
        id: "tactical_shield",
        name: "Bouclier Tactique",
        description: "Déploie un bouclier énergétique temporaire qui absorbe les dégâts entrants.",
        icon: "ti-shield-half-filled",
        type: "shield",
        target: "self",
        cost: { energy: 20 },
        cooldown: 5,
        shieldAmount: 40, // Le bouclier absorbe 40 dégâts
        duration: 3, // Dure 3 tours ou jusqu'à destruction
        effectKey: "tactical_shield_effect", // Pour le suivi dans le tableau d'effets
        unlock: { level: 3 }
    },
    "focused_blast": {
        id: "focused_blast",
        name: "Explosion Focalisée",
        description: "Une décharge d'énergie concentrée qui ignore une partie de la défense ennemie.",
        icon: "ti-target-arrow",
        type: "active_damage",
        target: "enemy",
        cost: { rage: 35 },
        cooldown: 4,
        baseDamage: 10,
        damageMultiplier: 1.5,
        defensePiercing: 0.4, // Ignore 40% de la défense ennemie
        damageType: (typeof window !== 'undefined' && window.DAMAGE_TYPES) ? window.DAMAGE_TYPES.ENERGY : 'energy',
        unlock: { level: 4 }
    },
    "nano_repair_field": {
        id: "nano_repair_field",
        name: "Champ de Nano-Réparation",
        description: "Génère un champ de nanites réparateurs qui restaurent des PV sur la durée.",
        icon: "ti-progress-check",
        type: "hot", // Heal Over Time
        target: "self",
        cost: { energy: 25 },
        cooldown: 6,
        healPerTurn: 10,
        duration: 4, // Soigne pendant 4 tours
        effectKey: "nano_repair_hot",
        unlock: { level: 5 }
    },
    "rage_fueled_strike": {
        id: "rage_fueled_strike",
        name: "Frappe de Rage",
        description: "Convertit toute la rage accumulée en une frappe dévastatrice. Dégâts augmentés par la rage consommée.",
        icon: "ti-flame",
        type: "active_damage",
        target: "enemy",
        cost: { rage: "all" }, // Coût spécial: consomme toute la rage
        cooldown: 3, // Cooldown relativement court car situationnel
        baseDamage: 5, // Dégâts minimaux
        damagePerRagePoint: 0.3, // 0.3 dégât supplémentaire par point de rage
        damageType: (typeof window !== 'undefined' && window.DAMAGE_TYPES) ? window.DAMAGE_TYPES.KINETIC : 'kinetic',
        unlock: { level: 6 }
    }
};
window.NANOBOT_SKILLS_CONFIG = NANOBOT_SKILLS_CONFIG;

// tutorialSteps est maintenant dans config_gameplay.js

console.log("config_player.js - Données du joueur (stats initiales, config compétences) définies.");