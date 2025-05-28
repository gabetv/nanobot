// js/config_tile_exploration.js
console.log("config_tile_exploration.js - Fichier chargé et en cours d'analyse...");

// Fonction utilitaire (peut être dans utils.js et rendue globale)
if (typeof getRandomElement !== 'function') {
    window.getRandomElement = function(array) {
        if (!array || array.length === 0) return undefined;
        return array[Math.floor(Math.random() * array.length)];
    }
}
if (typeof getRandomInt !== 'function') {
    window.getRandomInt = function(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}


var tileActiveExplorationOptions = {
    'scan_local_active': {
        id: 'scan_local_active',
        name: "Scanner (Détaillé)",
        description: "Analyse approfondie de la case actuelle. Révèle des éléments cachés ou des dangers imminents.",
        icon: "ti-radar-2",
        cost: { energy: 5 },
        canRepeat: false,
        action: function(tile, currentGameState) { 
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
        cost: { mobility: 0.2 }, 
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
            if (Math.random() < (0.5 / tile.searchAttempts)) {
                const amount = Math.floor(Math.random() * 10) + 5;
                const resTypes = ['biomass', 'nanites', (window.itemsData && window.itemsData['frag_alien'] ? 'frag_alien' : 'biomass')];
                const foundRes = getRandomElement(resTypes);
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
                window.unlockLoreEntry(loreIdToUnlock); 
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
            if (Math.random() < 0.75) { 
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
        action: async function(tile, currentGameState) { 
            if (tile.content && tile.content.type === 'enemy_patrol' && tile.content.details) {
                const enemyDetails = tile.content.details;
                if(typeof addLogEntry === 'function') addLogEntry(`Engagement contre ${enemyDetails.name}...`, "combat", window.eventLogEl, currentGameState.eventLog);
                
                const combatResult = await window.simulateCombat(enemyDetails); 
                
                if (combatResult && combatResult.outcome === "victory") {
                    if(typeof addLogEntry === 'function') addLogEntry(`${enemyDetails.name} vaincu !`, "success", window.eventLogEl, currentGameState.eventLog);
                    tile.content = null; 
                    tile.actualType = tile.baseType === (window.TILE_TYPES?.PRE_WATER) ? (window.TILE_TYPES?.EMPTY_WATER) : (window.TILE_TYPES?.EMPTY_GRASSLAND || "empty_grassland");
                    if (typeof window.questController !== 'undefined' && enemyDetails.id) {
                        window.questController.checkQuestProgress({ type: "defeat_enemy_type", enemyId: enemyDetails.id, count: 1 });
                    }
                    return { forMainLog: `${enemyDetails.name} vaincu.`, forTileLog: "Zone sécurisée.", logType: "success", refreshActions: true };
                } else if (combatResult && combatResult.outcome === "defeat") {
                    if(typeof addLogEntry === 'function') addLogEntry(`Nexus-7 vaincu par ${enemyDetails.name}. Repli nécessaire.`, "error", window.eventLogEl, currentGameState.eventLog);
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
            if (tile.content && tile.content.type === 'poi' && 
                (!tile.content.isInteracted || (tile.content.poiType === window.TILE_TYPES.POI_ANCIENT_STRUCTURE && !tile.content.isFullyExploited) ) && // Permettre ré-interaction si POI complexe pas fini
                window.MAP_FEATURE_DATA) {
                
                const poiConfig = window.MAP_FEATURE_DATA[tile.content.poiType];
                const poiName = poiConfig?.name || "Point d'intérêt";
                let interactionMessage = `Vous examinez ${poiName}.<br>`;
                let logType = "info";

                if (tile.content.poiType === (window.TILE_TYPES?.UPGRADE_CACHE) && window.itemsData) {
                    const loot = tile.content.lootTable || ['repair_kit_basic']; 
                    loot.forEach(itemId => { if(typeof window.addToInventory === 'function' && window.itemsData[itemId]) window.addToInventory(itemId); else console.warn("addToInventory non défini ou item inconnu:", itemId)});
                    interactionMessage += `Vous trouvez : ${loot.map(id => window.itemsData[id]?.name || id).join(', ')}.`;
                    logType = "success";
                    tile.content.isInteracted = true; 
                    tile.content.isFullyExploited = true; 
                } else if (tile.content.poiType === (window.TILE_TYPES?.POI_ANCIENT_STRUCTURE)) {
                    interactionMessage += poiConfig?.description || "Une aura étrange émane de la structure.";
                    // Première interaction, ne fait que décrire et préparer pour les étapes suivantes
                    if (!tile.content.interactionStep) {
                        tile.content.interactionStep = 1; 
                        interactionMessage += "<br>Une interface semble s'activer...";
                        logType = "system";
                    } else {
                        interactionMessage += "<br>La structure semble attendre une autre action."
                    }
                    // isInteracted n'est mis à true que lorsque le POI est "isFullyExploited" pour ce type
                } else {
                     interactionMessage += poiConfig?.description || "Rien de particulier à noter après un examen plus approfondi.";
                     tile.content.isInteracted = true;
                     tile.content.isFullyExploited = true;
                }
                
                if (typeof window.questController !== 'undefined' && tile.content.isFullyExploited) { 
                    window.questController.checkQuestProgress({ type: "interact_poi_type", poiType: tile.content.poiType, count: 1, x:tile.x, y:tile.y });
                }
                return { forMainLog: interactionMessage, forTileLog: interactionMessage, logType: logType, refreshActions: true };
            } else if (tile.content && tile.content.type === 'poi' && tile.content.isFullyExploited) {
                return { forMainLog: "Vous avez déjà examiné et exploité ce point d'intérêt.", forTileLog: "Déjà exploité."};
            }
            return { forMainLog: "Aucun point d'intérêt notable ici.", forTileLog: "Rien à examiner."};
        }
     },
    'ancient_structure_analyze_energy': {
        id: 'ancient_structure_analyze_energy', name: "Analyser Signature Énergétique",
        description: "Utiliser les senseurs pour comprendre les flux d'énergie de la structure. Nécessite un Laboratoire (Niv.1).",
        icon: "ti ti-atom-2",
        cost: { energy: 15 },
        condition: (gs, tile) => tile.content?.poiType === window.TILE_TYPES.POI_ANCIENT_STRUCTURE && tile.content?.interactionStep === 1 && (gs.buildings?.researchLab || 0) >= 1,
        action: function(tile, currentGameState) {
            tile.content.interactionStep = 2;
            let msg = "L'analyse révèle un mécanisme de verrouillage complexe. Il semble nécessiter un catalyseur cristallin pour être activé.";
            if(typeof window.unlockLoreEntry === 'function' && window.loreData?.codex_entries) {
                const loreId = "ancient_structure_protocol"; 
                const loreEntry = window.loreData.codex_entries.find(e => e.id === loreId);
                if (loreEntry && typeof window.unlockLoreEntry === 'function') {
                    window.unlockLoreEntry(loreId); // Assurez-vous que unlockLoreEntry est défini globalement
                    msg += `<br>Nouvelle entrée de Lore: "${loreEntry.title}"`;
                }
            }
            return { forMainLog: msg, forTileLog: msg, logType: "system", refreshActions: true };
        }
    },
    'ancient_structure_insert_crystal': {
        id: 'ancient_structure_insert_crystal', name: "Insérer Éclat de Cristal",
        description: "Tenter d'activer la structure en utilisant un Éclat de Cristal Brut.",
        icon: "ti ti-diamond",
        cost: { items: { "crystal_shard_raw": 1 } }, 
        condition: (gs, tile) => tile.content?.poiType === window.TILE_TYPES.POI_ANCIENT_STRUCTURE && tile.content?.interactionStep === 2,
        action: function(tile, currentGameState) {
            tile.content.interactionStep = 3; 
            tile.content.isInteracted = true; 
            tile.content.isFullyExploited = true;

            const rewards = ["blueprint_shield_module_mk1", "alloy_plates", "nanite_cluster_small"];
            const foundItem = getRandomElement(rewards);
            if (typeof window.addToInventory === 'function' && window.itemsData && window.itemsData[foundItem]) {
                window.addToInventory(foundItem);
                 if (typeof window.questController !== 'undefined') { 
                    window.questController.checkQuestProgress({ type: "interact_poi_type", poiType: tile.content.poiType, count: 1, x:tile.x, y:tile.y });
                }
                const msg = `La structure s'anime brièvement et libère : ${window.itemsData[foundItem].name} !`;
                return { forMainLog: msg, forTileLog: msg, logType: "success", refreshActions: true };
            }
            return { forMainLog: "La structure réagit mais rien de tangible n'est produit.", forTileLog: "Activation partielle.", logType: "info", refreshActions: true };
        }
    },
    'attack_enemy_base_active': {
        id: 'attack_enemy_base_active', name: "Attaquer Base: {baseName}",
        description: "Lancer un assaut sur la base ennemie.", icon: "ti-home-bolt",
        isDynamic: true,
        action: async function(tile, currentGameState) {
            if (tile.content && tile.content.type === 'enemy_base' && tile.content.currentHealth > 0) {
                if (typeof window.explorationController !== 'undefined' && typeof window.explorationController.attemptAttackEnemyBase === 'function') {
                    await window.explorationController.attemptAttackEnemyBase(tile.x, tile.y);
                    return { refreshActions: true }; 
                } else {
                    return {forMainLog:"Fonction d'attaque de base non trouvée.", forTileLog:"Erreur système."};
                }
            }
            return {forMainLog:"Aucune base ennemie à attaquer ici.", forTileLog:"Pas de base hostile."};
        }
    },
};
window.tileActiveExplorationOptions = tileActiveExplorationOptions;

var activeTileViewData = { 
    [window.TILE_TYPES?.EMPTY_GRASSLAND || "empty_grassland"]: {
        image: "images/tile_view/grassland_detail.png",
        descriptions: [ 
            "De vastes plaines herbeuses s'étendent à perte de vue.",
            "Une brise légère fait onduler les hautes herbes. L'horizon semble dégagé.",
            "Quelques formations rocheuses parsèment cette étendue verdoyante.",
            "Le sol est ferme sous les senseurs du Nexus-7, idéal pour la manœuvre."
        ],
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'biomass', amount: 15, chance: 0.2 },
            { type: 'ancient_data_fragment', name: "Relais de données endommagé", loreId: 'origin_signal_01', chance: 0.1 },
        ]
    },
    [window.TILE_TYPES?.FOREST || "forest"]: { 
        image: "images/tile_view/forest_detail.png",
        descriptions: [
            "La canopée dense bloque une grande partie de la lumière. Des bruits étranges proviennent des fourrés.",
            "Des arbres aux formes bizarres s'élèvent, leurs racines s'enfonçant profondément dans le sol riche.",
            "L'air est lourd et humide. La progression est ralentie par une végétation exubérante.",
            "Des traces de créatures inconnues sillonnent le sol forestier."
        ],
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'biomass', amount: 25, chance: 0.25 },
            { type: 'hidden_trap', name: "Piège à fosse végétale", chance: 0.12 },
            { type: 'small_resource_cache', resourceType: 'frag_alien', amount: 1, chance: 0.05 } 
        ]
    },
     [window.TILE_TYPES?.FOREST_LIGHT || "forest_light"]: { 
        image: "images/tile_view/forest_light_detail.png", 
        descriptions: [
            "Une forêt clairsemée où la lumière du soleil atteint le sol par intermittence.",
            "Des bosquets d'arbres alternent avec des clairières herbeuses.",
            "Le chant d'oiseaux inconnus se fait entendre, mais une certaine vigilance reste de mise."
        ],
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [ 
             { type: 'small_resource_cache', resourceType: 'biomass', amount: 20, chance: 0.22 },
             { type: 'hidden_trap', name: "Filet suspendu", chance: 0.08 },
        ]
    },
    [window.TILE_TYPES?.RUINS || "ruins"]: {
        image: "images/tile_view/ruins_detail.png",
        descriptions: [
            "Des structures érodées par le temps témoignent d'une civilisation disparue.",
            "Des fragments de technologie inconnue jonchent le sol, recouverts de poussière.",
            "Un silence de mort règne sur ces vestiges, comme si le temps s'y était arrêté."
        ],
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [ 
            { type: 'ancient_data_fragment', name: "Console de données brisée", loreId: 'ruins_log_01', chance: 0.15 },
            { type: 'small_resource_cache', resourceType: 'nanites', amount: 12, chance: 0.18 },
            { type: 'hidden_trap', name: "Plaque de pression instable", chance: 0.1 },
        ]
    },
    [window.TILE_TYPES?.POI_ANCIENT_STRUCTURE || "poi_ancient_structure"]: { 
        image: "images/tile_view/ruins_ancient_detail.png", 
        descriptions: [
            "Une structure monolithique d'origine inconnue se dresse devant vous, émettant une faible pulsation énergétique.",
            "Des gravures complexes recouvrent la surface de cet édifice antique. Leur signification reste un mystère.",
            "Malgré les âges, cette construction extraterrestre semble remarquablement préservée."
        ],
        baseActions: ['scan_local_active'], 
    },
    [window.TILE_TYPES?.EMPTY_DESERT || "empty_desert"]: {
        image: "images/tile_view/desert_detail.png",
         descriptions: [
            "Le sable brûlant s'étend à l'infini, sous un soleil de plomb.",
            "Des dunes sculptées par le vent créent un paysage désolé et mouvant.",
            "La chaleur est accablante. Peu de signes de vie sont visibles."
        ],
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'crystal_shard_raw', amount: 5, chance: 0.15 },
            { type: 'ancient_data_fragment', name: "Balise météo ensablée", loreId: 'desert_climate_data', chance: 0.08 },
        ]
    },
    [window.TILE_TYPES?.MOUNTAIN || "mountain"]: {
        image: "images/tile_view/mountain_detail.png",
        descriptions: [
            "Des pics rocheux se dressent vers le ciel, rendant la progression difficile.",
            "Des éboulis instables menacent de dévaler les pentes abruptes.",
            "Le vent siffle à travers les cols étroits, portant des échos lointains."
        ],
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
            { type: 'small_resource_cache', resourceType: 'crystal_shard_raw', amount: 8, chance: 0.2 },
            { type: 'hidden_trap', name: "Chute de pierres", chance: 0.1 },
        ]
    },
    [window.TILE_TYPES?.DEBRIS_FIELD || "debris_field"]: {
        image: "images/tile_view/debris_detail.png",
        descriptions: [
            "Un enchevêtrement de métal tordu et de composants électroniques brisés recouvre la zone.",
            "Les restes d'un ancien crash ou d'une bataille spatiale jonchent le sol.",
            "La navigation est périlleuse au milieu de ces débris acérés."
        ],
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
             { type: 'small_resource_cache', resourceType: 'alloy_plates', amount: 3, chance: 0.15 },
             { type: 'small_resource_cache', resourceType: 'nanites', amount: 10, chance: 0.1 },
        ]
    },
    [window.TILE_TYPES?.THICK_VINES || "thick_vines"]: {
        image: "images/tile_view/vines_detail.png",
        descriptions: [
            "Des lianes épaisses comme des câbles forment un mur végétal quasi impénétrable.",
            "Une odeur âcre et organique flotte dans l'air.",
            "Des mouvements suspects se font sentir au cœur de cette jungle de vignes."
        ],
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [
             { type: 'small_resource_cache', resourceType: 'biomass', amount: 30, chance: 0.25 },
             { type: 'hidden_trap', name: "Lianes constrictrices", chance: 0.15 },
        ]
    },
    'default': {
        image: "images/tile_view/default_detail.png",
        descriptions: [ "Zone d'apparence ordinaire, mais l'exploration pourrait révéler des surprises." ],
        baseActions: ['scan_local_active', 'search_area_active'],
        possibleHiddenFeatures: [ { type: 'small_resource_cache', resourceType: 'biomass', amount: 10, chance: 0.1 }, ]
    }
};
window.activeTileViewData = activeTileViewData;

console.log("config_tile_exploration.js - Données d'exploration active de tuile définies.");

if (typeof tileActiveExplorationOptions === 'undefined' || typeof activeTileViewData === 'undefined') {
    console.error("config_tile_exploration.js - ERREUR: tileActiveExplorationOptions ou activeTileViewData n'est pas défini globalement !");
}