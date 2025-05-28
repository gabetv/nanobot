// js/config_events.js
console.log("config_events.js - Fichier chargé et en cours d'analyse...");

// storyEvents: Événements narratifs majeurs ou mineurs qui peuvent se déclencher.
const storyEvents = {
    "nexus_awakening": {
        id: "nexus_awakening",
        title: "Le Réveil du Nexus",
        description: "Le Nexus-7 s'active pour la première fois. Ses systèmes primaires sont en ligne, mais il a besoin de ressources pour devenir pleinement opérationnel.",
        trigger: { type: "game_start" },
        effects: [
            { type: "add_log_entry", message: "Systèmes Nexus-7 en ligne. Diagnostics initiaux...", logType: "system" },
            { type: "start_quest", questId: "tutorial_build_harvester" }, // Assurer que cette quête existe dans questData
            { type: "unlock_feature", feature: "basic_construction" }
        ],
         repeatable: false
    },
    "first_night_approaches": {
        id: "first_night_approaches",
        title: "La Première Nuit Approche",
        description: "Le soleil commence à décliner. Des lectures énergétiques étranges sont détectées. Il serait prudent de préparer des défenses.",
        trigger: { type: "time_before_first_night", time: 300 }, // 5 minutes avant la première nuit (logique à implémenter)
        effects: [
            { type: "add_log_entry", message: "Anomalies énergétiques détectées. Activité hostile probable à la tombée de la nuit.", logType: "warning" },
            { type: "unlock_research", researchId: "basic_turrets" }, // Débloquer la recherche pour les tourelles
            // { type: "give_item", itemId: "component_turret_kit", quantity: 1 } // Si vous avez un item kit
        ],
        repeatable: false
    },
    "ancient_signal_decoded": {
        id: "ancient_signal_decoded",
        title: "Signal Ancien Décodé",
        description: "Après avoir interagi avec l'ancien terminal, une partie d'un signal complexe a été décodée, pointant vers une structure inconnue dans les montagnes.",
        trigger: { type: "quest_objective_completed", questId: "investigate_ruins", objectiveId: "decode_terminal" }, // Assurer que cette quête/objectif existe
        effects: [
            { type: "add_log_entry", message: "Le signal décodé révèle des coordonnées dans la 'Chaîne des Murmures'.", logType: "quest" },
            { type: "reveal_map_location", zoneId: "whispering_peaks", coords: {x: 25, y: 10}, radius: 2 }, // Assurer que "whispering_peaks" existe
            { type: "start_quest", questId: "find_mountain_structure" } // Assurer que cette quête existe
        ],
        repeatable: false
    }
    // Ajoutez d'autres événements ici
};
window.storyEvents = storyEvents;

// EVENT_TRIGGERS: Types de déclencheurs pour les événements
const EVENT_TRIGGERS = {
    GAME_START: "game_start",
    TIME_ELAPSED: "time_elapsed",
    SPECIFIC_DAY: "specific_day",
    NIGHT_STARTS: "night_starts",
    BUILDING_BUILT: "building_built",
    RESEARCH_COMPLETED: "research_completed",
    ENEMY_DEFEATED: "enemy_defeated", // Peut-être ENEMY_TYPE_DEFEATED ou SPECIFIC_ENEMY_DEFEATED
    ZONE_ENTERED: "zone_entered",
    ITEM_OBTAINED: "item_obtained",
    QUEST_STATUS_CHANGED: "quest_status_changed", // ex: { questId: "X", newStatus: window.QUEST_STATUS.COMPLETED }
    RESOURCE_THRESHOLD: "resource_threshold" // ex: { resource: window.RESOURCE_TYPES.CRYSTAL_SHARDS, amount: 100, condition: "above" }
};
window.EVENT_TRIGGERS = EVENT_TRIGGERS;

// NIGHT_ASSAULT_ENEMY_LIST: Configuration des vagues d'ennemis pour les assauts nocturnes.
// Ces IDs doivent correspondre à ceux dans enemyData (config_world.js)
const NIGHT_ASSAULT_ENEMY_LIST = {
    tier1: ["mutated_rat_weak", "scavenger_bot_rusted"],
    tier2: ["scavenger_bot_rusted", "mutated_rat_weak"], // Placeholder, ajoutez des ennemis de tier 2
    tier3: ["scavenger_bot_rusted", "mutated_rat_weak"], // Placeholder, ajoutez des ennemis de tier 3
    // ...
};
window.NIGHT_ASSAULT_ENEMY_LIST = NIGHT_ASSAULT_ENEMY_LIST;

// NIGHT_EVENTS: Événements spéciaux pouvant survenir pendant les assauts nocturnes.
const nightEvents = [
    {
        id: "reinforcements_delayed",
        name: "Retard des Renforts Ennemis",
        description: "Une interférence anormale semble retarder l'arrivée de certains assaillants.",
        duration: 60, // en secondes
        effect: function(nightAssaultState, baseGrid, defenses) {
            // Logique pour réduire le nombre d'ennemis dans la vague actuelle ou la suivante
            // Par exemple, en modifiant nightAssaultState.spawnQueue
            console.log("Événement nocturne: Retard des renforts activé.");
            if (nightAssaultState && nightAssaultState.spawnQueue) {
                nightAssaultState.spawnQueue = nightAssaultState.spawnQueue.slice(0, Math.floor(nightAssaultState.spawnQueue.length / 2));
            }
        },
        revertEffect: function(nightAssaultState) {
            console.log("Événement nocturne: Retard des renforts terminé.");
        }
    },
    {
        id: "emp_burst",
        name: "Impulsion Électromagnétique Mineure",
        description: "Une surtension énergétique affecte brièvement les systèmes défensifs.",
        duration: 30, // secondes
        effect: function(nightAssaultState, baseGrid, defenses) {
            console.log("Événement nocturne: Impulsion EMP activée.");
            nightAssaultState.globalModifiers = nightAssaultState.globalModifiers || {};
            nightAssaultState.globalModifiers.turretAttackFactor = 0.7; // Réduit l'attaque des tourelles
            nightAssaultState.globalModifiers.turretRangeFactor = 0.8; // Réduit la portée
        },
        revertEffect: function(nightAssaultState) {
            console.log("Événement nocturne: Impulsion EMP terminée.");
            if (nightAssaultState.globalModifiers) {
                delete nightAssaultState.globalModifiers.turretAttackFactor;
                delete nightAssaultState.globalModifiers.turretRangeFactor;
            }
        }
    }
];
window.nightEvents = nightEvents; // Rendre global

