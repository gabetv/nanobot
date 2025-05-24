// js/config_tile_exploration.js
console.log("config_tile_exploration.js - Fichier chargé et en cours d'analyse...");

// Assurez-vous que TILE_TYPES, gameState (pour les actions), addToInventory, unlockLoreEntry, etc.
// sont accessibles si vous les utilisez directement dans les fonctions 'action'.
// Il est préférable que les fonctions 'action' soient pures et que la logique principale
// (comme ajouter à l'inventaire) soit gérée par explorationController après le retour de l'action.
// Mais pour la simplicité de l'exemple initial, certaines actions peuvent modifier gameState.

var tileActiveExplorationOptions = {
    'scan_local_active': {
        id: 'scan_local_active',
        name: "Scanner (Détaillé)",
        description: "Analyse approfondie de la case actuelle. Révèle des éléments cachés ou des dangers imminents.",
        icon: "ti-radar-2", // Icône Tabler
        cost: { energy: 5 },
        canRepeat: false, // Ne peut être utilisé qu'une fois par tuile pour révéler les features
        action: function(tile, gameState) {
            let findingsText = "";
            let tileLogUpdates = [];

            if (tile.usedActions && tile.usedActions['scan_local_active']) {
                 return { forMainLog: "Scan local déjà effectué sur cette case.", forTileLog: "Scan déjà effectué." };
            }

            let newDiscoveries = false;
            if (tile.hiddenFeatures && tile.hiddenFeatures.length > 0) {
                // Révéler TOUTES les features cachées lors du premier scan réussi
                tile.revealedFeatures = tile.revealedFeatures || [];
                tile.hiddenFeatures.forEach(feature => {
                    tile.revealedFeatures.push(feature);
                    newDiscoveries = true;
                    let discoveryMsg = "";
                    switch(feature.type) {
                        case 'small_resource_cache':
                            discoveryMsg = `Cache de ${feature.resourceType || 'ressources'} localisée !`;
                            break;
                        case 'ancient_data_fragment':
                            discoveryMsg = `Signal de données étrange détecté !`;
                            break;
                        case 'hidden_trap':
                            discoveryMsg = `DANGER: Signature de piège détectée !`;
                            tile.hasActiveTrap = true; // Marquer le piège comme actif
                            break;
                        default:
                            discoveryMsg = `Signal énigmatique trouvé : ${feature.name || feature.type}.`;
                    }
                    tileLogUpdates.push(discoveryMsg);
                });
                tile.hiddenFeatures = []; // Vider les features cachées puisqu'elles sont maintenant révélées
                findingsText = "Scan réussi : " + (newDiscoveries ? "Plusieurs éléments localisés. De nouvelles options sont disponibles." : "Aucun élément dissimulé majeur détecté.");

            } else {
                findingsText = "Scan local terminé. Aucun élément notable dissimulé détecté.";
            }

            tile.usedActions = tile.usedActions || {};
            tile.usedActions['scan_local_active'] = true;

            // Le rafraîchissement de l'UI se fait dans explorationController après l'appel de cette action
            return { forMainLog: findingsText, forTileLog: tileLogUpdates.length > 0 ? tileLogUpdates.join("<br>") : findingsText, newActionsAvailable: newDiscoveries };
        }
    },
    'search_area_active': {
        id: 'search_area_active',
        name: "Fouiller la Zone",
        description: "Recherche manuelle de ressources ou d'indices. Peut être risqué.",
        icon: "ti-search",
        cost: { mobility: 0.2 },
        canRepeat: true,
        maxRepeats: 3, // Nombre de tentatives de fouille
        action: function(tile, gameState) {
            tile.searchAttempts = (tile.searchAttempts || 0) + 1;
            let mainLogMsg = "";
            let tileLogMsg = "";

            if (tile.searchAttempts > (this.maxRepeats || 3)) {
                mainLogMsg = tileLogMsg = "Vous avez déjà fouillé cette zone intensivement. Il ne semble plus y avoir rien à trouver.";
                return { forMainLog: mainLogMsg, forTileLog: tileLogMsg };
            }

            if (tile.hasActiveTrap && Math.random() < 0.4) { // Augmenter la chance de déclencher un piège actif
                const damage = Math.floor(Math.random() * 8) + 5; // Dégâts du piège
                gameState.nanobotStats.currentHealth -= damage;
                if (gameState.nanobotStats.currentHealth < 0) gameState.nanobotStats.currentHealth = 0;
                tile.hasActiveTrap = false; // Le piège est déclenché et disparaît
                mainLogMsg = `Vous avez déclenché un piège en fouillant ! (-${damage} PV)`;
                tileLogMsg = `ALERTE : Piège déclenché ! Le Nexus-7 subit ${damage} points de dégâts. Le danger est écarté.`;
                if (typeof uiUpdates !== 'undefined') uiUpdates.updateNanobotDisplay(); // Mettre à jour l'affichage des PV
                return { forMainLog: mainLogMsg, forTileLog: tileLogMsg, logType: "error" };
            }

            if (Math.random() < 0.4 / tile.searchAttempts) { // Chance de trouver quelque chose, décroissante
                const amount = Math.floor(Math.random() * 10) + 5;
                const resTypes = ['biomass', 'nanites', 'frag_alien'];
                const foundRes = resTypes[Math.floor(Math.random() * resTypes.length)];

                if (foundRes === 'frag_alien') {
                    if(typeof addToInventory === 'function') addToInventory('frag_alien');
                    else console.error("addToInventory n'est pas une fonction");
                    mainLogMsg = tileLogMsg = "Vous avez trouvé un Fragment Alien !";
                } else {
                    gameState.resources[foundRes] = (gameState.resources[foundRes] || 0) + amount;
                    mainLogMsg = tileLogMsg = `Fouille fructueuse : +${amount} ${foundRes}.`;
                    if (typeof uiUpdates !== 'undefined') uiUpdates.updateResourceDisplay();
                }
                return { forMainLog: mainLogMsg, forTileLog: tileLogMsg, logType: "success" };
            }

            mainLogMsg = tileLogMsg = "Vos recherches ne donnent rien pour le moment.";
            return { forMainLog: mainLogMsg, forTileLog: tileLogMsg };
        }
    },
    'collect_revealed_resource': {
        id: 'collect_revealed_resource', // Cet ID est utilisé pour trouver la définition, l'ID unique de l'action sera généré
        name: "Collecter {resourceName}", // Remplacé par le type de ressource
        description: "Récupérer la ressource localisée par le scan.",
        icon: "ti-hand-grab",
        isDynamic: true, // Cette action est ajoutée dynamiquement à la liste des options
        action: function(tile, gameState, featureData) {
            if (!featureData || featureData.type !== 'small_resource_cache') return {forMainLog:"Aucune ressource spécifiée à collecter.", forTileLog:"Erreur collecte."};

            const resKey = featureData.resourceType || 'biomass';
            const amount = featureData.amount || 10;
            gameState.resources[resKey] = (gameState.resources[resKey] || 0) + amount;

            tile.revealedFeatures = tile.revealedFeatures.filter(f => f !== featureData); // La feature est "consommée"
            if (typeof uiUpdates !== 'undefined') uiUpdates.updateResourceDisplay();
            if (typeof questController !== 'undefined') questController.checkQuestProgress({ type: "collect_resource", resource: resKey, amount: amount });


            const msg = `Collecté ${amount} ${resKey} de la cache.`;
            return { forMainLog: msg, forTileLog: msg, logType: "success", refreshActions: true };
        }
    },
    'decipher_data_fragment': {
        id: 'decipher_data_fragment',
        name: "Déchiffrer Fragment Données",
        description: "Tenter de décoder les informations du fragment ancien. Nécessite un laboratoire.",
        icon: "ti-file-code",
        isDynamic: true,
        cost: { energy: 10 },
        condition: (gs) => gs.buildings.researchLab >= 1, // Condition pour que l'option apparaisse
        action: function(tile, gameState, featureData) {
            if (!(gameState.buildings.researchLab >= 1)) return {forMainLog:"Laboratoire de recherche requis.", forTileLog:"Laboratoire insuffisant."};
            if (!featureData || featureData.type !== 'ancient_data_fragment') return {forMainLog:"Aucun fragment à déchiffrer.", forTileLog:"Erreur déchiffrage."};

            const lorePossible = ['origin_signal_01', 'ruin_inscription_verdant']; // Liste d'ID de lore possibles
            const loreIdToUnlock = featureData.loreId || lorePossible[Math.floor(Math.random() * lorePossible.length)];

            if (typeof unlockLoreEntry === 'function' && typeof loreData !== 'undefined' && loreData[loreIdToUnlock]) {
                unlockLoreEntry(loreIdToUnlock);
                tile.revealedFeatures = tile.revealedFeatures.filter(f => f !== featureData);
                const msg = `Données déchiffrées : "${loreData[loreIdToUnlock].title}". Nouvelle entrée de Lore.`;
                return { forMainLog: msg, forTileLog: msg, logType: "success", refreshActions: true };
            }
            return { forMainLog: "Le fragment reste indéchiffrable pour l'instant.", forTileLog: "Déchiffrage échoué." };
        }
    },
     'disarm_trap_active': {
        id: 'disarm_trap_active',
        name: "Désamorcer Piège",
        description: "Tenter de neutraliser le piège détecté. Risqué.",
        icon: "ti-bomb-off",
        isDynamic: true, // Apparaît si tile.hasActiveTrap est true ET tile.revealedFeatures contient un piège
        cost: { mobility: 0.5, energy: 3 },
        action: function(tile, gameState, featureData) { // featureData serait le piège de revealedFeatures
            if (!tile.hasActiveTrap) return { forMainLog: "Aucun piège actif à désamorcer.", forTileLog: "Pas de piège."};

            // Ajout d'une chance de rater le désamorçage
            if (Math.random() < 0.75) { // 75% de chance de succès
                tile.hasActiveTrap = false;
                // Retirer le piège des revealedFeatures pour qu'il ne réapparaisse pas comme option
                if(featureData && featureData.type === 'hidden_trap'){
                    tile.revealedFeatures = tile.revealedFeatures.filter(f => f !== featureData);
                }
                const msg = "Piège désamorcé avec succès !";
                return { forMainLog: msg, forTileLog: msg, logType: "success", refreshActions: true };
            } else {
                // Échec du désamorçage, le piège se déclenche
                const damage = Math.floor(Math.random() * 12) + 8; // Dégâts plus importants si on rate le désamorçage
                gameState.nanobotStats.currentHealth -= damage;
                if (gameState.nanobotStats.currentHealth < 0) gameState.nanobotStats.currentHealth = 0;
                tile.hasActiveTrap = false; // Piège déclenché
                 if(featureData && featureData.type === 'hidden_trap'){
                    tile.revealedFeatures = tile.revealedFeatures.filter(f => f !== featureData);
                }
                if (typeof uiUpdates !== 'undefined') uiUpdates.updateNanobotDisplay();
                const msg = `Échec du désamorçage ! Le piège se déclenche (-${damage} PV).`;
                return { forMainLog: msg, forTileLog: msg, logType: "error", refreshActions: true };
            }
        }
    },
    // --- Actions pour le contenu principal de la tuile (déjà visibles avant scan/fouille) ---
    'collect_visible_resource_active': {
        id: 'collect_visible_resource_active',
        name: "Récolter {resourceName}",
        description: "Extraire la ressource identifiée sur cette case.",
        icon: "ti-basket",
        isDynamic: true,
        action: function(tile, gameState) {
            if (tile.content && tile.content.type === 'resource' && tile.content.amount > 0 && TILE_TYPES_TO_RESOURCE_KEY) {
                const resourceKey = TILE_TYPES_TO_RESOURCE_KEY[tile.content.resourceType];
                if (!resourceKey) return {forMainLog: "Type de ressource inconnu.", forTileLog: "Erreur ressource."};

                const amountCollected = tile.content.amount;
                gameState.resources[resourceKey] = (gameState.resources[resourceKey] || 0) + amountCollected;
                const msg = `Collecté ${amountCollected} ${resourceKey}.`;

                if (typeof questController !== 'undefined') questController.checkQuestProgress({ type: "collect_resource", resource: resourceKey, amount: amountCollected });

                tile.content = null; // La ressource est épuisée
                tile.actualType = tile.baseType === TILE_TYPES.PRE_WATER ? TILE_TYPES.EMPTY_WATER : TILE_TYPES.EMPTY_GRASSLAND;
                if (typeof uiUpdates !== 'undefined') uiUpdates.updateResourceDisplay();
                return { forMainLog: msg, forTileLog: msg, logType: "success", refreshActions: true };
            }
            return {forMainLog:"Impossible de récolter.", forTileLog:"Ressource non trouvée ou épuisée."};
        }
    },
    'engage_visible_enemy_active': { /* ... (Identique à celui fourni précédemment) ... */ },
    'interact_poi_active': { /* ... (Identique à celui fourni précédemment, s'assurer que refreshActions: true est retourné) ... */
        id: 'interact_poi_active',
        name: "Examiner {poiName}",
        description: "Interagir avec le point d'intérêt.",
        icon: "ti-zoom-question",
        isDynamic: true,
        action: function(tile, gameState) {
            if (tile.content && tile.content.type === 'poi' && !tile.content.isInteracted) {
                const poiName = (MAP_FEATURE_DATA[tile.content.poiType]?.name) || "Point d'intérêt";
                let interactionMessage = `Vous examinez ${poiName}.<br>`;
                let logType = "info";

                if (tile.content.poiType === TILE_TYPES.UPGRADE_CACHE) {
                    const loot = tile.content.lootTable || ['comp_av'];
                    loot.forEach(itemId => { if(typeof addToInventory === 'function' && itemsData[itemId]) addToInventory(itemId); else console.warn("addToInventory non défini ou item inconnu:", itemId)});
                    interactionMessage += `Vous trouvez : ${loot.map(id => itemsData[id]?.name || id).join(', ')}.`;
                    logType = "success";
                    // tile.content.isOpened = true; // Déjà géré par isInteracted
                } else if (tile.content.poiType === TILE_TYPES.POI_ANCIENT_STRUCTURE) {
                    interactionMessage += MAP_FEATURE_DATA[tile.content.poiType]?.description || "Une aura étrange émane de la structure.";
                    if(Math.random() < 0.5 && typeof unlockLoreEntry === 'function' && typeof loreData !== 'undefined') {
                        const loreKeys = Object.keys(loreData);
                        if (loreKeys.length > 0) {
                            const randomLoreId = loreKeys[Math.floor(Math.random() * loreKeys.length)];
                            unlockLoreEntry(randomLoreId);
                            interactionMessage += `<br>Une inscription ancienne révèle un fragment d'histoire : "${loreData[randomLoreId].title}".`;
                            logType = "success";
                        }
                    }
                } else {
                     interactionMessage += "Rien de particulier à noter après un examen plus approfondi.";
                }

                tile.content.isInteracted = true;
                if (typeof questController !== 'undefined') {
                    questController.checkQuestProgress({ type: "interact_poi_type", poiType: tile.content.poiType, count: 1, x:tile.x, y:tile.y });
                }
                return { forMainLog: interactionMessage, forTileLog: interactionMessage, logType: logType, refreshActions: true };
            } else if (tile.content && tile.content.type === 'poi' && tile.content.isInteracted) {
                return { forMainLog: "Vous avez déjà examiné ce point d'intérêt.", forTileLog: "Déjà examiné."};
            }
            return { forMainLog: "Aucun point d'intérêt notable ici.", forTileLog: "Rien à examiner."};
        }
     },
    'attack_enemy_base_active': { /* ... (Identique à celui fourni précédemment) ... */ },
};

