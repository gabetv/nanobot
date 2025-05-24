// js/config_general.js
console.log("config_general.js - Fichier chargé et en cours d'analyse...");

var TICK_SPEED = 1000; // Millisecondes par tick de jeu

var DAY_DURATION = 5 * 60 * (1000 / TICK_SPEED); // 5 minutes en ticks
var NIGHT_DURATION = 3 * 60 * (1000 / TICK_SPEED); // 3 minutes en ticks

var COMBAT_ANIMATION_DELAY_BASE = 700; // en ms, sera divisé par combatSpeedMultiplier

// NOUVELLE GESTION DE MOBILITÉ (EXPLORATION_COST_ENERGY est obsolète si vous utilisez la mobilité)
var EXPLORATION_COST_MOBILITY = 1; // Coût pour se déplacer d'une case sur la carte principale
var MAX_MOBILITY_POINTS = 10;
var MOBILITY_RECHARGE_RATE_PER_MINUTE = 1; // Points par minute
var MOBILITY_RECHARGE_TICKS = Math.floor(60 / MOBILITY_RECHARGE_RATE_PER_MINUTE * (1000 / TICK_SPEED)); // Ticks pour 1 point

var DEFAULT_MAP_SIZE = { width: 25, height: 20 }; // Utilisé si une zone n'a pas sa propre mapSize
var BASE_GRID_SIZE = { rows: 9, cols: 13 }; // Pour le schéma défensif de la base

// CONSTANTES POUR LE SCAN DE CARTE DU MONDE
var SCAN_ENERGY_COST = 15;
var SCAN_COOLDOWN_DURATION_SECONDS = 10;
var SCAN_REVEAL_DURATION_SECONDS = 20;
// Les versions en ticks (SCAN_COOLDOWN_DURATION, SCAN_REVEAL_DURATION) seront calculées où nécessaire

var BASE_INITIAL_HEALTH = 500; // Santé initiale du noyau de la base
var NIGHT_ASSAULT_TICK_INTERVAL = 5000 / TICK_SPEED; // En ticks (intervalle entre les actions des ennemis)

// Coûts de réparation
var REPAIR_COST_BASE_HEALTH_BIOMASS = 2;
var REPAIR_COST_BASE_HEALTH_NANITES = 1;
var REPAIR_COST_DEFENSE_HEALTH_BIOMASS = 1;
var REPAIR_COST_DEFENSE_HEALTH_NANITES = 1;

var FORCE_CYCLE_CHANGE_COST = { biomass: 100, nanites: 50 };
var SELL_REFUND_FACTOR = 0.5; // Pour la vente de défenses
var BOSS_WAVE_INTERVAL = 5; // Un boss apparaît toutes les X nuits
var SPECIAL_EVENT_CHANCE = 0.15; // Chance d'un événement spécial pendant la nuit

console.log("config_general.js - Constantes générales définies.");
if (typeof TICK_SPEED === 'undefined' || typeof BASE_INITIAL_HEALTH === 'undefined' || typeof MAX_MOBILITY_POINTS === 'undefined') {
    console.error("config_general.js - ERREUR: TICK_SPEED, BASE_INITIAL_HEALTH ou MAX_MOBILITY_POINTS n'est pas défini !");
}