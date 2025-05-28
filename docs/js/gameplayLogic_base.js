// js/gameplayLogic_base.js
console.log("gameplayLogic_base.js - Fichier chargé et en cours d'analyse...");

function calculateBaseStats() {
    if (!window.gameState || !window.gameState.baseStats ||
        typeof window.BASE_INITIAL_HEALTH === 'undefined' || 
        typeof window.buildingsData === 'undefined' ||
        typeof window.WORLD_ZONES === 'undefined' || 
        typeof window.BASE_COORDINATES === 'undefined') {
        return;
    }

    let initialHealth = (window.BASE_STATS_CONFIG?.initial?.maxHealth) || window.BASE_INITIAL_HEALTH || 500;
    let maxHealth = initialHealth;
    let defensePower = (window.BASE_STATS_CONFIG?.initial?.defensePower) || 0;

    if (window.gameState.buildings && window.buildingsData['reinforcedWall']) {
        const wallTechLevel = window.gameState.buildings['reinforcedWall'] || 0;
        const reinforcedWallDef = window.buildingsData['reinforcedWall'];
        if (wallTechLevel > 0 && reinforcedWallDef.levels && reinforcedWallDef.levels[wallTechLevel - 1]?.baseHealthBonus) {
            let placedWallCount = 0;
            if (window.gameState.defenses) {
                for (const defId in window.gameState.defenses) {
                    if (window.gameState.defenses[defId] && window.gameState.defenses[defId].id === 'reinforcedWall' && window.gameState.defenses[defId].currentHealth > 0) {
                        placedWallCount++;
                    }
                }
            }
            maxHealth += (reinforcedWallDef.levels[wallTechLevel - 1].baseHealthBonus * placedWallCount);
        }
    }

    let effectiveEnergyForDefenses = (window.gameState.capacity.energy || 0) - ((window.gameState.resources.totalEnergyConsumed || 0) - (window.gameState.resources.energyConsumedByDefenses || 0));
    let energyNeededByDefenses = window.gameState.resources.energyConsumedByDefenses || 0;
    let defenseEfficiencyFactor = 1;

    if (energyNeededByDefenses > 0 && effectiveEnergyForDefenses < energyNeededByDefenses) {
        defenseEfficiencyFactor = effectiveEnergyForDefenses > 0 ? Math.max(0, effectiveEnergyForDefenses) / energyNeededByDefenses : 0;
    }
    window.gameState.baseStats.defenseEfficiencyFactor = defenseEfficiencyFactor; 

    if (window.gameState.defenses) {
        for(const instanceId in window.gameState.defenses){
            const defenseInstance = window.gameState.defenses[instanceId];
            if(defenseInstance && defenseInstance.currentHealth > 0 && typeof defenseInstance.attack === 'number') {
                 defensePower += Math.floor((defenseInstance.attack || 0) * defenseEfficiencyFactor);
            }
        }
    }
    
    // Le Nanobot contribue à la défense s'il est en mode défense ET sur la case de la base
    // (sa position sur la grille de base n'est pas nécessaire pour ce calcul, juste son statut global)
    // if (window.gameState.nanobotStats.isDefendingBase) {
    //     defensePower += window.gameState.nanobotStats.attack || 0;
    // }
    // La logique d'attaque du Nanobot sera séparée (processNanobotBaseDefenseAction)

    window.gameState.baseStats.maxHealth = maxHealth;
    window.gameState.baseStats.defensePower = defensePower;
    window.gameState.baseStats.currentHealth = Math.min(window.gameState.baseStats.currentHealth, window.gameState.baseStats.maxHealth);
    if (window.gameState.baseStats.currentHealth <= 0 && window.gameState.baseStats.maxHealth > 0) { window.gameState.baseStats.currentHealth = 0; }
}
window.calculateBaseStats = calculateBaseStats;

