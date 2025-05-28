// js/config_tile_exploration.js
console.log("config_tile_exploration.js - Fichier chargé et en cours d'analyse...");

// Assurez-vous que TILE_TYPES, gameState (pour les actions), addToInventory, unlockLoreEntry, etc.
// sont accessibles. L'accès via window. est plus sûr pour les configs globales.

var tileActiveExplorationOptions = {
    'scan_local_active': {
        id: 'scan_local_active',
        name: "Scanner (Détaillé)",
        description: "Analyse approfondie de la case actuelle. Révèle des éléments cachés ou des dangers imminents.",
        icon: "ti-radar-2",
        cost: { energy: 5 },
        canRepeat: false,
        action: function(tile, currentGameState) { // Renommé gameState en currentGameState pour éviter confusion avec window.gameState
            let findingsText = "";
            let tileLogUpdates = [];

            if (tile.usedActions && tile.usedActions['scan_local_active']) {
                 return { forMainLog: "Scan local déjà effectué sur cette case.", forTileLog: "Scan déjà effectué." };
            }

            let newDiscoveries = false;
            if (tile.hiddenFeatures && tile.hiddenFeatures.length > 0) {
                tile.revealedFeatures = tile.revealedFeatures || [];
                tile.hiddenFeatures.forEach(feature => {
                    tile.revealedFeatures.push(feature);
                    newDiscoveries = true;
                    let discoveryMsg = "";
                    switch(feature.type) {
                        case 'small_resource_cache': discoveryMsg = `Cache de ${feature.resourceType || 'ressources'} localisée !`; break;
                        case 'ancient_data_fragment': discoveryMsg = `Signal de données étrange détecté ! (${feature.name || 'Fragment'})`; break;
                        case 'hidden_trap': discoveryMsg = `DANGER: Signature de piège (${feature.name || 'inconnu'}) détectée !`; tile.hasActiveTrap = true; break;
                        default: discoveryMsg = `Signal énigmatique trouvé : ${feature.name || feature.type}.`;
                    }
                    tileLogUpdates.push(discoveryMsg);
                });
                tile.hiddenFeatures = [];
                findingsText = "Scan réussi : " + (newDiscoveries ? "Plusieurs éléments localisés. De nouvelles options sont disponibles." : "Aucun élément dissimulé majeur détecté.");
            } else {
                findingsText = "Scan local terminé. Aucun élément notable dissimulé détecté.";
            }

            tile.usedActions = tile.usedActions || {};
            tile.usedActions['scan_local_active'] = true;
            return { forMainLog: findingsText, forTileLog: tileLogUpdates.length > 0 ? tileLogUpdates.join("<br>") : findingsText, newActionsAvailable: newDiscoveries, refreshActions: true };
        }
    },
    'search_area_active': {
        id: 'search_area_active',
        name: "Fouiller la Zone",
        description: "Recherche manuelle de ressources ou d'indices. Peut être risqué.",
        icon: "ti-search",
        cost: { mobility: 0.2 }, // Utiliser les constantes de coût globales si définies
        canRepeat: true,
        maxRepeats: 3,
        action: function(tile, currentGameState) {
            tile.searchAttempts = (tile.searchAttempts || 0) + 1;
            let mainLogMsg = ""; let tileLogMsg = "";

            if (tile.searchAttempts > (this.maxRepeats || 3)) {
                return { forMainLog: "Zone déjà fouillée intensivement.", forTileLog: "Plus rien à trouver ici." };
            }

            if (tile.hasActiveTrap && Math.random() < 0.4) {
                const damage = Math.floor(Math.random() * 8) + 5;
                currentGameState.nanobotStats.currentHealth -= damage;
                if (currentGameState.nanobotStats.currentHealth < 0) currentGameState.nanobotStats.currentHealth = 0;
                tile.hasActiveTrap = false;
                mainLogMsg = `Piège déclenché en fouillant ! (-${damage} PV)`;
                tileLogMsg = `ALERTE : Piège déclenché ! Le Nexus-7 subit ${damage} dégâts. Danger écarté.`;
                if (typeof window.uiUpdates !== 'undefined') window.uiUpdates.updateNanobotDisplay();
                return { forMainLog: mainLogMsg, forTileLog: tileLogMsg, logType: "error", refreshActions: true };
            }

            // Chance de trouver quelque chose, décroissante. Ajuster les chances et les butins.
            if (Math.random() < (0.5 / tile.searchAttempts)) {
                const amount = Math.floor(Math.random() * 10) + 5;
                // S'assurer que itemsData est disponible pour 'frag_alien'
                const resTypes = ['biomass', 'nanites', (window.itemsData && window.itemsData['frag_alien'] ? 'frag_alien' : 'biomass')];
                const foundRes = resTypes[Math.floor(Math.random() * resTypes.length)];

                if (foundRes === 'frag_alien' && window.itemsData && window.itemsData['frag_alien']) {
                    if(typeof window.addToInventory === 'function') window.addToInventory('frag_alien');
                    else console.error("addToInventory n'est pas une fonction");
                    mainLogMsg = tileLogMsg = "Vous avez trouvé un Fragment Alien !";
                } else {
                    currentGameState.resources[foundRes] = (currentGameState.resources[foundRes] || 0) + amount;
                    mainLogMsg = tileLogMsg = `Fouille fructueuse : +${amount} ${foundRes}.`;
                    if (typeof window.uiUpdates !== 'undefined') window.uiUpdates.updateResourceDisplay();
                }
                return { forMainLog: mainLogMsg, forTileLog: tileLogMsg, logType: "success" };
            }
            mainLogMsg = tileLogMsg = "Vos recherches ne donnent rien pour le moment.";
            return { forMainLog: mainLogMsg, forTileLog: tileLogMsg };
        }
    },
    'collect_revealed_resource': {
        id: 'collect_revealed_resource', name: "Collecter {resourceName}",
        description: "Récupérer la ressource localisée.", icon: "ti-hand-grab",
        isDynamic: true,
        action: function(tile, currentGameState, featureData) {
            if (!featureData || featureData.type !== 'small_resource_cache') return {forMainLog:"Aucune ressource spécifiée.", forTileLog:"Erreur collecte."};
            const resKey = featureData.resourceType || 'biomass';
            const amount = featureData.amount || 10;
            currentGameState.resources[resKey] = (currentGameState.resources[resKey] || 0) + amount;
            tile.revealedFeatures = tile.revealedFeatures.filter(f => f !== featureData);
            if (typeof window.uiUpdates !== 'undefined') window.uiUpdates.updateResourceDisplay();
            if (typeof window.questController !== 'undefined') window.questController.checkQuestProgress({ type: "collect_resource", resource: resKey, amount: amount });
            const msg = `Collecté ${amount} ${resKey} de la cache.`;
            return { forMainLog: msg, forTileLog: msg, logType: "success", refreshActions: true };
        }
    },
    'decipher_data_fragment': {
        id: 'decipher_data_fragment', name: "Déchiffrer Fragment Données",
        description: "Tenter de décoder les informations. Nécessite un laboratoire.", icon: "ti-file-code",
        isDynamic: true, cost: { energy: 10 },
        condition: (gs) => gs.buildings.researchLab >= 1,
        action: function(tile, currentGameState, featureData) {
            if (!(currentGameState.buildings.researchLab >= 1)) return {forMainLog:"Laboratoire de recherche requis.", forTileLog:"Laboratoire insuffisant."};
            if (!featureData || featureData.type !== 'ancient_data_fragment') return {forMainLog:"Aucun fragment à déchiffrer.", forTileLog:"Erreur déchiffrage."};
            
            const loreIdToUnlock = featureData.loreId || getRandomElement(Object.keys(window.loreData?.codex_entries || {})) || 'unknown_lore';

            if (typeof window.unlockLoreEntry === 'function' && window.loreData && window.loreData.codex_entries && window.loreData.codex_entries.find(e => e.id === loreIdToUnlock) ) {
                window.unlockLoreEntry(loreIdToUnlock); // unlockLoreEntry est global
                tile.revealedFeatures = tile.revealedFeatures.filter(f => f !== featureData);
                const loreEntry = window.loreData.codex_entries.find(e => e.id === loreIdToUnlock);
                const msg = `Données déchiffrées : "${loreEntry.title}". Nouvelle entrée de Lore.`;
                return { forMainLog: msg, forTileLog: msg, logType: "success", refreshActions: true };
            }
            return { forMainLog: "Le fragment reste indéchiffrable pour l'instant.", forTileLog: "Déchiffrage échoué." };
        }
    },
     'disarm_trap_active': {
        id: 'disarm_trap_active', name: "Désamorcer Piège",
        description: "Tenter de neutraliser le piège détecté. Risqué.", icon: "ti-bomb-off",
        isDynamic: true, cost: { mobility: 0.5, energy: 3 },
        action: function(tile, currentGameState, featureData) {
            if (!tile.hasActiveTrap) return { forMainLog: "Aucun piège actif.", forTileLog: "Pas de piège."};
            if (Math.random() < 0.75) { // 75% succès
                tile.hasActiveTrap = false;
                if(featureData && featureData.type === 'hidden_trap'){ tile.revealedFeatures = tile.revealedFeatures.filter(f => f !== featureData); }
                return { forMainLog: "Piège désamorcé avec succès !", forTileLog: "Piège neutralisé.", logType: "success", refreshActions: true };
            } else {
                const damage = Math.floor(Math.random() * 12) + 8;
                currentGameState.nanobotStats.currentHealth -= damage;
                if (currentGameState.nanobotStats.currentHealth < 0) currentGameState.nanobotStats.currentHealth = 0;
                tile.hasActiveTrap = false;
                if(featureData && featureData.type === 'hidden_trap'){ tile.revealedFeatures = tile.revealedFeatures.filter(f => f !== featureData); }
                if (typeof window.uiUpdates !== 'undefined') window.uiUpdates.updateNanobotDisplay();
                const msg = `Échec du désamorçage ! Piège déclenché (-${damage} PV).`;
                return { forMainLog: msg, forTileLog: msg, logType: "error", refreshActions: true };
            }
        }
    },
    'collect_visible_resource_active': {
        id: 'collect_visible_resource_active', name: "Récolter {resourceName}",
        description: "Extraire la ressource identifiée sur cette case.", icon: "ti-basket",
        isDynamic: true,
        action: function(tile, currentGameState) {
            if (tile.content && tile.content.type === 'resource' && tile.content.amount > 0 && window.TILE_TYPES_TO_RESOURCE_KEY) {
                const resourceKey = window.TILE_TYPES_TO_RESOURCE_KEY[tile.content.resourceType];
                if (!resourceKey) return {forMainLog: "Type de ressource inconnu pour récolte.", forTileLog: "Erreur ressource."};
                const amountCollected = tile.content.amount;
                currentGameState.resources[resourceKey] = (currentGameState.resources[resourceKey] || 0) + amountCollected;
                const msg = `Collecté ${amountCollected} ${resourceKey}.`;
                if (typeof window.questController !== 'undefined') window.questController.checkQuestProgress({ type: "collect_resource", resource: resourceKey, amount: amountCollected });
                tile.content = null;
                // Revenir au type de base de la tuile (ex: grassland si c'était un patch de biomasse)
                // TILE_TYPES.PRE_WATER n'est pas un type "actual". Il faut mapper vers le bon type vide.
                tile.actualType = tile.baseType === (window.TILE_TYPES?.PRE_WATER) ? (window.TILE_TYPES?.EMPTY_WATER) : (window.TILE_TYPES?.EMPTY_GRASSLAND || "empty_grassland");
                if (typeof window.uiUpdates !== 'undefined') window.uiUpdates.updateResourceDisplay();
                return { forMainLog: msg, forTileLog: msg, logType: "success", refreshActions: true };
            }
            return {forMainLog:"Impossible de récolter.", forTileLog:"Ressource non trouvée ou épuisée."};
        }
    },
    'engage_visible_enemy_active': {
        id: 'engage_visible_enemy_active', name: "Engager {enemyName}",
        description: "Attaquer l'ennemi patrouillant dans cette zone.", icon: "ti-sword",
        isDynamic: true,
        action: async function(tile, currentGameState) { // async car simulateCombat est async
            if (tile.content && tile.content.type === 'enemy_patrol' && tile.content.details) {
                const enemyDetails = tile.content.details;
                if(typeof addLogEntry === 'function') addLogEntry(`Engagement contre ${enemyDetails.name}...`, "combat", window.eventLogEl, currentGameState.eventLog);
                
                const combatResult = await window.simulateCombat(enemyDetails); // simulateCombat est global
                
                if (combatResult && combatResult.outcome === "victory") {
                    if(typeof addLogEntry === 'function') addLogEntry(`${enemyDetails.name} vaincu !`, "success", window.eventLogEl, currentGameState.eventLog);
                    tile.content = null; // Ennemi retiré
                    tile.actualType = tile.baseType === (window.TILE_TYPES?.PRE_WATER) ? (window.TILE_TYPES?.EMPTY_WATER) : (window.TILE_TYPES?.EMPTY_GRASSLAND || "empty_grassland");
                    // Gérer le loot et l'XP est fait par simulateCombat/endCombat
                    if (typeof window.questController !== 'undefined' && enemyDetails.id) {
                        window.questController.checkQuestProgress({ type: "defeat_enemy_type", enemyId: enemyDetails.id, count: 1 });
                    }
                    return { forMainLog: `${enemyDetails.name} vaincu.`, forTileLog: "Zone sécurisée.", logType: "success", refreshActions: true };
                } else if (combatResult && combatResult.outcome === "defeat") {
                    if(typeof addLogEntry === 'function') addLogEntry(`Nexus-7 vaincu par ${enemyDetails.name}. Repli nécessaire.`, "error", window.eventLogEl, currentGameState.eventLog);
                    // Gérer les conséquences de la défaite (ex: retour base, perte de ressources)
                    return { forMainLog: `Défaite contre ${enemyDetails.name}.`, forTileLog: "Repli !", logType: "error", refreshActions: true };
                } else {
                     if(typeof addLogEntry === 'function') addLogEntry(`Le combat contre ${enemyDetails.name} s'est terminé de manière inattendue.`, "warning", window.eventLogEl, currentGameState.eventLog);
                    return { forMainLog: "Combat interrompu.", forTileLog: "Fin de combat inattendue.", logType: "warning", refreshActions: true };
                }
            }
            return {forMainLog:"Aucun ennemi à engager.", forTileLog:"Zone calme."};
        }
    },
    'interact_poi_active': {
        id: 'interact_poi_active', name: "Examiner {poiName}",
        description: "Interagir avec le point d'intérêt.", icon: "ti-zoom-question",
        isDynamic: true,
        action: function(tile, currentGameState) {
            if (tile.content && tile.content.type === 'poi' && !tile.content.isInteracted && window.MAP_FEATURE_DATA) {
                const poiName = (window.MAP_FEATURE_DATA[tile.content.poiType]?.name) || "Point d'intérêt";
                let interactionMessage = `Vous examinez ${poiName}.<br>`;
                let logType = "info";

                if (tile.content.poiType === (window.TILE_TYPES?.UPGRADE_CACHE) && window.itemsData) {
                    const loot = tile.content.lootTable || ['repair_kit_basic']; // Fallback loot
                    loot.forEach(itemId => { if(typeof window.addToInventory === 'function' && window.itemsData[itemId]) window.addToInventory(itemId); else console.warn("addToInventory non défini ou item inconnu:", itemId)});
                    interactionMessage += `Vous trouvez : ${loot.map(id => window.itemsData[id]?.name || id).join(', ')}.`;
                    logType = "success";
                } else if (tile.content.poiType === (window.TILE_TYPES?.POI_ANCIENT_STRUCTURE)) {
                    interactionMessage += window.MAP_FEATURE_DATA[tile.content.poiType]?.description || "Une aura étrange émane de la structure.";
                    if(Math.random() < 0.5 && typeof window.unlockLoreEntry === 'function' && window.loreData && window.loreData.codex_entries) {
                        const codexKeys = Object.keys(window.loreData.codex_entries);
                        if (codexKeys.length > 0) {
                            const randomCodexIndex = Math.floor(Math.random() * codexKeys.length);
                            const randomLoreId = window.loreData.codex_entries[randomCodexIndex].id;
                            window.unlockLoreEntry(randomLoreId);
                            interactionMessage += `<br>Une inscription ancienne révèle un fragment d'histoire : "${window.loreData.codex_entries[randomCodexIndex].title}".`;
                            logType = "success";
                        }
                    }
                } else {
                     interactionMessage += window.MAP_FEATURE_DATA[tile.content.poiType]?.description || "Rien de particulier à noter après un examen plus approfondi.";
                }

                tile.content.isInteracted = true;
                if (typeof window.questController !== 'undefined') {
                    window.questController.checkQuestProgress({ type: "interact_poi_type", poiType: tile.content.poiType, count: 1, x:tile.x, y:tile.y });
                }
                return { forMainLog: interactionMessage, forTileLog: interactionMessage, logType: logType, refreshActions: true };
            } else if (tile.content && tile.content.type === 'poi' && tile.content.isInteracted) {
                return { forMainLog: "Vous avez déjà examiné ce point d'intérêt.", forTileLog: "Déjà examiné."};
            }
            return { forMainLog: "Aucun point d'intérêt notable ici.", forTileLog: "Rien à examiner."};
        }
     },
    'attack_enemy_base_active': {
        id: 'attack_enemy_base_active', name: "Attaquer Base: {baseName}",
        description: "Lancer un assaut sur la base ennemie.", icon: "ti-home-bolt",
        isDynamic: true,
        action: async function(tile, currentGameState) {
            if (tile.content && tile.content.type === 'enemy_base' && tile.content.currentHealth > 0) {
                // La logique d'attaque est gérée par explorationController.attemptAttackEnemyBase
                // Ici, on ne fait que signaler que l'action a été invoquée.
                // explorationController.attemptAttackEnemyBase est déjà appelée depuis handleTileClickOnWorldMap
                // si la tuile est la position actuelle et que le contenu est une base.
                // Si on veut un bouton spécifique dans l'UI d'exploration active:
                if (typeof window.explorationController !== 'undefined' && typeof window.explorationController.attemptAttackEnemyBase === 'function') {
                    await window.explorationController.attemptAttackEnemyBase(tile.x, tile.y);
                    // Le résultat de l'action (logs, etc.) sera géré par attemptAttackEnemyBase lui-même.
                    // Il faut s'assurer que attemptAttackEnemyBase retourne quelque chose ou que l'UI est rafraîchie.
                    return { refreshActions: true }; // Indiquer de rafraîchir les actions de la tuile
                } else {
                    return {forMainLog:"Fonction d'attaque de base non trouvée.", forTileLog:"Erreur système."};
                }
            }
            return {forMainLog:"Aucune base ennemie à attaquer ici.", forTileLog:"Pas de base hostile."};
        }
    },
};
window.tileActiveExplorationOptions = tileActiveExplorationOptions;

