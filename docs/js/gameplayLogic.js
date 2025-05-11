// js/gameplayLogic.js
// console.log("gameplayLogic.js - Fichier chargé et en cours d'analyse...");

function calculateNanobotStats() { 
    // console.log("gameplayLogic.js: calculateNanobotStats appelée");
    const stats = gameState.nanobotStats; 
    stats.health = stats.baseHealth; 
    stats.attack = stats.baseAttack; 
    stats.defense = stats.baseDefense; 
    stats.speed = stats.baseSpeed; 

    for (const researchId in gameState.research) { 
        if (gameState.research[researchId] && researchData[researchId]) { 
            const resData = researchData[researchId]; 
            if (resData.grantsStatBoost) { 
                for (const stat in resData.grantsStatBoost) { 
                    stats[stat] = (stats[stat] || 0) + resData.grantsStatBoost[stat]; 
                } 
            } 
        } 
    } 
    
    for (const moduleId in gameState.nanobotModuleLevels) {
        const currentLevel = gameState.nanobotModuleLevels[moduleId];
        if (currentLevel > 0) {
            const moduleData = nanobotModulesData[moduleId];
            if (moduleData && moduleData.levels && moduleData.levels[currentLevel - 1]) {
                const levelStats = moduleData.levels[currentLevel - 1].statBoost;
                if (levelStats) {
                    for (const stat in levelStats) {
                        stats[stat] = (stats[stat] || 0) + levelStats[stat];
                    }
                }
            }
        }
    }
    
    for (const slot in gameState.nanobotEquipment) { 
        const itemId = gameState.nanobotEquipment[slot]; 
        if (itemId && itemsData[itemId] && itemsData[itemId].statBoost) { 
            const itemBoosts = itemsData[itemId].statBoost; 
            for (const stat in itemBoosts) { 
                stats[stat] = (stats[stat] || 0) + itemBoosts[stat]; 
            } 
        } 
    } 

    stats.currentHealth = Math.min(stats.currentHealth, stats.health); 
    if (stats.currentHealth < 0) stats.currentHealth = 0; 
}

function upgradeNanobotModule(moduleId) {
    // console.log(`gameplayLogic.js: upgradeNanobotModule appelée pour ${moduleId}`);
    const moduleData = nanobotModulesData[moduleId];
    if (!moduleData) { addLogEntry("Module inconnu.", "error"); return; }

    let currentLevel = gameState.nanobotModuleLevels[moduleId] || 0;
    
    let isReplacedByActiveHigher = false;
    for (const checkId in nanobotModulesData) { 
        if (nanobotModulesData[checkId].replaces === moduleId && gameState.nanobotModuleLevels[checkId] > 0) { 
            isReplacedByActiveHigher = true; break;
        } 
    }
    if(isReplacedByActiveHigher){
        addLogEntry(`Impossible d'améliorer ${moduleData.name}, il est déjà remplacé par une version supérieure.`, "warning"); 
        return;
    }

    if (currentLevel >= moduleData.levels.length) { addLogEntry(`${moduleData.name} est déjà au niveau maximum.`, "info"); return; }

    const costData = currentLevel === 0 ? moduleData.levels[0].costToUnlockOrUpgrade : moduleData.levels[currentLevel].costToUpgrade;
    
    for(const resourceId in costData) {
        const requiredAmount = costData[resourceId];
        if (itemsData[resourceId]) { 
            const countInInventory = gameState.inventory.filter(itemId => itemId === resourceId).length;
            if (countInInventory < requiredAmount) { addLogEntry(`Manque de ${itemsData[resourceId].name} (x${requiredAmount}) pour ${moduleData.name}.`, "error"); return; }
        } else { 
            if ((gameState.resources[resourceId] || 0) < requiredAmount) { addLogEntry(`Ressources (${resourceId}) insuffisantes pour ${moduleData.name}.`, "error"); return; }
        }
    }

    for(const resourceId in costData) {
        const paidAmount = costData[resourceId];
        if (itemsData[resourceId]) { for (let i = 0; i < paidAmount; i++) { removeFromInventory(resourceId); }
        } else { gameState.resources[resourceId] -= paidAmount; }
    }
    
    if (moduleData.replaces && gameState.nanobotModuleLevels[moduleData.replaces]) {
        const replacedModuleId = moduleData.replaces;
        addLogEntry(`${nanobotModulesData[replacedModuleId].name} désactivé et remplacé par ${moduleData.name}.`, "info");
        delete gameState.nanobotModuleLevels[replacedModuleId]; 
    }

    gameState.nanobotModuleLevels[moduleId] = currentLevel + 1;
    const actionText = currentLevel === 0 ? "activé/fabriqué" : "amélioré";
    addLogEntry(`${moduleData.name} ${actionText} au Niveau ${currentLevel + 1}!`, "success");

    calculateNanobotStats();
    updateDisplays();
}

