// js/mapManager.js
console.log("mapManager.js - Fichier chargé et en cours d'analyse...");

var mapManager = {
    generateMap: function(zoneId) {
        console.log(`mapManager: generateMap pour la zone ${zoneId}`);
        // LOGS DE DÉBOGAGE (peuvent être gardés ou enlevés si le problème est résolu)
        console.log("DEBUG mapManager - window.WORLD_ZONES:", typeof window.WORLD_ZONES, window.WORLD_ZONES ? Object.keys(window.WORLD_ZONES).length : 'N/A', window.WORLD_ZONES);
        console.log("DEBUG mapManager - window.TILE_TYPES:", typeof window.TILE_TYPES, window.TILE_TYPES ? Object.keys(window.TILE_TYPES).length : 'N/A');
        console.log("DEBUG mapManager - window.explorationEnemyData:", typeof window.explorationEnemyData, window.explorationEnemyData ? Object.keys(window.explorationEnemyData).length : 'N/A');
        console.log("DEBUG mapManager - window.enemyBaseDefinitions:", typeof window.enemyBaseDefinitions, window.enemyBaseDefinitions ? Object.keys(window.enemyBaseDefinitions).length : 'N/A');
        console.log("DEBUG mapManager - window.BASE_COORDINATES:", typeof window.BASE_COORDINATES, window.BASE_COORDINATES);
        console.log("DEBUG mapManager - window.DEFAULT_MAP_SIZE:", typeof window.DEFAULT_MAP_SIZE, window.DEFAULT_MAP_SIZE);
        console.log("DEBUG mapManager - window.gameState:", typeof window.gameState);
        console.log("DEBUG mapManager - window.TILE_TYPES_TO_RESOURCE_KEY:", typeof window.TILE_TYPES_TO_RESOURCE_KEY, window.TILE_TYPES_TO_RESOURCE_KEY ? Object.keys(window.TILE_TYPES_TO_RESOURCE_KEY).length : 'N/A');
        console.log("DEBUG mapManager - window.activeTileViewData:", typeof window.activeTileViewData, window.activeTileViewData ? Object.keys(window.activeTileViewData).length : 'N/A');
        console.log("DEBUG mapManager - window.MAP_FEATURE_DATA:", typeof window.MAP_FEATURE_DATA, window.MAP_FEATURE_DATA ? Object.keys(window.MAP_FEATURE_DATA).length : 'N/A');


        if (typeof window.WORLD_ZONES === 'undefined' || typeof window.TILE_TYPES === 'undefined' ||
            typeof window.explorationEnemyData === 'undefined' || typeof window.enemyBaseDefinitions === 'undefined' ||
            typeof window.BASE_COORDINATES === 'undefined' || typeof window.DEFAULT_MAP_SIZE === 'undefined' ||
            typeof window.gameState === 'undefined' || typeof window.TILE_TYPES_TO_RESOURCE_KEY === 'undefined' ||
            typeof window.activeTileViewData === 'undefined' || typeof window.MAP_FEATURE_DATA === 'undefined'
           ) {
            console.error("mapManager.generateMap: Dépendances de configuration critiques non définies (vérification WORLD_ZONES).");
            if (window.gameState && window.gameState.map) {
                const fallbackWidth = (window.DEFAULT_MAP_SIZE?.width || 30);
                const fallbackHeight = (window.DEFAULT_MAP_SIZE?.height || 30);
                window.gameState.map.tiles = window.gameState.map.tiles || {};
                window.gameState.map.tiles[zoneId] = Array(fallbackHeight).fill(null).map((_, y_idx) =>
                    Array(fallbackWidth).fill(null).map((_, x_idx) => ({
                        x:x_idx, y:y_idx,
                        baseType: window.TILE_TYPES?.PRE_EMPTY || "pre_empty", structureType: null, actualType: window.TILE_TYPES?.EMPTY_GRASSLAND || "empty_grassland",
                        content: null, isExplored: false, isFullyExplored: false,
                        baseActions: (window.activeTileViewData?.default?.baseActions) || ['scan_local_active', 'search_area_active'],
                        hiddenFeatures: [], revealedFeatures: [], searchAttempts: 0, usedActions: {},
                        isScannedFromMap: false, scannedFromMapRevealTime: 0, scannedFromMapActualType: null,
                        triggeredEvents: [], hasActiveTrap: false
                    }))
                );
                window.gameState.map.zoneId = zoneId;
                window.gameState.currentZoneId = zoneId;
                window.gameState.map.nanobotPos = { x: Math.floor(fallbackWidth / 2), y: Math.floor(fallbackHeight / 2) };
                const startTileFallback = this.getTile(window.gameState.map.nanobotPos.x, window.gameState.map.nanobotPos.y);
                if (startTileFallback) startTileFallback.isExplored = true;
            }
            return;
        }

        const zone = window.WORLD_ZONES[zoneId]; // UTILISER WORLD_ZONES
        if (!zone) {
            console.error(`mapManager.generateMap: Données de zone introuvables pour l'ID: ${zoneId} dans WORLD_ZONES.`);
            return;
        }

        window.gameState.map.tiles = window.gameState.map.tiles || {};
        window.gameState.map.tiles[zoneId] = [];
        
        window.gameState.map.zoneId = zoneId;
        window.gameState.currentZoneId = zoneId;
        window.gameState.map.nanobotPos = { ...(zone.entryPoint || {x:Math.floor(zone.mapSize.width / 2), y:Math.floor(zone.mapSize.height / 2)}) };
        window.gameState.map.selectedTile = null;
        
        console.log(`mapManager.generateMap - NanobotPos initialisé à: (${window.gameState.map.nanobotPos.x}, ${window.gameState.map.nanobotPos.y}) pour la zone ${zoneId}`);

        const playerBaseCoords = zone.basePlayerCoordinates || (window.BASE_COORDINATES || {x:15,y:15}); // Fallback pour BASE_COORDINATES aussi

        for (let y = 0; y < zone.mapSize.height; y++) {
            window.gameState.map.tiles[zoneId][y] = [];
            for (let x = 0; x < zone.mapSize.width; x++) {
                let baseTileType = window.TILE_TYPES.PRE_EMPTY;
                let structureOnTile = null;
                let actualTileType = window.TILE_TYPES.EMPTY_GRASSLAND;
                let tileContent = null;

                let baseActionsForTile = (window.activeTileViewData?.default?.baseActions) || ['scan_local_active', 'search_area_active'];
                let possibleHiddenFeaturesForTile = (window.activeTileViewData?.default?.possibleHiddenFeatures) || [];
                let hiddenFeaturesOnThisTile = [];

                if (zone.baseTerrainLayout && zone.baseTerrainLayout[y] && typeof zone.baseTerrainLayout[y][x] !== 'undefined') {
                    baseTileType = zone.baseTerrainLayout[y][x];
                } else {
                    if (y === 0 || y === zone.mapSize.height - 1 || x === 0 || x === zone.mapSize.width - 1) {
                        baseTileType = window.TILE_TYPES.PRE_HIGH_MOUNTAIN;
                    } else if (Math.random() < 0.1) baseTileType = window.TILE_TYPES.PRE_ROUGH_TERRAIN;
                    else if (Math.random() < 0.05) baseTileType = window.TILE_TYPES.PRE_HIGH_MOUNTAIN;
                    else if (Math.random() < 0.08) baseTileType = window.TILE_TYPES.PRE_WATER;
                    else baseTileType = window.TILE_TYPES.PRE_EMPTY;
                }

                if (zone.visibleStructureLayout && zone.visibleStructureLayout[y] && typeof zone.visibleStructureLayout[y][x] !== 'undefined') {
                    structureOnTile = zone.visibleStructureLayout[y][x];
                }
                
                const playerBaseZoneId = gameState.playerBaseZoneId || (window.EXPLORATION_SETTINGS?.initialZoneId || 'verdant_archipelago');
                let isPlayerBaseTile = (x === playerBaseCoords.x && y === playerBaseCoords.y && zoneId === playerBaseZoneId);

                if (isPlayerBaseTile) {
                    actualTileType = window.TILE_TYPES.PLAYER_BASE;
                    baseTileType = window.TILE_TYPES.PLAYER_BASE;
                    structureOnTile = null;
                    tileContent = null;
                } else if (baseTileType === window.TILE_TYPES.PRE_HIGH_MOUNTAIN) {
                    actualTileType = window.TILE_TYPES.IMPASSABLE_HIGH_PEAK;
                } else if (baseTileType === window.TILE_TYPES.PRE_WATER) {
                    actualTileType = Math.random() < 0.3 ? window.TILE_TYPES.IMPASSABLE_DEEP_WATER : window.TILE_TYPES.EMPTY_WATER;
                } else if (baseTileType === window.TILE_TYPES.PRE_DEBRIS_FIELD) {
                    actualTileType = window.TILE_TYPES.DEBRIS_FIELD;
                } else if (baseTileType === window.TILE_TYPES.PRE_THICK_VINES) {
                    actualTileType = window.TILE_TYPES.THICK_VINES;
                } else {
                    let random = Math.random();
                    let cumulativeProbability = 0;
                    let foundContent = false;

                    if (zone.tileContentDistribution) {
                        for (const keyInDistroString in zone.tileContentDistribution) {
                            cumulativeProbability += zone.tileContentDistribution[keyInDistroString];
                            if (random < cumulativeProbability) {
                                foundContent = true;
                                const contentId = keyInDistroString;

                                if (window.explorationEnemyData[contentId]) {
                                    actualTileType = window.explorationEnemyData[contentId].actualTileType || window.TILE_TYPES.EMPTY_GRASSLAND;
                                    tileContent = { type: 'enemy_patrol', details: { ...window.explorationEnemyData[contentId] }, id: contentId, x:x, y:y };
                                } else if (window.enemyBaseDefinitions[contentId]) {
                                    actualTileType = window.enemyBaseDefinitions[contentId].actualTileType || window.TILE_TYPES.ENEMY_OUTPOST_TILE;
                                    tileContent = { type: 'enemy_base', details: { ...window.enemyBaseDefinitions[contentId] }, id: contentId, currentHealth: window.enemyBaseDefinitions[contentId].health, x:x, y:y };
                                    structureOnTile = structureOnTile || window.enemyBaseDefinitions[contentId].visibleStructureType || window.TILE_TYPES.PRE_HOSTILE_STRUCTURE;
                                } else {
                                    let potentialTileTypeKey = String(contentId);
                                    
                                    if (Object.values(window.TILE_TYPES).includes(potentialTileTypeKey)) {
                                        actualTileType = potentialTileTypeKey;
                                        if (window.TILE_TYPES_TO_RESOURCE_KEY && window.TILE_TYPES_TO_RESOURCE_KEY[actualTileType]) {
                                            tileContent = { type: 'resource', resourceType: actualTileType, amount: Math.floor(Math.random() * 60) + 40, x:x, y:y };
                                        } else if (actualTileType === window.TILE_TYPES.UPGRADE_CACHE) {
                                            tileContent = { type: 'poi', poiType: actualTileType, lootTable: ['repair_kit_basic', 'crystal_shard_raw'], isOpened: false, isInteracted: false, x:x, y:y };
                                        } else if ( [window.TILE_TYPES.POI_ANCIENT_STRUCTURE, window.TILE_TYPES.MERCHANT_WRECKAGE, window.TILE_TYPES.CAVE_ENTRANCE, window.TILE_TYPES.POI_CRASHED_SHIP, window.TILE_TYPES.POI_DISTRESS_SIGNAL].includes(actualTileType) ) {
                                            tileContent = { type: 'poi', poiType: actualTileType, isInteracted: false, x:x, y:y };
                                            if ((actualTileType === window.TILE_TYPES.POI_ANCIENT_STRUCTURE || actualTileType === window.TILE_TYPES.RUINS_ANCIENT) && !structureOnTile) structureOnTile = window.TILE_TYPES.PRE_RUIN_SILHOUETTE;
                                        }
                                    } else {
                                        console.warn(`Contenu de tuile non reconnu '${contentId}' (après conversion en string: '${potentialTileTypeKey}') dans tileContentDistribution pour la zone ${zoneId}. Utilisation du terrain de base.`);
                                        actualTileType = (baseTileType === window.TILE_TYPES.PRE_ROUGH_TERRAIN) ? window.TILE_TYPES.MOUNTAIN : window.TILE_TYPES.EMPTY_GRASSLAND;
                                    }
                                }
                                break;
                            }
                        }
                    }
                    if (!foundContent) {
                        if (baseTileType === window.TILE_TYPES.PRE_ROUGH_TERRAIN) actualTileType = window.TILE_TYPES.MOUNTAIN;
                        else if (baseTileType === window.TILE_TYPES.PRE_EMPTY) actualTileType = window.TILE_TYPES.EMPTY_GRASSLAND;
                        else if (baseTileType === window.TILE_TYPES.PRE_DEBRIS_FIELD) actualTileType = window.TILE_TYPES.DEBRIS_FIELD;
                        else if (baseTileType === window.TILE_TYPES.PRE_THICK_VINES) actualTileType = window.TILE_TYPES.THICK_VINES;
                        else actualTileType = window.TILE_TYPES.EMPTY_GRASSLAND;
                    }
                }

                const tileViewConfig = (window.activeTileViewData && window.activeTileViewData[actualTileType]) || (window.activeTileViewData && window.activeTileViewData.default);
                if (tileViewConfig) {
                    baseActionsForTile = tileViewConfig.baseActions ? [...tileViewConfig.baseActions] : ['scan_local_active', 'search_area_active'];
                    possibleHiddenFeaturesForTile = tileViewConfig.possibleHiddenFeatures || [];
                }

                possibleHiddenFeaturesForTile.forEach(featureDef => {
                    if (Math.random() < (featureDef.chance || 0)) {
                        hiddenFeaturesOnThisTile.push({ ...featureDef });
                    }
                });

                window.gameState.map.tiles[zoneId][y][x] = {
                    x: x, y: y,
                    baseType: baseTileType,
                    structureType: structureOnTile,
                    actualType: actualTileType,
                    content: tileContent,
                    isExplored: false, isFullyExplored: false,
                    isScannedFromMap: false, scannedFromMapRevealTime: 0, scannedFromMapActualType: null,
                    baseActions: baseActionsForTile, hiddenFeatures: hiddenFeaturesOnThisTile,
                    revealedFeatures: [], searchAttempts: 0, usedActions: {},
                    triggeredEvents: [], hasActiveTrap: false,
                };
            }
        }

        const startTile = this.getTile(window.gameState.map.nanobotPos.x, window.gameState.map.nanobotPos.y);
        if (startTile) {
            startTile.isExplored = true;
            if (typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') {
                 questController.checkQuestProgress({ type: "explore_tile_type", tileType: startTile.actualType, zoneId: zoneId, x: startTile.x, y: startTile.y });
            }
        }

        if (typeof addLogEntry === 'function' && window.explorationLogEl && window.gameState?.explorationLog) {
             addLogEntry(`Arrivée en zone: ${zone.name}. Position (${window.gameState.map.nanobotPos.x}, ${window.gameState.map.nanobotPos.y}).`, "map-event", window.explorationLogEl, window.gameState.explorationLog);
        }
        console.log(`mapManager.generateMap - Carte pour ${zoneId} générée. Taille: ${window.gameState.map.tiles[zoneId].length}x${window.gameState.map.tiles[zoneId][0]?.length}.`);
    },

    getTile: function(x, y) {
        if (window.gameState && window.gameState.map && window.gameState.map.tiles && window.gameState.currentZoneId &&
            window.gameState.map.tiles[window.gameState.currentZoneId] &&
            y >= 0 && y < window.gameState.map.tiles[window.gameState.currentZoneId].length &&
            x >= 0 && x < window.gameState.map.tiles[window.gameState.currentZoneId][y]?.length) {
            return window.gameState.map.tiles[window.gameState.currentZoneId][y][x];
        }
        return null;
    }
};
window.mapManager = mapManager;

console.log("mapManager.js - Objet mapManager défini.");