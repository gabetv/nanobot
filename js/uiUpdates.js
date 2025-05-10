// js/uiUpdates.js

function updateResourceDisplay() { biomassEl.textContent = Math.floor(gameState.resources.biomass); nanitesEl.textContent = Math.floor(gameState.resources.nanites); energyEl.textContent = Math.floor(gameState.resources.energy); biomassRateEl.textContent = gameState.productionRates.biomass.toFixed(1); nanitesRateEl.textContent = gameState.productionRates.nanites.toFixed(1); energyCapacityEl.textContent = gameState.capacity.energy; energyCostMoveEl.textContent = EXPLORATION_COST_ENERGY; }
function updateBuildingDisplay() { buildingsSection.innerHTML = '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Modules Structurels & Défensifs</h2>'; for (const id in buildingsData) { const building = buildingsData[id]; const level = gameState.buildings[id] || 0; const currentLevelData = level > 0 ? building.levels[level - 1] : null; const nextLevel = level < building.levels.length ? building.levels[level] : null; const div = document.createElement('div'); div.className = 'mb-4 p-3 bg-gray-800 rounded shadow'; let content = `<h3 class="text-lg font-semibold ${building.type === 'defense' ? 'text-yellow-400' : 'text-blue-400'}">${building.name} (Niv. ${level})</h3>`; content += `<p class="text-sm text-gray-400 mb-1">${building.description}</p>`; if (currentLevelData) { content += `<p class="text-xs text-gray-500">Effet actuel: `; let effects = []; if (currentLevelData.production) { effects.push(...Object.entries(currentLevelData.production).map(([res, val]) => `${val}/s ${res}`)); } if (currentLevelData.capacity) { effects.push(...Object.entries(currentLevelData.capacity).map(([res, val]) => `+${val} Cap. ${res}`)); } if (currentLevelData.researchSpeedFactor) { effects.push(`Vitesse Rech. x${currentLevelData.researchSpeedFactor}`); } if (currentLevelData.grantsModule && nanobotModulesData[currentLevelData.grantsModule]) { effects.push(`Débloque: ${nanobotModulesData[currentLevelData.grantsModule].name}`); } if (building.type === 'defense' && currentLevelData.stats) { effects.push(`Att: ${currentLevelData.stats.attack}, PV: ${currentLevelData.stats.health}`); } if (building.type === 'defense' && currentLevelData.baseHealthBonus) { effects.push(`PV Noyau: +${currentLevelData.baseHealthBonus}`); } content += effects.join(', ') || "Aucun"; content += ` / Cons.: ${currentLevelData.energyConsumption || 0} Énergie</p>`; } if (nextLevel) { const canAfford = Object.entries(nextLevel.cost).every(([res, val]) => gameState.resources[res] >= val); let costString = Object.entries(nextLevel.cost).map(([res, val]) => `${val} ${res}`).join(', '); content += `<button onclick="build('${id}')" class="btn ${canAfford ? (building.type === 'defense' ? 'btn-warning' : 'btn-primary') : 'btn-disabled'} mt-2 text-sm w-full" ${!canAfford ? 'disabled' : ''}>Améliorer (Coût: ${costString})</button>`; } else { content += `<p class="text-sm text-green-400 mt-2">Niveau Max Atteint</p>`; } div.innerHTML = content; buildingsSection.appendChild(div); } }
function updateResearchDisplay() { researchSection.innerHTML = '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Arbre Technologique</h2>'; if (activeResearch) { const research = researchData[activeResearch.id]; const timeRemaining = Math.max(0, Math.ceil(activeResearch.totalTime - (gameState.gameTime - activeResearch.startTime))); const progress = Math.min(100, ((activeResearch.totalTime - timeRemaining) / activeResearch.totalTime) * 100); researchSection.innerHTML += `<div class="mb-4 p-3 bg-gray-800 rounded shadow"><h3 class="text-lg font-semibold text-yellow-400">En cours: ${research.name}</h3><p class="text-sm text-gray-400 mb-1">${research.description}</p><div class="w-full bg-gray-700 rounded-full h-2.5 mb-1"><div class="bg-blue-500 h-2.5 rounded-full" style="width: ${progress}%"></div></div><p class="text-sm text-gray-300">Temps: ${formatTime(timeRemaining)}</p></div>`; } for (const id in researchData) { const research = researchData[id]; if (gameState.research[id]) { researchSection.innerHTML += `<div class="mb-2 p-3 bg-gray-700 rounded opacity-70"><h3 class="text-md font-semibold text-green-400">${research.name} (Terminé)</h3><p class="text-xs text-gray-500">${research.description}</p></div>`; continue; } if (activeResearch && activeResearch.id === id) continue; let canResearch = true; let requirementText = []; const costEntries = Object.entries(research.cost); costEntries.forEach(([res, val]) => { if (gameState.resources[res] < val) canResearch = false; }); let costString = costEntries.map(([res, val]) => `${val} ${res}`).join(', '); if (research.requirements) { if (research.requirements.buildings) { Object.entries(research.requirements.buildings).forEach(([bId, rLvl]) => { if ((gameState.buildings[bId] || 0) < rLvl) { canResearch = false; requirementText.push(`${buildingsData[bId].name} Niv. ${rLvl}`); } }); } if (research.requirements.research) { research.requirements.research.forEach(rId => { if (!gameState.research[rId]) { canResearch = false; requirementText.push(`Rech.: ${researchData[rId].name}`); } }); } } let effectsText = []; if (research.grantsModule && nanobotModulesData[research.grantsModule]) { effectsText.push(`Module: ${nanobotModulesData[research.grantsModule].name}`); } if (research.grantsStatBoost) { effectsText.push(...Object.entries(research.grantsStatBoost).map(([stat, val]) => `${stat.replace('base', '')}: +${val}`)); } const div = document.createElement('div'); div.className = 'mb-4 p-3 bg-gray-800 rounded shadow'; let content = `<h3 class="text-lg font-semibold text-blue-400">${research.name}</h3>`; content += `<p class="text-sm text-gray-400 mb-1">${research.description}</p>`; if (effectsText.length > 0) content += `<p class="text-xs text-green-300 mb-1">Effet: ${effectsText.join(', ')}.</p>`; content += `<p class="text-xs text-gray-500 mb-1">Coût: ${costString}. Temps: ${formatTime(research.time)}.</p>`; if (requirementText.length > 0) content += `<p class="text-xs text-yellow-500 mb-1">Prérequis: ${requirementText.join(', ')}.</p>`; content += `<button onclick="startResearch('${id}')" class="btn ${canResearch && !activeResearch ? 'btn-primary' : 'btn-disabled'} mt-2 text-sm w-full" ${(!canResearch || activeResearch) ? 'disabled' : ''}>Lancer</button>`; div.innerHTML = content; researchSection.appendChild(div); } }

