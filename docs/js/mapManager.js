// js/mapManager.js
console.log("mapManager.js - Fichier chargé et en cours d'analyse...");

var mapManager = {
    generateMap: function(zoneId) {
        console.log(`mapManager: generateMap pour la zone ${zoneId}`);
        if (typeof ZONE_DATA === 'undefined' || typeof TILE_TYPES === 'undefined' ||
            typeof explorationEnemyData === 'undefined' || typeof enemyBaseDefinitions === 'undefined' ||
            typeof BASE_COORDINATES === 'undefined' || typeof DEFAULT_MAP_SIZE === 'undefined' ||
            typeof gameState === 'undefined' || typeof TILE_TYPES_TO_RESOURCE_KEY === 'undefined' ||
            typeof activeTileViewData === 'undefined' // NOUVELLE DÉPENDANCE
           ) {
            console.error("mapManager.generateMap: Dépendances de configuration critiques non définies.");
            // Fallback simple si des configs sont manquantes
            gameState.map.tiles = Array(DEFAULT_MAP_SIZE.height).fill(null).map(() => Array(DEFAULT_MAP_SIZE.width).fill({
                baseType: TILE_TYPES.PRE_EMPTY, structureType: null, actualType: TILE_TYPES.EMPTY_GRASSLAND,
                content: null, isExplored: false, isFullyExplored: false,
                baseActions: activeTileViewData?.default?.baseActions || ['scan_local_active', 'search_area_active'], // Utiliser des actions par défaut
                hiddenFeatures: [], revealedFeatures: [], searchAttempts: 0, usedActions: {},
                x: 0, y: 0 // Coordonnées de la tuile elle-même
            }));
            gameState.map.zoneId = zoneId;
            gameState.currentZoneId = zoneId;
            gameState.map.nanobotPos = { x: Math.floor(DEFAULT_MAP_SIZE.width / 2), y: Math.floor(DEFAULT_MAP_SIZE.height / 2) };
            const startTile = this.getTile(gameState.map.nanobotPos.x, gameState.map.nanobotPos.y);
            if (startTile) startTile.isExplored = true;
            return;
        }

        const zone = ZONE_DATA[zoneId];
        if (!zone) {
            console.error(`mapManager.generateMap: Données de zone introuvables pour l'ID: ${zoneId}`);
            // Fallback comme ci-dessus
            // ... (copier le code de fallback précédent si nécessaire)
            return;
        }

        gameState.map.tiles = [];
        gameState.map.zoneId = zoneId;
        gameState.currentZoneId = zoneId; // S'assurer que currentZoneId est bien mis à jour
        gameState.map.nanobotPos = { ...(zone.entryPoint || {x:Math.floor(zone.mapSize.width / 2), y:Math.floor(zone.mapSize.height / 2)}) };
        gameState.map.selectedTile = null;
        gameState.map.activeExplorationTileCoords = null; // Réinitialiser en changeant de zone
        console.log(`mapManager.generateMap - NanobotPos initialisé à: (${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y}) pour la zone ${zoneId}`);

        const playerBaseCoords = zone.basePlayerCoordinates || BASE_COORDINATES;

        for (let y = 0; y < zone.mapSize.height; y++) {
            gameState.map.tiles[y] = [];
            for (let x = 0; x < zone.mapSize.width; x++) {
                let baseTileType = TILE_TYPES.PRE_EMPTY;
                let structureOnTile = null;
                let actualTileType = TILE_TYPES.EMPTY_GRASSLAND;
                let tileContent = null;

                // NOUVELLES PROPRIÉTÉS POUR L'EXPLORATION ACTIVE
                let baseActionsForTile = activeTileViewData?.default?.baseActions || ['scan_local_active', 'search_area_active'];
                let possibleHiddenFeaturesForTile = activeTileViewData?.default?.possibleHiddenFeatures || [];
                let hiddenFeaturesOnThisTile = [];

                // 1. Base terrain
                if (zone.baseTerrainLayout && zone.baseTerrainLayout[y] && zone.baseTerrainLayout[y][x] !== undefined) {
                    baseTileType = zone.baseTerrainLayout[y][x];
                } else {
                    // Logique procédurale simplifiée pour le terrain de base
                    if (y === 0 || y === zone.mapSize.height - 1 || x === 0 || x === zone.mapSize.width - 1) {
                        baseTileType = TILE_TYPES.PRE_HIGH_MOUNTAIN;
                    } else if (Math.random() < 0.1) baseTileType = TILE_TYPES.PRE_ROUGH_TERRAIN;
                    else if (Math.random() < 0.05) baseTileType = TILE_TYPES.PRE_HIGH_MOUNTAIN;
                    else if (Math.random() < 0.08) baseTileType = TILE_TYPES.PRE_WATER;
                    else baseTileType = TILE_TYPES.PRE_EMPTY; // Default to PRE_EMPTY
                }

                // 2. Structure visible (pré-définie ou par distribution)
                if (zone.visibleStructureLayout && zone.visibleStructureLayout[y] && zone.visibleStructureLayout[y][x] !== undefined) {
                    structureOnTile = zone.visibleStructureLayout[y][x];
                }

                // 3. Actual Type et Contenu Principal (visible immédiatement après exploration)
                let isPlayerBaseTile = (x === playerBaseCoords.x && y === playerBaseCoords.y && zone.id === (ZONE_DATA[gameState.currentZoneId]?.id || zone.id));


                if (isPlayerBaseTile) {
                    actualTileType = TILE_TYPES.PLAYER_BASE;
                    baseTileType = TILE_TYPES.PLAYER_BASE;
                    structureOnTile = null;
                    tileContent = null;
                } else if (baseTileType === TILE_TYPES.PRE_HIGH_MOUNTAIN) {
                    actualTileType = TILE_TYPES.IMPASSABLE_HIGH_PEAK;
                } else if (baseTileType === TILE_TYPES.PRE_WATER) {
                    actualTileType = Math.random() < 0.3 ? TILE_TYPES.IMPASSABLE_DEEP_WATER : TILE_TYPES.EMPTY_WATER;
                } else if (baseTileType === TILE_TYPES.PRE_DEBRIS_FIELD) { // NOUVEAU
                    actualTileType = TILE_TYPES.DEBRIS_FIELD;
                } else if (baseTileType === TILE_TYPES.PRE_THICK_VINES) { // NOUVEAU
                    actualTileType = TILE_TYPES.THICK_VINES;
                }
                else { // Potentially explorable tile, try to place main content
                    let random = Math.random();
                    let cumulativeProbability = 0;
                    let foundContent = false;

                    if (zone.tileContentDistribution) {
                        for (const keyInDistroString in zone.tileContentDistribution) {
                            cumulativeProbability += zone.tileContentDistribution[keyInDistroString];
                            if (random < cumulativeProbability) {
                                foundContent = true;
                                const numericKey = parseInt(keyInDistroString);

                                if (explorationEnemyData[keyInDistroString]) {
                                    actualTileType = explorationEnemyData[keyInDistroString].actualTileType;
                                    tileContent = { type: 'enemy_patrol', details: { ...explorationEnemyData[keyInDistroString] }, id: keyInDistroString, x:x, y:y };
                                } else if (enemyBaseDefinitions[keyInDistroString]) {
                                    actualTileType = enemyBaseDefinitions[keyInDistroString].actualTileType;
                                    tileContent = { type: 'enemy_base', details: { ...enemyBaseDefinitions[keyInDistroString] }, id: keyInDistroString, currentHealth: enemyBaseDefinitions[keyInDistroString].health, x:x, y:y };
                                    structureOnTile = structureOnTile || enemyBaseDefinitions[keyInDistroString].visibleStructureType || TILE_TYPES.PRE_HOSTILE_STRUCTURE;
                                } else if (!isNaN(numericKey) && Object.values(TILE_TYPES).includes(numericKey)) {
                                    actualTileType = numericKey;
                                    if (TILE_TYPES_TO_RESOURCE_KEY[actualTileType]) {
                                        tileContent = { type: 'resource', resourceType: actualTileType, amount: Math.floor(Math.random() * 60) + 40, x:x, y:y };
                                    } else if (actualTileType === TILE_TYPES.UPGRADE_CACHE) {
                                        tileContent = { type: 'poi', poiType: actualTileType, lootTable: ['comp_av', 'mod_proto', 'item_repair_kit_s'], isOpened: false, isInteracted: false, x:x, y:y };
                                    } else if (actualTileType === TILE_TYPES.POI_ANCIENT_STRUCTURE || actualTileType === TILE_TYPES.MERCHANT_WRECKAGE) {
                                        tileContent = { type: 'poi', poiType: actualTileType, isInteracted: false, x:x, y:y };
                                        if (actualTileType === TILE_TYPES.POI_ANCIENT_STRUCTURE && !structureOnTile) structureOnTile = TILE_TYPES.PRE_RUIN_SILHOUETTE;
                                    }
                                    // Autres types comme FOREST, MOUNTAIN, RUINS sont gérés ci-dessous si pas de contenu spécifique
                                }
                                break;
                            }
                        }
                    }

                    // Si aucun contenu majeur placé, déterminer l'actualType basé sur le baseType
                    if (!foundContent) {
                        if (baseTileType === TILE_TYPES.PRE_ROUGH_TERRAIN) actualTileType = TILE_TYPES.MOUNTAIN; // Ou TILE_TYPES.EMPTY_GRASSLAND
                        else if (baseTileType === TILE_TYPES.PRE_EMPTY) actualTileType = TILE_TYPES.EMPTY_GRASSLAND;
                        else actualTileType = TILE_TYPES.EMPTY_GRASSLAND; // Default
                    }
                }

                // 4. Déterminer les actions de base et les features cachées pour l'exploration active
                const tileViewConfig = activeTileViewData[actualTileType] || activeTileViewData.default;
                baseActionsForTile = tileViewConfig.baseActions ? [...tileViewConfig.baseActions] : ['scan_local_active', 'search_area_active'];
                possibleHiddenFeaturesForTile = tileViewConfig.possibleHiddenFeatures || [];

                possibleHiddenFeaturesForTile.forEach(featureDef => {
                    if (Math.random() < (featureDef.chance || 0)) {
                        hiddenFeaturesOnThisTile.push({ ...featureDef }); // Copier pour éviter modif. de la config
                    }
                });


                gameState.map.tiles[y][x] = {
                    x: x, y: y, // Stocker les coordonnées de la tuile elle-même
                    baseType: baseTileType,
                    structureType: structureOnTile,
                    actualType: actualTileType,
                    content: tileContent, // Contenu visible après exploration de base
                    isExplored: false,      // True si le joueur est "entré" dans la case via le mode actif
                    isFullyExplored: false, // True si toutes les actions uniques/révélations sont faites
                    isScannedFromMap: false, // Renommé pour clarté (ancien isScanned)
                    scannedFromMapRevealTime: 0,
                    scannedFromMapActualType: null,

                    // Pour l'exploration active de tuile
                    baseActions: baseActionsForTile,
                    hiddenFeatures: hiddenFeaturesOnThisTile, // Ce qui peut être trouvé par scan_local_active
                    revealedFeatures: [], // Features révélées par scan_local_active, en attente d'interaction
                    searchAttempts: 0,    // Compteur pour l'action "Fouiller la Zone"
                    usedActions: {},      // Pour suivre les actions non répétables (ex: scan_local_active)
                    triggeredEvents: [],  // Pour suivre les événements uniques déclenchés sur cette tuile
                    hasActiveTrap: false, // Si un piège a été révélé mais pas désamorcé/déclenché
                };
            }
        }

        // Révéler la case de départ (juste isExplored, le contenu détaillé se fait via mode actif)
        const startTile = this.getTile(gameState.map.nanobotPos.x, gameState.map.nanobotPos.y);
        if (startTile) {
            startTile.isExplored = true;
            // On ne met pas isFullyExplored, car le joueur n'a pas encore interagi avec.
        }

        if (typeof addLogEntry === 'function' && typeof explorationLogEl !== 'undefined' && gameState?.explorationLog) {
             addLogEntry(`Arrivée en zone: ${zone.name}. Position (${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y}).`, "map-event", explorationLogEl, gameState.explorationLog);
        }
        console.log(`mapManager.generateMap - Carte pour ${zoneId} générée. Taille: ${gameState.map.tiles.length}x${gameState.map.tiles[0]?.length}.`);
    },

    getTile: function(x, y) {
        if (gameState && gameState.map && gameState.map.tiles &&
            y >= 0 && y < gameState.map.tiles.length &&
            x >= 0 && x < gameState.map.tiles[y]?.length) {
            return gameState.map.tiles[y][x];
        }
        // console.warn(`mapManager.getTile: Tuile non trouvée ou hors limites pour (${x},${y}) dans la zone ${gameState?.map?.zoneId}`);
        return null;
    }
};

console.log("mapManager.js - Objet mapManager défini.");