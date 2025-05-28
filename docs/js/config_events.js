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
        ],
        repeatable: false
    },
    "ancient_signal_decoded": {
        id: "ancient_signal_decoded",
        title: "Signal Ancien Décodé",
        description: "Après avoir interagi avec l'ancien terminal, une partie d'un signal complexe a été décodée, pointant vers une structure inconnue dans les montagnes.",
        trigger: { type: "quest_objective_completed", questId: "investigate_ruins", objectiveId: "decode_terminal" }, 
        effects: [
            { type: "add_log_entry", message: "Le signal décodé révèle des coordonnées dans la 'Chaîne des Murmures'.", logType: "quest" },
            { type: "reveal_map_location", zoneId: "whispering_peaks", coords: {x: 25, y: 10}, radius: 2 }, 
            { type: "start_quest", questId: "find_mountain_structure" } 
        ],
        repeatable: false
    }
};
window.storyEvents = storyEvents;

const EVENT_TRIGGERS = {
    GAME_START: "game_start",
    TIME_ELAPSED: "time_elapsed",
    SPECIFIC_DAY: "specific_day",
    NIGHT_STARTS: "night_starts",
    BUILDING_BUILT: "building_built",
    RESEARCH_COMPLETED: "research_completed",
    ENEMY_DEFEATED: "enemy_defeated", 
    ZONE_ENTERED: "zone_entered",
    ITEM_OBTAINED: "item_obtained",
    QUEST_STATUS_CHANGED: "quest_status_changed", 
    RESOURCE_THRESHOLD: "resource_threshold" 
};
window.EVENT_TRIGGERS = EVENT_TRIGGERS;

const NIGHT_ASSAULT_ENEMY_LIST = {
    tier1: ["mutated_rat_weak", "scavenger_bot_rusted"],
    tier2: ["scavenger_bot_rusted", "mutated_rat_weak"], 
    tier3: ["scavenger_bot_rusted", "mutated_rat_weak"], 
};
window.NIGHT_ASSAULT_ENEMY_LIST = NIGHT_ASSAULT_ENEMY_LIST;

