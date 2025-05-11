// js/uiUpdates.js
// console.log("uiUpdates.js - Fichier chargé.");

function updateResourceDisplay() {
    if(biomassEl) biomassEl.textContent = Math.floor(gameState.resources.biomass);
    if(nanitesEl) nanitesEl.textContent = Math.floor(gameState.resources.nanites);
    const crystalShardsDisplayContainer = document.getElementById('crystal-shards-display-container');
    const crystalShardsDisplay = document.getElementById('crystal_shards');
    if(gameState.resources.crystal_shards !== undefined && gameState.resources.crystal_shards > 0){
        if(crystalShardsDisplayContainer && crystalShardsDisplayContainer.classList.contains('hidden')) crystalShardsDisplayContainer.classList.remove('hidden');
        if(crystalShardsDisplay) crystalShardsDisplay.textContent = Math.floor(gameState.resources.crystal_shards);
    } else {
        if(crystalShardsDisplayContainer && !crystalShardsDisplayContainer.classList.contains('hidden')) crystalShardsDisplayContainer.classList.add('hidden');
    }
    if(energyEl) energyEl.textContent = Math.floor(gameState.resources.energy);
    if(biomassRateEl) biomassRateEl.textContent = gameState.productionRates.biomass.toFixed(1);
    if(nanitesRateEl) nanitesRateEl.textContent = gameState.productionRates.nanites.toFixed(1);
    if(energyCapacityEl) energyCapacityEl.textContent = gameState.capacity.energy;
    if(energyCostMoveEl) energyCostMoveEl.textContent = EXPLORATION_COST_ENERGY;
}

