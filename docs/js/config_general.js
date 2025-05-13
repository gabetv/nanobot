// js/config_general.js
console.log("config_general.js - Fichier chargé et en cours d'analyse...");

var TICK_SPEED = 1000; // Millisecondes par tick de jeu

// Durées des cycles converties en ticks de jeu (si TICK_SPEED change, ces valeurs s'ajustent)
var DAY_DURATION = 5 * 60 * (1000 / TICK_SPEED); // 5 minutes en ticks
var NIGHT_DURATION = 3 * 60 * (1000 / TICK_SPEED); // 3 minutes en ticks
// Pour tester rapidement les cycles :
// var DAY_DURATION = 30; // 30 ticks (si TICK_SPEED = 1000ms)
// var NIGHT_DURATION = 45; // 45 ticks (si TICK_SPEED = 1000ms)

var COMBAT_ANIMATION_DELAY_BASE = 700; // en ms, sera divisé par combatSpeedMultiplier
var EXPLORATION_COST_ENERGY = 5;
var DEFAULT_MAP_SIZE = { width: 25, height: 20 }; // Utilisé si une zone n'a pas sa propre mapSize
var BASE_GRID_SIZE = { rows: 9, cols: 13 }; // Pour le schéma défensif de la base

// CONSTANTES POUR LE SCAN
var SCAN_ENERGY_COST = 15;
var SCAN_COOLDOWN_DURATION_SECONDS = 10; // Temps de recharge du scan en secondes
var SCAN_REVEAL_DURATION_SECONDS = 20;   // Durée pendant laquelle les tuiles scannées restent révélées en secondes
// Les versions en ticks (SCAN_COOLDOWN_DURATION, SCAN_REVEAL_DURATION) seront calculées dans main.js ou où nécessaire
// pour s'assurer que TICK_SPEED est défini avant. Ou converties ici si TICK_SPEED est garanti d'être défini avant.
// Pour l'instant, on garde les valeurs en secondes ici.

var BASE_INITIAL_HEALTH = 500;
var NIGHT_ASSAULT_TICK_INTERVAL = 5000 / TICK_SPEED; // En ticks (intervalle entre les actions des ennemis pendant un assaut)
var REPAIR_COST_BASE_HEALTH_BIOMASS = 2;
var REPAIR_COST_BASE_HEALTH_NANITES = 1;
var REPAIR_COST_DEFENSE_HEALTH_BIOMASS = 1;
var REPAIR_COST_DEFENSE_HEALTH_NANITES = 1;
var FORCE_CYCLE_CHANGE_COST = { biomass: 100, nanites: 50 };
var SELL_REFUND_FACTOR = 0.5;
var BOSS_WAVE_INTERVAL = 5; // Un boss apparaît toutes les X nuits
var SPECIAL_EVENT_CHANCE = 0.15; // Chance d'un événement spécial pendant la nuit

console.log("config_general.js - Constantes générales définies.");
if (typeof TICK_SPEED === 'undefined' || typeof BASE_INITIAL_HEALTH === 'undefined') {
    console.error("config_general.js - ERREUR: TICK_SPEED ou BASE_INITIAL_HEALTH n'est pas défini !");
}