const nightEvents = [
    {
        id: "reinforcements_delayed",
        name: "Retard des Renforts Ennemis",
        description: "Une interférence anormale semble retarder l'arrivée de certains assaillants.",
        duration: 60, 
        effect: function(nightAssaultState, baseGrid, defenses) {
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
        duration: 30, 
        effect: function(nightAssaultState, baseGrid, defenses) {
            console.log("Événement nocturne: Impulsion EMP activée.");
            nightAssaultState.globalModifiers = nightAssaultState.globalModifiers || {};
            nightAssaultState.globalModifiers.turretAttackFactor = 0.7; 
            nightAssaultState.globalModifiers.turretRangeFactor = 0.8; 
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
window.nightEvents = nightEvents; 

const BOSS_DATA = {
    "techno_golem_XG7": {
        id: "techno_golem_XG7", name: "Golem Techno-Organique XG-7",
        description: "Une immense construction de métal et de biomasse corrompue.",
        health: 2500, maxHealth: 2500, attack: 80, defense: 40, speed: 15,
        damageType: window.DAMAGE_TYPES?.ENERGY || 'energy',
        resistances: {
            [window.DAMAGE_TYPES?.KINETIC || 'kinetic']: 0.25,
            [window.DAMAGE_TYPES?.EXPLOSIVE || 'explosive']: 0.5,
            [window.DAMAGE_TYPES?.CORROSIVE || 'corrosive']: -0.5
        },
        tags: [window.ENEMY_TAGS?.MECHANICAL, window.ENEMY_TAGS?.ORGANIC, window.ENEMY_TAGS?.BOSS, window.ENEMY_TAGS?.HEAVY].filter(t=>t),
        xpValue: 1000, lootTable: "boss_techno_golem_loot", 
        spritePath: "images/bosses/techno_golem.png", 
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
                cooldown: 5, effects: [{ type: "apply_effect", effectId: "defense_buff_major", duration: 3 }] 
            }
        ],
        phases: [ { healthThreshold: 0.5, newSkillUnlocked: "overcharge_beam" } ], 
        defeatEventId: "techno_golem_defeated" 
    }
};
window.BOSS_DATA = BOSS_DATA;

const SPECIAL_EVENT_CHANCE = 0.15; 
const BOSS_WAVE_INTERVAL = 5;     
window.SPECIAL_EVENT_CHANCE = SPECIAL_EVENT_CHANCE;
window.BOSS_WAVE_INTERVAL = BOSS_WAVE_INTERVAL;

const NIGHT_ASSAULT_TICK_INTERVAL = 2; 
window.NIGHT_ASSAULT_TICK_INTERVAL = NIGHT_ASSAULT_TICK_INTERVAL;

const nightAssaultEnemies = [ 
    { id: 'swarm_drone', name: 'Drone d\'Essaim', baseHealth: 20, baseAttack: 5, speed: 5, attackRange: 15, color: '#FF8C00', visualSize: {width:8, height:8}, reward: {biomass:1, nanites:1}},
    { id: 'assault_bot', name: 'Bot d\'Assaut', baseHealth: 50, baseAttack: 12, speed: 3, attackRange: 20, color: '#DC143C', visualSize: {width:10, height:10}, reward: {biomass:2, nanites:3}},
    { id: 'heavy_crawler', name: 'Chenille Lourde', baseHealth: 100, baseAttack: 8, speed: 2, attackRange: 10, color: '#8B0000', visualSize: {width:12, height:12}, isFlying: false, reward: {biomass:5, nanites:5}}
];
window.nightAssaultEnemies = nightAssaultEnemies;

const bossDefinitions = { 
};
window.bossDefinitions = bossDefinitions;

// NOUVEAU : Micro-événements de tuile
const MINOR_TILE_EVENTS = [
    {
        id: "small_resource_find",
        chance: 0.03, 
        condition: (tile, gs) => !tile.content, 
        text: "Vous remarquez une petite cache de {resourceName} à moitié enfouie.",
        effect: (tile, gs) => {
            const resTypes = ['biomass', 'nanites'];
            const foundRes = getRandomElement(resTypes); // Assurez-vous que getRandomElement est global ou défini ici
            const amount = getRandomInt(3, 8); // Assurez-vous que getRandomInt est global ou défini ici
            gs.resources[foundRes] = (gs.resources[foundRes] || 0) + amount;
            if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
            return { logMessage: `Trouvé +${amount} ${foundRes} !`, logType: "success" };
        }
    },
    {
        id: "corrupted_data_blip",
        chance: 0.02,
        text: "Un bref signal de données corrompu émane d'un débris proche. Vous ne pouvez rien en tirer pour le moment.",
        effect: (tile, gs) => { return { logMessage: "Signal de données énigmatique détecté.", logType: "info" }; }
    },
    {
        id: "minor_tremor",
        chance: 0.01,
        text: "Le sol tremble légèrement sous les appendices du Nexus-7. Rien de plus.",
        effect: (tile, gs) => { return { logMessage: "Secousse mineure ressentie.", logType: "map-event" }; }
    },
    {
        id: "fauna_traces",
        chance: 0.04,
        condition: (tile, gs) => tile.actualType === (window.TILE_TYPES?.FOREST || "forest") || tile.actualType === (window.TILE_TYPES?.EMPTY_GRASSLAND || "empty_grassland"),
        text: "Le Nexus-7 détecte des traces fraîches d'une faune inconnue. Prudence.",
        effect: (tile, gs) => { return { logMessage: "Traces animales fraîches repérées.", logType: "warning" }; }
    },
    {
        id: "strange_silence",
        chance: 0.02,
        text: "Un silence inhabituel s'est installé dans cette zone. C'est presque... déconcertant.",
        effect: (tile, gs) => { return { logMessage: "L'atmosphère est étrangement calme ici.", logType: "info" }; }
    }
];
window.MINOR_TILE_EVENTS = MINOR_TILE_EVENTS;


console.log("config_events.js - Données des événements (assauts, boss, micro-événements) définies.");