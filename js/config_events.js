// js/config_events.js
console.log("config_events.js - Fichier chargé et en cours d'analyse...");

// Assurez-vous que DAMAGE_TYPES (de config_enums.js) et itemsData (de config_gameplay.js)
// sont définis avant ce fichier si vous les utilisez.

var nightAssaultEnemies = [ // Ennemis apparaissant pendant les vagues d'assaut nocturne
    {
        id: 'swarm_drone', name: "Drone d'Essaim",
        baseHealth: 15, baseAttack: 2, speed: 4, attackRange: 5, // Vitesse et portée d'attaque
        damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0, energy: 0.2 },
        reward: { biomass: 2, nanites: 1 },
        spritePath: 'https://placehold.co/8x8/e53e3e/ffffff?text=d', // Plus petit pour la prévisualisation de base
        visualClass: 'drone' // Pour le style sur la prévisualisation de base
    },
    {
        id: 'assault_bot', name: "Bot d'Assaut",
        baseHealth: 40, baseAttack: 5, speed: 2.5, attackRange: 10,
        damageType: DAMAGE_TYPES.ENERGY, resistances: { kinetic: 0.1, energy: -0.15 },
        reward: { biomass: 5, nanites: 3 },
        spritePath: 'https://placehold.co/10x10/dd6b20/ffffff?text=B',
        visualClass: 'bot'
    },
    {
        id: 'heavy_crawler', name: "Rampant Lourd",
        baseHealth: 80, baseAttack: 3, speed: 1.5, attackRange: 15, // Plus lent, plus de portée ?
        damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0.25, energy: 0.1 },
        reward: { biomass: 8, nanites: 2 },
        spritePath: 'https://placehold.co/12x12/d69e2e/1a202c?text=C',
        visualClass: 'crawler'
    }
    // Ajoutez d'autres types d'ennemis d'assaut
];

var bossDefinitions = { // Boss apparaissant lors de vagues spécifiques
    'siege_breaker_alpha': { // ID unique pour ce boss
        id: 'siege_breaker_alpha', name: "Briseur de Siège Alpha",
        baseHealth: 500, baseAttack: 25, defense: 5, speed: 0.8, attackRange: 25,
        damageType: DAMAGE_TYPES.KINETIC, resistances: { kinetic: 0.3, energy: 0.1 },
        reward: { biomass: 150, nanites: 75, xp: 200, loot: ['arte_rare', 'mod_proto'] }, // IDs d'itemsData
        spritePath: 'https://placehold.co/30x30/7f1d1d/fef2f2?text=BS', // Plus grand pour un boss
        visualSize: { width: 24, height: 24 }, // Taille sur la prévisualisation de base
        abilities: [
            { type: 'aoe_stomp', name: "Piétinement Destructeur", chance: 0.2, damage: 15, radius: 60, cooldown: 3 /* rounds d'assaut */, lastUsed: 0 },
            { type: 'regen', name: "Régénération d'Urgence", chance: 0.1, amount: 25, healthThreshold: 0.4 /* sous 40% PV */, cooldown: 5, lastUsed: 0 }
        ]
    }
    // Ajoutez d'autres boss ici
};

var nightEvents = [ // Événements aléatoires pouvant survenir pendant la nuit
    {
        id: 'flying_swarm', name: "Vol Nuptial Agressif",
        description: "Une nuée d'unités volantes ignore vos défenses au sol et cible directement le noyau !",
        effect: (nightAssaultState) => { // nightAssaultState est gameState.nightAssault
            if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultState?.log) addLogEntry("ALERTE: Unités volantes ennemies détectées !", "error", nightAssaultLogEl, nightAssaultState.log);
            if(nightAssaultState && nightAssaultState.enemies) {
                nightAssaultState.enemies.forEach(enemy => {
                    enemy.isFlying = true; // Logique à implémenter pour que les murs ne les bloquent pas
                    if(enemy.typeInfo) enemy.typeInfo.name += " (Volant)";
                });
            }
        },
        duration: NIGHT_DURATION * TICK_SPEED // Durée en ms
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
        revertEffect: (nightAssaultState) => { // Ce qui se passe quand l'événement se termine
            if (nightAssaultState && nightAssaultState.globalModifiers) delete nightAssaultState.globalModifiers.turretRangeFactor;
            if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultState?.log) addLogEntry("Le brouillard se dissipe.", "info", nightAssaultLogEl, nightAssaultState.log);
        },
        duration: NIGHT_DURATION * TICK_SPEED // Durée en ms
    },
    {
        id: 'reinforcements_delayed', name: "Interférences de Communication",
        description: "Des interférences empêchent l'arrivée de la prochaine vague d'ennemis pour un temps.",
        effect: (nightAssaultState) => {
            if(typeof addLogEntry === 'function' && typeof nightAssaultLogEl !== 'undefined' && nightAssaultState?.log) addLogEntry("Interférences détectées... Arrivée des renforts ennemis retardée !", "info", nightAssaultLogEl, nightAssaultState.log);
            if(nightAssaultState) {
                // Augmenter le délai avant la prochaine vague ou le prochain tick d'attaque ennemi
                // Par exemple, en modifiant gameState.nightAssault.lastAttackTime
                const delayInSeconds = 30;
                gameState.nightAssault.lastAttackTime += delayInSeconds * (1000 / TICK_SPEED);
            }
        },
        duration: 10 * TICK_SPEED // L'effet lui-même est instantané (retard), mais l'événement a une "durée" pour l'affichage.
    }
];

console.log("config_events.js - Données des événements (assauts, boss) définies.");
if (typeof nightAssaultEnemies === 'undefined' || typeof bossDefinitions === 'undefined' || typeof nightEvents === 'undefined') {
    console.error("config_events.js - ERREUR: nightAssaultEnemies, bossDefinitions ou nightEvents n'est pas défini !");
}