function calculateBaseStats() {
    // console.log("gameplayLogic.js: calculateBaseStats appelée");
    let maxHealth = BASE_INITIAL_HEALTH; let defensePower = 0;
    for (const buildingId in gameState.buildings) {
        const level = gameState.buildings[buildingId];
        if (level > 0 && buildingsData[buildingId] && buildingsData[buildingId].type === 'defense') {
            const defData = buildingsData[buildingId]; const currentLevelData = defData.levels[level - 1];
            if (currentLevelData && currentLevelData.stats) { 
                for(const instanceId in gameState.defenses){ 
                    const defenseInstance = gameState.defenses[instanceId];
                    if(defenseInstance.id === buildingId && defenseInstance.currentHealth > 0){
                        defensePower += defenseInstance.attack || 0; 
                    }
                }
            }
            if (currentLevelData && currentLevelData.baseHealthBonus) { maxHealth += currentLevelData.baseHealthBonus; }
        }
    }
    if (gameState.nanobotStats.isDefendingBase && gameState.map.nanobotPos.x === BASE_COORDINATES.x && gameState.map.nanobotPos.y === BASE_COORDINATES.y && gameState.currentZoneId === 'sector_x9') { 
        defensePower += gameState.nanobotStats.attack; 
    }
    gameState.baseStats.maxHealth = maxHealth; gameState.baseStats.defensePower = defensePower;
    gameState.baseStats.currentHealth = Math.min(gameState.baseStats.currentHealth, gameState.baseStats.maxHealth);
    if (gameState.baseStats.currentHealth <= 0 && gameState.baseStats.maxHealth > 0) { gameState.baseStats.currentHealth = 0; }
}
function calculateProductionAndConsumption() { 
    // console.log("gameplayLogic.js: calculateProductionAndConsumption appelée");
    gameState.productionRates.biomass = 0; gameState.productionRates.nanites = 0; let totalEnergyConsumption = 0; 
    for (const buildingId in gameState.buildings) { 
        const level = gameState.buildings[buildingId]; 
        if (level > 0) { 
            const buildingDef = buildingsData[buildingId]; 
            if(buildingDef){ 
                const levelData = buildingDef.levels[level - 1]; 
                if (buildingDef.type === "production") { 
                    if (levelData && levelData.production) { 
                        if (levelData.production.biomass) gameState.productionRates.biomass += levelData.production.biomass; 
                        if (levelData.production.nanites) gameState.productionRates.nanites += levelData.production.nanites; 
                    } 
                } 
                if (levelData && levelData.energyConsumption) totalEnergyConsumption += levelData.energyConsumption; 
            } 
        } 
    } 
    gameState.capacity.energy = 50; 
    const powerPlantLevel = gameState.buildings['powerPlant'] || 0; 
    if (powerPlantLevel > 0 && buildingsData['powerPlant'] && buildingsData['powerPlant'].levels[powerPlantLevel - 1]) { 
        gameState.capacity.energy += buildingsData['powerPlant'].levels[powerPlantLevel - 1].capacity.energy; 
    } 
    if (!gameState.isDay) { 
        gameState.productionRates.biomass *= 0.7; 
        gameState.productionRates.nanites *= 0.7; 
    } 
    gameState.resources.energy = totalEnergyConsumption; 
    if (totalEnergyConsumption > gameState.capacity.energy) { 
        const deficitFactor = gameState.capacity.energy > 0 ? gameState.capacity.energy / totalEnergyConsumption : 0; 
        gameState.productionRates.biomass *= deficitFactor; 
        gameState.productionRates.nanites *= deficitFactor; 
        if (Math.random() < 0.1 && typeof addLogEntry === 'function') addLogEntry("Surcharge énergétique! Production et défenses réduites.", "error"); 
        gameState.baseStats.defensePower = Math.floor(gameState.baseStats.defensePower * deficitFactor); 
    } 
}
function build(buildingId) { 
    // console.log(`gameplayLogic.js: build appelée pour ${buildingId}`);
    const building = buildingsData[buildingId]; 
    const currentLevel = gameState.buildings[buildingId] || 0; 
    if (!building || !building.levels || currentLevel >= building.levels.length) { 
        addLogEntry(`${building ? building.name : 'Bâtiment inconnu'} est au niveau maximum de technologie ou n'existe pas.`, "info"); 
        return; 
    } 
    const nextLevelData = building.levels[currentLevel]; 
    const costObject = nextLevelData.costToUnlockOrUpgrade || nextLevelData.costToUpgrade; 
    if (!costObject) {
        addLogEntry(`Données de coût manquantes pour ${building.name} Niv. ${currentLevel + 1}.`, "error");
        return;
    }
    for (const resource in costObject) { if ((gameState.resources[resource]||0) < costObject[resource]) { addLogEntry(`Ressources insuffisantes pour ${building.name}. Requis: ${costObject[resource]} ${resource}.`, "error"); return; } } 
    const title = building.type === 'defense' ? `Débloquer/Améliorer Technologie ${building.name}?` : `Améliorer ${building.name}?`; 
    showModal(title, `Passer la technologie ${building.name} au Niveau ${currentLevel + 1}?`, () => { 
        for (const resource in costObject) gameState.resources[resource] -= costObject[resource]; 
        gameState.buildings[buildingId] = currentLevel + 1; 
        addLogEntry(`Technologie ${building.name} ${currentLevel === 0 ? 'débloquée' : 'améliorée'} au Niveau ${currentLevel + 1}.`, "success"); 
        if (nextLevelData.grantsModule) calculateNanobotStats(); 
        if (building.type === 'defense') { calculateBaseStats(); } 
        calculateProductionAndConsumption(); 
        updateDisplays(); 
    }); 
}
function startResearch(researchId) { 
    // console.log(`gameplayLogic.js: startResearch appelée pour ${researchId}`);
    if (gameState.activeResearch) { addLogEntry("Recherche en cours.", "info"); return; } 
    if (gameState.research[researchId]) { addLogEntry("Technologie acquise.", "info"); return; } 
    const research = researchData[researchId]; 
    let labLevel = gameState.buildings['researchLab'] || 0; 
    let researchSpeedFactor = 0.5;
    if (labLevel > 0 && buildingsData['researchLab'] && buildingsData['researchLab'].levels[labLevel-1]) {
        researchSpeedFactor = buildingsData['researchLab'].levels[labLevel - 1].researchSpeedFactor;
    }
    for (const resource in research.cost) { if ((gameState.resources[resource]||0) < research.cost[resource]) { addLogEntry(`Ressources insuffisantes: ${research.name}.`, "error"); return; } } 
    showModal(`Lancer ${research.name}?`, `Coût & Temps adaptés.`, () => { 
        for (const resource in research.cost) gameState.resources[resource] -= research.cost[resource]; 
        gameState.activeResearch = { id: researchId, startTime: gameState.gameTime, totalTime: research.time / researchSpeedFactor }; 
        addLogEntry(`Recherche ${research.name} initiée.`, "success"); 
        updateDisplays(); 
    });
}
function repairBase(amount = 10) { if (gameState.baseStats.currentHealth >= gameState.baseStats.maxHealth) { addLogEntry("Le Noyau est déjà à son intégrité maximale.", "info"); return; } const healthToRestore = Math.min(amount, gameState.baseStats.maxHealth - gameState.baseStats.currentHealth); const costBiomass = healthToRestore * REPAIR_COST_BASE_HEALTH_BIOMASS; const costNanites = healthToRestore * REPAIR_COST_BASE_HEALTH_NANITES; if (gameState.resources.biomass < costBiomass || gameState.resources.nanites < costNanites) { addLogEntry(`Ressources insuffisantes pour réparer le Noyau. Requis: ${costBiomass} Biomasse, ${costNanites} Nanites.`, "error"); return; } gameState.resources.biomass -= costBiomass; gameState.resources.nanites -= costNanites; gameState.baseStats.currentHealth += healthToRestore; addLogEntry(`Noyau réparé de ${healthToRestore} PV. (-${costBiomass} Bio, -${costNanites} Nan).`, "success"); updateResourceDisplay(); updateBaseStatusDisplay(); }
function repairAllDefenses() { let totalBiomassCost = 0; let totalHealthRestored = 0; let defensesToRepair = []; for (const defId in gameState.defenses) { const defense = gameState.defenses[defId]; if (defense.currentHealth < defense.maxHealth) { const healthNeeded = defense.maxHealth - defense.currentHealth; defensesToRepair.push({ defId, healthNeeded }); totalBiomassCost += healthNeeded * REPAIR_COST_DEFENSE_HEALTH_BIOMASS; } } if (defensesToRepair.length === 0) { addLogEntry("Toutes les défenses sont opérationnelles.", "info"); return; } if (gameState.resources.biomass < totalBiomassCost) { addLogEntry(`Ressources insuffisantes pour réparer toutes les défenses. Requis: ${totalBiomassCost} Biomasse.`, "error"); return; } gameState.resources.biomass -= totalBiomassCost; defensesToRepair.forEach(item => { gameState.defenses[item.defId].currentHealth += item.healthNeeded; totalHealthRestored += item.healthNeeded; }); addLogEntry(`Toutes les défenses endommagées ont été réparées (+${totalHealthRestored} PV total). (-${totalBiomassCost} Bio).`, "success"); calculateBaseStats(); updateResourceDisplay(); updateBaseStatusDisplay(); }
function toggleNanobotDefendBase() { gameState.nanobotStats.isDefendingBase = !gameState.nanobotStats.isDefendingBase; if (gameState.nanobotStats.isDefendingBase) { if(toggleNanobotDefendBaseBtn) {toggleNanobotDefendBaseBtn.textContent = "Désactiver Défense du Noyau"; toggleNanobotDefendBaseBtn.classList.remove('btn-secondary'); toggleNanobotDefendBaseBtn.classList.add('btn-warning');} addLogEntry("Nexus-7 en mode défense du Noyau. Retournez à la base pour être effectif.", "info"); if (gameState.currentZoneId === 'sector_x9' && gameState.map.nanobotPos.x === BASE_COORDINATES.x && gameState.map.nanobotPos.y === BASE_COORDINATES.y) { addLogEntry("Nexus-7 est positionné pour défendre le Noyau.", "success"); } } else { if(toggleNanobotDefendBaseBtn) {toggleNanobotDefendBaseBtn.textContent = "Activer Défense du Noyau"; toggleNanobotDefendBaseBtn.classList.add('btn-secondary'); toggleNanobotDefendBaseBtn.classList.remove('btn-warning');} addLogEntry("Nexus-7 n'est plus en mode défense active du Noyau.", "info"); } calculateBaseStats(); updateBaseStatusDisplay(); }