function build(buildingId) {
    if (typeof window.buildingsData === 'undefined' || typeof window.itemsData === 'undefined' || typeof window.gameState === 'undefined') {
        console.error("build: Dépendances non définies.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur de configuration des bâtiments.", "error", window.eventLogEl, window.gameState?.eventLog);
        return;
    }
    const building = window.buildingsData[buildingId];
    if (!building || !building.levels) {
        addLogEntry(`Données de bâtiment invalides pour ID: ${buildingId}`, "error", window.eventLogEl, window.gameState.eventLog); return;
    }
    const currentLevel = window.gameState.buildings[buildingId] || 0;
    if (currentLevel >= building.levels.length && building.type !== 'defense') {
        addLogEntry(`${building.name} est au niveau maximum de technologie.`, "info", window.eventLogEl, window.gameState.eventLog); return;
    }
    if (building.type === 'defense' && currentLevel >= building.levels.length) {
         addLogEntry(`La technologie ${building.name} est déjà au niveau maximum. Vous pouvez placer ou améliorer des instances existantes.`, "info", window.eventLogEl, window.gameState.eventLog); return;
    }

    const nextLevelData = building.levels[currentLevel];
    const costObject = currentLevel === 0 ? nextLevelData.costToUnlockOrUpgrade : nextLevelData.costToUpgrade;

    if (!costObject) {
        addLogEntry(`Données de coût manquantes pour ${building.name} Niv. ${currentLevel + 1}.`, "error", window.eventLogEl, window.gameState.eventLog); return;
    }
    
    if (currentLevel === 0 && costObject.researchId) {
        if (!window.gameState.research || !window.gameState.research[costObject.researchId]) {
            const researchName = (window.researchData && window.researchData[costObject.researchId]?.name) || costObject.researchId;
            addLogEntry(`Recherche "${researchName}" requise pour débloquer ${building.name}.`, "warning", window.eventLogEl, window.gameState.eventLog);
            return;
        }
        window.gameState.buildings[buildingId] = currentLevel + 1;
        addLogEntry(`Technologie ${building.name} débloquée au Niveau ${currentLevel + 1} via recherche.`, "success", window.eventLogEl, window.gameState.eventLog);
        
        if (typeof calculateBaseStats === 'function') calculateBaseStats();
        if (typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
        if (typeof calculateResourceCapacities === 'function') calculateResourceCapacities();
        if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();
        if (typeof window.questController !== 'undefined' && typeof window.questController.checkQuestProgress === 'function') {
            window.questController.checkQuestProgress({ type: "build_level", buildingId: buildingId, level: window.gameState.buildings[buildingId] });
        }
        return; 
    }

    for (const resource in costObject) {
        if (window.itemsData[resource]) {
            if ((window.gameState.inventory.filter(id => id === resource).length || 0) < costObject[resource]) {
                addLogEntry(`Composants (${window.itemsData[resource].name}) insuffisants pour ${building.name}. Requis: ${costObject[resource]}.`, "error", window.eventLogEl, window.gameState.eventLog); return;
            }
        } else {
            if ((window.gameState.resources[resource]||0) < costObject[resource]) {
                addLogEntry(`Ressources (${resource}) insuffisantes pour ${building.name}. Requis: ${costObject[resource]}.`, "error", window.eventLogEl, window.gameState.eventLog); return;
            }
        }
    }
    const title = building.type === 'defense' ? `Débloquer/Améliorer Tech ${building.name}?` : `Construire/Améliorer ${building.name}?`;
    let costString = Object.entries(costObject).map(([res, val]) => `${val} ${window.itemsData[res] ? window.itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
    let messageContent = `Passer la technologie ${building.name} au Niveau ${currentLevel + 1}?<br>Coût: ${costString}.`;

    if(typeof showModal === 'function') showModal(title, messageContent, () => {
        for (const resource in costObject) {
             if (window.itemsData[resource]) {
                for(let i=0; i < costObject[resource]; i++) { if(typeof removeFromInventory === 'function') removeFromInventory(resource); }
             } else { window.gameState.resources[resource] -= costObject[resource]; }
        }
        window.gameState.buildings[buildingId] = currentLevel + 1;
        addLogEntry(`Technologie ${building.name} ${currentLevel === 0 ? 'débloquée' : 'améliorée'} au Niveau ${currentLevel + 1}.`, "success", window.eventLogEl, window.gameState.eventLog);

        if (typeof calculateNanobotStats === 'function' && nextLevelData.grantsModule) calculateNanobotStats();
        if (typeof calculateBaseStats === 'function') calculateBaseStats();
        if (typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
        if (typeof calculateResourceCapacities === 'function') calculateResourceCapacities();
        if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();

        if (typeof window.questController !== 'undefined' && typeof window.questController.checkQuestProgress === 'function') {
            window.questController.checkQuestProgress({ type: "build_level", buildingId: buildingId, level: window.gameState.buildings[buildingId] });
        }
    });
}
window.build = build;

function startResearch(researchId) {
    if (window.gameState.activeResearch) { if(typeof addLogEntry === 'function') addLogEntry("Une recherche est déjà en cours.", "info", window.eventLogEl, window.gameState.eventLog); return; }
    if (window.gameState.research[researchId]) { if(typeof addLogEntry === 'function') addLogEntry("Cette technologie a déjà été acquise.", "info", window.eventLogEl, window.gameState.eventLog); return; }

    if (typeof window.researchData === 'undefined' || typeof window.buildingsData === 'undefined' || typeof window.gameState === 'undefined') {
        console.error("startResearch: Dépendances non définies.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur de configuration de la recherche.", "error", window.eventLogEl, window.gameState?.eventLog);
        return;
    }
    const research = window.researchData[researchId];
    if (!research) { if(typeof addLogEntry === 'function') addLogEntry("Recherche inconnue.", "error", window.eventLogEl, window.gameState.eventLog); return; }

    let labLevel = window.gameState.buildings['researchLab'] || 0;
    let researchSpeedFactor = 0.5;
    if (labLevel > 0 && window.buildingsData['researchLab'] && window.buildingsData['researchLab'].levels[labLevel-1]?.researchSpeedFactor) {
        researchSpeedFactor = window.buildingsData['researchLab'].levels[labLevel - 1].researchSpeedFactor;
    } else if (labLevel === 0 && research.requirements?.buildings?.researchLab > 0) {
        if(typeof addLogEntry === 'function') addLogEntry(`Laboratoire de recherche (Niv. ${research.requirements.buildings.researchLab}) requis pour ${research.name}. Aucun laboratoire construit.`, "error", window.eventLogEl, window.gameState.eventLog);
        return;
    }

    if (research.requirements?.buildings?.researchLab && labLevel < research.requirements.buildings.researchLab){
         if(typeof addLogEntry === 'function') addLogEntry(`Laboratoire de recherche (Niv. ${research.requirements.buildings.researchLab}) requis pour ${research.name}. Actuel: Niv. ${labLevel}.`, "error", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    if (research.requirements?.research) {
        for (const reqResId of research.requirements.research) {
            if (!window.gameState.research[reqResId]) {
                if(typeof addLogEntry === 'function') addLogEntry(`Recherche "${window.researchData[reqResId]?.name || reqResId}" requise avant de lancer ${research.name}.`, "error", window.eventLogEl, window.gameState.eventLog);
                return;
            }
        }
    }

    for (const resource in research.cost) {
        if ((window.gameState.resources[resource]||0) < research.cost[resource]) {
            if(typeof addLogEntry === 'function') addLogEntry(`Ressources (${resource}) insuffisantes pour: ${research.name}. Requis: ${research.cost[resource]}`, "error", window.eventLogEl, window.gameState.eventLog);
            return;
        }
    }

    const researchTimeInSeconds = research.time;
    const actualResearchTimeSeconds = researchTimeInSeconds / researchSpeedFactor;
    let costString = Object.entries(research.cost).map(([res, val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');

    if(typeof showModal === 'function') showModal(`Lancer Recherche: ${research.name}?`, `Coût: ${costString}.<br>Temps estimé: ${formatTime(actualResearchTimeSeconds)}.`, () => {
        for (const resource in research.cost) window.gameState.resources[resource] -= research.cost[resource];
        window.gameState.activeResearch = {
            id: researchId,
            startTime: window.gameState.gameTime,
            totalTimeInSeconds: researchTimeInSeconds,
            actualTotalTimeSeconds: actualResearchTimeSeconds
        };
        if(typeof addLogEntry === 'function') addLogEntry(`Recherche ${research.name} initiée.`, "success", window.eventLogEl, window.gameState.eventLog);
        if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();
    });
}
window.startResearch = startResearch;

function attemptInstantResearch() {
    if (!window.gameState || !window.gameState.activeResearch || typeof window.INSTANT_RESEARCH_CRYSTAL_COST_PER_10_SECONDS === 'undefined') {
        if(typeof addLogEntry === 'function') addLogEntry("Aucune recherche active à accélérer ou configuration manquante.", "warning");
        return;
    }

    const activeRes = window.gameState.activeResearch;
    const researchDef = window.researchData[activeRes.id];
    if (!researchDef) {
        if(typeof addLogEntry === 'function') addLogEntry("Erreur: Recherche active invalide.", "error");
        return;
    }

    const elapsedSeconds = window.gameState.gameTime - activeRes.startTime;
    const timeRemainingSeconds = Math.max(0, activeRes.actualTotalTimeSeconds - elapsedSeconds);
    
    if (timeRemainingSeconds <= 0) {
        if(typeof addLogEntry === 'function') addLogEntry("La recherche est déjà terminée ou sur le point de se terminer.", "info");
        return;
    }

    const crystalCost = Math.ceil(timeRemainingSeconds / 10) * window.INSTANT_RESEARCH_CRYSTAL_COST_PER_10_SECONDS;

    if ((window.gameState.resources.crystal_shards || 0) < crystalCost) {
        if(typeof addLogEntry === 'function') addLogEntry(`Cristaux insuffisants pour terminer la recherche instantanément. Requis: ${crystalCost}.`, "error");
        return;
    }

    const confirmMessage = `Terminer la recherche "${researchDef.name}" instantanément pour ${crystalCost} <i class="ti ti-diamond text-cyan-400"></i> ?`;
    if (typeof showModal === 'function') {
        showModal("Accélérer Recherche", confirmMessage, () => {
            window.gameState.resources.crystal_shards -= crystalCost;
            
            window.gameState.research[activeRes.id] = true;
            if(typeof addLogEntry === 'function') addLogEntry(`Recherche "${researchDef.name}" terminée instantanément avec ${crystalCost} cristaux!`, "success", window.eventLogEl, window.gameState.eventLog);
            
            if (researchDef.grantsStatBoost && typeof calculateNanobotStats === 'function') calculateNanobotStats();
            if (researchDef.unlocksBuilding && typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBuildingDisplay === 'function') window.uiUpdates.updateBuildingDisplay();
            if (researchDef.grantsModule && typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateNanobotModulesDisplay === 'function') window.uiUpdates.updateNanobotModulesDisplay();
            
            window.gameState.activeResearch = null; 
            
            if (typeof window.questController !== 'undefined' && typeof window.questController.checkAllQuestsProgress === 'function') window.questController.checkAllQuestsProgress();
            if (typeof window.uiUpdates !== 'undefined') {
                window.uiUpdates.updateResourceDisplay();
                window.uiUpdates.updateResearchDisplay(); 
            }
        });
    }
}
window.attemptInstantResearch = attemptInstantResearch;


function repairBase(amount = 10) { 
    if (!window.gameState || !window.gameState.baseStats || typeof window.BASE_STATS_CONFIG?.repairCostPerHp === 'undefined') {
        console.error("repairBase: Dépendances manquantes."); return;
    }
    if (window.gameState.baseStats.currentHealth >= window.gameState.baseStats.maxHealth) {
        if(typeof addLogEntry === 'function') addLogEntry("Le Noyau est déjà à son intégrité maximale.", "info", window.eventLogEl, window.gameState.eventLog); return;
    }
    const healthToRestore = Math.min(amount, window.gameState.baseStats.maxHealth - window.gameState.baseStats.currentHealth);
    if (healthToRestore <= 0) return;
    const costBiomassPerHp = window.BASE_STATS_CONFIG.repairCostPerHp.biomass || 1;
    const costNanitesPerHp = window.BASE_STATS_CONFIG.repairCostPerHp.nanites || 2;
    const totalCostBiomass = healthToRestore * costBiomassPerHp;
    const totalCostNanites = healthToRestore * costNanitesPerHp;
    if (window.gameState.resources.biomass < totalCostBiomass || window.gameState.resources.nanites < totalCostNanites) {
        if(typeof addLogEntry === 'function') addLogEntry(`Ressources insuffisantes pour réparation du Noyau. Requis: ${totalCostBiomass} Biomasse, ${totalCostNanites} Nanites.`, "error", window.eventLogEl, window.gameState.eventLog); return;
    }
    window.gameState.resources.biomass -= totalCostBiomass;
    window.gameState.resources.nanites -= totalCostNanites;
    window.gameState.baseStats.currentHealth += healthToRestore;
    if(typeof addLogEntry === 'function') addLogEntry(`Noyau réparé de ${healthToRestore} PV. (-${totalCostBiomass} Biomasse, -${totalCostNanites} Nanites).`, "success", window.eventLogEl, window.gameState.eventLog);
    if(typeof window.uiUpdates !== 'undefined') {
        if(typeof window.uiUpdates.updateResourceDisplay === 'function') window.uiUpdates.updateResourceDisplay();
        if(typeof window.uiUpdates.updateBaseStatusDisplay === 'function') window.uiUpdates.updateBaseStatusDisplay();
    }
}
window.repairBase = repairBase;

function repairBaseFull() { 
    if (!window.gameState || !window.gameState.baseStats || typeof window.BASE_STATS_CONFIG?.repairCostPerHp === 'undefined') {
        console.error("repairBaseFull: Dépendances manquantes."); return;
    }
    if (window.gameState.baseStats.currentHealth >= window.gameState.baseStats.maxHealth) {
        if(typeof addLogEntry === 'function') addLogEntry("Le Noyau est déjà à son intégrité maximale.", "info", window.eventLogEl, window.gameState.eventLog); return;
    }
    const healthToRestore = window.gameState.baseStats.maxHealth - window.gameState.baseStats.currentHealth;
    if (healthToRestore <= 0) return; 
    
    const costBiomassPerHp = window.BASE_STATS_CONFIG.repairCostPerHp.biomass || 1;
    const costNanitesPerHp = window.BASE_STATS_CONFIG.repairCostPerHp.nanites || 2;
    const totalCostBiomass = healthToRestore * costBiomassPerHp;
    const totalCostNanites = healthToRestore * costNanitesPerHp;

    if (window.gameState.resources.biomass < totalCostBiomass || window.gameState.resources.nanites < totalCostNanites) {
        if(typeof addLogEntry === 'function') addLogEntry(`Ressources insuffisantes pour réparation totale du Noyau. Requis: ${totalCostBiomass} Biomasse, ${totalCostNanites} Nanites. Vous avez: ${Math.floor(window.gameState.resources.biomass)} Biomasse, ${Math.floor(window.gameState.resources.nanites)} Nanites.`, "error", window.eventLogEl, window.gameState.eventLog); 
        return;
    }

    const confirmMessage = `Réparer totalement le Noyau (${healthToRestore} PV) ?<br>Coût: ${totalCostBiomass} Biomasse, ${totalCostNanites} Nanites.`;
    if(typeof showModal === 'function') {
        showModal("Réparation Totale du Noyau", confirmMessage, () => {
            window.gameState.resources.biomass -= totalCostBiomass;
            window.gameState.resources.nanites -= totalCostNanites;
            window.gameState.baseStats.currentHealth += healthToRestore;
            if(typeof addLogEntry === 'function') addLogEntry(`Noyau entièrement réparé (+${healthToRestore} PV). Coût: ${totalCostBiomass} Biomasse, ${totalCostNanites} Nanites.`, "success", window.eventLogEl, window.gameState.eventLog);
            if(typeof window.uiUpdates !== 'undefined') {
                if(typeof window.uiUpdates.updateResourceDisplay === 'function') window.uiUpdates.updateResourceDisplay();
                if(typeof window.uiUpdates.updateBaseStatusDisplay === 'function') window.uiUpdates.updateBaseStatusDisplay();
            }
        });
    }
}
window.repairBaseFull = repairBaseFull;


function repairAllDefenses() {
    if (!window.gameState || !window.gameState.defenses || typeof window.BASE_STATS_CONFIG?.defenseRepairCostFactor === 'undefined' || typeof window.buildingsData === 'undefined') {
        console.error("repairAllDefenses: Dépendances manquantes."); return;
    }
    let totalBiomassCost = 0; let totalNaniteCost = 0; let totalHealthRestored = 0;
    let defensesToRepairDetails = [];
    const repairFactor = window.BASE_STATS_CONFIG.defenseRepairCostFactor;

    for (const defId in window.gameState.defenses) {
        const defense = window.gameState.defenses[defId];
        if (defense && defense.currentHealth < defense.maxHealth) {
            const healthNeeded = defense.maxHealth - defense.currentHealth;
            const defenseTypeData = window.buildingsData[defense.id];
            if (defenseTypeData && defenseTypeData.placementCost) {
                const costToRepairThisInstanceBiomass = Math.ceil((defenseTypeData.placementCost.biomass || 0) * (healthNeeded / defense.maxHealth) * repairFactor);
                const costToRepairThisInstanceNanites = Math.ceil((defenseTypeData.placementCost.nanites || 0) * (healthNeeded / defense.maxHealth) * repairFactor);
                defensesToRepairDetails.push({ defId, name: defense.name, healthNeeded, costBiomass: costToRepairThisInstanceBiomass, costNanites: costToRepairThisInstanceNanites });
                totalBiomassCost += costToRepairThisInstanceBiomass;
                totalNaniteCost += costToRepairThisInstanceNanites;
                totalHealthRestored += healthNeeded;
            }
        }
    }
    if (defensesToRepairDetails.length === 0) { if(typeof addLogEntry === 'function') addLogEntry("Toutes les défenses sont opérationnelles.", "info", window.eventLogEl, window.gameState.eventLog); return; }
    if (window.gameState.resources.biomass < totalBiomassCost || window.gameState.resources.nanites < totalNaniteCost) { if(typeof addLogEntry === 'function') addLogEntry("Ressources insuffisantes pour réparer toutes les défenses.", "error", window.eventLogEl, window.gameState.eventLog); return; }

    let confirmMessage = `Réparer toutes les défenses endommagées pour ${totalBiomassCost} Biomasse et ${totalNaniteCost} Nanites ?<br>Cela restaurera ${totalHealthRestored} PV au total.`;
    if (typeof showModal === 'function') {
        showModal("Confirmer Réparation Défenses", confirmMessage, () => {
            window.gameState.resources.biomass -= totalBiomassCost;
            window.gameState.resources.nanites -= totalNaniteCost;
            defensesToRepairDetails.forEach(item => { if (window.gameState.defenses[item.defId]) window.gameState.defenses[item.defId].currentHealth += item.healthNeeded; });
            if(typeof addLogEntry === 'function') addLogEntry(`Défenses réparées (+${totalHealthRestored} PV total). (-${totalBiomassCost} Biomasse, -${totalNaniteCost} Nanites).`, "success", window.eventLogEl, window.gameState.eventLog);
            if(typeof calculateBaseStats === 'function') calculateBaseStats();
            if(typeof window.uiUpdates !== 'undefined') {
                if(typeof window.uiUpdates.updateResourceDisplay === 'function') window.uiUpdates.updateResourceDisplay();
                if(typeof window.uiUpdates.updateBaseStatusDisplay === 'function') window.uiUpdates.updateBaseStatusDisplay();
            }
        });
    }
}
window.repairAllDefenses = repairAllDefenses;

function enterPlacementMode(defenseTypeId) {
    if (!window.buildingsData || !window.buildingsData[defenseTypeId] || !window.gameState || !window.placementInfoEl || !window.selectedDefenseForPlacementEl || !window.cancelPlacementBtnEl) {
        console.error("enterPlacementMode: Dépendances manquantes ou type de défense invalide.");
        return;
    }
    const defenseData = window.buildingsData[defenseTypeId];
    if (defenseData.type !== 'defense') {
        if(typeof addLogEntry === 'function') addLogEntry(`${defenseData.name} n'est pas une structure défensive.`, "error", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    if ((window.gameState.buildings[defenseTypeId] || 0) === 0) {
        if(typeof addLogEntry === 'function') addLogEntry(`Technologie ${defenseData.name} non débloquée.`, "error", window.eventLogEl, window.gameState.eventLog);
        return;
    }

    window.gameState.placementMode.isActive = true;
    window.gameState.placementMode.selectedDefenseType = defenseTypeId;
    window.gameState.placementMode.selectedDefenseLevel = 1;

    window.placementInfoEl.classList.remove('hidden');
    window.selectedDefenseForPlacementEl.textContent = defenseData.name;
    window.cancelPlacementBtnEl.classList.remove('hidden');

    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBasePreview === 'function') window.uiUpdates.updateBasePreview();
    if(typeof addLogEntry === 'function') addLogEntry(`Mode placement activé pour ${defenseData.name}. Cliquez sur une case de la grille de base.`, "info", window.eventLogEl, window.gameState.eventLog);
}
window.enterPlacementMode = enterPlacementMode;

