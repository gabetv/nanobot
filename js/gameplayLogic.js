// js/gameplayLogic.js

function calculateNanobotStats() { const stats = gameState.nanobotStats; stats.health = stats.baseHealth; stats.attack = stats.baseAttack; stats.defense = stats.baseDefense; stats.speed = stats.baseSpeed; gameState.activeModules = []; for (const researchId in gameState.research) { if (gameState.research[researchId] && researchData[researchId]) { const resData = researchData[researchId]; if (resData.grantsStatBoost) { for (const stat in resData.grantsStatBoost) { stats[stat] = (stats[stat] || 0) + resData.grantsStatBoost[stat]; } } if (resData.grantsModule && !gameState.activeModules.includes(resData.grantsModule)) { gameState.activeModules.push(resData.grantsModule); } } } for (const buildingId in gameState.buildings) { const level = gameState.buildings[buildingId]; if (level > 0) { const buildingDef = buildingsData[buildingId]; const levelData = buildingDef.levels[level-1]; if (levelData.grantsModule && nanobotModulesData[levelData.grantsModule] && !gameState.activeModules.includes(levelData.grantsModule)) { gameState.activeModules.push(levelData.grantsModule); } } } gameState.activeModules.forEach(moduleId => { const moduleData = nanobotModulesData[moduleId]; if (moduleData && moduleData.statBoost) { for (const stat in moduleData.statBoost) { stats[stat] = (stats[stat] || 0) + moduleData.statBoost[stat]; } } }); for (const slot in gameState.nanobotEquipment) { const itemId = gameState.nanobotEquipment[slot]; if (itemId && itemsData[itemId] && itemsData[itemId].statBoost) { const itemBoosts = itemsData[itemId].statBoost; for (const stat in itemBoosts) { stats[stat] = (stats[stat] || 0) + itemBoosts[stat]; } } } stats.currentHealth = Math.min(stats.currentHealth, stats.health); if (stats.currentHealth < 0) stats.currentHealth = 0; }

function calculateBaseStats() {
    let maxHealth = BASE_INITIAL_HEALTH; let defensePower = 0;
    for (const buildingId in gameState.buildings) {
        const level = gameState.buildings[buildingId];
        if (level > 0 && buildingsData[buildingId].type === 'defense') {
            const defData = buildingsData[buildingId]; const currentLevelData = defData.levels[level - 1];
            if (currentLevelData.stats) { if (gameState.defenses[buildingId] && gameState.defenses[buildingId].currentHealth > 0) { defensePower += gameState.defenses[buildingId].attack; } }
            if (currentLevelData.baseHealthBonus) { maxHealth += currentLevelData.baseHealthBonus; }
        }
    }
    if (gameState.nanobotStats.isDefendingBase && gameState.map.nanobotPos.x === BASE_COORDINATES.x && gameState.map.nanobotPos.y === BASE_COORDINATES.y) { defensePower += gameState.nanobotStats.attack; }
    gameState.baseStats.maxHealth = maxHealth; gameState.baseStats.defensePower = defensePower;
    gameState.baseStats.currentHealth = Math.min(gameState.baseStats.currentHealth, gameState.baseStats.maxHealth);
    if (gameState.baseStats.currentHealth <= 0 && gameState.baseStats.maxHealth > 0) { gameState.baseStats.currentHealth = 0; }
}