var activeTileViewData = { // Utiliser window.TILE_TYPES pour les clés
    [window.TILE_TYPES?.EMPTY_GRASSLAND || "empty_grassland"]: {
        image: "images/tile_view/grassland_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'biomass', amount: 15, chance: 0.2 },
            { type: 'ancient_data_fragment', name: "Relais de données endommagé", loreId: 'origin_signal_01', chance: 0.1 },
        ]
    },
    [window.TILE_TYPES?.FOREST || "forest"]: { // Clé générique pour forêt si FOREST_LIGHT/DENSE ne sont pas explicitement définis
        image: "images/tile_view/forest_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'biomass', amount: 25, chance: 0.25 },
            { type: 'hidden_trap', name: "Piège à fosse", chance: 0.1 },
            { type: 'small_resource_cache', resourceType: 'frag_alien', amount: 1, chance: 0.05 } // Assurer que frag_alien existe dans itemsData
        ]
    },
     [window.TILE_TYPES?.FOREST_LIGHT || "forest_light"]: { // Spécifique
        image: "images/tile_view/forest_light_detail.png", // Image spécifique
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [ /* ... */ ]
    },
    [window.TILE_TYPES?.RUINS || "ruins"]: {
        image: "images/tile_view/ruins_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [ /* ... */ ]
    },
    [window.TILE_TYPES?.EMPTY_DESERT || "empty_desert"]: {
        image: "images/tile_view/desert_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [ /* ... */ ]
    },
    [window.TILE_TYPES?.MOUNTAIN || "mountain"]: {
        image: "images/tile_view/mountain_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [ /* ... */ ]
    },
    [window.TILE_TYPES?.DEBRIS_FIELD || "debris_field"]: {
        image: "images/tile_view/debris_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [ /* ... */ ]
    },
    [window.TILE_TYPES?.THICK_VINES || "thick_vines"]: {
        image: "images/tile_view/vines_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [ /* ... */ ]
    },
    'default': {
        image: "images/tile_view/default_detail.png",
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [ { type: 'small_resource_cache', resourceType: 'biomass', amount: 10, chance: 0.1 }, ]
    }
};
window.activeTileViewData = activeTileViewData;

console.log("config_tile_exploration.js - Données d'exploration active de tuile définies.");

if (typeof tileActiveExplorationOptions === 'undefined' || typeof activeTileViewData === 'undefined') {
    console.error("config_tile_exploration.js - ERREUR: tileActiveExplorationOptions ou activeTileViewData n'est pas défini globalement !");
}