// js/gameplayLogic.js
console.log("gameplayLogic.js - Fichier chargé et en cours d'analyse...");

function calculateNanobotStats() {
    // console.log("gameplayLogic: calculateNanobotStats CALLED");
    if (!gameState || !gameState.nanobotStats) { console.error("calculateNanobotStats: gameState ou nanobotStats non défini."); return; }
    const stats = gameState.nanobotStats;
    // Reset to base stats before applying bonuses
    stats.health = stats.baseHealth;
    stats.attack = stats.baseAttack;
    stats.defense = stats.baseDefense;
    stats.speed = stats.baseSpeed;
    // Ensure currentHealth does not exceed new maxHealth from previous calculations if baseHealth changed
    stats.currentHealth = Math.min(stats.currentHealth, stats.health);


    if (typeof researchData !== 'undefined' && gameState && gameState.research) {
        for (const researchId in gameState.research) {
            if (gameState.research[researchId] && researchData[researchId]) { // Check if research is completed
                const resData = researchData[researchId];
                if (resData.grantsStatBoost) {
                    for (const stat in resData.grantsStatBoost) {
                        stats[stat] = (stats[stat] || 0) + resData.grantsStatBoost[stat];
                    }
                }
            }
        }
    } else { /* console.warn("calculateNanobotStats: researchData non défini ou gameState.research manquant."); */ }


    if (typeof nanobotModulesData !== 'undefined' && gameState && gameState.nanobotModuleLevels) {
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
    } else { /* console.warn("calculateNanobotStats: nanobotModulesData non défini ou gameState.nanobotModuleLevels manquant."); */ }

    if (typeof itemsData !== 'undefined' && gameState && gameState.nanobotEquipment) {
        for (const slot in gameState.nanobotEquipment) {
            const itemId = gameState.nanobotEquipment[slot];
            if (itemId && itemsData[itemId] && itemsData[itemId].statBoost) {
                const itemBoosts = itemsData[itemId].statBoost;
                for (const stat in itemBoosts) {
                    // Avoid applying onUse stats directly here, they are typically one-time
                    if (stat !== 'health_regen_on_use' && typeof itemsData[itemId].onUse === 'undefined') {
                         stats[stat] = (stats[stat] || 0) + itemBoosts[stat];
                    }
                }
            }
        }
    } else { /* console.warn("calculateNanobotStats: itemsData non défini ou gameState.nanobotEquipment manquant."); */ }


    // Ensure currentHealth is capped by maxHealth and not negative
    stats.currentHealth = Math.min(stats.currentHealth, stats.health);
    if (stats.currentHealth < 0) stats.currentHealth = 0;
}

function upgradeNanobotModule(moduleId) {
    // console.log(`gameplayLogic: upgradeNanobotModule pour ${moduleId}`);
    if (typeof nanobotModulesData === 'undefined' || typeof itemsData === 'undefined' || typeof gameState === 'undefined') {
        console.error("upgradeNanobotModule: Dépendances (nanobotModulesData, itemsData, ou gameState) non définies.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur de configuration des modules.", "error", eventLogEl, gameState?.eventLog);
        return;
    }
    const moduleData = nanobotModulesData[moduleId];
    if (!moduleData) { if(typeof addLogEntry === 'function') addLogEntry("Module inconnu.", "error", eventLogEl, gameState.eventLog); return; }

    let currentLevel = gameState.nanobotModuleLevels[moduleId] || 0;

    let isReplacedByActiveHigher = false;
    for (const checkId in nanobotModulesData) {
        if (nanobotModulesData[checkId].replaces === moduleId && gameState.nanobotModuleLevels[checkId] > 0) {
            isReplacedByActiveHigher = true; break;
        }
    }
    if(isReplacedByActiveHigher){
        if(typeof addLogEntry === 'function') addLogEntry(`Impossible d'améliorer ${moduleData.name}, il est déjà remplacé par une version supérieure.`, "warning", eventLogEl, gameState.eventLog);
        return;
    }

    if (!moduleData.levels || currentLevel >= moduleData.levels.length) {
        if(typeof addLogEntry === 'function') addLogEntry(`${moduleData.name} est déjà au niveau maximum.`, "info", eventLogEl, gameState.eventLog);
        return;
    }

    const costData = currentLevel === 0 ? moduleData.levels[0].costToUnlockOrUpgrade : moduleData.levels[currentLevel].costToUpgrade;
    if (!costData) {
         if(typeof addLogEntry === 'function') addLogEntry(`Coût non défini pour améliorer ${moduleData.name}.`, "error", eventLogEl, gameState.eventLog);
         return;
    }
    // console.log(`gameplayLogic: upgradeNanobotModule - Coût pour ${moduleId} Niv ${currentLevel + 1}:`, JSON.parse(JSON.stringify(costData)));

    for(const resourceId in costData) {
        const requiredAmount = costData[resourceId];
        if (itemsData[resourceId]) { // Check if it's an item (material)
            const countInInventory = gameState.inventory.filter(itemId => itemId === resourceId).length;
            if (countInInventory < requiredAmount) { if(typeof addLogEntry === 'function') addLogEntry(`Manque de ${itemsData[resourceId].name} (x${requiredAmount}) pour ${moduleData.name}.`, "error", eventLogEl, gameState.eventLog); return; }
        } else { // Assume it's a resource like biomass or nanites
            if ((gameState.resources[resourceId] || 0) < requiredAmount) { if(typeof addLogEntry === 'function') addLogEntry(`Ressources (${resourceId}) insuffisantes pour ${moduleData.name}. Requis: ${requiredAmount}.`, "error", eventLogEl, gameState.eventLog); return; }
        }
    }

    // Deduct costs
    for(const resourceId in costData) {
        const paidAmount = costData[resourceId];
        if (itemsData[resourceId]) { for (let i = 0; i < paidAmount; i++) { if(typeof removeFromInventory === 'function') removeFromInventory(resourceId); else console.error("removeFromInventory non défini"); }
        } else { gameState.resources[resourceId] -= paidAmount; }
    }

    if (moduleData.replaces && gameState.nanobotModuleLevels[moduleData.replaces]) {
        const replacedModuleId = moduleData.replaces;
        if(typeof addLogEntry === 'function') addLogEntry(`${nanobotModulesData[replacedModuleId].name} désactivé et remplacé par ${moduleData.name}.`, "info", eventLogEl, gameState.eventLog);
        delete gameState.nanobotModuleLevels[replacedModuleId]; // Remove the replaced module's level
    }

    gameState.nanobotModuleLevels[moduleId] = currentLevel + 1;
    const actionText = currentLevel === 0 ? "activé/fabriqué" : "amélioré";
    if(typeof addLogEntry === 'function') addLogEntry(`${moduleData.name} ${actionText} au Niveau ${currentLevel + 1}!`, "success", eventLogEl, gameState.eventLog);

    if(typeof calculateNanobotStats === 'function') calculateNanobotStats();
    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays();
    else if (typeof updateDisplays === 'function') updateDisplays(); // Fallback for older structure

    // Check quest progress after upgrade
    if (typeof questController !== 'undefined' && typeof questController.checkAllQuestsProgress === 'function') {
        questController.checkAllQuestsProgress();
    }
}

