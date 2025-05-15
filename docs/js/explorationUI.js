// js/explorationUI.js
console.log("explorationUI.js - Fichier chargé et en cours d'analyse...");

var explorationUI = {
    isFirstExplorationViewUpdate: true, // Pour forcer le centrage la première fois

    updateFullExplorationView: function() {
        // console.log("explorationUI: updateFullExplorationView CALLED");
        if (!gameState || !gameState.map) {
            console.warn("explorationUI.updateFullExplorationView: gameState ou gameState.map non défini.");
            return;
        }

        if (typeof this.updateExplorationMapDisplay !== 'function' ||
            typeof this.updateExplorationLogDisplay !== 'function' ||
            typeof this.updateTileInteractionPanel !== 'function' ||
            typeof this.updateZoneSelectionUI !== 'function') {
            console.error("explorationUI.updateFullExplorationView: Une ou plusieurs fonctions de mise à jour sont manquantes sur this.");
            return;
        }
        this.updateExplorationMapDisplay(); // Ceci appellera centerMapOnPlayer
        this.updateExplorationLogDisplay();
        if (gameState.map.selectedTile) {
            this.updateTileInteractionPanel(gameState.map.selectedTile.x, gameState.map.selectedTile.y);
        } else {
            if (gameState.map.nanobotPos) {
                this.updateTileInteractionPanel(gameState.map.nanobotPos.x, gameState.map.nanobotPos.y);
            } else {
                this.updateTileInteractionPanel();
            }
        }

        // *** MODIFICATION ICI: Forcer le centrage la première fois que cet onglet est affiché ***
        if (this.isFirstExplorationViewUpdate) {
            this.centerMapOnPlayer(true); // true pour instantané
            this.isFirstExplorationViewUpdate = false;
        }
        // *** FIN DE LA MODIFICATION ***
    },

    updateExplorationMapDisplay: function() {
        // console.log("explorationUI: updateExplorationMapDisplay CALLED");
        if(!mapGridEl || !nanobotMapPosEl || !tileInfoDisplayEl || !explorationTitleEl ) {
            console.warn("explorationUI.updateExplorationMapDisplay: Un ou plusieurs éléments DOM de base sont manquants ! (mapGridEl, nanobotMapPosEl, tileInfoDisplayEl, explorationTitleEl)");
            return;
        }
        if (typeof ZONE_DATA === 'undefined' || !gameState || !gameState.map || !gameState.currentZoneId || !ZONE_DATA[gameState.currentZoneId]) {
            console.warn("explorationUI.updateExplorationMapDisplay: ZONE_DATA ou gameState pour la carte non défini.");
            if(mapGridEl) mapGridEl.innerHTML = "<p class='text-red-400 text-xs'>Erreur: Données de zone indisponibles.</p>";
            return;
        }

        if(typeof this.updateZoneSelectionUI === 'function') this.updateZoneSelectionUI();
        else console.warn("explorationUI: this.updateZoneSelectionUI non trouvée dans updateExplorationMapDisplay.");

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

        } else {
            console.warn("explorationUI: mapGridEl ou mapScrollContainer non trouvé lors de la configuration de la grille.");
            return;
        }

        let scanButton = document.getElementById('scan-map-button');
        if (scanButton && typeof SCAN_ENERGY_COST !== 'undefined' && typeof SCAN_COOLDOWN_DURATION_SECONDS !== 'undefined' && typeof TICK_SPEED !== 'undefined' && gameState && gameState.nanobotStats) {
            const stats = gameState.nanobotStats;
            const scanCost = SCAN_ENERGY_COST;
            const scanCooldownTimeInTicks = SCAN_COOLDOWN_DURATION_SECONDS * (1000 / TICK_SPEED);
            const onCooldown = gameState.gameTime < (stats.lastScanTime || 0) + scanCooldownTimeInTicks;
            const canAffordScan = gameState.resources.energy >= scanCost;
            scanButton.disabled = onCooldown || !canAffordScan;
            scanButton.classList.toggle('btn-disabled', onCooldown || !canAffordScan);
            scanButton.classList.toggle('btn-info', !onCooldown && canAffordScan); 

            if (onCooldown) scanButton.textContent = `Scan (CD: ${formatTime(Math.ceil(((stats.lastScanTime || 0) + scanCooldownTimeInTicks - gameState.gameTime) * (TICK_SPEED/1000))) })`;
            else if (!canAffordScan) scanButton.textContent = `Scan (${scanCost} NRG) - Insuff.`;
            else scanButton.textContent = `Scanner (${scanCost} NRG)`;

            if (!scanButton.dataset.listenerAttached) { 
                scanButton.addEventListener('click', () => {
                    if (typeof explorationController !== 'undefined' && typeof explorationController.performScan === 'function') {
                        explorationController.performScan();
                    } else {
                        console.error("La fonction explorationController.performScan n'est pas définie.");
                    }
                });
                scanButton.dataset.listenerAttached = 'true';
            }
        }


        if (!Array.isArray(gameState.map.tiles) || gameState.map.tiles.length !== currentZone.mapSize.height) {
            mapGridEl.innerHTML = "<p class='text-yellow-400 italic text-xs'>Initialisation de la carte...</p>";
            return;
        }

        for (let y = 0; y < currentZone.mapSize.height; y++) {
            if (!Array.isArray(gameState.map.tiles[y]) || gameState.map.tiles[y].length !== currentZone.mapSize.width) continue;
            for (let x = 0; x < currentZone.mapSize.width; x++) {
                const tileDiv = document.createElement('div');
                const tileData = this.getTile(x,y);
                const tileClassesString = tileData ? this.getTileDisplayClass(x, y) : 'unexplored unexplored-flat';
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
                    if(tileInfoDisplayEl) tileInfoDisplayEl.textContent = "Survolez une case.";
                });
                mapGridEl.appendChild(tileDiv);
            }
        }

        if (nanobotMapPosEl && gameState && gameState.map && gameState.map.nanobotPos) {
            nanobotMapPosEl.textContent = `(${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y}) / ${currentZone.name}`;
        }
        
        // *** MODIFICATION ICI: S'assurer que le centrage se fait après le rendu de la grille ***
        // L'appel initial important se fait maintenant dans updateFullExplorationView
        // Mais on peut aussi le laisser ici pour les mises à jour de la carte elle-même (ex: changement de zone)
        this.centerMapOnPlayer(true); // true pour un centrage instantané
        // *** FIN DE LA MODIFICATION ***

        const centerBtn = document.getElementById('center-map-btn');
        if (centerBtn && !centerBtn.dataset.listenerAttached) {
            centerBtn.addEventListener('click', () => this.centerMapOnPlayer(false)); // false pour smooth
            centerBtn.dataset.listenerAttached = 'true';
        }
    },

    centerMapOnPlayer: function(instant = false) {
        const mapScrollContainer = document.getElementById('map-scroll-container');
        const mapGrid = document.getElementById('map-grid');
        if (!mapScrollContainer || !mapGrid || !gameState || !gameState.map.nanobotPos) {
            // console.warn("centerMapOnPlayer: Eléments manquants ou nanobotPos non défini.");
            return;
        }

        // Attendre que le navigateur ait une chance de calculer les dimensions
        // requestAnimationFrame est une bonne pratique pour les manipulations DOM qui dépendent des dimensions calculées
        requestAnimationFrame(() => {
            if (!mapScrollContainer.clientWidth || !mapScrollContainer.clientHeight) {
                // console.warn("centerMapOnPlayer (in RAF): mapScrollContainer n'a pas de dimensions. Peut-être caché.");
                // On peut réessayer un peu plus tard si c'est juste un problème de timing de rendu initial
                // setTimeout(() => this.centerMapOnPlayer(instant), 50); // Optionnel: un petit délai et réessayer
                return;
            }

            const tileSizeString = getComputedStyle(document.documentElement).getPropertyValue('--map-tile-effective-size');
            const tileSize = parseFloat(tileSizeString) || 22;
            const gap = 1; 

            const playerTileX = gameState.map.nanobotPos.x;
            const playerTileY = gameState.map.nanobotPos.y;

            // Position en pixels du coin supérieur gauche de la tuile du joueur
            const playerPixelX = playerTileX * (tileSize + gap);
            const playerPixelY = playerTileY * (tileSize + gap);

            // Position en pixels du centre de la tuile du joueur
            const playerCenterX = playerPixelX + tileSize / 2;
            const playerCenterY = playerPixelY + tileSize / 2;

            // Calculer le défilement nécessaire pour amener le centre de la tuile du joueur au centre du conteneur
            const targetScrollLeft = playerCenterX - mapScrollContainer.clientWidth / 2;
            const targetScrollTop = playerCenterY - mapScrollContainer.clientHeight / 2;
            
            mapScrollContainer.scrollTo({
                top: targetScrollTop,
                left: targetScrollLeft,
                behavior: instant ? 'auto' : 'smooth'
            });
            // console.log(`centerMapOnPlayer: Centrage ${instant ? 'instantané' : 'doux'} vers (${targetScrollLeft}, ${targetScrollTop})`);
        });
    },

    getTileDisplayClass: function(x, y) {
        if (!gameState || !gameState.map || !this.getTile(x,y) || typeof TILE_TYPES === 'undefined') {
            return 'unexplored unexplored-flat';
        }
        const tile = this.getTile(x,y);
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
                case TILE_TYPES.UPGRADE_CACHE: classes.push(tile.content && tile.content.isOpened ? 'ruins' : 'upgrade'); break;
                case TILE_TYPES.POI_ANCIENT_STRUCTURE: classes.push('poi-structure'); break;
                case TILE_TYPES.ENEMY_OUTPOST_TILE: classes.push(tile.content && tile.content.currentHealth > 0 ? 'enemy-base' : 'ruins'); break;
                case TILE_TYPES.MERCHANT_WRECKAGE: classes.push('poi-wreckage'); break;
                case TILE_TYPES.ENEMY_PATROL_WEAK: case TILE_TYPES.ENEMY_PATROL_MEDIUM: classes.push('enemy'); break;
                case TILE_TYPES.IMPASSABLE_DEEP_WATER: classes.push('impassable-water explored-impassable'); break;
                case TILE_TYPES.IMPASSABLE_HIGH_PEAK: classes.push('impassable-mountain explored-impassable'); break;
                default: classes.push('grassland'); break; 
            }
            if (tile.content && tile.content.type === 'resource' && tile.content.amount > 0) {
                classes.push('has-active-resource');
            }
        } else { 
            classes.push('unexplored');
            switch (tile.baseType) {
                case TILE_TYPES.PRE_EMPTY: classes.push('unexplored-flat'); break;
                case TILE_TYPES.PRE_WATER: classes.push('unexplored-water'); break;
                case TILE_TYPES.PRE_ROUGH_TERRAIN: classes.push('unexplored-rough'); break;
                case TILE_TYPES.PRE_HIGH_MOUNTAIN: classes.push('unexplored-impassable'); break;
                case TILE_TYPES.PLAYER_BASE: classes.push('base'); break; 
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
            if (tile.isScanned && tile.scannedActualType !== null && gameState.gameTime <= tile.scannedRevealTime) {
                classes.push('scanned');
                switch(tile.scannedActualType) {
                    case TILE_TYPES.RESOURCE_BIOMASS_PATCH: classes.push('scanned-actual-biomass'); break;
                    case TILE_TYPES.RESOURCE_NANITE_DEPOSIT: classes.push('scanned-actual-nanites'); break;
                    case TILE_TYPES.RESOURCE_CRYSTAL_VEIN: classes.push('scanned-actual-crystal'); break;
                    case TILE_TYPES.ENEMY_PATROL_WEAK: case TILE_TYPES.ENEMY_PATROL_MEDIUM: classes.push('scanned-actual-enemy'); break;
                    case TILE_TYPES.UPGRADE_CACHE: classes.push('scanned-actual-upgrade'); break;
                    case TILE_TYPES.ENEMY_OUTPOST_TILE: classes.push('scanned-actual-enemy-base'); break;
                    case TILE_TYPES.IMPASSABLE_DEEP_WATER: classes.push('scanned-actual-impassable-water'); break;
                    case TILE_TYPES.IMPASSABLE_HIGH_PEAK: classes.push('scanned-actual-impassable-mountain'); break;
                    default: classes.push('scanned-actual-empty'); break; 
                }
            }
        }
        return classes.join(' ');
    },

    getTileInfo: function(x,y) {
        if (!gameState || !gameState.map || !this.getTile(x,y) || typeof TILE_TYPES === 'undefined' || typeof MAP_FEATURE_DATA === 'undefined') {
            return "Données indisponibles.";
        }
        const tile = this.getTile(x,y);
        if (tile.isExplored) { const actualType = tile.actualType; const content = tile.content; let tileName = this.getTileContentName(actualType, content); if (content) { if (content.type === 'resource' && content.amount > 0) return `${tileName} (${content.amount} u).`; else if (content.type === 'resource' && content.amount <= 0) return `${tileName} (Épuisé).`; if (content.type === 'enemy_patrol') return `Danger! ${content.details?.name || "Patrouille"}.`; if (content.type === 'cache') return content.isOpened ? `${tileName} (Vide).` : tileName; if (content.type === 'poi') return `${tileName}. ${content.isInteracted ? "(Examiné)" : ""}`; if (content.type === 'enemy_base') return `${tileName} (PV: ${content.currentHealth}/${content.details?.health}).`;} return tileName;
        } else {  let info = "NE. "; info += `Terr: ${this.getTerrainTypeName(tile.baseType)}. `; if (tile.structureType) info += `Struct: ${this.getStructureTypeName(tile.structureType)}. `; if (tile.isScanned && tile.scannedActualType !== null && gameState.gameTime <= tile.scannedRevealTime) info += `Scan: ${this.getTileContentName(tile.scannedActualType, null) || "Signal?"}.`; return info.trim(); }
    },

    updateExplorationLogDisplay: function() {
        if (!explorationLogEl || !gameState || !gameState.explorationLog) { console.warn("explorationUI.updateExplorationLogDisplay: Elément de log ou gameState.explorationLog manquant."); return; }
        explorationLogEl.innerHTML = ''; 
        if (gameState.explorationLog.length === 0 || (gameState.explorationLog.length === 1 && gameState.explorationLog[0].includes("initialisé"))) { if (!explorationLogEl.querySelector('p.text-gray-500.italic')) { const placeholderP = document.createElement('p'); placeholderP.className = 'text-gray-500 italic text-xs'; placeholderP.textContent = 'Aucun événement récent...'; explorationLogEl.appendChild(placeholderP);}}
        else { const logToDisplay = gameState.explorationLog.slice(-20); logToDisplay.forEach(msg => { const entry = document.createElement('p'); entry.className = 'text-xs'; if (typeof msg === 'string') { if (msg.toLowerCase().includes("collecté") || msg.toLowerCase().includes("trouvé") || msg.toLowerCase().includes("réussi") || msg.toLowerCase().includes("terminée") || msg.toLowerCase().includes("victoire")) entry.classList.add("text-green-400"); else if (msg.toLowerCase().includes("danger") || msg.toLowerCase().includes("hostile") || msg.toLowerCase().includes("erreur") || msg.toLowerCase().includes("impossible") || msg.toLowerCase().includes("vaincu")) entry.classList.add("text-red-400"); else if (msg.toLowerCase().includes("déplacement") || msg.toLowerCase().includes("zone") || msg.toLowerCase().includes("découverte") || msg.toLowerCase().includes("scan") || msg.toLowerCase().includes("arriv")) entry.classList.add("text-blue-300"); else if (msg.toLowerCase().includes("indécis") || msg.toLowerCase().includes("retraite") || msg.toLowerCase().includes("attention")) entry.classList.add("text-yellow-400"); else entry.classList.add("text-gray-300"); entry.innerHTML = msg; } else { entry.textContent = "Entrée log invalide."; entry.classList.add("text-red-500");} explorationLogEl.appendChild(entry); });}
        if (explorationLogEl) explorationLogEl.scrollTop = explorationLogEl.scrollHeight;
    },

    updateTileInteractionPanel: function(x, y) {
        const panel = tileInteractionPanelEl; const detailsDiv = tileInteractionDetailsEl; const actionsDiv = tileInteractionActionsEl;
        if (!panel || !detailsDiv || !actionsDiv) { console.warn("explorationUI.updateTileInteractionPanel: Eléments panneau manquants."); return; }
        if (x === undefined || y === undefined || !gameState || !gameState.map || !this.getTile(x,y) ) { detailsDiv.innerHTML = `<h4 class="font-orbitron text-sm text-blue-300 mb-1">Interaction</h4><p class="text-gray-500 italic text-xs">Cliquez une case.</p>`; actionsDiv.innerHTML = ''; return; }
        const tile = this.getTile(x,y); const nanobotIsOnThisTile = gameState.map.nanobotPos.x === x && gameState.map.nanobotPos.y === y;
        let detailsHtml = `<h4 class="font-orbitron text-sm text-blue-300 mb-1">Détails (${x}, ${y})</h4>`; detailsHtml += `<p class="text-xs"><b>Statut:</b> ${tile.isExplored ? 'Explorée' : 'Non explorée'}</p>`; detailsHtml += `<p class="text-xs"><b>Terrain:</b> ${this.getTerrainTypeName(tile.baseType)}</p>`;
        if (!tile.isExplored && tile.structureType) detailsHtml += `<p class="text-xs"><b>Structure:</b> ${this.getStructureTypeName(tile.structureType)}</p>`;
        actionsDiv.innerHTML = ''; 
        if (tile.isExplored) {
            detailsHtml += `<p class="text-xs"><b>Contenu:</b> ${this.getTileContentName(tile.actualType, tile.content)}</p>`;
            if (tile.content) { const content = tile.content; 
                if (content.type === 'resource' && content.amount > 0) { detailsHtml += `<p class="text-xs">Quantité: ${content.amount}</p>`;}
                else if (content.type === 'resource' && content.amount <= 0) { detailsHtml += `<p class="text-xs text-gray-500">Épuisé.</p>`;}
                else if (content.type === 'enemy_patrol') { detailsHtml += `<p class="text-xs text-red-400">Ennemi: ${content.details.name}</p>`;}
                else if (content.type === 'cache' ) { detailsHtml += `<p class="text-xs text-yellow-400">Cache ${content.isOpened ? "(Vide)" : "non ouverte"}.</p>`;}
                else if (content.type === 'poi') { detailsHtml += `<p class="text-xs text-blue-300">${(typeof MAP_FEATURE_DATA !== 'undefined' && MAP_FEATURE_DATA[content.poiType]?.description) || "Point d'intérêt."} ${content.isInteracted ? "(Déjà examiné)" : "(À examiner)"}</p>`; if (nanobotIsOnThisTile && !content.isInteracted) { const interactButton = document.createElement('button'); interactButton.className = 'btn btn-info btn-xs w-full mt-1'; interactButton.textContent = `Examiner ${this.getTileContentName(tile.actualType, content)}`; interactButton.onclick = () => { if (typeof explorationController !== 'undefined' && typeof explorationController.processTileContentOnArrival === 'function') explorationController.processTileContentOnArrival(x, y); }; actionsDiv.appendChild(interactButton);}}
                else if (content.type === 'enemy_base') { detailsHtml += `<p class="text-xs font-semibold">${content.details.name}</p>`; detailsHtml += `<p class="text-xs">Intégrité: <span class="${content.currentHealth > 0 ? 'text-red-400' : 'text-green-400'}">${content.currentHealth}/${content.details.health}</span></p>`; if (content.currentHealth > 0) { const dxPosBase = Math.abs(x - gameState.map.nanobotPos.x); const dyPosBase = Math.abs(y - gameState.map.nanobotPos.y); const isAdjacentOrOnTileForBase = (dxPosBase <= 1 && dyPosBase <= 1); if (isAdjacentOrOnTileForBase) { const attackButton = document.createElement('button'); attackButton.className = 'btn btn-danger btn-xs w-full mt-1'; attackButton.textContent = `Attaquer ${content.details.name}`; attackButton.onclick = () => { if(typeof explorationController !== 'undefined' && typeof explorationController.attemptAttackEnemyBase === 'function') explorationController.attemptAttackEnemyBase(x,y); }; actionsDiv.appendChild(attackButton);} else { actionsDiv.innerHTML = `<p class="text-xs text-yellow-500 italic">Rapprochez-vous.</p>`;}} else { detailsHtml += `<p class="text-xs text-green-400">Détruite.</p>`;}}
            }
        } else if (tile.isScanned && tile.scannedActualType !== null && gameState.gameTime <= tile.scannedRevealTime) { detailsHtml += `<p class="text-xs text-yellow-300"><b>Scan:</b> ${this.getTileContentName(tile.scannedActualType, null) || "Signal?"}</p>`;}
        const dxPosMove = Math.abs(x - gameState.map.nanobotPos.x); const dyPosMove = Math.abs(y - gameState.map.nanobotPos.y); const isAdjacentMove = dxPosMove <= 1 && dyPosMove <= 1 && !(dxPosMove === 0 && dyPosMove === 0);
        if (!nanobotIsOnThisTile && isAdjacentMove && tile.actualType !== TILE_TYPES.IMPASSABLE_DEEP_WATER && tile.actualType !== TILE_TYPES.IMPASSABLE_HIGH_PEAK) { const moveButton = document.createElement('button'); moveButton.className = 'btn btn-primary btn-xs mt-1 w-full'; moveButton.textContent = `Déplacer (${EXPLORATION_COST_ENERGY} Énergie)`; if (gameState.resources.energy < EXPLORATION_COST_ENERGY) { moveButton.disabled = true; moveButton.classList.add('btn-disabled'); } moveButton.onclick = () => { if (typeof explorationController !== 'undefined' && typeof explorationController.handleTileClick === 'function') explorationController.handleTileClick(x, y); }; actionsDiv.appendChild(moveButton);}
        if (actionsDiv.innerHTML === '') actionsDiv.innerHTML = `<p class="text-xs text-gray-500 italic">Aucune action ici.</p>`;
        detailsDiv.innerHTML = detailsHtml;
    },

    updateZoneSelectionUI: function() {
        const zoneListContainer = zoneListContainerEl; if (!zoneListContainer) return;
        if (typeof ZONE_DATA === 'undefined' || !gameState || !gameState.unlockedZones || typeof researchData === 'undefined' || typeof QUEST_DATA === 'undefined') { zoneListContainer.innerHTML = "<p class='text-red-400 italic text-xs'>Erreur zones.</p>"; return;}
        zoneListContainer.innerHTML = ''; 
        for (const zoneId in ZONE_DATA) { const zone = ZONE_DATA[zoneId]; let isUnlocked = gameState.unlockedZones.includes(zoneId); if (!isUnlocked && zone.unlockCondition?.research && gameState.research[zone.unlockCondition.research]) { isUnlocked = true; if (!gameState.unlockedZones.includes(zoneId)) gameState.unlockedZones.push(zoneId); }
            const zoneDiv = document.createElement('div'); zoneDiv.className = 'p-1 rounded text-xs '; 
            if (isUnlocked) { zoneDiv.classList.add('hover:bg-gray-600', 'cursor-pointer'); if (gameState.currentZoneId === zoneId) { zoneDiv.classList.add('bg-blue-700', 'font-semibold'); zoneDiv.innerHTML = `<h5 class="text-xs text-white">${zone.name}</h5>`; zoneDiv.title = "Zone actuelle";} else { zoneDiv.classList.add('bg-gray-800'); zoneDiv.innerHTML = `<h5 class="text-xs text-blue-300">${zone.name}</h5>`; zoneDiv.title = `Voyager vers ${zone.name}`; if (zone.travelCost) { let costStr = Object.entries(zone.travelCost).map(([res,val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', '); zoneDiv.title += ` (Coût: ${costStr})`;} zoneDiv.onclick = () => { if(typeof explorationController !== 'undefined' && typeof explorationController.attemptTravelToZone === 'function') explorationController.attemptTravelToZone(zoneId); };}}
            else { zoneDiv.classList.add('bg-gray-900', 'opacity-60'); let unlockText = "Condition déblocage inconnue."; if (zone.unlockCondition?.research && researchData[zone.unlockCondition.research]) unlockText = `Recherche: ${researchData[zone.unlockCondition.research].name}`; else if (zone.unlockCondition?.quest && QUEST_DATA[zone.unlockCondition.quest]) unlockText = `Quête: ${QUEST_DATA[zone.unlockCondition.quest].title}`; zoneDiv.innerHTML = `<h5 class="text-xs text-gray-600">${zone.name} (Verrouillé)</h5><p class="text-xs text-gray-500">${unlockText}</p>`;}
            zoneListContainer.appendChild(zoneDiv);
        }
    },

    getTerrainTypeName: function(baseType) { return TILE_TYPES ? ({[TILE_TYPES.PRE_EMPTY]:"Plaines", [TILE_TYPES.PRE_WATER]:"Eau", [TILE_TYPES.PRE_ROUGH_TERRAIN]:"Accidenté", [TILE_TYPES.PRE_HIGH_MOUNTAIN]:"Sommets", [TILE_TYPES.PLAYER_BASE]:"Votre Base",})[baseType] || "Terr. Inconnu" : "Terr. Inconnu";},
    getStructureTypeName: function(structureType) { return (TILE_TYPES && MAP_FEATURE_DATA) ? MAP_FEATURE_DATA[structureType]?.name || "Struct. Non Ident." : "Struct. Inconnue";},
    getTileContentName: function(actualType, content) { if(TILE_TYPES && MAP_FEATURE_DATA){ if (content?.details?.name) return content.details.name; if (content?.type === 'resource' && content.resourceType) { for(const key in TILE_TYPES) if (TILE_TYPES[key] === content.resourceType) return key.replace('RESOURCE_', '').replace('_PATCH', '').replace('_DEPOSIT', '').replace('_VEIN', '').split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');} return ({[TILE_TYPES.EMPTY_GRASSLAND]:"Prairie", [TILE_TYPES.EMPTY_DESERT]:"Désert", [TILE_TYPES.EMPTY_WATER]:"Eau peu prof.", [TILE_TYPES.FOREST]:"Forêt", [TILE_TYPES.MOUNTAIN]:"Montagne", [TILE_TYPES.RUINS]:MAP_FEATURE_DATA[TILE_TYPES.RUINS]?.name||"Ruines", [TILE_TYPES.PLAYER_BASE]:"Noyau Nexus-7", [TILE_TYPES.RESOURCE_BIOMASS_PATCH]:"Biomasse", [TILE_TYPES.RESOURCE_NANITE_DEPOSIT]:"Nanites", [TILE_TYPES.RESOURCE_CRYSTAL_VEIN]:"Cristaux", [TILE_TYPES.UPGRADE_CACHE]:"Cache", [TILE_TYPES.POI_ANCIENT_STRUCTURE]:MAP_FEATURE_DATA[TILE_TYPES.POI_ANCIENT_STRUCTURE]?.name||"Struct. Antique", [TILE_TYPES.ENEMY_OUTPOST_TILE]:MAP_FEATURE_DATA[TILE_TYPES.ENEMY_OUTPOST_TILE]?.name||"Avant-poste En.", [TILE_TYPES.MERCHANT_WRECKAGE]:MAP_FEATURE_DATA[TILE_TYPES.MERCHANT_WRECKAGE]?.name||"Épave March.", [TILE_TYPES.ENEMY_PATROL_WEAK]:"Patrouille faible", [TILE_TYPES.ENEMY_PATROL_MEDIUM]:"Patrouille moy.", [TILE_TYPES.IMPASSABLE_DEEP_WATER]:"Eau Profonde (X)", [TILE_TYPES.IMPASSABLE_HIGH_PEAK]:"Pic Infranch.(X)"})[actualType] || "Vide";} return "Contenu Inconnu"; },
    getTile: function(x, y) {
        if (gameState && gameState.map && gameState.map.tiles && gameState.map.tiles[y] && gameState.map.tiles[y][x]) {
            return gameState.map.tiles[y][x];
        }
        return null;
    }
};

console.log("explorationUI.js - Objet explorationUI défini.");