function calculateProductionAndConsumption() { gameState.productionRates.biomass = 0; gameState.productionRates.nanites = 0; let totalEnergyConsumption = 0; for (const buildingId in gameState.buildings) { const level = gameState.buildings[buildingId]; if (level > 0) { const buildingDef = buildingsData[buildingId]; const levelData = buildingDef.levels[level - 1]; if (buildingDef.type === "production") { if (levelData.production) { if (levelData.production.biomass) gameState.productionRates.biomass += levelData.production.biomass; if (levelData.production.nanites) gameState.productionRates.nanites += levelData.production.nanites; } } if (levelData.energyConsumption) totalEnergyConsumption += levelData.energyConsumption; } } gameState.capacity.energy = 50; const powerPlantLevel = gameState.buildings['powerPlant'] || 0; if (powerPlantLevel > 0) { gameState.capacity.energy += buildingsData['powerPlant'].levels[powerPlantLevel - 1].capacity.energy; } if (!gameState.isDay) { gameState.productionRates.biomass *= 0.7; gameState.productionRates.nanites *= 0.7; } gameState.resources.energy = totalEnergyConsumption; if (totalEnergyConsumption > gameState.capacity.energy) { const deficitFactor = gameState.capacity.energy > 0 ? gameState.capacity.energy / totalEnergyConsumption : 0; gameState.productionRates.biomass *= deficitFactor; gameState.productionRates.nanites *= deficitFactor; if (Math.random() < 0.1) addLogEntry("Surcharge énergétique! Production et défenses réduites.", "error"); gameState.baseStats.defensePower = Math.floor(gameState.baseStats.defensePower * deficitFactor); } }

function build(buildingId) { const building = buildingsData[buildingId]; const currentLevel = gameState.buildings[buildingId] || 0; if (currentLevel >= building.levels.length) { addLogEntry(`${building.name} est au niveau maximum.`, "info"); return; } const nextLevelData = building.levels[currentLevel]; for (const resource in nextLevelData.cost) { if (gameState.resources[resource] < nextLevelData.cost[resource]) { addLogEntry(`Ressources insuffisantes pour ${building.name}. Requis: ${nextLevelData.cost[resource]} ${resource}.`, "error"); return; } } const title = building.type === 'defense' ? `Construire/Améliorer ${building.name}?` : `Améliorer ${building.name}?`; showModal(title, `Passer ${building.name} au Niveau ${currentLevel + 1}?`, () => { for (const resource in nextLevelData.cost) gameState.resources[resource] -= nextLevelData.cost[resource]; gameState.buildings[buildingId] = currentLevel + 1; addLogEntry(`${building.name} ${building.type === 'defense' && currentLevel === 0 ? 'construit(e)' : 'amélioré(e)'} au Niveau ${currentLevel + 1}.`, "success"); if (nextLevelData.grantsModule) calculateNanobotStats(); if (building.type === 'defense') { if (nextLevelData.stats){ gameState.defenses[buildingId] = { id: buildingId, name: building.name, level: currentLevel + 1, currentHealth: nextLevelData.stats.health, maxHealth: nextLevelData.stats.health, attack: nextLevelData.stats.attack }; } calculateBaseStats(); } calculateProductionAndConsumption(); updateDisplays(); }); }

function startResearch(researchId) { if (activeResearch) { addLogEntry("Recherche en cours.", "info"); return; } if (gameState.research[researchId]) { addLogEntry("Technologie acquise.", "info"); return; } const research = researchData[researchId]; let labLevel = gameState.buildings['researchLab'] || 0; let researchSpeedFactor = labLevel > 0 ? buildingsData['researchLab'].levels[labLevel - 1].researchSpeedFactor : 0.5; for (const resource in research.cost) { if (gameState.resources[resource] < research.cost[resource]) { addLogEntry(`Ressources insuffisantes: ${research.name}.`, "error"); return; } } showModal(`Lancer ${research.name}?`, `Coût & Temps adaptés.`, () => { for (const resource in research.cost) gameState.resources[resource] -= research.cost[resource]; activeResearch = { id: researchId, startTime: gameState.gameTime, totalTime: research.time / researchSpeedFactor }; addLogEntry(`Recherche ${research.name} initiée.`, "success"); updateDisplays(); });}

