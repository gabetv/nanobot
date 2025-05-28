// js/gameplayLogic_resources_time.js
console.log("gameplayLogic_resources_time.js - Fichier chargé et en cours d'analyse...");

function calculateResourceCapacities() {
    if (!window.gameState || !window.gameState.capacity || !window.gameState.buildings ||
        typeof window.buildingsData === 'undefined' || typeof window.INITIAL_CAPACITIES === 'undefined') {
        return;
    }

    window.gameState.capacity.biomass = window.INITIAL_CAPACITIES.biomass || 500;
    window.gameState.capacity.nanites = window.INITIAL_CAPACITIES.nanites || 300;
    window.gameState.capacity.energy = window.INITIAL_CAPACITIES.energy || 0;
    window.gameState.capacity.crystal_shards = window.INITIAL_CAPACITIES.crystal_shards || 50;

    for (const buildingId in window.gameState.buildings) {
        const level = window.gameState.buildings[buildingId];
        if (level > 0) {
            const buildingDef = window.buildingsData[buildingId];
            if (buildingDef && buildingDef.levels && buildingDef.levels[level - 1]) {
                const levelData = buildingDef.levels[level - 1];
                if (levelData.capacity) {
                    for (const resource in levelData.capacity) {
                        if (resource === 'energy' && buildingDef.type === 'energy') {
                             window.gameState.capacity.energy += levelData.capacity[resource];
                        } else if (resource !== 'energy') {
                            window.gameState.capacity[resource] = (window.gameState.capacity[resource] || 0) + levelData.capacity[resource];
                        }
                    }
                }
            }
        }
    }
}
window.calculateResourceCapacities = calculateResourceCapacities;

function calculateProductionAndConsumption() {
    if (!window.gameState || !window.gameState.productionRates || !window.gameState.capacity || typeof window.buildingsData === 'undefined') {
        return;
    }

    window.gameState.productionRates.biomass = 0;
    window.gameState.productionRates.nanites = 0;
    let totalEnergyConsumptionNonDefense = 0;
    let totalEnergyConsumptionDefense = 0;

    for (const buildingId in window.gameState.buildings) {
        const level = window.gameState.buildings[buildingId];
        if (level > 0) {
            const buildingDef = window.buildingsData[buildingId];
            if(buildingDef && buildingDef.levels && buildingDef.levels[level - 1]){
                const levelData = buildingDef.levels[level - 1];
                if (buildingDef.type === "production") {
                    if (levelData.production) {
                        if (levelData.production.biomass) window.gameState.productionRates.biomass += levelData.production.biomass;
                        if (levelData.production.nanites) window.gameState.productionRates.nanites += levelData.production.nanites;
                    }
                }
                if (buildingDef.type !== "defense" && buildingDef.type !== "energy" && levelData.energyConsumption) {
                    totalEnergyConsumptionNonDefense += levelData.energyConsumption;
                }
            }
        }
    }

    if (window.gameState.defenses) {
        for (const defId in window.gameState.defenses) {
            const defenseInstance = window.gameState.defenses[defId];
            if (defenseInstance) {
                const defenseBuildingData = window.buildingsData[defenseInstance.id];
                if (defenseInstance.currentHealth > 0 && defenseBuildingData && defenseBuildingData.baseEnergyConsumption) {
                    totalEnergyConsumptionDefense += defenseBuildingData.baseEnergyConsumption;
                }
            }
        }
    }

    window.gameState.resources.energyConsumedByDefenses = totalEnergyConsumptionDefense;
    window.gameState.resources.totalEnergyConsumed = totalEnergyConsumptionNonDefense + totalEnergyConsumptionDefense;

    if (!window.gameState.isDay && typeof window.DAY_NIGHT_CYCLE_CONFIG !== 'undefined' && typeof window.DAY_NIGHT_CYCLE_CONFIG.nightTimeProductionModifier === 'number') {
        window.gameState.productionRates.biomass *= window.DAY_NIGHT_CYCLE_CONFIG.nightTimeProductionModifier;
        window.gameState.productionRates.nanites *= window.DAY_NIGHT_CYCLE_CONFIG.nightTimeProductionModifier;
    }

    if (window.gameState.resources.totalEnergyConsumed > window.gameState.capacity.energy) {
        const deficitFactor = window.gameState.capacity.energy > 0 ? Math.max(0, window.gameState.capacity.energy) / window.gameState.resources.totalEnergyConsumed : 0;
        window.gameState.productionRates.biomass *= deficitFactor;
        window.gameState.productionRates.nanites *= deficitFactor;
        const dayDurationOrDefault = typeof window.DAY_DURATION !== 'undefined' ? window.DAY_DURATION : 300; // Fallback
        if (!window.gameState.nightAssault.deficitWarningLogged || window.gameState.gameTime > window.gameState.nightAssault.deficitWarningLogged + (dayDurationOrDefault / 4)) {
            if(typeof addLogEntry === 'function') addLogEntry("Surcharge énergétique! Production et efficacité des défenses réduites.", "error", window.eventLogEl, window.gameState.eventLog);
            window.gameState.nightAssault.deficitWarningLogged = window.gameState.gameTime;
        }
    } else {
        window.gameState.nightAssault.deficitWarningLogged = 0;
    }
}
window.calculateProductionAndConsumption = calculateProductionAndConsumption;

