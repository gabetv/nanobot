// js/explorationUI.js
console.log("explorationUI.js - Fichier chargé et en cours d'analyse...");

var explorationUI = {

    updateFullExplorationView: function() {
        // console.log("explorationUI: updateFullExplorationView CALLED");
        if (!gameState || !gameState.map) {
            console.warn("explorationUI.updateFullExplorationView: gameState ou gameState.map non défini.");
            return;
        }
        // Vérifier que les méthodes existent sur this (l'objet explorationUI)
        if (typeof this.updateExplorationMapDisplay !== 'function' ||
            typeof this.updateExplorationLogDisplay !== 'function' ||
            typeof this.updateTileInteractionPanel !== 'function' ||
            typeof this.updateZoneSelectionUI !== 'function') {
            console.error("explorationUI.updateFullExplorationView: Une ou plusieurs fonctions de mise à jour sont manquantes sur this.");
            return;
        }
        this.updateExplorationMapDisplay();
        this.updateExplorationLogDisplay();
        if (gameState.map.selectedTile) {
            this.updateTileInteractionPanel(gameState.map.selectedTile.x, gameState.map.selectedTile.y);
        } else {
            this.updateTileInteractionPanel(); // Call without args to clear it or show default
        }
    },

    updateExplorationMapDisplay: function() {
        // console.log("explorationUI: updateExplorationMapDisplay CALLED");
        if(!mapGridEl || !nanobotMapPosEl || !tileInfoDisplayEl || !explorationTitleEl || !explorationContentEl) {
            console.warn("explorationUI.updateExplorationMapDisplay: Un ou plusieurs éléments DOM de base sont manquants !");
            return;
        }
        if (typeof ZONE_DATA === 'undefined' || !gameState || !gameState.map || !gameState.currentZoneId || !ZONE_DATA[gameState.currentZoneId]) {
            console.warn("explorationUI.updateExplorationMapDisplay: ZONE_DATA ou gameState pour la carte non défini.");
            if(mapGridEl) mapGridEl.innerHTML = "<p class='text-red-400'>Erreur: Données de zone non disponibles.</p>";
            return;
        }

        if(typeof this.updateZoneSelectionUI === 'function') this.updateZoneSelectionUI();
        else console.warn("explorationUI: this.updateZoneSelectionUI non trouvée dans updateExplorationMapDisplay.");


        const currentZone = ZONE_DATA[gameState.currentZoneId];
        if(explorationTitleEl) explorationTitleEl.textContent = `Carte d'Exploration: ${currentZone.name}`;
        if(mapGridEl) {
            mapGridEl.innerHTML = ''; // Clear previous grid
            mapGridEl.style.gridTemplateRows = `repeat(${currentZone.mapSize.height}, 1fr)`;
            mapGridEl.style.gridTemplateColumns = `repeat(${currentZone.mapSize.width}, 1fr)`;
        }


        let scanButton = document.getElementById('scan-map-button');
        const explorationContentContainer = document.getElementById('exploration-content-container');

        if (!scanButton && explorationContentContainer) {
            // Ensure mapGridEl is a direct child of explorationContentContainer or scan button won't be placed correctly relative to map-grid
             const existingMapGrid = explorationContentContainer.querySelector('#map-grid'); // Re-query for map-grid within its container

            if (existingMapGrid) {
                scanButton = document.createElement('button');
                scanButton.id = 'scan-map-button';
                scanButton.className = 'btn btn-info btn-sm mb-3 w-full';
                scanButton.onclick = () => {
                    if (typeof explorationController !== 'undefined' && typeof explorationController.performScan === 'function') {
                        explorationController.performScan();
                    } else { console.error("explorationController.performScan non défini.");}
                };
                // Insert before the map grid element
                existingMapGrid.parentNode.insertBefore(scanButton, existingMapGrid);
            } else {
                console.warn("explorationUI.updateExplorationMapDisplay: map-grid not found within exploration-content-container for scan button placement.");
            }
        }


        if (scanButton && typeof SCAN_ENERGY_COST !== 'undefined' && typeof SCAN_COOLDOWN_DURATION_SECONDS !== 'undefined' && typeof TICK_SPEED !== 'undefined' && gameState && gameState.nanobotStats) {
            const stats = gameState.nanobotStats;
            const scanCost = SCAN_ENERGY_COST;
            const scanCooldownTimeInTicks = SCAN_COOLDOWN_DURATION_SECONDS * (1000 / TICK_SPEED);

            const onCooldown = gameState.gameTime < (stats.lastScanTime || 0) + scanCooldownTimeInTicks;
            const canAffordScan = gameState.resources.energy >= scanCost;

            scanButton.disabled = onCooldown || !canAffordScan;
            scanButton.classList.toggle('btn-disabled', onCooldown || !canAffordScan);
            scanButton.classList.toggle('btn-info', !onCooldown && canAffordScan);

            if (onCooldown) {
                scanButton.textContent = `Scanner (Recharge: ${formatTime(Math.ceil(((stats.lastScanTime || 0) + scanCooldownTimeInTicks - gameState.gameTime) * (TICK_SPEED/1000))) })`;
            } else if (!canAffordScan) {
                scanButton.textContent = `Scanner (${scanCost} Énergie) - Insuffisant`;
            } else {
                scanButton.textContent = `Scanner Environs (${scanCost} Énergie)`;
            }
        }

        if (!mapGridEl) return; // mapGridEl might have been cleared if error occurred earlier

        if (!Array.isArray(gameState.map.tiles) || gameState.map.tiles.length !== currentZone.mapSize.height) {
            console.warn(`explorationUI.updateExplorationMapDisplay: gameState.map.tiles est malformé ou ne correspond pas à la hauteur de la zone ${currentZone.id}.`);
            mapGridEl.innerHTML = "<p class='text-yellow-400 italic'>Initialisation de la carte...</p>";
            return;
        }

        for (let y = 0; y < currentZone.mapSize.height; y++) {
            if (!Array.isArray(gameState.map.tiles[y]) || gameState.map.tiles[y].length !== currentZone.mapSize.width) {
                 console.warn(`explorationUI.updateExplorationMapDisplay: Ligne de tuile ${y} malformée pour la zone ${currentZone.id}.`);
                 continue;
            }
            for (let x = 0; x < currentZone.mapSize.width; x++) {
                const tileDiv = document.createElement('div');
                const tileClassesString = this.getTileDisplayClass(x, y);
                tileDiv.className = `map-tile ${tileClassesString}`;

                tileDiv.dataset.x = x; tileDiv.dataset.y = y;
                tileDiv.addEventListener('click', () => {
                    if(typeof explorationController !== 'undefined' && typeof explorationController.handleTileClick === 'function') {
                        explorationController.handleTileClick(x, y);
                    } else { console.error("explorationController.handleTileClick non défini.");}
                });
                tileDiv.addEventListener('mouseover', () => {
                    if(tileInfoDisplayEl) tileInfoDisplayEl.textContent = `(${x},${y}) ${this.getTileInfo(x,y)}`;
                });
                tileDiv.addEventListener('mouseout', () => {
                    if(tileInfoDisplayEl) tileInfoDisplayEl.textContent = "Survolez une case pour plus d'infos.";
                });
                mapGridEl.appendChild(tileDiv);
            }
        }
        if (nanobotMapPosEl && gameState && gameState.map && gameState.map.nanobotPos) {
            nanobotMapPosEl.textContent = `(${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y}) dans ${currentZone.name}`;
        }
    },

    getTileDisplayClass: function(x, y) {
        if (!gameState || !gameState.map || !gameState.map.tiles || !gameState.map.tiles[y] || !gameState.map.tiles[y][x] || typeof TILE_TYPES === 'undefined') {
            return 'unexplored unexplored-flat'; // Default fallback
        }
        const tile = gameState.map.tiles[y][x];
        let classes = [];

        const isNanobotCurrentPos = gameState.map.nanobotPos.x === x && gameState.map.nanobotPos.y === y;

        if (isNanobotCurrentPos) {
            classes.push('nanobot');
        } else if (tile.isExplored) {
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
                case TILE_TYPES.RESOURCE_BIOMASS_PATCH: classes.push('resource-biomass'); break;
                case TILE_TYPES.RESOURCE_NANITE_DEPOSIT: classes.push('resource-nanites'); break;
                case TILE_TYPES.RESOURCE_CRYSTAL_VEIN: classes.push('resource-crystal'); break;
                case TILE_TYPES.UPGRADE_CACHE: classes.push(tile.content && tile.content.isOpened ? 'ruins' : 'upgrade'); break; // Show as ruins if opened
                case TILE_TYPES.POI_ANCIENT_STRUCTURE: classes.push('poi-structure'); break;
                case TILE_TYPES.ENEMY_OUTPOST_TILE: classes.push(tile.content && tile.content.currentHealth > 0 ? 'enemy-base' : 'ruins'); break; // Show as ruins if destroyed
                case TILE_TYPES.MERCHANT_WRECKAGE: classes.push('poi-wreckage'); break;
                case TILE_TYPES.ENEMY_PATROL_WEAK: case TILE_TYPES.ENEMY_PATROL_MEDIUM: classes.push('enemy'); break;
                case TILE_TYPES.IMPASSABLE_DEEP_WATER: classes.push('impassable-water explored-impassable'); break;
                case TILE_TYPES.IMPASSABLE_HIGH_PEAK: classes.push('impassable-mountain explored-impassable'); break;
                default: classes.push('grassland'); break; // Fallback for explored empty tiles
            }
        } else { // Not explored
            classes.push('unexplored');
            // Determine unexplored appearance based on baseType and structureType
            switch (tile.baseType) {
                case TILE_TYPES.PRE_EMPTY: classes.push('unexplored-flat'); break;
                case TILE_TYPES.PRE_WATER: classes.push('unexplored-water'); break;
                case TILE_TYPES.PRE_ROUGH_TERRAIN: classes.push('unexplored-rough'); break;
                case TILE_TYPES.PRE_HIGH_MOUNTAIN: classes.push('unexplored-impassable'); break;
                // Potentially add specific PRE types for crystal, ruin outlines if needed for more visual cues
                default: classes.push('unexplored-flat'); break;
            }

            if (tile.structureType) { // Add class for visible structure silhouette
                switch (tile.structureType) {
                    case TILE_TYPES.PRE_RUIN_SILHOUETTE: classes.push('unexplored-ruin-outline'); break;
                    case TILE_TYPES.PRE_LARGE_CRYSTAL_CLUSTER: classes.push('unexplored-large-crystal'); break;
                    case TILE_TYPES.PRE_HOSTILE_STRUCTURE: classes.push('unexplored-enemy-base-outline'); break;
                    case TILE_TYPES.PRE_DISTRESS_SIGNAL: classes.push('unexplored-distress-signal'); break;
                }
            }
             // If scanned, add scan overlay classes
            if (tile.isScanned && tile.scannedActualType !== null) {
                classes.push('scanned');
                switch(tile.scannedActualType) {
                    case TILE_TYPES.RESOURCE_BIOMASS_PATCH: classes.push('scanned-actual-biomass'); break;
                    case TILE_TYPES.RESOURCE_NANITE_DEPOSIT: classes.push('scanned-actual-nanites'); break;
                    case TILE_TYPES.RESOURCE_CRYSTAL_VEIN: classes.push('scanned-actual-crystal'); break;
                    case TILE_TYPES.ENEMY_PATROL_WEAK: case TILE_TYPES.ENEMY_PATROL_MEDIUM: classes.push('scanned-actual-enemy'); break;
                    case TILE_TYPES.UPGRADE_CACHE: classes.push('scanned-actual-upgrade'); break;
                    case TILE_TYPES.ENEMY_OUTPOST_TILE: classes.push('scanned-actual-enemy-base'); break;
                    case TILE_TYPES.EMPTY_GRASSLAND: case TILE_TYPES.EMPTY_DESERT: case TILE_TYPES.EMPTY_WATER:
                    case TILE_TYPES.FOREST: case TILE_TYPES.MOUNTAIN: case TILE_TYPES.RUINS:
                        classes.push('scanned-actual-empty'); break;
                    // Add more cases for POIs etc. if needed for scanned view
                }
            }
        }
        return classes.join(' ');
    },

    getTileInfo: function(x,y) {
        // console.log(`explorationUI: getTileInfo pour (${x},${y})`);
        if (!gameState || !gameState.map || !gameState.map.tiles || !gameState.map.tiles[y] || !gameState.map.tiles[y][x] || typeof TILE_TYPES === 'undefined' || typeof MAP_FEATURE_DATA === 'undefined') {
            return "Données indisponibles.";
        }
        const tile = gameState.map.tiles[y][x];

        if (tile.isExplored) {
            const actualType = tile.actualType;
            const content = tile.content;
            let tileName = this.getTileContentName(actualType, content);

            if (content) {
                if (content.type === 'resource') return `${tileName} (${content.amount} unités).`;
                if (content.type === 'enemy_patrol') return `Danger ! ${content.details?.name || "Patrouille ennemie"}.`;
                if (content.type === 'cache') return content.isOpened ? `${tileName} (Vide).` : tileName;
                if (content.type === 'poi') return `${tileName}. ${content.isInteracted ? "(Examiné)" : ""}`;
                if (content.type === 'enemy_base') return `${tileName} (PV: ${content.currentHealth}/${content.details?.health}).`;
            }
            return tileName; // Just the name if no specific content details to add
        } else { // Non exploré
            let info = "Zone non explorée. ";
            info += `Terrain apparent: ${this.getTerrainTypeName(tile.baseType)}. `;
            if (tile.structureType) {
                info += `Structure visible: ${this.getStructureTypeName(tile.structureType)}. `;
            }
            if (tile.isScanned && tile.scannedActualType !== null) {
                info += `Scan récent : ${this.getTileContentName(tile.scannedActualType, null) || "Signal non identifié"}.`;
            }
            return info.trim();
        }
    },

    updateExplorationLogDisplay: function() {
        // console.log("explorationUI: updateExplorationLogDisplay CALLED");
        if (!explorationLogEl || !gameState || !gameState.explorationLog) {
            console.warn("explorationUI.updateExplorationLogDisplay: Elément de log ou gameState.explorationLog manquant.");
            return;
        }

        // Find the H3 title if it exists within the sidebar, expected to be a sibling or parent's child of explorationLogEl
        let h3HTML = '';
        const sidebar = explorationLogEl.closest('#exploration-sidebar'); // Find the sidebar container
        if (sidebar) {
            const h3TitleElement = sidebar.querySelector('h3'); // Assuming H3 is a direct child or descendant of sidebar
            if (h3TitleElement && h3TitleElement.textContent.toLowerCase().includes("journal d'exploration")) {
                 // Only save it if it's the correct H3
                 h3HTML = h3TitleElement.outerHTML;
            }
        }

        // Clear all content of explorationLogEl
        explorationLogEl.innerHTML = '';

        // If an H3 was specifically for the exploration log and it's NOT part of explorationLogEl but its parent,
        // this clear won't remove it. If it WAS part of explorationLogEl, it's gone.
        // The current HTML structure has H3 outside explorationLogEl div.
        // So, we just repopulate the explorationLogEl div.

        if (gameState.explorationLog.length === 0 || (gameState.explorationLog.length === 1 && gameState.explorationLog[0].includes("initialisé"))) {
            if (!explorationLogEl.querySelector('p.text-gray-500.italic')) {
                const placeholderP = document.createElement('p');
                placeholderP.className = 'text-gray-500 italic';
                placeholderP.textContent = 'Aucun événement d\'exploration récent...';
                explorationLogEl.appendChild(placeholderP);
            }
        } else {
            const logToDisplay = gameState.explorationLog.slice(-20);
            logToDisplay.forEach(msg => {
                const entry = document.createElement('p');
                if (msg.toLowerCase().includes("collecté") || msg.toLowerCase().includes("trouvé") || msg.toLowerCase().includes("réussi") || msg.toLowerCase().includes("terminée")) entry.classList.add("text-green-400");
                else if (msg.toLowerCase().includes("danger") || msg.toLowerCase().includes("hostile") || msg.toLowerCase().includes("erreur") || msg.toLowerCase().includes("impossible")) entry.classList.add("text-red-400");
                else if (msg.toLowerCase().includes("déplacement") || msg.toLowerCase().includes("zone") || msg.toLowerCase().includes("découverte") || msg.toLowerCase().includes("scan") || msg.toLowerCase().includes("arriv")) entry.classList.add("text-blue-300");
                else entry.classList.add("text-gray-300");
                entry.innerHTML = msg; // Messages already have timestamp from addLogEntry
                explorationLogEl.appendChild(entry);
            });
        }
        if (explorationLogEl) explorationLogEl.scrollTop = explorationLogEl.scrollHeight;
    },

    updateTileInteractionPanel: function(x, y) {
        // console.log(`explorationUI: updateTileInteractionPanel pour (${x},${y})`);
        const panel = tileInteractionPanelEl;
        const detailsDiv = tileInteractionDetailsEl;
        const actionsDiv = tileInteractionActionsEl;

        if (!panel || !detailsDiv || !actionsDiv) { console.warn("explorationUI.updateTileInteractionPanel: Un ou plusieurs éléments du panneau sont manquants."); return; }

        if (x === undefined || y === undefined || !gameState || !gameState.map || !mapManager.getTile(x,y) ) {
            detailsDiv.innerHTML = `<p class="text-gray-500 italic">Cliquez sur une case adjacente pour interagir ou vous déplacer.</p>`;
            actionsDiv.innerHTML = '';
            return;
        }

        const tile = mapManager.getTile(x,y);
        let detailsHtml = `<p><b>Case:</b> (${x}, ${y})</p>`;
        detailsHtml += `<p><b>Statut:</b> ${tile.isExplored ? 'Explorée' : 'Non explorée'}</p>`;
        detailsHtml += `<p><b>Terrain:</b> ${this.getTerrainTypeName(tile.baseType)}</p>`;

        if (!tile.isExplored && tile.structureType) {
            detailsHtml += `<p><b>Structure:</b> ${this.getStructureTypeName(tile.structureType)}</p>`;
        }
        actionsDiv.innerHTML = ''; // Clear previous actions

        if (tile.isExplored) {
            detailsHtml += `<p><b>Contenu:</b> ${this.getTileContentName(tile.actualType, tile.content)}</p>`;
            if (tile.content) {
                const content = tile.content;
                if (content.type === 'resource' && content.amount > 0) { detailsHtml += `<p>Quantité restante: ${content.amount}</p>`;}
                else if (content.type === 'enemy_patrol') { detailsHtml += `<p class="text-red-400">Ennemi: ${content.details.name}</p>`;}
                else if (content.type === 'cache' ) { detailsHtml += `<p class="text-yellow-400">Cache ${content.isOpened ? "(Vide)" : "non ouverte"}.</p>`;}
                else if (content.type === 'poi') { detailsHtml += `<p class="text-blue-300">${(typeof MAP_FEATURE_DATA !== 'undefined' && MAP_FEATURE_DATA[content.poiType]?.description) || "Point d'intérêt."} ${content.isInteracted ? "(Déjà examiné)" : "(À examiner)"}</p>`;}
                else if (content.type === 'enemy_base') {
                    detailsHtml += `<p class="font-semibold">${content.details.name}</p>`;
                    detailsHtml += `<p>Intégrité: <span class="${content.currentHealth > 0 ? 'text-red-400' : 'text-green-400'}">${content.currentHealth} / ${content.details.health}</span></p>`;
                    if (content.currentHealth > 0) {
                        const dxPos = Math.abs(x - gameState.map.nanobotPos.x);
                        const dyPos = Math.abs(y - gameState.map.nanobotPos.y);
                        const isAdjacent = dxPos <= 1 && dyPos <= 1 && !(dxPos === 0 && dyPos === 0);
                        if (isAdjacent) {
                            const attackButton = document.createElement('button');
                            attackButton.className = 'btn btn-danger btn-sm'; // Ensure btn-sm for consistency
                            attackButton.textContent = `Attaquer ${content.details.name}`;
                            attackButton.onclick = () => {
                                if(typeof explorationController !== 'undefined' && typeof explorationController.attemptAttackEnemyBase === 'function') {
                                    explorationController.attemptAttackEnemyBase(x,y);
                                } else { console.error("explorationController.attemptAttackEnemyBase non défini.");}
                            };
                            actionsDiv.appendChild(attackButton);
                        } else {
                            actionsDiv.innerHTML = `<p class="text-xs text-yellow-500 italic">Rapprochez-vous pour attaquer.</p>`;
                        }
                    } else {
                         detailsHtml += `<p class="text-green-400">Base détruite.</p>`;
                    }
                }
            }
        } else if (tile.isScanned && tile.scannedActualType !== null) {
            detailsHtml += `<p class="text-yellow-300"><b>Scan Actif:</b> Révèle ${this.getTileContentName(tile.scannedActualType, null) || "Signal non identifié"}</p>`;
        } else {
            detailsHtml += `<p class="text-gray-400 italic">Marchez sur une case adjacente pour l'explorer.</p>`;
        }
        detailsDiv.innerHTML = detailsHtml;
    },

    updateZoneSelectionUI: function() {
        // console.log("explorationUI: updateZoneSelectionUI CALLED");
        const zoneListContainer = zoneListContainerEl; // Using the global reference
        if (!zoneListContainer) { console.warn("explorationUI.updateZoneSelectionUI: zoneListContainerEl non trouvé."); return;}

        if (typeof ZONE_DATA === 'undefined' || !gameState || !gameState.unlockedZones || typeof researchData === 'undefined') {
            console.warn("explorationUI.updateZoneSelectionUI: Dépendances (ZONE_DATA, gameState.unlockedZones, researchData) non définies.");
            zoneListContainer.innerHTML = "<p class='text-red-400 italic'>Erreur chargement zones.</p>";
            return;
        }

        zoneListContainer.innerHTML = ''; // Clear previous list
        for (const zoneId in ZONE_DATA) {
            const zone = ZONE_DATA[zoneId];
            let isUnlocked = gameState.unlockedZones.includes(zoneId);

            // Double check unlock conditions, e.g., if a research just completed
            if (!isUnlocked && zone.unlockCondition) {
                if (zone.unlockCondition.research && gameState.research[zone.unlockCondition.research]) {
                    isUnlocked = true;
                    if (!gameState.unlockedZones.includes(zoneId)) gameState.unlockedZones.push(zoneId); // Add if newly unlocked
                }
                // Add other conditions here (e.g., quest completion, item possession)
            }

            const zoneDiv = document.createElement('div');
            zoneDiv.className = 'p-2 rounded '; // Base classes

            if (isUnlocked) {
                zoneDiv.classList.add('hover:bg-gray-600', 'cursor-pointer');
                if (gameState.currentZoneId === zoneId) {
                    zoneDiv.classList.add('bg-blue-600', 'font-semibold');
                    zoneDiv.innerHTML = `<h4 class="text-md text-white">${zone.name}</h4><p class="text-xs text-gray-300">${zone.description || "Aucune description."}</p>`;
                    zoneDiv.title = "Zone actuelle";
                } else {
                    zoneDiv.classList.add('bg-gray-800');
                    zoneDiv.innerHTML = `<h4 class="text-md text-blue-200">${zone.name}</h4><p class="text-xs text-gray-400">${zone.description || "Aucune description."}</p>`;
                    zoneDiv.title = `Voyager vers ${zone.name}`;
                    if (zone.travelCost) {
                        let costStr = Object.entries(zone.travelCost).map(([res,val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
                        zoneDiv.title += ` (Coût: ${costStr})`;
                    }
                    zoneDiv.onclick = () => {
                        if(typeof explorationController !== 'undefined' && typeof explorationController.attemptTravelToZone === 'function') {
                            explorationController.attemptTravelToZone(zoneId);
                        } else { console.error("explorationController.attemptTravelToZone non défini."); }
                    };
                }
            } else { // Locked zone
                zoneDiv.classList.add('bg-gray-900', 'opacity-50');
                let unlockText = "Condition de déblocage inconnue.";
                if (zone.unlockCondition && zone.unlockCondition.research && researchData[zone.unlockCondition.research]) {
                    unlockText = `Débloqué via Recherche: ${researchData[zone.unlockCondition.research].name}`;
                } else if (zone.unlockCondition && zone.unlockCondition.quest && QUEST_DATA[zone.unlockCondition.quest]) {
                    unlockText = `Débloqué via Quête: ${QUEST_DATA[zone.unlockCondition.quest].title}`;
                }
                // Add more unlock condition text details as needed
                zoneDiv.innerHTML = `<h4 class="text-md text-gray-600">${zone.name} (Verrouillé)</h4><p class="text-xs text-gray-500">${unlockText}</p>`;
            }
            zoneListContainer.appendChild(zoneDiv);
        }
    },

    getTerrainTypeName: function(baseType) {
        if(typeof TILE_TYPES === 'undefined') return "Terrain Inconnu";
        switch (baseType) {
            case TILE_TYPES.PRE_EMPTY: return "Plaines Ouvertes";
            case TILE_TYPES.PRE_WATER: return "Étendue d'Eau";
            case TILE_TYPES.PRE_ROUGH_TERRAIN: return "Terrain Accidenté";
            case TILE_TYPES.PRE_HIGH_MOUNTAIN: return "Hauts Sommets";
            case TILE_TYPES.PLAYER_BASE: return "Votre Base";
            default: return "Type de terrain inconnu";
        }
    },

    getStructureTypeName: function(structureType) {
        if(typeof TILE_TYPES === 'undefined' || typeof MAP_FEATURE_DATA === 'undefined') return "Structure Inconnue";
        return MAP_FEATURE_DATA[structureType]?.name || "Structure Non Identifiée";
    },

    getTileContentName: function(actualType, content) {
        if(typeof TILE_TYPES === 'undefined' || typeof MAP_FEATURE_DATA === 'undefined') return "Contenu Inconnu";

        if (content && content.details && content.details.name) return content.details.name; // Specific name from content (e.g. enemy)

        if (content && content.type === 'resource' && content.resourceType) {
             // Fallback for resource name if not directly in TILE_TYPES (e.g. from tileContentDistribution)
            for(const key in TILE_TYPES) {
                if (TILE_TYPES[key] === content.resourceType) {
                     return key.replace('RESOURCE_', '').replace('_PATCH', '').replace('_DEPOSIT', '').replace('_VEIN', '').split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
                }
            }
        }

        // General names based on actualType
        switch (actualType) {
            case TILE_TYPES.EMPTY_GRASSLAND: return "Prairie";
            case TILE_TYPES.EMPTY_DESERT: return "Désert";
            case TILE_TYPES.EMPTY_WATER: return "Eau peu profonde";
            case TILE_TYPES.FOREST: return "Forêt dense";
            case TILE_TYPES.MOUNTAIN: return "Montagne escarpée";
            case TILE_TYPES.RUINS: return MAP_FEATURE_DATA[TILE_TYPES.RUINS]?.name || "Ruines";
            case TILE_TYPES.PLAYER_BASE: return "Noyau du Nexus-7";
            case TILE_TYPES.RESOURCE_BIOMASS_PATCH: return "Dépôt de Biomasse";
            case TILE_TYPES.RESOURCE_NANITE_DEPOSIT: return "Gisement de Nanites";
            case TILE_TYPES.RESOURCE_CRYSTAL_VEIN: return "Filons de Cristal";
            case TILE_TYPES.UPGRADE_CACHE: return "Cache de Matériaux";
            case TILE_TYPES.POI_ANCIENT_STRUCTURE: return MAP_FEATURE_DATA[TILE_TYPES.POI_ANCIENT_STRUCTURE]?.name || "Structure Antique";
            case TILE_TYPES.ENEMY_OUTPOST_TILE: return MAP_FEATURE_DATA[TILE_TYPES.ENEMY_OUTPOST_TILE]?.name || "Avant-poste Ennemi";
            case TILE_TYPES.MERCHANT_WRECKAGE: return MAP_FEATURE_DATA[TILE_TYPES.MERCHANT_WRECKAGE]?.name || "Épave Marchande";
            case TILE_TYPES.ENEMY_PATROL_WEAK: return "Patrouille hostile (faible)";
            case TILE_TYPES.ENEMY_PATROL_MEDIUM: return "Patrouille hostile (moyenne)";
            case TILE_TYPES.IMPASSABLE_DEEP_WATER: return "Eau Profonde (Infranchissable)";
            case TILE_TYPES.IMPASSABLE_HIGH_PEAK: return "Pic Infranchissable";
            default: return "Vide ou inconnu";
        }
    }
};

console.log("explorationUI.js - Objet explorationUI défini.");