// --- BOSS DATA ---
// Ces IDs doivent correspondre à ceux dans enemyData (config_world.js) si le boss peut aussi apparaître comme un ennemi normal.
// Sinon, ce sont des définitions uniques pour les boss.
const BOSS_DATA = {
    "techno_golem_XG7": {
        id: "techno_golem_XG7", name: "Golem Techno-Organique XG-7",
        description: "Une immense construction de métal et de biomasse corrompue.",
        // Stats pour le combat (peuvent être différentes si le boss apparaît dans enemyData)
        health: 2500, maxHealth: 2500, attack: 80, defense: 40, speed: 15,
        damageType: window.DAMAGE_TYPES?.ENERGY || 'energy',
        resistances: {
            [window.DAMAGE_TYPES?.KINETIC || 'kinetic']: 0.25,
            [window.DAMAGE_TYPES?.EXPLOSIVE || 'explosive']: 0.5,
            [window.DAMAGE_TYPES?.CORROSIVE || 'corrosive']: -0.5
        },
        tags: [window.ENEMY_TAGS?.MECHANICAL, window.ENEMY_TAGS?.ORGANIC, window.ENEMY_TAGS?.BOSS, window.ENEMY_TAGS?.HEAVY].filter(t=>t),
        xpValue: 1000, lootTable: "boss_techno_golem_loot", // ID d'une table de butin spécifique (à définir)
        spritePath: "images/bosses/techno_golem.png", // Assurez-vous que l'image existe
        combatSize: "large", arenaStyle: "caves",
        skills: [
            {
                skillId: "energy_pulse_aoe", name: "Impulsion Énergétique",
                description: "Décharge une onde d'énergie pure.", type: "active", target: "all_enemies",
                cooldown: 4, effects: [{ type: "damage", damageType: window.DAMAGE_TYPES?.ENERGY || 'energy', baseAmount: 50 }]
            },
            {
                skillId: "reinforce_plating", name: "Blindage Renforcé",
                description: "Le Golem renforce son blindage.", type: "active", target: "self",
                cooldown: 5, effects: [{ type: "apply_effect", effectId: "defense_buff_major", duration: 3 }] // Effet à définir
            }
        ],
        phases: [ { healthThreshold: 0.5, newSkillUnlocked: "overcharge_beam" } ], // Skill à définir
        defeatEventId: "techno_golem_defeated" // ID d'un storyEvent
    }
};
window.BOSS_DATA = BOSS_DATA;

// Constantes pour la logique des assauts (si non définies dans config_general)
const SPECIAL_EVENT_CHANCE = 0.15; // 15% de chance d'un événement spécial pendant un assaut
const BOSS_WAVE_INTERVAL = 5;     // Un boss apparaît toutes les 5 vagues (par exemple)
window.SPECIAL_EVENT_CHANCE = SPECIAL_EVENT_CHANCE;
window.BOSS_WAVE_INTERVAL = BOSS_WAVE_INTERVAL;

// NIGHT_ASSAULT_TICK_INTERVAL : Combien de ticks de jeu entre chaque "action" des ennemis d'assaut (mouvement/attaque)
// Doit être défini globalement, idéalement dans config_general.js ou ici si spécifique aux assauts.
// Si non défini, gameplayLogic.js aura une erreur.
const NIGHT_ASSAULT_TICK_INTERVAL = 2; // En ticks de jeu (ex: toutes les 2 secondes si TICK_SPEED = 1000ms)
window.NIGHT_ASSAULT_TICK_INTERVAL = NIGHT_ASSAULT_TICK_INTERVAL;

// Placeholder pour les définitions d'ennemis spécifiques aux assauts (si différents de enemyData)
const nightAssaultEnemies = [ // Doit être alimenté par les vraies définitions d'ennemis
    { id: 'swarm_drone', name: 'Drone d\'Essaim', baseHealth: 20, baseAttack: 5, speed: 5, attackRange: 15, color: '#FF8C00', visualSize: {width:8, height:8}, reward: {biomass:1, nanites:1}},
    { id: 'assault_bot', name: 'Bot d\'Assaut', baseHealth: 50, baseAttack: 12, speed: 3, attackRange: 20, color: '#DC143C', visualSize: {width:10, height:10}, reward: {biomass:2, nanites:3}},
    { id: 'heavy_crawler', name: 'Chenille Lourde', baseHealth: 100, baseAttack: 8, speed: 2, attackRange: 10, color: '#8B0000', visualSize: {width:12, height:12}, isFlying: false, reward: {biomass:5, nanites:5}}
];
window.nightAssaultEnemies = nightAssaultEnemies;

const bossDefinitions = { // Similaire à BOSS_DATA, mais pour les assauts. Peut être le même objet.
    // Exemple :
    // "siege_golem": { id: "siege_golem", name: "Golem de Siège", baseHealth: 1000, baseAttack: 50, speed: 1, ... }
};
window.bossDefinitions = bossDefinitions;


console.log("config_events.js - Données des événements (assauts, boss) définies.");