function calculateBaseStats() {
    // console.log("gameplayLogic: calculateBaseStats CALLED");
    if (!gameState || !gameState.baseStats || typeof BASE_INITIAL_HEALTH === 'undefined' || typeof buildingsData === 'undefined' || typeof ZONE_DATA === 'undefined' || typeof BASE_COORDINATES === 'undefined') {
        console.error("calculateBaseStats: Dépendances manquantes.");
        return;
    }
    let maxHealth = BASE_INITIAL_HEALTH;
    let defensePower = 0;

    // Add health bonus from Reinforced Walls (technology level)
    for (const buildingId in gameState.buildings) {
        const techLevel = gameState.buildings[buildingId];
        if (techLevel > 0 && buildingsData[buildingId] && buildingsData[buildingId].type === 'defense') {
            const buildingDef = buildingsData[buildingId];
             // For walls, the baseHealthBonus applies from technology, not placed instances
            if (buildingId === 'reinforcedWall' && buildingDef.levels && buildingDef.levels[techLevel - 1] && buildingDef.levels[techLevel - 1].baseHealthBonus) {
                 maxHealth += buildingDef.levels[techLevel - 1].baseHealthBonus;
            }
        }
    }

    // Calculate defense power from placed and powered defenses
    for(const instanceId in gameState.defenses){
        const defenseInstance = gameState.defenses[instanceId];
        const buildingDef = buildingsData[defenseInstance.id];
        if(defenseInstance.currentHealth > 0 && buildingDef && buildingDef.levels[defenseInstance.level -1]) {
             // Check against total consumption
             if (gameState.capacity.energy >= (gameState.resources.totalEnergyConsumed || 0) ) { 
                defensePower += defenseInstance.attack || 0;
             } else { // Deficit - scale defense power
                const deficitFactor = gameState.capacity.energy > 0 ? gameState.capacity.energy / (gameState.resources.totalEnergyConsumed || 1) : 0; // Avoid div by zero
                defensePower += Math.floor((defenseInstance.attack || 0) * deficitFactor);
             }
        }
    }


    const playerBaseZoneKey = Object.keys(ZONE_DATA).find(key => ZONE_DATA[key].basePlayerCoordinates);
    const playerBaseZone = playerBaseZoneKey ? ZONE_DATA[playerBaseZoneKey] : null;
    const playerBaseCoords = playerBaseZone?.basePlayerCoordinates || BASE_COORDINATES;


    if (gameState.nanobotStats.isDefendingBase &&
        gameState.currentZoneId === (playerBaseZone?.id || 'verdant_archipelago') && // Fallback to default zone
        gameState.map.nanobotPos.x === playerBaseCoords.x &&
        gameState.map.nanobotPos.y === playerBaseCoords.y) {
        defensePower += gameState.nanobotStats.attack; // Add Nanobot's attack if defending base
    }

    gameState.baseStats.maxHealth = maxHealth;
    gameState.baseStats.defensePower = defensePower;
    gameState.baseStats.currentHealth = Math.min(gameState.baseStats.currentHealth, gameState.baseStats.maxHealth);
    if (gameState.baseStats.currentHealth <= 0 && gameState.baseStats.maxHealth > 0) { gameState.baseStats.currentHealth = 0; /* Game Over logic would go here */ }
    // console.log("gameplayLogic: calculateBaseStats - PV Base:", gameState.baseStats.currentHealth, "/", gameState.baseStats.maxHealth, "Défense:", gameState.baseStats.defensePower);
}

function calculateProductionAndConsumption() {
    // console.log("gameplayLogic: calculateProductionAndConsumption CALLED");
    if (!gameState || !gameState.productionRates || !gameState.capacity || typeof buildingsData === 'undefined') {
        console.error("calculateProductionAndConsumption: gameState ou buildingsData non défini.");
        return;
    }

    gameState.productionRates.biomass = 0;
    gameState.productionRates.nanites = 0;
    let totalEnergyConsumption = 0;
    gameState.resources.energyConsumedByDefenses = 0; // Recalculate this

    // Calculate production and energy consumption from buildings (non-defense)
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
                // Only add consumption for non-defense buildings here
                if (buildingDef.type !== "defense" && levelData && levelData.energyConsumption) {
                    totalEnergyConsumption += levelData.energyConsumption;
                }
            }
        }
    }

    // Calculate energy consumption from active defenses
    let currentDefenseEnergyConsumption = 0;
    for (const defId in gameState.defenses) {
        const defenseInstance = gameState.defenses[defId];
        const defenseBuildingData = buildingsData[defenseInstance.id];
        if (defenseInstance.currentHealth > 0 && defenseBuildingData && defenseBuildingData.levels[defenseInstance.level - 1]) {
            currentDefenseEnergyConsumption += defenseBuildingData.levels[defenseInstance.level - 1].energyConsumption || 0;
        }
    }
    totalEnergyConsumption += currentDefenseEnergyConsumption;
    gameState.resources.energyConsumedByDefenses = currentDefenseEnergyConsumption;


    // Calculate energy capacity
    gameState.capacity.energy = 0;
    const powerPlantLevel = gameState.buildings['powerPlant'] || 0;
    if (powerPlantLevel > 0 && buildingsData['powerPlant'] && buildingsData['powerPlant'].levels[powerPlantLevel - 1]) {
        gameState.capacity.energy += buildingsData['powerPlant'].levels[powerPlantLevel - 1].capacity.energy;
    } else {
        gameState.capacity.energy = 50; // Default base capacity if no power plant or level 0
    }


    // Apply night penalty to production
    if (!gameState.isDay) {
        gameState.productionRates.biomass *= 0.7; // 70% production at night
        gameState.productionRates.nanites *= 0.7; // 70% production at night
    }

    // Store total consumption for UI and logic
    gameState.resources.totalEnergyConsumed = totalEnergyConsumption;
    // Calculate available energy
    gameState.resources.energy = gameState.capacity.energy - totalEnergyConsumption; // This is now *available* energy. Could be negative if deficit.


    // Handle energy deficit for production rates
    if (totalEnergyConsumption > gameState.capacity.energy) {
        // gameState.resources.energy is already correctly < 0 or 0 here
        const deficitFactor = gameState.capacity.energy > 0 ? gameState.capacity.energy / totalEnergyConsumption : 0;
        gameState.productionRates.biomass *= deficitFactor;
        gameState.productionRates.nanites *= deficitFactor;

        if (!gameState.deficitWarningLogged || gameState.gameTime > gameState.deficitWarningLogged + (DAY_DURATION / 4)) {
            if(typeof addLogEntry === 'function') addLogEntry("Surcharge énergétique! Production et efficacité des défenses réduites.", "error", eventLogEl, gameState.eventLog);
            gameState.deficitWarningLogged = gameState.gameTime;
        }
    } else {
        gameState.deficitWarningLogged = 0; // Reset warning log timer if no deficit
    }
    // console.log("gameplayLogic: Production:", JSON.parse(JSON.stringify(gameState.productionRates)), "Conso Énergie:", totalEnergyConsumption, "Capacité Énergie:", gameState.capacity.energy, "Énergie Dispo:", gameState.resources.energy);
}


