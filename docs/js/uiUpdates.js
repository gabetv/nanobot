// js/uiUpdates.js
console.log("uiUpdates.js - Fichier chargé et en cours d'analyse...");

var uiUpdates = {
    updateResourceDisplay: function() {
        if (!gameState) { console.warn("UI: updateResourceDisplay - gameState non défini."); return; }
        if (!gameState.resources || !gameState.productionRates || !gameState.capacity ||
            typeof gameState.mobilityRechargeTimer === 'undefined') {
            console.warn("UI: updateResourceDisplay - gameState.resources, productionRates, capacity ou mobilityRechargeTimer non défini.");
            return;
        }
        if(biomassEl) biomassEl.textContent = Math.floor(gameState.resources.biomass);
        if(nanitesEl) nanitesEl.textContent = Math.floor(gameState.resources.nanites);
        if(mobilityEl && typeof gameState.resources.mobility !== 'undefined' && typeof MAX_MOBILITY_POINTS !== 'undefined') {
            mobilityEl.textContent = `${Math.floor(gameState.resources.mobility)} / ${MAX_MOBILITY_POINTS}`;
        } else if (mobilityEl) {
            mobilityEl.textContent = '? / ?';
        }
        if(typeof gameState.resources.crystal_shards !== 'undefined'){
            if(crystalShardsDisplayContainer) crystalShardsDisplayContainer.classList.toggle('hidden', gameState.resources.crystal_shards <= 0 && !crystalShardsDisplayContainer.classList.contains('always-visible'));
            if(crystalShardsEl) crystalShardsEl.textContent = Math.floor(gameState.resources.crystal_shards || 0);
        } else if (crystalShardsDisplayContainer) {
            crystalShardsDisplayContainer.classList.add('hidden');
        }
        if(energyEl && typeof gameState.resources.totalEnergyConsumed !== 'undefined' && typeof gameState.capacity.energy !== 'undefined') {
             const totalCapacity = gameState.capacity.energy;
             energyEl.textContent = `${Math.floor(gameState.resources.totalEnergyConsumed)} / ${totalCapacity}`;
        } else if (energyEl) {
            energyEl.textContent = `? / ?`;
        }
        if(biomassRateEl) biomassRateEl.textContent = gameState.productionRates.biomass.toFixed(1);
        if(nanitesRateEl) nanitesRateEl.textContent = gameState.productionRates.nanites.toFixed(1);
    },

    updateBuildingDisplay: function() {
        const buildingsContainer = document.getElementById('buildings-section');
        if (!buildingsContainer) { console.warn("UI: updateBuildingDisplay - Conteneur #buildings-section non trouvé."); return; }
        if (typeof buildingsData === 'undefined' || Object.keys(buildingsData).length === 0) { buildingsContainer.innerHTML = '<p class="text-gray-500 italic text-sm">Données de modules non chargées.</p>'; return; }
        if (!gameState || !gameState.buildings) { buildingsContainer.innerHTML = '<p class="text-gray-500 italic text-sm">État des bâtiments non initialisé.</p>'; return; }
        buildingsContainer.innerHTML = ''; let buildingCount = 0;
        for (const id in buildingsData) {
            buildingCount++; const building = buildingsData[id]; const level = gameState.buildings[id] || 0;
            const currentLevelData = level > 0 && building.levels && building.levels[level - 1] ? building.levels[level - 1] : null;
            const nextLevelDefinition = building.levels && building.levels[level] ? building.levels[level] : null;
            const div = document.createElement('div'); div.className = 'panel p-2 mb-2';
            div.dataset.tooltipType = 'building-card'; div.dataset.tooltipId = id;

            const infoIconContainer = document.createElement('div');
            infoIconContainer.className = 'info-icon-container';
            const infoIcon = document.createElement('i');
            infoIcon.className = 'ti ti-info-circle info-icon';
            infoIcon.title = `Plus d'infos sur ${building.name}`;
            infoIcon.onclick = (e) => { e.stopPropagation(); showItemInfoModal('building-card', id, building.name); };
            infoIconContainer.appendChild(infoIcon);
            div.appendChild(infoIconContainer);

            let content = `<h4 class="text-sm font-semibold ${building.type === 'defense' ? 'text-[var(--accent-yellow)]' : 'text-[var(--accent-blue)]'}">${building.name} (Niv. ${level})</h4>`;
            content += `<p class="text-xs text-gray-400 mb-1">${building.description}</p>`;
            if (currentLevelData) {
                if(currentLevelData.production) content += `<p class="text-xs text-green-300">Prod: ${Object.entries(currentLevelData.production).map(([res,val])=>`${val}/s ${res}`).join(', ')}</p>`;
                if(currentLevelData.capacity) content += `<p class="text-xs text-blue-300">Cap: ${Object.entries(currentLevelData.capacity).map(([res,val])=>`${val} ${res}`).join(', ')}</p>`;
                if(currentLevelData.researchSpeedFactor) content += `<p class="text-xs text-purple-300">Vitesse Rech: x${currentLevelData.researchSpeedFactor}</p>`;
                if(currentLevelData.energyConsumption) content += `<p class="text-xs text-red-300">Conso. Énergie: ${currentLevelData.energyConsumption}</p>`;
                if(currentLevelData.baseHealthBonus && building.id === 'reinforcedWall') content += `<p class="text-xs text-teal-300">Bonus PV Noyau: +${currentLevelData.baseHealthBonus}</p>`;
            } else if (level === 0) { content += `<p class="text-xs text-yellow-400">Non débloqué.</p>`; }
            div.insertAdjacentHTML('beforeend', content);

            if (nextLevelDefinition) {
                const costObject = level === 0 ? nextLevelDefinition.costToUnlockOrUpgrade : nextLevelDefinition.costToUpgrade;
                if (costObject) {
                    let canAfford = true;
                    for (const resource in costObject) {
                        if (typeof itemsData !== 'undefined' && itemsData[resource]) { if ((gameState.inventory.filter(invId => invId === resource).length || 0) < costObject[resource]) { canAfford = false; break; }
                        } else { if ((gameState.resources[resource]||0) < costObject[resource]) { canAfford = false; break; } }
                    }
                    const button = document.createElement('button'); button.className = `btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-xs mt-1 w-full`;
                    let buttonTextContent = level === 0 ? `Débloquer (` : `Améliorer Niv. ${level + 1} (`;
                    buttonTextContent += Object.entries(costObject).map(([res, val]) => { const resourceName = (typeof itemsData !== 'undefined' && itemsData[res]) ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1); return `<span class="cost-part" data-resource-id="${res}" data-required-amount="${val}">${val} ${resourceName}</span>`; }).join(', ');
                    buttonTextContent += `)`; button.innerHTML = buttonTextContent;
                    if (!canAfford) button.disabled = true;
                    button.onclick = (e) => { e.stopPropagation(); if(typeof build === 'function') build(id); };
                    if (typeof highlightInsufficientCosts === 'function' && typeof clearCostHighlights === 'function') { button.addEventListener('mouseover', () => highlightInsufficientCosts(button, costObject)); button.addEventListener('mouseout', () => clearCostHighlights(button)); }
                    div.appendChild(button);
                }
            } else if (level > 0 && building.type !== 'defense' && building.levels && level >= building.levels.length) { div.innerHTML += `<p class="text-xs text-green-400 mt-1">Tech Max</p>`; }
            if (building.type === 'defense' && level > 0 && building.placementCost) {
                const placeButton = document.createElement('button'); placeButton.className = 'btn btn-info btn-xs mt-1 w-full';
                placeButton.textContent = `Placer ${building.name}`;
                placeButton.onclick = (e) => { e.stopPropagation(); if(typeof enterPlacementMode === 'function') enterPlacementMode(id); else console.error("enterPlacementMode non défini"); };
                div.appendChild(placeButton);
            }
            buildingsContainer.appendChild(div);
        }
        if (buildingCount === 0) { buildingsContainer.innerHTML += "<p class='text-gray-500 italic text-sm'>Aucun module structurel ou défensif disponible.</p>"; }
    },

    updateResearchDisplay: function() {
        const researchContainer = document.getElementById('research-content');
        if(!researchContainer) { console.warn("UI: updateResearchDisplay - Conteneur #research-content non trouvé."); return; }
        if (typeof researchData === 'undefined' || Object.keys(researchData).length === 0) { researchContainer.innerHTML = '<p class="text-gray-500 italic text-sm">Données de recherche non chargées.</p>'; return; }
        if (!gameState || !gameState.research || !gameState.buildings) { researchContainer.innerHTML = '<p class="text-gray-500 italic text-sm">État recherche/bâtiments non initialisé.</p>'; return; }
        researchContainer.innerHTML = ''; let researchAvailableCount = 0;
        if (gameState.activeResearch && researchData[gameState.activeResearch.id] && typeof buildingsData !== 'undefined' && typeof TICK_SPEED !== 'undefined') {
            const research = researchData[gameState.activeResearch.id]; const labLevel = gameState.buildings['researchLab'] || 0;
            const researchLabData = buildingsData['researchLab']; let researchSpeedFactor = 0.5;
            if (labLevel > 0 && researchLabData && researchLabData.levels[labLevel-1] && researchLabData.levels[labLevel-1].researchSpeedFactor) researchSpeedFactor = researchLabData.levels[labLevel - 1].researchSpeedFactor;
            const effectiveTotalTimeSeconds = research.time / researchSpeedFactor; const elapsedTicks = gameState.gameTime - gameState.activeResearch.startTime;
            const elapsedSeconds = elapsedTicks * (TICK_SPEED / 1000); const timeRemainingSecondsDisplay = Math.max(0, effectiveTotalTimeSeconds - elapsedSeconds);
            const progress = Math.min(100, (effectiveTotalTimeSeconds > 0 ? (elapsedSeconds / effectiveTotalTimeSeconds) : 0) * 100);
            const researchDiv = document.createElement('div'); researchDiv.className = 'panel p-2 mb-2';
            researchDiv.dataset.tooltipType = 'research-card'; researchDiv.dataset.tooltipId = gameState.activeResearch.id;
            const infoIconContainer = document.createElement('div'); /* ... icône info ... */ infoIconContainer.className = 'info-icon-container'; const infoIcon = document.createElement('i'); infoIcon.className = 'ti ti-info-circle info-icon'; infoIcon.title = `Plus d'infos sur ${research.name}`; infoIcon.onclick = (e) => { e.stopPropagation(); showItemInfoModal('research-card', gameState.activeResearch.id, research.name); }; infoIconContainer.appendChild(infoIcon); researchDiv.appendChild(infoIconContainer);
            researchDiv.insertAdjacentHTML('beforeend', `<h4 class="text-sm font-semibold text-yellow-400">En cours: ${research.name}</h4><p class="text-xs text-gray-400 mb-1">${research.description}</p><div class="w-full bg-gray-700 rounded-full h-2 mb-0.5"><div class="bg-blue-500 h-2 rounded-full" style="width: ${progress.toFixed(2)}%"></div></div><p class="text-xs text-gray-300">Temps Restant: ${formatTime(timeRemainingSecondsDisplay)}</p>`);
            researchContainer.appendChild(researchDiv); researchAvailableCount++;
        }
        for (const id in researchData) {
            const research = researchData[id];
            if (gameState.research[id]) {
                const div = document.createElement('div'); div.className = 'panel p-2 mb-2 opacity-60'; div.dataset.tooltipType = 'research-card'; div.dataset.tooltipId = id;
                const infoIconContainer = document.createElement('div'); /* ... icône info ... */ infoIconContainer.className = 'info-icon-container'; const infoIcon = document.createElement('i'); infoIcon.className = 'ti ti-info-circle info-icon'; infoIcon.title = `Plus d'infos sur ${research.name}`; infoIcon.onclick = (e) => { e.stopPropagation(); showItemInfoModal('research-card', id, research.name); }; infoIconContainer.appendChild(infoIcon); div.appendChild(infoIconContainer);
                div.insertAdjacentHTML('beforeend', `<h4 class="text-sm font-semibold text-green-400">${research.name} (Acquis)</h4><p class="text-xs text-gray-500">${research.description}</p>`);
                researchContainer.appendChild(div); researchAvailableCount++; continue;
            }
            if (gameState.activeResearch && gameState.activeResearch.id === id) continue;
            let canResearch = true; let requirementText = "";
            if (research.requirements) {
                if (research.requirements.buildings) { for (const buildingId in research.requirements.buildings) { if ((gameState.buildings[buildingId] || 0) < research.requirements.buildings[buildingId]) { canResearch = false; requirementText += `<span class="text-red-400">${(typeof buildingsData !== 'undefined' && buildingsData[buildingId]?.name) || buildingId} Niv. ${research.requirements.buildings[buildingId]} requis.</span><br>`;}}}
                if (research.requirements.research) { research.requirements.research.forEach(reqResearchId => { if (!gameState.research[reqResearchId]) { canResearch = false; requirementText += `<span class="text-red-400">Recherche "${researchData[reqResearchId]?.name || reqResearchId}" requise.</span><br>`;}});}}
            const div = document.createElement('div'); div.className = 'panel p-2 mb-2'; div.dataset.tooltipType = 'research-card'; div.dataset.tooltipId = id;
            const infoIconContainer = document.createElement('div'); /* ... icône info ... */ infoIconContainer.className = 'info-icon-container'; const infoIcon = document.createElement('i'); infoIcon.className = 'ti ti-info-circle info-icon'; infoIcon.title = `Plus d'infos sur ${research.name}`; infoIcon.onclick = (e) => { e.stopPropagation(); showItemInfoModal('research-card', id, research.name); }; infoIconContainer.appendChild(infoIcon); div.appendChild(infoIconContainer);
            let effectsText = "";
            if(research.grantsStatBoost) effectsText += `Stats: ${Object.entries(research.grantsStatBoost).map(([s,v])=>`${s}:+${v}`).join(', ')}. `;
            if(research.grantsModule && typeof nanobotModulesData !== 'undefined' && nanobotModulesData[research.grantsModule]) effectsText += `Module: ${nanobotModulesData[research.grantsModule].name}. `;
            let content = `<h4 class="text-sm font-semibold text-blue-300">${research.name}</h4> <p class="text-xs text-gray-400 mb-0.5">${research.description}</p>`;
            if (effectsText) content += `<p class="text-xs text-green-300">Effets: ${effectsText}</p>`;
            if (requirementText) content += `<div class="text-xs mt-0.5">${requirementText}</div>`;
            div.insertAdjacentHTML('beforeend', content);
            const button = document.createElement('button'); let canAfford = true;
            for (const resource_1 in research.cost) { if ((gameState.resources[resource_1]||0) < research.cost[resource_1]) { canAfford = false; break; }}
            button.className = `btn ${(canResearch && canAfford && !gameState.activeResearch) ? 'btn-success' : 'btn-disabled'} btn-xs mt-1 w-full`;
            let buttonTextContent = `Lancer Recherche (`;
            buttonTextContent += Object.entries(research.cost).map(([res, val]) => { const resourceName = (typeof itemsData !== 'undefined' && itemsData[res]) ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1); return `<span class="cost-part" data-resource-id="${res}" data-required-amount="${val}">${val} ${resourceName}</span>`; }).join(', ');
            buttonTextContent += ` - ${formatTime(research.time)})`; button.innerHTML = buttonTextContent;
            if (!canResearch || !canAfford || gameState.activeResearch) button.disabled = true;
            button.onclick = (e) => { e.stopPropagation(); if(typeof startResearch === 'function') startResearch(id); };
            if (typeof highlightInsufficientCosts === 'function' && typeof clearCostHighlights === 'function') { button.addEventListener('mouseover', () => highlightInsufficientCosts(button, research.cost)); button.addEventListener('mouseout', () => clearCostHighlights(button));}
            div.appendChild(button); researchContainer.appendChild(div); researchAvailableCount++;
        }
        if (researchAvailableCount === 0) { researchContainer.innerHTML += "<p class='text-gray-500 italic text-sm'>Aucune recherche disponible ou en cours.</p>"; }
    },

    updateNanobotModulesDisplay: function() {
        const container = equippedModulesDisplayEl;
        if (!container) { console.warn("UI: updateNanobotModulesDisplay - #equipped-modules-display non trouvé."); return; }
        container.innerHTML = ''; let hasModules = false;

        if (typeof nanobotModulesData === 'undefined' || Object.keys(nanobotModulesData).length === 0) {
            container.innerHTML = "<p class='text-xs text-gray-500 italic'>Données modules non chargées.</p>"; return;
        }
        if (!gameState || !gameState.nanobotModuleLevels) {
            container.innerHTML = "<p class='text-xs text-gray-500 italic'>État modules non initialisé.</p>"; return;
        }

        for (const moduleId in nanobotModulesData) { // Itérer sur les modules DÉFINIS
            const moduleData = nanobotModulesData[moduleId];
            // console.log("[ModulesDisplay] Traitement Module ID:", moduleId, "Data:", JSON.parse(JSON.stringify(moduleData || {}))); // DEBUG LOG

            if (!moduleData) {
                console.error(`[ModulesDisplay] ERREUR: Aucune donnée trouvée pour le module ID '${moduleId}' dans nanobotModulesData.`);
                continue;
            }
            if (!moduleData.levels || !Array.isArray(moduleData.levels) || moduleData.levels.length === 0) {
                console.error(`[ModulesDisplay] ERREUR: La propriété 'levels' est manquante, n'est pas un tableau, ou est vide pour le module '${moduleId}'. Module Data:`, JSON.parse(JSON.stringify(moduleData)));
                const errorDiv = document.createElement('div');
                errorDiv.className = 'module-card bg-red-800 p-2.5 rounded-md'; // Classe 'module-card' pour le style de base
                errorDiv.innerHTML = `<h4 class="font-semibold text-sm text-white">${moduleData.name || moduleId} - ERREUR CONFIG</h4><p class="text-xs text-red-200">Données de niveaux manquantes.</p>`;
                container.appendChild(errorDiv);
                hasModules = true;
                continue;
            }

            let isUnlocked = false;
            if (moduleData.unlockMethod) {
                if (moduleData.unlockMethod.research && gameState.research[moduleData.unlockMethod.research]) isUnlocked = true;
                else if (moduleData.unlockMethod.building && typeof buildingsData !== 'undefined' && buildingsData[moduleData.unlockMethod.building] && (gameState.buildings[moduleData.unlockMethod.building] || 0) >= moduleData.unlockMethod.buildingLevel) isUnlocked = true;
            } else { isUnlocked = true; }

            let currentLevel = gameState.nanobotModuleLevels[moduleId] || 0;
            let isReplacedByActiveHigherTier = false;
            for (const checkId in nanobotModulesData) { if (nanobotModulesData[checkId].replaces === moduleId && (gameState.nanobotModuleLevels[checkId] || 0) > 0) { isReplacedByActiveHigherTier = true; break; } }

            if(isReplacedByActiveHigherTier && currentLevel === 0 && !isUnlocked) continue;

            if (isUnlocked || currentLevel > 0) {
                hasModules = true;
                const moduleDiv = document.createElement('div');
                moduleDiv.className = 'module-card bg-gray-700 bg-opacity-70 p-2.5 rounded-md shadow border border-gray-600';
                moduleDiv.dataset.tooltipType = 'module-card'; moduleDiv.dataset.tooltipId = moduleId;

                const infoIconContainer = document.createElement('div');
                infoIconContainer.className = 'info-icon-container';
                const infoIcon = document.createElement('i');
                infoIcon.className = 'ti ti-info-circle info-icon';
                infoIcon.title = `Plus d'infos sur ${moduleData.name}`;
                infoIcon.onclick = (e) => { e.stopPropagation(); showItemInfoModal('module-card', moduleId, moduleData.name); };
                infoIconContainer.appendChild(infoIcon);
                moduleDiv.appendChild(infoIconContainer);

                let content = `<div class="flex justify-between items-baseline mb-1"><h4 class="font-semibold text-sm text-lime-400">${moduleData.name}</h4><span class="text-xs text-gray-400">Niv. ${currentLevel}</span></div>`;
                content += `<p class="text-xs text-gray-300 mb-1.5">${moduleData.description}</p>`;
                if (currentLevel > 0) {
                    const currentLevelDataDef = moduleData.levels.find(l => l.level === currentLevel);
                    if (currentLevelDataDef && currentLevelDataDef.statBoost) content += `<div class="text-xs text-green-300 mb-1.5"><strong>Actuel:</strong> ${Object.entries(currentLevelDataDef.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase() + s.slice(1)}:+${v}`).join(', ')}</div>`;
                } else if (isReplacedByActiveHigherTier) { content += `<p class="text-xs text-gray-500 italic">Remplacé par une version supérieure.</p>`;
                } else { content += `<p class="text-xs text-yellow-400">Prêt à activer.</p>`; }
                moduleDiv.insertAdjacentHTML('beforeend', content);

                const nextLevelDataDef = moduleData.levels.find(l => l.level === currentLevel + 1);
                const costDataForNextLevel = currentLevel === 0 ? moduleData.levels[0].costToUnlockOrUpgrade : (nextLevelDataDef ? nextLevelDataDef.costToUpgrade : null) ;

                if (costDataForNextLevel && (currentLevel < moduleData.levels.length) && !isReplacedByActiveHigherTier) {
                    let canAfford = true;
                    for(const res_1 in costDataForNextLevel) {
                        if (typeof itemsData !== 'undefined' && itemsData[res_1]) { if ((gameState.inventory || []).filter(itemId => itemId === res_1).length < costDataForNextLevel[res_1]) canAfford = false;
                        } else { if ((gameState.resources[res_1] || 0) < costDataForNextLevel[res_1]) canAfford = false; }
                        if (!canAfford) break;
                    }
                    const buttonText = currentLevel === 0 ? "Activer" : "Améliorer";
                    const upgradeButton = document.createElement('button'); upgradeButton.className = `btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-xs mt-2 w-full`;
                    let buttonHtmlContent = `${buttonText} (`;
                    buttonHtmlContent += Object.entries(costDataForNextLevel).map(([res, val]) => { const resourceName = (typeof itemsData !== 'undefined' && itemsData[res]) ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1); return `<span class="cost-part" data-resource-id="${res}" data-required-amount="${val}">${val} ${resourceName}</span>`; }).join(', ');
                    buttonHtmlContent += `)`; upgradeButton.innerHTML = buttonHtmlContent;
                    if(!canAfford) upgradeButton.disabled = true;
                    upgradeButton.onclick = (e) => { e.stopPropagation(); if(typeof upgradeNanobotModule === 'function') upgradeNanobotModule(moduleId);};
                    if (typeof highlightInsufficientCosts === 'function' && typeof clearCostHighlights === 'function') { upgradeButton.addEventListener('mouseover', () => highlightInsufficientCosts(upgradeButton, costDataForNextLevel)); upgradeButton.addEventListener('mouseout', () => clearCostHighlights(upgradeButton)); }
                    moduleDiv.appendChild(upgradeButton);
                } else if (currentLevel > 0 && !isReplacedByActiveHigherTier) { moduleDiv.innerHTML += `<p class="text-xs text-green-400 mt-1.5">Niveau Max Atteint</p>`; } // Changé de "Niveau Max de Technologie"
                container.appendChild(moduleDiv);
            }
        }
        if (!hasModules) { container.innerHTML = "<p class='text-xs text-gray-500 italic'>Aucun module débloqué ou disponible pour activation.</p>"; }
    },

    updateNanobotDisplay: function() {
        if (!gameState || !gameState.nanobotStats) { console.error("UI: updateNanobotDisplay - gameState ou nanobotStats non défini."); return; }
        if(nanobotHealthEl) nanobotHealthEl.textContent = `${Math.floor(gameState.nanobotStats.currentHealth)} / ${gameState.nanobotStats.health}`;
        if(nanobotAttackEl) nanobotAttackEl.textContent = gameState.nanobotStats.attack;
        if(nanobotDefenseEl) nanobotDefenseEl.textContent = gameState.nanobotStats.defense;
        if(nanobotSpeedEl) nanobotSpeedEl.textContent = gameState.nanobotStats.speed;
        if(nanobotVisualBody) { nanobotVisualBody.innerHTML = ''; const nanobotBaseImagePath = 'images/nanobot_base_body.png'; nanobotVisualBody.style.backgroundImage = `url('${nanobotBaseImagePath}')`;}
        if (gameState.nanobotModuleLevels && typeof nanobotModulesData !== 'undefined' && nanobotVisualBody) {
            for (const moduleId in gameState.nanobotModuleLevels) {
                const currentLevel = gameState.nanobotModuleLevels[moduleId];
                if (currentLevel > 0) {
                    const moduleData = nanobotModulesData[moduleId];
                    if (moduleData) {
                        const imagePath = `images/module_visual_${moduleId}.png`;
                        const createAndAppendVisual = (baseClass, specificClassFromData) => { const visualEl = document.createElement('div'); visualEl.className = `${baseClass} ${specificClassFromData || ''}`; visualEl.style.backgroundImage = `url('${imagePath}')`; nanobotVisualBody.appendChild(visualEl); };
                        if (moduleData.visualClass) createAndAppendVisual('nanobot-module', moduleData.visualClass);
                        else if (moduleData.visualClasses) moduleData.visualClasses.forEach(className => createAndAppendVisual('nanobot-module', className));
                    }
                }
            }
        }
        let equippedItemsNames = [];
        if (gameState.nanobotEquipment && typeof itemsData !== 'undefined' && nanobotVisualBody) {
            for (const slot in gameState.nanobotEquipment) {
                const itemId = gameState.nanobotEquipment[slot];
                if (itemId && itemsData[itemId]) {
                    const item = itemsData[itemId]; equippedItemsNames.push(item.name);
                    if (item.visualClass) { const imagePath = `images/item_visual_${itemId}.png`; const visualEl = document.createElement('div'); visualEl.className = `nanobot-item-visual ${item.visualClass}`; visualEl.style.backgroundImage = `url('${imagePath}')`; nanobotVisualBody.appendChild(visualEl); }
                }
            }
        }
        if(equippedItemsDisplayBriefEl) equippedItemsDisplayBriefEl.textContent = equippedItemsNames.length > 0 ? `Actif: ${equippedItemsNames.join(', ')}` : "Aucun équipement actif sur le visuel.";
        if(typeof this.updateEquippedItemsDisplay === 'function') this.updateEquippedItemsDisplay();
        if(typeof this.updateNanobotModulesDisplay === 'function') this.updateNanobotModulesDisplay();
    },

    updateEquippedItemsDisplay: function() {
        const container = nanobotEquipmentSlotsEl;
        if(!container) { console.warn("UI: updateEquippedItemsDisplay - #nanobot-equipment-slots non trouvé."); return;}
        container.innerHTML = '';
        if (typeof EQUIPMENT_SLOTS === 'undefined' || typeof itemsData === 'undefined' || !gameState || !gameState.nanobotEquipment) { container.innerHTML = "<p class='text-xs text-gray-500 italic'>Données d'équipement non disponibles.</p>"; return; }
        for (const slotId in EQUIPMENT_SLOTS) {
            const slotName = EQUIPMENT_SLOTS[slotId]; const itemId = gameState.nanobotEquipment[slotId]; const item = itemId ? itemsData[itemId] : null;
            const slotDiv = document.createElement('div'); slotDiv.className = 'equipment-slot';
            slotDiv.dataset.tooltipType = 'equipment-slot'; slotDiv.dataset.tooltipId = slotId;
            if (item) {
                const infoIconContainer = document.createElement('div'); /* ... icône info ... */ infoIconContainer.className = 'info-icon-container'; const infoIcon = document.createElement('i'); infoIcon.className = 'ti ti-info-circle info-icon'; infoIcon.title = `Plus d'infos sur ${item.name}`; infoIcon.onclick = (e) => { e.stopPropagation(); showItemInfoModal('inventory-item', itemId, item.name); }; infoIconContainer.appendChild(infoIcon); slotDiv.appendChild(infoIconContainer);
            }
            let contentHtml = `<div class="flex justify-between items-center mb-1"><span class="slot-name text-sm font-semibold text-fuchsia-400">${slotName}:</span>`;
            if (item) {
                contentHtml += `<span class="equipped-item-name text-sm text-gray-100">${item.name}</span></div>`;
                let itemEffects = [];
                if (item.statBoost) itemEffects.push(Object.entries(item.statBoost).map(([s,v]) => `<span class="text-xs ${v > 0 ? 'text-green-400' : 'text-red-400'}">${s.charAt(0).toUpperCase() + s.slice(1)}: ${v > 0 ? '+' : ''}${v}</span>`).join(', '));
                if (item.damageType && typeof DAMAGE_TYPES !== 'undefined') itemEffects.push(`<span class="text-xs text-cyan-400">Type Dégât: ${item.damageType.charAt(0).toUpperCase() + item.damageType.slice(1)}</span>`);
                if (itemEffects.length > 0) contentHtml += `<div class="text-xs text-gray-300 mt-0.5 mb-1.5">${itemEffects.join('; ')}</div>`;
                contentHtml += `<p class="text-xs text-gray-400 mb-2 italic">${item.description}</p>`;
                contentHtml += `<button class="btn btn-outline btn-danger btn-xs w-full" onclick="event.stopPropagation(); if(typeof unequipItem === 'function') unequipItem('${slotId}');">Retirer</button>`;
            } else {
                contentHtml += `<span class="empty-slot text-sm text-gray-500 italic">Vide</span></div>`;
                contentHtml += `<p class="text-xs text-gray-500 h-10 mb-2">Choisissez un objet depuis l'inventaire pour l'équiper.</p>`;
                contentHtml += `<button class="btn btn-disabled btn-xs w-full" disabled>Retirer</button>`;
            }
            slotDiv.insertAdjacentHTML('beforeend', contentHtml);
            container.appendChild(slotDiv);
        }
    },
    updateXpBar: function() {
        if(!xpBarEl || !gameState || !gameState.nanobotStats || gameState.nanobotStats.level === undefined) return;
        const stats = gameState.nanobotStats; const percent = (stats.xpToNext > 0 && stats.xpToNext !== Infinity ? (stats.xp / stats.xpToNext) : (stats.xpToNext === Infinity ? 100 : 0) ) * 100;
        xpBarEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    },
    updateBaseStatusDisplay: function() {
        if(!baseHealthValueEl || !baseMaxHealthValueEl || !overviewBaseHealthEl || !baseHealthBarEl || !baseDefensePowerEl || !repairBaseBtn || !repairDefensesBtn || !baseHealthDisplayEl ) return;
        if (!gameState || !gameState.baseStats || !gameState.nightAssault) return;
        const base = gameState.baseStats; baseHealthValueEl.textContent = Math.floor(base.currentHealth); baseMaxHealthValueEl.textContent = base.maxHealth; overviewBaseHealthEl.textContent = `${Math.floor(base.currentHealth)} / ${base.maxHealth}`;
        const healthPercent = (base.maxHealth > 0 ? (base.currentHealth / base.maxHealth) : 0) * 100; baseHealthBarEl.style.width = `${healthPercent}%`; baseHealthBarEl.classList.remove('low', 'medium'); if (healthPercent < 30) baseHealthBarEl.classList.add('low'); else if (healthPercent < 60) baseHealthBarEl.classList.add('medium');
        baseDefensePowerEl.textContent = `Défense: ${base.defensePower}`; repairBaseBtn.disabled = gameState.baseStats.currentHealth >= gameState.baseStats.maxHealth; repairBaseBtn.classList.toggle('btn-disabled', repairBaseBtn.disabled);
        let hasDamagedDefenses = false; if (gameState.defenses) { for (const defId in gameState.defenses) { if (gameState.defenses[defId].currentHealth < gameState.defenses[defId].maxHealth) { hasDamagedDefenses = true; break; } } }
        repairDefensesBtn.disabled = !hasDamagedDefenses; repairDefensesBtn.classList.toggle('btn-disabled', repairDefensesBtn.disabled);
        const baseStatusSection = document.getElementById('base-status-section'); if(baseStatusSection) baseStatusSection.classList.toggle('night-assault-active', gameState.nightAssault.isActive && !gameState.isDay);
        baseHealthDisplayEl.classList.toggle('text-[var(--accent-red)]', gameState.nightAssault.isActive && !gameState.isDay); baseHealthDisplayEl.classList.toggle('font-bold', gameState.nightAssault.isActive && !gameState.isDay);
        if(typeof this.updateBasePreview === 'function') this.updateBasePreview();
    },
    updateBasePreview: function() {
        const previewContainer = basePreviewContainerEl; if (!previewContainer) { console.error("UI: updateBasePreview - basePreviewContainerEl est null !"); return; }
        if (typeof BASE_GRID_SIZE === 'undefined' || !gameState || !Array.isArray(gameState.baseGrid) || typeof gameState.defenses !== 'object' || typeof buildingsData === 'undefined') { previewContainer.innerHTML = "<p class='text-red-500 text-xs'>Erreur: Schéma base.</p>"; return; }
        previewContainer.style.setProperty('--base-grid-cols', BASE_GRID_SIZE.cols); previewContainer.style.setProperty('--base-grid-rows', BASE_GRID_SIZE.rows);
        previewContainer.innerHTML = ''; previewContainer.style.gridTemplateRows = `repeat(${BASE_GRID_SIZE.rows}, minmax(0, 1fr))`; previewContainer.style.gridTemplateColumns = `repeat(${BASE_GRID_SIZE.cols}, minmax(0, 1fr))`;
        for (let r = 0; r < BASE_GRID_SIZE.rows; r++) { for (let c = 0; c < BASE_GRID_SIZE.cols; c++) {
            const cell = document.createElement('div'); cell.className = 'base-preview-cell'; cell.style.gridRowStart = r + 1; cell.style.gridColumnStart = c + 1; cell.dataset.row = r; cell.dataset.col = c;
            const coreRow = Math.floor(BASE_GRID_SIZE.rows / 2); const coreCol = Math.floor(BASE_GRID_SIZE.cols / 2);
            if (r === coreRow && c === coreCol) { cell.classList.add('core'); const coreVisual = document.createElement('div'); coreVisual.className = 'base-core-visual'; coreVisual.textContent = 'N'; cell.appendChild(coreVisual); cell.id = 'base-core-visual-cell';
            } else { const defenseOnCell = gameState.baseGrid[r] && gameState.baseGrid[r][c]; if (defenseOnCell && defenseOnCell.instanceId && gameState.defenses[defenseOnCell.instanceId]) { cell.classList.add('occupied'); if (gameState.placementMode.isActive) cell.classList.add('placement-blocked');
                } else if (gameState.placementMode.isActive && typeof buildingsData !== 'undefined' && buildingsData[gameState.placementMode.selectedDefenseType]) { cell.classList.add('placement-active'); cell.title = `Placer ${buildingsData[gameState.placementMode.selectedDefenseType]?.name || 'défense'}`; }}
            if(typeof handleGridCellClick === 'function') cell.addEventListener('click', () => handleGridCellClick(r, c)); previewContainer.appendChild(cell);
        }}
        requestAnimationFrame(() => { /* ... (logique de dessin des défenses et ennemis sur la grille, inchangée pour l'instant) ... */ });
    },
    drawLaserShot: function(startX, startY, endX, endY, type = 'friendly') { /* ... (inchangé) ... */ },
    drawEnemyProjectile: function(startX, startY, endX, endY, damageType) { this.drawLaserShot(startX, startY, endX, endY, 'enemy');},
    managePlacedDefense: function(instanceId, row, col) {
        if (!gameState || !gameState.defenses || !gameState.defenses[instanceId] || typeof buildingsData === 'undefined' || !buildingsData[gameState.defenses[instanceId].id]) { showModal("Erreur", "Impossible de gérer cette défense, données manquantes."); return; }
        const defenseInstance = gameState.defenses[instanceId]; const defenseTypeData = buildingsData[defenseInstance.id]; const currentTechLevel = gameState.buildings[defenseInstance.id] || 0;
        let modalContent = `<h4 class="font-orbitron text-md mb-1">${defenseInstance.name} (Niv. ${defenseInstance.level})</h4>`;
        modalContent += `<p class="text-xs">PV: ${Math.floor(defenseInstance.currentHealth)} / ${defenseInstance.maxHealth}</p>`;
        if (defenseInstance.attack !== undefined) modalContent += `<p class="text-xs">Attaque: ${defenseInstance.attack}</p>`;
        if (defenseInstance.range !== undefined) modalContent += `<p class="text-xs">Portée: ${defenseInstance.range}</p>`;
        modalContent += `<hr class="my-2 border-gray-600">`; let actionsHtml = `<div class="flex flex-col space-y-1">`;
        const canUpgradeInstance = defenseInstance.level < currentTechLevel && defenseInstance.level < defenseTypeData.levels.length;
        if (canUpgradeInstance) {
            const nextLevelData = defenseTypeData.levels.find(l => l.level === defenseInstance.level + 1);
            if (nextLevelData && nextLevelData.costToUpgrade) {
                let costStringForButton = typeof getCostString === 'function' ? getCostString(nextLevelData.costToUpgrade, true) : "Coût non affichable";
                const upgradeButton = document.createElement('button'); upgradeButton.className = 'btn btn-primary btn-sm';
                upgradeButton.innerHTML = `Améliorer (<span class="upgrade-cost-wrapper">${costStringForButton}</span>)`;
                let canAffordUpgrade = true;
                for(const res in nextLevelData.costToUpgrade) { if (typeof itemsData !== 'undefined' && itemsData[res]) { if ((gameState.inventory.filter(id => id === res).length || 0) < nextLevelData.costToUpgrade[res]) {canAffordUpgrade=false; break;} } else { if ((gameState.resources[res] || 0) < nextLevelData.costToUpgrade[res]) {canAffordUpgrade=false; break;} } }
                if (!canAffordUpgrade) { upgradeButton.classList.add('btn-disabled'); upgradeButton.disabled = true; }
                upgradeButton.onclick = (e) => { e.stopPropagation(); handleDefenseAction(instanceId, 'upgrade'); };
                if (typeof highlightInsufficientCosts === 'function' && typeof clearCostHighlights === 'function') { upgradeButton.addEventListener('mouseover', () => highlightInsufficientCosts(upgradeButton.querySelector('.upgrade-cost-wrapper'), nextLevelData.costToUpgrade)); upgradeButton.addEventListener('mouseout', () => clearCostHighlights(upgradeButton.querySelector('.upgrade-cost-wrapper'))); }
                actionsHtml += upgradeButton.outerHTML;
            }
        } else if (defenseInstance.level >= currentTechLevel && defenseInstance.level < defenseTypeData.levels.length) { actionsHtml += `<p class="text-xs text-yellow-400 italic">Améliorez d'abord la technologie de ${defenseTypeData.name}.</p>`;
        } else if (defenseInstance.level >= defenseTypeData.levels.length) { actionsHtml += `<p class="text-xs text-green-400 italic">Niveau d'instance maximum atteint.</p>`; }
        actionsHtml += `<button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); handleDefenseAction('${instanceId}', 'sell', ${row}, ${col})">Vendre</button>`;
        actionsHtml += `</div>`; modalContent += actionsHtml; showModal("Gérer Défense", modalContent, null, true);
    },

    updateDisplays: function() {
        if (!gameState) { console.warn("UI: updateDisplays - gameState non défini, arrêt."); return; }
        if(typeof this.updateResourceDisplay === 'function') this.updateResourceDisplay();
        if(typeof this.updateXpBar === 'function') this.updateXpBar();
        const activeMainSectionButton = document.querySelector('#main-navigation .nav-button.active');
        if (!activeMainSectionButton) return; const activeMainSectionId = activeMainSectionButton.dataset.section;
        if (activeMainSectionId === 'base-section') {
            if(typeof this.updateBaseStatusDisplay === 'function') this.updateBaseStatusDisplay();
            const activeSubTabButton = document.querySelector('#base-section .sub-nav-button.active');
            if (activeSubTabButton) { const activeSubTabId = activeSubTabButton.dataset.subtab;
                if (activeSubTabId === 'engineering-subtab' && typeof this.updateBuildingDisplay === 'function') this.updateBuildingDisplay();
                else if (activeSubTabId === 'research-subtab' && typeof this.updateResearchDisplay === 'function') this.updateResearchDisplay();
            }
        } else if (activeMainSectionId === 'nexus-section') {
            const activeSubTabButton = document.querySelector('#nexus-section .sub-nav-button.active');
            if (activeSubTabButton) { const activeSubTabId = activeSubTabButton.dataset.subtab;
                if (activeSubTabId === 'nanobot-config-subtab' && typeof this.updateNanobotDisplay === 'function') this.updateNanobotDisplay();
                else if (activeSubTabId === 'inventory-subtab' && typeof updateInventoryDisplay === 'function') updateInventoryDisplay();
            }
        } else if (activeMainSectionId === 'world-section') {
            // Mise à jour de l'UI d'exploration active si elle est visible
            if (gameState.map.activeExplorationTileCoords && typeof explorationUI !== 'undefined' && typeof explorationUI.updateActiveTileExplorationView === 'function' &&
                explorationUI.activeTileUiElements && explorationUI.activeTileUiElements.container && !explorationUI.activeTileUiElements.container.classList.contains('hidden')) {
                explorationUI.updateActiveTileExplorationView(gameState.map.activeExplorationTileCoords.x, gameState.map.activeExplorationTileCoords.y);
            } else { // Sinon, mettre à jour la carte du monde et le panneau d'aperçu
                const activeSubTabButton = document.querySelector('#world-section .sub-nav-button.active');
                if (activeSubTabButton) { const activeSubTabId = activeSubTabButton.dataset.subtab;
                    if (activeSubTabId === 'exploration-subtab' && typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') explorationUI.updateFullExplorationView();
                    else if (activeSubTabId === 'quests-subtab' && typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function') questUI.updateQuestDisplay();
                }
            }
        } else if (activeMainSectionId === 'shop-section') { if (typeof updateShopDisplay === 'function') updateShopDisplay(); }
    }
};

// S'assurer que handleDefenseAction est global si appelé depuis un onclick dans l'HTML injecté
if (typeof window.handleDefenseAction === 'undefined') {
    window.handleDefenseAction = function(instanceId, action, row, col) {
        if (action === 'upgrade') {
            if (typeof executeUpgradePlacedDefense === 'function') executeUpgradePlacedDefense(instanceId);
            else console.error("La fonction executeUpgradePlacedDefense n'est pas définie.");
        } else if (action === 'sell') {
            if (typeof sellPlacedDefense === 'function') sellPlacedDefense(instanceId, row, col);
            else console.error("La fonction sellPlacedDefense n'est pas définie.");
        }
        if(typeof hideModal === 'function') hideModal(); else console.error("hideModal non définie");
    };
}

console.log("uiUpdates.js - Objet uiUpdates défini.");