function repairBase(amount = 10) { if (gameState.baseStats.currentHealth >= gameState.baseStats.maxHealth) { addLogEntry("Le Noyau est déjà à son intégrité maximale.", "info"); return; } const healthToRestore = Math.min(amount, gameState.baseStats.maxHealth - gameState.baseStats.currentHealth); const costBiomass = healthToRestore * REPAIR_COST_BASE_HEALTH_BIOMASS; const costNanites = healthToRestore * REPAIR_COST_BASE_HEALTH_NANITES; if (gameState.resources.biomass < costBiomass || gameState.resources.nanites < costNanites) { addLogEntry(`Ressources insuffisantes pour réparer le Noyau. Requis: ${costBiomass} Biomasse, ${costNanites} Nanites.`, "error"); return; } gameState.resources.biomass -= costBiomass; gameState.resources.nanites -= costNanites; gameState.baseStats.currentHealth += healthToRestore; addLogEntry(`Noyau réparé de ${healthToRestore} PV. (-${costBiomass} Bio, -${costNanites} Nan).`, "success"); updateResourceDisplay(); updateBaseStatusDisplay(); }

function repairAllDefenses() { let totalBiomassCost = 0; let totalHealthRestored = 0; let defensesToRepair = []; for (const defId in gameState.defenses) { const defense = gameState.defenses[defId]; if (defense.currentHealth < defense.maxHealth) { const healthNeeded = defense.maxHealth - defense.currentHealth; defensesToRepair.push({ defId, healthNeeded }); totalBiomassCost += healthNeeded * REPAIR_COST_DEFENSE_HEALTH_BIOMASS; } } if (defensesToRepair.length === 0) { addLogEntry("Toutes les défenses sont opérationnelles.", "info"); return; } if (gameState.resources.biomass < totalBiomassCost) { addLogEntry(`Ressources insuffisantes pour réparer toutes les défenses. Requis: ${totalBiomassCost} Biomasse.`, "error"); return; } gameState.resources.biomass -= totalBiomassCost; defensesToRepair.forEach(item => { gameState.defenses[item.defId].currentHealth += item.healthNeeded; totalHealthRestored += item.healthNeeded; }); addLogEntry(`Toutes les défenses endommagées ont été réparées (+${totalHealthRestored} PV total). (-${totalBiomassCost} Bio).`, "success"); calculateBaseStats(); updateResourceDisplay(); updateBaseStatusDisplay(); }

function toggleNanobotDefendBase() { gameState.nanobotStats.isDefendingBase = !gameState.nanobotStats.isDefendingBase; if (gameState.nanobotStats.isDefendingBase) { toggleNanobotDefendBaseBtn.textContent = "Désactiver Défense du Noyau"; toggleNanobotDefendBaseBtn.classList.remove('btn-secondary'); toggleNanobotDefendBaseBtn.classList.add('btn-warning'); addLogEntry("Nexus-7 en mode défense du Noyau. Retournez à la base pour être effectif.", "info"); if (gameState.map.nanobotPos.x === BASE_COORDINATES.x && gameState.map.nanobotPos.y === BASE_COORDINATES.y) { addLogEntry("Nexus-7 est positionné pour défendre le Noyau.", "success"); } } else { toggleNanobotDefendBaseBtn.textContent = "Activer Défense du Noyau"; toggleNanobotDefendBaseBtn.classList.add('btn-secondary'); toggleNanobotDefendBaseBtn.classList.remove('btn-warning'); addLogEntry("Nexus-7 n'est plus en mode défense active du Noyau.", "info"); } calculateBaseStats(); updateBaseStatusDisplay(); }

function updateGameTimeAndCycle() { 
    gameState.gameTime++; 
    gameState.currentCycleTime += TICK_SPEED; 
    const currentCycleDuration = gameState.isDay ? DAY_DURATION : NIGHT_DURATION; 
    if (gameState.currentCycleTime >= currentCycleDuration) { 
        forceCycleChange(true); // true pour indiquer que c'est un changement de cycle naturel
    } 
    gameTimeEl.textContent = formatTime(gameState.gameTime); 
    cycleStatusEl.textContent = `${gameState.isDay ? "Jour" : "Nuit"} (${formatTime(Math.floor((currentCycleDuration - gameState.currentCycleTime)/1000))})`; 
}