var activeTileViewData = {
    [TILE_TYPES.EMPTY_GRASSLAND]: {
        image: "images/tile_view/grassland_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'biomass', amount: 15, chance: 0.2 },
            { type: 'ancient_data_fragment', name: "Relais de données endommagé", loreId: 'origin_signal_01', chance: 0.1 },
        ]
    },
    [TILE_TYPES.FOREST]: {
        image: "images/tile_view/forest_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'biomass', amount: 25, chance: 0.25 },
            { type: 'hidden_trap', name: "Piège à fosse", chance: 0.1 },
            { type: 'small_resource_cache', resourceType: 'frag_alien', amount: 1, chance: 0.05 }
        ]
    },
    [TILE_TYPES.RUINS]: {
        image: "images/tile_view/ruins_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
            { type: 'ancient_data_fragment', name: "Console ancienne", loreId: 'ruin_inscription_verdant', chance: 0.2 },
            { type: 'small_resource_cache', resourceType: 'nanites', amount: 20, chance: 0.15 },
            { type: 'hidden_trap', name: "Effondrement instable", chance: 0.12 },
        ]
    },
    [TILE_TYPES.EMPTY_DESERT]: {
        image: "images/tile_view/desert_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
         possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'nanites', amount: 10, chance: 0.15 },
            { type: 'ancient_data_fragment', name: "Appareil ensablé", chance: 0.08 },
        ]
    },
    [TILE_TYPES.MOUNTAIN]: {
        image: "images/tile_view/mountain_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
         possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'crystal_shards', amount: 5, chance: 0.18 },
             { type: 'hidden_trap', name: "Chute de pierres", chance: 0.07 },
        ]
    },
     // Nouveaux types de terrain
    [TILE_TYPES.DEBRIS_FIELD]: {
        image: "images/tile_view/debris_detail.png", // Créez cette image
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'comp_av', amount: 1, chance: 0.15 },
            { type: 'small_resource_cache', resourceType: 'nanites', amount: 25, chance: 0.1 },
            { type: 'hidden_trap', name: "Structure instable", chance: 0.1 },
        ]
    },
    [TILE_TYPES.THICK_VINES]: {
        image: "images/tile_view/vines_detail.png", // Créez cette image
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'biomass', amount: 30, chance: 0.2 },
            { type: 'ancient_data_fragment', name: "Graine luminescente", chance: 0.05 },
        ]
    },
    'default': { // Pour les types non explicitement listés (comme EMPTY_WATER pour l'instant)
        image: "images/tile_view/default_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
             { type: 'small_resource_cache', resourceType: 'biomass', amount: 10, chance: 0.1 },
        ]
    }
};

console.log("config_tile_exploration.js - Données d'exploration active de tuile définies.");

// Petite vérification
if (typeof tileActiveExplorationOptions === 'undefined' || typeof activeTileViewData === 'undefined') {
    console.error("config_tile_exploration.js - ERREUR: tileActiveExplorationOptions ou activeTileViewData n'est pas défini !");
}