function updateGameTimeAndCycle() { 
    // console.log(`gameplayLogic.js: updateGameTimeAndCycle - Tick. GameTime: ${gameState.gameTime}, CycleTime: ${gameState.currentCycleTime}`);
    gameState.gameTime++; 
    gameState.currentCycleTime += TICK_SPEED; 
    const currentCycleDuration = gameState.isDay ? DAY_DURATION : NIGHT_DURATION; 
    if (gameState.currentCycleTime >= currentCycleDuration) { 
        forceCycleChange(true); 
    } 
    if(gameTimeEl) gameTimeEl.textContent = formatTime(Math.floor(gameState.gameTime * (TICK_SPEED / 1000)));
    if(cycleStatusEl) {
        const timeRemainingInCycle = Math.max(0, currentCycleDuration - gameState.currentCycleTime);
        cycleStatusEl.textContent = `${gameState.isDay ? "Jour" : "Nuit"} (${formatTime(Math.floor(timeRemainingInCycle / 1000))})`; 
    }
}

function forceCycleChange(isNaturalChange = false) {
    // console.log(`gameplayLogic.js: forceCycleChange - APPELÉE. Naturel: ${isNaturalChange}`);
    if (!isNaturalChange) {
        if (!FORCE_CYCLE_CHANGE_COST || (gameState.resources.biomass || 0) < FORCE_CYCLE_CHANGE_COST.biomass || (gameState.resources.nanites || 0) < FORCE_CYCLE_CHANGE_COST.nanites) {
            addLogEntry(`Ressources insuffisantes pour forcer le cycle. Requis: ${FORCE_CYCLE_CHANGE_COST.biomass} Biomasse, ${FORCE_CYCLE_CHANGE_COST.nanites} Nanites.`, "error");
            return;
        }
        gameState.resources.biomass -= FORCE_CYCLE_CHANGE_COST.biomass;
        gameState.resources.nanites -= FORCE_CYCLE_CHANGE_COST.nanites;
        addLogEntry(`Cycle forcé. (-${FORCE_CYCLE_CHANGE_COST.biomass} Bio, -${FORCE_CYCLE_CHANGE_COST.nanites} Nan).`, "warning");
        if(typeof updateResourceDisplay === 'function') updateResourceDisplay(); 
    }
    gameState.isDay = !gameState.isDay; 
    gameState.currentCycleTime = 0; 
    addLogEntry(`Changement de cycle: C'est maintenant ${gameState.isDay ? 'le JOUR' : 'la NUIT'}.`, "info"); 
    const newCycleDuration = gameState.isDay ? DAY_DURATION : NIGHT_DURATION;
    if(cycleStatusEl) cycleStatusEl.textContent = `${gameState.isDay ? "Jour" : "Nuit"} (${formatTime(Math.floor(newCycleDuration / 1000))})`; 
    if (!gameState.isDay) { 
        addLogEntry("L'activité hostile augmente... Préparez les défenses!", "warning"); 
        if(typeof startNightAssault === 'function') startNightAssault(); else console.error("ERREUR: startNightAssault n'est pas défini dans forceCycleChange");
    } else { 
        addLogEntry("L'activité hostile diminue avec l'aube.", "info"); 
        if(typeof endNightAssault === 'function') endNightAssault(); else console.error("ERREUR: endNightAssault n'est pas défini dans forceCycleChange");
    } 
    if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption(); else console.error("ERREUR: calculateProductionAndConsumption n'est pas défini dans forceCycleChange");
    if(typeof calculateBaseStats === 'function') calculateBaseStats(); else console.error("ERREUR: calculateBaseStats n'est pas défini dans forceCycleChange");
    // console.log(`gameplayLogic.js: forceCycleChange - FIN. Nouveau cycle: ${gameState.isDay ? "Jour" : "Nuit"}`);
}

