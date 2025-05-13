// js/mapManager.js
console.log("mapManager.js - Fichier chargé et en cours d'analyse...");

var mapManager = {
    generateMap: function(zoneId) {
        console.log(`mapManager: generateMap pour la zone ${zoneId}`);
        if (typeof ZONE_DATA === 'undefined' || typeof TILE_TYPES === 'undefined' || typeof explorationEnemyData === 'undefined' || typeof enemyBaseDefinitions === 'undefined' || typeof BASE_COORDINATES === 'undefined' || typeof DEFAULT_MAP_SIZE === 'undefined' || typeof gameState === 'undefined' || typeof TILE_TYPES_TO_RESOURCE_KEY === 'undefined') {
            console.error("mapManager.generateMap: Dépendances de configuration critiques (ZONE_DATA, TILE_TYPES, gameState, TILE_TYPES_TO_RESOURCE_KEY, etc.) non définies.");
            if (typeof addLogEntry === 'function') addLogEntry("Erreur critique de configuration de la carte.", "error", eventLogEl, gameState?.eventLog);
            // Create a fallback empty map if critical data is missing
             gameState.map.tiles = Array(DEFAULT_MAP_SIZE.height).fill(null).map(() => Array(DEFAULT_MAP_SIZE.width).fill({
                baseType: TILE_TYPES.PRE_EMPTY, structureType: null, actualType: TILE_TYPES.EMPTY_GRASSLAND,
                content: null, isExplored: false, isScanned: false, scannedActualType: null, scannedRevealTime: 0
            }));
            gameState.map.zoneId = zoneId;
            gameState.currentZoneId = zoneId; // Ensure currentZoneId is also set
            gameState.map.nanobotPos = { x: Math.floor(DEFAULT_MAP_SIZE.width / 2), y: Math.floor(DEFAULT_MAP_SIZE.height / 2) };
             if (gameState.map.tiles[gameState.map.nanobotPos.y]?.[gameState.map.nanobotPos.x]) {
                 gameState.map.tiles[gameState.map.nanobotPos.y][gameState.map.nanobotPos.x].isExplored = true;
            }
            return;
        }
        const zone = ZONE_DATA[zoneId];
        if (!zone) {
            console.error(`mapManager.generateMap: Données de zone introuvables pour l'ID: ${zoneId}`);
            if (typeof addLogEntry === 'function') addLogEntry(`Erreur critique: Impossible de générer la carte pour la zone ${zoneId}.`, "error", eventLogEl, gameState.eventLog);
            // Fallback map generation (similar to above)
            gameState.map.tiles = Array(DEFAULT_MAP_SIZE.height).fill(null).map(() => Array(DEFAULT_MAP_SIZE.width).fill({
                baseType: TILE_TYPES.PRE_EMPTY, structureType: null, actualType: TILE_TYPES.EMPTY_GRASSLAND,
                content: null, isExplored: false, isScanned: false, scannedActualType: null, scannedRevealTime: 0
            }));
            gameState.map.zoneId = zoneId;
            gameState.currentZoneId = zoneId;
            gameState.map.nanobotPos = { x: Math.floor(DEFAULT_MAP_SIZE.width / 2), y: Math.floor(DEFAULT_MAP_SIZE.height / 2) };
            if (gameState.map.tiles[gameState.map.nanobotPos.y]?.[gameState.map.nanobotPos.x]) {
                gameState.map.tiles[gameState.map.nanobotPos.y][gameState.map.nanobotPos.x].isExplored = true;
           }
            return;
        }

        gameState.map.tiles = [];
        gameState.map.zoneId = zoneId;
        gameState.currentZoneId = zoneId;
        gameState.map.nanobotPos = { ...(zone.entryPoint || {x:Math.floor(zone.mapSize.width / 2), y:Math.floor(zone.mapSize.height / 2)}) };
        gameState.map.selectedTile = null; // Reset selected tile when changing/generating map
        console.log(`mapManager.generateMap - NanobotPos initialisé à: (${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y}) pour la zone ${zoneId}`);

        const playerBaseCoords = zone.basePlayerCoordinates || BASE_COORDINATES;

        for (let y = 0; y < zone.mapSize.height; y++) {
            gameState.map.tiles[y] = [];
            for (let x = 0; x < zone.mapSize.width; x++) {
                let baseTileType = TILE_TYPES.PRE_EMPTY;
                let structureOnTile = null;
                let actualTileType = TILE_TYPES.EMPTY_GRASSLAND; // Default actual type
                let tileContent = null;

                // 1. Base terrain and visible structures from layout or procedural
                if (zone.baseTerrainLayout && zone.baseTerrainLayout[y] && zone.baseTerrainLayout[y][x] !== undefined) {
                    baseTileType = zone.baseTerrainLayout[y][x];
                } else { /* ... (your procedural base terrain logic) ... */
                    if (y === 0 || y === zone.mapSize.height - 1 || x === 0 || x === zone.mapSize.width - 1) {
                        baseTileType = TILE_TYPES.PRE_HIGH_MOUNTAIN; // Use a more specific impassable pre-type
                    } else if (Math.random() < 0.1) baseTileType = TILE_TYPES.PRE_ROUGH_TERRAIN;
                    else if (Math.random() < 0.05) baseTileType = TILE_TYPES.PRE_HIGH_MOUNTAIN;
                    else if (Math.random() < 0.08) baseTileType = TILE_TYPES.PRE_WATER;
                    else baseTileType = TILE_TYPES.PRE_EMPTY;
                }

                if (zone.visibleStructureLayout && zone.visibleStructureLayout[y] && zone.visibleStructureLayout[y][x] !== undefined) {
                    structureOnTile = zone.visibleStructureLayout[y][x];
                }

                // 2. Determine actualType and tileContent
                // Player base overrides everything
                let isPlayerBaseTile = (x === playerBaseCoords.x && y === playerBaseCoords.y);
                // Ensure currentZoneId matches the zone being generated for base placement
                if (zoneId !== gameState.currentZoneId && gameState.currentZoneId === 'verdant_archipelago' && zoneId === 'verdant_archipelago') {
                    // This condition is a bit complex, usually base is only in one zone.
                    // Simpler: base is only in the zone defined by its basePlayerCoordinates
                    isPlayerBaseTile = (x === playerBaseCoords.x && y === playerBaseCoords.y && zone.id === 'verdant_archipelago'); // Assuming base is always in verdant_archipelago
                }


                if (isPlayerBaseTile) {
                     actualTileType = TILE_TYPES.PLAYER_BASE;
                     baseTileType = TILE_TYPES.PLAYER_BASE; // Make base visible immediately
                     structureOnTile = null; // No other structure on base tile
                     tileContent = null;     // No resource/enemy content on base tile
                } else if (baseTileType === TILE_TYPES.PRE_HIGH_MOUNTAIN) {
                    actualTileType = TILE_TYPES.IMPASSABLE_HIGH_PEAK;
                } else if (baseTileType === TILE_TYPES.PRE_WATER) {
                    actualTileType = Math.random() < 0.3 ? TILE_TYPES.IMPASSABLE_DEEP_WATER : TILE_TYPES.EMPTY_WATER;
                } else { // Potentially explorable tile, try to place content
                    let random = Math.random();
                    let cumulativeProbability = 0;
                    let foundContent = false;

                    if (zone.tileContentDistribution) {
                        for (const keyInDistroString in zone.tileContentDistribution) {
                            cumulativeProbability += zone.tileContentDistribution[keyInDistroString];
                            if (random < cumulativeProbability) {
                                foundContent = true;
                                const numericKey = parseInt(keyInDistroString); // Try to parse key as number for TILE_TYPES

                                if (explorationEnemyData[keyInDistroString]) { // Key is a string ID for an enemy
                                    actualTileType = explorationEnemyData[keyInDistroString].actualTileType;
                                    tileContent = { type: 'enemy_patrol', details: { ...explorationEnemyData[keyInDistroString] }, id: keyInDistroString };
                                } else if (enemyBaseDefinitions[keyInDistroString]) { // Key is a string ID for a base
                                    actualTileType = enemyBaseDefinitions[keyInDistroString].actualTileType;
                                    tileContent = { type: 'enemy_base', details: { ...enemyBaseDefinitions[keyInDistroString] }, id: keyInDistroString, currentHealth: enemyBaseDefinitions[keyInDistroString].health };
                                    structureOnTile = structureOnTile || enemyBaseDefinitions[keyInDistroString].visibleStructureType || TILE_TYPES.PRE_HOSTILE_STRUCTURE;
                                } else if (!isNaN(numericKey) && Object.values(TILE_TYPES).includes(numericKey)) { // Key is a string that parses to a valid TILE_TYPE number
                                    actualTileType = numericKey; // Use the parsed numeric TILE_TYPE
                                    if (TILE_TYPES_TO_RESOURCE_KEY[actualTileType]) { // Check if this TILE_TYPE is a resource
                                        tileContent = { type: 'resource', resourceType: actualTileType, amount: Math.floor(Math.random() * 60) + 40 };
                                    } else if (actualTileType === TILE_TYPES.UPGRADE_CACHE) {
                                        tileContent = { type: 'cache', lootTable: ['comp_av', 'mod_proto', 'item_repair_kit_s'], isOpened: false };
                                    } else if (actualTileType === TILE_TYPES.POI_ANCIENT_STRUCTURE || actualTileType === TILE_TYPES.MERCHANT_WRECKAGE) {
                                        tileContent = { type: 'poi', poiType: actualTileType, isInteracted: false };
                                        if (actualTileType === TILE_TYPES.POI_ANCIENT_STRUCTURE) structureOnTile = structureOnTile || TILE_TYPES.PRE_RUIN_SILHOUETTE;
                                    } else if (actualTileType === TILE_TYPES.FOREST) { // If FOREST is in distribution
                                         if (Math.random() < 0.6) tileContent = { type: 'resource', resourceType: TILE_TYPES.RESOURCE_BIOMASS_PATCH, amount: Math.floor(Math.random() * 30) + 20 };
                                         // else actualTileType remains TILE_TYPES.FOREST
                                    } else if (actualTileType === TILE_TYPES.RUINS) { // If RUINS is in distribution
                                        if (Math.random() < 0.4) tileContent = {type: 'cache', lootTable:['frag_alien', (itemsData['nanites_medium_cache'] ? 'nanites_medium_cache' : 'comp_av')], isOpened:false};
                                         // else actualTileType remains TILE_TYPES.RUINS
                                    } else if (actualTileType === TILE_TYPES.MOUNTAIN) { // If MOUNTAIN is in distribution
                                        if (Math.random() < 0.2) tileContent = { type: 'resource', resourceType: TILE_TYPES.RESOURCE_CRYSTAL_VEIN, amount: Math.floor(Math.random()*10)+5};
                                         // else actualTileType remains TILE_TYPES.MOUNTAIN
                                    }
                                    // Note: If actualTileType is set here but no specific content (like for plain FOREST/RUINS/MOUNTAIN from distribution)
                                    // tileContent will remain null unless set in one of the conditions above.
                                } else {
                                    // Key was not an enemy, base, or recognized numeric TILE_TYPE. Could be a plain terrain type string like "FOREST".
                                    // This path is less likely if distribution uses TILE_TYPE numbers for terrain.
                                    // For safety, try to map string key to TILE_TYPE if it exists.
                                    const tileTypeFromName = TILE_TYPES[keyInDistroString.toUpperCase()]; // e.g. keyInDistroString = "FOREST"
                                    if(tileTypeFromName !== undefined) {
                                        actualTileType = tileTypeFromName;
                                        // Add specific content for these if needed, e.g. a forest might have biomass
                                        if (actualTileType === TILE_TYPES.FOREST && Math.random() < 0.6) {
                                            tileContent = { type: 'resource', resourceType: TILE_TYPES.RESOURCE_BIOMASS_PATCH, amount: Math.floor(Math.random() * 30) + 20 };
                                        }
                                    } else {
                                        console.warn(`MapGen: Unhandled key in tileContentDistribution: ${keyInDistroString}`);
                                        actualTileType = TILE_TYPES.EMPTY_GRASSLAND; // Fallback if key is truly unknown
                                    }
                                }
                                break; // Content found from distribution, exit loop for this tile
                            }
                        }
                    }

                    if (!foundContent) { // If no content placed by distribution, determine actualType from baseType
                        if (baseTileType === TILE_TYPES.PRE_ROUGH_TERRAIN) actualTileType = TILE_TYPES.EMPTY_GRASSLAND; // Or TILE_TYPES.MOUNTAIN based on further randomness
                        else if (baseTileType === TILE_TYPES.PRE_EMPTY) actualTileType = TILE_TYPES.EMPTY_GRASSLAND;
                        else actualTileType = TILE_TYPES.EMPTY_GRASSLAND; // Default fallback
                    }
                }

                gameState.map.tiles[y][x] = {
                    baseType: baseTileType,
                    structureType: structureOnTile,
                    actualType: actualTileType,
                    content: tileContent,
                    isExplored: false,
                    isScanned: false,
                    scannedActualType: null,
                    scannedRevealTime: 0
                };
            }
        }

        // Reveal starting area
        const { x: startX, y: startY } = gameState.map.nanobotPos;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = startX + dx;
                const ny = startY + dy;
                if (nx >= 0 && nx < zone.mapSize.width && ny >= 0 && ny < zone.mapSize.height) {
                    const tileToExplore = this.getTile(nx, ny);
                    if(tileToExplore){
                         tileToExplore.isExplored = true;
                    }
                }
            }
        }

        if (typeof addLogEntry === 'function' && typeof explorationLogEl !== 'undefined' && gameState && gameState.explorationLog) {
             addLogEntry(`Arrivée en zone: ${zone.name}. Position (${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y}).`, "map-event", explorationLogEl, gameState.explorationLog);
        }
        console.log(`mapManager.generateMap - Carte pour ${zoneId} générée. Taille: ${gameState.map.tiles.length}x${gameState.map.tiles[0]?.length}. Première tuile [0][0]:`, gameState.map.tiles[0] ? JSON.parse(JSON.stringify(gameState.map.tiles[0][0])) : "Ligne 0 vide/non générée");
    },

    getTile: function(x, y) {
        if (gameState && gameState.map && gameState.map.tiles && gameState.map.tiles[y] && gameState.map.tiles[y][x]) {
            return gameState.map.tiles[y][x];
        }
        // console.warn(`mapManager.getTile: Tuile non trouvée pour (${x},${y}) dans la zone ${gameState?.map?.zoneId}`);
        return null;
    }
};

console.log("mapManager.js - Objet mapManager défini.");