function cancelPlacementMode() {
    if (!window.gameState || !window.placementInfoEl || !window.cancelPlacementBtnEl) return;
    window.gameState.placementMode.isActive = false;
    window.gameState.placementMode.selectedDefenseType = null;
    window.placementInfoEl.classList.add('hidden');
    window.cancelPlacementBtnEl.classList.add('hidden');
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBasePreview === 'function') window.uiUpdates.updateBasePreview();
    if(typeof addLogEntry === 'function') addLogEntry("Mode placement annulé.", "info", window.eventLogEl, window.gameState.eventLog);
}
window.cancelPlacementMode = cancelPlacementMode;

function handleGridCellClick(row, col) {
    if (!window.gameState || !window.gameState.placementMode ) { return; }

    if (!window.gameState.placementMode.isActive || !window.gameState.placementMode.selectedDefenseType) {
        const cellContent = window.gameState.baseGrid[row] && window.gameState.baseGrid[row][col];
        if (cellContent && cellContent.instanceId) {
            if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.managePlacedDefense === 'function') window.uiUpdates.managePlacedDefense(cellContent.instanceId, row, col);
        }
        return;
    }

    if (!window.buildingsData || !window.buildingsData[window.gameState.placementMode.selectedDefenseType] || !window.itemsData) {
         if(typeof addLogEntry === 'function') addLogEntry("Erreur de données de défense pour le placement.", "error", window.eventLogEl, window.gameState.eventLog);
        return;
    }

    const defenseData = window.buildingsData[window.gameState.placementMode.selectedDefenseType];
    const placementCost = defenseData.placementCost;

    if (!placementCost) {
        if(typeof addLogEntry === 'function') addLogEntry(`Coût de placement non défini pour ${defenseData.name}.`, "error", window.eventLogEl, window.gameState.eventLog);
        return;
    }

    if (window.gameState.baseGrid[row][col] !== null) {
        if(typeof addLogEntry === 'function') addLogEntry("Cette case est déjà occupée.", "warning", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    const coreRow = Math.floor((window.BASE_GRID_SIZE?.rows || 9) / 2);
    const coreCol = Math.floor((window.BASE_GRID_SIZE?.cols || 13) / 2);
    if (row === coreRow && col === coreCol) {
        if(typeof addLogEntry === 'function') addLogEntry("Impossible de placer une défense sur le Noyau.", "warning", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    // Vérifier si le Nanobot est sur cette case
    if (window.gameState.nanobotStats.isDefendingBase && 
        window.gameState.nanobotStats.baseDefensePosition &&
        window.gameState.nanobotStats.baseDefensePosition.row === row && 
        window.gameState.nanobotStats.baseDefensePosition.col === col) {
        if(typeof addLogEntry === 'function') addLogEntry("Impossible de placer une défense, Nexus-7 occupe cette case.", "warning", window.eventLogEl, window.gameState.eventLog);
        return;
    }


    for (const resource in placementCost) {
        if (window.itemsData[resource]) {
            if ((window.gameState.inventory.filter(id => id === resource).length || 0) < placementCost[resource]) {
                if(typeof addLogEntry === 'function') addLogEntry(`Composants (${window.itemsData[resource].name}) insuffisants. Requis: ${placementCost[resource]}.`, "error", window.eventLogEl, window.gameState.eventLog); return;
            }
        } else {
            if ((window.gameState.resources[resource] || 0) < placementCost[resource]) {
                if(typeof addLogEntry === 'function') addLogEntry(`Ressources (${resource}) insuffisantes. Requis: ${placementCost[resource]}.`, "error", window.eventLogEl, window.gameState.eventLog); return;
            }
        }
    }

    for (const resource in placementCost) {
        if (window.itemsData[resource]) {
            for(let i=0; i < placementCost[resource]; i++) { if(typeof removeFromInventory === 'function') removeFromInventory(resource); }
        } else {
            window.gameState.resources[resource] -= placementCost[resource];
        }
    }

    const instanceLevelData = defenseData.levels[0]; 

    const instanceId = `def_${defenseData.id}_${row}_${col}_${Date.now()}`;
    const newDefenseInstance = {
        instanceId: instanceId,
        id: defenseData.id,
        name: defenseData.name,
        level: 1, 
        currentHealth: instanceLevelData.stats.health,
        maxHealth: instanceLevelData.stats.health,
        attack: instanceLevelData.stats.attack,
        range: instanceLevelData.stats.range,
        fireRate: instanceLevelData.stats.fireRate,
        damageType: instanceLevelData.stats.damageType,
        row: row, col: col,
        lastAttackTime: 0 
    };
    window.gameState.baseGrid[row][col] = { id: defenseData.id, instanceId: instanceId };
    window.gameState.defenses[instanceId] = newDefenseInstance;

    if(typeof addLogEntry === 'function') addLogEntry(`${defenseData.name} placée en (${row},${col}).`, "success", window.eventLogEl, window.gameState.eventLog);
    if(typeof calculateBaseStats === 'function') calculateBaseStats();
    if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();
}
window.handleGridCellClick = handleGridCellClick;

function executeUpgradePlacedDefense(instanceId) {
    if (!window.gameState || !window.gameState.defenses || !window.gameState.defenses[instanceId] || !window.buildingsData || !window.itemsData) {
        if(typeof addLogEntry === 'function') addLogEntry("Erreur lors de l'amélioration de la défense.", "error", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    const defenseInstance = window.gameState.defenses[instanceId];
    const defenseTypeData = window.buildingsData[defenseInstance.id];
    const currentInstanceLevel = defenseInstance.level;
    const currentTechLevel = window.gameState.buildings[defenseInstance.id] || 0;

    if (currentInstanceLevel >= currentTechLevel) {
        if(typeof addLogEntry === 'function') addLogEntry(`Améliorez d'abord la technologie ${defenseTypeData.name} pour améliorer cette instance.`, "warning", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    if (!defenseTypeData.levels || currentInstanceLevel >= defenseTypeData.levels.length) {
        if(typeof addLogEntry === 'function') addLogEntry(`${defenseInstance.name} est déjà à son niveau d'instance maximum.`, "info", window.eventLogEl, window.gameState.eventLog);
        return;
    }

    const nextLevelData = defenseTypeData.levels.find(l => l.level === currentInstanceLevel + 1);
    if (!nextLevelData || !nextLevelData.costToUpgradeInstance) {
        if(typeof addLogEntry === 'function') addLogEntry(`Données de coût manquantes pour l'amélioration de ${defenseInstance.name}.`, "error", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    const cost = nextLevelData.costToUpgradeInstance;
    for (const resource in cost) {
        if (window.itemsData[resource]) {
            if ((window.gameState.inventory.filter(id => id === resource).length || 0) < cost[resource]) {
                 if(typeof addLogEntry === 'function') addLogEntry(`Composants (${window.itemsData[resource].name}) manquants pour améliorer.`, "error", window.eventLogEl, window.gameState.eventLog); return;
            }
        } else {
            if ((window.gameState.resources[resource] || 0) < cost[resource]) {
                if(typeof addLogEntry === 'function') addLogEntry(`Ressources (${resource}) insuffisantes pour améliorer.`, "error", window.eventLogEl, window.gameState.eventLog); return;
            }
        }
    }

    for (const resource in cost) {
        if (window.itemsData[resource]) { for(let i=0; i < cost[resource]; i++) { if(typeof removeFromInventory === 'function') removeFromInventory(resource); }}
        else { window.gameState.resources[resource] -= cost[resource]; }
    }

    defenseInstance.level++;
    defenseInstance.currentHealth = nextLevelData.stats.health;
    defenseInstance.maxHealth = nextLevelData.stats.health;
    defenseInstance.attack = nextLevelData.stats.attack;
    defenseInstance.range = nextLevelData.stats.range;
    defenseInstance.fireRate = nextLevelData.stats.fireRate;
    defenseInstance.damageType = nextLevelData.stats.damageType;


    if(typeof addLogEntry === 'function') addLogEntry(`${defenseInstance.name} améliorée au Niveau d'instance ${defenseInstance.level}.`, "success", window.eventLogEl, window.gameState.eventLog);
    if(typeof calculateBaseStats === 'function') calculateBaseStats();
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();
}
window.executeUpgradePlacedDefense = executeUpgradePlacedDefense;

function sellPlacedDefense(instanceId, row, col) {
    if (!window.gameState || !window.gameState.defenses || !window.gameState.defenses[instanceId] || !window.buildingsData || !window.itemsData) {
         if(typeof addLogEntry === 'function') addLogEntry("Erreur lors de la vente de la défense.", "error", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    const defenseInstance = window.gameState.defenses[instanceId];
    const defenseTypeData = window.buildingsData[defenseInstance.id];
    const refundFactor = window.SELL_REFUND_FACTOR || 0.5;
    let totalRefundValue = 0;

    if (defenseTypeData.placementCost) {
        for (const resource in defenseTypeData.placementCost) {
            const refundAmount = Math.floor(defenseTypeData.placementCost[resource] * refundFactor);
            if (window.itemsData[resource]) {
                for(let i = 0; i < refundAmount; i++) { if(typeof addToInventory === 'function') addToInventory(resource); }
            } else {
                window.gameState.resources[resource] = (window.gameState.resources[resource] || 0) + refundAmount;
            }
            totalRefundValue += refundAmount * (window.itemsData[resource]?.value || 1);
        }
    }
    for(let i = 1; i < defenseInstance.level; i++) {
        const prevLevelData = defenseTypeData.levels.find(l => l.level === i + 1); 
        if (prevLevelData && prevLevelData.costToUpgradeInstance) {
            for (const resource in prevLevelData.costToUpgradeInstance) {
                const refundAmount = Math.floor(prevLevelData.costToUpgradeInstance[resource] * refundFactor);
                 if (window.itemsData[resource]) {
                    for(let j = 0; j < refundAmount; j++) { if(typeof addToInventory === 'function') addToInventory(resource); }
                } else {
                    window.gameState.resources[resource] = (window.gameState.resources[resource] || 0) + refundAmount;
                }
                totalRefundValue += refundAmount * (window.itemsData[resource]?.value || 1);
            }
        }
    }


    delete window.gameState.defenses[instanceId];
    if (window.gameState.baseGrid[row] && window.gameState.baseGrid[row][col] && window.gameState.baseGrid[row][col].instanceId === instanceId) {
        window.gameState.baseGrid[row][col] = null;
    }

    if(typeof addLogEntry === 'function') addLogEntry(`${defenseTypeData.name} vendue. Ressources récupérées (valeur approx: ${totalRefundValue}).`, "info", window.eventLogEl, window.gameState.eventLog);
    if(typeof calculateBaseStats === 'function') calculateBaseStats();
    if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();
}
window.sellPlacedDefense = sellPlacedDefense;


function processDefenseActions() {
    if (!window.gameState || !window.gameState.defenses || !window.gameState.nightAssault || !window.gameState.nightAssault.isActive || window.gameState.nightAssault.enemies.length === 0) {
        return;
    }
    const efficiencyFactor = window.gameState.baseStats.defenseEfficiencyFactor !== undefined ? window.gameState.baseStats.defenseEfficiencyFactor : 1;
    if (efficiencyFactor <= 0 && Object.values(window.gameState.defenses).some(d => d.attack > 0) ) { 
        return; 
    }

    const TILE_SIZE_IN_PIXELS = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--map-tile-effective-size')) || 22; 

    for (const defInstanceId in window.gameState.defenses) {
        const defense = window.gameState.defenses[defInstanceId];
        if (!defense || defense.currentHealth <= 0 || !defense.attack || defense.attack <= 0 || !defense.range) {
            continue; 
        }

        const currentTime = window.gameState.gameTime;
        if (defense.fireRate > 0 && currentTime < (defense.lastAttackTime || 0) + (1 / defense.fireRate)) {
            continue; 
        }

        const defensePixelX = defense.col * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;
        const defensePixelY = defense.row * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;
        const defenseRangePixels = defense.range * TILE_SIZE_IN_PIXELS;

        let closestEnemy = null;
        let minDistanceSq = Infinity;

        window.gameState.nightAssault.enemies.forEach(enemy => {
            if (enemy.currentHealth > 0) {
                const dx = enemy.x - defensePixelX;
                const dy = enemy.y - defensePixelY;
                const distanceSq = dx * dx + dy * dy;
                if (distanceSq < minDistanceSq && distanceSq <= defenseRangePixels * defenseRangePixels) {
                    minDistanceSq = distanceSq;
                    closestEnemy = enemy;
                }
            }
        });

        if (closestEnemy) {
            defense.lastAttackTime = currentTime;
            let damage = Math.floor(defense.attack * efficiencyFactor);
            damage = Math.max(1, damage); 

            closestEnemy.currentHealth -= damage;
            if (typeof addLogEntry === 'function') addLogEntry(`${defense.name} tire sur ${closestEnemy.typeInfo.name} pour ${damage} dégâts. PV Restants: ${Math.max(0, closestEnemy.currentHealth)}`, "base-defense-event", window.nightAssaultLogEl, window.gameState.nightAssault.log);
            
            if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.drawLaserShot === 'function') {
                window.uiUpdates.drawLaserShot(defensePixelX, defensePixelY, closestEnemy.x, closestEnemy.y, 'friendly');
            }


            if (closestEnemy.currentHealth <= 0) {
                if (typeof addLogEntry === 'function') addLogEntry(`${closestEnemy.typeInfo.name} détruit par ${defense.name}!`, "success", window.nightAssaultLogEl, window.gameState.nightAssault.log);
            }
            if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.drawNightAssaultEnemiesOnPreview === 'function') {
                window.uiUpdates.drawNightAssaultEnemiesOnPreview();
            }
        }
    }
}
window.processDefenseActions = processDefenseActions;

function processNanobotBaseDefenseAction() {
    if (!window.gameState || !window.gameState.nanobotStats || !window.gameState.nanobotStats.isDefendingBase ||
        !window.gameState.nanobotStats.baseDefensePosition || !window.NANOBOT_BASE_PATROL_POINTS ||
        typeof window.BASE_GRID_SIZE === 'undefined' ||
        typeof window.TICK_SPEED === 'undefined'
    ) {
        return;
    }

    const nanobot = window.gameState.nanobotStats;
    const currentTime = window.gameState.gameTime;
    const NANOBOT_ACTION_COOLDOWN_SECONDS = 1.5; 

    if (currentTime < (nanobot.baseDefenseLastActionTime || 0) + NANOBOT_ACTION_COOLDOWN_SECONDS) {
        return; 
    }

    const TILE_SIZE_IN_PIXELS = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--map-tile-effective-size')) || 22; 
    const nanobotAttackRangeCells = 2; 
    const nanobotAttackRangePixels = nanobotAttackRangeCells * TILE_SIZE_IN_PIXELS;

    let targetEnemy = null;
    if (window.gameState.nightAssault && window.gameState.nightAssault.isActive && window.gameState.nightAssault.enemies.length > 0) {
        let closestEnemy = null;
        let minDistanceSq = Infinity;

        const nanobotPixelX = nanobot.baseDefensePosition.col * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;
        const nanobotPixelY = nanobot.baseDefensePosition.row * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;

        window.gameState.nightAssault.enemies.forEach(enemy => {
            if (enemy.currentHealth > 0) {
                const dx = enemy.x - nanobotPixelX;
                const dy = enemy.y - nanobotPixelY;
                const distanceSq = dx * dx + dy * dy;
                if (distanceSq < minDistanceSq && distanceSq <= nanobotAttackRangePixels * nanobotAttackRangePixels) {
                    minDistanceSq = distanceSq;
                    closestEnemy = enemy;
                }
            }
        });
        targetEnemy = closestEnemy;
    }

    if (targetEnemy) {
        nanobot.baseDefenseTargetEnemyId = targetEnemy.id;
        nanobot.baseDefenseLastActionTime = currentTime;

        let damage = nanobot.attack; 
        damage = Math.max(1, Math.floor(damage));

        targetEnemy.currentHealth -= damage;
        if (typeof addLogEntry === 'function') addLogEntry(`Nexus-7 (Base) tire sur ${targetEnemy.typeInfo.name} pour ${damage} dégâts. PV Restants: ${Math.max(0, targetEnemy.currentHealth)}`, "base-defense-event", window.nightAssaultLogEl, window.gameState.nightAssault.log);
        
        if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.drawLaserShot === 'function') {
            const nanobotPixelX = nanobot.baseDefensePosition.col * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;
            const nanobotPixelY = nanobot.baseDefensePosition.row * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;
            window.uiUpdates.drawLaserShot(nanobotPixelX, nanobotPixelY, targetEnemy.x, targetEnemy.y, 'nanobot-base'); 
        }

        if (targetEnemy.currentHealth <= 0) {
            if (typeof addLogEntry === 'function') addLogEntry(`${targetEnemy.typeInfo.name} détruit par Nexus-7 (Base)!`, "success", window.nightAssaultLogEl, window.gameState.nightAssault.log);
            nanobot.baseDefenseTargetEnemyId = null; 
        }
        if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.drawNightAssaultEnemiesOnPreview === 'function') {
            window.uiUpdates.drawNightAssaultEnemiesOnPreview();
        }
        return; 
    }

    nanobot.baseDefenseTargetEnemyId = null; 
    if (NANOBOT_BASE_PATROL_POINTS.length > 0) {
        const currentPatrolTarget = NANOBOT_BASE_PATROL_POINTS[nanobot.baseDefensePatrolIndex];
        
        if (nanobot.baseDefensePosition.row === currentPatrolTarget.row && nanobot.baseDefensePosition.col === currentPatrolTarget.col) {
            nanobot.baseDefensePatrolIndex = (nanobot.baseDefensePatrolIndex + 1) % NANOBOT_BASE_PATROL_POINTS.length;
            nanobot.baseDefenseLastActionTime = currentTime;
            if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBasePreview === 'function') window.uiUpdates.updateBasePreview();
            return;
        } else {
            let newRow = nanobot.baseDefensePosition.row;
            let newCol = nanobot.baseDefensePosition.col;

            if (currentPatrolTarget.row < newRow) newRow--;
            else if (currentPatrolTarget.row > newRow) newRow++;
            else if (currentPatrolTarget.col < newCol) newCol--;
            else if (currentPatrolTarget.col > newCol) newCol++;
            
            const coreRow = Math.floor(window.BASE_GRID_SIZE.rows / 2);
            const coreCol = Math.floor(window.BASE_GRID_SIZE.cols / 2);

            if (newRow >= 0 && newRow < window.BASE_GRID_SIZE.rows &&
                newCol >= 0 && newCol < window.BASE_GRID_SIZE.cols &&
                !(newRow === coreRow && newCol === coreCol) && 
                (!window.gameState.baseGrid[newRow] || !window.gameState.baseGrid[newRow][newCol])) { 
                
                nanobot.baseDefensePosition = { row: newRow, col: newCol };
                nanobot.baseDefenseLastActionTime = currentTime;
                if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBasePreview === 'function') window.uiUpdates.updateBasePreview();
            } else {
                nanobot.baseDefensePatrolIndex = (nanobot.baseDefensePatrolIndex + 1) % NANOBOT_BASE_PATROL_POINTS.length;
                nanobot.baseDefenseLastActionTime = currentTime; 
            }
        }
    }
}
window.processNanobotBaseDefenseAction = processNanobotBaseDefenseAction;


console.log("gameplayLogic_base.js - Fonctions liées à la base définies.");