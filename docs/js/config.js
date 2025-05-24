// js/config.js (Version minimaliste pour l'Option 2)
console.log("config.js (principal) - Fichier chargé.");
console.log("config.js (principal) - S'assure que les configurations des fichiers config_*.js sont chargées avant les autres scripts (mapManager, main, etc.).");

// Optionnel : Une vérification finale après un court délai pour s'assurer que tout est là.
// Utile pour le débogage de l'ordre de chargement.
setTimeout(() => {
    const essentialConfigs = [
        'TILE_TYPES', 'DAMAGE_TYPES', 'QUEST_STATUS', 'MAP_FEATURE_DATA', // enums
        'TICK_SPEED', 'MAX_MOBILITY_POINTS', 'MOBILITY_RECHARGE_TICKS', // general
        'tileActiveExplorationOptions', 'activeTileViewData', // tile_exploration
        'loreData', // lore
        'itemsData', 'buildingsData', 'researchData', 'QUEST_DATA', // gameplay
        'nanobotModulesData', 'nanobotSkills', // player
        'TILE_TYPES_TO_RESOURCE_KEY', 'explorationEnemyData', 'enemyBaseDefinitions', 'ZONE_DATA', 'BASE_COORDINATES', // world
        'nightAssaultEnemies', 'bossDefinitions', 'nightEvents' // events
    ];
    let allLoaded = true;
    essentialConfigs.forEach(configVar => {
        if (typeof window[configVar] === 'undefined') {
            console.error(`config.js (principal) - ERREUR POST-CHARGEMENT : Variable de configuration globale '${configVar}' est indéfinie ! Vérifiez l'ordre et le contenu des fichiers config_*.js.`);
            allLoaded = false;
        }
    });
    if (allLoaded) {
        console.log("config.js (principal) - POST-CHARGEMENT : Toutes les configurations essentielles semblent globalement accessibles.");
    } else {
        // Ne pas bloquer avec alert() ici, car cela pourrait arriver avant que main.js n'ait eu la chance de gérer l'erreur.
        // Les erreurs sont déjà loguées dans la console.
        console.error("*********************************************************************");
        console.error("* ERREUR CRITIQUE DE CONFIGURATION : DONNÉES DE JEU MANQUANTES !    *");
        console.error("*********************************************************************");
    }
}, 1000); // Augmenter légèrement le délai pour donner plus de temps aux scripts de se charger.