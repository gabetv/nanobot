// js/explorationController.js
console.log("explorationController.js - Fichier chargé et en cours d'analyse...");

var explorationController = {

    handleTileClick: function(x, y) {
        console.log(`explorationController: handleTileClick sur (${x},${y})`);

        // --- DEBUT BLOC DE DEBUG ---
        // console.log("DEBUG handleTileClick: gameState:", gameState ? "défini" : "NON DÉFINI");
        // if (gameState) {
        //     console.log("DEBUG handleTileClick: gameState.map:", gameState.map ? "défini" : "NON DÉFINI");
        // }
        // console.log("DEBUG handleTileClick: ZONE_DATA:", typeof ZONE_DATA);
        // console.log("DEBUG handleTileClick: TILE_TYPES:", typeof TILE_TYPES);
        // console.log("DEBUG handleTileClick: EXPLORATION_COST_MOBILITY:", typeof EXPLORATION_COST_MOBILITY);
        // console.log("DEBUG handleTileClick: mapManager:", typeof mapManager);
        // --- FIN BLOC DE DEBUG ---

        if (!gameState || !gameState.map || typeof ZONE_DATA === 'undefined' || typeof TILE_TYPES === 'undefined' || 
            typeof EXPLORATION_COST_MOBILITY === 'undefined' || 
            typeof mapManager === 'undefined') {
            console.error("explorationController.handleTileClick: Dépendances gameState, config ou mapManager manquantes.");
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

        gameState.map.selectedTile = { x, y };

        const dxPos = Math.abs(x - gameState.map.nanobotPos.x);
        const dyPos = Math.abs(y - gameState.map.nanobotPos.y);
        const isAdjacent = dxPos <= 1 && dyPos <= 1 && !(dxPos === 0 && dyPos === 0);
        const isCurrentPos = dxPos === 0 && dyPos === 0;

        if (isCurrentPos) {
            if(typeof addLogEntry === 'function') addLogEntry(`Examen de la case actuelle (${x},${y}).`, "map-event", explorationLogEl, gameState.explorationLog);
             if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateTileInteractionPanel === 'function') {
                explorationUI.updateTileInteractionPanel(x, y);
            }
        } else if (isAdjacent) {
            if (targetTile.actualType === TILE_TYPES.IMPASSABLE_DEEP_WATER || targetTile.actualType === TILE_TYPES.IMPASSABLE_HIGH_PEAK) {
                if(typeof addLogEntry === 'function') addLogEntry("Impossible de se déplacer sur ce terrain infranchissable.", "warning", explorationLogEl, gameState.explorationLog);
            } else if (gameState.resources.mobility < EXPLORATION_COST_MOBILITY) { 
                if(typeof addLogEntry === 'function') addLogEntry(`Mobilité insuffisante pour se déplacer (Requis: ${EXPLORATION_COST_MOBILITY}). Actuel: ${Math.floor(gameState.resources.mobility)}. Recharge en cours...`, "error", eventLogEl, gameState.eventLog);
            } else {
                gameState.resources.mobility -= EXPLORATION_COST_MOBILITY; 
                const oldPos = { ...gameState.map.nanobotPos };
                gameState.map.nanobotPos = { x, y };
                if(typeof addLogEntry === 'function') addLogEntry(`Déplacement de (${oldPos.x},${oldPos.y}) vers (${x}, ${y}). Coût: ${EXPLORATION_COST_MOBILITY} mobilité.`, "map-event", explorationLogEl, gameState.explorationLog);

                this.revealTileAndSurroundings(x, y, currentZone); 
                this.processTileContentOnArrival(x, y);        
            }
        } else {
            if(typeof addLogEntry === 'function') addLogEntry("Cette case est trop éloignée pour un déplacement direct.", "warning", explorationLogEl, gameState.explorationLog);
        }

        if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') {
            explorationUI.updateFullExplorationView(); 
        } else if (typeof updateExplorationDisplay === 'function') { 
            updateExplorationDisplay(); 
        }
    },

    revealTileAndSurroundings: function(x, y, currentZone) {
        if (!currentZone || !currentZone.mapSize) { console.warn("revealTileAndSurroundings: currentZone ou currentZone.mapSize non défini."); return; }
        const tile = mapManager.getTile(x,y); let newTilesExploredCount = 0;
        if (tile && !tile.isExplored) { tile.isExplored = true; newTilesExploredCount++; }
        for (let dy = -1; dy <= 1; dy++) { for (let dx = -1; dx <= 1; dx++) { const nx = x + dx; const ny = y + dy; if (nx >= 0 && nx < currentZone.mapSize.width && ny >= 0 && ny < currentZone.mapSize.height) { const adjacentTile = mapManager.getTile(nx, ny); if(adjacentTile && !adjacentTile.isExplored) { adjacentTile.isExplored = true; newTilesExploredCount++; }}}}
        if (newTilesExploredCount > 0 && typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') { questController.checkQuestProgress({ type: "explore_tiles", count: newTilesExploredCount });}
    },

    processTileContentOnArrival: function(x, y) {
        const tile = mapManager.getTile(x,y); if (!tile) { console.warn(`processTileContentOnArrival: Tuile non trouvée en (${x},${y})`); return; }
        if (typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') { questController.checkQuestProgress({ type: "explore_tile_type", tileType: tile.actualType, zoneId: gameState.currentZoneId, x:x, y:y });}
        if (!tile.content) { const terrainName = (typeof explorationUI !== 'undefined' && typeof explorationUI.getTileContentName === 'function') ? explorationUI.getTileContentName(tile.actualType, null) : "terrain inconnu"; if (tile.actualType === TILE_TYPES.PLAYER_BASE) { if(typeof addLogEntry === 'function') addLogEntry("Retour au Noyau Central. Systèmes légèrement régénérés.", "map-event", explorationLogEl, gameState.explorationLog); gameState.nanobotStats.currentHealth = Math.min(gameState.nanobotStats.health, gameState.nanobotStats.currentHealth + Math.floor(gameState.nanobotStats.health * 0.1)); if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateNanobotDisplay === 'function') uiUpdates.updateNanobotDisplay(); } else if (tile.actualType !== TILE_TYPES.EMPTY_WATER && tile.actualType !== TILE_TYPES.IMPASSABLE_DEEP_WATER) { if(typeof addLogEntry === 'function') addLogEntry(`Arrivée sur ${terrainName} en (${x},${y}).`, "map-event", explorationLogEl, gameState.explorationLog); } if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateTileInteractionPanel === 'function') explorationUI.updateTileInteractionPanel(x, y); return; }
        const content = tile.content; 
        if (content.type === 'resource' && content.amount > 0) { if (typeof TILE_TYPES_TO_RESOURCE_KEY === 'undefined') { console.error("TILE_TYPES_TO_RESOURCE_KEY is not defined!"); if(typeof addLogEntry === 'function') addLogEntry(`Erreur config: Impossible de collecter ressource en (${x},${y}).`, "error", explorationLogEl, gameState.explorationLog); return; } const resourceKey = TILE_TYPES_TO_RESOURCE_KEY[content.resourceType]; if (resourceKey) { const amountCollected = content.amount; gameState.resources[resourceKey] = (gameState.resources[resourceKey] || 0) + amountCollected; if(typeof addLogEntry === 'function') addLogEntry(`Collecté ${amountCollected} ${resourceKey.charAt(0).toUpperCase() + resourceKey.slice(1)} en (${x},${y}).`, "success", explorationLogEl, gameState.explorationLog); if (typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') questController.checkQuestProgress({ type: "collect_resource", resource: resourceKey, amount: amountCollected }); tile.actualType = tile.baseType === TILE_TYPES.PRE_WATER ? TILE_TYPES.EMPTY_WATER : TILE_TYPES.EMPTY_GRASSLAND; tile.content = null;} else { console.warn(`Clé de ressource non mappée pour resourceType: ${content.resourceType}`); if(typeof addLogEntry === 'function') addLogEntry(`Type de ressource non reconnu (${content.resourceType}) en (${x},${y}). Impossible de collecter.`, "warning", explorationLogEl, gameState.explorationLog);}}
        else if (content.type === 'enemy_patrol') { if(typeof addLogEntry === 'function') addLogEntry(`Patrouille ennemie (${content.details.name}) engagée en (${x},${y})!`, "error", explorationLogEl, gameState.explorationLog); gameState.map.currentEnemyEncounter = { x, y, details: content.details, idInMap: content.id }; if (typeof simulateCombat === 'function') simulateCombat(content.details); else console.error("simulateCombat non défini.");}
        else if (content.type === 'cache') { if (!content.isOpened) { if(typeof addLogEntry === 'function') addLogEntry(`Cache de matériaux trouvée et ouverte en (${x},${y})!`, "success", explorationLogEl, gameState.explorationLog); const loot = content.lootTable || []; if (typeof itemsData !== 'undefined' && typeof addToInventory === 'function') { loot.forEach(itemId => { if (itemsData[itemId] && itemsData[itemId].onUse && (itemsData[itemId].rarity === "consumable_reward" || itemsData[itemId].consumable)) itemsData[itemId].onUse(gameState); else addToInventory(itemId); });} content.isOpened = true; } else if(typeof addLogEntry === 'function') addLogEntry(`Cache déjà ouverte en (${x},${y}).`, "info", explorationLogEl, gameState.explorationLog);}
        else if (content.type === 'poi') { if (!content.isInteracted) { const poiName = (typeof MAP_FEATURE_DATA !== 'undefined' && MAP_FEATURE_DATA[content.poiType]?.name) || "Point d'intérêt"; if(typeof addLogEntry === 'function') addLogEntry(`Découverte : ${poiName} en (${x},${y}). ${MAP_FEATURE_DATA[content.poiType]?.description || ""}`, "map-event", explorationLogEl, gameState.explorationLog); content.isInteracted = true; if (typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') questController.checkQuestProgress({ type: "interact_poi_type", poiType: content.poiType, count: 1, x:x, y:y });} else if(typeof addLogEntry === 'function') addLogEntry(`Point d'intérêt (${MAP_FEATURE_DATA[content.poiType]?.name || 'POI'}) déjà examiné en (${x},${y}).`, "info", explorationLogEl, gameState.explorationLog);}
        else if (content.type === 'enemy_base') { if (content.currentHealth > 0) { if(typeof addLogEntry === 'function') addLogEntry(`${content.details.name} repéré en (${x},${y}). PV: ${content.currentHealth}/${content.details.health}. Interagissez via le panneau latéral.`, "warning", explorationLogEl, gameState.explorationLog);} else { if(typeof addLogEntry === 'function') addLogEntry(`${content.details.name} en (${x},${y}) est en ruines.`, "info", explorationLogEl, gameState.explorationLog);}}
        else console.warn(`Type de contenu inconnu ou non géré: "${content.type}" sur la tuile (${x},${y})`);
        if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateTileInteractionPanel === 'function') explorationUI.updateTileInteractionPanel(x, y);
        if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
    },

    performScan: function() {
        console.log("explorationController: performScan CALLED");
        if (!gameState || !gameState.nanobotStats || typeof SCAN_ENERGY_COST === 'undefined' || typeof SCAN_COOLDOWN_DURATION_SECONDS === 'undefined' || typeof SCAN_REVEAL_DURATION_SECONDS === 'undefined' || typeof ZONE_DATA === 'undefined' || typeof TICK_SPEED === 'undefined' || typeof mapManager === 'undefined') {
            console.error("explorationController.performScan: Dépendances gameState, config ou mapManager manquantes."); return;
        }

        const stats = gameState.nanobotStats;
        const scanCost = SCAN_ENERGY_COST;
        const scanCooldownTimeInTicks = SCAN_COOLDOWN_DURATION_SECONDS * (1000 / TICK_SPEED);
        const scanRevealTimeInTicks = SCAN_REVEAL_DURATION_SECONDS * (1000 / TICK_SPEED);

        if (gameState.gameTime < (stats.lastScanTime || 0) + scanCooldownTimeInTicks) {
            const timeRemainingMs = ((stats.lastScanTime || 0) + scanCooldownTimeInTicks - gameState.gameTime) * TICK_SPEED;
            if(typeof addLogEntry === 'function') addLogEntry(`Scanner en rechargement (${formatTime(Math.ceil(timeRemainingMs / 1000)) }).`, "warning", explorationLogEl, gameState.explorationLog);
            return;
        }
        if (gameState.resources.energy < scanCost) {
            if(typeof addLogEntry === 'function') addLogEntry(`Énergie insuffisante pour scanner (Requis: ${scanCost}). Actuel: ${Math.floor(gameState.resources.energy)}.`, "error", eventLogEl, gameState.eventLog);
            return;
        }

        gameState.resources.energy -= scanCost;
        stats.lastScanTime = gameState.gameTime;
        if(typeof addLogEntry === 'function') addLogEntry("Scan des environs... (Portée augmentée)", "map-event", explorationLogEl, gameState.explorationLog);

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
                    if (tile && !tile.isExplored) { 
                        tile.isScanned = true;
                        tile.scannedRevealTime = scanRevealUntilTick;
                        tile.scannedActualType = tile.actualType; 
                        scannedSomethingNew = true;
                    }
                }
            }
        }

        if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
        else if (typeof updateResourceDisplay === 'function') updateResourceDisplay(); 

        const explorationSubTab = document.getElementById('exploration-subtab');
        const explorationSubTabActive = explorationSubTab ? explorationSubTab.classList.contains('active') : false;

        if (scannedSomethingNew && explorationSubTabActive && typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') {
             console.log("explorationController.performScan: Nouvelles tuiles scannées, mise à jour de la vue.");
             explorationUI.updateFullExplorationView();
        } else if (scannedSomethingNew) {
            console.log("explorationController.performScan: Nouvelles tuiles scannées, mais l'onglet exploration n'est pas actif. La mise à jour se fera au prochain tick de la gameloop si l'onglet devient actif.");
        }
    },

    updateExpiredScans: function() {
        if (!gameState || !gameState.map || !gameState.map.tiles || typeof ZONE_DATA === 'undefined' || !ZONE_DATA[gameState.currentZoneId]) return false;
        let tilesChanged = false; const currentZoneMap = ZONE_DATA[gameState.currentZoneId]; if (!currentZoneMap || !Array.isArray(gameState.map.tiles)) return false;
        for (let y = 0; y < currentZoneMap.mapSize.height; y++) { if (!gameState.map.tiles[y]) continue; for (let x = 0; x < currentZoneMap.mapSize.width; x++) { const tile = gameState.map.tiles[y][x]; if (tile && tile.isScanned && gameState.gameTime > tile.scannedRevealTime) { tile.isScanned = false; tile.scannedActualType = null; tilesChanged = true;}}}
        return tilesChanged;
    },

    attemptTravelToZone: function(newZoneId) {
        console.log(`explorationController: attemptTravelToZone vers ${newZoneId}`);
        if (!gameState || typeof ZONE_DATA === 'undefined' || !ZONE_DATA[newZoneId] || typeof mapManager === 'undefined') { console.error("attemptTravelToZone: Dépendances manquantes ou zone invalide."); if(typeof addLogEntry === 'function') addLogEntry("Erreur système lors de la tentative de voyage.", "error", explorationLogEl, gameState.explorationLog); return;}
        if (gameState.currentZoneId === newZoneId) { if(typeof addLogEntry === 'function') addLogEntry(`Déjà dans la zone: ${ZONE_DATA[newZoneId].name}.`, "info", explorationLogEl, gameState.explorationLog); return;}
        if (!gameState.unlockedZones.includes(newZoneId)) { if(typeof addLogEntry === 'function') addLogEntry(`Zone ${ZONE_DATA[newZoneId].name} est verrouillée.`, "warning", explorationLogEl, gameState.explorationLog); return;}
        const targetZone = ZONE_DATA[newZoneId];
        if (targetZone.travelCost) { for (const resource in targetZone.travelCost) { if ((gameState.resources[resource] || 0) < targetZone.travelCost[resource]) { if(typeof addLogEntry === 'function') addLogEntry(`Ressources insuffisantes pour voyager vers ${targetZone.name}. Requis: ${targetZone.travelCost[resource]} ${resource}.`, "error", explorationLogEl, gameState.explorationLog); return;}} for (const resource_1 in targetZone.travelCost) gameState.resources[resource_1] -= targetZone.travelCost[resource_1]; if(typeof addLogEntry === 'function') addLogEntry(`Coût du voyage vers ${targetZone.name} payé.`, "info", explorationLogEl, gameState.explorationLog); if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();}
        
        gameState.currentZoneId = newZoneId; 
        gameState.map.zoneId = newZoneId; 
        mapManager.generateMap(newZoneId); 
        
        if(typeof addLogEntry === 'function') addLogEntry(`Voyage vers ${targetZone.name} réussi.`, "success", explorationLogEl, gameState.explorationLog);
        
        if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') {
            explorationUI.isFirstExplorationViewUpdate = true; 
            explorationUI.updateFullExplorationView();
        }
        if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') {
             uiUpdates.updateDisplays(); 
        }
    },

    attemptAttackEnemyBase: async function(x,y) {
        console.log(`explorationController: attemptAttackEnemyBase sur (${x},${y})`);
        if (typeof gameState === 'undefined' || !gameState.map || !mapManager.getTile(x,y) || typeof explorationEnemyData === 'undefined' || typeof itemsData === 'undefined' || typeof TILE_TYPES === 'undefined' || typeof simulateCombat !== 'function' || typeof addToInventory !== 'function' || typeof gainXP !== 'function') {
            console.error("attemptAttackEnemyBase: Dépendances manquantes.");
            if(typeof addLogEntry === 'function') addLogEntry("Erreur système lors de la tentative d'attaque.", "error", explorationLogEl, gameState.explorationLog);
            return;
        }

        const tile = mapManager.getTile(x,y);
        if (!tile || !tile.content || tile.content.type !== 'enemy_base') {
            if(typeof addLogEntry === 'function') addLogEntry("Impossible d'attaquer: ceci n'est pas une structure ennemie active.", "warning", explorationLogEl, gameState.explorationLog);
            if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateTileInteractionPanel === 'function') explorationUI.updateTileInteractionPanel(x,y);
            return;
        }
        if (tile.content.currentHealth <= 0) {
            if(typeof addLogEntry === 'function') addLogEntry("Impossible d'attaquer: base ennemie déjà détruite.", "warning", explorationLogEl, gameState.explorationLog);
            if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateTileInteractionPanel === 'function') explorationUI.updateTileInteractionPanel(x,y);
            return;
        }

        const dxPos = Math.abs(x - gameState.map.nanobotPos.x);
        const dyPos = Math.abs(y - gameState.map.nanobotPos.y);
        if (dxPos > 1 || dyPos > 1) {
            if(typeof addLogEntry === 'function') addLogEntry("Le Nexus-7 doit être sur la base ennemie ou une case adjacente pour attaquer.", "warning", explorationLogEl, gameState.explorationLog);
            return;
        }

        const baseContent = tile.content;
        const baseDetails = baseContent.details;
        console.log("Détails de la base à attaquer:", JSON.parse(JSON.stringify(baseDetails)));
        console.log("Défenseurs initiaux:", JSON.parse(JSON.stringify(baseDetails.defenders)));

        if(typeof addLogEntry === 'function') addLogEntry(baseDetails.onAttackText || `Attaque de ${baseDetails.name}...`, "map-event", explorationLogEl, gameState.explorationLog);
        
        if (baseDetails.defenders && baseDetails.defenders.length > 0) {
            if(typeof addLogEntry === 'function') addLogEntry("Des défenseurs émergent !", "warning", explorationLogEl, gameState.explorationLog);
            if (typeof sleep === 'function') await sleep(500); 

            let remainingDefenderGroups = JSON.parse(JSON.stringify(baseDetails.defenders));
            let currentGroupIndex = 0;

            while(currentGroupIndex < remainingDefenderGroups.length) {
                const defenderGroup = remainingDefenderGroups[currentGroupIndex];
                const enemyData = explorationEnemyData[defenderGroup.id];
                if (!enemyData) {
                    console.warn(`Données de défenseur inconnues pour ${defenderGroup.id}, groupe ignoré.`);
                    currentGroupIndex++;
                    continue;
                }
                console.log(`Engagement du groupe de défenseurs: ${defenderGroup.count} x ${enemyData.name}`);

                for (let i = 0; i < defenderGroup.count; i++) {
                    if (gameState.nanobotStats.currentHealth <= 0) {
                        if(typeof addLogEntry === 'function') addLogEntry("Nexus-7 hors combat. L'assaut de la base ennemie a échoué.", "error", explorationLogEl, gameState.explorationLog);
                        if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') explorationUI.updateFullExplorationView();
                        return; 
                    }
                    if(typeof addLogEntry === 'function') addLogEntry(`Affrontement avec un défenseur: ${enemyData.name} (${i + 1}/${defenderGroup.count}) du groupe ${currentGroupIndex + 1}`, "combat", explorationLogEl, gameState.explorationLog);
                    const enemyInstance = JSON.parse(JSON.stringify(enemyData)); 
                    enemyInstance.currentHealth = enemyInstance.health; 
                    
                    console.log(`Lancement du combat avec ${enemyInstance.name}. Flag isCombatInProgress avant: ${isCombatInProgress}`);
                    const combatResult = await simulateCombat(enemyInstance); 
                    console.log(`Combat avec ${enemyInstance.name} terminé. Résultat:`, combatResult, `Flag isCombatInProgress après: ${isCombatInProgress}`);

                    if (combatResult.outcome === "defeat" || gameState.nanobotStats.currentHealth <= 0) { 
                        if(typeof addLogEntry === 'function') addLogEntry("Nexus-7 vaincu. L'assaut de la base ennemie a échoué.", "error", explorationLogEl, gameState.explorationLog);
                        if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') explorationUI.updateFullExplorationView();
                        return; 
                    }
                    if (!combatResult.enemyDefeated) {
                        console.warn(`Défenseur ${enemyData.name} a survécu au combat (résultat: ${combatResult.outcome}). L'assaut pourrait être bloqué.`);
                        if(typeof addLogEntry === 'function') addLogEntry(`Le défenseur ${enemyData.name} est toujours actif. L'assaut est bloqué.`, "error", explorationLogEl, gameState.explorationLog);
                         if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') explorationUI.updateFullExplorationView();
                        return; 
                    }
                    if (typeof sleep === 'function') await sleep(300); 
                }
                currentGroupIndex++; 
            }
            if(typeof addLogEntry === 'function') addLogEntry("Tous les défenseurs de la base ont été neutralisés !", "success", explorationLogEl, gameState.explorationLog);
        } else {
            if(typeof addLogEntry === 'function') addLogEntry("La base semble non défendue de l'intérieur...", "info", explorationLogEl, gameState.explorationLog);
        }

        if (gameState.nanobotStats.currentHealth <= 0) {
            console.log("Nanobot vaincu après la phase des défenseurs, avant d'attaquer la structure.");
            return; 
        }

        console.log("Attaque de la structure de la base...");
        const damageToStructure = gameState.nanobotStats.attack * 2; 
        baseContent.currentHealth -= damageToStructure;
        if(typeof addLogEntry === 'function') addLogEntry(`Nexus-7 inflige ${damageToStructure} dégâts à la structure de ${baseDetails.name}. PV restants: ${Math.max(0, baseContent.currentHealth)}/${baseDetails.health}`, "map-event", explorationLogEl, gameState.explorationLog);
        
        if (baseContent.currentHealth <= 0) {
            baseContent.currentHealth = 0;
            if(typeof addLogEntry === 'function') addLogEntry(baseDetails.onDestroyedText || `${baseDetails.name} détruite !`, "success", explorationLogEl, gameState.explorationLog);
            if (baseDetails.loot && baseDetails.loot.length > 0) {
                if(typeof addLogEntry === 'function') addLogEntry("Butin récupéré de la base:", "success", explorationLogEl, gameState.explorationLog);
                baseDetails.loot.forEach(itemId => {
                    if (itemsData[itemId] && itemsData[itemId].onUse && (itemsData[itemId].rarity === "consumable_reward" || itemsData[itemId].consumable)) {
                        itemsData[itemId].onUse(gameState);
                    } else {
                        addToInventory(itemId);
                    }
                });
            }
            tile.actualType = TILE_TYPES.RUINS;
            tile.content = {type: 'poi', poiType: TILE_TYPES.RUINS, isInteracted: true, originalBaseId: baseContent.id }; 
            
            gainXP(baseDetails.xpReward || Math.floor(baseDetails.health / 2 + (baseDetails.defenders ? baseDetails.defenders.reduce((sum, d) => sum + d.count * 10, 0) : 0)));
            
            if (typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') {
                questController.checkQuestProgress({ type: "destroy_enemy_base", baseId: baseContent.id, zoneId: gameState.currentZoneId });
            }
        }
        if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') {
            explorationUI.updateFullExplorationView();
        }
    }
};

console.log("explorationController.js - Objet explorationController défini.");