function build(buildingId) {
    // console.log(`gameplayLogic: build - Tentative pour ${buildingId}`);
    if (typeof buildingsData === 'undefined' || typeof itemsData === 'undefined' || typeof gameState === 'undefined') {
        console.error("build: Dépendances non définies.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur de configuration des bâtiments.", "error", eventLogEl, gameState?.eventLog);
        return;
    }
    const building = buildingsData[buildingId];
    if (!building || !building.levels) {
        addLogEntry(`Données de bâtiment invalides pour ID: ${buildingId}`, "error", eventLogEl, gameState.eventLog);
        return;
    }
    const currentLevel = gameState.buildings[buildingId] || 0;
    if (currentLevel >= building.levels.length) {
        addLogEntry(`${building.name} est au niveau maximum de technologie.`, "info", eventLogEl, gameState.eventLog);
        return;
    }

    const nextLevelData = building.levels[currentLevel]; 
    const costObject = currentLevel === 0 ? nextLevelData.costToUnlockOrUpgrade : nextLevelData.costToUpgrade;
    
    if (!costObject) {
        addLogEntry(`Données de coût manquantes pour ${building.name} Niv. ${currentLevel + 1}.`, "error", eventLogEl, gameState.eventLog);
        return;
    }

    // Check costs
    for (const resource in costObject) {
        if (itemsData[resource]) { // It's a material item
            if ((gameState.inventory.filter(id => id === resource).length || 0) < costObject[resource]) {
                addLogEntry(`Composants (${itemsData[resource].name}) insuffisants pour ${building.name}. Requis: ${costObject[resource]}.`, "error", eventLogEl, gameState.eventLog); return;
            }
        } else { // It's a primary resource
            if ((gameState.resources[resource]||0) < costObject[resource]) {
                addLogEntry(`Ressources (${resource}) insuffisantes pour ${building.name}. Requis: ${costObject[resource]}.`, "error", eventLogEl, gameState.eventLog); return;
            }
        }
    }

    const title = building.type === 'defense' ? `Débloquer/Améliorer Tech ${building.name}?` : `Améliorer ${building.name}?`;
    let costString = Object.entries(costObject).map(([res, val]) => `${val} ${itemsData[res] ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
    let messageContent = `Passer la technologie ${building.name} au Niveau ${currentLevel + 1}?<br>Coût: ${costString}.`;


    showModal(title, messageContent, () => {
        // console.log(`gameplayLogic: build - Confirmation pour ${buildingId}`);
        // Deduct costs
        for (const resource in costObject) {
             if (itemsData[resource]) { // Material item
                for(let i=0; i < costObject[resource]; i++) { if(typeof removeFromInventory === 'function') removeFromInventory(resource); }
             } else { // Primary resource
                gameState.resources[resource] -= costObject[resource];
             }
        }
        gameState.buildings[buildingId] = currentLevel + 1;
        addLogEntry(`Technologie ${building.name} ${currentLevel === 0 ? 'débloquée' : 'améliorée'} au Niveau ${currentLevel + 1}.`, "success", eventLogEl, gameState.eventLog);

        if (nextLevelData.grantsModule && typeof calculateNanobotStats === 'function') calculateNanobotStats(); // If it grants a nanobot module
        if (typeof calculateBaseStats === 'function') calculateBaseStats();
        if (typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
        if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays();
        else if (typeof updateDisplays === 'function') updateDisplays();

        // Check quest progress
        if (typeof questController !== 'undefined' && typeof questController.checkQuestProgress === 'function') {
            questController.checkQuestProgress({ type: "build_level", buildingId: buildingId, level: gameState.buildings[buildingId] });
        }
         if (typeof questController !== 'undefined' && typeof questController.checkAllQuestsProgress === 'function') { // Check all in case this completes a quest
            questController.checkAllQuestsProgress();
        }
    });
}

function startResearch(researchId) {
    if (gameState.activeResearch) { addLogEntry("Une recherche est déjà en cours.", "info", eventLogEl, gameState.eventLog); return; }
    if (gameState.research[researchId]) { addLogEntry("Cette technologie a déjà été acquise.", "info", eventLogEl, gameState.eventLog); return; }

    if (typeof researchData === 'undefined' || typeof buildingsData === 'undefined' || typeof gameState === 'undefined') {
        console.error("startResearch: Dépendances non définies.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur de configuration de la recherche.", "error", eventLogEl, gameState?.eventLog);
        return;
    }
    const research = researchData[researchId];
    if (!research) { addLogEntry("Recherche inconnue.", "error", eventLogEl, gameState.eventLog); return; }

    let labLevel = gameState.buildings['researchLab'] || 0;
    let researchSpeedFactor = 0.5; 
    if (labLevel > 0 && buildingsData['researchLab'] && buildingsData['researchLab'].levels[labLevel-1]) {
        researchSpeedFactor = buildingsData['researchLab'].levels[labLevel - 1].researchSpeedFactor;
    }
    if(labLevel === 0 && research.requirements?.buildings?.researchLab >=1){
         addLogEntry(`Laboratoire de recherche (Niv. ${research.requirements.buildings.researchLab}) requis pour ${research.name}.`, "error", eventLogEl, gameState.eventLog);
        return;
    }
    
    for (const resource in research.cost) {
        if ((gameState.resources[resource]||0) < research.cost[resource]) {
            addLogEntry(`Ressources (${resource}) insuffisantes pour: ${research.name}. Requis: ${research.cost[resource]}`, "error", eventLogEl, gameState.eventLog);
            return;
        }
    }

    const researchTimeInSeconds = research.time;
    const actualResearchTimeSeconds = researchTimeInSeconds / researchSpeedFactor;
    let costString = Object.entries(research.cost).map(([res, val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');

    showModal(`Lancer Recherche: ${research.name}?`, `Coût: ${costString}.<br>Temps estimé: ${formatTime(actualResearchTimeSeconds)}.`, () => {
        for (const resource in research.cost) gameState.resources[resource] -= research.cost[resource];
        gameState.activeResearch = {
            id: researchId,
            startTime: gameState.gameTime, 
            totalTimeInSeconds: researchTimeInSeconds, 
            actualTotalTimeSeconds: actualResearchTimeSeconds 
        };
        addLogEntry(`Recherche ${research.name} initiée.`, "success", eventLogEl, gameState.eventLog);
        if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays();
        else if (typeof updateDisplays === 'function') updateDisplays();
    });
}

function repairBase(amount = 10) {
    if (!gameState || !gameState.baseStats || typeof REPAIR_COST_BASE_HEALTH_BIOMASS === 'undefined' || typeof REPAIR_COST_BASE_HEALTH_NANITES === 'undefined') { console.error("repairBase: Dépendances manquantes."); return; }
    if (gameState.baseStats.currentHealth >= gameState.baseStats.maxHealth) { addLogEntry("Le Noyau est déjà à son intégrité maximale.", "info", eventLogEl, gameState.eventLog); return; }

    const healthToRestore = Math.min(amount, gameState.baseStats.maxHealth - gameState.baseStats.currentHealth);
    const costBiomass = healthToRestore * REPAIR_COST_BASE_HEALTH_BIOMASS;
    const costNanites = healthToRestore * REPAIR_COST_BASE_HEALTH_NANITES;

    if (gameState.resources.biomass < costBiomass || gameState.resources.nanites < costNanites) {
        addLogEntry(`Ressources insuffisantes pour réparation du Noyau. Requis: ${costBiomass} Biomasse, ${costNanites} Nanites.`, "error", eventLogEl, gameState.eventLog);
        return;
    }
    gameState.resources.biomass -= costBiomass;
    gameState.resources.nanites -= costNanites;
    gameState.baseStats.currentHealth += healthToRestore;
    addLogEntry(`Noyau réparé de ${healthToRestore} PV. (-${costBiomass} Biomasse, -${costNanites} Nanites).`, "success", eventLogEl, gameState.eventLog);

    if(typeof uiUpdates !== 'undefined') { uiUpdates.updateResourceDisplay(); uiUpdates.updateBaseStatusDisplay(); }
    else { updateResourceDisplay(); updateBaseStatusDisplay(); } 
}

function repairAllDefenses() {
    if (!gameState || !gameState.defenses || typeof REPAIR_COST_DEFENSE_HEALTH_BIOMASS === 'undefined' || typeof REPAIR_COST_DEFENSE_HEALTH_NANITES === 'undefined') { console.error("repairAllDefenses: Dépendances manquantes."); return; }

    let totalBiomassCost = 0;
    let totalNaniteCost = 0;
    let totalHealthRestored = 0;
    let defensesToRepair = [];

    const costBiomassPerHP = REPAIR_COST_DEFENSE_HEALTH_BIOMASS;
    const costNanitesPerHP = REPAIR_COST_DEFENSE_HEALTH_NANITES;

    for (const defId in gameState.defenses) {
        const defense = gameState.defenses[defId];
        if (defense.currentHealth < defense.maxHealth) {
            const healthNeeded = defense.maxHealth - defense.currentHealth;
            defensesToRepair.push({ defId, healthNeeded });
            totalBiomassCost += healthNeeded * costBiomassPerHP;
            totalNaniteCost += healthNeeded * costNanitesPerHP;
        }
    }

    if (defensesToRepair.length === 0) { addLogEntry("Toutes les défenses sont opérationnelles.", "info", eventLogEl, gameState.eventLog); return; }
    if (gameState.resources.biomass < totalBiomassCost || gameState.resources.nanites < totalNaniteCost) {
        addLogEntry(`Ressources insuffisantes pour réparer les défenses. Requis: ${totalBiomassCost} Biomasse, ${totalNaniteCost} Nanites.`, "error", eventLogEl, gameState.eventLog);
        return;
    }

    gameState.resources.biomass -= totalBiomassCost;
    gameState.resources.nanites -= totalNaniteCost;
    defensesToRepair.forEach(item => {
        gameState.defenses[item.defId].currentHealth += item.healthNeeded;
        totalHealthRestored += item.healthNeeded;
    });

    addLogEntry(`Défenses réparées (+${totalHealthRestored} PV total). (-${totalBiomassCost} Biomasse, -${totalNaniteCost} Nanites).`, "success", eventLogEl, gameState.eventLog);

    if(typeof calculateBaseStats === 'function') calculateBaseStats(); 
    if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption(); 
    if(typeof uiUpdates !== 'undefined') { uiUpdates.updateResourceDisplay(); uiUpdates.updateBaseStatusDisplay(); }
    else { updateResourceDisplay(); updateBaseStatusDisplay(); } 
}

function toggleNanobotDefendBase() {
    // console.log("gameplayLogic: toggleNanobotDefendBase CALLED");
    if (!gameState || !gameState.nanobotStats || typeof ZONE_DATA === 'undefined' || typeof BASE_COORDINATES === 'undefined') {
        console.error("toggleNanobotDefendBase: Dépendances manquantes (gameState, nanobotStats, ZONE_DATA, ou BASE_COORDINATES).");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur système : Impossible de basculer le mode défense.", "error", eventLogEl, gameState?.eventLog);
        return;
    }
    // console.log("Current isDefendingBase state:", gameState.nanobotStats.isDefendingBase);

    gameState.nanobotStats.isDefendingBase = !gameState.nanobotStats.isDefendingBase;
    // console.log("New isDefendingBase state:", gameState.nanobotStats.isDefendingBase);

    const playerBaseZoneKey = Object.keys(ZONE_DATA).find(key => ZONE_DATA[key].basePlayerCoordinates);
    const playerBaseZone = playerBaseZoneKey ? ZONE_DATA[playerBaseZoneKey] : (ZONE_DATA['verdant_archipelago'] || null); 
    const playerBaseCoords = playerBaseZone?.basePlayerCoordinates || BASE_COORDINATES;

    if (gameState.nanobotStats.isDefendingBase) {
        if(toggleNanobotDefendBaseBtn) {
            toggleNanobotDefendBaseBtn.textContent = "Désactiver Défense du Noyau";
            toggleNanobotDefendBaseBtn.classList.remove('btn-secondary');
            toggleNanobotDefendBaseBtn.classList.add('btn-warning');
        }
        addLogEntry("Nexus-7 en mode défense du Noyau. Retournez à la base pour que cela soit effectif.", "info", eventLogEl, gameState.eventLog);
        if (playerBaseZone && gameState.currentZoneId === playerBaseZone.id && gameState.map.nanobotPos.x === playerBaseCoords.x && gameState.map.nanobotPos.y === playerBaseCoords.y) {
            addLogEntry("Nexus-7 est positionné pour défendre le Noyau.", "success", eventLogEl, gameState.eventLog);
        }
    } else {
        if(toggleNanobotDefendBaseBtn) {
            toggleNanobotDefendBaseBtn.textContent = "Activer Défense du Noyau";
            toggleNanobotDefendBaseBtn.classList.add('btn-secondary');
            toggleNanobotDefendBaseBtn.classList.remove('btn-warning');
        }
        addLogEntry("Nexus-7 n'est plus en mode défense active du Noyau.", "info", eventLogEl, gameState.eventLog);
    }

    // console.log("Appel de calculateBaseStats depuis toggleNanobotDefendBase...");
    if(typeof calculateBaseStats === 'function') calculateBaseStats();
    
    // console.log("Appel de updateBaseStatusDisplay depuis toggleNanobotDefendBase...");
    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateBaseStatusDisplay === 'function') {
        uiUpdates.updateBaseStatusDisplay();
    } else if(typeof updateBaseStatusDisplay === 'function') {
        updateBaseStatusDisplay(); 
    } else {
        console.warn("Aucune fonction de mise à jour de statut de base trouvée dans toggleNanobotDefendBase.");
    }
}

function updateGameTimeAndCycle() {
    if (!gameState || typeof TICK_SPEED === 'undefined' || typeof DAY_DURATION === 'undefined' || typeof NIGHT_DURATION === 'undefined') { console.error("updateGameTimeAndCycle: Dépendances manquantes."); return; }
    gameState.gameTime++; 
    gameState.currentCycleTime += TICK_SPEED; 

    const currentCycleDurationInMs = (gameState.isDay ? DAY_DURATION : NIGHT_DURATION) * TICK_SPEED; 

    if (gameState.currentCycleTime >= currentCycleDurationInMs) {
        if(typeof forceCycleChange === 'function') forceCycleChange(true); else console.error("forceCycleChange non défini");
    }

    if(gameTimeEl) gameTimeEl.textContent = formatTime(Math.floor(gameState.gameTime * (TICK_SPEED / 1000)));
    if(cycleStatusEl) {
        const timeRemainingInCycleMs = Math.max(0, currentCycleDurationInMs - gameState.currentCycleTime);
        cycleStatusEl.textContent = `${gameState.isDay ? "Jour" : "Nuit"} (${formatTime(Math.floor(timeRemainingInCycleMs / 1000))})`;
    }
}

function forceCycleChange(isNaturalChange = false) {
    // console.log(`gameplayLogic: forceCycleChange CALLED, Naturel: ${isNaturalChange}`);
    if (!gameState || typeof FORCE_CYCLE_CHANGE_COST === 'undefined' || typeof DAY_DURATION === 'undefined' || typeof NIGHT_DURATION === 'undefined' || typeof TICK_SPEED === 'undefined') { console.error("forceCycleChange: Dépendances manquantes."); return; }

    if (!isNaturalChange) {
        if ((gameState.resources.biomass || 0) < FORCE_CYCLE_CHANGE_COST.biomass || (gameState.resources.nanites || 0) < FORCE_CYCLE_CHANGE_COST.nanites) {
            addLogEntry(`Ressources insuffisantes pour forcer le cycle. Requis: ${FORCE_CYCLE_CHANGE_COST.biomass} Biomasse, ${FORCE_CYCLE_CHANGE_COST.nanites} Nanites.`, "error", eventLogEl, gameState.eventLog);
            return;
        }
        gameState.resources.biomass -= FORCE_CYCLE_CHANGE_COST.biomass;
        gameState.resources.nanites -= FORCE_CYCLE_CHANGE_COST.nanites;
        addLogEntry(`Cycle forcé. (-${FORCE_CYCLE_CHANGE_COST.biomass} Biomasse, -${FORCE_CYCLE_CHANGE_COST.nanites} Nanites).`, "warning", eventLogEl, gameState.eventLog);
        if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
        else if(typeof updateResourceDisplay === 'function') updateResourceDisplay(); 
    }

    gameState.isDay = !gameState.isDay;
    gameState.currentCycleTime = 0; 
    addLogEntry(`Changement de cycle: C'est maintenant ${gameState.isDay ? 'le JOUR' : 'la NUIT'}.`, "info", eventLogEl, gameState.eventLog);

    const newCycleDurationInTicks = gameState.isDay ? DAY_DURATION : NIGHT_DURATION; 
    if(cycleStatusEl) cycleStatusEl.textContent = `${gameState.isDay ? "Jour" : "Nuit"} (${formatTime(Math.floor(newCycleDurationInTicks * (TICK_SPEED / 1000)))})`; 

    if (!gameState.isDay) { 
        addLogEntry("L'activité hostile augmente... Préparez les défenses!", "warning", eventLogEl, gameState.eventLog);
        if(typeof startNightAssault === 'function') startNightAssault(); else console.error("ERREUR: startNightAssault n'est pas défini dans forceCycleChange");
    } else { 
        addLogEntry("L'activité hostile diminue avec l'aube.", "info", eventLogEl, gameState.eventLog);
        if(typeof endNightAssault === 'function') endNightAssault(); else console.error("ERREUR: endNightAssault n'est pas défini dans forceCycleChange");
    }

    if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption(); else console.error("ERREUR: calculateProductionAndConsumption n'est pas défini dans forceCycleChange");
    if(typeof calculateBaseStats === 'function') calculateBaseStats(); else console.error("ERREUR: calculateBaseStats n'est pas défini dans forceCycleChange");
}

function initializeBaseGrid() {
    // console.log("gameplayLogic: initializeBaseGrid CALLED");
    if (!gameState || typeof BASE_GRID_SIZE === 'undefined') { console.error("initializeBaseGrid: gameState ou BASE_GRID_SIZE non défini."); return; }
    gameState.baseGrid = [];
    for (let r = 0; r < BASE_GRID_SIZE.rows; r++) {
        gameState.baseGrid[r] = [];
        for (let c = 0; c < BASE_GRID_SIZE.cols; c++) {
            gameState.baseGrid[r][c] = null; 
        }
    }
}

function enterPlacementMode(defenseTypeId) {
    // console.log(`gameplayLogic: enterPlacementMode pour ${defenseTypeId}`); 
    if (typeof buildingsData === 'undefined' || !gameState || !gameState.placementMode) {
        console.error("enterPlacementMode: Dépendances manquantes.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur: Mode placement non initialisé.", "error", eventLogEl, gameState?.eventLog);
        return;
    }
    if (!buildingsData[defenseTypeId] || buildingsData[defenseTypeId].type !== 'defense') {
        addLogEntry("Type de défense invalide pour le placement.", "error", eventLogEl, gameState.eventLog);
        return;
    }

    const techLevel = gameState.buildings[defenseTypeId] || 0;
    if (techLevel < 1) {
        addLogEntry(`Vous devez d'abord débloquer la technologie ${buildingsData[defenseTypeId].name} (Niv. 1).`, "warning", eventLogEl, gameState.eventLog);
        return;
    }
    // console.log(`Activation du mode placement pour ${defenseTypeId}, techLevel ${techLevel}`); 
    gameState.placementMode.isActive = true;
    gameState.placementMode.selectedDefenseType = defenseTypeId;
    gameState.placementMode.selectedDefenseLevel = techLevel; 

    if(placementInfoDivEl) placementInfoDivEl.classList.remove('hidden');
    if(selectedDefenseForPlacementSpanEl) selectedDefenseForPlacementSpanEl.textContent = buildingsData[defenseTypeId].name + ` (Niv.${techLevel})`;
    addLogEntry(`Mode placement activé pour ${buildingsData[defenseTypeId].name}. Cliquez sur une case de la grille de base.`, "info", eventLogEl, gameState.eventLog);

    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateBasePreview === 'function') uiUpdates.updateBasePreview();
    else if (typeof updateBasePreview === 'function') updateBasePreview(); 
}