function updateNanobotModulesDisplay() {
    const container = document.getElementById('equipped-modules-display'); 
    if (!container) return;

    container.innerHTML = '<h3 class="font-orbitron text-lg mb-2 text-blue-200">Modules du Nanobot</h3>';
    let hasModules = false;

    for (const moduleId in nanobotModulesData) {
        const moduleData = nanobotModulesData[moduleId];
        let isUnlocked = false;
        let currentLevel = gameState.nanobotModuleLevels[moduleId] || 0;

        if (moduleData.unlockMethod.research && gameState.research[moduleData.unlockMethod.research]) {
            isUnlocked = true;
        } else if (moduleData.unlockMethod.building && 
                   (gameState.buildings[moduleData.unlockMethod.building] || 0) >= moduleData.unlockMethod.buildingLevel) {
            isUnlocked = true;
        }
        
        let isReplacedByActiveHigherTier = false;
        for (const checkId in nanobotModulesData) {
            if (nanobotModulesData[checkId].replaces === moduleId && gameState.nanobotModuleLevels[checkId] > 0) {
                isReplacedByActiveHigherTier = true;
                break;
            }
        }
        if(isReplacedByActiveHigherTier && currentLevel === 0) continue; 


        if (isUnlocked || currentLevel > 0) { 
            hasModules = true;
            const moduleDiv = document.createElement('div');
            moduleDiv.className = 'panel p-3 mb-3 bg-gray-700'; 

            let content = `<h4 class="font-semibold text-blue-300">${moduleData.name} (Niv. ${currentLevel})</h4>`;
            content += `<p class="text-xs text-gray-400 mb-1">${moduleData.description}</p>`;

            if (currentLevel > 0) {
                const currentLevelData = moduleData.levels.find(l => l.level === currentLevel);
                if (currentLevelData && currentLevelData.statBoost) {
                    content += `<p class="text-xs text-green-300">Actuel: ${Object.entries(currentLevelData.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase() + s.slice(1)}: +${v}`).join(', ')}</p>`;
                }
            } else {
                 content += `<p class="text-xs text-yellow-400">Non activé.</p>`;
            }

            const nextLevelData = moduleData.levels.find(l => l.level === currentLevel + 1);
            const costData = currentLevel === 0 ? moduleData.levels[0] : nextLevelData; 

            if (costData && (currentLevel < moduleData.levels.length)) {
                let costToDisplay = currentLevel === 0 ? costData.costToUnlockOrUpgrade : costData.costToUpgrade;
                let costString = Object.entries(costToDisplay)
                    .map(([res, val]) => `${val} ${itemsData[res] ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`)
                    .join(', ');
                
                let canAfford = true;
                for(const res in costToDisplay) {
                    if (itemsData[res]) { 
                        const countInInventory = gameState.inventory.filter(itemId => itemId === res).length;
                        if (countInInventory < costToDisplay[res]) canAfford = false;
                    } else { 
                        if (gameState.resources[res] < costToDisplay[res]) canAfford = false;
                    }
                    if (!canAfford) break;
                }

                const buttonText = currentLevel === 0 ? "Activer/Fabriquer" : "Améliorer";
                if (costData.statBoost) { // Assurer que statBoost existe pour le prochain niveau
                     content += `<p class="text-xs text-gray-500 mt-1">Prochain Niv (${costData.level}): ${Object.entries(costData.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase() + s.slice(1)}: +${v}`).join(', ')}</p>`;
                }
                content += `<p class="text-xs text-yellow-500">Coût: ${costString}</p>`;
                content += `<button class="btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-xs mt-2" onclick="upgradeNanobotModule('${moduleId}')" ${!canAfford || isReplacedByActiveHigherTier ? 'disabled' : ''}>${buttonText}</button>`;
            } else if (currentLevel > 0) {
                content += `<p class="text-sm text-green-400 mt-1">Niveau Max Atteint</p>`;
            }

            moduleDiv.innerHTML = content;
            container.appendChild(moduleDiv);
        }
    }

    if (!hasModules) {
        container.innerHTML += "<p class='text-sm text-gray-500 italic'>Aucun module débloqué ou activé.</p>";
    }
}

