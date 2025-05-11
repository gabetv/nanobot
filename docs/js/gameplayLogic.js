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
            const defData = buildingsData[buildingId]; 
            if (!defData.levels || !defData.levels[level - 1]) continue; // Vérifier que les niveaux existent
            const currentLevelData = defData.levels[level - 1];
            
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
            if(buildingDef && buildingDef.levels && buildingDef.levels[level - 1]){ 
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
    if (!building || !building.levels) { 
        addLogEntry(`Données de bâtiment invalides pour ID: ${buildingId}`, "error");
        return;
    }
    const currentLevel = gameState.buildings[buildingId] || 0; 
    if (currentLevel >= building.levels.length) { addLogEntry(`${building.name} est au niveau maximum de technologie.`, "info"); return; } 
    
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
        if (nextLevelData.grantsModule && typeof calculateNanobotStats === 'function') calculateNanobotStats(); 
        if (building.type === 'defense' && typeof calculateBaseStats === 'function') { calculateBaseStats(); } 
        if (typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption(); 
        if (typeof updateDisplays === 'function') updateDisplays(); 
    }); 
}

function startResearch(researchId) { 
    // console.log(`gameplayLogic.js: startResearch appelée pour ${researchId}`);
    if (gameState.activeResearch) { addLogEntry("Recherche en cours.", "info"); return; } 
    if (gameState.research[researchId]) { addLogEntry("Technologie acquise.", "info"); return; } 
    
    const research = researchData[researchId]; 
    if (!research) { addLogEntry("Recherche inconnue.", "error"); return; }

    let labLevel = gameState.buildings['researchLab'] || 0; 
    let researchSpeedFactor = 0.5;
    if (labLevel > 0 && buildingsData['researchLab'] && buildingsData['researchLab'].levels[labLevel-1]) {
        researchSpeedFactor = buildingsData['researchLab'].levels[labLevel - 1].researchSpeedFactor;
    }
    
    for (const resource in research.cost) { 
        if ((gameState.resources[resource]||0) < research.cost[resource]) { 
            addLogEntry(`Ressources (${resource}) insuffisantes pour: ${research.name}. Requis: ${research.cost[resource]}`, "error"); 
            return; 
        } 
    } 
    
    showModal(`Lancer ${research.name}?`, `Coût & Temps adaptés.`, () => { 
        for (const resource in research.cost) gameState.resources[resource] -= research.cost[resource]; 
        gameState.activeResearch = { id: researchId, startTime: gameState.gameTime, totalTime: research.time / researchSpeedFactor }; 
        addLogEntry(`Recherche ${research.name} initiée.`, "success"); 
        if(typeof updateDisplays === 'function') updateDisplays(); 
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

function handleGridCellClick(row, col) { 
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

function executeUpgradePlacedDefense(instanceId) {
    const defenseInstance = gameState.defenses[instanceId];
    if (!defenseInstance) { addLogEntry("Défense introuvable.", "error"); return; }
    const defenseTypeData = buildingsData[defenseInstance.id];
    const currentInstanceLevel = defenseInstance.level;
    const currentTechLevel = gameState.buildings[defenseInstance.id] || 0;

    if (currentInstanceLevel >= currentTechLevel) { addLogEntry(`${defenseInstance.name} ne peut pas être amélioré au-delà du niveau technologique actuel (${currentTechLevel}). Améliorez d'abord la technologie via la section Modules.`, "warning"); return; }
    if (currentInstanceLevel >= defenseTypeData.levels.length) { addLogEntry(`${defenseInstance.name} est déjà au niveau maximum possible pour son type.`, "info"); return; }
    
    const nextLevelData = defenseTypeData.levels.find(l => l.level === currentInstanceLevel + 1);
    if (!nextLevelData) { addLogEntry("Niveau suivant non défini pour cette défense.", "error"); return; }

    const upgradeCost = nextLevelData.costToUpgrade; 
    for(const resourceId in upgradeCost) { const requiredAmount = upgradeCost[resourceId]; if (itemsData[resourceId]) { const countInInventory = gameState.inventory.filter(itemId => itemId === resourceId).length; if (countInInventory < requiredAmount) { addLogEntry(`Manque de ${itemsData[resourceId].name} (x${requiredAmount}) pour améliorer ${defenseInstance.name}.`, "error"); return; } } else { if ((gameState.resources[resourceId]||0) < requiredAmount) { addLogEntry(`Ressources (${resourceId}) insuffisantes pour améliorer ${defenseInstance.name}.`, "error"); return; } } }
    for(const resourceId in upgradeCost) { const paidAmount = upgradeCost[resourceId]; if (itemsData[resourceId]) { for (let i = 0; i < paidAmount; i++) { removeFromInventory(resourceId); } } else { gameState.resources[resourceId] -= paidAmount; } }

    defenseInstance.level = nextLevelData.level;
    const healthPercentageBeforeUpgrade = defenseInstance.maxHealth > 0 ? defenseInstance.currentHealth / defenseInstance.maxHealth : 1;
    defenseInstance.maxHealth = nextLevelData.stats.health;
    defenseInstance.currentHealth = Math.floor(defenseInstance.maxHealth * healthPercentageBeforeUpgrade); 
    defenseInstance.attack = nextLevelData.stats.attack || 0;
    if(nextLevelData.stats.damageType) defenseInstance.damageType = nextLevelData.stats.damageType;
    if(nextLevelData.stats.range) defenseInstance.range = nextLevelData.stats.range;

    addLogEntry(`${defenseInstance.name} amélioré(e) au Niveau ${defenseInstance.level}!`, "success");
    calculateBaseStats();
    updateDisplays();
}

function sellPlacedDefense(instanceId, row, col) {
    const defenseInstance = gameState.defenses[instanceId];
    if (!defenseInstance) { addLogEntry("Défense introuvable pour la vente.", "error"); return; }
    const defenseTypeData = buildingsData[defenseInstance.id];
    
    let totalInvestedBiomass = (defenseTypeData.placementCost ? defenseTypeData.placementCost.biomass : 0) || 0;
    let totalInvestedNanites = (defenseTypeData.placementCost ? defenseTypeData.placementCost.nanites : 0) || 0;
    
    // Itérer sur les niveaux de l'instance pour sommer les coûts d'upgrade de cette instance
    for(let i = 0; i < defenseInstance.level -1; i++){ // Pour les niveaux 2 et plus (l'upgrade de 1 à 2, 2 à 3, etc.)
        const levelIndex = defenseTypeData.levels.findIndex(l => l.level === i + 1); // Coût pour passer du niveau i au niveau i+1
        if(levelIndex !== -1 && defenseTypeData.levels[levelIndex+1]){ // S'assurer que le niveau suivant existe
            const levelCostData = defenseTypeData.levels[levelIndex+1].costToUpgrade; 
            if(levelCostData){ 
                totalInvestedBiomass += levelCostData.biomass || 0;
                totalInvestedNanites += levelCostData.nanites || 0;
            }
        }
    }
    // Ajouter le coût de "déblocage/fabrication" du niveau 1 de la technologie (si l'instance est au moins niveau 1)
    // Ce coût est dans costToUnlockOrUpgrade du premier niveau.
    if (defenseInstance.level >= 1 && defenseTypeData.levels[0] && defenseTypeData.levels[0].costToUnlockOrUpgrade) {
        // Non, on ne rembourse pas le coût de la recherche/technologie, juste le coût de placement et les upgrades de l'instance.
        // La logique actuelle de totalInvestedBiomass/Nanites est basée sur le placementCost + coûts d'upgrade.
        // Si le "placementCost" est le coût de fabrication de l'instance de niveau 1, c'est correct.
        // Si "costToUnlockOrUpgrade" du niveau 1 de la *technologie* est différent du coût de *placement*, il faut clarifier.
        // Pour l'instant, on se base sur le `placementCost` pour l'unité initiale.
    }

    const refundBiomass = Math.floor(totalInvestedBiomass * SELL_REFUND_FACTOR);
    const refundNanites = Math.floor(totalInvestedNanites * SELL_REFUND_FACTOR);

    gameState.resources.biomass += refundBiomass;
    gameState.resources.nanites += refundNanites;

    delete gameState.defenses[instanceId];
    if (gameState.baseGrid[row] && gameState.baseGrid[row][col] && gameState.baseGrid[row][col].instanceId === instanceId) {
        gameState.baseGrid[row][col] = null; 
    }

    addLogEntry(`${defenseInstance.name} vendu(e). +${refundBiomass} Biomasse, +${refundNanites} Nanites.`, "info");
    calculateBaseStats();
    updateDisplays();
}


// --- Night Assault Logic ---
function startNightAssault() {
    if (!gameState || !gameState.baseStats || gameState.baseStats.currentHealth <= 0) { 
        if(typeof addLogEntry === 'function') addLogEntry("Le Noyau est détruit ou état invalide. Impossible de subir un assaut.", "error", eventLogEl, gameState ? gameState.eventLog : null); 
        if(gameState && gameState.nightAssault) gameState.nightAssault.isActive = false; 
        return; 
    }
    gameState.nightAssault.isActive = true; 
    gameState.nightAssault.wave++; 
    gameState.nightAssault.enemies = []; 
    gameState.nightAssault.lastAttackTime = gameState.gameTime; 
    gameState.nightAssault.log = [`Début de l'assaut nocturne - Vague ${gameState.nightAssault.wave}`]; 
    if(nightAssaultLogEl) nightAssaultLogEl.innerHTML = '<h3 class="font-orbitron text-lg mb-2 text-red-300 border-b border-gray-600 pb-1">Journal d\'Assaut Nocturne</h3>'; 
    
    gameState.nightAssault.currentEvent = null; 
    gameState.nightAssault.globalModifiers = {}; 

    const wave = gameState.nightAssault.wave;
    const previewContainer = basePreviewContainerEl; 
    const containerWidth = previewContainer ? previewContainer.offsetWidth : 300;
    const containerHeight = previewContainer ? previewContainer.offsetHeight : 200;

    let isBossWave = (wave % BOSS_WAVE_INTERVAL === 0 && wave > 0);
    let enemySummary = "";

    if (isBossWave) {
        const bossKeys = Object.keys(bossDefinitions);
        if (bossKeys.length > 0) {
            const bossType = bossKeys[Math.floor(Math.random() * bossKeys.length)]; 
            const bossData = bossDefinitions[bossType];
            if (bossData) {
                let bossX, bossY; const edge = Math.floor(Math.random() * 4);
                const bossWidth = bossData.visualSize ? bossData.visualSize.width : 8;
                const bossHeight = bossData.visualSize ? bossData.visualSize.height : 8;
                const offset = 15 + (bossWidth / 2); 
                if (edge === 0) { bossX = Math.random() * (containerWidth - bossWidth) + (bossWidth/2) ; bossY = -offset; } 
                else if (edge === 1) { bossX = containerWidth + offset; bossY = Math.random() * (containerHeight - bossHeight) + (bossHeight/2); } 
                else if (edge === 2) { bossX = Math.random() * (containerWidth - bossWidth) + (bossWidth/2); bossY = containerHeight + offset; } 
                else { bossX = -offset; bossY = Math.random() * (containerHeight - bossHeight) + (bossHeight/2); }

                gameState.nightAssault.enemies.push({
                    id: `${bossData.id}_${gameState.gameTime}`, typeInfo: { ...bossData }, 
                    currentHealth: Math.floor(bossData.baseHealth * (1 + (wave / BOSS_WAVE_INTERVAL -1) * 0.3)), 
                    maxHealth: Math.floor(bossData.baseHealth * (1 + (wave / BOSS_WAVE_INTERVAL -1) * 0.3)),
                    x: bossX, y: bossY, targetDefenseInstanceId: null, isAttacking: false, attackCooldown: 0, isBoss: true
                });
                enemySummary = `BOSS - ${bossData.name} en approche !`;
                addLogEntry(enemySummary, "error", nightAssaultLogEl, gameState.nightAssault.log);
            }
        } else { isBossWave = false; }
    } 
    
    if (!isBossWave) { 
        let enemyCounts = { 
            'swarm_drone': wave * 2 + Math.floor(Math.random() * wave * 1.5), 
            'assault_bot': Math.floor(wave / 2.5) + Math.floor(Math.random() * (wave/2 +1)), 
            'heavy_crawler': wave > 1 ? Math.floor(wave / 3.5) + Math.floor(Math.random() * (wave/3+1)) : 0 
         };
        for (const enemyTypeId in enemyCounts) {
            const count = enemyCounts[enemyTypeId]; 
            const typeInfo = nightAssaultEnemies.find(e => e.id === enemyTypeId);
            if (!typeInfo || count === 0) continue;
            for (let i = 0; i < count; i++) {
                let x, y; const edge = Math.floor(Math.random() * 4); const offset = 5; 
                if (edge === 0) { x = Math.random() * containerWidth; y = offset; } 
                else if (edge === 1) { x = containerWidth - offset; y = Math.random() * containerHeight; } 
                else if (edge === 2) { x = Math.random() * containerWidth; y = containerHeight - offset; } 
                else { x = offset; y = Math.random() * containerHeight; }
                gameState.nightAssault.enemies.push({ 
                    id: `${enemyTypeId}_${gameState.gameTime}_${i}`, 
                    typeInfo: {...typeInfo}, 
                    currentHealth: typeInfo.baseHealth, 
                    maxHealth: typeInfo.baseHealth, 
                    x: x, y: y, 
                    targetDefenseInstanceId: null, 
                    isAttacking: false, 
                    attackCooldown: 0 
                });
            }
        }
        enemySummary = Object.entries(enemyCounts).filter(([id,count])=> count > 0).map(([id, count]) => `${count} ${nightAssaultEnemies.find(e=>e.id===id)?.name || 'Inconnu'}(s)`).join(', ');
        if (Math.random() < SPECIAL_EVENT_CHANCE && nightEvents.length > 0) {
            const randomEvent = nightEvents[Math.floor(Math.random() * nightEvents.length)];
            gameState.nightAssault.currentEvent = { id: randomEvent.id, startTime: gameState.gameTime };
            addLogEntry(`ÉVÉNEMENT SPÉCIAL: ${randomEvent.name} - ${randomEvent.description}`, "warning", nightAssaultLogEl, gameState.nightAssault.log);
            if (typeof randomEvent.effect === 'function') { randomEvent.effect(gameState.nightAssault, gameState.baseGrid, gameState.defenses); }
        }
    }
    
    if (gameState.nightAssault.enemies.length === 0) enemySummary = "Vague de reconnaissance très faible";
    addLogEntry(`ALERTE! Vague ${gameState.nightAssault.wave}: ${enemySummary}.`, "error", eventLogEl); 
    if(!isBossWave && enemySummary !== "Vague de reconnaissance très faible") addLogEntry(`Vague ${gameState.nightAssault.wave} en approche: ${enemySummary}.`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log); 
    
    if(typeof updateBaseStatusDisplay === 'function') updateBaseStatusDisplay(); 
}

function endNightAssault() {
    gameState.nightAssault.isActive = false;
    if (gameState.nightAssault.currentEvent) {
        const eventData = nightEvents.find(e => e.id === gameState.nightAssault.currentEvent.id);
        if (eventData && typeof eventData.revertEffect === 'function') { eventData.revertEffect(gameState.nightAssault); }
    }
    gameState.nightAssault.currentEvent = null;
    gameState.nightAssault.globalModifiers = {};

    if (gameState.nightAssault.enemies.length > 0 && gameState.baseStats.currentHealth > 0) { 
        let remainingEnemies = gameState.nightAssault.enemies.map(g => `${g.typeInfo.name}(s)`).join(', '); 
        addLogEntry(`L'aube arrive. Les ennemis restants (${remainingEnemies}) se retirent.`, "base-defense-event", nightAssaultLogEl, gameState.nightAssault.log);
    } else if (gameState.baseStats.currentHealth > 0 && gameState.nightAssault.wave > 0) { 
        addLogEntry(`Nuit ${gameState.nightAssault.wave} survivée ! Les défenses ont tenu.`, "success", nightAssaultLogEl, gameState.nightAssault.log);
    } else if (gameState.baseStats.currentHealth <=0) { 
        addLogEntry(`Le Noyau a été détruit pendant la vague ${gameState.nightAssault.wave}.`, "error", nightAssaultLogEl, gameState.nightAssault.log); 
    }
    gameState.nightAssault.enemies = []; 
    if(typeof updateBaseStatusDisplay === 'function') updateBaseStatusDisplay();
}

function processNightAssaultTick() {
    if (!gameState.nightAssault.isActive || gameState.isDay || gameState.baseStats.currentHealth <= 0) return;
    
    const previewContainer = basePreviewContainerEl;
    if (!previewContainer) { console.error("processNightAssaultTick: basePreviewContainerEl est null !"); return; }
    const cellWidth = previewContainer.offsetWidth / BASE_GRID_SIZE.cols;
    const cellHeight = previewContainer.offsetHeight / BASE_GRID_SIZE.rows;
    
    const coreVisualCell = document.getElementById('base-core-visual-cell'); 
    let coreCenterX = previewContainer.offsetWidth / 2;
    let coreCenterY = previewContainer.offsetHeight / 2;
    if (coreVisualCell) { 
        const coreRect = coreVisualCell.getBoundingClientRect();
        const containerRect = previewContainer.getBoundingClientRect();
        coreCenterX = (coreRect.left - (containerRect ? containerRect.left : 0)) + coreRect.width / 2; 
        coreCenterY = (coreRect.top - (containerRect ? containerRect.top : 0)) + coreRect.height / 2;
    }

    let enemiesTargetedByDefenses = new Set(); 

    for (const defenseInstanceId in gameState.defenses) {
        const defense = gameState.defenses[defenseInstanceId];
        if (defense.currentHealth <= 0 || !defense.gridPos) continue; 
        const buildingDef = buildingsData[defense.id];
        if (!buildingDef || !buildingDef.levels[defense.level - 1] || !buildingDef.levels[defense.level - 1].stats) continue;
        const defenseStats = buildingDef.levels[defense.level - 1].stats;
        const defenseDamageType = defense.damageType || defenseStats.damageType || DAMAGE_TYPES.KINETIC; 
        let defenseRange = defense.range || defenseStats.range || 75; 
        if (gameState.nightAssault.globalModifiers && gameState.nightAssault.globalModifiers.turretRangeFactor) { 
            defenseRange *= gameState.nightAssault.globalModifiers.turretRangeFactor; 
        }
        const defensePixelX = defense.gridPos.c * cellWidth + (cellWidth / 2);
        const defensePixelY = defense.gridPos.r * cellHeight + (cellHeight / 2);
        let bestTarget = null; let minDistanceSq = defenseRange * defenseRange;
        gameState.nightAssault.enemies.forEach(enemy => {
            if (enemy.currentHealth > 0) {
                const dx = enemy.x - defensePixelX; const dy = enemy.y - defensePixelY;
                const distSq = dx*dx + dy*dy;
                if (distSq < minDistanceSq) { minDistanceSq = distSq; bestTarget = enemy; }
            }
        });
        if (bestTarget) {
            let damageDealt = calculateModifiedDamage(defense.attack, defenseDamageType, bestTarget.typeInfo.resistances);
            bestTarget.currentHealth -= damageDealt;
            drawLaserShot(defensePixelX, defensePixelY, bestTarget.x, bestTarget.y); 
            if (!enemiesTargetedByDefenses.has(bestTarget.id)) { addLogEntry(`${defense.name} tire sur ${bestTarget.typeInfo.name}, infligeant ${damageDealt} dégâts ${defenseDamageType}.`, "base-defense-event", nightAssaultLogEl, gameState.nightAssault.log); enemiesTargetedByDefenses.add(bestTarget.id); }
            if (bestTarget.currentHealth <= 0) { addLogEntry(`${bestTarget.typeInfo.name} détruit par ${defense.name} !`, "success", nightAssaultLogEl, gameState.nightAssault.log); gameState.resources.biomass += bestTarget.typeInfo.reward.biomass || 0; gameState.resources.nanites += bestTarget.typeInfo.reward.nanites || 0; }
        }
    }
    gameState.nightAssault.enemies = gameState.nightAssault.enemies.filter(e => e.currentHealth > 0);

    if (gameState.gameTime < gameState.nightAssault.lastAttackTime + (NIGHT_ASSAULT_TICK_INTERVAL / TICK_SPEED)) return; 
    gameState.nightAssault.lastAttackTime = gameState.gameTime;
    if (gameState.nightAssault.enemies.length === 0 && gameState.nightAssault.isActive) { if(!gameState.isDay) addLogEntry("Secteur calme...", "base-info-event", nightAssaultLogEl, gameState.nightAssault.log); }

    gameState.nightAssault.enemies.forEach(enemy => {
        if (enemy.currentHealth <= 0 || !enemy.typeInfo) return;
        enemy.isAttacking = false; 
        let targetX = coreCenterX; let targetY = coreCenterY;
        let closestDefenseInstanceId = null; 
        let minDistanceToTargetSq = Math.pow(targetX - enemy.x, 2) + Math.pow(targetY - enemy.y, 2); 
        let canTargetWalls = !enemy.isFlying; 

        for (const defenseInstanceId_loop in gameState.defenses) {
            const defense = gameState.defenses[defenseInstanceId_loop];
            const defenseType = buildingsData[defense.id];
            if (defense.currentHealth > 0 && defense.gridPos) {
                if (!canTargetWalls && defenseType && defenseType.name.toLowerCase().includes("wall")) { continue; }
                const defPixelX = defense.gridPos.c * cellWidth + (cellWidth / 2);
                const defPixelY = defense.gridPos.r * cellHeight + (cellHeight / 2);
                const dx = defPixelX - enemy.x; const dy = defPixelY - enemy.y;
                const distSq = dx*dx + dy*dy;
                if (distSq < minDistanceToTargetSq) { minDistanceToTargetSq = distSq; closestDefenseInstanceId = defenseInstanceId_loop; targetX = defPixelX; targetY = defPixelY; }
            }
        }
        
        const enemyAttackRange = enemy.typeInfo.attackRange || 20; 
        const enemyAttackRangeSq = enemyAttackRange * enemyAttackRange; 

        if (minDistanceToTargetSq < enemyAttackRangeSq) { 
            enemy.isAttacking = true;
            if (closestDefenseInstanceId) { 
                const defenseInstance = gameState.defenses[closestDefenseInstanceId]; 
                const damageToDefense = enemy.typeInfo.baseAttack;
                defenseInstance.currentHealth -= damageToDefense;
                addLogEntry(`${enemy.typeInfo.name} attaque ${defenseInstance.name}, infligeant ${damageToDefense} dégâts. (PV Déf: ${Math.floor(defenseInstance.currentHealth)})`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log);
                if (defenseInstance.currentHealth <= 0) {
                    addLogEntry(`${defenseInstance.name} détruit par ${enemy.typeInfo.name}!`, "error", nightAssaultLogEl, gameState.nightAssault.log);
                    const {r, c} = defenseInstance.gridPos;
                    if(gameState.baseGrid[r] && gameState.baseGrid[r][c] && gameState.baseGrid[r][c].instanceId === closestDefenseInstanceId) { gameState.baseGrid[r][c] = null; }
                    delete gameState.defenses[closestDefenseInstanceId];
                    calculateBaseStats(); calculateProductionAndConsumption();
                }
            } else { 
                 const damageToCore = enemy.typeInfo.baseAttack;
                 let actualDamageToCore = damageToCore;
                if (gameState.nanobotStats.isDefendingBase && gameState.currentZoneId === 'sector_x9' && gameState.map.nanobotPos.x === BASE_COORDINATES.x && gameState.map.nanobotPos.y === BASE_COORDINATES.y && gameState.nanobotStats.currentHealth > 0) {
                    const damageToNanobot = Math.min(Math.floor(damageToCore * 0.5), gameState.nanobotStats.currentHealth);
                    actualDamageToCore -= damageToNanobot;
                    if (damageToNanobot > 0) { gameState.nanobotStats.currentHealth -= damageToNanobot; addLogEntry(`Nexus-7 intercepte ${damageToNanobot} dégâts pour le Noyau!`, "base-defense-event", nightAssaultLogEl, gameState.nightAssault.log); updateNanobotDisplay(); if (gameState.nanobotStats.currentHealth <= 0) { addLogEntry("Nexus-7 est hors de combat!", "error", nightAssaultLogEl, gameState.nightAssault.log); calculateBaseStats(); } }
                }
                if (actualDamageToCore > 0) { gameState.baseStats.currentHealth -= actualDamageToCore; addLogEntry(`${enemy.typeInfo.name} attaque le Noyau, infligeant ${actualDamageToCore} dégâts!`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log); }
            }
        }

        if (!enemy.isAttacking) {
            const moveSpeed = enemy.typeInfo.speed || (enemy.isBoss ? 1.5 : 3); 
            const dxMove = targetX - enemy.x; const dyMove = targetY - enemy.y;
            const distMove = Math.sqrt(dxMove*dxMove + dyMove*dyMove);
            if (distMove > moveSpeed) { 
                enemy.x += (dxMove / distMove) * moveSpeed;
                enemy.y += (dyMove / distMove) * moveSpeed;
            } else { 
                enemy.x = targetX; enemy.y = targetY; 
            }
        }
        if (enemy.isBoss && enemy.typeInfo.abilities) { 
            enemy.typeInfo.abilities.forEach(ability => {
                if (Math.random() < (ability.chance || 0.1)) { 
                    if (ability.type === 'aoe_stomp' && ability.damage && ability.radius) {
                        addLogEntry(`${enemy.typeInfo.name} déchaîne un Piétinement Destructeur !`, "error", nightAssaultLogEl, gameState.nightAssault.log);
                        let affectedDefenses = 0;
                        for (const defId in gameState.defenses) {
                            const d = gameState.defenses[defId];
                            if(d.gridPos){ // S'assurer que la défense a une position
                                const dx_aoe = (d.gridPos.c * cellWidth + cellWidth/2) - enemy.x;
                                const dy_aoe = (d.gridPos.r * cellHeight + cellHeight/2) - enemy.y;
                                if (dx_aoe*dx_aoe + dy_aoe*dy_aoe < ability.radius * ability.radius) {
                                    d.currentHealth -= ability.damage;
                                    affectedDefenses++;
                                    if (d.currentHealth <=0) { 
                                        addLogEntry(`${d.name} détruit par le Piétinement !`, "error", nightAssaultLogEl, gameState.nightAssault.log);
                                        const {r, c} = d.gridPos;
                                        if(gameState.baseGrid[r] && gameState.baseGrid[r][c] && gameState.baseGrid[r][c].instanceId === defId) { gameState.baseGrid[r][c] = null; }
                                        delete gameState.defenses[defId];                                     
                                    }
                                }
                            }
                        }
                         if (affectedDefenses > 0) {
                            addLogEntry(`Le piétinement touche ${affectedDefenses} défenses pour ${ability.damage} dégâts !`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log);
                            calculateBaseStats(); 
                         }
                    } else if (ability.type === 'regen' && ability.amount) {
                        enemy.currentHealth = Math.min(enemy.maxHealth, enemy.currentHealth + ability.amount);
                        addLogEntry(`${enemy.typeInfo.name} se régénère de ${ability.amount} PV !`, "base-info-event", nightAssaultLogEl, gameState.nightAssault.log);
                    }
                }
            });
        }
    });

    if (gameState.baseStats.currentHealth <= 0) { gameState.baseStats.currentHealth = 0; addLogEntry("ALERTE CRITIQUE! L'INTÉGRITÉ DU NOYAU EST COMPROMISE!", "error", nightAssaultLogEl, gameState.nightAssault.log); let biomassLoss = Math.floor(gameState.resources.biomass * 0.25); let naniteLoss = Math.floor(gameState.resources.nanites * 0.25); gameState.resources.biomass -= biomassLoss; gameState.resources.nanites -= naniteLoss; addLogEntry(`Perte de ressources: -${biomassLoss} Biomasse, -${naniteLoss} Nanites.`, "error", nightAssaultLogEl, gameState.nightAssault.log); addLogEntry("Le Noyau est détruit. L'assaut prend fin.", "error", eventLogEl); endNightAssault(); }
    if(typeof updateBaseStatusDisplay === 'function') updateBaseStatusDisplay(); 
}

// console.log("gameplayLogic.js - Fin du fichier.");