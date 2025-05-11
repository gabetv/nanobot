// js/uiUpdates.js
// alert("uiUpdates.js chargé !");

function updateResourceDisplay() { 
    if(biomassEl) biomassEl.textContent = Math.floor(gameState.resources.biomass); 
    if(nanitesEl) nanitesEl.textContent = Math.floor(gameState.resources.nanites); 
    // const crystalShardsDisplay = document.getElementById('crystal_shards'); 
    // if(crystalShardsDisplay) crystalShardsDisplay.textContent = Math.floor(gameState.resources.crystal_shards || 0); 
    if(energyEl) energyEl.textContent = Math.floor(gameState.resources.energy); 
    if(biomassRateEl) biomassRateEl.textContent = gameState.productionRates.biomass.toFixed(1); 
    if(nanitesRateEl) nanitesRateEl.textContent = gameState.productionRates.nanites.toFixed(1); 
    if(energyCapacityEl) energyCapacityEl.textContent = gameState.capacity.energy; 
    if(energyCostMoveEl) energyCostMoveEl.textContent = EXPLORATION_COST_ENERGY; 
}

function updateBuildingDisplay() { 
    if(!buildingsSection) return;
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
                const canAfford = Object.entries(costForNext).every(([res, val]) => (gameState.resources[res] || 0) >= val); 
                let costString = Object.entries(costForNext).map(([res, val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', '); 
                content += `<button onclick="build('${id}')" class="btn ${canAfford ? (building.type === 'defense' ? 'btn-warning' : 'btn-primary') : 'btn-disabled'} mt-2 text-sm w-full" ${!canAfford ? 'disabled' : ''}>${level === 0 ? 'Débloquer Tech.' : 'Améliorer Tech.'} (Coût: ${costString})</button>`; 
            }
        } else if (level > 0 && building.type !== 'defense') { 
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
    if (!container) return;
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
            const costData = currentLevel === 0 ? moduleData.levels[0] : nextLevelData; 
            if (costData && (currentLevel < moduleData.levels.length)) {
                let costToDisplay = currentLevel === 0 ? costData.costToUnlockOrUpgrade : costData.costToUpgrade;
                let costString = Object.entries(costToDisplay).map(([res, val]) => `${val} ${itemsData[res] ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
                let canAfford = true;
                for(const res in costToDisplay) {
                    if (itemsData[res]) { const countInInventory = gameState.inventory.filter(itemId => itemId === res).length; if (countInInventory < costToDisplay[res]) canAfford = false; } 
                    else { if ((gameState.resources[res] || 0) < costToDisplay[res]) canAfford = false; }
                    if (!canAfford) break;
                }
                const buttonText = currentLevel === 0 ? "Activer/Fabriquer" : "Améliorer";
                if (costData.statBoost) { content += `<p class="text-xs text-gray-500 mt-1">Prochain Niv (${costData.level}): ${Object.entries(costData.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase() + s.slice(1)}: +${v}`).join(', ')}</p>`; }
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
    for (const buildingId in gameState.defenses) { const defense = gameState.defenses[buildingId]; defenseDetails.push(`${defense.name} Niv.${defense.level} (PV: ${Math.floor(defense.currentHealth)}/${defense.maxHealth}, Att: ${defense.attack})`); }
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
            cell.className = 'map-tile'; 
            cell.style.backgroundColor = '#222938'; 
            cell.style.border = '1px dashed #4a5568'; 
            cell.dataset.row = r;
            cell.dataset.col = c;
            const coreRow = Math.floor(BASE_GRID_SIZE.rows / 2);
            const coreCol = Math.floor(BASE_GRID_SIZE.cols / 2);
            if (r === coreRow && c === coreCol) {
                cell.style.backgroundColor = '#48bb78'; 
                cell.innerHTML = `<div class="base-core-visual" style="position:relative; transform:none; top:auto; left:auto; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">N</div>`;
                cell.classList.add('base-core-cell');
                cell.id = 'base-core-visual-cell'; 
            } else {
                const defenseInstanceId = Object.keys(gameState.defenses).find(id => gameState.defenses[id].gridPos && gameState.defenses[id].gridPos.r === r && gameState.defenses[id].gridPos.c === c);
                if (defenseInstanceId) {
                    const defenseState = gameState.defenses[defenseInstanceId];
                    const buildingDef = buildingsData[defenseState.id];
                    cell.classList.add('defense-visual-cell'); 
                    const defenseVisual = document.createElement('div');
                    defenseVisual.classList.add('defense-visual');
                    if(buildingDef) defenseVisual.classList.add(defenseState.id); 
                    defenseVisual.textContent = `L${defenseState.level}`;
                    const healthPercentage = (defenseState.maxHealth > 0 ? (defenseState.currentHealth / defenseState.maxHealth) : 0) * 100;
                    defenseVisual.style.opacity = 0.6 + (healthPercentage / 250); 
                    if (healthPercentage < 30) defenseVisual.style.backgroundColor = '#e53e3e'; 
                    else if (healthPercentage < 60) defenseVisual.style.backgroundColor = '#ecc94b'; 
                    else if (buildingDef && buildingDef.name.toLowerCase().includes("wall")) defenseVisual.style.backgroundColor = '#718096';
                    else defenseVisual.style.backgroundColor = '#fbd38d'; 
                    defenseVisual.style.position = 'absolute';
                    defenseVisual.style.left = `${c * cellWidth + (cellWidth / 2) - 10}px`; 
                    defenseVisual.style.top = `${r * cellHeight + (cellHeight / 2) - 10}px`; 
                    previewContainer.appendChild(defenseVisual);
                } else if (gameState.placementMode.isActive) {
                    cell.style.cursor = 'copy';
                    cell.title = `Placer ${buildingsData[gameState.placementMode.selectedDefenseType]?.name || 'défense'}`;
                }
            }
            // Assurer que handleGridCellClick est défini avant d'ajouter l'écouteur
            if(typeof handleGridCellClick === 'function') {
                cell.addEventListener('click', () => handleGridCellClick(r, c));
            }
            previewContainer.appendChild(cell);
        }
    }
    if (nightAssaultEnemiesDisplayEl) { 
        if (gameState.nightAssault.isActive && gameState.nightAssault.enemies.length > 0) {
            nightAssaultEnemiesDisplayEl.innerHTML = ''; 
            gameState.nightAssault.enemies.forEach(enemy => {
                if(!enemy || !enemy.typeInfo) return; 
                const enemyVisual = document.createElement('div');
                const isBoss = enemy.isBoss;
                if (isBoss && enemy.typeInfo.visualSize) { 
                    enemyVisual.style.width = `${enemy.typeInfo.visualSize.width}px`; 
                    enemyVisual.style.height = `${enemy.typeInfo.visualSize.height}px`; 
                    enemyVisual.style.zIndex = '5'; 
                    enemyVisual.style.border = '1px solid gold'; 
                } else { 
                    enemyVisual.classList.add('base-enemy-visual'); 
                }
                if (enemy.typeInfo.spritePath && enemy.typeInfo.spritePath.startsWith('http')) { 
                    enemyVisual.style.backgroundImage = `url('${enemy.typeInfo.spritePath}')`;
                    enemyVisual.style.backgroundSize = 'contain';
                    enemyVisual.style.backgroundRepeat = 'no-repeat';
                    enemyVisual.style.backgroundPosition = 'center';
                    if (!isBoss) { 
                         enemyVisual.style.width = '10px'; 
                         enemyVisual.style.height = '10px';
                    }
                } else if (enemy.typeInfo.id === 'swarm_drone') enemyVisual.classList.add('drone');
                else if (enemy.typeInfo.id === 'assault_bot') enemyVisual.classList.add('bot');
                else if (enemy.typeInfo.id === 'heavy_crawler') enemyVisual.classList.add('crawler');
                else if (!isBoss) enemyVisual.style.backgroundColor = '#e53e3e'; 
                
                enemyVisual.style.position = 'absolute'; 
                enemyVisual.style.left = `${enemy.x - (isBoss && enemy.typeInfo.visualSize ? enemy.typeInfo.visualSize.width / 2 : 4)}px`; 
                enemyVisual.style.top = `${enemy.y - (isBoss && enemy.typeInfo.visualSize ? enemy.typeInfo.visualSize.height / 2 : 4)}px`;  
                enemyVisual.title = `${enemy.typeInfo.name} (PV: ${Math.ceil(enemy.currentHealth)})`;
                previewContainer.appendChild(enemyVisual); 
            });
        } else if (gameState.nightAssault.isActive && gameState.nightAssault.enemies.length === 0 && gameState.baseStats.currentHealth > 0){
            nightAssaultEnemiesDisplayEl.innerHTML = `<p class="text-green-400 italic text-xs">Vague ennemie neutralisée. En attente...</p>`;
        } else {
            nightAssaultEnemiesDisplayEl.innerHTML = `<p class="text-gray-500 italic text-xs">Aucune menace détectée pour le moment.</p>`;
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
        if (!isUnlocked && zone.unlockCondition) {
            if (zone.unlockCondition.research && gameState.research[zone.unlockCondition.research]) {
                isUnlocked = true;
                if (!gameState.unlockedZones.includes(zoneId)) gameState.unlockedZones.push(zoneId); 
            }
        }
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
            lockedZoneDiv.innerHTML = `<h4 class="text-md text-gray-600">${zone.name} (Verrouillé)</h4><p class="text-xs text-gray-500">${unlockText}</p>`;
            zoneListContainer.appendChild(lockedZoneDiv);
        }
    }
}

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
    for (let y = 0; y < currentZone.mapSize.height; y++) {
        for (let x = 0; x < currentZone.mapSize.width; x++) {
            const tileDiv = document.createElement('div');
            tileDiv.classList.add('map-tile'); 
            const tileClasses = getTileDisplayClass(x, y); 
            if(tileClasses) tileDiv.classList.add(...tileClasses.split(' ')); 
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
    if (!gameState.map || !gameState.map.tiles || !gameState.map.tiles[y] || gameState.map.explored === undefined || !gameState.map.explored[y] || gameState.map.explored[y][x] === undefined) return 'unexplored'; 
    const isNanobotCurrentPos = gameState.map.nanobotPos.x === x && gameState.map.nanobotPos.y === y;
    if (isNanobotCurrentPos) return 'nanobot';
    if (!gameState.map.explored[y][x]) return 'unexplored'; 
    const tileData = gameState.map.tiles[y][x]; 
    let tileType = tileData; 
    if (typeof tileData === 'object' && tileData !== null && tileData.type !== undefined) { tileType = tileData.type; } 
    else if (typeof tileData !== 'number') { return 'explored'; }
    switch (tileType) { 
        case TILE_TYPES.EMPTY: return 'explored'; 
        case TILE_TYPES.BASE: return 'base'; 
        case TILE_TYPES.RESOURCE_BIOMASS: return 'resource-biomass'; 
        case TILE_TYPES.RESOURCE_NANITES: return 'resource-nanites'; 
        case TILE_TYPES.RESOURCE_CRYSTAL_SHARDS: return 'resource-crystal';
        case TILE_TYPES.ENEMY_DRONE: 
        case TILE_TYPES.ENEMY_SAURIAN:
        case TILE_TYPES.ENEMY_CRYSTAL_GOLEM:
        case TILE_TYPES.ENEMY_SPARK_WISP: return 'enemy'; 
        case TILE_TYPES.UPGRADE_CACHE: return 'upgrade'; 
        case TILE_TYPES.IMPASSABLE: return 'impassable'; 
        case TILE_TYPES.IMPASSABLE_CRYSTAL: return 'impassable-crystal'; 
        default: return 'explored'; 
    } 
}
function getTileInfo(x,y) { 
    if (!gameState.map.explored || !gameState.map.explored[y] || !gameState.map.explored[y][x]) return "Zone non explorée."; 
    const tileData = gameState.map.tiles[y][x]; 
    let tileType = tileData; 
    let tileContent = tileData;
    if (typeof tileData === 'object' && tileData !== null && tileData.type !== undefined) { tileType = tileData.type; } 
    else if (typeof tileData !== 'number') { return "Zone explorée (données invalides)."; }
    switch (tileType) { 
        case TILE_TYPES.EMPTY: return "Zone vide."; 
        case TILE_TYPES.BASE: return "Noyau Central - Zone sécurisée."; 
        case TILE_TYPES.RESOURCE_BIOMASS: return `Dépôt de Biomasse (${tileContent.amount || 0}).`; 
        case TILE_TYPES.RESOURCE_NANITES: return `Fragments de Nanites (${tileContent.amount || 0}).`; 
        case TILE_TYPES.RESOURCE_CRYSTAL_SHARDS: return `Éclats de Cristal (${tileContent.amount || 0}).`; 
        case TILE_TYPES.ENEMY_DRONE: 
        case TILE_TYPES.ENEMY_SAURIAN:
        case TILE_TYPES.ENEMY_CRYSTAL_GOLEM:
        case TILE_TYPES.ENEMY_SPARK_WISP:
            return `Danger! ${tileContent.details?.name || "Entité hostile"} détecté.`; 
        case TILE_TYPES.UPGRADE_CACHE: return "Cache de matériaux détectée."; 
        case TILE_TYPES.IMPASSABLE: return "Terrain infranchissable."; 
        case TILE_TYPES.IMPASSABLE_CRYSTAL: return "Formation cristalline infranchissable.";
        default: return "Zone explorée."; 
    } 
}

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
    for(let i=0; i < defenseInstance.level; i++){ // Somme des coûts des niveaux de l'instance (placementCost + upgrades successives)
        const levelDataForCost = defenseTypeData.levels[i]; 
        if (levelDataForCost) {
            const costObject = (i === 0) ? levelDataForCost.costToUnlockOrUpgrade : levelDataForCost.costToUpgrade;
            if(costObject){ 
                // Note: pour la vente, on ne rembourse que sur le coût de PLACEMENT et les améliorations D'INSTANCE.
                // Le coût de "déblocage de technologie" n'est pas remboursé ici.
                // Cette logique de remboursement peut être complexe.
                // Pour l'instant, on va simplifier et dire que le remboursement est basé sur le coût de placement
                // + les coûts d'amélioration d'instance (qui sont les mêmes que ceux de la technologie pour l'instant).
                if (i > 0 && levelDataForCost.costToUpgrade) { // Coûts des upgrades d'instance
                     totalInvestedBiomass += levelDataForCost.costToUpgrade.biomass || 0;
                     totalInvestedNanites += levelDataForCost.costToUpgrade.nanites || 0;
                } else if (i === 0 && levelDataForCost.costToUnlockOrUpgrade) { // Coût initial de la technologie (que l'on considère comme le coût de la première instance)
                    // Ne rien ajouter ici si on considère que `placementCost` couvre l'instance de niveau 1.
                    // Si le `costToUnlockOrUpgrade` représente le coût de la *première* instance, alors il faut l'ajouter.
                    // Actuellement, le build() de la technologie est séparé du placement.
                }
            }
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
    if(typeof updateInventoryDisplay === 'function') updateInventoryDisplay(); 
    if(typeof updateShopDisplay === 'function') updateShopDisplay(); 
    if(typeof updateXpBar === 'function') updateXpBar(); 
    if(typeof updateBaseStatusDisplay === 'function') updateBaseStatusDisplay(); 
    if (typeof explorationContentEl !== 'undefined' && explorationContentEl && !explorationContentEl.classList.contains('hidden')) {
        if(typeof updateExplorationDisplay === 'function') updateExplorationDisplay(); 
    }
}