function updateNanobotDisplay() { 
    nanobotHealthEl.textContent = `${Math.floor(gameState.nanobotStats.currentHealth)} / ${gameState.nanobotStats.health}`; 
    nanobotAttackEl.textContent = gameState.nanobotStats.attack; 
    nanobotDefenseEl.textContent = gameState.nanobotStats.defense; 
    nanobotSpeedEl.textContent = gameState.nanobotStats.speed; 
    nanobotVisualBody.innerHTML = ''; 

    for (const moduleId in gameState.nanobotModuleLevels) {
        const currentLevel = gameState.nanobotModuleLevels[moduleId];
        if (currentLevel > 0) {
            const moduleData = nanobotModulesData[moduleId];
            if (moduleData) {
                if (moduleData.visualClass) { 
                    const visualEl = document.createElement('div'); 
                    visualEl.className = `nanobot-module ${moduleData.visualClass}`; 
                    nanobotVisualBody.appendChild(visualEl); 
                } else if (moduleData.visualClasses) { 
                    moduleData.visualClasses.forEach(className => { 
                        const visualEl = document.createElement('div'); 
                        visualEl.className = `nanobot-module ${className}`; 
                        nanobotVisualBody.appendChild(visualEl); 
                    }); 
                }
            }
        }
    }
    let equippedItemsNames = []; 
    for (const slot in gameState.nanobotEquipment) { 
        const itemId = gameState.nanobotEquipment[slot]; 
        if (itemId && itemsData[itemId]) { 
            const item = itemsData[itemId]; 
            equippedItemsNames.push(item.name); 
            if (item.visualClass) { 
                const visualEl = document.createElement('div'); 
                visualEl.className = `nanobot-item-visual ${item.visualClass}`; 
                nanobotVisualBody.appendChild(visualEl); 
            } 
        } 
    } 
    equippedItemsDisplayBriefEl.textContent = equippedItemsNames.length > 0 ? `Équipement: ${equippedItemsNames.join(', ')}` : "Aucun équipement."; 
    updateEquippedItemsDisplay();
    updateNanobotModulesDisplay(); 
}

