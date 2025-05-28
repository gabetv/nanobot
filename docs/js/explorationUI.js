// js/explorationUI.js
console.log("explorationUI.js - Fichier chargé et en cours d'analyse...");

var explorationUI = {
    isFirstExplorationViewUpdate: true,
    centerRetryTimeoutId: null,

    activeTileUiElements: { 
        container: null, 
        activeExplorationTitle: null,
        exitActiveExplorationBtn: null,
        
        mainGridView: null, 
        
        detailPanel: null, 
        currentTileImage: null,
        currentTileDescription: null,
        currentTileActionsGrid: null,
        activeTileLogContainer: null, 
        activeTileLog: null,

        nanobotStatusContainer: null,
    },
    isInitializedActiveUI: false,

    initializeActiveTileUIElements: function() {
        if (this.isInitializedActiveUI) return;

        this.activeTileUiElements.container = window.activeTileExplorationUIEl;
        this.activeTileUiElements.activeExplorationTitle = window.activeExplorationTitleEl;
        this.activeTileUiElements.exitActiveExplorationBtn = window.exitActiveExplorationBtnEl;

        this.activeTileUiElements.mainGridView = document.getElementById('active-exploration-main-grid-view');
        
        this.activeTileUiElements.detailPanel = document.getElementById('active-exploration-detail-panel');
        this.activeTileUiElements.currentTileImage = window.currentTileImageEl; 
        this.activeTileUiElements.currentTileDescription = window.currentTileDescriptionEl; 
        this.activeTileUiElements.currentTileActionsGrid = window.currentTileActionsGridEl; 
        
        this.activeTileUiElements.activeTileLogContainer = window.activeTileLogContainerEl; 
        this.activeTileUiElements.activeTileLog = window.activeTileLogEl; 

        this.activeTileUiElements.nanobotStatusContainer = window.activeExplorationNanobotStatusEl;

        if (this.activeTileUiElements.exitActiveExplorationBtn && typeof this.exitActiveTileExplorationMode === 'function') {
            if (!this.activeTileUiElements.exitActiveExplorationBtn.dataset.listenerAttached) {
                this.activeTileUiElements.exitActiveExplorationBtn.addEventListener('click', () => this.exitActiveTileExplorationMode());
                this.activeTileUiElements.exitActiveExplorationBtn.dataset.listenerAttached = 'true';
            }
        }
        
        this.isInitializedActiveUI = true;
        console.log("explorationUI: Éléments de l'UI d'exploration active (refonte grille) initialisés.");
    },

    enterActiveTileExplorationMode: function(tileX, tileY) {
        this.initializeActiveTileUIElements();
        if (!this.activeTileUiElements.container) {
            console.error("UI d'exploration active non trouvée dans le DOM !");
            return;
        }
        if (!gameState || !gameState.map) {
             console.error("enterActiveTileExplorationMode: gameState ou gameState.map non défini."); return;
        }

        gameState.map.activeExplorationTileCoords = { x: tileX, y: tileY };
        this.activeTileUiElements.container.classList.remove('hidden');
        if(window.worldSectionContentEl) window.worldSectionContentEl.classList.add('blurred-background');

        if (this.activeTileUiElements.activeTileLog) this.activeTileUiElements.activeTileLog.innerHTML = ""; 
        this.addLogToActiveTileView("Analyse de la zone en cours...", "system");

        this.updateActiveTileExplorationView(tileX, tileY, true); 
        console.log(`Entrée en mode exploration active pour (${tileX}, ${tileY})`);
    },

    exitActiveTileExplorationMode: function() {
        if (!this.isInitializedActiveUI || !this.activeTileUiElements.container) return;
         if (!gameState || !gameState.map) {
             console.error("exitActiveTileExplorationMode: gameState ou gameState.map non défini."); return;
        }

        this.activeTileUiElements.container.classList.add('hidden');
        gameState.map.activeExplorationTileCoords = null;
        if(window.worldSectionContentEl) window.worldSectionContentEl.classList.remove('blurred-background');

        this.updateExplorationMapDisplay();
        this.centerMapOnPlayer(true); 
        console.log("Sortie du mode exploration active.");
    },

    updateActiveTileExplorationView: function(centerX, centerY, forceActionRefresh = false) {
        if (!this.isInitializedActiveUI) this.initializeActiveTileUIElements();
        if (!gameState || !window.mapManager || !this.activeTileUiElements.container || this.activeTileUiElements.container.classList.contains('hidden')) {
            return;
        }
        
        const currentTile = window.mapManager.getTile(centerX, centerY);
        if (!currentTile) {
            console.error(`updateActiveTileExplorationView: Tuile centrale non trouvée en (${centerX}, ${centerY})`);
            this.addLogToActiveTileView(`Erreur: Impossible de charger les données de la tuile (${centerX},${centerY}).`, "error");
            return;
        }

        if (this.activeTileUiElements.mainGridView) {
            this.activeTileUiElements.mainGridView.innerHTML = ''; 
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const adjX = centerX + dx;
                    const adjY = centerY + dy;
                    const isNanobotPos = (dx === 0 && dy === 0);
                    
                    const cellDiv = document.createElement('div');
                    cellDiv.className = 'active-explore-grid-cell';
                    if (isNanobotPos) {
                        cellDiv.classList.add('current-nanobot-pos');
                        const nanobotIcon = document.createElement('i');
                        nanobotIcon.className = 'ti ti-robot nanobot-grid-icon';
                        cellDiv.appendChild(nanobotIcon);
                    }

                    const adjTile = window.mapManager.getTile(adjX, adjY);
                    const currentZoneData = typeof window.WORLD_ZONES !== 'undefined' ? window.WORLD_ZONES[gameState.currentZoneId] : null;

                    if (currentZoneData && adjX >= 0 && adjX < currentZoneData.mapSize.width && adjY >= 0 && adjY < currentZoneData.mapSize.height && adjTile) {
                        let terrainName, contentName = "", contentClass = "", terrainIcon = "ti-map-pin";
                        const isExploredOrScanned = adjTile.isExplored || (adjTile.isScannedFromMap && gameState.gameTime <= adjTile.scannedFromMapRevealTime);
                        
                        if (isExploredOrScanned) {
                            const typeToDisplay = (adjTile.isScannedFromMap && gameState.gameTime <= adjTile.scannedFromMapRevealTime) ? adjTile.scannedFromMapActualType : adjTile.actualType;
                            terrainName = this.getTerrainTypeName(typeToDisplay);
                            terrainIcon = this.getTileIcon(typeToDisplay, adjTile.content);
                            if (adjTile.content) {
                                contentName = this.getTileContentName(typeToDisplay, adjTile.content);
                                if (contentName === terrainName && adjTile.content.type !== 'resource') contentName = ""; 
                                if (adjTile.content.type === 'enemy_patrol' || adjTile.content.type === 'enemy_base') contentClass = 'enemy';
                                else if (adjTile.content.type === 'resource') contentClass = 'resource';
                            }
                        } else {
                            terrainName = `Inconnue`;
                            terrainIcon = this.getTileIcon(adjTile.baseType, null, true); 
                        }
                        
                        cellDiv.innerHTML += `<i class="${terrainIcon}"></i>
                                             <span class="terrain-name-preview">${terrainName}</span>`;
                        if (contentName) {
                            cellDiv.innerHTML += `<span class="content-preview ${contentClass}">${contentName}</span>`;
                        }

                        let isTraversable = true; let traversalBlockReason = "";
                        if (typeof window.TILE_TYPES !== 'undefined' && typeof window.explorationController !== 'undefined') {
                            if (adjTile.actualType === window.TILE_TYPES.IMPASSABLE_DEEP_WATER || adjTile.actualType === window.TILE_TYPES.IMPASSABLE_HIGH_PEAK) {isTraversable = false;}
                            else if (adjTile.actualType === window.TILE_TYPES.DEBRIS_FIELD && !window.explorationController.nanobotHasModuleAbility('canTraverse', window.TILE_TYPES.DEBRIS_FIELD)) {isTraversable = false; traversalBlockReason="Module Foreuse requis";}
                            else if (adjTile.actualType === window.TILE_TYPES.THICK_VINES && !window.explorationController.nanobotHasModuleAbility('canTraverse', window.TILE_TYPES.THICK_VINES)) {isTraversable = false; traversalBlockReason="Module Découpeur requis";}
                        } else { isTraversable = false; traversalBlockReason="Erreur config."; }

                        if (!isNanobotPos && isTraversable) {
                            cellDiv.classList.add('can-move');
                            cellDiv.title = `Aller à (${adjX},${adjY})`;
                            cellDiv.onclick = () => {
                                if (typeof window.explorationController !== 'undefined' && typeof window.explorationController.attemptMoveInActiveExplorationByCoords === 'function') {
                                    window.explorationController.attemptMoveInActiveExplorationByCoords(adjX, adjY);
                                } else {
                                    console.error("attemptMoveInActiveExplorationByCoords non définie!");
                                }
                            };
                        } else if (!isNanobotPos && !isTraversable) {
                            cellDiv.classList.add('blocked-preview');
                            cellDiv.title = traversalBlockReason || "Infranchissable";
                        }
                    } else { 
                        cellDiv.innerHTML = `<i class="ti ti-border-outer"></i><span class="terrain-name-preview">Hors Limites</span>`;
                        cellDiv.classList.add('blocked-preview');
                    }
                    this.activeTileUiElements.mainGridView.appendChild(cellDiv);
                }
            }
        }


        if (this.activeTileUiElements.detailPanel) {
            if (this.activeTileUiElements.activeExplorationTitle) {
                this.activeTileUiElements.activeExplorationTitle.textContent = `Exploration: ${this.getTileContentName(currentTile.actualType, null)} (${centerX},${centerY})`;
            }

            const tileViewConfigKey = currentTile.actualType || 'default';
            const tileViewConfig = (typeof window.activeTileViewData !== 'undefined' && window.activeTileViewData[tileViewConfigKey]) || 
                                   (typeof window.activeTileViewData !== 'undefined' ? window.activeTileViewData.default : {image: "images/tile_view/default_detail.png"});

            if (this.activeTileUiElements.currentTileImage) {
                this.activeTileUiElements.currentTileImage.style.backgroundImage = `url('${tileViewConfig.image || (typeof window.activeTileViewData !== 'undefined' ? window.activeTileViewData.default.image : "")}')`;
            }
            if (this.activeTileUiElements.currentTileDescription) {
                let desc = `<strong>${this.getTileContentName(currentTile.actualType, null)} (${centerX},${centerY})</strong><br>`;
                desc += (typeof window.MAP_FEATURE_DATA !== 'undefined' && window.MAP_FEATURE_DATA[currentTile.actualType]?.description) || "Une zone d'apparence ordinaire.";
                if (currentTile.content) { desc += `<br>Présence détectée: ${this.getTileContentName(currentTile.actualType, currentTile.content)}.`; }
                if (currentTile.isFullyExplored) { desc += "<br><em class='text-green-400'>Cette zone a été entièrement explorée.</em>";
                } else if (currentTile.usedActions && currentTile.usedActions['scan_local_active'] && (!currentTile.hiddenFeatures || currentTile.hiddenFeatures.length === 0) && (!currentTile.revealedFeatures || currentTile.revealedFeatures.length === 0)) {
                     desc += "<br><em class='text-gray-400'>Le scan local n'a rien révélé de plus.</em>";
                }
                if (currentTile.hasActiveTrap) { desc += "<br><strong class='text-red-500 animate-pulse'>DANGER: Piège actif détecté !</strong>"; }
                this.activeTileUiElements.currentTileDescription.innerHTML = desc;
            }

            if (this.activeTileUiElements.currentTileActionsGrid) {
                this.activeTileUiElements.currentTileActionsGrid.innerHTML = ''; 
                if (currentTile.isFullyExplored) {
                     this.activeTileUiElements.currentTileActionsGrid.innerHTML = `<p class="text-sm text-green-400 italic p-2 text-center">Rien de plus à faire ici.</p>`;
                } else {
                    let availableActions = [];
                    const tileViewDataForType = window.activeTileViewData[currentTile.actualType] || window.activeTileViewData.default;
                    const baseActions = currentTile.baseActions || tileViewDataForType?.baseActions || [];
    
                    if (baseActions && typeof window.tileActiveExplorationOptions !== 'undefined') {
                        baseActions.forEach(actionId => {
                            const actionDef = window.tileActiveExplorationOptions[actionId];
                            if (actionDef) {
                                const isRepeatable = actionDef.canRepeat;
                                const isMaxedOut = isRepeatable && actionId === 'search_area_active' && (currentTile.searchAttempts || 0) >= (actionDef.maxRepeats || 3);
                                const isUsed = !isRepeatable && currentTile.usedActions && currentTile.usedActions[actionId];
    
                                if (!isMaxedOut && !isUsed) {
                                    availableActions.push({ ...actionDef, id: actionId, originalActionId: actionId });
                                }
                            }
                        });
                    }
                    if (currentTile.content && typeof window.tileActiveExplorationOptions !== 'undefined' && typeof window.TILE_TYPES_TO_RESOURCE_KEY !== 'undefined' && typeof window.MAP_FEATURE_DATA !== 'undefined') {
                        if (currentTile.content.type === 'resource' && currentTile.content.amount > 0) {
                            const actionDef = window.tileActiveExplorationOptions['collect_visible_resource_active'];
                            if(actionDef) availableActions.push({ ...actionDef, name: actionDef.name.replace('{resourceName}', (window.TILE_TYPES_TO_RESOURCE_KEY[currentTile.content.resourceType] || "Ressource") ), originalActionId: 'collect_visible_resource_active' });
                        } else if (currentTile.content.type === 'enemy_patrol') {
                            const actionDef = window.tileActiveExplorationOptions['engage_visible_enemy_active'];
                            if(actionDef && currentTile.content.details) availableActions.push({ ...actionDef, name: actionDef.name.replace('{enemyName}', currentTile.content.details.name), originalActionId: 'engage_visible_enemy_active' });
                        } else if (currentTile.content.type === 'poi' && !currentTile.content.isInteracted) {
                            const actionDef = window.tileActiveExplorationOptions['interact_poi_active'];
                            if(actionDef && currentTile.content.poiType) availableActions.push({ ...actionDef, name: actionDef.name.replace('{poiName}', window.MAP_FEATURE_DATA[currentTile.content.poiType]?.name || "POI"), originalActionId: 'interact_poi_active'});
                        } else if (currentTile.content.type === 'enemy_base' && currentTile.content.currentHealth > 0) {
                             const actionDef = window.tileActiveExplorationOptions['attack_enemy_base_active'];
                            if(actionDef && currentTile.content.details) availableActions.push({ ...actionDef, name: actionDef.name.replace('{baseName}', currentTile.content.details.name), originalActionId: 'attack_enemy_base_active' });
                        }
                    }
                    if(currentTile.revealedFeatures && typeof window.tileActiveExplorationOptions !== 'undefined'){
                        currentTile.revealedFeatures.forEach((feature, index) => {
                            let actionDef, actionName, actionIdToUse, originalActionId;
                            if (feature.type === 'small_resource_cache') {
                                actionDef = window.tileActiveExplorationOptions['collect_revealed_resource'];
                                if(actionDef) { actionName = actionDef.name.replace('{resourceName}', feature.resourceType || 'Cache'); originalActionId = 'collect_revealed_resource'; actionIdToUse = `${originalActionId}_feat_${index}`; }
                            } else if (feature.type === 'ancient_data_fragment') {
                                actionDef = window.tileActiveExplorationOptions['decipher_data_fragment'];
                                if(actionDef) { actionName = actionDef.name; originalActionId = 'decipher_data_fragment'; actionIdToUse = `${originalActionId}_feat_${index}`; }
                            } else if (feature.type === 'hidden_trap' && currentTile.hasActiveTrap) {
                                actionDef = window.tileActiveExplorationOptions['disarm_trap_active'];
                                if(actionDef) { actionName = actionDef.name; originalActionId = 'disarm_trap_active'; actionIdToUse = `${originalActionId}_feat_${index}`; }
                            }
                            if (actionDef) {
                                 availableActions.push({ ...actionDef, name: actionName, id: actionIdToUse, originalActionId: originalActionId, dynamicData: feature });
                            }
                        });
                    }
    
                    if (availableActions.length > 0) {
                        availableActions.forEach(action => {
                            const actionButton = document.createElement('button');
                            actionButton.className = 'btn btn-secondary btn-sm w-full text-left p-2 flex items-center gap-x-2 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-blue';
                            let costString = ""; let canAfford = true; let meetsCondition = true;
    
                            if(action.cost && typeof getCostString === 'function'){
                                costString = ` (Coût: ${getCostString(action.cost, false, true)})`;
                                for(const res in action.cost){ if((gameState.resources[res] || 0) < action.cost[res]) canAfford = false; }
                            }
                            if(action.condition && typeof action.condition === 'function'){
                                if(!action.condition(gameState)) meetsCondition = false;
                            }
                            actionButton.innerHTML = `<i class="${action.icon || 'ti-question-mark'} text-lg text-blue-300 flex-shrink-0"></i><div class="flex-grow"><strong class="text-sm text-gray-100">${action.name}</strong><p class="text-xs text-gray-400">${action.description}${costString}</p></div>`;
                            if(!canAfford || !meetsCondition) {
                                actionButton.classList.add('btn-disabled', 'opacity-50'); actionButton.disabled = true;
                                if(!canAfford && action.cost) actionButton.title = `Manque: ${Object.entries(action.cost).filter(([r,v]) => (gameState.resources[r]||0) < v).map(([r,v]) => `${v - (gameState.resources[r]||0)} ${r}`).join(', ')}`;
                                else if(!meetsCondition) actionButton.title = "Conditions non remplies.";
                            }
                            actionButton.onclick = () => {
                                if (!actionButton.disabled && typeof window.explorationController !== 'undefined' && typeof window.explorationController.handleActionOnActiveTile === 'function') {
                                    window.explorationController.handleActionOnActiveTile(action.originalActionId || action.id, centerX, centerY, action.dynamicData || null);
                                }
                            };
                            this.activeTileUiElements.currentTileActionsGrid.appendChild(actionButton);
                        });
                    } else if (!currentTile.isFullyExplored) {
                         this.activeTileUiElements.currentTileActionsGrid.innerHTML = `<p class="text-sm text-gray-400 italic p-2 text-center">Aucune action disponible pour le moment.</p>`;
                    }
                }
            }
        }

        if (this.activeTileUiElements.nanobotStatusContainer && gameState.nanobotStats && typeof window.MAX_MOBILITY_POINTS !== 'undefined') {
            this.activeTileUiElements.nanobotStatusContainer.innerHTML =
                `PV: <span class="font-semibold">${Math.floor(gameState.nanobotStats.currentHealth)}/${gameState.nanobotStats.health}</span> | ` +
                `Énergie: <span class="font-semibold">${Math.floor(gameState.resources.energy)}</span> | ` +
                `Mobilité: <span class="font-semibold">${Math.floor(gameState.resources.mobility)}/${window.MAX_MOBILITY_POINTS}</span>`;
        }
    },

    addLogToActiveTileView: function(message, type = "info") {
        if (!this.activeTileUiElements.activeTileLog) this.initializeActiveTileUIElements();
        if (!this.activeTileUiElements.activeTileLog) { console.warn("addLogToActiveTileView: Élément activeTileLog non trouvé."); return;}

        const entry = document.createElement('p');
        entry.className = 'text-xs mb-1';
        if (type === "error") entry.classList.add("text-red-400", "font-semibold");
        else if (type === "success") entry.classList.add("text-green-400");
        else if (type === "warning") entry.classList.add("text-yellow-400");
        else if (type === "system") entry.classList.add("text-gray-500", "italic");
        else entry.classList.add("text-gray-300");
        entry.innerHTML = message;
        this.activeTileUiElements.activeTileLog.appendChild(entry);
        this.activeTileUiElements.activeTileLog.scrollTop = this.activeTileUiElements.activeTileLog.scrollHeight;
    },

    updateFullExplorationView: function() {
        if (!gameState || !gameState.map) { console.warn("explorationUI.updateFullExplorationView: gameState ou gameState.map non défini."); return; }
        if (this.activeTileUiElements.container && !this.activeTileUiElements.container.classList.contains('hidden')) { return; }

        if (typeof this.updateExplorationMapDisplay !== 'function' || typeof this.updateExplorationLogDisplay !== 'function' || 
            typeof this.updateTileInteractionPanel !== 'function' || typeof this.updateZoneSelectionUI !== 'function') {
            console.error("explorationUI.updateFullExplorationView: Fonctions de mise à jour manquantes."); return;
        }
        this.updateExplorationMapDisplay();
        this.updateExplorationLogDisplay();
        if (gameState.map.selectedTile) { this.updateTileInteractionPanel(gameState.map.selectedTile.x, gameState.map.selectedTile.y);
        } else if (gameState.map.nanobotPos) { this.updateTileInteractionPanel(gameState.map.nanobotPos.x, gameState.map.nanobotPos.y);
        } else { this.updateTileInteractionPanel(); }
        
        const explorationSubTab = document.getElementById('exploration-subtab');
        if (this.isFirstExplorationViewUpdate && explorationSubTab?.classList.contains('active')) {
            setTimeout(() => { this.centerMapOnPlayer(true); }, 50);
            this.isFirstExplorationViewUpdate = false;
        }
    },

    updateExplorationMapDisplay: function() {
        const mapGrid = window.mapGridEl; const nanobotMapPos = window.nanobotMapPosEl;
        const tileInfoDisp = window.tileInfoDisplayEl; const explorationTitle = window.explorationTitleEl;
        if(!mapGrid || !nanobotMapPos || !tileInfoDisp || !explorationTitle ) { console.warn("explorationUI.updateExplorationMapDisplay: Eléments DOM carte manquants."); return; }
        
        if (typeof window.WORLD_ZONES === 'undefined' || !gameState || !gameState.map || !gameState.currentZoneId || !window.WORLD_ZONES[gameState.currentZoneId]) { 
            mapGrid.innerHTML = "<p class='text-red-400 text-xs'>Erreur: Données de zone indisponibles.</p>"; return;
        }
        if(typeof this.updateZoneSelectionUI === 'function') this.updateZoneSelectionUI();

        const currentZone = window.WORLD_ZONES[gameState.currentZoneId]; 
        explorationTitle.textContent = `Carte: ${currentZone.name}`;
        
        const mapScrollContainer = window.mapScrollContainerEl;
        if(mapGrid && mapScrollContainer) {
            mapGrid.innerHTML = ''; const fixedTileSize = 22;
            document.documentElement.style.setProperty('--map-tile-effective-size', `${fixedTileSize}px`);
            mapGrid.style.gridTemplateRows = `repeat(${currentZone.mapSize.height}, ${fixedTileSize}px)`;
            mapGrid.style.gridTemplateColumns = `repeat(${currentZone.mapSize.width}, ${fixedTileSize}px)`;
            mapGrid.style.width = `${currentZone.mapSize.width * (fixedTileSize + 1) -1}px`;
            mapGrid.style.height = `${currentZone.mapSize.height * (fixedTileSize + 1) -1}px`;
        } else { return; }

        let scanButton = window.scanMapButtonEl;
        if (scanButton && typeof window.SCAN_MOBILITY_COST !== 'undefined' && typeof window.SCAN_COOLDOWN_DURATION_SECONDS !== 'undefined' && typeof window.TICK_SPEED !== 'undefined' && gameState && gameState.nanobotStats) {
            const stats = gameState.nanobotStats; 
            const scanCost = window.SCAN_MOBILITY_COST; 
            const scanCooldownTimeInSeconds = window.SCAN_COOLDOWN_DURATION_SECONDS; 
            const onCooldown = gameState.gameTime < (stats.lastMapScanTime || 0) + scanCooldownTimeInSeconds;
            const canAffordScan = gameState.resources.mobility >= scanCost; 
            scanButton.disabled = onCooldown || !canAffordScan;
            scanButton.classList.toggle('btn-disabled', onCooldown || !canAffordScan);
            scanButton.classList.toggle('btn-info', !onCooldown && canAffordScan);
            
            if (onCooldown) {
                 scanButton.textContent = `Scan Carte (CD: ${formatTime(Math.ceil(((stats.lastMapScanTime || 0) + scanCooldownTimeInSeconds - gameState.gameTime))) })`;
            } else if (!canAffordScan) {
                 scanButton.textContent = `Scan Carte (${scanCost} MOB) - Insuff.`; 
                 scanButton.title = `Nécessite ${scanCost} Mobilité. Vous avez ${Math.floor(gameState.resources.mobility)}.`;
            } else {
                 scanButton.textContent = `Scanner Carte (${scanCost} MOB)`; 
                 scanButton.title = `Scanner la zone autour du Nanobot. Coût: ${scanCost} Mobilité.`;
            }
            
            if (!scanButton.dataset.listenerAttached) {
                scanButton.addEventListener('click', () => { 
                    if (!scanButton.disabled && typeof window.explorationController !== 'undefined' && typeof window.explorationController.performScanOnWorldMap === 'function') {
                        window.explorationController.performScanOnWorldMap(); 
                    }
                });
                scanButton.dataset.listenerAttached = 'true';
            }
        }
        if (!gameState.map.tiles[gameState.currentZoneId] || !Array.isArray(gameState.map.tiles[gameState.currentZoneId]) || gameState.map.tiles[gameState.currentZoneId].length === 0 ) {
            mapGrid.innerHTML = "<p class='text-yellow-400 italic text-xs'>Initialisation de la carte pour cette zone...</p>";
             if(typeof window.mapManager !== 'undefined' && typeof window.mapManager.generateMap === 'function') {
                 console.warn("Appel de generateMap depuis updateExplorationMapDisplay car la carte de zone n'existe pas.");
                 window.mapManager.generateMap(gameState.currentZoneId);
             }
            return;
        }
        const zoneTiles = gameState.map.tiles[gameState.currentZoneId];
        for (let y = 0; y < currentZone.mapSize.height; y++) {
            if (!Array.isArray(zoneTiles[y]) || zoneTiles[y].length !== currentZone.mapSize.width) continue;
            for (let x = 0; x < currentZone.mapSize.width; x++) {
                const tileDiv = document.createElement('div');
                const tileDataFromManager = this.getTile(x,y);
                const tileClassesString = tileDataFromManager ? this.getTileDisplayClassOnWorldMap(x, y) : 'unexplored unexplored-flat';
                tileDiv.className = `map-tile ${tileClassesString}`;
                tileDiv.dataset.x = x; tileDiv.dataset.y = y;
                tileDiv.addEventListener('click', () => { if(typeof window.explorationController !== 'undefined' && typeof window.explorationController.handleTileClickOnWorldMap === 'function') window.explorationController.handleTileClickOnWorldMap(x, y);});
                tileDiv.addEventListener('mouseover', () => { if(tileInfoDisp) tileInfoDisp.textContent = `(${x},${y}) ${this.getTileInfoForWorldMap(x,y)}`; });
                tileDiv.addEventListener('mouseout', () => { if(tileInfoDisp) tileInfoDisp.textContent = "Survolez une case."; });
                mapGrid.appendChild(tileDiv);
            }
        }
        if (nanobotMapPos && gameState && gameState.map && gameState.map.nanobotPos) nanobotMapPos.textContent = `(${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y}) / ${currentZone.name}`;
        
        const centerBtn = window.centerMapBtnEl;
        if (centerBtn && !centerBtn.dataset.listenerAttached) {
            centerBtn.addEventListener('click', () => this.centerMapOnPlayer(false));
            centerBtn.dataset.listenerAttached = 'true';
        }
    },

    getTile: function(x, y) {
        if (typeof window.mapManager !== 'undefined' && typeof window.mapManager.getTile === 'function') {
            return window.mapManager.getTile(x, y);
        }
        console.warn("explorationUI.getTile: mapManager ou mapManager.getTile non défini.");
        return null;
    },
    
    getTileDisplayClassOnWorldMap: function(x,y) {
        if (!gameState || !gameState.map || !this.getTile(x,y) || typeof window.TILE_TYPES === 'undefined') return 'unexplored unexplored-flat';
        const tile = this.getTile(x,y); let classes = [];
        const isNanobotCurrentPos = gameState.map.nanobotPos && gameState.map.nanobotPos.x === x && gameState.map.nanobotPos.y === y;
        if (isNanobotCurrentPos) classes.push('nanobot');

        if (tile.isExplored) {
            classes.push('explored'); const actualType = tile.actualType;
            switch (actualType) {
                case window.TILE_TYPES.EMPTY_GRASSLAND: classes.push('grassland'); break;
                case window.TILE_TYPES.EMPTY_DESERT: classes.push('desert'); break;
                case window.TILE_TYPES.EMPTY_WATER: classes.push('water'); break;
                case window.TILE_TYPES.FOREST: classes.push('forest'); break;
                case window.TILE_TYPES.MOUNTAIN: classes.push('mountain'); break;
                case window.TILE_TYPES.RUINS: classes.push('ruins'); break;
                case window.TILE_TYPES.DEBRIS_FIELD: classes.push('debris-field'); break;
                case window.TILE_TYPES.THICK_VINES: classes.push('thick-vines'); break;
                case window.TILE_TYPES.IMPASSABLE_DEEP_WATER: classes.push('impassable-water', 'explored-impassable'); break;
                case window.TILE_TYPES.IMPASSABLE_HIGH_PEAK: classes.push('impassable-mountain', 'explored-impassable'); break;
                case window.TILE_TYPES.PLAYER_BASE: classes.push('player-base-tile'); break; 
                default: classes.push(this.getBaseTerrainClass(actualType) || 'grassland'); break;
            }
            if (tile.isFullyExplored && !isNanobotCurrentPos) classes.push('fully-explored-overlay');
        } else {
            classes.push('unexplored');
            switch (tile.baseType) {
                case window.TILE_TYPES.PRE_EMPTY: classes.push('unexplored-flat'); break;
                case window.TILE_TYPES.PRE_WATER: classes.push('unexplored-water'); break;
                case window.TILE_TYPES.PRE_ROUGH_TERRAIN: classes.push('unexplored-rough'); break;
                case window.TILE_TYPES.PRE_HIGH_MOUNTAIN: classes.push('unexplored-impassable'); break;
                case window.TILE_TYPES.PRE_DEBRIS_FIELD: classes.push('unexplored-debris'); break;
                case window.TILE_TYPES.PRE_THICK_VINES: classes.push('unexplored-vines'); break;
                case window.TILE_TYPES.PRE_RUIN_SILHOUETTE: classes.push('unexplored-ruin-outline'); break;
                case window.TILE_TYPES.PRE_HOSTILE_STRUCTURE: classes.push('unexplored-enemy-base-outline'); break;
                default: classes.push('unexplored-flat'); break;
            }
            if (tile.isScannedFromMap && tile.scannedFromMapActualType !== null && gameState.gameTime <= tile.scannedFromMapRevealTime) {
                classes.push('scanned-on-map');
                 switch(tile.scannedFromMapActualType) {
                    case window.TILE_TYPES.RESOURCE_BIOMASS_PATCH: classes.push('scanned-map-actual-biomass'); break;
                    case window.TILE_TYPES.RESOURCE_NANITE_DEPOSIT: classes.push('scanned-map-actual-nanites'); break;
                    case window.TILE_TYPES.RESOURCE_CRYSTAL_VEIN: classes.push('scanned-map-actual-crystal'); break;
                    case window.TILE_TYPES.ENEMY_PATROL_WEAK: case window.TILE_TYPES.ENEMY_PATROL_MEDIUM: classes.push('scanned-map-actual-enemy'); break;
                    case window.TILE_TYPES.UPGRADE_CACHE: classes.push('scanned-map-actual-upgrade'); break;
                    case window.TILE_TYPES.ENEMY_OUTPOST_TILE: classes.push('scanned-map-actual-enemy-base'); break;
                    case window.TILE_TYPES.IMPASSABLE_DEEP_WATER: classes.push('scanned-map-actual-impassable-water'); break;
                    case window.TILE_TYPES.IMPASSABLE_HIGH_PEAK: classes.push('scanned-map-actual-impassable-mountain'); break;
                    default: classes.push('scanned-map-actual-empty'); break;
                 }
            }
        }
        if (tile.content?.type === 'resource') classes.push('has-active-resource', `resource-${(window.TILE_TYPES_TO_RESOURCE_KEY && window.TILE_TYPES_TO_RESOURCE_KEY[tile.actualType]) || 'unknown'}`);
        if (tile.content?.type === 'enemy_base') classes.push('enemy-base');
        if (tile.content?.type === 'poi' && window.MAP_FEATURE_DATA && window.MAP_FEATURE_DATA[tile.content.poiType]) classes.push(`poi-${tile.content.poiType.toLowerCase().replace(/[^a-z0-9]/gi, '-')}`);


        return classes.join(' ');
    },

    getTileInfoForWorldMap: function(x,y) {
        if (!gameState || !gameState.map || !this.getTile(x,y) || typeof window.TILE_TYPES === 'undefined' || typeof window.MAP_FEATURE_DATA === 'undefined') return "Données indisponibles.";
        const tile = this.getTile(x,y); let info = "";
        if (tile.isExplored) {
            info = this.getTileContentName(tile.actualType, tile.content);
            if (tile.isFullyExplored) info += " (Explorée)"; else info += " (Visitée)";
            if (tile.content) {
                if (tile.content.type === 'resource' && tile.content.amount > 0) info += ` - ${tile.content.amount} u.`;
                else if (tile.content.type === 'enemy_patrol' && tile.content.details) info += ` - ${tile.content.details.name}`;
                else if (tile.content.type === 'enemy_base' && tile.content.details) info += ` - PV: ${tile.content.currentHealth}/${tile.content.details.health}`;
            }
        } else {
            info = "Zone Inconnue";
            if (tile.baseType) info += ` (${this.getTerrainTypeName(tile.baseType)})`;
            if (tile.structureType && typeof window.MAP_FEATURE_DATA !== 'undefined' && window.MAP_FEATURE_DATA[tile.structureType]?.name) info += ` | Struct: ${window.MAP_FEATURE_DATA[tile.structureType].name}`;
            if (tile.isScannedFromMap && tile.scannedFromMapActualType !== null && gameState.gameTime <= tile.scannedFromMapRevealTime) {
                info += ` | Scan: ${this.getTileContentName(tile.scannedFromMapActualType, null) || "Signal?"}`;
            }
        }
        return info.trim();
    },

    getTerrainTypeName: function(baseOrActualType) {
        if (typeof window.tileData === 'undefined' || !window.tileData[baseOrActualType]) return "Terrain Inconnu";
        return window.tileData[baseOrActualType].name || "Terrain Inconnu";
    },

    getStructureTypeName: function(structureType) { 
        return (typeof window.MAP_FEATURE_DATA !== 'undefined' && window.MAP_FEATURE_DATA[structureType]) ? window.MAP_FEATURE_DATA[structureType].name || "Struct. Non Ident." : "Struct. Inconnue";
    },

    getTileContentName: function(actualType, content) {
        if (content?.details?.name) return content.details.name;
        if (content?.type === 'resource' && content.resourceType && typeof window.TILE_TYPES_TO_RESOURCE_KEY !== 'undefined' && window.TILE_TYPES_TO_RESOURCE_KEY[content.resourceType]) {
            const rn = window.TILE_TYPES_TO_RESOURCE_KEY[content.resourceType];
            return rn ? rn.charAt(0).toUpperCase() + rn.slice(1) : "Ressource Inconnue";
        }
        if (content?.type === 'poi' && content.poiType && typeof window.MAP_FEATURE_DATA !== 'undefined' && window.MAP_FEATURE_DATA[content.poiType]?.name) return window.MAP_FEATURE_DATA[content.poiType].name;
        
        return this.getTerrainTypeName(actualType);
    },

    getTileIcon: function(type, content, isUnexploredBase = false) {
        if (isUnexploredBase) {
            if (typeof window.tileData !== 'undefined' && window.tileData[type]?.icon) return window.tileData[type].icon; 
            return "ti ti-help-circle";
        }
        if (content) {
            if (content.type === 'resource') return "ti ti-package";
            if (content.type === 'enemy_patrol') return "ti ti-skull";
            if (content.type === 'enemy_base') return "ti ti-castle";
            if (content.type === 'poi') {
                if(typeof window.MAP_FEATURE_DATA !== 'undefined' && window.MAP_FEATURE_DATA[content.poiType]?.icon) return window.MAP_FEATURE_DATA[content.poiType].icon;
                return "ti ti-flag-question";
            }
        }
        if (typeof window.tileData !== 'undefined' && window.tileData[type]?.icon) return window.tileData[type].icon;
        return "ti ti-map-pin";
    },

    centerMapOnPlayer: function(instant = false) {
        if (!window.mapScrollContainerEl || !gameState || !gameState.map || !gameState.map.nanobotPos) return;
        const mapGrid = window.mapGridEl;
        if(!mapGrid) return;

        const nanobotX = gameState.map.nanobotPos.x;
        const nanobotY = gameState.map.nanobotPos.y;
        const tileEffectiveSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--map-tile-effective-size')) || 22;
        const gap = 1;

        const targetScrollX = nanobotX * (tileEffectiveSize + gap) + (tileEffectiveSize / 2) - (window.mapScrollContainerEl.offsetWidth / 2);
        const targetScrollY = nanobotY * (tileEffectiveSize + gap) + (tileEffectiveSize / 2) - (window.mapScrollContainerEl.offsetHeight / 2);

        window.mapScrollContainerEl.scrollTo({
            left: Math.max(0, targetScrollX),
            top: Math.max(0, targetScrollY),
            behavior: instant ? 'auto' : 'smooth'
        });
    },

    updateExplorationLogDisplay: function() {
        if (!window.explorationLogEl || !gameState || !Array.isArray(gameState.explorationLog)) return;
        window.explorationLogEl.innerHTML = '';
        const logToDisplay = gameState.explorationLog.slice(-50);
        logToDisplay.forEach(entryText => {
            const p = document.createElement('p');
            p.innerHTML = entryText; 
            window.explorationLogEl.appendChild(p);
        });
        window.explorationLogEl.scrollTop = window.explorationLogEl.scrollHeight;
    },

    updateTileInteractionPanel: function(x, y) {
        if (!window.tileInteractionDetailsEl || !window.tileInteractionActionsEl) return;
        window.tileInteractionDetailsEl.innerHTML = ''; window.tileInteractionActionsEl.innerHTML = '';

        if (x === undefined || y === undefined || !gameState || !gameState.map) {
            window.tileInteractionDetailsEl.innerHTML = '<p class="text-gray-500 italic">Sélectionnez une case sur la carte.</p>';
            return;
        }
        const tile = this.getTile(x,y);
        if (!tile) {
            window.tileInteractionDetailsEl.innerHTML = '<p class="text-red-500">Erreur: Données de case invalides.</p>';
            return;
        }
        let detailsHtml = `<h4 class="text-sm font-semibold mb-1">${this.getTileContentName(tile.actualType, tile.content)} (${x},${y})</h4>`;
        detailsHtml += `<p class="text-xs text-gray-400 mb-1">Type: ${this.getTerrainTypeName(tile.actualType)}</p>`;
        if(tile.isExplored) detailsHtml += `<p class="text-xs text-green-400">Statut: Visitée ${tile.isFullyExplored ? '(Complètement explorée)' : ''}</p>`;
        else detailsHtml += `<p class="text-xs text-yellow-400">Statut: Non visitée ${tile.isScannedFromMap ? '(Scannée)' : ''}</p>`;
        if (tile.content) {
            detailsHtml += `<p class="text-xs">Contenu: ${this.getTileContentName(tile.actualType, tile.content)}`;
            if (tile.content.type === 'resource') detailsHtml += ` (${tile.content.amount} unités)`;
            if (tile.content.type === 'enemy_base' && tile.content.details) detailsHtml += ` (PV: ${tile.content.currentHealth}/${tile.content.details.health})`;
            detailsHtml += `</p>`;
        }
        if (tile.revealedFeatures && tile.revealedFeatures.length > 0) {
            detailsHtml += `<p class="text-xs mt-1">Découvertes (<i class="ti ti-radar-2"></i>):</p><ul class="list-disc list-inside text-xs pl-2">`;
            tile.revealedFeatures.forEach(feat => { detailsHtml += `<li>${feat.name || feat.type}</li>`;});
            detailsHtml += `</ul>`;
        }
        window.tileInteractionDetailsEl.innerHTML = detailsHtml;

        const isNanobotCurrentPos = gameState.map.nanobotPos && x === gameState.map.nanobotPos.x && y === gameState.map.nanobotPos.y;
        if (isNanobotCurrentPos) {
            const enterExplorationBtn = document.createElement('button');
            enterExplorationBtn.className = 'btn btn-primary btn-xs w-full';
            enterExplorationBtn.innerHTML = `<i class="ti ti-target mr-1"></i> Explorer Activement`;
            enterExplorationBtn.onclick = () => this.enterActiveTileExplorationMode(x,y);
            window.tileInteractionActionsEl.appendChild(enterExplorationBtn);
        } else if (tile.isExplored && tile.content && tile.content.type === 'enemy_base' && tile.content.currentHealth > 0) {
            const attackBaseBtn = document.createElement('button');
            attackBaseBtn.className = 'btn btn-danger btn-xs w-full';
            attackBaseBtn.innerHTML = `<i class="ti ti-sword mr-1"></i> Attaquer Base`;
            attackBaseBtn.onclick = () => {
                if (typeof window.explorationController !== 'undefined' && typeof window.explorationController.attemptAttackEnemyBase === 'function') {
                    window.explorationController.attemptAttackEnemyBase(x, y);
                }
            };
            window.tileInteractionActionsEl.appendChild(attackBaseBtn);
        } else {
             window.tileInteractionActionsEl.innerHTML = '<p class="text-xs text-gray-500 italic text-center">Placez Nexus-7 ici pour plus d\'options.</p>';
        }
    },

    updateZoneSelectionUI: function() {
        if (!window.zoneListEl || typeof window.WORLD_ZONES === 'undefined' || !gameState) return; 
        window.zoneListEl.innerHTML = '';
        for (const zoneId in window.WORLD_ZONES) { 
            const zone = window.WORLD_ZONES[zoneId]; 
            const button = document.createElement('button');
            button.className = `btn btn-xs mr-1 mb-1 ${gameState.currentZoneId === zoneId ? 'btn-primary' : (gameState.unlockedZones.includes(zoneId) ? 'btn-secondary' : 'btn-disabled')}`;
            if (!gameState.unlockedZones.includes(zoneId)) button.disabled = true;
            button.textContent = zone.name;
            button.title = zone.description || zone.name;
            if (gameState.unlockedZones.includes(zoneId) && gameState.currentZoneId !== zoneId) {
                button.onclick = () => {
                    if (typeof window.explorationController !== 'undefined' && typeof window.explorationController.attemptTravelToZone === 'function') {
                        window.explorationController.attemptTravelToZone(zoneId);
                    }
                };
            }
            window.zoneListEl.appendChild(button);
        }
    },

    getBaseTerrainClass: function(actualType) {
        if (typeof window.TILE_TYPES === 'undefined') return 'grassland';
        switch (actualType) {
            case window.TILE_TYPES.EMPTY_GRASSLAND: case window.TILE_TYPES.FOREST: case window.TILE_TYPES.RESOURCE_BIOMASS_PATCH: return 'grassland';
            case window.TILE_TYPES.EMPTY_DESERT: return 'desert';
            case window.TILE_TYPES.EMPTY_WATER: return 'water';
            case window.TILE_TYPES.MOUNTAIN: case window.TILE_TYPES.RESOURCE_CRYSTAL_VEIN: return 'mountain';
            case window.TILE_TYPES.RUINS: case window.TILE_TYPES.POI_ANCIENT_STRUCTURE: return 'ruins';
            case window.TILE_TYPES.DEBRIS_FIELD: return 'debris-field';
            case window.TILE_TYPES.THICK_VINES: return 'thick-vines';
            default: return 'grassland';
        }
    }
};
window.explorationUI = explorationUI;

console.log("explorationUI.js - Objet explorationUI défini.");