function cancelPlacementMode() {
    // console.log("gameplayLogic: cancelPlacementMode CALLED");
    if (!gameState || !gameState.placementMode) { console.error("cancelPlacementMode: gameState.placementMode non défini."); return;}
    gameState.placementMode.isActive = false;
    gameState.placementMode.selectedDefenseType = null;
    gameState.placementMode.selectedDefenseLevel = 1; 
    if(placementInfoDivEl) placementInfoDivEl.classList.add('hidden');
    addLogEntry("Mode placement annulé.", "info", eventLogEl, gameState.eventLog);

    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateBasePreview === 'function') uiUpdates.updateBasePreview();
    else if (typeof updateBasePreview === 'function') updateBasePreview(); 
}

function handleGridCellClick(row, col) { 
    // console.log(`gameplayLogic: handleGridCellClick (base) pour (${row},${col}). Mode placement actif: ${gameState?.placementMode?.isActive}`); 
    if (typeof BASE_GRID_SIZE === 'undefined' || typeof buildingsData === 'undefined' || typeof itemsData === 'undefined' || typeof DAMAGE_TYPES === 'undefined' || !gameState) {
        console.error("handleGridCellClick: Dépendances manquantes."); return;
    }

    const coreRow = Math.floor(BASE_GRID_SIZE.rows / 2);
    const coreCol = Math.floor(BASE_GRID_SIZE.cols / 2);

    if (gameState.placementMode.isActive) {
        // console.log(`Tentative de placement de ${gameState.placementMode.selectedDefenseType} en (${row},${col})`); 
        if (row === coreRow && col === coreCol) {
            addLogEntry("Impossible de placer une défense sur le Noyau Central.", "warning", eventLogEl, gameState.eventLog);
            return;
        }
        if (gameState.baseGrid[row] && gameState.baseGrid[row][col]) { 
            addLogEntry("Cette case est déjà occupée par une défense.", "warning", eventLogEl, gameState.eventLog);
            return;
        }

        const defenseTypeId = gameState.placementMode.selectedDefenseType;
        const defenseTechLevel = gameState.placementMode.selectedDefenseLevel; 
        const buildingDef = buildingsData[defenseTypeId];

        if (!buildingDef || !buildingDef.placementCost) {
            addLogEntry("Erreur: Coût de placement non défini pour cette défense.", "error", eventLogEl, gameState.eventLog);
            cancelPlacementMode(); return;
        }
        const placementCost = buildingDef.placementCost;
        // console.log("Coût de placement:", placementCost); 

        for (const resource in placementCost) {
            if ((gameState.resources[resource]||0) < placementCost[resource]) {
                addLogEntry(`Ressources insuffisantes pour placer ${buildingDef.name}. Requis: ${placementCost[resource]} ${resource}. Actuel: ${gameState.resources[resource]||0}`, "error", eventLogEl, gameState.eventLog);
                return;
            }
        }
        
        for (const resource in placementCost) { gameState.resources[resource] -= placementCost[resource]; }
        // console.log("Coûts déduits. Ressources restantes:", JSON.parse(JSON.stringify(gameState.resources))); 
        
        const levelDataToPlace = buildingDef.levels.find(l => l.level === defenseTechLevel);
        if (!levelDataToPlace || !levelDataToPlace.stats) {
             addLogEntry("Erreur: Données de niveau de défense manquantes pour le placement.", "error", eventLogEl, gameState.eventLog);
             for (const resource in placementCost) { gameState.resources[resource] += placementCost[resource]; } 
             return;
        }
        // console.log("Données du niveau à placer:", levelDataToPlace); 

        const instanceId = `${defenseTypeId}_${row}_${col}_${Date.now()}`;
        gameState.baseGrid[row][col] = { id: defenseTypeId, level: defenseTechLevel, instanceId: instanceId }; 
        gameState.defenses[instanceId] = {
            id: defenseTypeId,
            name: buildingDef.name,
            level: defenseTechLevel, 
            currentHealth: levelDataToPlace.stats.health,
            maxHealth: levelDataToPlace.stats.health,
            attack: levelDataToPlace.stats.attack || 0,
            damageType: levelDataToPlace.stats.damageType || DAMAGE_TYPES.KINETIC,
            range: levelDataToPlace.stats.range || 50, 
            gridPos: { r: row, c: col },
            resistances: levelDataToPlace.stats.resistances || {}
        };
        // console.log(`Défense ${instanceId} ajoutée à gameState.defenses:`, JSON.parse(JSON.stringify(gameState.defenses[instanceId]))); 
        // console.log(`Grille de base mise à jour pour (${row},${col}):`, JSON.parse(JSON.stringify(gameState.baseGrid[row][col]))); 

        addLogEntry(`${buildingDef.name} (Niv.${defenseTechLevel}) placé(e) en (${row},${col}).`, "success", eventLogEl, gameState.eventLog);
        if(typeof calculateBaseStats === 'function') calculateBaseStats();
        if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
        if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays();
        else if (typeof updateDisplays === 'function') updateDisplays(); 
    } else { 
        const defenseOnCell = gameState.baseGrid[row] && gameState.baseGrid[row][col];
        if (defenseOnCell && defenseOnCell.instanceId && gameState.defenses[defenseOnCell.instanceId]) {
            if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.managePlacedDefense === 'function') uiUpdates.managePlacedDefense(defenseOnCell.instanceId, row, col);
            else if(typeof managePlacedDefense === 'function') managePlacedDefense(defenseOnCell.instanceId, row, col); 
            else console.error("Fonction managePlacedDefense non trouvée");
        } else if (row === coreRow && col === coreCol) {
            addLogEntry("Noyau Central. Intégrité: " + Math.floor(gameState.baseStats.currentHealth) + "/" + gameState.baseStats.maxHealth, "info", eventLogEl, gameState.eventLog);
        } else {
            addLogEntry(`Case vide (${row},${col}). Activez le mode placement pour construire une défense.`, "info", eventLogEl, gameState.eventLog);
        }
    }
}