function updateEquippedItemsDisplay() { nanobotEquipmentSlotsEl.innerHTML = ''; for (const slotId in EQUIPMENT_SLOTS) { const slotName = EQUIPMENT_SLOTS[slotId]; const itemId = gameState.nanobotEquipment[slotId]; const item = itemId ? itemsData[itemId] : null; const slotDiv = document.createElement('div'); slotDiv.className = 'equipment-slot'; let content = `<div class="item-details"><span class="slot-name">${slotName}:</span> `; if (item) { content += `<span class="equipped-item-name">${item.name}</span>`; if (item.statBoost) { content += `<span class="item-stats ml-2">(${Object.entries(item.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v > 0 ? '+' : ''}${v}`).join(', ')})</span>`; } } else { content += `<span class="empty-slot">Vide</span>`; } content += `</div>`; if (item) { content += `<button class="btn btn-secondary btn-sm" onclick="unequipItem('${slotId}')">Retirer</button>`; } slotDiv.innerHTML = content; nanobotEquipmentSlotsEl.appendChild(slotDiv); } }
function updateXpBar() { const stats = gameState.nanobotStats; if (!stats.level) return; const percent = (stats.xp / stats.xpToNext) * 100; xpBarEl.style.width = percent + "%"; }

function updateBaseStatusDisplay() {
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

    updateBasePreview(); // Moved here to ensure it's called with other base UI updates
}

function updateBasePreview() {
    const previewContainer = document.getElementById('base-preview-container');
    if (!previewContainer) return;

    const existingVisuals = previewContainer.querySelectorAll('.defense-visual, .base-enemy-visual');
    existingVisuals.forEach(el => el.remove());

    const containerWidth = previewContainer.offsetWidth;
    const containerHeight = previewContainer.offsetHeight;

    let defensePositions = [ 
        { x: 50, y: 10, side: 'top' }, { x: 10, y: 50, side: 'left' }, 
        { x: 90, y: 50, side: 'right' }, { x: 50, y: 90, side: 'bottom' },
        { x: 25, y: 20, side: 'top-left' }, { x: 75, y: 20, side: 'top-right' },
        { x: 25, y: 80, side: 'bottom-left' }, { x: 75, y: 80, side: 'bottom-right' }
    ];
    let defenseIndex = 0;

    for (const defId in gameState.defenses) {
        const defenseState = gameState.defenses[defId];
        if (defenseState.currentHealth > 0 && defenseIndex < defensePositions.length) {
            const buildingDef = buildingsData[defId];
            if (!buildingDef) continue;

            const pos = defensePositions[defenseIndex++];
            const visual = document.createElement('div');
            visual.classList.add('defense-visual');
            visual.classList.add(defId); 
            visual.style.left = `calc(${pos.x}% - 10px)`; 
            visual.style.top = `calc(${pos.y}% - 10px)`;
            
            const healthPercentage = (defenseState.currentHealth / defenseState.maxHealth) * 100;
            visual.style.opacity = 0.5 + (healthPercentage / 200); 

            if (healthPercentage < 30) visual.style.backgroundColor = '#e53e3e'; 
            else if (healthPercentage < 60) visual.style.backgroundColor = '#ecc94b'; 

            previewContainer.appendChild(visual);
        }
    }

    if (gameState.nightAssault.isActive && gameState.nightAssault.enemies.length > 0) {
        let totalEnemiesToDisplay = gameState.nightAssault.enemies.reduce((sum, group) => sum + group.count, 0);
        totalEnemiesToDisplay = Math.min(totalEnemiesToDisplay, 50); 

        for (let i = 0; i < totalEnemiesToDisplay; i++) {
            const enemyVisual = document.createElement('div');
            enemyVisual.classList.add('base-enemy-visual');
            
            const side = Math.floor(Math.random() * 4);
            let x, y;
            const offset = 10 + Math.random() * 20; 
            
            if (side === 0) { x = Math.random() * containerWidth; y = -offset + Math.random() * (offset/2) ; } 
            else if (side === 1) { x = containerWidth + offset - Math.random() * (offset/2); y = Math.random() * containerHeight; } 
            else if (side === 2) { x = Math.random() * containerWidth; y = containerHeight + offset - Math.random() * (offset/2); } 
            else { x = -offset + Math.random() * (offset/2); y = Math.random() * containerHeight; }
            
            enemyVisual.style.left = `${x}px`;
            enemyVisual.style.top = `${y}px`;
            previewContainer.appendChild(enemyVisual);
        }
    } else if(nightAssaultEnemiesDisplayEl) { // Check if element exists
         nightAssaultEnemiesDisplayEl.innerHTML = `<p class="text-gray-500 italic text-xs">Aucune menace détectée pour le moment.</p>`;
    }
}


function updateDisplays() { 
    updateResourceDisplay(); 
    updateBuildingDisplay(); 
    updateResearchDisplay(); 
    updateNanobotDisplay(); // This now calls updateNanobotModulesDisplay
    updateInventoryDisplay(); 
    updateShopDisplay(); 
    updateXpBar(); 
    updateBaseStatusDisplay(); // This now calls updateBasePreview
    if (explorationContentEl && !explorationContentEl.classList.contains('hidden')) {
        updateExplorationDisplay(); 
    }
}