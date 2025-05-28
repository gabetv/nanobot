// js/config.js (Version TRÈS minimaliste pour le débogage)
console.log("config.js (principal) - Fichier chargé.");
console.log("config.js (principal) - Ce fichier est un point d'ancrage pour l'ordre de chargement ou pour des configurations spécifiques à CE fichier (actuellement aucune).");

// TOUT LE CODE DE VÉRIFICATION AVEC setTimeout EST COMMENTÉ OU SUPPRIMÉ POUR LE MOMENT.
// La validation des configurations globales est gérée par checkAllConfigLoaded() dans main.js
// après window.onload, ce qui est plus fiable.

/*
setTimeout(() => {
    const essentialConfigs = [
        // ... liste ...
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
        console.error("*********************************************************************");
        console.error("* ERREUR CRITIQUE DE CONFIGURATION : DONNÉES DE JEU MANQUANTES !    *");
        console.error("*********************************************************************");
    }
}, 1000);
*/