function executeUpgradePlacedDefense(instanceId) {
    // console.log(`gameplayLogic: executeUpgradePlacedDefense pour ${instanceId}`);
    if (typeof buildingsData === 'undefined' || typeof itemsData === 'undefined' || !gameState || !gameState.defenses) {console.error("executeUpgradePlacedDefense: Dépendances manquantes."); return;}

    const defenseInstance = gameState.defenses[instanceId];
    if (!defenseInstance) { addLogEntry("Défense introuvable pour amélioration.", "error", eventLogEl, gameState.eventLog); return; }

    const defenseTypeData = buildingsData[defenseInstance.id];
    const currentInstanceLevel = defenseInstance.level;
    const currentTechLevel = gameState.buildings[defenseInstance.id] || 0; 

    if (currentInstanceLevel >= currentTechLevel) {
        addLogEntry(`${defenseInstance.name} ne peut être amélioré au-delà du niveau technologique actuel (${currentTechLevel}). Améliorez d'abord la technologie.`, "warning", eventLogEl, gameState.eventLog);
        return;
    }
    if (currentInstanceLevel >= defenseTypeData.levels.length) {
        addLogEntry(`${defenseInstance.name} est déjà à son niveau maximum d'instance.`, "info", eventLogEl, gameState.eventLog);
        return;
    }

    const nextLevelData = defenseTypeData.levels.find(l => l.level === currentInstanceLevel + 1);
    if (!nextLevelData) { addLogEntry("Données pour le niveau suivant de cette défense introuvables.", "error", eventLogEl, gameState.eventLog); return; }

    const upgradeCost = nextLevelData.costToUpgrade; 
                                                    
    if (!upgradeCost) { addLogEntry("Coût d'amélioration pour cette instance non défini.", "error", eventLogEl, gameState.eventLog); return;}

    for(const resourceId in upgradeCost) {
        const requiredAmount = upgradeCost[resourceId];
        if (itemsData[resourceId]) { 
            const countInInventory = gameState.inventory.filter(itemId => itemId === resourceId).length;
            if (countInInventory < requiredAmount) { addLogEntry(`Manque de ${itemsData[resourceId].name} (x${requiredAmount}) pour améliorer.`, "error", eventLogEl, gameState.eventLog); return; }
        } else { 
            if ((gameState.resources[resourceId]||0) < requiredAmount) { addLogEntry(`Ressources (${resourceId}) insuffisantes pour améliorer.`, "error", eventLogEl, gameState.eventLog); return; }
        }
    }
    
    for(const resourceId in upgradeCost) {
        const paidAmount = upgradeCost[resourceId];
        if (itemsData[resourceId]) { for (let i = 0; i < paidAmount; i++) { if(typeof removeFromInventory === 'function') removeFromInventory(resourceId); } }
        else { gameState.resources[resourceId] -= paidAmount; }
    }
    
    defenseInstance.level = nextLevelData.level;
    const healthPercentageBeforeUpgrade = defenseInstance.maxHealth > 0 ? defenseInstance.currentHealth / defenseInstance.maxHealth : 1;
    defenseInstance.maxHealth = nextLevelData.stats.health;
    defenseInstance.currentHealth = Math.floor(defenseInstance.maxHealth * healthPercentageBeforeUpgrade); 
    defenseInstance.attack = nextLevelData.stats.attack || 0;
    if(nextLevelData.stats.damageType) defenseInstance.damageType = nextLevelData.stats.damageType;
    if(nextLevelData.stats.range) defenseInstance.range = nextLevelData.stats.range;
    if(nextLevelData.stats.resistances) defenseInstance.resistances = {...nextLevelData.stats.resistances};
    
    const oldEnergyConsumption = defenseTypeData.levels[currentInstanceLevel -1].energyConsumption || 0;
    const newEnergyConsumption = nextLevelData.energyConsumption || 0;
    if (oldEnergyConsumption !== newEnergyConsumption) {
        if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
    }

    addLogEntry(`${defenseInstance.name} amélioré(e) au Niveau ${defenseInstance.level}!`, "success", eventLogEl, gameState.eventLog);
    if(typeof calculateBaseStats === 'function') calculateBaseStats();
    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays();
    else if (typeof updateDisplays === 'function') updateDisplays(); 
}

