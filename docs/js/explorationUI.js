// js/explorationUI.js
console.log("explorationUI.js - Fichier chargé et en cours d'analyse...");

var explorationUI = {
    isFirstExplorationViewUpdate: true,
    centerRetryTimeoutId: null,

    activeTileUiElements: {
        container: null, currentTileView: null, currentTileImage: null,
        currentTileDescription: null, currentTileActionsGrid: null, currentTileLog: null,
        adjacentPreviewsContainer: null, previewNorth: null, previewSouth: null,
        previewEast: null, previewWest: null, navNorthBtn: null, navSouthBtn: null,
        navEastBtn: null, navWestBtn: null, nanobotStatusContainer: null,
        exitActiveExplorationBtn: null,
    },
    isInitializedActiveUI: false,

    initializeActiveTileUIElements: function() {
        if (this.isInitializedActiveUI) return;

        this.activeTileUiElements.container = document.getElementById('active-tile-exploration-ui');
        this.activeTileUiElements.currentTileView = document.getElementById('current-tile-view');
        this.activeTileUiElements.currentTileImage = document.getElementById('current-tile-image');
        this.activeTileUiElements.currentTileDescription = document.getElementById('current-tile-description');
        this.activeTileUiElements.currentTileActionsGrid = document.getElementById('current-tile-actions-grid');
        this.activeTileUiElements.currentTileLog = document.getElementById('active-tile-log');
        this.activeTileUiElements.adjacentPreviewsContainer = document.getElementById('adjacent-previews-container');
        this.activeTileUiElements.previewNorth = document.getElementById('preview-north');
        this.activeTileUiElements.previewSouth = document.getElementById('preview-south');
        this.activeTileUiElements.previewEast = document.getElementById('preview-east');
        this.activeTileUiElements.previewWest = document.getElementById('preview-west');
        this.activeTileUiElements.navNorthBtn = document.getElementById('active-explore-nav-north');
        this.activeTileUiElements.navSouthBtn = document.getElementById('active-explore-nav-south');
        this.activeTileUiElements.navEastBtn = document.getElementById('active-explore-nav-east');
        this.activeTileUiElements.navWestBtn = document.getElementById('active-explore-nav-west');
        this.activeTileUiElements.nanobotStatusContainer = document.getElementById('active-exploration-nanobot-status');
        this.activeTileUiElements.exitActiveExplorationBtn = document.getElementById('exit-active-exploration-btn');

        if (this.activeTileUiElements.exitActiveExplorationBtn && typeof this.exitActiveTileExplorationMode === 'function') {
            this.activeTileUiElements.exitActiveExplorationBtn.addEventListener('click', () => this.exitActiveTileExplorationMode());
        }
        if (this.activeTileUiElements.navNorthBtn && typeof explorationController !== 'undefined') {
            this.activeTileUiElements.navNorthBtn.addEventListener('click', () => explorationController.attemptMoveInActiveExploration('north'));
        }
        if (this.activeTileUiElements.navSouthBtn) this.activeTileUiElements.navSouthBtn.addEventListener('click', () => explorationController.attemptMoveInActiveExploration('south'));
        if (this.activeTileUiElements.navEastBtn) this.activeTileUiElements.navEastBtn.addEventListener('click', () => explorationController.attemptMoveInActiveExploration('east'));
        if (this.activeTileUiElements.navWestBtn) this.activeTileUiElements.navWestBtn.addEventListener('click', () => explorationController.attemptMoveInActiveExploration('west'));

        this.isInitializedActiveUI = true;
        console.log("explorationUI: Éléments de l'UI d'exploration active initialisés.");
    },

    enterActiveTileExplorationMode: function(tileX, tileY) {
        this.initializeActiveTileUIElements();
        if (!this.activeTileUiElements.container) {
            console.error("UI d'exploration active non trouvée dans le DOM !");
            return;
        }

        gameState.map.activeExplorationTileCoords = { x: tileX, y: tileY };
        this.activeTileUiElements.container.classList.remove('hidden');
        const worldSectionContent = document.getElementById('world-section-content');
        if(worldSectionContent) worldSectionContent.classList.add('blurred-background');

        if (this.activeTileUiElements.currentTileLog) this.activeTileUiElements.currentTileLog.innerHTML = "";
        this.addLogToActiveTileView("Analyse de la zone en cours...", "system");

        this.updateActiveTileExplorationView(tileX, tileY);
        console.log(`Entrée en mode exploration active pour (${tileX}, ${tileY})`);
    },

    exitActiveTileExplorationMode: function() {
        if (!this.activeTileUiElements.container) return;

        this.activeTileUiElements.container.classList.add('hidden');
        gameState.map.activeExplorationTileCoords = null;
        const worldSectionContent = document.getElementById('world-section-content');
        if(worldSectionContent) worldSectionContent.classList.remove('blurred-background');

        this.updateExplorationMapDisplay();
        this.centerMapOnPlayer(true);
        console.log("Sortie du mode exploration active.");
    },

    updateActiveTileExplorationView: function(centerX, centerY, forceActionRefresh = false) {
        if (!this.isInitializedActiveUI) this.initializeActiveTileUIElements();
        if (!gameState || !mapManager || !this.activeTileUiElements.container || this.activeTileUiElements.container.classList.contains('hidden')) {
            return;
        }

        const tile = mapManager.getTile(centerX, centerY);
        if (!tile) {
            console.error(`updateActiveTileExplorationView: Tuile non trouvée en (${centerX}, ${centerY})`);
            this.addLogToActiveTileView(`Erreur: Impossible de charger les données de la tuile (${centerX},${centerY}).`, "error");
            return;
        }

        const tileViewConfig = activeTileViewData[tile.actualType] || activeTileViewData.default;
        if (this.activeTileUiElements.currentTileImage) {
            this.activeTileUiElements.currentTileImage.style.backgroundImage = `url('${tileViewConfig.image || activeTileViewData.default.image}')`;
        }
        if (this.activeTileUiElements.currentTileDescription) {
            let desc = `<strong>${this.getTileContentName(tile.actualType, null)} (${centerX},${centerY})</strong><br>`;
            desc += MAP_FEATURE_DATA[tile.actualType]?.description || "Une zone d'apparence ordinaire.";
            if (tile.content) {
                desc += `<br>Présence détectée: ${this.getTileContentName(tile.actualType, tile.content)}.`;
            }
            if (tile.isFullyExplored) {
                 desc += "<br><em class='text-green-400'>Cette zone a été entièrement explorée.</em>";
            } else if (tile.usedActions && tile.usedActions['scan_local_active'] && (!tile.hiddenFeatures || tile.hiddenFeatures.length === 0) && (!tile.revealedFeatures || tile.revealedFeatures.length === 0)) {
                 desc += "<br><em class='text-gray-400'>Le scan local n'a rien révélé de plus.</em>";
            }
             if (tile.hasActiveTrap) {
                desc += "<br><strong class='text-red-500'>DANGER: Piège actif détecté !</strong>";
            }
            this.activeTileUiElements.currentTileDescription.innerHTML = desc;
        }

        if (this.activeTileUiElements.currentTileActionsGrid) {
            this.activeTileUiElements.currentTileActionsGrid.innerHTML = '';

            if (tile.isFullyExplored) {
                 this.activeTileUiElements.currentTileActionsGrid.innerHTML = `<p class="text-sm text-green-400 italic p-2 text-center">Rien de plus à faire ici.</p>`;
            } else {
                let availableActions = [];
                if (tile.baseActions) {
                    tile.baseActions.forEach(actionId => {
                        const actionDef = tileActiveExplorationOptions[actionId];
                        if (actionDef && (!tile.usedActions || !tile.usedActions[actionId] || actionDef.canRepeat)) {
                            if(actionDef.canRepeat && (tile.searchAttempts || 0) >= (actionDef.maxRepeats || 3) && actionId === 'search_area_active'){
                                // Skip
                            } else {
                                availableActions.push({ ...actionDef });
                            }
                        }
                    });
                }
                if (tile.content) {
                    if (tile.content.type === 'resource' && tile.content.amount > 0) {
                        const actionDef = tileActiveExplorationOptions['collect_visible_resource_active'];
                        availableActions.push({ ...actionDef, name: actionDef.name.replace('{resourceName}', TILE_TYPES_TO_RESOURCE_KEY[tile.content.resourceType] || "Ressource"), originalActionId: 'collect_visible_resource_active' });
                    } else if (tile.content.type === 'enemy_patrol') {
                        const actionDef = tileActiveExplorationOptions['engage_visible_enemy_active'];
                        availableActions.push({ ...actionDef, name: actionDef.name.replace('{enemyName}', tile.content.details.name), originalActionId: 'engage_visible_enemy_active' });
                    } else if (tile.content.type === 'poi' && !tile.content.isInteracted) {
                        const actionDef = tileActiveExplorationOptions['interact_poi_active'];
                        availableActions.push({ ...actionDef, name: actionDef.name.replace('{poiName}', MAP_FEATURE_DATA[tile.content.poiType]?.name || "POI"), originalActionId: 'interact_poi_active'});
                    } else if (tile.content.type === 'enemy_base' && tile.content.currentHealth > 0) {
                         const actionDef = tileActiveExplorationOptions['attack_enemy_base_active'];
                        availableActions.push({ ...actionDef, name: actionDef.name.replace('{baseName}', tile.content.details.name), originalActionId: 'attack_enemy_base_active' });
                    }
                }
                if(tile.revealedFeatures){
                    tile.revealedFeatures.forEach((feature, index) => { // Ajouter un index pour un ID unique si besoin
                        let actionDef;
                        let actionName;
                        let actionIdToUse;

                        if (feature.type === 'small_resource_cache') {
                            actionDef = tileActiveExplorationOptions['collect_revealed_resource'];
                            actionName = actionDef.name.replace('{resourceName}', feature.resourceType || 'Cache');
                            actionIdToUse = `collect_revealed_resource_${index}`; // ID unique pour cette instance
                        } else if (feature.type === 'ancient_data_fragment') {
                            actionDef = tileActiveExplorationOptions['decipher_data_fragment'];
                            actionName = actionDef.name;
                            actionIdToUse = `decipher_data_fragment_${index}`;
                        }
                        // ... autres types de features révélées

                        if (actionDef) {
                             availableActions.push({ ...actionDef, name: actionName, id: actionIdToUse, originalActionId: actionDef.id, dynamicData: feature });
                        }
                    });
                }

                if (availableActions.length > 0) {
                    availableActions.forEach(action => {
                        const actionButton = document.createElement('button');
                        actionButton.className = 'btn btn-secondary btn-sm w-full text-left p-2 flex items-center gap-2';
                        let costString = "";
                        if(action.cost){
                            costString = ` (Coût: ${getCostString(action.cost, false)})`; // false pour ne pas vérifier l'affordabilité ici
                        }
                        actionButton.innerHTML = `<i class="${action.icon || 'ti-question-mark'} text-lg"></i> <div><strong class="text-sm">${action.name}</strong><p class="text-xs text-gray-400">${action.description}${costString}</p></div>`;

                        let canAfford = true;
                        if (action.cost) {
                            for(const res in action.cost){ if((gameState.resources[res] || 0) < action.cost[res]) canAfford = false; }
                            if(!canAfford) {
                                actionButton.classList.add('btn-disabled'); actionButton.disabled = true;
                            }
                        }
                        actionButton.onclick = () => {
                            if (typeof explorationController !== 'undefined' && typeof explorationController.handleActionOnActiveTile === 'function') {
                                explorationController.handleActionOnActiveTile(action.originalActionId || action.id, centerX, centerY);
                            }
                        };
                        this.activeTileUiElements.currentTileActionsGrid.appendChild(actionButton);
                    });
                } else if (!tile.isFullyExplored) {
                     this.activeTileUiElements.currentTileActionsGrid.innerHTML = `<p class="text-sm text-gray-400 italic p-2 text-center">Aucune action disponible pour le moment.</p>`;
                }
            }
        }

        const directions = [
            { dir: 'north', dx: 0, dy: -1, element: this.activeTileUiElements.previewNorth, navBtn: this.activeTileUiElements.navNorthBtn },
            { dir: 'south', dx: 0, dy: 1, element: this.activeTileUiElements.previewSouth, navBtn: this.activeTileUiElements.navSouthBtn },
            { dir: 'east',  dx: 1, dy: 0, element: this.activeTileUiElements.previewEast, navBtn: this.activeTileUiElements.navEastBtn },
            { dir: 'west',  dx: -1,dy: 0, element: this.activeTileUiElements.previewWest, navBtn: this.activeTileUiElements.navWestBtn }
        ];

        directions.forEach(d => {
            if (!d.element || !d.navBtn) return;
            d.element.innerHTML = ''; d.navBtn.classList.add('btn-disabled'); d.navBtn.disabled = true;
            d.element.classList.remove('can-move', 'cursor-pointer', 'hover:bg-gray-700'); // Reset classes

            const adjX = centerX + d.dx;
            const adjY = centerY + d.dy;
            const currentZone = ZONE_DATA[gameState.currentZoneId];

            if (currentZone && adjX >= 0 && adjX < currentZone.mapSize.width && adjY >= 0 && adjY < currentZone.mapSize.height) {
                const adjTile = mapManager.getTile(adjX, adjY);
                if (adjTile) {
                    let previewHtml = `<strong class="text-xs">${d.dir.charAt(0).toUpperCase() + d.dir.slice(1)} (${adjX},${adjY})</strong><br>`;
                    let terrainName;
                    let terrainIcon = "ti-help-circle";

                    if (adjTile.isExplored || (adjTile.isScannedFromMap && gameState.gameTime <= adjTile.scannedFromMapRevealTime)) {
                        const typeToDisplay = (adjTile.isScannedFromMap && gameState.gameTime <= adjTile.scannedFromMapRevealTime) ? adjTile.scannedFromMapActualType : adjTile.actualType;
                        terrainName = this.getTileContentName(typeToDisplay, adjTile.content);
                        terrainIcon = this.getTileIcon(typeToDisplay, adjTile.content);
                        if (adjTile.content && adjTile.content.type === 'enemy_patrol') previewHtml += `<span class="text-red-400 text-xs block">${adjTile.content.details.name}</span>`;
                        else if (adjTile.content && adjTile.content.type === 'resource') previewHtml += `<span class="text-green-400 text-xs block">${TILE_TYPES_TO_RESOURCE_KEY[adjTile.content.resourceType]}</span>`;
                    } else {
                        terrainName = `Zone Inconnue (${this.getTerrainTypeName(adjTile.baseType)})`;
                        terrainIcon = this.getTileIcon(adjTile.baseType, null, true);
                    }
                    previewHtml += `<i class="${terrainIcon} text-2xl my-1"></i><br><span class="text-[0.65rem] text-gray-300">${terrainName}</span>`;
                    d.element.innerHTML = previewHtml;

                    let isTraversable = adjTile.actualType !== TILE_TYPES.IMPASSABLE_DEEP_WATER && adjTile.actualType !== TILE_TYPES.IMPASSABLE_HIGH_PEAK;
                    if (adjTile.actualType === TILE_TYPES.DEBRIS_FIELD && typeof explorationController !== 'undefined' && !explorationController.nanobotHasModuleAbility('canTraverse', TILE_TYPES.DEBRIS_FIELD)) isTraversable = false;
                    if (adjTile.actualType === TILE_TYPES.THICK_VINES && typeof explorationController !== 'undefined' && !explorationController.nanobotHasModuleAbility('canTraverse', TILE_TYPES.THICK_VINES)) isTraversable = false;

                    if (isTraversable) {
                        d.navBtn.classList.remove('btn-disabled');
                        d.navBtn.disabled = false;
                        d.element.classList.add('can-move', 'cursor-pointer', 'hover:bg-gray-700');
                        d.element.onclick = () => d.navBtn.click();
                    } else {
                        d.element.onclick = null;
                         previewHtml += `<br><span class="text-xs text-red-500 italic">Bloqué</span>`;
                         d.element.innerHTML = previewHtml; // Mettre à jour avec le message bloqué
                    }
                } else {
                     d.element.innerHTML = `<strong class="text-xs">${d.dir.charAt(0).toUpperCase() + d.dir.slice(1)}</strong><br><span class="text-xs text-gray-600 italic">Erreur</span>`;
                }
            } else {
                 d.element.innerHTML = `<strong class="text-xs">${d.dir.charAt(0).toUpperCase() + d.dir.slice(1)}</strong><br><span class="text-xs text-gray-500 italic">Hors Limites</span>`;
            }
        });

        if (this.activeTileUiElements.nanobotStatusContainer && gameState.nanobotStats) {
            this.activeTileUiElements.nanobotStatusContainer.innerHTML =
                `PV: <span class="font-semibold">${Math.floor(gameState.nanobotStats.currentHealth)}/${gameState.nanobotStats.health}</span> | ` +
                `Énergie: <span class="font-semibold">${Math.floor(gameState.resources.energy)}</span> | ` +
                `Mobilité: <span class="font-semibold">${Math.floor(gameState.resources.mobility)}/${MAX_MOBILITY_POINTS}</span>`;
        }
    },

    addLogToActiveTileView: function(message, type = "info") {
        if (!this.activeTileUiElements.currentTileLog) return;
        const entry = document.createElement('p');
        entry.className = 'text-xs mb-1';
        if (type === "error") entry.classList.add("text-red-400", "font-semibold");
        else if (type === "success") entry.classList.add("text-green-400");
        else if (type === "warning") entry.classList.add("text-yellow-400");
        else if (type === "system") entry.classList.add("text-gray-500", "italic");
        else entry.classList.add("text-gray-300");
        entry.innerHTML = message;
        this.activeTileUiElements.currentTileLog.appendChild(entry);
        this.activeTileUiElements.currentTileLog.scrollTop = this.activeTileUiElements.currentTileLog.scrollHeight;
    },

    updateFullExplorationView: function() {
        if (!gameState || !gameState.map) {
            console.warn("explorationUI.updateFullExplorationView: gameState ou gameState.map non défini.");
            return;
        }
        if (this.activeTileUiElements.container && !this.activeTileUiElements.container.classList.contains('hidden')) {
            return;
        }
        this.updateExplorationMapDisplay();
        this.updateExplorationLogDisplay();
        if (gameState.map.selectedTile) {
            this.updateTileInteractionPanel(gameState.map.selectedTile.x, gameState.map.selectedTile.y);
        } else if (gameState.map.nanobotPos) {
            this.updateTileInteractionPanel(gameState.map.nanobotPos.x, gameState.map.nanobotPos.y);
        } else {
            this.updateTileInteractionPanel();
        }
        if (this.isFirstExplorationViewUpdate && document.getElementById('exploration-subtab')?.classList.contains('active')) {
            setTimeout(() => { this.centerMapOnPlayer(true); }, 50);
            this.isFirstExplorationViewUpdate = false;
        }
    },

    updateExplorationMapDisplay: function() {
        if(!mapGridEl || !nanobotMapPosEl || !tileInfoDisplayEl || !explorationTitleEl ) { return; }
        if (typeof ZONE_DATA === 'undefined' || !gameState || !gameState.map || !gameState.currentZoneId || !ZONE_DATA[gameState.currentZoneId]) { return; }

        if(typeof this.updateZoneSelectionUI === 'function') this.updateZoneSelectionUI();

        const currentZone = ZONE_DATA[gameState.currentZoneId];
        if(explorationTitleEl) explorationTitleEl.textContent = `Carte: ${currentZone.name}`;

        const mapScrollContainer = document.getElementById('map-scroll-container');
        if(mapGridEl && mapScrollContainer) {
            mapGridEl.innerHTML = '';
            const fixedTileSize = 22;
            document.documentElement.style.setProperty('--map-tile-effective-size', `${fixedTileSize}px`);
            mapGridEl.style.gridTemplateRows = `repeat(${currentZone.mapSize.height}, ${fixedTileSize}px)`;
            mapGridEl.style.gridTemplateColumns = `repeat(${currentZone.mapSize.width}, ${fixedTileSize}px)`;
            mapGridEl.style.width = `${currentZone.mapSize.width * (fixedTileSize + 1) -1}px`;
            mapGridEl.style.height = `${currentZone.mapSize.height * (fixedTileSize + 1) -1}px`;
        } else { return; }


        let scanButton = document.getElementById('scan-map-button');
        if (scanButton && typeof SCAN_ENERGY_COST !== 'undefined' && typeof SCAN_COOLDOWN_DURATION_SECONDS !== 'undefined' && typeof TICK_SPEED !== 'undefined' && gameState && gameState.nanobotStats) {
            const stats = gameState.nanobotStats;
            const scanCost = SCAN_ENERGY_COST;
            const scanCooldownTimeInTicks = SCAN_COOLDOWN_DURATION_SECONDS * (1000 / TICK_SPEED);
            const onCooldown = gameState.gameTime < (stats.lastMapScanTime || 0) + scanCooldownTimeInTicks;
            const canAffordScan = gameState.resources.energy >= scanCost;
            scanButton.disabled = onCooldown || !canAffordScan;
            scanButton.classList.toggle('btn-disabled', onCooldown || !canAffordScan);
            scanButton.classList.toggle('btn-info', !onCooldown && canAffordScan);

            if (onCooldown) scanButton.textContent = `Scan Carte (CD: ${formatTime(Math.ceil(((stats.lastMapScanTime || 0) + scanCooldownTimeInTicks - gameState.gameTime) * (TICK_SPEED/1000))) })`;
            else if (!canAffordScan) scanButton.textContent = `Scan Carte (${scanCost} NRG) - Insuff.`;
            else scanButton.textContent = `Scanner Carte (${scanCost} NRG)`;

            if (!scanButton.dataset.listenerAttached) {
                scanButton.addEventListener('click', () => {
                    if (typeof explorationController !== 'undefined' && typeof explorationController.performScanOnWorldMap === 'function') {
                        explorationController.performScanOnWorldMap();
                    } else console.error("explorationController.performScanOnWorldMap non défini.");
                });
                scanButton.dataset.listenerAttached = 'true';
            }
        }

        if (!Array.isArray(gameState.map.tiles) || gameState.map.tiles.length === 0 || !gameState.map.tiles[0] ) {
            if(mapGridEl) mapGridEl.innerHTML = "<p class='text-yellow-400 italic text-xs'>Initialisation de la carte...</p>";
            return;
        }

        for (let y = 0; y < currentZone.mapSize.height; y++) {
            if (!Array.isArray(gameState.map.tiles[y]) || gameState.map.tiles[y].length !== currentZone.mapSize.width) continue;
            for (let x = 0; x < currentZone.mapSize.width; x++) {
                const tileDiv = document.createElement('div');
                const tileData = this.getTile(x,y);
                const tileClassesString = tileData ? this.getTileDisplayClassOnWorldMap(x, y) : 'unexplored unexplored-flat';
                tileDiv.className = `map-tile ${tileClassesString}`;
                tileDiv.dataset.x = x; tileDiv.dataset.y = y;
                tileDiv.addEventListener('click', () => {
                    if(typeof explorationController !== 'undefined' && typeof explorationController.handleTileClickOnWorldMap === 'function') {
                        explorationController.handleTileClickOnWorldMap(x, y);
                    } else { console.error("explorationController.handleTileClickOnWorldMap non défini.");}
                });
                tileDiv.addEventListener('mouseover', () => {
                    if(tileInfoDisplayEl) tileInfoDisplayEl.textContent = `(${x},${y}) ${this.getTileInfoForWorldMap(x,y)}`;
                });
                tileDiv.addEventListener('mouseout', () => {
                    if(tileInfoDisplayEl) tileInfoDisplayEl.textContent = "Survolez une case.";
                });
                if(mapGridEl) mapGridEl.appendChild(tileDiv);
            }
        }

        if (nanobotMapPosEl && gameState && gameState.map && gameState.map.nanobotPos) {
            nanobotMapPosEl.textContent = `(${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y}) / ${currentZone.name}`;
        }

        const centerBtn = document.getElementById('center-map-btn');
        if (centerBtn && !centerBtn.dataset.listenerAttached) {
            centerBtn.addEventListener('click', () => this.centerMapOnPlayer(false));
            centerBtn.dataset.listenerAttached = 'true';
        }
    },

    getTileDisplayClassOnWorldMap: function(x,y) {
        if (!gameState || !gameState.map || !this.getTile(x,y) || typeof TILE_TYPES === 'undefined') {
            return 'unexplored unexplored-flat';
        }
        const tile = this.getTile(x,y);
        let classes = [];
        const isNanobotCurrentPos = gameState.map.nanobotPos.x === x && gameState.map.nanobotPos.y === y;

        if (isNanobotCurrentPos) classes.push('nanobot');

        if (tile.isExplored) {
            classes.push('explored');
            const actualType = tile.actualType;
            switch (actualType) {
                case TILE_TYPES.EMPTY_GRASSLAND: classes.push('grassland'); break;
                case TILE_TYPES.EMPTY_DESERT: classes.push('desert'); break;
                case TILE_TYPES.EMPTY_WATER: classes.push('water'); break;
                case TILE_TYPES.FOREST: classes.push('forest'); break;
                case TILE_TYPES.MOUNTAIN: classes.push('mountain'); break;
                case TILE_TYPES.RUINS: classes.push('ruins'); break;
                case TILE_TYPES.PLAYER_BASE: classes.push('base'); break;
                case TILE_TYPES.RESOURCE_BIOMASS_PATCH: classes.push('resource-biomass'); if(tile.content) classes.push('has-active-resource'); break;
                case TILE_TYPES.RESOURCE_NANITE_DEPOSIT: classes.push('resource-nanites'); if(tile.content) classes.push('has-active-resource'); break;
                case TILE_TYPES.RESOURCE_CRYSTAL_VEIN: classes.push('resource-crystal'); if(tile.content) classes.push('has-active-resource'); break;
                case TILE_TYPES.UPGRADE_CACHE: classes.push(tile.content && tile.content.isOpened ? 'ruins' : 'upgrade'); break;
                case TILE_TYPES.POI_ANCIENT_STRUCTURE: classes.push('poi-structure'); break;
                case TILE_TYPES.ENEMY_OUTPOST_TILE: classes.push(tile.content && tile.content.currentHealth > 0 ? 'enemy-base' : 'ruins'); break;
                case TILE_TYPES.MERCHANT_WRECKAGE: classes.push('poi-wreckage'); break;
                case TILE_TYPES.ENEMY_PATROL_WEAK: case TILE_TYPES.ENEMY_PATROL_MEDIUM: classes.push('enemy'); break;
                case TILE_TYPES.IMPASSABLE_DEEP_WATER: classes.push('impassable-water explored-impassable'); break;
                case TILE_TYPES.IMPASSABLE_HIGH_PEAK: classes.push('impassable-mountain explored-impassable'); break;
                case TILE_TYPES.DEBRIS_FIELD: classes.push('debris-field'); break;
                case TILE_TYPES.THICK_VINES: classes.push('thick-vines'); break;
                default: classes.push(this.getBaseTerrainClass(actualType) || 'grassland'); break;
            }
            if (tile.isFullyExplored && !isNanobotCurrentPos) classes.push('fully-explored-overlay');
        } else {
            classes.push('unexplored');
            switch (tile.baseType) {
                case TILE_TYPES.PRE_EMPTY: classes.push('unexplored-flat'); break;
                case TILE_TYPES.PRE_WATER: classes.push('unexplored-water'); break;
                case TILE_TYPES.PRE_ROUGH_TERRAIN: classes.push('unexplored-rough'); break;
                case TILE_TYPES.PRE_HIGH_MOUNTAIN: classes.push('unexplored-impassable'); break;
                case TILE_TYPES.PLAYER_BASE: classes.push('base'); break;
                case TILE_TYPES.PRE_DEBRIS_FIELD: classes.push('unexplored-debris'); break;
                case TILE_TYPES.PRE_THICK_VINES: classes.push('unexplored-vines'); break;
                default: classes.push('unexplored-flat'); break;
            }
            if (tile.structureType) {
                switch (tile.structureType) {
                    case TILE_TYPES.PRE_RUIN_SILHOUETTE: classes.push('unexplored-ruin-outline'); break;
                    case TILE_TYPES.PRE_LARGE_CRYSTAL_CLUSTER: classes.push('unexplored-large-crystal'); break;
                    case TILE_TYPES.PRE_HOSTILE_STRUCTURE: classes.push('unexplored-enemy-base-outline'); break;
                    case TILE_TYPES.PRE_DISTRESS_SIGNAL: classes.push('unexplored-distress-signal'); break;
                }
            }
            if (tile.isScannedFromMap && tile.scannedFromMapActualType !== null && gameState.gameTime <= tile.scannedFromMapRevealTime) {
                classes.push('scanned-on-map');
                switch(tile.scannedFromMapActualType) {
                    case TILE_TYPES.RESOURCE_BIOMASS_PATCH: classes.push('scanned-map-actual-biomass'); break;
                    case TILE_TYPES.RESOURCE_NANITE_DEPOSIT: classes.push('scanned-map-actual-nanites'); break;
                    case TILE_TYPES.RESOURCE_CRYSTAL_VEIN: classes.push('scanned-map-actual-crystal'); break;
                    case TILE_TYPES.ENEMY_PATROL_WEAK: case TILE_TYPES.ENEMY_PATROL_MEDIUM: classes.push('scanned-map-actual-enemy'); break;
                    case TILE_TYPES.UPGRADE_CACHE: classes.push('scanned-map-actual-upgrade'); break;
                    case TILE_TYPES.ENEMY_OUTPOST_TILE: classes.push('scanned-map-actual-enemy-base'); break;
                    case TILE_TYPES.IMPASSABLE_DEEP_WATER: classes.push('scanned-map-actual-impassable-water'); break;
                    case TILE_TYPES.IMPASSABLE_HIGH_PEAK: classes.push('scanned-map-actual-impassable-mountain'); break;
                    default: classes.push('scanned-map-actual-empty'); break;
                }
            }
        }
        return classes.join(' ');
    },

    getTileInfoForWorldMap: function(x,y) {
        if (!gameState || !gameState.map || !this.getTile(x,y) || typeof TILE_TYPES === 'undefined' || typeof MAP_FEATURE_DATA === 'undefined') {
            return "Données indisponibles.";
        }
        const tile = this.getTile(x,y);
        let info = "";
        if (tile.isExplored) {
            info = this.getTileContentName(tile.actualType, tile.content);
            if (tile.isFullyExplored) info += " (Explorée)";
            else info += " (Visitée)";
            if (tile.content) {
                if (tile.content.type === 'resource' && tile.content.amount > 0) info += ` - ${tile.content.amount} u.`;
                else if (tile.content.type === 'enemy_patrol') info += ` - ${tile.content.details.name}`;
                else if (tile.content.type === 'enemy_base') info += ` - PV: ${tile.content.currentHealth}/${tile.content.details.health}`;
            }
        } else {
            info = "Zone Inconnue";
            if (tile.baseType) info += ` (${this.getTerrainTypeName(tile.baseType)})`;
            if (tile.structureType) info += ` | Struct: ${this.getStructureTypeName(tile.structureType)}`;
            if (tile.isScannedFromMap && tile.scannedFromMapActualType !== null && gameState.gameTime <= tile.scannedFromMapRevealTime) {
                info += ` | Scan: ${this.getTileContentName(tile.scannedFromMapActualType, null) || "Signal?"}`;
            }
        }
        return info.trim();
    },

    getTerrainTypeName: function(baseOrActualType) {
        return TILE_TYPES ? ({
            [TILE_TYPES.PRE_EMPTY]:"Plaines", [TILE_TYPES.EMPTY_GRASSLAND]:"Prairie",
            [TILE_TYPES.PRE_WATER]:"Zone Humide", [TILE_TYPES.EMPTY_WATER]:"Eau Peu Profonde", [TILE_TYPES.IMPASSABLE_DEEP_WATER]: "Eau Profonde",
            [TILE_TYPES.PRE_ROUGH_TERRAIN]:"Terrain Accidenté", [TILE_TYPES.MOUNTAIN]:"Montagne",
            [TILE_TYPES.PRE_HIGH_MOUNTAIN]:"Hauts Sommets", [TILE_TYPES.IMPASSABLE_HIGH_PEAK]:"Pic Infranchissable",
            [TILE_TYPES.PLAYER_BASE]:"Votre Base",
            [TILE_TYPES.FOREST]: "Forêt", [TILE_TYPES.EMPTY_DESERT]: "Désert", [TILE_TYPES.RUINS]: "Ruines",
            [TILE_TYPES.PRE_DEBRIS_FIELD]: "Champ de Débris (pré)", [TILE_TYPES.DEBRIS_FIELD]: "Champ de Débris",
            [TILE_TYPES.PRE_THICK_VINES]: "Végétation Dense (pré)", [TILE_TYPES.THICK_VINES]: "Vignes Épaisses",
        })[baseOrActualType] || "Terrain Inconnu" : "Terrain Inconnu";
    },
    getStructureTypeName: function(structureType) { return (TILE_TYPES && MAP_FEATURE_DATA) ? MAP_FEATURE_DATA[structureType]?.name || "Struct. Non Ident." : "Struct. Inconnue";},

    getTileContentName: function(actualType, content) {
        if (!TILE_TYPES || !MAP_FEATURE_DATA) { return "Erreur Config"; }
        if (content?.details?.name) return content.details.name;
        if (content?.type === 'resource' && content.resourceType && TILE_TYPES_TO_RESOURCE_KEY) {
            const resourceName = TILE_TYPES_TO_RESOURCE_KEY[content.resourceType];
            return resourceName ? resourceName.charAt(0).toUpperCase() + resourceName.slice(1) : "Ressource Inconnue";
        }
        if (MAP_FEATURE_DATA[actualType]?.name) return MAP_FEATURE_DATA[actualType].name;
        const genericNames = {
            [TILE_TYPES.EMPTY_GRASSLAND]: "Prairie", [TILE_TYPES.EMPTY_DESERT]: "Désert",
            [TILE_TYPES.EMPTY_WATER]: "Eau peu prof.", [TILE_TYPES.FOREST]: "Forêt",
            [TILE_TYPES.MOUNTAIN]: "Montagne", [TILE_TYPES.PLAYER_BASE]: "Noyau Nexus-7",
            [TILE_TYPES.UPGRADE_CACHE]: "Cache", [TILE_TYPES.ENEMY_PATROL_WEAK]: "Patrouille faible",
            [TILE_TYPES.ENEMY_PATROL_MEDIUM]: "Patrouille moy.",
            [TILE_TYPES.IMPASSABLE_DEEP_WATER]: "Eau Profonde (X)", [TILE_TYPES.IMPASSABLE_HIGH_PEAK]: "Pic Infranch.(X)",
            [TILE_TYPES.DEBRIS_FIELD]: "Champ de Débris", [TILE_TYPES.THICK_VINES]: "Vignes Épaisses"
        };
        if (genericNames[actualType]) return genericNames[actualType];
        const terrainName = this.getTerrainTypeName(actualType);
        if (terrainName && terrainName !== "Terrain Inconnu") return terrainName;
        return "Type Inconnu";
    },

     getTileIcon: function(type, content, isUnexploredBase = false) {
        if (isUnexploredBase) {
            switch(type) {
                case TILE_TYPES.PRE_EMPTY: return "ti-map-pin-question";
                case TILE_TYPES.PRE_WATER: return "ti-droplet-question";
                case TILE_TYPES.PRE_ROUGH_TERRAIN: return "ti-mountain-question";
                case TILE_TYPES.PRE_HIGH_MOUNTAIN: return "ti-error-404";
                case TILE_TYPES.PRE_DEBRIS_FIELD: return "ti-components-off";
                case TILE_TYPES.PRE_THICK_VINES: return "ti-plant-off";
                default: return "ti-question-mark";
            }
        }
        if (content) {
            switch(content.type) {
                case 'resource': return "ti-basket";
                case 'enemy_patrol': return "ti-sword";
                case 'enemy_base': return "ti-castle";
                case 'poi':
                    if(content.poiType === TILE_TYPES.UPGRADE_CACHE) return "ti-treasure-chest";
                    return "ti-zoom-question";
                default: break;
            }
        }
        switch(type) {
            case TILE_TYPES.EMPTY_GRASSLAND: return "ti-barley";
            case TILE_TYPES.FOREST: return "ti-plant-2";
            case TILE_TYPES.MOUNTAIN: return "ti-mountain";
            case TILE_TYPES.EMPTY_DESERT: return "ti-cactus";
            case TILE_TYPES.EMPTY_WATER: return "ti-wave-sine";
            case TILE_TYPES.RUINS: return "ti-building-ruin";
            case TILE_TYPES.PLAYER_BASE: return "ti-home-shield";
            case TILE_TYPES.DEBRIS_FIELD: return "ti-components";
            case TILE_TYPES.THICK_VINES: return "ti-plant";
            case TILE_TYPES.IMPASSABLE_DEEP_WATER: case TILE_TYPES.IMPASSABLE_HIGH_PEAK: return "ti-ban";
            default: return "ti-map-pin";
        }
    },

    centerMapOnPlayer: function(instant = false) {
        const mapScrollContainer = document.getElementById('map-scroll-container');
        const mapGrid = document.getElementById('map-grid');
        if (!mapScrollContainer || !mapGrid || !gameState || !gameState.map.nanobotPos) { return; }
        requestAnimationFrame(() => {
            const tileSizeString = getComputedStyle(document.documentElement).getPropertyValue('--map-tile-effective-size');
            const tileSize = parseFloat(tileSizeString) || 22;
            const gap = 1;
            const playerTileX = gameState.map.nanobotPos.x;
            const playerTileY = gameState.map.nanobotPos.y;
            const playerPixelX = playerTileX * (tileSize + gap);
            const playerPixelY = playerTileY * (tileSize + gap);
            const playerCenterX = playerPixelX + tileSize / 2;
            const playerCenterY = playerPixelY + tileSize / 2;
            const targetScrollLeft = playerCenterX - mapScrollContainer.clientWidth / 2;
            const targetScrollTop = playerCenterY - mapScrollContainer.clientHeight / 2;
            mapScrollContainer.scrollTo({ top: targetScrollTop, left: targetScrollLeft, behavior: instant ? 'auto' : 'smooth' });
        });
    },
    updateExplorationLogDisplay: function() {
        if (!explorationLogEl || !gameState || !gameState.explorationLog) { return; }
        explorationLogEl.innerHTML = '';
        const logPlaceholder = '<p class="text-gray-500 italic text-xs">Aucun événement récent...</p>';
        if (gameState.explorationLog.length === 0 || (gameState.explorationLog.length === 1 && gameState.explorationLog[0].includes("initialisé"))) {
            if (!explorationLogEl.querySelector('p.text-gray-500.italic')) explorationLogEl.innerHTML = logPlaceholder;
        } else {
            const logToDisplay = gameState.explorationLog.slice(-30);
            logToDisplay.forEach(msgHtml => {
                const entry = document.createElement('p');
                entry.className = 'text-xs'; // Les classes de couleur sont supposées être dans msgHtml
                if (msgHtml.toLowerCase().includes("collecté") || msgHtml.toLowerCase().includes("trouvé")) entry.classList.add("text-green-400");
                else if (msgHtml.toLowerCase().includes("danger") || msgHtml.toLowerCase().includes("erreur") || msgHtml.toLowerCase().includes("impossible")) entry.classList.add("text-red-400");
                else if (msgHtml.toLowerCase().includes("déplacement") || msgHtml.toLowerCase().includes("scan") || msgHtml.toLowerCase().includes("arriv")) entry.classList.add("text-blue-300");
                else entry.classList.add("text-gray-300");
                entry.innerHTML = msgHtml;
                explorationLogEl.appendChild(entry);
            });
        }
        if (explorationLogEl) explorationLogEl.scrollTop = explorationLogEl.scrollHeight;
    },
    updateTileInteractionPanel: function(x, y) {
        const panel = tileInteractionPanelEl; const detailsDiv = tileInteractionDetailsEl; const actionsDiv = tileInteractionActionsEl;
        if (!panel || !detailsDiv || !actionsDiv) return;
        if (x === undefined || y === undefined || !gameState || !gameState.map || !this.getTile(x,y) ) {
            detailsDiv.innerHTML = `<h4 class="font-orbitron text-sm text-blue-300 mb-1">Interaction Rapide</h4><p class="text-gray-500 italic text-xs">Survolez ou cliquez une case sur la carte du monde.</p>`; actionsDiv.innerHTML = ''; return;
        }
        const tile = this.getTile(x,y);
        let detailsHtml = `<h4 class="font-orbitron text-sm text-blue-300 mb-1">Aperçu Case (${x}, ${y})</h4>`;
        detailsHtml += `<p class="text-xs"><b>Statut:</b> ${tile.isExplored ? (tile.isFullyExplored ? 'Explorée (Total.)' : 'Explorée (Partiel.)') : 'Non explorée'}</p>`;
        detailsHtml += `<p class="text-xs"><b>Terrain:</b> ${this.getTerrainTypeName(tile.isExplored || tile.isScannedFromMap ? tile.actualType : tile.baseType)}</p>`;
        if (!tile.isExplored && tile.structureType) detailsHtml += `<p class="text-xs"><b>Structure (Est.):</b> ${this.getStructureTypeName(tile.structureType)}</p>`;

        if (tile.isExplored || (tile.isScannedFromMap && gameState.gameTime <= tile.scannedFromMapRevealTime)) {
            const typeToDisplay = (tile.isScannedFromMap && gameState.gameTime <= tile.scannedFromMapRevealTime && !tile.isExplored) ? tile.scannedFromMapActualType : tile.actualType;
            detailsHtml += `<p class="text-xs"><b>Contenu Identifié:</b> ${this.getTileContentName(typeToDisplay, tile.content)}</p>`;
            if (tile.content && tile.content.type === 'resource') detailsHtml += `<p class="text-xs">Quantité: ${tile.content.amount}</p>`;
        } else if (tile.isScannedFromMap && gameState.gameTime > tile.scannedFromMapRevealTime) {
            detailsHtml += `<p class="text-xs text-yellow-500 italic">Données du scan expirées.</p>`;
        }

        actionsDiv.innerHTML = '';
        const isCurrentPos = gameState.map.nanobotPos.x === x && gameState.map.nanobotPos.y === y;
        if (isCurrentPos) {
            const enterActiveModeButton = document.createElement('button');
            enterActiveModeButton.className = 'btn btn-primary btn-xs mt-1 w-full';
            enterActiveModeButton.innerHTML = `<i class="ti ti-target-arrow mr-1"></i> Explorer Activement`;
            enterActiveModeButton.onclick = () => { if (typeof this.enterActiveTileExplorationMode === 'function') this.enterActiveTileExplorationMode(x,y); };
            actionsDiv.appendChild(enterActiveModeButton);
        } else {
             actionsDiv.innerHTML = `<p class="text-xs text-gray-500 italic">Cliquez sur votre case pour l'explorer activement.</p>`;
        }
        detailsDiv.innerHTML = detailsHtml;
    },
    updateZoneSelectionUI: function() {
        const zoneListContainer = zoneListContainerEl; if (!zoneListContainer) return;
        if (typeof ZONE_DATA === 'undefined' || !gameState || !gameState.unlockedZones || typeof researchData === 'undefined' || typeof QUEST_DATA === 'undefined') { zoneListContainer.innerHTML = "<p class='text-red-400 italic text-xs'>Erreur zones.</p>"; return;}
        zoneListContainer.innerHTML = '';
        for (const zoneId in ZONE_DATA) {
            const zone = ZONE_DATA[zoneId]; let isUnlocked = gameState.unlockedZones.includes(zoneId);
            if (!isUnlocked && zone.unlockCondition?.research && gameState.research[zone.unlockCondition.research]) {
                isUnlocked = true; if (!gameState.unlockedZones.includes(zoneId)) gameState.unlockedZones.push(zoneId);
            }
            const zoneDiv = document.createElement('div'); zoneDiv.className = 'p-1 rounded text-xs ';
            if (isUnlocked) {
                zoneDiv.classList.add('hover:bg-gray-600', 'cursor-pointer');
                if (gameState.currentZoneId === zoneId) {
                    zoneDiv.classList.add('bg-blue-700', 'font-semibold'); zoneDiv.innerHTML = `<h5 class="text-xs text-white">${zone.name}</h5>`; zoneDiv.title = "Zone actuelle";
                } else {
                    zoneDiv.classList.add('bg-gray-800'); zoneDiv.innerHTML = `<h5 class="text-xs text-blue-300">${zone.name}</h5>`; zoneDiv.title = `Voyager vers ${zone.name}`;
                    if (zone.travelCost) { let costStr = Object.entries(zone.travelCost).map(([res,val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', '); zoneDiv.title += ` (Coût: ${costStr})`;}
                    zoneDiv.onclick = () => { if(typeof explorationController !== 'undefined' && typeof explorationController.attemptTravelToZone === 'function') explorationController.attemptTravelToZone(zoneId); };
                }
            } else {
                zoneDiv.classList.add('bg-gray-900', 'opacity-60');
                let unlockText = "Condition déblocage inconnue.";
                if (zone.unlockCondition?.research && researchData[zone.unlockCondition.research]) unlockText = `Recherche: ${researchData[zone.unlockCondition.research].name}`;
                else if (zone.unlockCondition?.quest && QUEST_DATA[zone.unlockCondition.quest]) unlockText = `Quête: ${QUEST_DATA[zone.unlockCondition.quest].title}`;
                zoneDiv.innerHTML = `<h5 class="text-xs text-gray-600">${zone.name} (Verrouillé)</h5><p class="text-xs text-gray-500">${unlockText}</p>`;
            }
            zoneListContainer.appendChild(zoneDiv);
        }
    },
    getTile: function(x, y) {
        if (mapManager && typeof mapManager.getTile === 'function') return mapManager.getTile(x, y);
        return null;
    },
    getBaseTerrainClass: function(actualType) {
        switch(actualType) {
            case TILE_TYPES.EMPTY_GRASSLAND: return 'grassland';
            case TILE_TYPES.EMPTY_DESERT: return 'desert';
            case TILE_TYPES.EMPTY_WATER: return 'water';
            case TILE_TYPES.FOREST: return 'forest';
            case TILE_TYPES.MOUNTAIN: return 'mountain';
            case TILE_TYPES.RUINS: return 'ruins';
            default: return 'unknown-terrain';
        }
    }
};
console.log("explorationUI.js - Objet explorationUI défini.");