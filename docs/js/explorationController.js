// js/explorationController.js
console.log("explorationController.js - Fichier chargé et en cours d'analyse...");

var explorationController = {

    // Gère le clic sur la CARTE DU MONDE
    handleTileClickOnWorldMap: function(x, y) {
        console.log(`explorationController: handleTileClickOnWorldMap sur (${x},${y})`);

        if (!gameState || !gameState.map || typeof ZONE_DATA === 'undefined' || typeof TILE_TYPES === 'undefined' ||
            typeof EXPLORATION_COST_MOBILITY === 'undefined' || typeof mapManager === 'undefined' || typeof explorationUI === 'undefined') {
            console.error("explorationController.handleTileClickOnWorldMap: Dépendances manquantes.");
            return;
        }

        const currentZone = ZONE_DATA[gameState.currentZoneId];
        if (!currentZone || x < 0 || x >= currentZone.mapSize.width || y < 0 || y >= currentZone.mapSize.height) {
            if(typeof addLogEntry === 'function') addLogEntry("Clic hors des limites de la carte.", "warning", explorationLogEl, gameState.explorationLog);
            return;
        }

        const targetTile = mapManager.getTile(x, y);
        if (!targetTile) {
            if(typeof addLogEntry === 'function') addLogEntry("Données de tuile invalides pour le clic.", "error", explorationLogEl, gameState.explorationLog);
            return;
        }

        gameState.map.selectedTile = { x, y }; // Pour le panneau d'interaction latéral s'il est toujours utilisé

        const isCurrentPos = (x === gameState.map.nanobotPos.x && y === gameState.map.nanobotPos.y);

        if (isCurrentPos) {
            // Si on clique sur la case actuelle du Nanobot sur la carte du monde,
            // on entre en mode d'exploration active pour cette case.
            if (typeof explorationUI.enterActiveTileExplorationMode === 'function') {
                addLogEntry(`Entrée en mode exploration active pour la case (${x},${y}).`, "map-event", explorationLogEl, gameState.explorationLog);
                explorationUI.enterActiveTileExplorationMode(x,y);
            } else {
                console.error("explorationUI.enterActiveTileExplorationMode non défini.");
            }
        } else {
            // Pour l'instant, cliquer sur une case adjacente ne fait rien directement sur la carte du monde.
            // Le déplacement se fait via l'UI d'exploration active.
            // On pourrait ajouter un message si le joueur clique trop loin.
            const dxPos = Math.abs(x - gameState.map.nanobotPos.x);
            const dyPos = Math.abs(y - gameState.map.nanobotPos.y);
            if (dxPos > 1 || dyPos > 1 || (dxPos === 0 && dyPos === 0) /*déjà géré*/ ) {
                 if(typeof addLogEntry === 'function') addLogEntry("Entrez en mode exploration (clic sur votre case) pour vous déplacer.", "info", explorationLogEl, gameState.explorationLog);
            } else {
                 if(typeof addLogEntry === 'function') addLogEntry(`Case (${x},${y}) sélectionnée. Entrez en mode exploration pour interagir ou vous y déplacer.`, "info", explorationLogEl, gameState.explorationLog);
            }
        }

        // Mettre à jour le panneau d'interaction latéral (si vous le conservez pour un aperçu rapide)
        if (typeof explorationUI.updateTileInteractionPanel === 'function') {
            explorationUI.updateTileInteractionPanel(x, y);
        }
        // La carte du monde elle-même est mise à jour par la gameloop ou explorationUI.updateFullExplorationView
    },

    // Gère un déplacement demandé depuis l'UI D'EXPLORATION ACTIVE
    attemptMoveInActiveExploration: function(direction) {
        console.log(`explorationController: attemptMoveInActiveExploration vers ${direction}`);
        if (!gameState || !gameState.map || !gameState.map.nanobotPos ||
            typeof EXPLORATION_COST_MOBILITY === 'undefined' || typeof mapManager === 'undefined' ||
            typeof explorationUI === 'undefined' || typeof nanobotModulesData === 'undefined') {
            console.error("attemptMoveInActiveExploration: Dépendances cruciales manquantes.");
            if (typeof explorationUI.addLogToActiveTileView === 'function') explorationUI.addLogToActiveTileView("Erreur système de déplacement.", "error");
            return;
        }

        const currentX = gameState.map.nanobotPos.x;
        const currentY = gameState.map.nanobotPos.y;
        let newX = currentX;
        let newY = currentY;

        switch (direction) {
            case 'north': newY--; break;
            case 'south': newY++; break;
            case 'west':  newX--; break;
            case 'east':  newX++; break;
            default:
                if (typeof explorationUI.addLogToActiveTileView === 'function') explorationUI.addLogToActiveTileView("Direction de déplacement invalide.", "error");
                return;
        }

        const currentZone = ZONE_DATA[gameState.currentZoneId];
        if (!currentZone || newX < 0 || newX >= currentZone.mapSize.width || newY < 0 || newY >= currentZone.mapSize.height) {
            if (typeof explorationUI.addLogToActiveTileView === 'function') explorationUI.addLogToActiveTileView("Déplacement hors des limites de la zone.", "warning");
            return;
        }

        const targetTile = mapManager.getTile(newX, newY);
        if (!targetTile) {
            if (typeof explorationUI.addLogToActiveTileView === 'function') explorationUI.addLogToActiveTileView("Case cible invalide.", "error");
            return;
        }

        // Vérification de la franchissabilité
        if (targetTile.actualType === TILE_TYPES.IMPASSABLE_DEEP_WATER || targetTile.actualType === TILE_TYPES.IMPASSABLE_HIGH_PEAK) {
            if (typeof explorationUI.addLogToActiveTileView === 'function') explorationUI.addLogToActiveTileView("Terrain infranchissable.", "warning");
            return;
        }

        // Vérification des modules requis pour obstacles spécifiques
        let canTraverseTile = true;
        let requiredModuleName = null;
        if (targetTile.actualType === TILE_TYPES.DEBRIS_FIELD) {
            if (!this.nanobotHasModuleAbility('canTraverse', TILE_TYPES.DEBRIS_FIELD)) {
                canTraverseTile = false;
                requiredModuleName = nanobotModulesData.drillArm?.name || "Module de Forage";
            }
        } else if (targetTile.actualType === TILE_TYPES.THICK_VINES) {
            if (!this.nanobotHasModuleAbility('canTraverse', TILE_TYPES.THICK_VINES)) {
                canTraverseTile = false;
                requiredModuleName = nanobotModulesData.plasmaCutter?.name || "Découpeur Plasma";
            }
        }
        // ... autres types d'obstacles ...

        if (!canTraverseTile) {
            const message = `Nécessite ${requiredModuleName || 'équipement spécial'} pour traverser.`;
            if (typeof explorationUI.addLogToActiveTileView === 'function') explorationUI.addLogToActiveTileView(message, "warning");
            return;
        }


        // Vérification et déduction du coût de mobilité
        if (gameState.resources.mobility < EXPLORATION_COST_MOBILITY) {
            const message = `Mobilité insuffisante (Requis: ${EXPLORATION_COST_MOBILITY}). Recharge en cours...`;
            if (typeof explorationUI.addLogToActiveTileView === 'function') explorationUI.addLogToActiveTileView(message, "error");
            if(typeof addLogEntry === 'function') addLogEntry(message, "error", eventLogEl, gameState.eventLog); // Aussi dans le log principal
            return;
        }
        gameState.resources.mobility -= EXPLORATION_COST_MOBILITY;
        if (typeof uiUpdates !== 'undefined') uiUpdates.updateResourceDisplay();


        // Déplacement Effectué
        const oldPos = { ...gameState.map.nanobotPos };
        gameState.map.nanobotPos = { x: newX, y: newY };
        gameState.map.activeExplorationTileCoords = { x: newX, y: newY }; // Mettre à jour la tuile active

        if(typeof addLogEntry === 'function') addLogEntry(`Déplacement de (${oldPos.x},${oldPos.y}) vers (${newX},${newY}). Coût: ${EXPLORATION_COST_MOBILITY} mobilité.`, "map-event", explorationLogEl, gameState.explorationLog);

        // Logique de révélation si la tuile n'était pas 'isExplored'
        // 'isExplored' signifie maintenant que le joueur a au moins "ouvert" l'UI d'exploration active pour cette case.
        let newTilesExploredCountForQuest = 0;
        if (!targetTile.isExplored) {
            targetTile.isExplored = true;
            newTilesExploredCountForQuest++; // Pour les quêtes
            // La première fois qu'on entre dans une case, on pourrait aussi révéler les adjacentes sur la *carte du monde*
            // this.revealSurroundingsOnWorldMap(newX, newY, currentZone); // Fonction à créer si désiré
        }
        
        // Compter pour les quêtes d'exploration (si on a bougé sur une nouvelle case qui devient "explorée")
        if (newTilesExploredCountForQuest > 0 && typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') {
            questController.checkQuestProgress({ type: "explore_tiles", count: newTilesExploredCountForQuest });
        }
        // Vérifier les quêtes liées au type de tuile sur laquelle on arrive
        if (typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') {
            questController.checkQuestProgress({ type: "explore_tile_type", tileType: targetTile.actualType, zoneId: gameState.currentZoneId, x:newX, y:newY });
        }

        // Mettre à jour l'UI d'exploration active pour afficher la nouvelle case
        explorationUI.updateActiveTileExplorationView(newX, newY);
        // Mettre à jour la carte du monde en arrière-plan (peut être fait par la gameloop aussi)
        if (typeof explorationUI.updateExplorationMapDisplay === 'function') {
            explorationUI.updateExplorationMapDisplay();
        }
    },

    // Gère une action spécifique DANS l'UI d'exploration active de tuile
    handleActionOnActiveTile: async function(actionId, tileX, tileY) {
        console.log(`explorationController: handleActionOnActiveTile: ${actionId} sur (${tileX},${tileY})`);
        if (!gameState || !tileActiveExplorationOptions || !tileActiveExplorationOptions[actionId] ||
            typeof mapManager === 'undefined' || typeof explorationUI === 'undefined') {
            console.error("handleActionOnActiveTile: Dépendances manquantes.");
            if (typeof explorationUI.addLogToActiveTileView === 'function') explorationUI.addLogToActiveTileView("Erreur système d'action.", "error");
            return;
        }

        const tile = mapManager.getTile(tileX, tileY);
        if (!tile) {
            if (typeof explorationUI.addLogToActiveTileView === 'function') explorationUI.addLogToActiveTileView("Erreur: Données de tuile inaccessibles.", "error");
            return;
        }

        const actionDef = tileActiveExplorationOptions[actionId];

        // Vérifier le coût de l'action
        if (actionDef.cost) {
            for (const resource in actionDef.cost) {
                if ((gameState.resources[resource] || 0) < actionDef.cost[resource]) {
                    const message = `Ressources (${resource}) insuffisantes pour : ${actionDef.name}. Requis: ${actionDef.cost[resource]}.`;
                    if (typeof explorationUI.addLogToActiveTileView === 'function') explorationUI.addLogToActiveTileView(message, "error");
                    return;
                }
            }
            // Déduire le coût
            for (const resource in actionDef.cost) {
                gameState.resources[resource] -= actionDef.cost[resource];
            }
            if (typeof uiUpdates !== 'undefined') uiUpdates.updateResourceDisplay();
        }

        // Exécuter l'action
        let actionResult = null;
        let dynamicDataForAction = null; // Pour passer des infos spécifiques à l'action

        // Préparer dynamicData si l'action est dynamique (ex: collecter une ressource spécifique)
        if (actionDef.isDynamic) {
            if (actionId === 'collect_visible_resource_active' && tile.content && tile.content.type === 'resource') {
                dynamicDataForAction = { type: tile.content.resourceType, name: TILE_TYPES_TO_RESOURCE_KEY[tile.content.resourceType] };
            } else if (actionId === 'engage_visible_enemy_active' && tile.content && tile.content.type === 'enemy_patrol') {
                dynamicDataForAction = tile.content.details;
            } else if (actionId === 'interact_poi_active' && tile.content && tile.content.type === 'poi') {
                 dynamicDataForAction = { poiType: tile.content.poiType, name: MAP_FEATURE_DATA[tile.content.poiType]?.name || "POI" };
            } else if (actionId === 'attack_enemy_base_active' && tile.content && tile.content.type === 'enemy_base') {
                dynamicDataForAction = tile.content.details;
            }
            // Pour 'collect_revealed_resource' et 'decipher_data_fragment', on passe la `featureData`
            // Cela sera géré dans `updateActiveTileExplorationView` lors de la création du bouton.
            // Ici, on suppose que `actionDef.action` est appelée avec `featureData` si nécessaire.
            // Pour la simplicité, on va considérer que `explorationUI` passe les bonnes données.
        }


        if (actionDef.action) {
            if (actionDef.action.constructor.name === "AsyncFunction") {
                actionResult = await actionDef.action(tile, gameState, dynamicDataForAction);
            } else {
                actionResult = actionDef.action(tile, gameState, dynamicDataForAction);
            }
        }

        if (actionResult && actionResult.forTileLog && typeof explorationUI.addLogToActiveTileView === 'function') {
            explorationUI.addLogToActiveTileView(actionResult.forTileLog, actionResult.logType || "info");
        }
        if (actionResult && actionResult.forMainLog && typeof addLogEntry === 'function') {
            addLogEntry(actionResult.forMainLog, actionResult.logType || "map-event", explorationLogEl, gameState.explorationLog);
        }


        // Marquer l'action comme utilisée si elle n'est pas répétable
        if (!actionDef.canRepeat) {
            tile.usedActions = tile.usedActions || {};
            tile.usedActions[actionId] = true;
        }

        // Mettre à jour l'UI d'exploration active pour refléter les changements (ex: options disparues)
        // Le 'true' force un recalcul complet des actions disponibles.
        explorationUI.updateActiveTileExplorationView(tileX, tileY, true);

        // Vérifier si la tuile est maintenant "complètement explorée"
        this.checkIfTileIsFullyExplored(tile);
    },

    checkIfTileIsFullyExplored: function(tile) {
        if (!tile) return;
        let allDone = true;
        // Vérifier si des features cachées restent à scanner/révéler
        if (tile.hiddenFeatures && tile.hiddenFeatures.length > 0 && !(tile.usedActions && tile.usedActions['scan_local_active'])) {
            allDone = false;
        }
        // Vérifier si des features révélées attendent une interaction
        if (tile.revealedFeatures && tile.revealedFeatures.length > 0) {
            allDone = false;
        }
        // Vérifier si le contenu principal (ressource, ennemi, POI non interagi) est toujours là
        if (tile.content) {
            if ((tile.content.type === 'resource' && tile.content.amount > 0) ||
                (tile.content.type === 'enemy_patrol') || // Un ennemi non vaincu bloque "fully explored"
                (tile.content.type === 'enemy_base' && tile.content.currentHealth > 0) ||
                (tile.content.type === 'poi' && !tile.content.isInteracted)) {
                allDone = false;
            }
        }
        // Vérifier si toutes les tentatives de fouille ont été utilisées
        const searchActionDef = tileActiveExplorationOptions['search_area_active'];
        if (searchActionDef && searchActionDef.canRepeat && (tile.searchAttempts || 0) < (searchActionDef.maxRepeats || 3)) {
            allDone = false;
        }

        if (allDone) {
            tile.isFullyExplored = true;
            if (typeof explorationUI.addLogToActiveTileView === 'function') explorationUI.addLogToActiveTileView("Cette zone semble avoir livré tous ses secrets.", "success");
            if(typeof addLogEntry === 'function') addLogEntry(`Zone (${tile.x},${tile.y}) entièrement explorée.`, "info", explorationLogEl, gameState.explorationLog);
        }
    },

    // Helper pour vérifier si le nanobot a un module avec une capacité donnée
    nanobotHasModuleAbility: function(abilityKey, requiredValue) {
        if (!gameState || !gameState.nanobotModuleLevels || !nanobotModulesData) return false;
        for (const moduleId in gameState.nanobotModuleLevels) {
            if (gameState.nanobotModuleLevels[moduleId] > 0) {
                const moduleData = nanobotModulesData[moduleId];
                // Vérifier si moduleData[abilityKey] est un tableau avant d'appeler .includes
                if (moduleData && moduleData[abilityKey] && Array.isArray(moduleData[abilityKey]) && moduleData[abilityKey].includes(requiredValue)) {
                    return true;
                }
            }
        }
        return false;
    },

    // Scan de la carte du monde (similaire à avant, mais mis à jour pour les noms de propriétés de tuile)
    performScanOnWorldMap: function() {
        console.log("explorationController: performScanOnWorldMap CALLED");
        if (!gameState || !gameState.nanobotStats || typeof SCAN_ENERGY_COST === 'undefined' ||
            typeof SCAN_COOLDOWN_DURATION_SECONDS === 'undefined' || typeof SCAN_REVEAL_DURATION_SECONDS === 'undefined' ||
            typeof ZONE_DATA === 'undefined' || typeof TICK_SPEED === 'undefined' || typeof mapManager === 'undefined') {
            console.error("explorationController.performScanOnWorldMap: Dépendances manquantes."); return;
        }

        const scanCost = SCAN_ENERGY_COST;
        const scanCooldownTimeInTicks = SCAN_COOLDOWN_DURATION_SECONDS * (1000 / TICK_SPEED);
        const scanRevealTimeInTicks = SCAN_REVEAL_DURATION_SECONDS * (1000 / TICK_SPEED);

        if (gameState.gameTime < (gameState.nanobotStats.lastMapScanTime || 0) + scanCooldownTimeInTicks) { // Nouveau nom de propriété
            const timeRemainingMs = ((gameState.nanobotStats.lastMapScanTime || 0) + scanCooldownTimeInTicks - gameState.gameTime) * TICK_SPEED;
            if(typeof addLogEntry === 'function') addLogEntry(`Scanner de carte en rechargement (${formatTime(Math.ceil(timeRemainingMs / 1000)) }).`, "warning", explorationLogEl, gameState.explorationLog);
            return;
        }
        if (gameState.resources.energy < scanCost) {
            if(typeof addLogEntry === 'function') addLogEntry(`Énergie insuffisante pour le scan de carte (Requis: ${scanCost}).`, "error", eventLogEl, gameState.eventLog);
            return;
        }

        gameState.resources.energy -= scanCost;
        gameState.nanobotStats.lastMapScanTime = gameState.gameTime; // Nouveau nom de propriété
        if(typeof addLogEntry === 'function') addLogEntry("Scan de la carte en cours... (Portée augmentée)", "map-event", explorationLogEl, gameState.explorationLog);

        const { x: botX, y: botY } = gameState.map.nanobotPos;
        const scanRevealUntilTick = gameState.gameTime + scanRevealTimeInTicks;
        let scannedSomethingNew = false;
        const scanRadius = 3;

        for (let dy = -scanRadius; dy <= scanRadius; dy++) {
            for (let dx = -scanRadius; dx <= scanRadius; dx++) {
                if (dx === 0 && dy === 0) continue;
                const cx = botX + dx;
                const cy = botY + dy;

                const currentZone = ZONE_DATA[gameState.currentZoneId];
                if (currentZone && cx >= 0 && cx < currentZone.mapSize.width && cy >= 0 && cy < currentZone.mapSize.height) {
                    const tile = mapManager.getTile(cx, cy);
                    // On scanne même si 'isExplored' est true, car le scan de carte peut révéler du contenu que l'exploration de base n'a pas.
                    // Mais on ne scanne pas si 'isFullyExplored' est true (ou si on veut une logique "scan révèle différemment")
                    if (tile && !tile.isFullyExplored) {
                        tile.isScannedFromMap = true; // Nouveau nom
                        tile.scannedFromMapRevealTime = scanRevealUntilTick; // Nouveau nom
                        tile.scannedFromMapActualType = tile.actualType; // Nouveau nom (actualType car le scan de carte montre ce qui EST, pas ce qui est caché)
                        scannedSomethingNew = true;
                    }
                }
            }
        }

        if (typeof uiUpdates !== 'undefined') uiUpdates.updateResourceDisplay();
        if (scannedSomethingNew && typeof explorationUI !== 'undefined' && typeof explorationUI.updateExplorationMapDisplay === 'function') {
             explorationUI.updateExplorationMapDisplay(); // Pour rafraîchir les classes CSS des tuiles scannées
        }
    },

    // Mise à jour des scans expirés (carte du monde)
    updateExpiredMapScans: function() {
        if (!gameState || !gameState.map || !gameState.map.tiles || typeof ZONE_DATA === 'undefined' || !ZONE_DATA[gameState.currentZoneId]) return false;
        let tilesChanged = false;
        const currentZoneMap = ZONE_DATA[gameState.currentZoneId];
        if (!currentZoneMap || !Array.isArray(gameState.map.tiles)) return false;

        for (let y = 0; y < currentZoneMap.mapSize.height; y++) {
            if (!gameState.map.tiles[y]) continue;
            for (let x = 0; x < currentZoneMap.mapSize.width; x++) {
                const tile = gameState.map.tiles[y][x];
                if (tile && tile.isScannedFromMap && gameState.gameTime > tile.scannedFromMapRevealTime) {
                    tile.isScannedFromMap = false;
                    tile.scannedFromMapActualType = null;
                    tilesChanged = true;
                }
            }
        }
        return tilesChanged; // Retourne true si des tuiles ont été modifiées (pour rafraîchir l'UI)
    },

    // Voyage entre zones (globalement similaire, mais s'assurer que l'UI d'exploration active est quittée)
    attemptTravelToZone: function(newZoneId) {
        console.log(`explorationController: attemptTravelToZone vers ${newZoneId}`);
        if (!gameState || typeof ZONE_DATA === 'undefined' || !ZONE_DATA[newZoneId] || typeof mapManager === 'undefined' || typeof explorationUI === 'undefined') {
            console.error("attemptTravelToZone: Dépendances manquantes ou zone invalide.");
            if(typeof addLogEntry === 'function') addLogEntry("Erreur système lors de la tentative de voyage.", "error", explorationLogEl, gameState.explorationLog);
            return;
        }
        // Quitter le mode exploration active si actif
        if (gameState.map.activeExplorationTileCoords && typeof explorationUI.exitActiveTileExplorationMode === 'function') {
            explorationUI.exitActiveTileExplorationMode();
        }

        if (gameState.currentZoneId === newZoneId) {
            if(typeof addLogEntry === 'function') addLogEntry(`Déjà dans la zone: ${ZONE_DATA[newZoneId].name}.`, "info", explorationLogEl, gameState.explorationLog);
            return;
        }
        if (!gameState.unlockedZones.includes(newZoneId)) {
            if(typeof addLogEntry === 'function') addLogEntry(`Zone ${ZONE_DATA[newZoneId].name} est verrouillée.`, "warning", explorationLogEl, gameState.explorationLog);
            return;
        }
        // ... (logique de coût de voyage comme avant) ...
        const targetZone = ZONE_DATA[newZoneId];
        if (targetZone.travelCost) { for (const resource in targetZone.travelCost) { if ((gameState.resources[resource] || 0) < targetZone.travelCost[resource]) { if(typeof addLogEntry === 'function') addLogEntry(`Ressources insuffisantes pour voyager vers ${targetZone.name}. Requis: ${targetZone.travelCost[resource]} ${resource}.`, "error", explorationLogEl, gameState.explorationLog); return;}} for (const resource_1 in targetZone.travelCost) gameState.resources[resource_1] -= targetZone.travelCost[resource_1]; if(typeof addLogEntry === 'function') addLogEntry(`Coût du voyage vers ${targetZone.name} payé.`, "info", explorationLogEl, gameState.explorationLog); if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();}


        gameState.currentZoneId = newZoneId;
        gameState.map.zoneId = newZoneId; // Assuré par generateMap mais bon à réaffirmer
        mapManager.generateMap(newZoneId); // Cela va réinitialiser nanobotPos à l'entryPoint de la zone

        if(typeof addLogEntry === 'function') addLogEntry(`Voyage vers ${targetZone.name} réussi.`, "success", explorationLogEl, gameState.explorationLog);

        // Mettre à jour l'UI de la carte du monde. L'UI d'exploration active n'est pas pertinente ici.
        if (typeof explorationUI.updateFullExplorationView === 'function') {
            explorationUI.isFirstExplorationViewUpdate = true; // Pour forcer le centrage
            explorationUI.updateFullExplorationView();
        }
        if (typeof uiUpdates !== 'undefined') uiUpdates.updateDisplays();
    },

    // Attaque de base ennemie (appelée depuis l'UI d'exploration active)
    // La logique principale est similaire, mais le contexte d'appel change.
    attemptAttackEnemyBase: async function(x,y) {
        console.log(`explorationController: attemptAttackEnemyBase sur (${x},${y})`);
        // Les dépendances et vérifications initiales sont similaires à avant
        // ... (vérifier gameState, mapManager, TILE_TYPES, simulateCombat, etc.)
        if (typeof gameState === 'undefined' || !gameState.map || !mapManager.getTile(x,y) || typeof explorationEnemyData === 'undefined' || typeof itemsData === 'undefined' || typeof TILE_TYPES === 'undefined' || typeof simulateCombat !== 'function' || typeof addToInventory !== 'function' || typeof gainXP !== 'function') {
            console.error("attemptAttackEnemyBase: Dépendances manquantes.");
            if(typeof addLogEntry === 'function') addLogEntry("Erreur système lors de la tentative d'attaque.", "error", explorationLogEl, gameState.explorationLog);
            return; // Retourner une promesse résolue avec échec ? Pour l'instant, on log et sort.
        }

        const tile = mapManager.getTile(x,y);
        if (!tile || !tile.content || tile.content.type !== 'enemy_base' || tile.content.currentHealth <= 0) {
            if(typeof addLogEntry === 'function') addLogEntry("Impossible d'attaquer: base ennemie invalide ou déjà détruite.", "warning", explorationLogEl, gameState.explorationLog);
            // Pas besoin de rafraîchir l'UI active ici car on l'a quittée avant d'appeler cette fonction.
            // Rafraîchir la carte du monde si nécessaire (par uiUpdates.updateDisplays).
            if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') explorationUI.updateFullExplorationView();
            return;
        }

        // Le Nanobot doit être SUR la case pour attaquer une base depuis l'UI d'exploration active.
        // (La vérification d'adjacence n'est plus pertinente si l'action est initiée depuis l'UI de la case elle-même)
        if (gameState.map.nanobotPos.x !== x || gameState.map.nanobotPos.y !== y) {
            if(typeof addLogEntry === 'function') addLogEntry("Le Nexus-7 doit être sur la case de la base ennemie pour l'attaquer de cette manière.", "warning", explorationLogEl, gameState.explorationLog);
            return;
        }


        const baseContent = tile.content;
        const baseDetails = baseContent.details;
        if(typeof addLogEntry === 'function') addLogEntry(baseDetails.onAttackText || `Attaque de ${baseDetails.name}...`, "map-event", explorationLogEl, gameState.explorationLog);

        // Logique des défenseurs (similaire à avant)
        if (baseDetails.defenders && baseDetails.defenders.length > 0) {
            // ... (boucle sur les défenseurs, appel à simulateCombat) ...
             let remainingDefenderGroups = JSON.parse(JSON.stringify(baseDetails.defenders));
            let currentGroupIndex = 0;

            while(currentGroupIndex < remainingDefenderGroups.length) {
                // ... (logique de combat contre les défenseurs, identique à votre version précédente)
                const defenderGroup = remainingDefenderGroups[currentGroupIndex];
                const enemyData = explorationEnemyData[defenderGroup.id];
                if (!enemyData) { /* ... */ currentGroupIndex++; continue; }

                for (let i = 0; i < defenderGroup.count; i++) {
                    if (gameState.nanobotStats.currentHealth <= 0) { /* ... (échec) ... */ return;  }
                    const enemyInstance = JSON.parse(JSON.stringify(enemyData));
                    enemyInstance.currentHealth = enemyInstance.health;
                    const combatResult = await simulateCombat(enemyInstance);
                    if (combatResult.outcome === "defeat" || gameState.nanobotStats.currentHealth <= 0) { /* ... (échec) ... */ return; }
                    if (!combatResult.enemyDefeated) { /* ... (échec partiel) ... */ return; }
                    if (typeof sleep === 'function') await sleep(300);
                }
                currentGroupIndex++;
            }
            if(typeof addLogEntry === 'function') addLogEntry("Tous les défenseurs de la base ont été neutralisés !", "success", explorationLogEl, gameState.explorationLog);
        } else {
             if(typeof addLogEntry === 'function') addLogEntry("La base semble non défendue de l'intérieur...", "info", explorationLogEl, gameState.explorationLog);
        }


        if (gameState.nanobotStats.currentHealth <= 0) { return; }

        // Attaque de la structure
        const damageToStructure = gameState.nanobotStats.attack * 2; // Ou une autre formule
        baseContent.currentHealth -= damageToStructure;
        if(typeof addLogEntry === 'function') addLogEntry(`Nexus-7 inflige ${damageToStructure} dégâts à la structure de ${baseDetails.name}. PV restants: ${Math.max(0, baseContent.currentHealth)}/${baseDetails.health}`, "map-event", explorationLogEl, gameState.explorationLog);

        if (baseContent.currentHealth <= 0) {
            baseContent.currentHealth = 0;
            if(typeof addLogEntry === 'function') addLogEntry(baseDetails.onDestroyedText || `${baseDetails.name} détruite !`, "success", explorationLogEl, gameState.explorationLog);
            // ... (logique de loot, XP, mise à jour de la tuile, quêtes comme avant) ...
            if (baseDetails.loot && baseDetails.loot.length > 0) { /* ... */ }
            tile.actualType = TILE_TYPES.RUINS;
            tile.content = {type: 'poi', poiType: TILE_TYPES.RUINS, isInteracted: true, originalBaseId: baseContent.id, x:x,y:y };
            tile.isFullyExplored = true; // La base détruite devient un POI exploré
            gainXP(baseDetails.xpReward || 0);
            if (typeof questController !== 'undefined') questController.checkQuestProgress({ type: "destroy_enemy_base", baseId: baseContent.id, zoneId: gameState.currentZoneId });
        }

        // Rafraîchir la carte du monde car l'état de la tuile a changé
        if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') {
            explorationUI.updateFullExplorationView();
        }
         if (typeof uiUpdates !== 'undefined') uiUpdates.updateDisplays(); // Pour ressources, XP etc.
    }
};

console.log("explorationController.js - Objet explorationController défini.");