function sellPlacedDefense(instanceId, row, col) {
    // console.log(`gameplayLogic: sellPlacedDefense pour ${instanceId}`);
    if (typeof buildingsData === 'undefined' || !gameState || !gameState.defenses || typeof SELL_REFUND_FACTOR === 'undefined') {console.error("sellPlacedDefense: Dépendances manquantes."); return;}

    const defenseInstance = gameState.defenses[instanceId];
    if (!defenseInstance) { addLogEntry("Défense introuvable pour la vente.", "error", eventLogEl, gameState.eventLog); return; }

    const defenseTypeData = buildingsData[defenseInstance.id];
    let totalInvestedBiomass = 0;
    let totalInvestedNanites = 0;
    
    if (defenseTypeData.placementCost) {
        totalInvestedBiomass += defenseTypeData.placementCost.biomass || 0;
        totalInvestedNanites += defenseTypeData.placementCost.nanites || 0;
    }
    
    for(let i = 0; i < defenseInstance.level -1 ; i++){ 
        const levelDataForCost = defenseTypeData.levels[i]; 
        const levelUpgradeCost = levelDataForCost?.costToUpgrade || (i === 0 ? levelDataForCost?.costToUnlockOrUpgrade : null) ;
        if(levelUpgradeCost){
            totalInvestedBiomass += levelUpgradeCost.biomass || 0;
            totalInvestedNanites += levelUpgradeCost.nanites || 0;
        }
    }

    const refundBiomass = Math.floor(totalInvestedBiomass * SELL_REFUND_FACTOR);
    const refundNanites = Math.floor(totalInvestedNanites * SELL_REFUND_FACTOR);

    gameState.resources.biomass += refundBiomass;
    gameState.resources.nanites += refundNanites;

    const oldEnergyConsumption = defenseTypeData.levels[defenseInstance.level -1].energyConsumption || 0;
    delete gameState.defenses[instanceId]; 
    if (gameState.baseGrid[row] && gameState.baseGrid[row][col] && gameState.baseGrid[row][col].instanceId === instanceId) {
        gameState.baseGrid[row][col] = null; 
    }

    if (oldEnergyConsumption > 0) {
        if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
    }

    addLogEntry(`${defenseInstance.name} vendu(e). +${refundBiomass} Biomasse, +${refundNanites} Nanites.`, "info", eventLogEl, gameState.eventLog);
    if(typeof calculateBaseStats === 'function') calculateBaseStats();
    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays();
    else if (typeof updateDisplays === 'function') updateDisplays(); 
}

