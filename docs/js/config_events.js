// js/config_events.js
console.log("config_events.js - Fichier chargé et en cours d'analyse...");

// Assurez-vous que DAMAGE_TYPES (de config_enums.js) et itemsData (de config_gameplay.js)
// sont définis avant ce fichier si vous les utilisez.
// Et que NIGHT_DURATION et TICK_SPEED (de config_general.js) sont définis.

var nightAssaultEnemies = [
    {
        id: 'swarm_drone', name: "Drone d'Essaim",
        baseHealth: 15, baseAttack: 2, speed: 4, attackRange: 5,
        damageType: (typeof DAMAGE_TYPES !== 'undefined' ? DAMAGE_TYPES.KINETIC : 'kinetic'), resistances: { kinetic: 0, energy: 0.2 },
        reward: { biomass: 2, nanites: 1 },
        spritePath: 'https://placehold.co/8x8/e53e3e/ffffff?text=d',
        visualClass: 'drone'
    },
    {
        id: 'assault_bot', name: "Bot d'Assaut",
        baseHealth: 40, baseAttack: 5, speed: 2.5, attackRange: 10,
        damageType: (typeof DAMAGE_TYPES !== 'undefined' ? DAMAGE_TYPES.ENERGY : 'energy'), resistances: { kinetic: 0.1, energy: -0.15 },
        reward: { biomass: 5, nanites: 3 },
        spritePath: 'https://placehold.co/10x10/dd6b20/ffffff?text=B',
        visualClass: 'bot'
    },
    {
        id: 'heavy_crawler', name: "Rampant Lourd",
        baseHealth: 80, baseAttack: 3, speed: 1.5, attackRange: 15,
        damageType: (typeof DAMAGE_TYPES !== 'undefined' ? DAMAGE_TYPES.KINETIC : 'kinetic'), resistances: { kinetic: 0.25, energy: 0.1 },
        reward: { biomass: 8, nanites: 2 },
        spritePath: 'https://placehold.co/12x12/d69e2e/1a202c?text=C',
        visualClass: 'crawler'
    }
];

var bossDefinitions = {
    'siege_breaker_alpha': {
        id: 'siege_breaker_alpha', name: "Briseur de Siège Alpha",
        baseHealth: 500, baseAttack: 25, defense: 5, speed: 0.8, attackRange: 25,
        damageType: (typeof DAMAGE_TYPES !== 'undefined' ? DAMAGE_TYPES.KINETIC : 'kinetic'), resistances: { kinetic: 0.3, energy: 0.1 },
        reward: { biomass: 150, nanites: 75, xp: 200, loot: ['arte_rare', 'mod_proto'] },
        spritePath: 'https://placehold.co/30x30/7f1d1d/fef2f2?text=BS',
        visualSize: { width: 24, height: 24 },
        abilities: [
            { type: 'aoe_stomp', name: "Piétinement Destructeur", chance: 0.2, damage: 15, radius: 60, cooldown: 3, lastUsed: 0 },
            { type: 'regen', name: "Régénération d'Urgence", chance: 0.1, amount: 25, healthThreshold: 0.4, cooldown: 5, lastUsed: 0 }
        ]
    }
};

var nightEvents = [
    {
        id: 'flying_swarm', name: "Vol Nuptial Agressif",
        description: "Une nuée d'unités volantes ignore vos défenses au sol et cible directement le noyau !",
        effect: (nightAssaultState) => {
            if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultState?.log) addLogEntry("ALERTE: Unités volantes ennemies détectées !", "error", nightAssaultLogEl, nightAssaultState.log);
            if(nightAssaultState && nightAssaultState.enemies) {
                nightAssaultState.enemies.forEach(enemy => {
                    enemy.isFlying = true;
                    if(enemy.typeInfo) enemy.typeInfo.name += " (Volant)";
                });
            }
        },
        duration: (typeof NIGHT_DURATION !== 'undefined' && typeof TICK_SPEED !== 'undefined' ? NIGHT_DURATION * TICK_SPEED : 300000) // Durée en ms
    },
    {
        id: 'dense_fog', name: "Brouillard Étrange",
        description: "Un brouillard dense réduit la portée de toutes les tourelles de 30% !",
        effect: (nightAssaultState) => {
            if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultState?.log) addLogEntry("Brouillard étrange réduisant la visibilité...", "warning", nightAssaultLogEl, nightAssaultState.log);
            if(nightAssaultState) {
                nightAssaultState.globalModifiers = nightAssaultState.globalModifiers || {};
                nightAssaultState.globalModifiers.turretRangeFactor = 0.7;
            }
        },
        revertEffect: (nightAssaultState) => {
            if (nightAssaultState && nightAssaultState.globalModifiers) delete nightAssaultState.globalModifiers.turretRangeFactor;
            if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultState?.log) addLogEntry("Le brouillard se dissipe.", "info", nightAssaultLogEl, nightAssaultState.log);
        },
        duration: (typeof NIGHT_DURATION !== 'undefined' && typeof TICK_SPEED !== 'undefined' ? NIGHT_DURATION * TICK_SPEED : 300000)
    },
    {
        id: 'reinforcements_delayed', name: "Interférences de Communication",
        description: "Des interférences empêchent l'arrivée de la prochaine vague d'ennemis pour un temps.",
        effect: (nightAssaultState) => {
            if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultState?.log) addLogEntry("Interférences détectées... Arrivée des renforts ennemis retardée !", "info", nightAssaultLogEl, nightAssaultState.log);
            if(nightAssaultState && typeof gameState !== 'undefined' && typeof TICK_SPEED !== 'undefined') { // gameState pour gameState.nightAssault
                const delayInSeconds = 30;
                // gameState.nightAssault.lastAttackTime est un timestamp en ticks de jeu
                if (gameState.nightAssault) { // S'assurer que gameState.nightAssault est défini
                    gameState.nightAssault.lastAttackTime += delayInSeconds * (1000 / TICK_SPEED);
                }
            }
        },
        duration: (typeof TICK_SPEED !== 'undefined' ? 10 * TICK_SPEED : 10000) // L'effet est instantané, mais l'événement a une "durée" pour affichage.
    }
];

console.log("config_events.js - Données des événements (assauts, boss) définies.");
if (typeof nightAssaultEnemies === 'undefined' || typeof bossDefinitions === 'undefined' || typeof nightEvents === 'undefined') {
    console.error("config_events.js - ERREUR: nightAssaultEnemies, bossDefinitions ou nightEvents n'est pas défini !");
}