function initializeBaseGrid() {
    // console.log("gameplayLogic.js: initializeBaseGrid appelée");
    gameState.baseGrid = [];
    for (let r = 0; r < BASE_GRID_SIZE.rows; r++) {
        gameState.baseGrid[r] = [];
        for (let c = 0; c < BASE_GRID_SIZE.cols; c++) {
            gameState.baseGrid[r][c] = null; 
        }
    }
}

function enterPlacementMode(defenseTypeId) {
    // console.log(`gameplayLogic.js: enterPlacementMode pour ${defenseTypeId}`);
    if (!buildingsData[defenseTypeId] || buildingsData[defenseTypeId].type !== 'defense') { addLogEntry("Type de défense invalide pour le placement.", "error"); return; }
    const techLevel = gameState.buildings[defenseTypeId] || 0;
    if (techLevel < 1) { addLogEntry(`Vous devez d'abord débloquer la technologie ${buildingsData[defenseTypeId].name} (Niv. 1).`, "warning"); return; }
    gameState.placementMode.isActive = true;
    gameState.placementMode.selectedDefenseType = defenseTypeId;
    gameState.placementMode.selectedDefenseLevel = techLevel; 
    if(placementInfoDivEl) placementInfoDivEl.classList.remove('hidden');
    if(selectedDefenseForPlacementSpanEl) selectedDefenseForPlacementSpanEl.textContent = buildingsData[defenseTypeId].name + ` (Niv.${techLevel})`;
    addLogEntry(`Mode placement activé pour ${buildingsData[defenseTypeId].name}. Cliquez sur une case de la grille de base.`, "info");
    if(typeof updateBasePreview === 'function') updateBasePreview(); 
}