function startNightAssault() {
    // console.log("gameplayLogic: startNightAssault CALLED");
    if (!gameState || !gameState.baseStats || typeof nightAssaultEnemies === 'undefined' || typeof bossDefinitions === 'undefined' || typeof nightEvents === 'undefined' || typeof SPECIAL_EVENT_CHANCE === 'undefined' || typeof BOSS_WAVE_INTERVAL === 'undefined' || typeof basePreviewContainerEl === 'undefined' || typeof TICK_SPEED === 'undefined') {
        console.error("startNightAssault: Dépendances manquantes.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur de configuration de l'assaut.", "error", eventLogEl, gameState ? gameState.eventLog : null);
        return;
    }
    if (gameState.baseStats.currentHealth <= 0) {
        if(typeof addLogEntry === 'function') addLogEntry("Le Noyau est détruit. Impossible de subir un assaut.", "error", eventLogEl, gameState.eventLog);
        if(gameState.nightAssault) gameState.nightAssault.isActive = false;
        return;
    }

    gameState.nightAssault.isActive = true;
    gameState.nightAssault.wave++;
    gameState.nightAssault.enemies = [];
    gameState.nightAssault.lastAttackTime = gameState.gameTime; 
    gameState.nightAssault.log = []; 

    if(nightAssaultLogEl) {
        const h3 = nightAssaultLogEl.querySelector('h3');
        nightAssaultLogEl.innerHTML = h3 ? h3.outerHTML : '<h3 class="font-orbitron text-lg mb-2 text-red-300 border-b border-gray-600 pb-1">Journal d\'Assaut Nocturne</h3>';
        nightAssaultLogEl.insertAdjacentHTML('beforeend', '<p class="text-gray-500 italic">En attente d\'événements...</p>'); 
    }
    addLogEntry(`Début de l'assaut nocturne - Vague ${gameState.nightAssault.wave}`, "base-info-event", nightAssaultLogEl, gameState.nightAssault.log);

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
                const bossWidth = bossData.visualSize ? bossData.visualSize.width : 12;
                const bossHeight = bossData.visualSize ? bossData.visualSize.height : 12;
                const offset = 15 + Math.max(bossWidth, bossHeight) / 2; 

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
            } else { isBossWave = false; console.warn("Boss data non trouvée pour le type:", bossType); }
        } else { isBossWave = false; }
    }

    if (!isBossWave) {
        let enemyCountMultiplier = 1 + (wave * 0.15);
        let enemyHealthMultiplier = 1 + (wave * 0.1);
        let enemyAttackMultiplier = 1 + (wave * 0.05);

        let enemyCounts = { 
            'swarm_drone': Math.floor((wave * 2 + Math.floor(Math.random() * wave * 1.5)) * enemyCountMultiplier),
            'assault_bot': Math.floor((Math.floor(wave / 2.5) + Math.floor(Math.random() * (wave/2 +1))) * enemyCountMultiplier),
            'heavy_crawler': wave > 1 ? Math.floor((Math.floor(wave / 3.5) + Math.floor(Math.random() * (wave/3+1)))* enemyCountMultiplier) : 0
         };
        for (const enemyTypeId in enemyCounts) {
            const count = enemyCounts[enemyTypeId];
            const typeInfoBase = nightAssaultEnemies.find(e => e.id === enemyTypeId);
            if (!typeInfoBase || count <= 0) continue;

            for (let i = 0; i < count; i++) {
                const typeInfo = JSON.parse(JSON.stringify(typeInfoBase)); 
                typeInfo.baseHealth = Math.floor(typeInfo.baseHealth * enemyHealthMultiplier);
                typeInfo.baseAttack = Math.floor(typeInfo.baseAttack * enemyAttackMultiplier);

                let x, y; const edge = Math.floor(Math.random() * 4); const offset = 10;
                if (edge === 0) { x = Math.random() * containerWidth; y = -offset; } 
                else if (edge === 1) { x = containerWidth + offset; y = Math.random() * containerHeight; } 
                else if (edge === 2) { x = Math.random() * containerWidth; y = containerHeight + offset; } 
                else { x = -offset; y = Math.random() * containerHeight; } 

                gameState.nightAssault.enemies.push({
                    id: `${enemyTypeId}_${gameState.gameTime}_${i}`,
                    typeInfo: typeInfo, 
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
            gameState.nightAssault.currentEvent = { id: randomEvent.id, startTime: gameState.gameTime, durationTicks: randomEvent.duration / TICK_SPEED }; 
            addLogEntry(`ÉVÉNEMENT SPÉCIAL: ${randomEvent.name} - ${randomEvent.description}`, "warning", nightAssaultLogEl, gameState.nightAssault.log);
            if (typeof randomEvent.effect === 'function') { randomEvent.effect(gameState.nightAssault, gameState.baseGrid, gameState.defenses); }
        }
    }

    if (gameState.nightAssault.enemies.length === 0 && !isBossWave) enemySummary = "Vague de reconnaissance très faible";
    addLogEntry(`ALERTE! Vague ${gameState.nightAssault.wave}: ${enemySummary}.`, "error", eventLogEl, gameState.eventLog);
    if(!isBossWave && enemySummary !== "Vague de reconnaissance très faible") addLogEntry(`Vague ${gameState.nightAssault.wave} en approche: ${enemySummary}.`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log);

    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateBaseStatusDisplay === 'function') uiUpdates.updateBaseStatusDisplay();
    else if(typeof updateBaseStatusDisplay === 'function') updateBaseStatusDisplay(); 
}

function endNightAssault() {
    // console.log("gameplayLogic: endNightAssault CALLED");
    if (!gameState || !gameState.nightAssault) { console.error("endNightAssault: gameState ou nightAssault non défini."); return; }

    gameState.nightAssault.isActive = false;
    if (gameState.nightAssault.currentEvent) {
        const eventData = nightEvents.find(e => e.id === gameState.nightAssault.currentEvent.id);
        if (eventData && typeof eventData.revertEffect === 'function') {
            eventData.revertEffect(gameState.nightAssault); 
        }
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
    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateBaseStatusDisplay === 'function') uiUpdates.updateBaseStatusDisplay();
    else if(typeof updateBaseStatusDisplay === 'function') updateBaseStatusDisplay(); 

    if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption(); 
}

function processNightAssaultTick() {
    // console.log("gameplayLogic: processNightAssaultTick CALLED, Wave:", gameState.nightAssault.wave, "Enemies:", gameState.nightAssault.enemies.length);
    if (!gameState || !gameState.nightAssault || !gameState.baseStats || !gameState.defenses || typeof buildingsData === 'undefined' || typeof NIGHT_ASSAULT_TICK_INTERVAL === 'undefined' || typeof TICK_SPEED === 'undefined' || typeof basePreviewContainerEl === 'undefined' || typeof BASE_GRID_SIZE === 'undefined' || typeof ZONE_DATA === 'undefined' || typeof BASE_COORDINATES === 'undefined') {
        console.error("processNightAssaultTick: Dépendances manquantes.");
        return;
    }
    if (!gameState.nightAssault.isActive || gameState.isDay || gameState.baseStats.currentHealth <= 0) return;

    if (gameState.nightAssault.currentEvent && gameState.gameTime >= gameState.nightAssault.currentEvent.startTime + gameState.nightAssault.currentEvent.durationTicks) {
        const eventData = nightEvents.find(e => e.id === gameState.nightAssault.currentEvent.id);
        if (eventData) {
            addLogEntry(`L'événement "${eventData.name}" prend fin.`, "info", nightAssaultLogEl, gameState.nightAssault.log);
            if (typeof eventData.revertEffect === 'function') {
                eventData.revertEffect(gameState.nightAssault);
            }
        }
        gameState.nightAssault.currentEvent = null;
    }

    const previewContainer = basePreviewContainerEl;
    if (!previewContainer) { console.error("processNightAssaultTick: basePreviewContainerEl est null !"); return; }
    
    const firstCell = previewContainer.querySelector('.base-preview-cell');
    const cellWidth = firstCell ? firstCell.offsetWidth : (previewContainer.offsetWidth / BASE_GRID_SIZE.cols);
    const cellHeight = firstCell ? firstCell.offsetHeight : (previewContainer.offsetHeight / BASE_GRID_SIZE.rows);

    const coreVisualCell = document.getElementById('base-core-visual-cell');
    let coreCenterX = previewContainer.offsetWidth / 2;
    let coreCenterY = previewContainer.offsetHeight / 2;
    if (coreVisualCell && coreVisualCell.offsetParent !== null) {
        coreCenterX = coreVisualCell.offsetLeft + coreVisualCell.offsetWidth / 2;
        coreCenterY = coreVisualCell.offsetTop + coreVisualCell.offsetHeight / 2;
    } else {
        const coreGridRow = Math.floor(BASE_GRID_SIZE.rows / 2);
        const coreGridCol = Math.floor(BASE_GRID_SIZE.cols / 2);
        coreCenterX = coreGridCol * cellWidth + cellWidth / 2;
        coreCenterY = coreGridRow * cellHeight + cellHeight / 2;
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
        let bestTarget = null;
        let minDistanceSq = defenseRange * defenseRange; 

        gameState.nightAssault.enemies.forEach(enemy => {
            if (enemy.currentHealth > 0) {
                const dx = enemy.x - defensePixelX;
                const dy = enemy.y - defensePixelY;
                const distSq = dx*dx + dy*dy;
                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    bestTarget = enemy;
                }
            }
        });

        if (bestTarget) {
            let damageDealt = calculateModifiedDamage(defense.attack, defenseDamageType, bestTarget.typeInfo.resistances);
            bestTarget.currentHealth -= damageDealt;
            if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.drawLaserShot === 'function') uiUpdates.drawLaserShot(defensePixelX, defensePixelY, bestTarget.x, bestTarget.y);

            if (!enemiesTargetedByDefenses.has(bestTarget.id)) {
                 addLogEntry(`${defense.name} tire sur ${bestTarget.typeInfo.name}, infligeant ${damageDealt} dégâts ${defenseDamageType}.`, "base-defense-event", nightAssaultLogEl, gameState.nightAssault.log);
                 enemiesTargetedByDefenses.add(bestTarget.id);
            }
            if (bestTarget.currentHealth <= 0) {
                addLogEntry(`${bestTarget.typeInfo.name} détruit par ${defense.name} !`, "success", nightAssaultLogEl, gameState.nightAssault.log);
                gameState.resources.biomass += bestTarget.typeInfo.reward.biomass || 0;
                gameState.resources.nanites += bestTarget.typeInfo.reward.nanites || 0;
            }
        }
    }
    gameState.nightAssault.enemies = gameState.nightAssault.enemies.filter(e => e.currentHealth > 0);

    if (gameState.gameTime < gameState.nightAssault.lastAttackTime + NIGHT_ASSAULT_TICK_INTERVAL) { 
        gameState.nightAssault.enemies.forEach(enemy => {
            if (enemy.currentHealth <= 0 || !enemy.typeInfo || enemy.isAttacking) return; 
            let targetX = coreCenterX; let targetY = coreCenterY; 
            const moveSpeed = enemy.typeInfo.speed || (enemy.isBoss ? 1.5 : 3);
            const dxMove = targetX - enemy.x; const dyMove = targetY - enemy.y;
            const distMove = Math.sqrt(dxMove*dxMove + dyMove*dyMove);
            if (distMove > moveSpeed) {
                enemy.x += (dxMove / distMove) * moveSpeed;
                enemy.y += (dyMove / distMove) * moveSpeed;
            } else { 
                enemy.x = targetX; enemy.y = targetY;
            }
        });
        if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateBasePreview === 'function' && typeof overviewContentElTab !== 'undefined' && overviewContentElTab && !overviewContentElTab.classList.contains('hidden')) uiUpdates.updateBasePreview();
        else if (typeof updateBasePreview === 'function' && typeof overviewContentElTab !== 'undefined' && overviewContentElTab && !overviewContentElTab.classList.contains('hidden')) updateBasePreview(); 
        return; 
    }
    gameState.nightAssault.lastAttackTime = gameState.gameTime;

    if (gameState.nightAssault.enemies.length === 0 && gameState.nightAssault.isActive) {
        if(!gameState.isDay) addLogEntry("Secteur calme...", "base-info-event", nightAssaultLogEl, gameState.nightAssault.log);
    }

    gameState.nightAssault.enemies.forEach(enemy => {
        if (enemy.currentHealth <= 0 || !enemy.typeInfo) return;
        enemy.isAttacking = false; 

        let targetX = coreCenterX;
        let targetY = coreCenterY;
        let closestDefenseInstanceId = null;
        let minDistanceToTargetSq = Math.pow(targetX - enemy.x, 2) + Math.pow(targetY - enemy.y, 2);
        let canTargetWalls = !enemy.isFlying; 

        for (const defenseInstanceId_loop in gameState.defenses) {
            const defense = gameState.defenses[defenseInstanceId_loop];
            const defenseType = buildingsData[defense.id];
            if (defense.currentHealth > 0 && defense.gridPos) {
                if (!canTargetWalls && defenseType && defenseType.name.toLowerCase().includes("mur")) { continue; } 

                const defPixelX = defense.gridPos.c * cellWidth + (cellWidth / 2);
                const defPixelY = defense.gridPos.r * cellHeight + (cellHeight / 2);
                const dx = defPixelX - enemy.x; const dy = defPixelY - enemy.y;
                const distSq = dx*dx + dy*dy;
                if (distSq < minDistanceToTargetSq) {
                    minDistanceToTargetSq = distSq;
                    closestDefenseInstanceId = defenseInstanceId_loop;
                    targetX = defPixelX;
                    targetY = defPixelY;
                }
            }
        }

        const enemyAttackRange = enemy.typeInfo.attackRange || 20; 
        const enemyAttackRangeSq = enemyAttackRange * enemyAttackRange;

        if (minDistanceToTargetSq < enemyAttackRangeSq) { 
            enemy.isAttacking = true;
            if (closestDefenseInstanceId && gameState.defenses[closestDefenseInstanceId]) { 
                const defenseInstance = gameState.defenses[closestDefenseInstanceId];
                const damageToDefense = calculateModifiedDamage(enemy.typeInfo.baseAttack, enemy.typeInfo.damageType, defenseInstance.resistances || {});
                defenseInstance.currentHealth -= damageToDefense;
                addLogEntry(`${enemy.typeInfo.name} attaque ${defenseInstance.name}, infligeant ${damageToDefense} dégâts. (PV Déf: ${Math.floor(defenseInstance.currentHealth)})`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log);

                if (defenseInstance.currentHealth <= 0) {
                    addLogEntry(`${defenseInstance.name} détruit par ${enemy.typeInfo.name}!`, "error", nightAssaultLogEl, gameState.nightAssault.log);
                    const {r, c} = defenseInstance.gridPos;
                    if(gameState.baseGrid[r] && gameState.baseGrid[r][c] && gameState.baseGrid[r][c].instanceId === closestDefenseInstanceId) {
                        gameState.baseGrid[r][c] = null; 
                    }
                    delete gameState.defenses[closestDefenseInstanceId]; 
                    if(typeof calculateBaseStats === 'function') calculateBaseStats();
                    if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
                }
            } else { 
                 const damageToCoreRaw = enemy.typeInfo.baseAttack;
                 const damageToCore = calculateModifiedDamage(damageToCoreRaw, enemy.typeInfo.damageType, {}); 
                 let actualDamageToCore = damageToCore;

                const playerBaseZoneKey = Object.keys(ZONE_DATA).find(key => ZONE_DATA[key].basePlayerCoordinates);
                const playerBaseZone = playerBaseZoneKey ? ZONE_DATA[playerBaseZoneKey] : (ZONE_DATA['verdant_archipelago'] || null);
                const playerBaseCoords = playerBaseZone?.basePlayerCoordinates || BASE_COORDINATES;

                if (gameState.nanobotStats.isDefendingBase &&
                    playerBaseZone && gameState.currentZoneId === playerBaseZone.id &&
                    gameState.map.nanobotPos.x === playerBaseCoords.x &&
                    gameState.map.nanobotPos.y === playerBaseCoords.y &&
                    gameState.nanobotStats.currentHealth > 0) {

                    const damageToNanobot = Math.min(Math.floor(actualDamageToCore * 0.5), gameState.nanobotStats.currentHealth); 
                    actualDamageToCore -= damageToNanobot;
                    if (damageToNanobot > 0) {
                        gameState.nanobotStats.currentHealth -= damageToNanobot;
                        addLogEntry(`Nexus-7 intercepte ${damageToNanobot} dégâts pour le Noyau!`, "base-defense-event", nightAssaultLogEl, gameState.nightAssault.log);
                        if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateNanobotDisplay === 'function') uiUpdates.updateNanobotDisplay();
                        else if (typeof updateNanobotDisplay === 'function') updateNanobotDisplay(); 
                        if (gameState.nanobotStats.currentHealth <= 0) {
                            addLogEntry("Nexus-7 est hors de combat!", "error", nightAssaultLogEl, gameState.nightAssault.log);
                           if(typeof calculateBaseStats === 'function') calculateBaseStats(); 
                        }
                    }
                }
                if (actualDamageToCore > 0) {
                    gameState.baseStats.currentHealth -= actualDamageToCore;
                    addLogEntry(`${enemy.typeInfo.name} attaque le Noyau, infligeant ${actualDamageToCore} dégâts! (PV Noyau: ${Math.floor(gameState.baseStats.currentHealth)})`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log);
                }
            }
        }

        if (!enemy.isAttacking) {
            const moveSpeed = enemy.typeInfo.speed || (enemy.isBoss ? 1.5 : 3); 
            const dxMove = targetX - enemy.x;
            const dyMove = targetY - enemy.y;
            const distMove = Math.sqrt(dxMove*dxMove + dyMove*dyMove);
            if (distMove > moveSpeed) {
                enemy.x += (dxMove / distMove) * moveSpeed;
                enemy.y += (dyMove / distMove) * moveSpeed;
            } else { 
                enemy.x = targetX;
                enemy.y = targetY;
            }
        }

        if (enemy.isBoss && enemy.typeInfo.abilities) {
            enemy.typeInfo.abilities.forEach(ability => {
                if (Math.random() < (ability.chance || 0.1)) {
                    if (ability.type === 'aoe_stomp' && ability.damage && ability.radius) {
                        addLogEntry(`${enemy.typeInfo.name} déchaîne un ${ability.name || 'Piétinement Destructeur'} !`, "error", nightAssaultLogEl, gameState.nightAssault.log);
                        let affectedDefensesCount = 0;
                        for (const defId in gameState.defenses) {
                            const d = gameState.defenses[defId];
                            if(d.gridPos && d.currentHealth > 0){
                                const dx_aoe = (d.gridPos.c * cellWidth + cellWidth/2) - enemy.x;
                                const dy_aoe = (d.gridPos.r * cellHeight + cellHeight/2) - enemy.y;
                                if (dx_aoe*dx_aoe + dy_aoe*dy_aoe < ability.radius * ability.radius) {
                                    d.currentHealth -= ability.damage;
                                    affectedDefensesCount++;
                                    if (d.currentHealth <=0) {
                                        addLogEntry(`${d.name} détruit par le Piétinement !`, "error", nightAssaultLogEl, gameState.nightAssault.log);
                                        const {r, c} = d.gridPos;
                                        if(gameState.baseGrid[r] && gameState.baseGrid[r][c] && gameState.baseGrid[r][c].instanceId === defId) { gameState.baseGrid[r][c] = null; }
                                        delete gameState.defenses[defId];
                                    }
                                }
                            }
                        }
                         if (affectedDefensesCount > 0) {
                            addLogEntry(`Le piétinement touche ${affectedDefensesCount} défenses pour ${ability.damage} dégâts !`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log);
                            if(typeof calculateBaseStats === 'function') calculateBaseStats();
                            if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
                         }
                    } else if (ability.type === 'regen' && ability.amount) {
                        enemy.currentHealth = Math.min(enemy.maxHealth, enemy.currentHealth + ability.amount);
                        addLogEntry(`${enemy.typeInfo.name} se régénère de ${ability.amount} PV ! (PV: ${Math.floor(enemy.currentHealth)})`, "base-info-event", nightAssaultLogEl, gameState.nightAssault.log);
                    }
                }
            });
        }
    });

    if (gameState.baseStats.currentHealth <= 0) {
        gameState.baseStats.currentHealth = 0;
        addLogEntry("ALERTE CRITIQUE! L'INTÉGRITÉ DU NOYAU EST COMPROMISE!", "error", nightAssaultLogEl, gameState.nightAssault.log);
        let biomassLoss = Math.floor(gameState.resources.biomass * 0.25);
        let naniteLoss = Math.floor(gameState.resources.nanites * 0.25);
        gameState.resources.biomass -= biomassLoss;
        gameState.resources.nanites -= naniteLoss;
        addLogEntry(`Perte de ressources: -${biomassLoss} Biomasse, -${naniteLoss} Nanites.`, "error", nightAssaultLogEl, gameState.nightAssault.log);
        addLogEntry("Le Noyau est détruit. L'assaut prend fin.", "error", eventLogEl, gameState.eventLog);
        if(typeof endNightAssault === 'function') endNightAssault(); else console.error("endNightAssault non défini.");
    }

    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateBaseStatusDisplay === 'function') uiUpdates.updateBaseStatusDisplay();
    else if (typeof updateBaseStatusDisplay === 'function') updateBaseStatusDisplay(); 

    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateBasePreview === 'function' && typeof overviewContentElTab !== 'undefined' && overviewContentElTab && !overviewContentElTab.classList.contains('hidden')) uiUpdates.updateBasePreview();
    else if (typeof updateBasePreview === 'function' && typeof overviewContentElTab !== 'undefined' && overviewContentElTab && !overviewContentElTab.classList.contains('hidden')) updateBasePreview(); 
}

console.log("gameplayLogic.js - Fin du fichier, fonctions de logique générale définies.");