// js/gameState.js
console.log("gameState.js - Fichier chargé et en cours d'analyse...");

// La variable gameState est déclarée ici.
// Son initialisation complète avec la structure d'objet et les valeurs
// (y compris celles de config.js et les nouvelles propriétés pour les quêtes et la carte)
// se fera au début de la fonction init() dans main.js.
// Cela permet d'éviter les problèmes de "Temporal Dead Zone" (TDZ)
// et d'assurer que toutes les constantes de config.js sont disponibles.
let gameState;

// Log pour confirmer que le script gameState.js lui-même a été exécuté.
// L'objet gameState sera undefined ici, ce qui est normal à ce stade.
console.log("gameState.js - 'let gameState;' exécuté. gameState est actuellement:", gameState);
// console.log("gameState.js - Fin du fichier.");