function cancelPlacementMode() {
    // console.log("gameplayLogic.js: cancelPlacementMode appelée");
    gameState.placementMode.isActive = false;
    gameState.placementMode.selectedDefenseType = null;
    gameState.placementMode.selectedDefenseLevel = 0;
    if(placementInfoDivEl) placementInfoDivEl.classList.add('hidden');
    addLogEntry("Mode placement annulé.", "info");
    if(typeof updateBasePreview === 'function') updateBasePreview();
}

function handleGridCellClick(row, col) { // Pour la grille de BASE
    // console.log(`gameplayLogic.js: handleGridCellClick (base) pour (${row},${col})`);
    const coreRow = Math.floor(BASE_GRID_SIZE.rows / 2);
    const coreCol = Math.floor(BASE_GRID_SIZE.cols / 2);
    if (gameState.placementMode.isActive) {
        if (row === coreRow && col === coreCol) { addLogEntry("Impossible de placer une défense sur le Noyau Central.", "warning"); return; }
        if (gameState.baseGrid[row] && gameState.baseGrid[row][col]) { addLogEntry("Cette case est déjà occupée. Annulez le mode placement pour gérer la défense existante.", "warning"); return; }
        const defenseTypeId = gameState.placementMode.selectedDefenseType;
        const defenseTechLevel = gameState.placementMode.selectedDefenseLevel; 
        const buildingDef = buildingsData[defenseTypeId];
        if (!buildingDef || !buildingDef.placementCost) { addLogEntry("Erreur: Coût de placement non défini pour cette défense.", "error"); cancelPlacementMode(); return; }
        const placementCost = buildingDef.placementCost;
        for (const resource in placementCost) { if ((gameState.resources[resource]||0) < placementCost[resource]) { addLogEntry(`Ressources insuffisantes pour placer ${buildingDef.name}. Requis: ${placementCost[resource]} ${resource}.`, "error"); return; } }
        for (const resource in placementCost) { gameState.resources[resource] -= placementCost[resource]; }
        const levelDataToPlace = buildingDef.levels.find(l => l.level === defenseTechLevel) || buildingDef.levels[0]; 
        const instanceId = `${defenseTypeId}_${row}_${col}`;
        gameState.baseGrid[row][col] = { id: defenseTypeId, level: defenseTechLevel, instanceId: instanceId };
        gameState.defenses[instanceId] = {
            id: defenseTypeId, name: buildingDef.name, level: defenseTechLevel,
            currentHealth: levelDataToPlace.stats.health, maxHealth: levelDataToPlace.stats.health,
            attack: levelDataToPlace.stats.attack || 0, 
            damageType: levelDataToPlace.stats.damageType || DAMAGE_TYPES.KINETIC, 
            range: levelDataToPlace.stats.range || 50, 
            gridPos: { r: row, c: col }
        };
        addLogEntry(`${buildingDef.name} (Niv.${defenseTechLevel}) placé(e) en (${row},${col}).`, "success");
        calculateBaseStats(); 
        updateDisplays(); 
    } else { 
        const defenseOnCell = gameState.baseGrid[row] && gameState.baseGrid[row][col];
        if (defenseOnCell && defenseOnCell.instanceId) {
            managePlacedDefense(defenseOnCell.instanceId, row, col);
        } else if (row === coreRow && col === coreCol) {
            addLogEntry("Noyau Central. Intégrité: " + Math.floor(gameState.baseStats.currentHealth) + "/" + gameState.baseStats.maxHealth, "info");
        } else {
            addLogEntry(`Case vide (${row},${col}). Activez le mode placement pour construire.`, "info");
        }
    }
}