function updateBuildingDisplay() {
    if(!buildingsSection) { /* console.warn("updateBuildingDisplay: buildingsSection non trouvé.");*/ return; }
    buildingsSection.innerHTML = '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Modules Structurels & Défensifs</h2>';
    for (const id in buildingsData) {
        const building = buildingsData[id];
        const level = gameState.buildings[id] || 0;
        const currentLevelData = level > 0 && building.levels ? building.levels[level - 1] : null;
        const nextLevelDefinition = building.levels ? building.levels[level] : null;

        const div = document.createElement('div');
        div.className = 'mb-4 p-3 bg-gray-800 rounded shadow';
        let content = `<h3 class="text-lg font-semibold ${building.type === 'defense' ? 'text-yellow-400' : 'text-blue-400'}">${building.name} (Niv. ${level})</h3>`;
        content += `<p class="text-sm text-gray-400 mb-1">${building.description}</p>`;

        if (currentLevelData) {
            content += `<p class="text-xs text-gray-500">Effet actuel: `;
            let effects = [];
            if (currentLevelData.production) { effects.push(...Object.entries(currentLevelData.production).map(([res, val]) => `${val}/s ${res}`)); }
            if (currentLevelData.capacity) { effects.push(...Object.entries(currentLevelData.capacity).map(([res, val]) => `+${val} Cap. ${res}`)); }
            if (currentLevelData.researchSpeedFactor) { effects.push(`Vitesse Rech. x${currentLevelData.researchSpeedFactor}`); }
            if (currentLevelData.grantsModule && nanobotModulesData[currentLevelData.grantsModule]) { effects.push(`Débloque: ${nanobotModulesData[currentLevelData.grantsModule].name}`); }
            if (building.type === 'defense' && currentLevelData.stats) {
                let defenseStatsString = `Att: ${currentLevelData.stats.attack || 0}`;
                if (currentLevelData.stats.damageType) {
                    defenseStatsString += ` (${currentLevelData.stats.damageType.charAt(0).toUpperCase() + currentLevelData.stats.damageType.slice(1)})`;
                }
                defenseStatsString += `, PV: ${currentLevelData.stats.health}`;
                effects.push(defenseStatsString);
            }
            if (building.type === 'defense' && currentLevelData.baseHealthBonus) { effects.push(`PV Noyau: +${currentLevelData.baseHealthBonus}`); }
            content += effects.join(', ') || "Aucun";
            content += ` / Cons.: ${currentLevelData.energyConsumption || 0} Énergie</p>`;
        }

        if (nextLevelDefinition) {
            const costForNext = nextLevelDefinition.costToUpgrade || nextLevelDefinition.costToUnlockOrUpgrade;
            if (costForNext && typeof costForNext === 'object') {
                const canAfford = Object.entries(costForNext).every(([res, val]) => {
                    if (itemsData[res]) return (gameState.inventory.filter(itemId => itemId === res).length || 0) >= val;
                    return (gameState.resources[res] || 0) >= val;
                });
                let costString = Object.entries(costForNext).map(([res, val]) => `${val} ${itemsData[res] ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
                content += `<button onclick="build('${id}')" class="btn ${canAfford ? (building.type === 'defense' ? 'btn-warning' : 'btn-primary') : 'btn-disabled'} mt-2 text-sm w-full" ${!canAfford ? 'disabled' : ''}>${level === 0 ? 'Débloquer Tech.' : 'Améliorer Tech.'} (Coût: ${costString})</button>`;
            }
        } else if (level > 0 && building.type !== 'defense' && building.levels && level >= building.levels.length) { // Check if max level for non-defense
             content += `<p class="text-sm text-green-400 mt-2">Technologie Max Atteinte</p>`;
        }


        if (building.type === 'defense' && level > 0) {
            const placementCostString = Object.entries(building.placementCost || {}).map(([res,val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
            content += `<button onclick="enterPlacementMode('${id}')" class="btn btn-success btn-sm mt-1 w-full">Placer ${building.name} (Niv.${level}) (Coût: ${placementCostString})</button>`;
        }

        div.innerHTML = content;
        buildingsSection.appendChild(div);
    }
}

function updateResearchDisplay() {
    if(!researchSection) return;
    researchSection.innerHTML = '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Arbre Technologique</h2>';
    if (gameState.activeResearch && researchData[gameState.activeResearch.id]) {
        const research = researchData[gameState.activeResearch.id];
        const labLevel = gameState.buildings['researchLab'] || 0;
        const researchSpeedFactor = labLevel > 0 && buildingsData['researchLab'] && buildingsData['researchLab'].levels[labLevel-1] ? buildingsData['researchLab'].levels[labLevel - 1].researchSpeedFactor : 0.5;
        const actualResearchTime = research.time / researchSpeedFactor;
        const timeElapsed = gameState.gameTime - gameState.activeResearch.startTime;
        const timeRemaining = Math.max(0, Math.ceil(actualResearchTime - timeElapsed));
        const progress = Math.min(100, (actualResearchTime > 0 ? (timeElapsed / actualResearchTime) : 0) * 100);
        researchSection.innerHTML += `<div class="mb-4 p-3 bg-gray-800 rounded shadow"><h3 class="text-lg font-semibold text-yellow-400">En cours: ${research.name}</h3><p class="text-sm text-gray-400 mb-1">${research.description}</p><div class="w-full bg-gray-700 rounded-full h-2.5 mb-1"><div class="bg-blue-500 h-2.5 rounded-full" style="width: ${progress}%"></div></div><p class="text-sm text-gray-300">Temps: ${formatTime(timeRemaining)}</p></div>`;
    }
    for (const id in researchData) {
        const research = researchData[id];
        if (gameState.research[id]) { researchSection.innerHTML += `<div class="mb-2 p-3 bg-gray-700 rounded opacity-70"><h3 class="text-md font-semibold text-green-400">${research.name} (Terminé)</h3><p class="text-xs text-gray-500">${research.description}</p></div>`; continue; }
        if (gameState.activeResearch && gameState.activeResearch.id === id) continue;
        let canResearch = true; let requirementText = [];
        const costEntries = Object.entries(research.cost);
        costEntries.forEach(([res, val]) => { if ((gameState.resources[res] || 0) < val) canResearch = false; });
        let costString = costEntries.map(([res, val]) => `${val} ${res}`).join(', ');
        if (research.requirements) {
            if (research.requirements.buildings) { Object.entries(research.requirements.buildings).forEach(([bId, rLvl]) => { if ((gameState.buildings[bId] || 0) < rLvl) { canResearch = false; requirementText.push(`${buildingsData[bId].name} Niv. ${rLvl}`); } }); }
            if (research.requirements.research) { research.requirements.research.forEach(rId => { if (!gameState.research[rId]) { canResearch = false; requirementText.push(`Rech.: ${researchData[rId].name}`); } }); }
        }
        let effectsText = [];
        if (research.grantsModule && nanobotModulesData[research.grantsModule]) { effectsText.push(`Module: ${nanobotModulesData[research.grantsModule].name}`); }
        if (research.grantsStatBoost) { effectsText.push(...Object.entries(research.grantsStatBoost).map(([stat, val]) => `${stat.replace('base', '')}: +${val}`)); }
        const div = document.createElement('div');
        div.className = 'mb-4 p-3 bg-gray-800 rounded shadow';
        let content = `<h3 class="text-lg font-semibold text-blue-400">${research.name}</h3>`;
        content += `<p class="text-sm text-gray-400 mb-1">${research.description}</p>`;
        if (effectsText.length > 0) content += `<p class="text-xs text-green-300 mb-1">Effet: ${effectsText.join(', ')}.</p>`;
        content += `<p class="text-xs text-gray-500 mb-1">Coût: ${costString}. Temps: ${formatTime(research.time)}.</p>`;
        if (requirementText.length > 0) content += `<p class="text-xs text-yellow-500 mb-1">Prérequis: ${requirementText.join(', ')}.</p>`;
        content += `<button onclick="startResearch('${id}')" class="btn ${canResearch && !gameState.activeResearch ? 'btn-primary' : 'btn-disabled'} mt-2 text-sm w-full" ${(!canResearch || gameState.activeResearch) ? 'disabled' : ''}>Lancer</button>`;
        div.innerHTML = content;
        researchSection.appendChild(div);
    }
}

function updateNanobotModulesDisplay() {
    const container = equippedModulesDisplayEl;
    if (!container) { /* console.warn("equippedModulesDisplayEl non trouvé"); */ return; }
    container.innerHTML = '<h3 class="font-orbitron text-lg mb-2 text-blue-200">Modules du Nanobot</h3>';
    let hasModules = false;
    for (const moduleId in nanobotModulesData) {
        const moduleData = nanobotModulesData[moduleId];
        let isUnlocked = false;
        let currentLevel = gameState.nanobotModuleLevels[moduleId] || 0;
        if (moduleData.unlockMethod.research && gameState.research[moduleData.unlockMethod.research]) { isUnlocked = true; }
        else if (moduleData.unlockMethod.building && buildingsData[moduleData.unlockMethod.building] && (gameState.buildings[moduleData.unlockMethod.building] || 0) >= moduleData.unlockMethod.buildingLevel) { isUnlocked = true; }

        let isReplacedByActiveHigherTier = false;
        for (const checkId in nanobotModulesData) { if (nanobotModulesData[checkId].replaces === moduleId && gameState.nanobotModuleLevels[checkId] > 0) { isReplacedByActiveHigherTier = true; break; } }
        if(isReplacedByActiveHigherTier && currentLevel === 0) continue;

        if (isUnlocked || currentLevel > 0) {
            hasModules = true;
            const moduleDiv = document.createElement('div');
            moduleDiv.className = 'panel p-3 mb-3 bg-gray-700';
            let content = `<h4 class="font-semibold text-blue-300">${moduleData.name} (Niv. ${currentLevel})</h4>`;
            content += `<p class="text-xs text-gray-400 mb-1">${moduleData.description}</p>`;
            if (currentLevel > 0) {
                const currentLevelData = moduleData.levels.find(l => l.level === currentLevel);
                if (currentLevelData && currentLevelData.statBoost) { content += `<p class="text-xs text-green-300">Actuel: ${Object.entries(currentLevelData.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase() + s.slice(1)}: +${v}`).join(', ')}</p>`; }
            } else { content += `<p class="text-xs text-yellow-400">Non activé.</p>`; }
            const nextLevelData = moduleData.levels.find(l => l.level === currentLevel + 1);
            const costDataForNextLevel = currentLevel === 0 ? moduleData.levels[0].costToUnlockOrUpgrade : (nextLevelData ? nextLevelData.costToUpgrade : null) ;

            if (costDataForNextLevel && (currentLevel < moduleData.levels.length)) {
                 let costString = Object.entries(costDataForNextLevel).map(([res, val]) => `${val} ${itemsData[res] ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
                let canAfford = true;
                for(const res in costDataForNextLevel) {
                    if (itemsData[res]) { const countInInventory = gameState.inventory.filter(itemId => itemId === res).length; if (countInInventory < costDataForNextLevel[res]) canAfford = false; }
                    else { if ((gameState.resources[res] || 0) < costDataForNextLevel[res]) canAfford = false; }
                    if (!canAfford) break;
                }
                const buttonText = currentLevel === 0 ? "Activer/Fabriquer" : "Améliorer";
                if (nextLevelData && nextLevelData.statBoost) { content += `<p class="text-xs text-gray-500 mt-1">Prochain Niv (${nextLevelData.level}): ${Object.entries(nextLevelData.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase() + s.slice(1)}: +${v}`).join(', ')}</p>`; }
                content += `<p class="text-xs text-yellow-500">Coût: ${costString}</p>`;
                content += `<button class="btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-xs mt-2" onclick="upgradeNanobotModule('${moduleId}')" ${!canAfford || isReplacedByActiveHigherTier ? 'disabled' : ''}>${buttonText}</button>`;
            } else if (currentLevel > 0) { content += `<p class="text-sm text-green-400 mt-1">Niveau Max Atteint</p>`; }
            moduleDiv.innerHTML = content;
            container.appendChild(moduleDiv);
        }
    }
    if (!hasModules) { container.innerHTML += "<p class='text-sm text-gray-500 italic'>Aucun module débloqué ou activé.</p>"; }
}

function updateNanobotDisplay() {
    if(nanobotHealthEl) nanobotHealthEl.textContent = `${Math.floor(gameState.nanobotStats.currentHealth)} / ${gameState.nanobotStats.health}`;
    if(nanobotAttackEl) nanobotAttackEl.textContent = gameState.nanobotStats.attack;
    if(nanobotDefenseEl) nanobotDefenseEl.textContent = gameState.nanobotStats.defense;
    if(nanobotSpeedEl) nanobotSpeedEl.textContent = gameState.nanobotStats.speed;
    if(nanobotVisualBody) nanobotVisualBody.innerHTML = '';

    for (const moduleId in gameState.nanobotModuleLevels) {
        const currentLevel = gameState.nanobotModuleLevels[moduleId];
        if (currentLevel > 0) {
            const moduleData = nanobotModulesData[moduleId];
            if (moduleData && nanobotVisualBody) {
                if (moduleData.visualClass) { const visualEl = document.createElement('div'); visualEl.className = `nanobot-module ${moduleData.visualClass}`; nanobotVisualBody.appendChild(visualEl); }
                else if (moduleData.visualClasses) { moduleData.visualClasses.forEach(className => { const visualEl = document.createElement('div'); visualEl.className = `nanobot-module ${className}`; nanobotVisualBody.appendChild(visualEl); }); }
            }
        }
    }
    let equippedItemsNames = [];
    for (const slot in gameState.nanobotEquipment) {
        const itemId = gameState.nanobotEquipment[slot];
        if (itemId && itemsData[itemId]) {
            const item = itemsData[itemId];
            equippedItemsNames.push(item.name);
            if (item.visualClass && nanobotVisualBody) { const visualEl = document.createElement('div'); visualEl.className = `nanobot-item-visual ${item.visualClass}`; nanobotVisualBody.appendChild(visualEl); }
        }
    }
    if(equippedItemsDisplayBriefEl) equippedItemsDisplayBriefEl.textContent = equippedItemsNames.length > 0 ? `Équipement: ${equippedItemsNames.join(', ')}` : "Aucun équipement.";

    if(typeof updateEquippedItemsDisplay === 'function') updateEquippedItemsDisplay();
    if(typeof updateNanobotModulesDisplay === 'function') updateNanobotModulesDisplay();
}

function updateEquippedItemsDisplay() {
    if(!nanobotEquipmentSlotsEl) return;
    nanobotEquipmentSlotsEl.innerHTML = '';
    for (const slotId in EQUIPMENT_SLOTS) { const slotName = EQUIPMENT_SLOTS[slotId]; const itemId = gameState.nanobotEquipment[slotId]; const item = itemId ? itemsData[itemId] : null; const slotDiv = document.createElement('div'); slotDiv.className = 'equipment-slot'; let content = `<div class="item-details"><span class="slot-name">${slotName}:</span> `; if (item) { content += `<span class="equipped-item-name">${item.name}</span>`; let itemEffects = []; if (item.statBoost) { itemEffects.push(Object.entries(item.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v > 0 ? '+' : ''}${v}`).join(', ')); } if (item.damageType) { itemEffects.push(`Type Dégât: ${item.damageType.charAt(0).toUpperCase() + item.damageType.slice(1)}`); } if (itemEffects.length > 0) { content += `<span class="item-stats ml-2">(${itemEffects.join('; ')})</span>`; } } else { content += `<span class="empty-slot">Vide</span>`; } content += `</div>`; if (item) { content += `<button class="btn btn-secondary btn-sm" onclick="unequipItem('${slotId}')">Retirer</button>`; } slotDiv.innerHTML = content; nanobotEquipmentSlotsEl.appendChild(slotDiv); }
}
function updateXpBar() {
    if(!xpBarEl) return;
    const stats = gameState.nanobotStats; if (!stats.level) return; const percent = (stats.xpToNext > 0 ? (stats.xp / stats.xpToNext) : 0) * 100; xpBarEl.style.width = percent + "%";
}

function updateBaseStatusDisplay() {
    if(!baseHealthValueEl || !baseMaxHealthValueEl || !overviewBaseHealthEl || !baseHealthBarEl || !baseDefensePowerEl || !repairBaseBtn || !repairDefensesBtn || !activeDefensesDisplayEl || !overviewContentElTab || !baseHealthDisplayEl ) {
        return;
    }
    const base = gameState.baseStats;
    baseHealthValueEl.textContent = Math.floor(base.currentHealth);
    baseMaxHealthValueEl.textContent = base.maxHealth;
    overviewBaseHealthEl.textContent = `${Math.floor(base.currentHealth)} / ${base.maxHealth}`;
    const healthPercent = (base.maxHealth > 0 ? (base.currentHealth / base.maxHealth) : 0) * 100;
    baseHealthBarEl.style.width = `${healthPercent}%`;
    baseHealthBarEl.classList.remove('low', 'medium');
    if (healthPercent < 30) baseHealthBarEl.classList.add('low');
    else if (healthPercent < 60) baseHealthBarEl.classList.add('medium');

    baseDefensePowerEl.textContent = `Puissance Défensive: ${base.defensePower}`;
    repairBaseBtn.disabled = gameState.baseStats.currentHealth >= gameState.baseStats.maxHealth;
    let hasDamagedDefenses = false;
    for (const defId in gameState.defenses) { if (gameState.defenses[defId].currentHealth < gameState.defenses[defId].maxHealth) { hasDamagedDefenses = true; break; } }
    repairDefensesBtn.disabled = !hasDamagedDefenses;

    let defenseDetails = [];
    for (const instanceId in gameState.defenses) { // Iterate over instance IDs
        const defense = gameState.defenses[instanceId];
        defenseDetails.push(`${defense.name} Niv.${defense.level} (PV: ${Math.floor(defense.currentHealth)}/${defense.maxHealth}, Att: ${defense.attack || 0})`);
    }
    activeDefensesDisplayEl.innerHTML = defenseDetails.length > 0 ? `<strong>Défenses Actives:</strong><br>` + defenseDetails.join('<br>') : "<strong>Aucune défense active.</strong>";

    overviewContentElTab.classList.toggle('night-assault-active', gameState.nightAssault.isActive);
    baseHealthDisplayEl.classList.toggle('text-red-400', gameState.nightAssault.isActive);
    baseHealthDisplayEl.classList.toggle('font-bold', gameState.nightAssault.isActive);

    if(typeof updateBasePreview === 'function') updateBasePreview();
}

function updateBasePreview() {
    const previewContainer = basePreviewContainerEl;
    if (!previewContainer) return;

    previewContainer.innerHTML = '';
    previewContainer.style.gridTemplateRows = `repeat(${BASE_GRID_SIZE.rows}, 1fr)`;
    previewContainer.style.gridTemplateColumns = `repeat(${BASE_GRID_SIZE.cols}, 1fr)`;

    const cellWidth = previewContainer.offsetWidth / BASE_GRID_SIZE.cols;
    const cellHeight = previewContainer.offsetHeight / BASE_GRID_SIZE.rows;

    for (let r = 0; r < BASE_GRID_SIZE.rows; r++) {
        for (let c = 0; c < BASE_GRID_SIZE.cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'map-tile base-preview-cell'; // Added base-preview-cell for common styling
            // cell.style.width = `100%`; // Not needed if using grid properly
            // cell.style.height = `100%`;
            // cell.style.backgroundColor = '#222938'; // Moved to CSS
            // cell.style.border = '1px dashed #4a5568'; // Moved to CSS
            cell.dataset.row = r;
            cell.dataset.col = c;
            const coreRow = Math.floor(BASE_GRID_SIZE.rows / 2);
            const coreCol = Math.floor(BASE_GRID_SIZE.cols / 2);
            if (r === coreRow && c === coreCol) {
                cell.classList.add('core'); // CSS will style this
                cell.innerHTML = `<div class="base-core-visual" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">N</div>`;
                cell.id = 'base-core-visual-cell';
            } else {
                const defenseOnCell = gameState.baseGrid[r] && gameState.baseGrid[r][c];
                if (defenseOnCell && defenseOnCell.instanceId && gameState.defenses[defenseOnCell.instanceId]) {
                     cell.classList.add('occupied');
                    if (gameState.placementMode.isActive) {
                        cell.classList.add('placement-blocked');
                    }
                } else if (gameState.placementMode.isActive) {
                    cell.classList.add('placement-active');
                    cell.title = `Placer ${buildingsData[gameState.placementMode.selectedDefenseType]?.name || 'défense'}`;
                }
            }
            if(typeof handleGridCellClick === 'function') {
                cell.addEventListener('click', () => handleGridCellClick(r, c));
            }
            previewContainer.appendChild(cell);
        }
    }

    for (const instanceId in gameState.defenses) {
        const defenseState = gameState.defenses[instanceId];
        const buildingDef = buildingsData[defenseState.id];
        if (defenseState.currentHealth > 0 && buildingDef && defenseState.gridPos) {
            const defenseVisual = document.createElement('div');
            defenseVisual.classList.add('defense-visual');
            if(buildingDef) defenseVisual.classList.add(defenseState.id); // e.g. 'laserTurret'
            defenseVisual.textContent = `L${defenseState.level}`;
            const healthPercentage = (defenseState.maxHealth > 0 ? (defenseState.currentHealth / defenseState.maxHealth) : 0) * 100;
            defenseVisual.style.opacity = 0.6 + (healthPercentage / 250); // Keep opacity logic
            // Simplified color logic (can be further refined with classes)
            if (healthPercentage < 30) defenseVisual.style.backgroundColor = '#e53e3e';
            else if (healthPercentage < 60) defenseVisual.style.backgroundColor = '#ecc94b';
            // else if (buildingDef && buildingDef.name.toLowerCase().includes("wall")) defenseVisual.style.backgroundColor = '#718096'; // Or use class
            // else defenseVisual.style.backgroundColor = '#fbd38d'; // Or use class
            // Default color will be handled by .defense-visual.{id} class

            defenseVisual.style.position = 'absolute';
            const visualWidth = parseInt(getComputedStyle(defenseVisual).width) || 20; // Get actual width
            const visualHeight = parseInt(getComputedStyle(defenseVisual).height) || 20; // Get actual height

            defenseVisual.style.left = `${defenseState.gridPos.c * cellWidth + (cellWidth / 2) - (visualWidth / 2)}px`;
            defenseVisual.style.top = `${defenseState.gridPos.r * cellHeight + (cellHeight / 2) - (visualHeight / 2)}px`;
            previewContainer.appendChild(defenseVisual);
        }
    }

    if (nightAssaultEnemiesDisplayEl && previewContainer) { // Check previewContainer for enemy placement
        if (gameState.nightAssault.isActive && gameState.nightAssault.enemies.length > 0) {
            // Clear only enemy visuals from previewContainer if they were added there
            const existingEnemyVisuals = previewContainer.querySelectorAll('.base-enemy-visual, .boss-visual-dynamic');
            existingEnemyVisuals.forEach(ev => ev.remove());

            gameState.nightAssault.enemies.forEach(enemy => {
                if(!enemy || !enemy.typeInfo) return;
                const enemyVisual = document.createElement('div');
                const isBoss = enemy.isBoss;

                if (isBoss) {
                    enemyVisual.classList.add('boss-visual-dynamic'); // New class for bosses
                    if (enemy.typeInfo.visualSize) {
                        enemyVisual.style.width = `${enemy.typeInfo.visualSize.width}px`;
                        enemyVisual.style.height = `${enemy.typeInfo.visualSize.height}px`;
                    }
                } else {
                    enemyVisual.classList.add('base-enemy-visual');
                    // Add specific enemy type class for styling via CSS
                    if (enemy.typeInfo.id === 'swarm_drone') enemyVisual.classList.add('drone');
                    else if (enemy.typeInfo.id === 'assault_bot') enemyVisual.classList.add('bot');
                    else if (enemy.typeInfo.id === 'heavy_crawler') enemyVisual.classList.add('crawler');
                }

                if (enemy.typeInfo.spritePath && enemy.typeInfo.spritePath.startsWith('http')) {
                    enemyVisual.style.backgroundImage = `url('${enemy.typeInfo.spritePath}')`;
                }
                // backgroundColor will be handled by CSS classes like .drone, .bot, .crawler

                enemyVisual.style.position = 'absolute';
                const visualWidth = parseInt(enemyVisual.style.width) || (isBoss ? 30 : 8); // Use defined size or default
                const visualHeight = parseInt(enemyVisual.style.height) || (isBoss ? 30 : 8);
                enemyVisual.style.left = `${enemy.x - (visualWidth / 2)}px`;
                enemyVisual.style.top = `${enemy.y - (visualHeight / 2)}px`;
                enemyVisual.title = `${enemy.typeInfo.name} (PV: ${Math.ceil(enemy.currentHealth)})`;
                previewContainer.appendChild(enemyVisual); // Add to preview container directly
            });
            nightAssaultEnemiesDisplayEl.innerHTML = ''; // Clear the old list display as enemies are now on the map
        } else if (gameState.nightAssault.isActive && gameState.nightAssault.enemies.length === 0 && gameState.baseStats.currentHealth > 0){
            nightAssaultEnemiesDisplayEl.innerHTML = `<p class="text-green-400 italic text-xs">Vague ennemie neutralisée. En attente...</p>`;
             const existingEnemyVisuals = previewContainer.querySelectorAll('.base-enemy-visual, .boss-visual-dynamic');
            existingEnemyVisuals.forEach(ev => ev.remove());
        } else {
            nightAssaultEnemiesDisplayEl.innerHTML = `<p class="text-gray-500 italic text-xs">Aucune menace détectée pour le moment.</p>`;
             const existingEnemyVisuals = previewContainer.querySelectorAll('.base-enemy-visual, .boss-visual-dynamic');
            existingEnemyVisuals.forEach(ev => ev.remove());
        }
    }
}


function updateZoneSelectionUI() {
    const zoneListContainer = zoneListContainerEl;
    if (!zoneListContainer) return;
    zoneListContainer.innerHTML = '';
    for (const zoneId in ZONE_DATA) {
        const zone = ZONE_DATA[zoneId];
        let isUnlocked = gameState.unlockedZones.includes(zoneId);
        // Condition for unlocking zones via research (already present in your main.js gameLoop)
        // No need to repeat it here unless this function is called before gameLoop updates gameState.unlockedZones

        if (isUnlocked) {
            const zoneDiv = document.createElement('div');
            zoneDiv.className = 'p-2 rounded hover:bg-gray-600 cursor-pointer ' + (gameState.currentZoneId === zoneId ? 'bg-blue-600 font-semibold' : 'bg-gray-800');
            zoneDiv.innerHTML = `<h4 class="text-md ${gameState.currentZoneId === zoneId ? 'text-white' : 'text-blue-200'}">${zone.name}</h4><p class="text-xs text-gray-400">${zone.description}</p>`;
            if (gameState.currentZoneId !== zoneId) {
                zoneDiv.title = `Voyager vers ${zone.name}`;
                if (zone.travelCost) { let costStr = Object.entries(zone.travelCost).map(([res,val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', '); zoneDiv.title += ` (Coût: ${costStr})`; }
                zoneDiv.onclick = () => { if(typeof attemptTravelToZone === 'function') attemptTravelToZone(zoneId); };
            } else { zoneDiv.title = "Zone actuelle"; }
            zoneListContainer.appendChild(zoneDiv);
        } else {
            const lockedZoneDiv = document.createElement('div');
            lockedZoneDiv.className = 'p-2 rounded bg-gray-900 opacity-50';
            let unlockText = "Condition de déblocage inconnue.";
            if (zone.unlockCondition && zone.unlockCondition.research && researchData[zone.unlockCondition.research]) { unlockText = `Débloqué via Recherche: ${researchData[zone.unlockCondition.research].name}`; }
            // Add other unlock conditions if any (e.g., item, level)
            lockedZoneDiv.innerHTML = `<h4 class="text-md text-gray-600">${zone.name} (Verrouillé)</h4><p class="text-xs text-gray-500">${unlockText}</p>`;
            zoneListContainer.appendChild(lockedZoneDiv);
        }
    }
}

// --- MODIFIED updateExplorationDisplay, getTileDisplayClass, getTileInfo ---
function updateExplorationDisplay() {
    if(!mapGridEl || !nanobotMapPosEl || !tileInfoDisplayEl || !explorationTitleEl) {
        return;
    }
    if(typeof updateZoneSelectionUI === 'function') updateZoneSelectionUI();
    const currentZone = ZONE_DATA[gameState.currentZoneId];
    if (!currentZone) { mapGridEl.innerHTML = "<p class='text-red-400'>Erreur: Zone d'exploration non trouvée.</p>"; return; }

    explorationTitleEl.textContent = `Carte d'Exploration: ${currentZone.name}`;
    mapGridEl.innerHTML = '';
    mapGridEl.style.gridTemplateRows = `repeat(${currentZone.mapSize.height}, 1fr)`;
    mapGridEl.style.gridTemplateColumns = `repeat(${currentZone.mapSize.width}, 1fr)`;

    // Ajouter le bouton Scanner s'il n'existe pas déjà
    let scanButton = document.getElementById('scan-map-button');
    if (!scanButton && explorationContentEl) { // Assurez-vous que explorationContentEl est défini
        scanButton = document.createElement('button');
        scanButton.id = 'scan-map-button';
        scanButton.textContent = 'Scanner Environs (10 Énergie)';
        scanButton.className = 'btn btn-info btn-sm mb-3'; // Adjust classes as needed
        scanButton.onclick = () => {
            if (typeof performScan === 'function') performScan();
        };
        // Insérer le bouton avant map-grid, ou à un endroit approprié
        const container = document.getElementById('exploration-content-container');
        if (container) {
            container.insertBefore(scanButton, mapGridEl);
        } else { // Fallback si le container n'est pas trouvé
            mapGridEl.parentNode.insertBefore(scanButton, mapGridEl);
        }
    }
    // Mettre à jour l'état du bouton Scanner (cooldown, énergie)
    if (scanButton) {
        const stats = gameState.nanobotStats;
        const scanCost = typeof SCAN_ENERGY_COST !== 'undefined' ? SCAN_ENERGY_COST : 10;
        const scanCooldownTime = typeof SCAN_COOLDOWN_DURATION !== 'undefined' ? SCAN_COOLDOWN_DURATION : 5 * (1000/TICK_SPEED) ; // Convertir en ticks

        const onCooldown = gameState.gameTime < (stats.lastScanTime || 0) + scanCooldownTime;
        const đủEnergy = gameState.resources.energy >= scanCost;

        if (onCooldown) {
            scanButton.textContent = `Scanner (Recharge: ${formatTime(Math.ceil((stats.lastScanTime || 0) + scanCooldownTime - gameState.gameTime))})`;
            scanButton.disabled = true;
             scanButton.classList.add('btn-disabled'); scanButton.classList.remove('btn-info');
        } else if (!đủEnergy) {
            scanButton.textContent = `Scanner (${scanCost} Énergie) - Insuffisant`;
            scanButton.disabled = true;
             scanButton.classList.add('btn-disabled'); scanButton.classList.remove('btn-info');
        } else {
            scanButton.textContent = `Scanner Environs (${scanCost} Énergie)`;
            scanButton.disabled = false;
             scanButton.classList.remove('btn-disabled'); scanButton.classList.add('btn-info');
        }
    }


    for (let y = 0; y < currentZone.mapSize.height; y++) {
        for (let x = 0; x < currentZone.mapSize.width; x++) {
            const tileDiv = document.createElement('div');
            tileDiv.classList.add('map-tile');
            const tileClasses = getTileDisplayClass(x, y); // This will now return multiple classes as a string
            if(tileClasses) tileDiv.className = `map-tile ${tileClasses}`; // Apply all classes

            tileDiv.dataset.x = x; tileDiv.dataset.y = y;
            tileDiv.addEventListener('click', () => {
                if(typeof handleTileClickExploration === 'function') handleTileClickExploration(x, y);
            });
            tileDiv.addEventListener('mouseover', () => { if(tileInfoDisplayEl) tileInfoDisplayEl.textContent = `(${x},${y}) ${getTileInfo(x,y)}`; });
            tileDiv.addEventListener('mouseout', () => { if(tileInfoDisplayEl) tileInfoDisplayEl.textContent = "Survolez une case explorée pour plus d'infos."; });
            mapGridEl.appendChild(tileDiv);
        }
    }
    nanobotMapPosEl.textContent = `(${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y}) dans ${currentZone.name}`;
}

function getTileDisplayClass(x, y) {
    const tile = gameState.map.tiles[y]?.[x];
    if (!tile) return 'unexplored unexplored-flat'; // Default for out of bounds or uninitialized

    const isNanobotCurrentPos = gameState.map.nanobotPos.x === x && gameState.map.nanobotPos.y === y;
    if (isNanobotCurrentPos) return 'nanobot';

    let classes = [];

    if (tile.isExplored) {
        classes.push('explored'); // Base class for explored tiles
        switch (tile.actualType) {
            case TILE_TYPES.EMPTY: break; // 'explored' is enough
            case TILE_TYPES.BASE: classes.push('base'); break;
            case TILE_TYPES.RESOURCE_BIOMASS: classes.push('resource-biomass'); break;
            case TILE_TYPES.RESOURCE_NANITES: classes.push('resource-nanites'); break;
            case TILE_TYPES.RESOURCE_CRYSTAL_SHARDS: classes.push('resource-crystal'); break;
            case TILE_TYPES.ENEMY_DRONE: case TILE_TYPES.ENEMY_SAURIAN:
            case TILE_TYPES.ENEMY_CRYSTAL_GOLEM: case TILE_TYPES.ENEMY_SPARK_WISP:
                classes.push('enemy'); break;
            case TILE_TYPES.UPGRADE_CACHE:
                classes.push(tile.content && tile.content.isOpened ? 'explored' : 'upgrade'); // Change if opened
                break;
            case TILE_TYPES.IMPASSABLE: classes.push('impassable explored-impassable'); break;
            case TILE_TYPES.IMPASSABLE_CRYSTAL: classes.push('impassable-crystal explored-impassable-crystal'); break;
            default: break; // 'explored' is enough
        }
    } else { // Not explored
        classes.push('unexplored'); // General filter for unexplored
        switch (tile.baseType) {
            case TILE_TYPES.IMPASSABLE: classes.push('unexplored-impassable'); break;
            case TILE_TYPES.IMPASSABLE_CRYSTAL: classes.push('unexplored-impassable-crystal'); break;
            default: classes.push('unexplored-flat'); break; // Default unexplored terrain
        }
        if (tile.structureType) {
            switch (tile.structureType) {
                case TILE_TYPES.RUIN_OUTLINE_VISIBLE: classes.push('unexplored-ruin-outline'); break;
                case TILE_TYPES.LARGE_CRYSTAL_VISIBLE: classes.push('unexplored-large-crystal'); break;
                // Add more visible structures here
            }
        }
        // Visuals for scanned tiles
        if (tile.isScanned && tile.scannedActualType) {
            classes.push('scanned');
            switch(tile.scannedActualType) {
                case TILE_TYPES.RESOURCE_BIOMASS: classes.push('scanned-actual-biomass'); break;
                case TILE_TYPES.RESOURCE_NANITES: classes.push('scanned-actual-nanites'); break;
                case TILE_TYPES.RESOURCE_CRYSTAL_SHARDS: classes.push('scanned-actual-crystal'); break;
                case TILE_TYPES.ENEMY_DRONE: case TILE_TYPES.ENEMY_SAURIAN:
                case TILE_TYPES.ENEMY_CRYSTAL_GOLEM: case TILE_TYPES.ENEMY_SPARK_WISP:
                    classes.push('scanned-actual-enemy'); break;
                case TILE_TYPES.UPGRADE_CACHE: classes.push('scanned-actual-upgrade'); break;
                case TILE_TYPES.EMPTY: classes.push('scanned-actual-empty'); break;
                // Add more types if needed
            }
        }
    }
    return classes.join(' ');
}

function getTileInfo(x,y) {
    const tile = gameState.map.tiles[y]?.[x];
    if (!tile) return "Hors limites.";

    if (tile.isExplored) {
        const actualType = tile.actualType;
        const content = tile.content;
        switch (actualType) {
            case TILE_TYPES.EMPTY: return "Zone vide.";
            case TILE_TYPES.BASE: return "Noyau Central - Zone sécurisée.";
            case TILE_TYPES.RESOURCE_BIOMASS: return `Dépôt de Biomasse (${content?.amount || 0}).`;
            case TILE_TYPES.RESOURCE_NANITES: return `Fragments de Nanites (${content?.amount || 0}).`;
            case TILE_TYPES.RESOURCE_CRYSTAL_SHARDS: return `Éclats de Cristal (${content?.amount || 0}).`;
            case TILE_TYPES.ENEMY_DRONE: case TILE_TYPES.ENEMY_SAURIAN:
            case TILE_TYPES.ENEMY_CRYSTAL_GOLEM: case TILE_TYPES.ENEMY_SPARK_WISP:
                return `Danger! ${content?.details?.name || "Entité hostile"} détecté.`;
            case TILE_TYPES.UPGRADE_CACHE: return content?.isOpened ? "Cache de matériaux (vide)." : "Cache de matériaux non ouverte.";
            case TILE_TYPES.IMPASSABLE: return "Terrain infranchissable.";
            case TILE_TYPES.IMPASSABLE_CRYSTAL: return "Formation cristalline infranchissable.";
            default: return "Zone explorée.";
        }
    } else { // Not explored
        let info = "Zone non explorée. ";
        if (tile.baseType === TILE_TYPES.IMPASSABLE) info += "Semble être un terrain infranchissable. ";
        else if (tile.baseType === TILE_TYPES.IMPASSABLE_CRYSTAL) info += "Grande formation cristalline bloquant le passage. ";
        else info += "Terrain plat ou inconnu. ";


        if (tile.structureType) {
            switch (tile.structureType) {
                case TILE_TYPES.RUIN_OUTLINE_VISIBLE: info += "Une silhouette de ruine se dessine. "; break;
                case TILE_TYPES.LARGE_CRYSTAL_VISIBLE: info += "Imposante structure cristalline visible. "; break;
            }
        }

        if (tile.isScanned && tile.scannedActualType) {
            info += `Scan récent : `;
            switch(tile.scannedActualType) {
                case TILE_TYPES.RESOURCE_BIOMASS: info += "Présence de Biomasse."; break;
                case TILE_TYPES.RESOURCE_NANITES: info += "Fragments de Nanites détectés."; break;
                case TILE_TYPES.RESOURCE_CRYSTAL_SHARDS: info += "Éclats de Cristal détectés."; break;
                case TILE_TYPES.ENEMY_DRONE: case TILE_TYPES.ENEMY_SAURIAN:
                case TILE_TYPES.ENEMY_CRYSTAL_GOLEM: case TILE_TYPES.ENEMY_SPARK_WISP:
                     const enemyName = explorationEnemyData[Object.keys(explorationEnemyData).find(k => explorationEnemyData[k].tileTypeEnum === tile.scannedActualType)]?.name || "Entité hostile";
                    info += `Signature hostile (${enemyName}).`; break;
                case TILE_TYPES.UPGRADE_CACHE: info += "Cache de matériaux probable."; break;
                case TILE_TYPES.EMPTY: info += "Aucun signal majeur."; break;
                default: info += "Type de signal inconnu."; break;
            }
        }
        return info.trim();
    }
}
// --- END OF MODIFIED UI Map functions ---

function drawLaserShot(startX, startY, endX, endY) {
    const previewContainer = basePreviewContainerEl;
    if (!previewContainer) return;
    const beam = document.createElement('div');
    beam.classList.add('laser-beam');
    const dx = endX - startX; const dy = endY - startY;
    const length = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    beam.style.width = `${length}px`;
    beam.style.left = `${startX}px`;
    beam.style.top = `${startY}px`;
    beam.style.transform = `rotate(${angle}deg)`;
    previewContainer.appendChild(beam);
    setTimeout(() => { if (beam.parentElement) { beam.remove(); } }, 150);
}

function managePlacedDefense(instanceId, row, col) {
    const defenseInstance = gameState.defenses[instanceId];
    if (!defenseInstance) return;
    const defenseTypeData = buildingsData[defenseInstance.id];
    if (!defenseTypeData || !defenseTypeData.levels) { console.error("Données de type de défense manquantes pour", defenseInstance.id); return; }
    let message = `<b>${defenseInstance.name} (Niv. ${defenseInstance.level})</b><br>`;
    message += `PV: ${Math.floor(defenseInstance.currentHealth)} / ${defenseInstance.maxHealth}<br>`;
    if (defenseInstance.attack > 0) message += `Attaque: ${defenseInstance.attack}<br>`;
    if (defenseInstance.damageType) message += `Type Dégât: ${defenseInstance.damageType.charAt(0).toUpperCase() + defenseInstance.damageType.slice(1)}<br>`;

    let canUpgradeThisInstance = false;
    const nextLevelData = defenseTypeData.levels.find(l => l.level === defenseInstance.level + 1);
    if (nextLevelData) {
        if ((gameState.buildings[defenseInstance.id] || 0) < nextLevelData.level) {
            message += `<span class="text-xs text-yellow-500">Améliorez la technologie ${defenseTypeData.name} au Niv. ${nextLevelData.level} pour améliorer cette instance.</span><br>`;
        } else {
            const upgradeCost = nextLevelData.costToUpgrade;
            if(upgradeCost && typeof upgradeCost === 'object'){
                let upgradeCostString = Object.entries(upgradeCost).map(([res, val]) => `${val} ${itemsData[res] ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
                message += `<span class="text-xs">Prochain Niv (${nextLevelData.level}): ${Object.entries(nextLevelData.stats || {}).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v}`).join(', ')}</span><br>`;
                message += `<span class="text-xs text-yellow-500">Coût Amélio. Instance: ${upgradeCostString}</span><br>`;
                canUpgradeThisInstance = true;
                for(const res in upgradeCost) {
                    if (itemsData[res]) { if (gameState.inventory.filter(itemId => itemId === res).length < upgradeCost[res]) canUpgradeThisInstance = false; }
                    else { if ((gameState.resources[res] || 0) < upgradeCost[res]) canUpgradeThisInstance = false; }
                    if(!canUpgradeThisInstance) break;
                }
            }
        }
    } else { message += `<span class="text-xs text-green-400">Niveau Max pour ce type.</span><br>`; }

    let totalInvestedBiomass = (defenseTypeData.placementCost ? defenseTypeData.placementCost.biomass : 0) || 0;
    let totalInvestedNanites = (defenseTypeData.placementCost ? defenseTypeData.placementCost.nanites : 0) || 0;
    // Recalcul du coût d'investissement pour les améliorations de l'instance
    for(let i = 1; i < defenseInstance.level; i++){
        const levelDataForUpgradeCost = defenseTypeData.levels.find(l => l.level === (i + 1));
        if(levelDataForUpgradeCost && levelDataForUpgradeCost.costToUpgrade){
            totalInvestedBiomass += levelDataForUpgradeCost.costToUpgrade.biomass || 0;
            totalInvestedNanites += levelDataForUpgradeCost.costToUpgrade.nanites || 0;
        }
    }
    const sellValueBiomass = Math.floor(totalInvestedBiomass * SELL_REFUND_FACTOR);
    const sellValueNanites = Math.floor(totalInvestedNanites * SELL_REFUND_FACTOR);
    message += `<span class="text-xs text-red-300">Vendre pour: ${sellValueBiomass} Bio, ${sellValueNanites} Nan</span>`;

    let modalButtonsHtml = `<div class="flex justify-end space-x-2 mt-4">`;
    if (nextLevelData && canUpgradeThisInstance) { modalButtonsHtml += `<button id="modal-upgrade-defense" class="btn btn-success btn-sm">Améliorer Instance</button>`; }
    modalButtonsHtml += `<button id="modal-sell-defense" class="btn btn-danger btn-sm">Vendre</button>`;
    modalButtonsHtml += `<button id="modal-defense-cancel" class="btn btn-secondary btn-sm">Annuler</button>`;
    modalButtonsHtml += `</div>`;

    showModal("Gestion de Défense", message + modalButtonsHtml, null, false);

    const modalUpgradeBtn = document.getElementById('modal-upgrade-defense');
    const modalSellBtn = document.getElementById('modal-sell-defense');
    const modalDefenseCancelBtn = document.getElementById('modal-defense-cancel');

    if (modalUpgradeBtn) { modalUpgradeBtn.onclick = () => { executeUpgradePlacedDefense(instanceId); hideModal(); }; }
    if (modalSellBtn) { modalSellBtn.onclick = () => { sellPlacedDefense(instanceId, row, col); hideModal(); }; }
    if (modalDefenseCancelBtn) { modalDefenseCancelBtn.onclick = hideModal; }
}

function updateDisplays() {
    if(typeof updateResourceDisplay === 'function') updateResourceDisplay();
    if(typeof updateBuildingDisplay === 'function') updateBuildingDisplay();
    if(typeof updateResearchDisplay === 'function') updateResearchDisplay();
    if(typeof updateNanobotDisplay === 'function') updateNanobotDisplay();
    // Inventory and Shop are updated when their tabs are clicked.
    // if(typeof updateInventoryDisplay === 'function') updateInventoryDisplay();
    // if(typeof updateShopDisplay === 'function') updateShopDisplay();
    if(typeof updateXpBar === 'function') updateXpBar();
    if(typeof updateBaseStatusDisplay === 'function') updateBaseStatusDisplay();
    if (typeof explorationContentEl !== 'undefined' && explorationContentEl && !explorationContentEl.classList.contains('hidden')) {
        if(typeof updateExplorationDisplay === 'function') updateExplorationDisplay();
    }
}
// console.log("uiUpdates.js - Fin du fichier.");