function updateResources(deltaTime) {
    if (!window.gameState || !window.gameState.resources || !window.gameState.productionRates || !window.gameState.capacity) return;
    for (const resource in window.gameState.productionRates) {
        if (window.gameState.resources.hasOwnProperty(resource) && window.gameState.capacity.hasOwnProperty(resource)) {
            let produced = window.gameState.productionRates[resource] * deltaTime;
            window.gameState.resources[resource] = Math.min(window.gameState.resources[resource] + produced, window.gameState.capacity[resource]);
            window.gameState.resources[resource] = Math.max(0, window.gameState.resources[resource]);
        }
    }
}
window.updateResources = updateResources;

function updateResearch(deltaTime) {
    if (!window.gameState || !window.gameState.activeResearch || typeof window.researchData === 'undefined' || typeof window.TICK_SPEED === 'undefined') return;
    const activeRes = window.gameState.activeResearch;
    const researchDef = window.researchData[activeRes.id];
    if (!researchDef) { console.error(`Données de recherche active ${activeRes.id} non trouvées.`); window.gameState.activeResearch = null; return; }

    const elapsedTicksSinceStart = window.gameState.gameTime - activeRes.startTime; // gameTime est en secondes
    const elapsedSeconds = elapsedTicksSinceStart; //  gameTime est déjà en secondes si deltaTime l'est

    if (elapsedSeconds >= activeRes.actualTotalTimeSeconds) {
        window.gameState.research[activeRes.id] = true;
        if(typeof addLogEntry === 'function') addLogEntry(`Recherche terminée: ${researchDef.name}!`, "success", window.eventLogEl, window.gameState.eventLog);
        if (researchDef.grantsStatBoost && typeof calculateNanobotStats === 'function') calculateNanobotStats();
        if (researchDef.unlocksBuilding && typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBuildingDisplay === 'function') window.uiUpdates.updateBuildingDisplay();
        if (researchDef.grantsModule && typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateNanobotModulesDisplay === 'function') window.uiUpdates.updateNanobotModulesDisplay();
        window.gameState.activeResearch = null;
        if (typeof window.questController !== 'undefined' && typeof window.questController.checkAllQuestsProgress === 'function') window.questController.checkAllQuestsProgress();
        if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateResearchDisplay === 'function') window.uiUpdates.updateResearchDisplay();
    } else {
         const researchSubTab = document.querySelector('#research-subtab.sub-content.active');
         if (researchSubTab && typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateResearchDisplay === 'function') {
            window.uiUpdates.updateResearchDisplay();
         }
    }
}
window.updateResearch = updateResearch;

function updateDayNightCycle(deltaTime) {
    if (!window.gameState || typeof window.DAY_DURATION === 'undefined' || typeof window.NIGHT_DURATION === 'undefined') return;
    window.gameState.dayNightCycleTimer += deltaTime;
    const currentCycleTargetDuration = window.gameState.isDay ? window.DAY_DURATION : window.NIGHT_DURATION;
    if (window.gameState.dayNightCycleTimer >= currentCycleTargetDuration) {
        if (typeof forceCycleChange === 'function') forceCycleChange(true);
        else console.error("forceCycleChange non défini dans updateDayNightCycle");
    }
}
window.updateDayNightCycle = updateDayNightCycle;

function updateGameTimeAndCycleDisplay() {
    if (!window.gameState || !window.gameTimeEl || !window.cycleStatusEl || typeof window.TICK_SPEED === 'undefined' || typeof window.DAY_DURATION === 'undefined' || typeof window.NIGHT_DURATION === 'undefined') return;
    window.gameTimeEl.textContent = formatTime(Math.floor(window.gameState.gameTime)); // gameTime est maintenant en secondes
    const currentCycleTargetDuration = window.gameState.isDay ? window.DAY_DURATION : window.NIGHT_DURATION;
    const timeRemainingInCycle = Math.max(0, currentCycleTargetDuration - window.gameState.dayNightCycleTimer);
    window.cycleStatusEl.textContent = `${window.gameState.isDay ? "Jour" : "Nuit"} (${formatTime(Math.floor(timeRemainingInCycle))})`;
}
window.updateGameTimeAndCycleDisplay = updateGameTimeAndCycleDisplay;