function executeUpgradePlacedDefense(instanceId) { /* ... (identique à la version précédente) ... */ }
function sellPlacedDefense(instanceId, row, col) { /* ... (identique à la version précédente) ... */ }

// --- Night Assault Logic ---
function startNightAssault() { /* ... (identique à la version précédente) ... */ }
function endNightAssault() { /* ... (identique à la version précédente) ... */ }
function processNightAssaultTick() { /* ... (identique à la version précédente, s'assurer que les console.warn sont là pour les éléments DOM si besoin) ... */ }

// --- Exploration Logic ---
function generateMap(zoneIdToGenerate = gameState.currentZoneId) { 
    // console.log(`gameplayLogic.js: generateMap appelée pour ${zoneIdToGenerate}`);
    const zone = ZONE_DATA[zoneIdToGenerate];
    if (!zone) { console.error("Zone invalide pour generateMap:", zoneIdToGenerate); return; }
    gameState.map = { tiles: [], explored: [], nanobotPos: { ...(zone.entryPoint || BASE_COORDINATES) }, zoneId: zoneIdToGenerate, currentEnemyEncounter: null };
    for (let y = 0; y < zone.mapSize.height; y++) {
        const tileRow = []; const exploredRow = [];
        for (let x = 0; x < zone.mapSize.width; x++) { tileRow.push(TILE_TYPES.EMPTY); exploredRow.push(false); }
        gameState.map.tiles.push(tileRow); gameState.map.explored.push(exploredRow);
    }
    if (gameState.map.explored[zone.entryPoint.y] && gameState.map.explored[zone.entryPoint.y][zone.entryPoint.x] !== undefined) { gameState.map.explored[zone.entryPoint.y][zone.entryPoint.x] = true;
    } else { if(!gameState.map.explored[zone.entryPoint.y]) gameState.map.explored[zone.entryPoint.y] = []; gameState.map.explored[zone.entryPoint.y][zone.entryPoint.x] = true;}
    if (zoneIdToGenerate === 'sector_x9' && gameState.map.tiles[BASE_COORDINATES.y] && gameState.map.explored[BASE_COORDINATES.y]) { gameState.map.tiles[BASE_COORDINATES.y][BASE_COORDINATES.x] = TILE_TYPES.BASE; gameState.map.explored[BASE_COORDINATES.y][BASE_COORDINATES.x] = true;}
    const totalTiles = zone.mapSize.width * zone.mapSize.height;
    if (zone.tileDistribution) { 
        for (const tileKeyString in zone.tileDistribution) {
            let tileTypeEnum; let isEnemyType = false;
            if (TILE_TYPES[tileKeyString] !== undefined) { tileTypeEnum = TILE_TYPES[tileKeyString]; } 
            else if (explorationEnemyData[tileKeyString]) { tileTypeEnum = explorationEnemyData[tileKeyString].tileTypeEnum; isEnemyType = true; } 
            else { console.warn(`Type de tuile inconnu dans tileDistribution: ${tileKeyString} pour zone ${zoneIdToGenerate}`); continue; }
            const probability = zone.tileDistribution[tileKeyString];
            const count = Math.floor(totalTiles * probability);
            for (let i = 0; i < count; i++) {
                let rx, ry; let attempts = 0;
                do { rx = Math.floor(Math.random() * zone.mapSize.width); ry = Math.floor(Math.random() * zone.mapSize.height); attempts++; } 
                while ( (gameState.map.tiles[ry][rx] !== TILE_TYPES.EMPTY || (rx === zone.entryPoint.x && ry === zone.entryPoint.y) || (zoneIdToGenerate === 'sector_x9' && rx === BASE_COORDINATES.x && ry === BASE_COORDINATES.y) ) && attempts < 100);
                if (gameState.map.tiles[ry][rx] === TILE_TYPES.EMPTY) {
                    if (tileKeyString.startsWith("RESOURCE_")) { gameState.map.tiles[ry][rx] = { type: tileTypeEnum, amount: Math.floor(Math.random() * 50) + 20 }; } 
                    else if (isEnemyType) { const enemyData = explorationEnemyData[tileKeyString]; if (enemyData) { gameState.map.tiles[ry][rx] = { type: tileTypeEnum, details: { ...enemyData } }; } } 
                    else if (tileTypeEnum === TILE_TYPES.UPGRADE_CACHE) { gameState.map.tiles[ry][rx] = { type: TILE_TYPES.UPGRADE_CACHE, reward: { biomass: Math.floor(Math.random()*50)+25, nanites: Math.floor(Math.random()*30)+15 } } ; } 
                    else if (tileTypeEnum) { gameState.map.tiles[ry][rx] = tileTypeEnum; }
                }
            }
        }
    }
    addLogEntry(`Carte pour ${zone.name} générée.`, "map-event");
}

function attemptTravelToZone(zoneId) { /* ... (identique à la version précédente) ... */ }
function handleTileClickExploration(targetX, targetY) { /* ... (identique à la version précédente) ... */ }
async function moveToTile(targetX, targetY) { /* ... (identique à la version précédente) ... */ }
async function triggerTileEvent(x, y) { /* ... (identique à la version précédente, mais assurez-vous que les console.log/warn sont là si des éléments ne sont pas trouvés ou des types de tuiles non gérés) ... */ }

// console.log("gameplayLogic.js - Fin du fichier.");