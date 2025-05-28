// js/explorationController.js
console.log("explorationController.js - Fichier chargé et en cours d'analyse...");

var explorationController = {

    handleTileClickOnWorldMap: function(x, y) {
        console.log(`explorationController: handleTileClickOnWorldMap sur (${x},${y})`);

        if (!gameState || !gameState.map || typeof window.WORLD_ZONES === 'undefined' || typeof window.TILE_TYPES === 'undefined' ||
            typeof window.EXPLORATION_COST_MOBILITY === 'undefined' || typeof window.mapManager === 'undefined' || typeof window.explorationUI === 'undefined') {
            console.error("explorationController.handleTileClickOnWorldMap: Dépendances manquantes (gameState, WORLD_ZONES, TILE_TYPES, mapManager, explorationUI, etc.).");
            return;
        }
        if (!gameState.currentZoneId || !window.WORLD_ZONES[gameState.currentZoneId]) {
            console.error("explorationController.handleTileClickOnWorldMap: currentZoneId invalide ou zone non trouvée dans WORLD_ZONES.");
            if(typeof addLogEntry === 'function' && window.explorationLogEl) addLogEntry("Erreur: Données de zone actuelle corrompues.", "error", window.explorationLogEl, gameState.explorationLog);
            return;
        }
        const currentZone = window.WORLD_ZONES[gameState.currentZoneId];
        if (x < 0 || x >= currentZone.mapSize.width || y < 0 || y >= currentZone.mapSize.height) {
            if(typeof addLogEntry === 'function' && window.explorationLogEl) addLogEntry("Clic hors des limites de la carte.", "warning", window.explorationLogEl, gameState.explorationLog);
            return;
        }

        const targetTile = window.mapManager.getTile(x, y);
        if (!targetTile) {
            if(typeof addLogEntry === 'function' && window.explorationLogEl) addLogEntry("Données de tuile invalides pour le clic.", "error", window.explorationLogEl, gameState.explorationLog);
            return;
        }

        gameState.map.selectedTile = { x, y };

        const isCurrentPos = (gameState.map.nanobotPos && x === gameState.map.nanobotPos.x && y === gameState.map.nanobotPos.y);

        if (isCurrentPos) {
            if (typeof window.explorationUI.enterActiveTileExplorationMode === 'function') {
                if(typeof addLogEntry === 'function' && window.explorationLogEl) addLogEntry(`Entrée en mode exploration active pour la case (${x},${y}).`, "map-event", window.explorationLogEl, gameState.explorationLog);
                window.explorationUI.enterActiveTileExplorationMode(x,y);
            } else {
                console.error("explorationController: explorationUI.enterActiveTileExplorationMode non défini.");
            }
        } else {
            if(typeof addLogEntry === 'function' && window.explorationLogEl) addLogEntry(`Case (${x},${y}) sélectionnée. Entrez en mode exploration (clic sur votre case) pour interagir ou vous y déplacer.`, "info", window.explorationLogEl, gameState.explorationLog);
        }

        if (typeof window.explorationUI.updateTileInteractionPanel === 'function') {
            window.explorationUI.updateTileInteractionPanel(x, y);
        }
    },
    
    attemptMoveInActiveExplorationByCoords: function(targetX, targetY) {
        console.log(`explorationController: attemptMoveInActiveExplorationByCoords vers (${targetX},${targetY})`);
        if (!gameState || !gameState.map || !gameState.map.nanobotPos ||
            typeof window.EXPLORATION_COST_MOBILITY === 'undefined' || typeof window.mapManager === 'undefined' ||
            typeof window.explorationUI === 'undefined' || typeof window.nanobotModulesData === 'undefined' ||
            typeof window.WORLD_ZONES === 'undefined' || !window.WORLD_ZONES[gameState.currentZoneId] ||
            typeof window.TILE_TYPES === 'undefined') { 
            console.error("attemptMoveInActiveExplorationByCoords: Dépendances cruciales manquantes ou zone actuelle invalide.");
            if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView("Erreur système de déplacement.", "error");
            return;
        }

        const currentX = gameState.map.nanobotPos.x;
        const currentY = gameState.map.nanobotPos.y;

        const dx = Math.abs(targetX - currentX);
        const dy = Math.abs(targetY - currentY);
        if (!((dx <= 1 && dy === 0) || (dx === 0 && dy <= 1)) || (dx === 0 && dy === 0)) {
             if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView("Déplacement invalide (non adjacent).", "warning");
            return;
        }


        const currentZone = window.WORLD_ZONES[gameState.currentZoneId]; 
        if (targetX < 0 || targetX >= currentZone.mapSize.width || targetY < 0 || targetY >= currentZone.mapSize.height) {
            if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView("Déplacement hors des limites de la zone.", "warning");
            return;
        }

        const targetTile = window.mapManager.getTile(targetX, targetY);
        if (!targetTile) {
            if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView("Case cible invalide.", "error");
            return;
        }

        if (targetTile.actualType === window.TILE_TYPES.IMPASSABLE_DEEP_WATER || targetTile.actualType === window.TILE_TYPES.IMPASSABLE_HIGH_PEAK) {
            if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView("Terrain infranchissable.", "warning");
            return;
        }

        let canTraverseTile = true;
        let requiredModuleName = null;
        if (targetTile.actualType === window.TILE_TYPES.DEBRIS_FIELD) {
            if (!this.nanobotHasModuleAbility('canTraverse', window.TILE_TYPES.DEBRIS_FIELD)) {
                canTraverseTile = false;
                requiredModuleName = (typeof window.nanobotModulesData !== 'undefined' && window.nanobotModulesData["mining_drill_arm_mk1"]?.name) || "Module Foreuse"; 
            }
        } else if (targetTile.actualType === window.TILE_TYPES.THICK_VINES) {
            if (!this.nanobotHasModuleAbility('canTraverse', window.TILE_TYPES.THICK_VINES)) {
                canTraverseTile = false;
                requiredModuleName = (typeof window.nanobotModulesData !== 'undefined' && window.nanobotModulesData["plasma_cutter_arm_mk1"]?.name) || "Découpeur Plasma"; 
            }
        }

        if (!canTraverseTile) {
            const message = `Nécessite ${requiredModuleName || 'équipement spécial'} pour traverser.`;
            if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView(message, "warning");
            return;
        }

        if (gameState.resources.mobility < window.EXPLORATION_COST_MOBILITY) {
            const message = `Mobilité insuffisante (Requis: ${window.EXPLORATION_COST_MOBILITY}). Recharge en cours...`;
            if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView(message, "error");
            if(typeof addLogEntry === 'function' && typeof window.eventLogEl !== 'undefined') addLogEntry(message, "error", window.eventLogEl, gameState.eventLog);
            return;
        }
        gameState.resources.mobility -= window.EXPLORATION_COST_MOBILITY;
        if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();

        const oldPos = { ...gameState.map.nanobotPos };
        gameState.map.nanobotPos = { x: targetX, y: targetY };
        gameState.map.activeExplorationTileCoords = { x: targetX, y: targetY };

        if(typeof addLogEntry === 'function' && typeof window.explorationLogEl !== 'undefined') addLogEntry(`Déplacement de (${oldPos.x},${oldPos.y}) vers (${targetX},${targetY}). Coût: ${window.EXPLORATION_COST_MOBILITY} mobilité.`, "map-event", window.explorationLogEl, gameState.explorationLog);

        let newTilesExploredCountForQuest = 0;
        if (!targetTile.isExplored) {
            targetTile.isExplored = true;
            newTilesExploredCountForQuest++;
        }
        
        if (newTilesExploredCountForQuest > 0 && typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') {
            questController.checkQuestProgress({ type: "explore_tiles", count: newTilesExploredCountForQuest });
        }
        if (typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') {
            questController.checkQuestProgress({ type: "explore_tile_type", tileType: targetTile.actualType, zoneId: gameState.currentZoneId, x:targetX, y:targetY });
        }

        if (typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateActiveTileExplorationView === 'function') {
            window.explorationUI.updateActiveTileExplorationView(targetX, targetY, true); 
        }
    },


    handleActionOnActiveTile: async function(actionId, tileX, tileY, dynamicData = null) {
        console.log(`explorationController: handleActionOnActiveTile: ${actionId} sur (${tileX},${tileY}), dynamicData:`, dynamicData);
        if (!gameState || typeof window.tileActiveExplorationOptions === 'undefined' ||
            typeof window.mapManager === 'undefined' || typeof window.explorationUI === 'undefined') {
            console.error("handleActionOnActiveTile: Dépendances globales manquantes (gameState, tileActiveExplorationOptions, mapManager, explorationUI).");
            if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView("Erreur système d'action.", "error");
            return;
        }
        
        const actionDef = window.tileActiveExplorationOptions[actionId];
        if(!actionDef){
            console.error(`Action ID '${actionId}' non trouvée dans tileActiveExplorationOptions.`);
            if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView(`Action inconnue: ${actionId}`, "error");
            return;
        }

        const tile = window.mapManager.getTile(tileX, tileY);
        if (!tile) {
            if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView("Erreur: Données de tuile inaccessibles.", "error");
            return;
        }

        if (actionDef.condition && typeof actionDef.condition === 'function') {
            if (!actionDef.condition(gameState)) {
                const message = `Conditions non remplies pour : ${actionDef.name}.`;
                if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView(message, "warning");
                return;
            }
        }

        if (actionDef.cost) {
            for (const resource in actionDef.cost) {
                if ((gameState.resources[resource] || 0) < actionDef.cost[resource]) {
                    const message = `Ressources (${resource}) insuffisantes pour : ${actionDef.name}. Requis: ${actionDef.cost[resource]}.`;
                    if (typeof window.explorationUI.addLogToActiveTileView === 'function') window.explorationUI.addLogToActiveTileView(message, "error");
                    return;
                }
            }
            for (const resource in actionDef.cost) {
                gameState.resources[resource] -= actionDef.cost[resource];
            }
            if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
        }

        let actionResult = null;
        if (actionDef.action) {
            try {
                if (actionDef.action.constructor.name === "AsyncFunction") {
                    actionResult = await actionDef.action(tile, gameState, dynamicData);
                } else {
                    actionResult = actionDef.action(tile, gameState, dynamicData);
                }
            } catch (error) {
                console.error(`Erreur lors de l'exécution de l'action '${actionId}':`, error);
                actionResult = { forMainLog: `Erreur exécution action ${actionDef.name}.`, forTileLog: `Erreur: ${error.message}`, logType: "error" };
            }
        }

        if (actionResult && actionResult.forTileLog && typeof window.explorationUI.addLogToActiveTileView === 'function') {
            window.explorationUI.addLogToActiveTileView(actionResult.forTileLog, actionResult.logType || "info");
        }
        if (actionResult && actionResult.forMainLog && typeof addLogEntry === 'function' && typeof window.explorationLogEl !== 'undefined') {
            addLogEntry(actionResult.forMainLog, actionResult.logType || "map-event", window.explorationLogEl, gameState.explorationLog);
        }

        if (!actionDef.canRepeat) {
            tile.usedActions = tile.usedActions || {};
            tile.usedActions[actionId] = true;
            if (dynamicData && dynamicData.originalActionId) {
                 tile.usedActions[dynamicData.originalActionId] = tile.usedActions[dynamicData.originalActionId] || {};
                 tile.usedActions[dynamicData.originalActionId][JSON.stringify(dynamicData)] = true;
            }
        }

        const shouldHardRefreshActions = (actionResult && (actionResult.refreshActions || actionResult.newActionsAvailable));
        if (typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateActiveTileExplorationView === 'function') {
             window.explorationUI.updateActiveTileExplorationView(tileX, tileY, shouldHardRefreshActions);
        }

        this.checkIfTileIsFullyExplored(tile);
    },

    checkIfTileIsFullyExplored: function(tile) {
        if (!tile || typeof window.tileActiveExplorationOptions === 'undefined' || typeof window.activeTileViewData === 'undefined') return; 
        let allDone = true;
        const tileViewDataForType = window.activeTileViewData[tile.actualType] || window.activeTileViewData.default;

        if (tileViewDataForType?.possibleHiddenFeatures?.length > 0 && !(tile.usedActions && tile.usedActions['scan_local_active'])) {
           allDone = false;
        }
        if (tile.revealedFeatures && tile.revealedFeatures.length > 0) {
            allDone = false;
        }
        if (tile.content) {
            if ((tile.content.type === 'resource' && tile.content.amount > 0) ||
                (tile.content.type === 'enemy_patrol') ||
                (tile.content.type === 'enemy_base' && tile.content.currentHealth > 0) ||
                (tile.content.type === 'poi' && !tile.content.isInteracted)) {
                allDone = false;
            }
        }
        const searchActionDef = window.tileActiveExplorationOptions['search_area_active'];
        if (searchActionDef && searchActionDef.canRepeat && (tile.searchAttempts || 0) < (searchActionDef.maxRepeats || 3)) {
            allDone = false;
        }
        
        const baseActions = tile.baseActions || tileViewDataForType?.baseActions || [];
        if (baseActions) {
            for (const actionId of baseActions) {
                const actionDef = window.tileActiveExplorationOptions[actionId];
                if (actionDef && !actionDef.canRepeat && (!tile.usedActions || !tile.usedActions[actionId])) {
                    allDone = false; break;
                }
            }
        }

        if (allDone && !tile.isFullyExplored) {
            tile.isFullyExplored = true;
            if (typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.addLogToActiveTileView === 'function') {
                 window.explorationUI.addLogToActiveTileView("Cette zone semble avoir livré tous ses secrets.", "success");
            }
            if(typeof addLogEntry === 'function' && typeof window.explorationLogEl !== 'undefined' && typeof gameState !== 'undefined' && gameState.explorationLog) {
                 addLogEntry(`Zone (${tile.x},${tile.y}) entièrement explorée.`, "info", window.explorationLogEl, gameState.explorationLog);
            }
        }
    },

    nanobotHasModuleAbility: function(abilityKey, requiredValue) {
        if (!gameState || !gameState.nanobotModuleLevels || typeof window.nanobotModulesData === 'undefined') return false;
        for (const moduleId in gameState.nanobotModuleLevels) {
            if (gameState.nanobotModuleLevels[moduleId] > 0) {
                const moduleData = window.nanobotModulesData[moduleId];
                if (moduleData && moduleData.abilities && moduleData.abilities[abilityKey] && Array.isArray(moduleData.abilities[abilityKey]) && moduleData.abilities[abilityKey].includes(requiredValue)) return true;
                // Correction pour la vérification directe de `canTraverse` sur l'objet moduleData
                if (moduleData && abilityKey === 'canTraverse' && moduleData.abilities && moduleData.abilities[abilityKey] && Array.isArray(moduleData.abilities[abilityKey]) && moduleData.abilities[abilityKey].includes(requiredValue)) return true;
            }
        }
        return false;
    },

    performScanOnWorldMap: function() {
        if (!gameState || !gameState.nanobotStats || typeof window.SCAN_MOBILITY_COST === 'undefined' || 
            typeof window.SCAN_COOLDOWN_DURATION_SECONDS === 'undefined' || typeof window.SCAN_REVEAL_DURATION_SECONDS === 'undefined' || 
            typeof window.WORLD_ZONES === 'undefined' || !window.WORLD_ZONES[gameState.currentZoneId] || 
            typeof window.TICK_SPEED === 'undefined' || typeof window.mapManager === 'undefined') { 
            console.error("performScanOnWorldMap: Dépendances manquantes ou zone actuelle invalide."); return; 
        }
        const scanCost = window.SCAN_MOBILITY_COST; 
        const scanCooldownTimeInSeconds = window.SCAN_COOLDOWN_DURATION_SECONDS; 
        const scanRevealTimeInSeconds = window.SCAN_REVEAL_DURATION_SECONDS;
        
        if (gameState.gameTime < (gameState.nanobotStats.lastMapScanTime || 0) + scanCooldownTimeInSeconds) {
            if(typeof addLogEntry === 'function' && typeof window.explorationLogEl !== 'undefined') addLogEntry(`Scanner de carte en rechargement (${formatTime(Math.ceil(((gameState.nanobotStats.lastMapScanTime || 0) + scanCooldownTimeInSeconds - gameState.gameTime))) }).`, "warning", window.explorationLogEl, gameState.explorationLog); return;
        }
        if (gameState.resources.mobility < scanCost) {
            if(typeof addLogEntry === 'function' && typeof window.eventLogEl !== 'undefined') addLogEntry(`Mobilité insuffisante pour le scan de carte (Requis: ${scanCost}).`, "error", window.eventLogEl, gameState.eventLog); return;
        }
        gameState.resources.mobility -= scanCost; 
        gameState.nanobotStats.lastMapScanTime = gameState.gameTime;
        if(typeof addLogEntry === 'function' && typeof window.explorationLogEl !== 'undefined') addLogEntry("Scan de la carte en cours...", "map-event", window.explorationLogEl, gameState.explorationLog);
        
        if (!gameState.map.nanobotPos) {
            console.error("performScanOnWorldMap: nanobotPos non défini."); 
            if(typeof addLogEntry === 'function' && typeof window.explorationLogEl !== 'undefined') addLogEntry("Scan échoué: Position du Nanobot inconnue.", "error", window.explorationLogEl, gameState.explorationLog);
            return;
        }
        const { x: botX, y: botY } = gameState.map.nanobotPos;
        const scanRevealUntilTime = gameState.gameTime + scanRevealTimeInSeconds; 
        let scannedSomethingNew = false; 
        const scanRadius = window.EXPLORATION_SETTINGS?.scanRadius || 3;

        const currentZone = window.WORLD_ZONES[gameState.currentZoneId]; 

        for (let dy = -scanRadius; dy <= scanRadius; dy++) {
            for (let dx = -scanRadius; dx <= scanRadius; dx++) {
                if (dx === 0 && dy === 0) continue;
                const cx = botX + dx; const cy = botY + dy;
                if (currentZone && cx >= 0 && cx < currentZone.mapSize.width && cy >= 0 && cy < currentZone.mapSize.height) {
                    const tile = window.mapManager.getTile(cx, cy);
                    // Ne scanne que les tuiles non explorées ET non déjà full (pour éviter de rescanner des POI déjà vidés par ex.)
                    if (tile && !tile.isExplored && !tile.isFullyExplored) { 
                        tile.isScannedFromMap = true;
                        tile.scannedFromMapRevealTime = scanRevealUntilTime; 
                        tile.scannedFromMapActualType = tile.actualType; 
                        scannedSomethingNew = true;
                    }
                }
            }
        }
        if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
        if (scannedSomethingNew && typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateExplorationMapDisplay === 'function') {
            window.explorationUI.updateExplorationMapDisplay(); 
        } else if (!scannedSomethingNew) {
            if(typeof addLogEntry === 'function' && typeof window.explorationLogEl !== 'undefined') addLogEntry("Scan de carte terminé. Aucune nouvelle information notable dans la portée immédiate.", "info", window.explorationLogEl, gameState.explorationLog);
        }
    },

    updateExpiredMapScans: function() {
        if (!gameState || !gameState.map || !gameState.map.tiles || typeof window.WORLD_ZONES === 'undefined' || !window.WORLD_ZONES[gameState.currentZoneId]) return false; 
        let tilesChanged = false;
        const currentZone = window.WORLD_ZONES[gameState.currentZoneId]; 
        if (!currentZone || !gameState.map.tiles[gameState.currentZoneId] || !Array.isArray(gameState.map.tiles[gameState.currentZoneId])) return false;

        const zoneTiles = gameState.map.tiles[gameState.currentZoneId];
        for (let y = 0; y < currentZone.mapSize.height; y++) {
            if (!zoneTiles[y]) continue;
            for (let x = 0; x < currentZone.mapSize.width; x++) {
                const tile = zoneTiles[y][x];
                if (tile && tile.isScannedFromMap && gameState.gameTime > tile.scannedFromMapRevealTime) {
                    tile.isScannedFromMap = false;
                    tile.scannedFromMapActualType = null; 
                    tilesChanged = true;
                }
            }
        }
        return tilesChanged;
    },

    attemptTravelToZone: function(newZoneId) {
        console.log(`explorationController: attemptTravelToZone vers ${newZoneId}`);
        if (!gameState || typeof window.WORLD_ZONES === 'undefined' || !window.WORLD_ZONES[newZoneId] || 
            typeof window.mapManager === 'undefined' || typeof window.explorationUI === 'undefined') { 
            console.error("attemptTravelToZone: Dépendances manquantes ou zone invalide.");
            if(typeof addLogEntry === 'function' && window.explorationLogEl) addLogEntry("Erreur système voyage.", "error", window.explorationLogEl, gameState.explorationLog);
            return;
        }
        if (gameState.map.activeExplorationTileCoords && typeof window.explorationUI.exitActiveTileExplorationMode === 'function') {
            window.explorationUI.exitActiveTileExplorationMode();
        }
        if (gameState.currentZoneId === newZoneId) {
            if(typeof addLogEntry === 'function' && window.explorationLogEl) addLogEntry(`Déjà dans: ${window.WORLD_ZONES[newZoneId].name}.`, "info", window.explorationLogEl, gameState.explorationLog); 
            return;
        }
        if (!gameState.unlockedZones.includes(newZoneId)) {
            if(typeof addLogEntry === 'function' && window.explorationLogEl) addLogEntry(`Zone ${window.WORLD_ZONES[newZoneId].name} verrouillée.`, "warning", window.explorationLogEl, gameState.explorationLog); 
            return;
        }
        const targetZone = window.WORLD_ZONES[newZoneId]; 
        if (targetZone.travelCost) {
            for (const resource in targetZone.travelCost) {
                if ((gameState.resources[resource] || 0) < targetZone.travelCost[resource]) {
                    if(typeof addLogEntry === 'function' && window.explorationLogEl) addLogEntry(`Ressources insuffisantes. Requis: ${targetZone.travelCost[resource]} ${resource}.`, "error", window.explorationLogEl, gameState.explorationLog); return;
                }
            }
            for (const resource_1 in targetZone.travelCost) gameState.resources[resource_1] -= targetZone.travelCost[resource_1];
            if(typeof addLogEntry === 'function' && window.explorationLogEl) addLogEntry(`Coût du voyage payé.`, "info", window.explorationLogEl, gameState.explorationLog);
            if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
        }
        window.mapManager.generateMap(newZoneId);
        
        if(typeof addLogEntry === 'function' && window.explorationLogEl) addLogEntry(`Voyage vers ${targetZone.name} réussi.`, "success", window.explorationLogEl, gameState.explorationLog);
        if (typeof window.explorationUI.updateFullExplorationView === 'function') {
            window.explorationUI.isFirstExplorationViewUpdate = true;
            window.explorationUI.updateFullExplorationView();
        }
        if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays();
    },

    attemptAttackEnemyBase: async function(x,y) {
        console.log(`explorationController: attemptAttackEnemyBase sur (${x},${y})`);
        if (typeof gameState === 'undefined' || !gameState.map ||
            typeof window.mapManager === 'undefined' || typeof window.mapManager.getTile !== 'function' ||
            typeof window.explorationEnemyData === 'undefined' || typeof window.itemsData === 'undefined' ||
            typeof window.TILE_TYPES === 'undefined' || typeof window.simulateCombat !== 'function' ||
            typeof window.addToInventory !== 'function' || typeof window.gainXP !== 'function' ||
            typeof window.explorationLogEl === 'undefined') {
            console.error("attemptAttackEnemyBase: Dépendances manquantes.");
            if(typeof addLogEntry === 'function') addLogEntry("Erreur système attaque base.", "error", window.explorationLogEl, gameState?.explorationLog);
            return;
        }
        const tile = window.mapManager.getTile(x,y);
        if (!tile || !tile.content || tile.content.type !== 'enemy_base' || tile.content.currentHealth <= 0) {
            if(typeof addLogEntry === 'function') addLogEntry("Impossible d'attaquer: base invalide ou détruite.", "warning", window.explorationLogEl, gameState.explorationLog);
            if (typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateFullExplorationView === 'function') window.explorationUI.updateFullExplorationView();
            return;
        }
        if (!gameState.map.nanobotPos || gameState.map.nanobotPos.x !== x || gameState.map.nanobotPos.y !== y) {
            if(typeof addLogEntry === 'function') addLogEntry("Nexus-7 doit être sur la case de la base pour attaquer.", "warning", window.explorationLogEl, gameState.explorationLog);
            return;
        }
        const baseContent = tile.content;
        const baseDetails = baseContent.details;
        if (!baseDetails) {
            console.error("attemptAttackEnemyBase: baseContent.details non défini pour la base ennemie.");
            if(typeof addLogEntry === 'function') addLogEntry("Erreur: Données de la base ennemie corrompues.", "error", window.explorationLogEl, gameState.explorationLog);
            return;
        }

        if(typeof addLogEntry === 'function') addLogEntry(baseDetails.onAttackText || `Attaque de ${baseDetails.name}...`, "map-event", window.explorationLogEl, gameState.explorationLog);
        
        if (baseDetails.defenders && baseDetails.defenders.length > 0) {
            let remainingDefenderGroups = JSON.parse(JSON.stringify(baseDetails.defenders));
            let currentGroupIndex = 0;
            while(currentGroupIndex < remainingDefenderGroups.length) {
                const defenderGroup = remainingDefenderGroups[currentGroupIndex];
                const enemyTemplate = window.explorationEnemyData[defenderGroup.id];
                if (!enemyTemplate) {
                    console.warn(`Données défenseur ${defenderGroup.id} inconnues.`);
                    currentGroupIndex++; continue;
                }
                for (let i = 0; i < defenderGroup.count; i++) {
                    if (gameState.nanobotStats.currentHealth <= 0) {
                        if(typeof addLogEntry === 'function') addLogEntry("Nexus-7 hors combat. Assaut échoué.", "error", window.explorationLogEl, gameState.explorationLog);
                        if (typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateFullExplorationView === 'function') window.explorationUI.updateFullExplorationView();
                        return;
                    }
                    const enemyInstance = JSON.parse(JSON.stringify(enemyTemplate));
                    enemyInstance.currentHealth = enemyInstance.health || enemyInstance.maxHealth || 10;
                    enemyInstance.maxHealth = enemyInstance.maxHealth || enemyInstance.health || 10;

                    const combatResult = await window.simulateCombat(enemyInstance);
                    if (!combatResult || combatResult.outcome === "defeat" || gameState.nanobotStats.currentHealth <= 0) {
                        if(typeof addLogEntry === 'function') addLogEntry("Nexus-7 vaincu. Assaut échoué.", "error", window.explorationLogEl, gameState.explorationLog);
                        if (typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateFullExplorationView === 'function') window.explorationUI.updateFullExplorationView();
                        return;
                    }
                    if (!combatResult.enemyDefeated) {
                        if(typeof addLogEntry === 'function') addLogEntry(`Défenseur ${enemyTemplate.name} toujours actif. Assaut bloqué.`, "error", window.explorationLogEl, gameState.explorationLog);
                        if (typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateFullExplorationView === 'function') window.explorationUI.updateFullExplorationView();
                        return;
                    }
                    if (typeof sleep === 'function') await sleep(300); else console.warn("sleep function undefined");
                }
                currentGroupIndex++;
            }
            if(typeof addLogEntry === 'function') addLogEntry("Défenseurs neutralisés !", "success", window.explorationLogEl, gameState.explorationLog);
        } else {
            if(typeof addLogEntry === 'function') addLogEntry("Base non défendue de l'intérieur...", "info", window.explorationLogEl, gameState.explorationLog);
        }

        if (gameState.nanobotStats.currentHealth <= 0) return;

        const damageToStructure = (gameState.nanobotStats.attack || 5) * 2;
        baseContent.currentHealth -= damageToStructure;
        if(typeof addLogEntry === 'function') addLogEntry(`Nexus-7 inflige ${damageToStructure} dégâts à ${baseDetails.name}. PV: ${Math.max(0, baseContent.currentHealth)}/${baseDetails.health}`, "map-event", window.explorationLogEl, gameState.explorationLog);

        if (baseContent.currentHealth <= 0) {
            baseContent.currentHealth = 0;
            if(typeof addLogEntry === 'function') addLogEntry(baseDetails.onDestroyedText || `${baseDetails.name} détruite !`, "success", window.explorationLogEl, gameState.explorationLog);
            
            if (baseDetails.loot && baseDetails.loot.length > 0 && typeof window.itemsData !== 'undefined' && typeof window.addToInventory === 'function') {
                baseDetails.loot.forEach(itemId => {
                    if (window.itemsData[itemId] && window.itemsData[itemId].effects_on_use && (window.itemsData[itemId].rarity === "consumable_reward" || window.itemsData[itemId].consumable)) {
                         if(typeof window.itemsData[itemId].effects_on_use === 'function') window.itemsData[itemId].effects_on_use(gameState);
                         else if (Array.isArray(window.itemsData[itemId].effects_on_use)) {
                         }
                    } else {
                        window.addToInventory(itemId);
                    }
                });
            }
            tile.actualType = window.TILE_TYPES.RUINS;
            tile.content = {type: 'poi', poiType: window.TILE_TYPES.RUINS, isInteracted: true, originalBaseId: baseContent.id, x:x,y:y };
            tile.isFullyExplored = true;
            
            if(typeof window.gainXP === 'function') window.gainXP(baseDetails.xpReward || 0);
            if (typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') {
                questController.checkQuestProgress({ type: "destroy_enemy_base", baseId: baseContent.id, zoneId: gameState.currentZoneId });
            }
        }
        if (typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateFullExplorationView === 'function') window.explorationUI.updateFullExplorationView();
        if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays();
    }
};
window.explorationController = explorationController;

console.log("explorationController.js - Objet explorationController défini.");