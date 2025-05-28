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

    critChance: 0.05,       // 5% de chance de coup critique de base
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
        type: "active_damage", // 'active_damage', 'active_heal', 'buff', 'debuff'
        target: "enemy", // 'self', 'enemy'
        cost: { rage: 25 }, 
        cooldown: 2, // En tours 
        baseDamage: 15, 
        damageType: (typeof window !== 'undefined' && window.DAMAGE_TYPES) ? window.DAMAGE_TYPES.KINETIC : 'kinetic',
        unlock: { level: 2 } 
    },
    "repair_wave": {
        id: "repair_wave",
        name: "Onde Réparatrice",
        description: "Émet une onde qui répare légèrement le Nanobot.",
        type: "active_heal",
        target: "self",
        cost: { energy: 10 }, // Utilise l'énergie globale du Nanobot
        cooldown: 3,
        healAmount: 20,
        unlock: { level: 3 }
    }
};
window.NANOBOT_SKILLS_CONFIG = NANOBOT_SKILLS_CONFIG;

// tutorialSteps est maintenant dans config_gameplay.js

console.log("config_player.js - Données du joueur (stats initiales, config compétences) définies.");