function forceCycleChange(isNaturalChange = false) {
    if (!isNaturalChange) {
        // Vérifier le coût si ce n'est pas un changement naturel
        if (gameState.resources.biomass < FORCE_CYCLE_CHANGE_COST.biomass || gameState.resources.nanites < FORCE_CYCLE_CHANGE_COST.nanites) {
            addLogEntry(`Ressources insuffisantes pour forcer le cycle. Requis: ${FORCE_CYCLE_CHANGE_COST.biomass} Biomasse, ${FORCE_CYCLE_CHANGE_COST.nanites} Nanites.`, "error");
            return;
        }
        gameState.resources.biomass -= FORCE_CYCLE_CHANGE_COST.biomass;
        gameState.resources.nanites -= FORCE_CYCLE_CHANGE_COST.nanites;
        addLogEntry(`Cycle forcé. (-${FORCE_CYCLE_CHANGE_COST.biomass} Bio, -${FORCE_CYCLE_CHANGE_COST.nanites} Nan).`, "warning");
        updateResourceDisplay();
    }

    gameState.isDay = !gameState.isDay; 
    gameState.currentCycleTime = 0; 
    addLogEntry(`Changement de cycle: C'est maintenant ${gameState.isDay ? 'le JOUR' : 'la NUIT'}.`, "info"); 
    if (!gameState.isDay) { 
        addLogEntry("L'activité hostile augmente... Préparez les défenses!", "warning"); 
        startNightAssault();
    } else { 
        addLogEntry("L'activité hostile diminue avec l'aube.", "info"); 
        endNightAssault();
    } 
    calculateProductionAndConsumption(); 
    calculateBaseStats(); 
    // Mettre à jour l'affichage du temps restant pour le nouveau cycle (déjà fait par updateGameTimeAndCycle dans la gameLoop)
}


