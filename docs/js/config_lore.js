// js/config_lore.js
console.log("config_lore.js - Fichier chargé et en cours d'analyse...");

var loreData = {
    'origin_signal_01': {
        title: "Signal Ancien - Fragment Alpha",
        text: "Les données corrompues récupérées d'une balise parlent d'un 'Protocole Genesis' et d'une 'Directive de Survie Primaire'. Le Nexus-7 semble être plus qu'un simple drone d'exploration...",
        category: "Origines Nexus-7"
    },
    'ruin_inscription_verdant': {
        title: "Inscription de l'Archipel",
        text: "Des gravures primitives sur une stèle en ruine représentent des créatures filiformes adorant une sorte de cristal géant. Auraient-ils vénéré les sources de nanites ?",
        category: "Civilisations Perdues"
    }
    // ... plus d'entrées de lore
};

console.log("config_lore.js - loreData défini:", typeof loreData);

if (typeof loreData === 'undefined') {
    console.error("config_lore.js - ERREUR: loreData n'est pas défini !");
}