function regenerateMobility(deltaTime) {
    if (!window.gameState || !window.gameState.resources || typeof window.MAX_MOBILITY_POINTS === 'undefined' || typeof window.MOBILITY_RECHARGE_TIME_PER_POINT === 'undefined') return;
    if (window.gameState.resources.mobility < window.MAX_MOBILITY_POINTS) {
        window.gameState.mobilityRechargeTimer += deltaTime;
        if (window.gameState.mobilityRechargeTimer >= window.MOBILITY_RECHARGE_TIME_PER_POINT) {
            window.gameState.resources.mobility = Math.min(window.MAX_MOBILITY_POINTS, window.gameState.resources.mobility + 1);
            window.gameState.mobilityRechargeTimer = 0;
            if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateResourceDisplay === 'function') {
                window.uiUpdates.updateResourceDisplay();
            }
        }
    } else {
        window.gameState.mobilityRechargeTimer = 0;
    }
}
window.regenerateMobility = regenerateMobility;

function forceCycleChange(isNaturalChange = false) {
    if (!window.gameState || typeof window.FORCE_CYCLE_CHANGE_COST === 'undefined' ||
        typeof window.DAY_DURATION === 'undefined' || typeof window.NIGHT_DURATION === 'undefined' ||
        typeof window.TICK_SPEED === 'undefined') {
        console.error("forceCycleChange: Dépendances manquantes."); return;
    }

    if (!isNaturalChange) {
        if ((window.gameState.resources.biomass || 0) < window.FORCE_CYCLE_CHANGE_COST.biomass ||
            (window.gameState.resources.nanites || 0) < window.FORCE_CYCLE_CHANGE_COST.nanites) {
            if(typeof addLogEntry === 'function') addLogEntry(`Ressources insuffisantes pour forcer le cycle. Requis: ${window.FORCE_CYCLE_CHANGE_COST.biomass} Biomasse, ${window.FORCE_CYCLE_CHANGE_COST.nanites} Nanites.`, "error", window.eventLogEl, window.gameState.eventLog);
            return;
        }
        window.gameState.resources.biomass -= window.FORCE_CYCLE_CHANGE_COST.biomass;
        window.gameState.resources.nanites -= window.FORCE_CYCLE_CHANGE_COST.nanites;
        if(typeof addLogEntry === 'function') addLogEntry(`Cycle forcé. (-${window.FORCE_CYCLE_CHANGE_COST.biomass} Biomasse, -${window.FORCE_CYCLE_CHANGE_COST.nanites} Nanites).`, "warning", window.eventLogEl, window.gameState.eventLog);
        if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateResourceDisplay === 'function') window.uiUpdates.updateResourceDisplay();
    }

    window.gameState.isDay = !window.gameState.isDay;
    window.gameState.dayNightCycleTimer = 0;
    if(typeof addLogEntry === 'function') addLogEntry(`Changement de cycle: C'est maintenant ${window.gameState.isDay ? 'le JOUR' : 'la NUIT'}.`, "info", window.eventLogEl, window.gameState.eventLog);
    if(typeof updateGameTimeAndCycleDisplay === 'function') updateGameTimeAndCycleDisplay();

    if (!window.gameState.isDay) {
        if (typeof showNightAssaultVideo === 'function') showNightAssaultVideo();
        else console.warn("showNightAssaultVideo function not found in forceCycleChange.");
        if(typeof addLogEntry === 'function') addLogEntry("L'activité hostile augmente... Préparez les défenses!", "warning", window.eventLogEl, window.gameState.eventLog);
        if(typeof startNightAssault === 'function') startNightAssault();
        else console.error("ERREUR: startNightAssault n'est pas défini dans forceCycleChange");
    } else {
        if (typeof hideNightAssaultVideo === 'function') hideNightAssaultVideo();
        else console.warn("hideNightAssaultVideo function not found in forceCycleChange.");
        if(typeof addLogEntry === 'function') addLogEntry("L'activité hostile diminue avec l'aube.", "info", window.eventLogEl, window.gameState.eventLog);
        if(typeof endNightAssault === 'function') endNightAssault();
        else console.error("ERREUR: endNightAssault n'est pas défini dans forceCycleChange");
    }
    if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
    if(typeof calculateBaseStats === 'function') calculateBaseStats();
}
window.forceCycleChange = forceCycleChange;

console.log("gameplayLogic_resources_time.js - Fonctions de gestion ressources/temps définies.");