// --- Night Assault Logic ---
function startNightAssault() {
    if (gameState.baseStats.currentHealth <= 0) { addLogEntry("Le Noyau est détruit. Impossible de subir un assaut.", "error", eventLogEl); gameState.nightAssault.isActive = false; return; }
    gameState.nightAssault.isActive = true; gameState.nightAssault.wave++; gameState.nightAssault.enemies = []; gameState.nightAssault.lastAttackTime = gameState.gameTime; 
    gameState.nightAssault.log = [`Début de l'assaut nocturne - Vague ${gameState.nightAssault.wave}`]; nightAssaultLogEl.innerHTML = ""; 
    const wave = gameState.nightAssault.wave; let numDrones = wave * 2 + Math.floor(Math.random() * wave * 1.5); let numBots = Math.floor(wave / 2.5) + Math.floor(Math.random() * (wave/2 +1)); let numCrawlers = Math.floor(wave / 3.5) + Math.floor(Math.random() * (wave/3+1) );
    if (numDrones > 0) gameState.nightAssault.enemies.push({ ...nightAssaultEnemies.find(e => e.id === 'swarm_drone'), count: numDrones, currentHealth: nightAssaultEnemies.find(e => e.id === 'swarm_drone').baseHealth * numDrones });
    if (numBots > 0) gameState.nightAssault.enemies.push({ ...nightAssaultEnemies.find(e => e.id === 'assault_bot'), count: numBots, currentHealth: nightAssaultEnemies.find(e => e.id === 'assault_bot').baseHealth * numBots });
    if (numCrawlers > 0 && wave > 1) gameState.nightAssault.enemies.push({ ...nightAssaultEnemies.find(e => e.id === 'heavy_crawler'), count: numCrawlers, currentHealth: nightAssaultEnemies.find(e => e.id === 'heavy_crawler').baseHealth * numCrawlers });
    let enemySummary = gameState.nightAssault.enemies.map(g => `${g.count} ${g.name}(s)`).join(', ');
    if (gameState.nightAssault.enemies.length === 0) enemySummary = "Vague de reconnaissance très faible"; 
    addLogEntry(`ALERTE! Vague ${gameState.nightAssault.wave} d'ennemis approche: ${enemySummary}.`, "error", eventLogEl); 
    addLogEntry(`Vague ${gameState.nightAssault.wave} en approche: ${enemySummary}.`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log); 
    updateBaseStatusDisplay(); 
}
function endNightAssault() {
    gameState.nightAssault.isActive = false;
    if (gameState.nightAssault.enemies.length > 0 && gameState.baseStats.currentHealth > 0) { let remainingEnemies = gameState.nightAssault.enemies.map(g => `${g.count} ${g.name}(s)`).join(', '); addLogEntry(`L'aube arrive. Les ennemis restants (${remainingEnemies}) se retirent.`, "base-defense-event", nightAssaultLogEl, gameState.nightAssault.log);
    } else if (gameState.baseStats.currentHealth > 0 && gameState.nightAssault.wave > 0) { addLogEntry(`Nuit ${gameState.nightAssault.wave} survivée ! Les défenses ont tenu.`, "success", nightAssaultLogEl, gameState.nightAssault.log);
    } else if (gameState.baseStats.currentHealth <=0) { addLogEntry(`Le Noyau a été détruit pendant la vague ${gameState.nightAssault.wave}.`, "error", nightAssaultLogEl, gameState.nightAssault.log); }
    gameState.nightAssault.enemies = []; updateBaseStatusDisplay();
}
function processNightAssaultTick() {
    if (!gameState.nightAssault.isActive || gameState.isDay || gameState.baseStats.currentHealth <= 0) return;
    if (gameState.gameTime < gameState.nightAssault.lastAttackTime + (NIGHT_ASSAULT_TICK_INTERVAL / TICK_SPEED)) return;
    gameState.nightAssault.lastAttackTime = gameState.gameTime;
    if (gameState.nightAssault.enemies.length === 0) { if (!gameState.isDay && gameState.nightAssault.isActive) { addLogEntry("Secteur calme...", "base-info-event", nightAssaultLogEl, gameState.nightAssault.log); } return; }

    let baseAttackPower = gameState.baseStats.defensePower; let enemiesDestroyedThisTickInfo = []; let totalBiomassReward = 0; let totalNaniteReward = 0;
    for (let i = gameState.nightAssault.enemies.length - 1; i >= 0; i--) {
        let enemyGroup = gameState.nightAssault.enemies[i]; if (baseAttackPower <= 0) break;
        let damageToGroup = Math.min(baseAttackPower, enemyGroup.currentHealth); enemyGroup.currentHealth -= damageToGroup; baseAttackPower -= damageToGroup;
        let numDefeatedInTick = Math.min(Math.floor(damageToGroup / enemyGroup.baseHealth), enemyGroup.count); enemyGroup.count -= numDefeatedInTick;
        if (numDefeatedInTick > 0) { enemiesDestroyedThisTickInfo.push(`${numDefeatedInTick} ${enemyGroup.name}(s)`); totalBiomassReward += enemyGroup.reward.biomass * numDefeatedInTick; totalNaniteReward += enemyGroup.reward.nanites * numDefeatedInTick; }
        if (enemyGroup.count <= 0) { gameState.nightAssault.enemies.splice(i, 1); } else { enemyGroup.currentHealth = enemyGroup.count * enemyGroup.baseHealth; }
    }
    if (enemiesDestroyedThisTickInfo.length > 0) { addLogEntry(`Défenses neutralisent: ${enemiesDestroyedThisTickInfo.join(', ')}.`, "base-defense-event", nightAssaultLogEl, gameState.nightAssault.log); if (totalBiomassReward > 0 || totalNaniteReward > 0) { gameState.resources.biomass += totalBiomassReward; gameState.resources.nanites += totalNaniteReward; addLogEntry(`Récupéré: +${totalBiomassReward} Biomasse, +${totalNaniteReward} Nanites.`, "success", nightAssaultLogEl, gameState.nightAssault.log); updateResourceDisplay(); } }

    let totalEnemyAttackAfterLosses = gameState.nightAssault.enemies.reduce((sum, group) => sum + (group.baseAttack * group.count), 0);
    if (totalEnemyAttackAfterLosses > 0 && gameState.nightAssault.enemies.length > 0) {
        let remainingEnemyAttack = totalEnemyAttackAfterLosses; let defensesTargetedLog = [];
        for (const defId in gameState.defenses) { if (remainingEnemyAttack <= 0) break; const defense = gameState.defenses[defId]; if (defense.currentHealth > 0) { const damageToThisDefense = Math.min(remainingEnemyAttack, defense.currentHealth); defense.currentHealth -= damageToThisDefense; remainingEnemyAttack -= damageToThisDefense; defensesTargetedLog.push(`${defense.name} (-${damageToThisDefense} PV, reste ${Math.floor(defense.currentHealth)})`); if (defense.currentHealth <= 0) { addLogEntry(`${defense.name} détruit(e)!`, "error", nightAssaultLogEl, gameState.nightAssault.log); calculateBaseStats(); calculateProductionAndConsumption(); } } }
        if (defensesTargetedLog.length > 0) { addLogEntry(`Assaut ennemi sur les défenses: ${defensesTargetedLog.join(', ')}.`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log); }

        let damageToCore = 0; let damageToNanobot = 0;
        if (remainingEnemyAttack > 0) {
            damageToCore = remainingEnemyAttack;
            if (gameState.nanobotStats.isDefendingBase && gameState.map.nanobotPos.x === BASE_COORDINATES.x && gameState.map.nanobotPos.y === BASE_COORDINATES.y && gameState.nanobotStats.currentHealth > 0) {
                damageToNanobot = Math.min(Math.floor(remainingEnemyAttack * 0.5), gameState.nanobotStats.currentHealth); damageToCore = remainingEnemyAttack - damageToNanobot;
                if (damageToNanobot > 0) { gameState.nanobotStats.currentHealth -= damageToNanobot; addLogEntry(`Nexus-7 intercepte ${damageToNanobot} dégâts! (PV: ${Math.floor(gameState.nanobotStats.currentHealth)}/${gameState.nanobotStats.health})`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log); updateNanobotDisplay(); if (gameState.nanobotStats.currentHealth <= 0) { addLogEntry("Nexus-7 est hors de combat!", "error", nightAssaultLogEl, gameState.nightAssault.log); calculateBaseStats(); } }
            }
            if (damageToCore > 0) { gameState.baseStats.currentHealth -= damageToCore; addLogEntry(`Le Noyau subit ${damageToCore} dégâts directs! (PV: ${Math.floor(gameState.baseStats.currentHealth)}/${gameState.baseStats.maxHealth})`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log); }
        }
        if (gameState.baseStats.currentHealth <= 0) { gameState.baseStats.currentHealth = 0; addLogEntry("ALERTE CRITIQUE! L'INTÉGRITÉ DU NOYAU EST COMPROMISE!", "error", nightAssaultLogEl, gameState.nightAssault.log); let biomassLoss = Math.floor(gameState.resources.biomass * 0.25); let naniteLoss = Math.floor(gameState.resources.nanites * 0.25); gameState.resources.biomass -= biomassLoss; gameState.resources.nanites -= naniteLoss; addLogEntry(`Perte de ressources: -${biomassLoss} Biomasse, -${naniteLoss} Nanites.`, "error", nightAssaultLogEl, gameState.nightAssault.log); addLogEntry("Le Noyau est détruit. L'assaut prend fin.", "error", eventLogEl); endNightAssault(); }
    }
    updateBaseStatusDisplay(); 
}