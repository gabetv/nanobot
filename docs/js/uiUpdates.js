// js/uiUpdates.js
console.log("uiUpdates.js - Fichier chargé et en cours d'analyse...");

var uiUpdates = {
    updateResourceDisplay: function() {
        // console.log("UI: updateResourceDisplay CALLED");
        if (!gameState) { console.warn("UI: updateResourceDisplay - gameState non défini."); return; }
        if (!gameState.resources || !gameState.productionRates || !gameState.capacity) {
            console.warn("UI: updateResourceDisplay - gameState.resources, productionRates ou capacity non défini.");
            return;
        }

        if(biomassEl) biomassEl.textContent = Math.floor(gameState.resources.biomass);
        if(nanitesEl) nanitesEl.textContent = Math.floor(gameState.resources.nanites);
        if(typeof gameState.resources.crystal_shards !== 'undefined'){
            if(crystalShardsDisplayContainer) crystalShardsDisplayContainer.classList.toggle('hidden', gameState.resources.crystal_shards <= 0 && !crystalShardsDisplayContainer.classList.contains('always-visible')); // Keep visible if it has a specific class
            if(crystalShardsEl) crystalShardsEl.textContent = Math.floor(gameState.resources.crystal_shards || 0);
        } else if (crystalShardsDisplayContainer) {
            crystalShardsDisplayContainer.classList.add('hidden');
        }

        if(energyEl && typeof gameState.resources.totalEnergyConsumed !== 'undefined') {
             energyEl.textContent = `${Math.floor(gameState.resources.totalEnergyConsumed)} / ${gameState.capacity.energy}`;
        } else if (energyEl) { // Fallback if totalEnergyConsumed is not yet calculated
             energyEl.textContent = `? / ${gameState.capacity.energy}`;
        }


        if(biomassRateEl) biomassRateEl.textContent = gameState.productionRates.biomass.toFixed(1);
        if(nanitesRateEl) nanitesRateEl.textContent = gameState.productionRates.nanites.toFixed(1);
        // energyCapacityEl is part of the energy display string now
        if(energyCostMoveEl && typeof EXPLORATION_COST_ENERGY !== 'undefined') energyCostMoveEl.textContent = EXPLORATION_COST_ENERGY;
    },

    updateBuildingDisplay: function() {
        // console.log("UI: updateBuildingDisplay CALLED");
        if (!buildingsSection) { console.warn("UI: updateBuildingDisplay - buildingsSection non trouvé."); return; }
        if (typeof buildingsData === 'undefined' || Object.keys(buildingsData).length === 0) {
            console.warn("UI: updateBuildingDisplay - buildingsData est vide ou non défini.");
            buildingsSection.innerHTML = '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Modules Structurels & Défensifs</h2><p class="text-gray-500 italic">Données de modules non chargées.</p>';
            return;
        }
        if (!gameState || !gameState.buildings) {
            console.warn("UI: updateBuildingDisplay - gameState ou gameState.buildings non défini.");
            buildingsSection.innerHTML = '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Modules Structurels & Défensifs</h2><p class="text-gray-500 italic">État des bâtiments non initialisé.</p>';
            return;
        }
        // console.log("UI: updateBuildingDisplay - gameState.buildings:", JSON.parse(JSON.stringify(gameState.buildings)), "- buildingsData keys:", Object.keys(buildingsData).length);

        buildingsSection.innerHTML = '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Modules Structurels & Défensifs</h2>';
        let buildingCount = 0;
        for (const id in buildingsData) {
            buildingCount++;
            const building = buildingsData[id];
            const level = gameState.buildings[id] || 0;
            const currentLevelData = level > 0 && building.levels && building.levels[level - 1] ? building.levels[level - 1] : null;
            const nextLevelDefinition = building.levels && building.levels[level] ? building.levels[level] : null; // Data for level + 1

            const div = document.createElement('div');
            div.className = 'mb-4 p-3 bg-gray-800 rounded shadow';
            let content = `<h3 class="text-lg font-semibold ${building.type === 'defense' ? 'text-yellow-400' : 'text-blue-400'}">${building.name} (Niv. ${level})</h3>`;
            content += `<p class="text-sm text-gray-400 mb-1">${building.description}</p>`;

            if (currentLevelData) {
                if(currentLevelData.production) content += `<p class="text-xs text-green-300">Production: ${Object.entries(currentLevelData.production).map(([res,val])=>`${val}/s ${res}`).join(', ')}</p>`;
                if(currentLevelData.capacity) content += `<p class="text-xs text-blue-300">Capacité: ${Object.entries(currentLevelData.capacity).map(([res,val])=>`${val} ${res}`).join(', ')}</p>`;
                if(currentLevelData.researchSpeedFactor) content += `<p class="text-xs text-purple-300">Facteur Vitesse Recherche: x${currentLevelData.researchSpeedFactor}</p>`;
                if(currentLevelData.energyConsumption) content += `<p class="text-xs text-red-300">Conso. Énergie: ${currentLevelData.energyConsumption}</p>`;
                 if(currentLevelData.baseHealthBonus && building.id === 'reinforcedWall') content += `<p class="text-xs text-teal-300">Bonus PV Noyau: +${currentLevelData.baseHealthBonus}</p>`;

            } else if (level === 0) {
                content += `<p class="text-xs text-yellow-400">Non débloqué.</p>`;
            }
            div.innerHTML = content;

            if (nextLevelDefinition) { 
                const costObject = level === 0 ? nextLevelDefinition.costToUnlockOrUpgrade : nextLevelDefinition.costToUpgrade; // Corrected access
                if (!costObject) {
                    console.warn(`UI: Coût manquant pour ${building.name} Niv. ${level + 1}`);
                } else {
                    let costString = Object.entries(costObject).map(([res, val]) => `${val} ${ (typeof itemsData !== 'undefined' && itemsData[res]) ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
                    let canAfford = true;
                    for (const resource in costObject) {
                        if (itemsData && itemsData[resource]) { 
                            if ((gameState.inventory.filter(invId => invId === resource).length || 0) < costObject[resource]) { canAfford = false; break; }
                        } else { 
                            if ((gameState.resources[resource]||0) < costObject[resource]) { canAfford = false; break; }
                        }
                    }
                    const button = document.createElement('button');
                    button.className = `btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-sm mt-2`;
                    button.textContent = level === 0 ? `Débloquer Technologie (${costString})` : `Améliorer Technologie Niv. ${level + 1} (${costString})`;
                    if (!canAfford) button.disabled = true;
                    button.onclick = () => { if(typeof build === 'function') build(id); }; 
                    div.appendChild(button);
                }
            } else if (level > 0 && building.type !== 'defense' && building.levels && level >= building.levels.length) {
                 div.innerHTML += `<p class="text-sm text-green-400 mt-2">Technologie Max Atteinte</p>`;
            }

            if (building.type === 'defense' && level > 0 && building.placementCost) {
                const placeButton = document.createElement('button');
                placeButton.className = 'btn btn-info btn-sm mt-2 ml-2';
                placeButton.textContent = `Placer ${building.name}`;
                placeButton.onclick = () => {
                    console.log(`Bouton 'Placer ${building.name}' (ID: ${id}) cliqué. Appel de enterPlacementMode.`); // LOG ADDED
                    if(typeof enterPlacementMode === 'function') enterPlacementMode(id);
                };
                div.appendChild(placeButton);
            }
            buildingsSection.appendChild(div);
        }
        if (buildingCount === 0) { buildingsSection.innerHTML += "<p class='text-gray-500 italic'>Aucun module structurel ou défensif disponible actuellement.</p>"; }
    },

    updateResearchDisplay: function() {
        // console.log("UI: updateResearchDisplay CALLED");
        if(!researchContentEl) { console.warn("UI: updateResearchDisplay - researchContentEl non trouvé."); return; }

        if (typeof researchData === 'undefined' || Object.keys(researchData).length === 0) {
            console.warn("UI: updateResearchDisplay - researchData est vide ou non défini.");
            researchContentEl.innerHTML = '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Arbre Technologique</h2><p class="text-gray-500 italic">Données de recherche non chargées.</p>';
            return;
        }
        if (!gameState || !gameState.research || !gameState.buildings) { 
            console.warn("UI: updateResearchDisplay - gameState, research ou buildings non défini.");
            researchContentEl.innerHTML = '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Arbre Technologique</h2><p class="text-gray-500 italic">État de la recherche ou des bâtiments non initialisé.</p>';
            return;
        }

        const titleElement = researchContentEl.querySelector('h2.font-orbitron'); 
        let titleHTML = titleElement ? titleElement.outerHTML : '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Arbre Technologique</h2>';
        researchContentEl.innerHTML = titleHTML; 

        let researchAvailableCount = 0;

        if (gameState.activeResearch && researchData[gameState.activeResearch.id] && typeof buildingsData !== 'undefined' && typeof TICK_SPEED !== 'undefined') {
            const research = researchData[gameState.activeResearch.id];
            const labLevel = gameState.buildings['researchLab'] || 0;
            const researchLabData = buildingsData['researchLab'];
            let researchSpeedFactor = 0.5; 
            if (labLevel > 0 && researchLabData && researchLabData.levels[labLevel-1] && researchLabData.levels[labLevel-1].researchSpeedFactor) {
                researchSpeedFactor = researchLabData.levels[labLevel - 1].researchSpeedFactor;
            }
            
            const effectiveTotalTimeSeconds = research.time / researchSpeedFactor;
            const elapsedTicks = gameState.gameTime - gameState.activeResearch.startTime;
            const elapsedSeconds = elapsedTicks * (TICK_SPEED / 1000);
            const timeRemainingSecondsDisplay = Math.max(0, effectiveTotalTimeSeconds - elapsedSeconds);
            const progress = Math.min(100, (effectiveTotalTimeSeconds > 0 ? (elapsedSeconds / effectiveTotalTimeSeconds) : 0) * 100);

            researchContentEl.innerHTML += `
                <div class="mb-4 p-3 bg-gray-800 rounded shadow">
                    <h3 class="text-lg font-semibold text-yellow-400">En cours: ${research.name}</h3>
                    <p class="text-sm text-gray-400 mb-1">${research.description}</p>
                    <div class="w-full bg-gray-700 rounded-full h-2.5 mb-1">
                        <div class="bg-blue-500 h-2.5 rounded-full" style="width: ${progress.toFixed(2)}%"></div>
                    </div>
                    <p class="text-sm text-gray-300">Temps Restant: ${formatTime(timeRemainingSecondsDisplay)}</p>
                </div>`;
            researchAvailableCount++;
        }

        for (const id in researchData) {
            const research = researchData[id];
            if (gameState.research[id]) { 
                const div = document.createElement('div');
                div.className = 'mb-4 p-3 bg-gray-700 rounded shadow opacity-60';
                div.innerHTML = `
                    <h3 class="text-lg font-semibold text-green-400">${research.name} (Acquis)</h3>
                    <p class="text-sm text-gray-500">${research.description}</p>`;
                researchContentEl.appendChild(div);
                researchAvailableCount++;
                continue;
            }
            if (gameState.activeResearch && gameState.activeResearch.id === id) continue; 

            let canResearch = true;
            let requirementText = "";
            if (research.requirements) {
                if (research.requirements.buildings) {
                    for (const buildingId in research.requirements.buildings) {
                        if ((gameState.buildings[buildingId] || 0) < research.requirements.buildings[buildingId]) {
                            canResearch = false;
                            requirementText += `<span class="text-red-400">${buildingsData[buildingId]?.name || buildingId} Niv. ${research.requirements.buildings[buildingId]} requis.</span><br>`;
                        }
                    }
                }
                if (research.requirements.research) {
                    research.requirements.research.forEach(reqResearchId => {
                        if (!gameState.research[reqResearchId]) {
                            canResearch = false;
                            requirementText += `<span class="text-red-400">Recherche "${researchData[reqResearchId]?.name || reqResearchId}" requise.</span><br>`;
                        }
                    });
                }
            }

            const div = document.createElement('div');
            div.className = 'mb-4 p-3 bg-gray-800 rounded shadow';
            let costString = Object.entries(research.cost).map(([res, val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');

            let effectsText = "";
            if(research.grantsStatBoost) effectsText += `Bonus Stats: ${Object.entries(research.grantsStatBoost).map(([s,v])=>`${s}:+${v}`).join(', ')}. `;
            if(research.grantsModule && typeof nanobotModulesData !== 'undefined' && nanobotModulesData[research.grantsModule]) effectsText += `Débloque Module: ${nanobotModulesData[research.grantsModule].name}. `;


            let content = `
                <h3 class="text-lg font-semibold text-blue-300">${research.name}</h3>
                <p class="text-sm text-gray-400 mb-1">${research.description}</p>
                <p class="text-xs text-yellow-500">Coût: ${costString}</p>
                <p class="text-xs text-gray-300">Temps Base: ${formatTime(research.time)}</p>`;

            if (effectsText) content += `<p class="text-xs text-green-300">Effets: ${effectsText}</p>`;
            if (requirementText) content += `<div class="text-xs mt-1">${requirementText}</div>`;

            div.innerHTML = content;

            const button = document.createElement('button');
            let canAfford = true;
             for (const resource in research.cost) {
                if ((gameState.resources[resource]||0) < research.cost[resource]) {
                    canAfford = false; break;
                }
            }

            button.className = `btn ${(canResearch && canAfford) ? 'btn-success' : 'btn-disabled'} btn-sm mt-2`;
            button.textContent = "Lancer Recherche";
            if (!canResearch || !canAfford) button.disabled = true;

            button.onclick = () => { if(typeof startResearch === 'function') startResearch(id); }; 
            div.appendChild(button);
            researchContentEl.appendChild(div);
            researchAvailableCount++;
        }

        if (researchAvailableCount === 0) {
            researchContentEl.innerHTML += "<p class='text-gray-500 italic'>Aucune recherche disponible ou en cours.</p>";
        }
    },

    updateNanobotModulesDisplay: function() {
        // console.log("UI: updateNanobotModulesDisplay CALLED");
        const container = equippedModulesDisplayEl;
        if (!container) { console.warn("UI: equippedModulesDisplayEl non trouvé."); return; }
        container.innerHTML = '<h3 class="font-orbitron text-lg mb-2 text-blue-200">Modules du Nanobot</h3>';
        let hasModules = false;
        if (typeof nanobotModulesData === 'undefined' || Object.keys(nanobotModulesData).length === 0) {
            container.innerHTML += "<p class='text-sm text-gray-500 italic'>Données de modules non chargées.</p>";
            return;
        }
        if (!gameState || !gameState.nanobotModuleLevels) {
            container.innerHTML += "<p class='text-sm text-gray-500 italic'>État des modules non initialisé.</p>";
            return;
        }

        for (const moduleId in nanobotModulesData) {
            const moduleData = nanobotModulesData[moduleId];
            let isUnlocked = false;
            let currentLevel = gameState.nanobotModuleLevels[moduleId] || 0;

            if (moduleData.unlockMethod) {
                if (moduleData.unlockMethod.research && gameState.research[moduleData.unlockMethod.research]) {
                    isUnlocked = true;
                } else if (moduleData.unlockMethod.building && typeof buildingsData !== 'undefined' && buildingsData[moduleData.unlockMethod.building] && (gameState.buildings[moduleData.unlockMethod.building] || 0) >= moduleData.unlockMethod.buildingLevel) {
                    isUnlocked = true;
                }
            } else { 
                isUnlocked = true;
            }

            let isReplacedByActiveHigherTier = false;
            for (const checkId in nanobotModulesData) {
                if (nanobotModulesData[checkId].replaces === moduleId && (gameState.nanobotModuleLevels[checkId] || 0) > 0) {
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
                } else if (isReplacedByActiveHigherTier) {
                     content += `<p class="text-xs text-gray-500 italic">Remplacé par un module supérieur.</p>`;
                }
                 else {
                    content += `<p class="text-xs text-yellow-400">Non activé/fabriqué.</p>`;
                }
                moduleDiv.innerHTML = content;

                const nextLevelData = moduleData.levels.find(l => l.level === currentLevel + 1);
                const costDataForNextLevel = currentLevel === 0 ? moduleData.levels[0].costToUnlockOrUpgrade : (nextLevelData ? nextLevelData.costToUpgrade : null) ;

                if (costDataForNextLevel && (currentLevel < moduleData.levels.length) && !isReplacedByActiveHigherTier) {
                    let tempContent = "";
                    let costString = Object.entries(costDataForNextLevel).map(([res, val]) => `${val} ${ (typeof itemsData !== 'undefined' && itemsData[res]) ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
                    let canAfford = true;
                    for(const res in costDataForNextLevel) {
                        if (typeof itemsData !== 'undefined' && itemsData[res]) { 
                            const countInInventory = (gameState.inventory || []).filter(itemId => itemId === res).length;
                            if (countInInventory < costDataForNextLevel[res]) canAfford = false;
                        } else { 
                            if ((gameState.resources[res] || 0) < costDataForNextLevel[res]) canAfford = false;
                        }
                        if (!canAfford) break;
                    }
                    const buttonText = currentLevel === 0 ? "Activer/Fabriquer" : "Améliorer";
                    if (nextLevelData && nextLevelData.statBoost) {
                        tempContent += `<p class="text-xs text-gray-500 mt-1">Prochain Niv (${nextLevelData.level}): ${Object.entries(nextLevelData.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase() + s.slice(1)}: +${v}`).join(', ')}</p>`;
                    }
                    tempContent += `<p class="text-xs text-yellow-500">Coût: ${costString}</p>`;
                    moduleDiv.innerHTML += tempContent;

                    const upgradeButton = document.createElement('button');
                    upgradeButton.className = `btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-xs mt-2`;
                    upgradeButton.textContent = buttonText;
                    if(!canAfford) upgradeButton.disabled = true;
                    upgradeButton.onclick = () => { if(typeof upgradeNanobotModule === 'function') upgradeNanobotModule(moduleId); else console.error("La fonction upgradeNanobotModule() n'est pas définie.");};
                    moduleDiv.appendChild(upgradeButton);
                } else if (currentLevel > 0 && !isReplacedByActiveHigherTier) {
                    moduleDiv.innerHTML += `<p class="text-sm text-green-400 mt-1">Niveau Max Atteint</p>`;
                }
                container.appendChild(moduleDiv);
            }
        }
        if (!hasModules) { container.innerHTML += "<p class='text-sm text-gray-500 italic'>Aucun module débloqué ou activable.</p>"; }
    },

    updateNanobotDisplay: function() {
        // console.log("UI: updateNanobotDisplay CALLED");
        if (!gameState || !gameState.nanobotStats) { console.error("UI: updateNanobotDisplay - gameState ou nanobotStats non défini."); return; }

        if(nanobotHealthEl) nanobotHealthEl.textContent = `${Math.floor(gameState.nanobotStats.currentHealth)} / ${gameState.nanobotStats.health}`;
        if(nanobotAttackEl) nanobotAttackEl.textContent = gameState.nanobotStats.attack;
        if(nanobotDefenseEl) nanobotDefenseEl.textContent = gameState.nanobotStats.defense;
        if(nanobotSpeedEl) nanobotSpeedEl.textContent = gameState.nanobotStats.speed;

        if(nanobotVisualBody) nanobotVisualBody.innerHTML = ''; 

        if (gameState.nanobotModuleLevels && typeof nanobotModulesData !== 'undefined') {
            for (const moduleId in gameState.nanobotModuleLevels) {
                const currentLevel = gameState.nanobotModuleLevels[moduleId];
                if (currentLevel > 0) {
                    const moduleData = nanobotModulesData[moduleId];
                    if (moduleData && nanobotVisualBody) {
                        if (moduleData.visualClass) {
                            const visualEl = document.createElement('div');
                            visualEl.className = `nanobot-module ${moduleData.visualClass}`;
                            nanobotVisualBody.appendChild(visualEl);
                        } else if (moduleData.visualClasses && Array.isArray(moduleData.visualClasses)) {
                            moduleData.visualClasses.forEach(className => {
                                const visualEl = document.createElement('div');
                                visualEl.className = `nanobot-module ${className}`;
                                nanobotVisualBody.appendChild(visualEl);
                            });
                        }
                    }
                }
            }
        }
        
        let equippedItemsNames = [];
        if (gameState.nanobotEquipment && typeof itemsData !== 'undefined') {
            for (const slot in gameState.nanobotEquipment) {
                const itemId = gameState.nanobotEquipment[slot];
                if (itemId && itemsData[itemId]) {
                    const item = itemsData[itemId];
                    equippedItemsNames.push(item.name);
                    if (item.visualClass && nanobotVisualBody) {
                        const visualEl = document.createElement('div');
                        visualEl.className = `nanobot-item-visual ${item.visualClass}`;
                        nanobotVisualBody.appendChild(visualEl);
                    }
                }
            }
        }
        if(equippedItemsDisplayBriefEl) equippedItemsDisplayBriefEl.textContent = equippedItemsNames.length > 0 ? `Équipement: ${equippedItemsNames.join(', ')}` : "Aucun équipement.";

        if(typeof this.updateEquippedItemsDisplay === 'function') this.updateEquippedItemsDisplay();
        if(typeof this.updateNanobotModulesDisplay === 'function') this.updateNanobotModulesDisplay();
    },

    updateEquippedItemsDisplay: function() {
        // console.log("UI: updateEquippedItemsDisplay CALLED");
        if(!nanobotEquipmentSlotsEl) { return;}
        nanobotEquipmentSlotsEl.innerHTML = ''; 
        if (typeof EQUIPMENT_SLOTS === 'undefined' || typeof itemsData === 'undefined' || !gameState || !gameState.nanobotEquipment) {
            console.warn("UI: updateEquippedItemsDisplay - Dépendances manquantes (EQUIPMENT_SLOTS, itemsData, gameState.nanobotEquipment).");
            return;
        }

        for (const slotId in EQUIPMENT_SLOTS) {
            const slotName = EQUIPMENT_SLOTS[slotId];
            const itemId = gameState.nanobotEquipment[slotId];
            const item = itemId ? itemsData[itemId] : null;

            const slotDiv = document.createElement('div');
            slotDiv.className = 'equipment-slot'; 

            let contentHtml = `<div class="item-details"><span class="slot-name">${slotName}:</span> `;
            if (item) {
                contentHtml += `<span class="equipped-item-name">${item.name}</span>`;
                let itemEffects = [];
                if (item.statBoost) {
                    itemEffects.push(Object.entries(item.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v > 0 ? '+' : ''}${v}`).join(', '));
                }
                if (item.damageType) {
                    itemEffects.push(`Type Dégât: ${item.damageType.charAt(0).toUpperCase() + item.damageType.slice(1)}`);
                }
                if (itemEffects.length > 0) {
                    contentHtml += `<span class="item-stats ml-2">(${itemEffects.join('; ')})</span>`;
                }
            } else {
                contentHtml += `<span class="empty-slot">Vide</span>`;
            }
            contentHtml += `</div>`;
            slotDiv.innerHTML = contentHtml;

            if (item) {
                const unequipButton = document.createElement('button');
                unequipButton.className = "btn btn-secondary btn-sm"; 
                unequipButton.textContent = "Retirer";
                unequipButton.onclick = () => {
                    if (typeof unequipItem === 'function') {
                        unequipItem(slotId); 
                    } else {
                        console.error("La fonction unequipItem() n'est pas définie.");
                    }
                };
                slotDiv.appendChild(unequipButton);
            }
            nanobotEquipmentSlotsEl.appendChild(slotDiv);
        }
    },

    updateXpBar: function() {
        // console.log("UI: updateXpBar CALLED");
        if(!xpBarEl) { return; } 
        if (!gameState || !gameState.nanobotStats || gameState.nanobotStats.level === undefined) { return; }

        const stats = gameState.nanobotStats;
        const percent = (stats.xpToNext > 0 && stats.xpToNext !== Infinity ? (stats.xp / stats.xpToNext) : (stats.xpToNext === Infinity ? 100 : 0) ) * 100;
        xpBarEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    },

    updateBaseStatusDisplay: function() {
        // console.log("UI: updateBaseStatusDisplay CALLED - Base PV:", gameState ? `${gameState.baseStats?.currentHealth}/${gameState.baseStats?.maxHealth}` : "gameState non défini");
        if(!baseHealthValueEl || !baseMaxHealthValueEl || !overviewBaseHealthEl || !baseHealthBarEl || !baseDefensePowerEl || !repairBaseBtn || !repairDefensesBtn || !activeDefensesDisplayEl || !overviewContentElTab || !baseHealthDisplayEl ) {
            console.warn("UI: updateBaseStatusDisplay - Un ou plusieurs éléments DOM sont manquants.");
            return;
        }
        if (!gameState || !gameState.baseStats || !gameState.nightAssault) { console.warn("UI: updateBaseStatusDisplay - gameState, baseStats ou nightAssault non défini."); return; }

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
        repairBaseBtn.classList.toggle('btn-disabled', repairBaseBtn.disabled);
        repairBaseBtn.classList.toggle('btn-success', !repairBaseBtn.disabled);


        let hasDamagedDefenses = false;
        if (gameState.defenses) {
            for (const defId in gameState.defenses) {
                if (gameState.defenses[defId].currentHealth < gameState.defenses[defId].maxHealth) {
                    hasDamagedDefenses = true; break;
                }
            }
        }
        repairDefensesBtn.disabled = !hasDamagedDefenses;
        repairDefensesBtn.classList.toggle('btn-disabled', repairDefensesBtn.disabled);
        repairDefensesBtn.classList.toggle('btn-info', !repairDefensesBtn.disabled);


        let defenseDetails = [];
        if (gameState.defenses && Object.keys(gameState.defenses).length > 0) {
            for (const instanceId in gameState.defenses) {
                const defense = gameState.defenses[instanceId];
                defenseDetails.push(`${defense.name} Niv.${defense.level} (PV: ${Math.floor(defense.currentHealth)}/${defense.maxHealth}, Att: ${defense.attack || 0})`);
            }
            activeDefensesDisplayEl.innerHTML = `<strong>Défenses Actives:</strong><br>` + defenseDetails.join('<br>');
        } else {
            activeDefensesDisplayEl.innerHTML = "<strong>Aucune défense active.</strong>";
        }


        overviewContentElTab.classList.toggle('night-assault-active', gameState.nightAssault.isActive && !gameState.isDay);
        baseHealthDisplayEl.classList.toggle('text-red-400', gameState.nightAssault.isActive && !gameState.isDay);
        baseHealthDisplayEl.classList.toggle('font-bold', gameState.nightAssault.isActive && !gameState.isDay);


        if(typeof this.updateBasePreview === 'function') {
            this.updateBasePreview();
        }
    },

    updateBasePreview: function() {
        // console.log("UI: updateBasePreview CALLED - Début");
        const previewContainer = basePreviewContainerEl;
        if (!previewContainer) { console.error("UI: updateBasePreview - basePreviewContainerEl est null !"); return; }

        if (typeof BASE_GRID_SIZE === 'undefined' || !gameState || !Array.isArray(gameState.baseGrid) || typeof gameState.defenses !== 'object') {
            console.warn("UI: updateBasePreview - Dépendances manquantes.", "BASE_GRID_SIZE:", typeof BASE_GRID_SIZE, "gameState.baseGrid:", Array.isArray(gameState?.baseGrid), "gameState.defenses:", typeof gameState?.defenses);
            previewContainer.innerHTML = "<p class='text-red-500'>Erreur: Impossible d'afficher le schéma de base.</p>";
            return;
        }

        previewContainer.innerHTML = ''; 
        previewContainer.style.gridTemplateRows = `repeat(${BASE_GRID_SIZE.rows}, 1fr)`;
        previewContainer.style.gridTemplateColumns = `repeat(${BASE_GRID_SIZE.cols}, 1fr)`;

        const cellWidth = previewContainer.offsetWidth / BASE_GRID_SIZE.cols;
        const cellHeight = previewContainer.offsetHeight / BASE_GRID_SIZE.rows;

        for (let r = 0; r < BASE_GRID_SIZE.rows; r++) {
            for (let c = 0; c < BASE_GRID_SIZE.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'map-tile base-preview-cell'; 
                cell.dataset.row = r;
                cell.dataset.col = c;

                const coreRow = Math.floor(BASE_GRID_SIZE.rows / 2);
                const coreCol = Math.floor(BASE_GRID_SIZE.cols / 2);

                if (r === coreRow && c === coreCol) {
                    cell.classList.add('core'); 
                    cell.innerHTML = `<div class="base-core-visual" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">N</div>`;
                    cell.id = 'base-core-visual-cell'; 
                } else {
                    const defenseOnCell = gameState.baseGrid[r] && gameState.baseGrid[r][c];
                    if (defenseOnCell && defenseOnCell.instanceId && gameState.defenses[defenseOnCell.instanceId]) {
                         cell.classList.add('occupied'); 
                        if (gameState.placementMode.isActive) {
                            cell.classList.add('placement-blocked'); 
                        }
                    } else if (gameState.placementMode.isActive && typeof buildingsData !== 'undefined' && buildingsData[gameState.placementMode.selectedDefenseType]) {
                        cell.classList.add('placement-active'); 
                        cell.title = `Placer ${buildingsData[gameState.placementMode.selectedDefenseType]?.name || 'défense'}`;
                    }
                }
                if(typeof handleGridCellClick === 'function') {
                    cell.addEventListener('click', () => handleGridCellClick(r, c));
                } else { console.warn("handleGridCellClick non défini, interaction grille de base désactivée.");}
                previewContainer.appendChild(cell);
            }
        }
        
        for (const instanceId in gameState.defenses) {
            const defenseState = gameState.defenses[instanceId];
            const buildingDef = typeof buildingsData !== 'undefined' ? buildingsData[defenseState.id] : null;
            if (defenseState.currentHealth > 0 && buildingDef && defenseState.gridPos) {
                const defenseVisual = document.createElement('div');
                defenseVisual.classList.add('defense-visual'); 
                if(buildingDef) defenseVisual.classList.add(defenseState.id); 
                defenseVisual.textContent = `L${defenseState.level}`; 
                const healthPercentage = (defenseState.maxHealth > 0 ? (defenseState.currentHealth / defenseState.maxHealth) : 0) * 100;
                defenseVisual.style.opacity = 0.6 + (healthPercentage / 250); 

                if (healthPercentage < 30) defenseVisual.style.backgroundColor = '#e53e3e'; 
                else if (healthPercentage < 60) defenseVisual.style.backgroundColor = '#ecc94b'; 

                defenseVisual.style.position = 'absolute';
                const visualWidth = parseInt(getComputedStyle(defenseVisual).width) || 20; 
                const visualHeight = parseInt(getComputedStyle(defenseVisual).height) || 20;
                
                defenseVisual.style.left = `${defenseState.gridPos.c * cellWidth + (cellWidth / 2) - (visualWidth / 2)}px`;
                defenseVisual.style.top = `${defenseState.gridPos.r * cellHeight + (cellHeight / 2) - (visualHeight / 2)}px`;
                previewContainer.appendChild(defenseVisual);
            }
        }
        
        if (nightAssaultEnemiesDisplayEl && previewContainer) { 
            const existingEnemyVisuals = previewContainer.querySelectorAll('.base-enemy-visual, .boss-visual-dynamic');
            existingEnemyVisuals.forEach(ev => ev.remove()); 

            if (gameState.nightAssault && gameState.nightAssault.isActive && gameState.nightAssault.enemies.length > 0) {
                gameState.nightAssault.enemies.forEach(enemy => {
                    if(!enemy || !enemy.typeInfo) return;
                    const enemyVisual = document.createElement('div');
                    const isBoss = enemy.isBoss;

                    if (isBoss) {
                        enemyVisual.classList.add('boss-visual-dynamic');
                        if (enemy.typeInfo.visualSize) {
                            enemyVisual.style.width = `${enemy.typeInfo.visualSize.width}px`;
                            enemyVisual.style.height = `${enemy.typeInfo.visualSize.height}px`;
                        }
                    } else {
                        enemyVisual.classList.add('base-enemy-visual');
                        if (enemy.typeInfo.visualClass) { 
                            enemyVisual.classList.add(enemy.typeInfo.visualClass);
                        }
                    }

                    if (enemy.typeInfo.spritePath && enemy.typeInfo.spritePath.startsWith('http')) {
                        enemyVisual.style.backgroundImage = `url('${enemy.typeInfo.spritePath}')`;
                         enemyVisual.style.backgroundSize = 'contain';
                         enemyVisual.style.backgroundRepeat = 'no-repeat';
                         enemyVisual.style.backgroundPosition = 'center';
                         enemyVisual.style.backgroundColor = 'transparent'; 
                    }

                    enemyVisual.style.position = 'absolute';
                    const visualWidth = parseInt(enemyVisual.style.width) || (isBoss ? 30 : 8);
                    const visualHeight = parseInt(enemyVisual.style.height) || (isBoss ? 30 : 8);
                    enemyVisual.style.left = `${enemy.x - (visualWidth / 2)}px`;
                    enemyVisual.style.top = `${enemy.y - (visualHeight / 2)}px`;
                    enemyVisual.title = `${enemy.typeInfo.name} (PV: ${Math.ceil(enemy.currentHealth)})`;
                    previewContainer.appendChild(enemyVisual);
                });
                nightAssaultEnemiesDisplayEl.innerHTML = ''; 
            } else if (gameState.nightAssault && gameState.nightAssault.isActive && gameState.nightAssault.enemies.length === 0 && gameState.baseStats.currentHealth > 0){
                nightAssaultEnemiesDisplayEl.innerHTML = `<p class="text-green-400 italic text-xs">Vague ennemie neutralisée. En attente...</p>`;
            } else {
                nightAssaultEnemiesDisplayEl.innerHTML = `<p class="text-gray-500 italic text-xs">Aucune menace détectée pour le moment.</p>`;
            }
        }
    },

    drawLaserShot: function(startX, startY, endX, endY) {
        const previewContainer = basePreviewContainerEl;
        if (!previewContainer) return;
        const beam = document.createElement('div');
        beam.classList.add('laser-beam'); 
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI); 

        beam.style.width = `${length}px`;
        beam.style.left = `${startX}px`;
        beam.style.top = `${startY}px`; 
        beam.style.transform = `rotate(${angle}deg)`;
        previewContainer.appendChild(beam);

        setTimeout(() => { if (beam.parentElement) { beam.remove(); } }, 150); 
    },

    managePlacedDefense: function(instanceId, row, col) {
        if (!gameState || !gameState.defenses || typeof buildingsData === 'undefined' || typeof itemsData === 'undefined' || typeof SELL_REFUND_FACTOR === 'undefined') {
            console.error("managePlacedDefense: Dépendances manquantes."); return;
        }
        const defenseInstance = gameState.defenses[instanceId];
        if (!defenseInstance) { console.error("Défense non trouvée pour gestion:", instanceId); return;}

        const defenseTypeData = buildingsData[defenseInstance.id];
        if (!defenseTypeData || !defenseTypeData.levels) { console.error("Données de type de défense manquantes pour", defenseInstance.id); return; }

        let message = `<h4 class="font-orbitron text-blue-300 text-lg mb-2">${defenseInstance.name} (Niv. ${defenseInstance.level})</h4>`;
        message += `<p>PV: ${Math.floor(defenseInstance.currentHealth)} / ${defenseInstance.maxHealth}</p>`;
        if (defenseInstance.attack > 0) message += `<p>Attaque: ${defenseInstance.attack}</p>`;
        if (defenseInstance.damageType) message += `<p>Type Dégât: ${defenseInstance.damageType.charAt(0).toUpperCase() + defenseInstance.damageType.slice(1)}</p>`;

        let canUpgradeThisInstance = false;
        const currentTechLevel = gameState.buildings[defenseInstance.id] || 0;
        const nextInstanceLevelData = defenseTypeData.levels.find(l => l.level === defenseInstance.level + 1);

        if (nextInstanceLevelData) {
            if (currentTechLevel < nextInstanceLevelData.level) {
                message += `<p class="text-xs text-yellow-500 mt-1">Améliorez la technologie ${defenseTypeData.name} au Niv. ${nextInstanceLevelData.level} pour pouvoir améliorer cette instance.</p>`;
            } else { 
                const upgradeCost = nextInstanceLevelData.costToUpgrade; 
                if(upgradeCost && typeof upgradeCost === 'object'){
                    let upgradeCostString = Object.entries(upgradeCost).map(([res, val]) => `${val} ${itemsData[res] ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
                    message += `<p class="text-xs mt-1">Prochain Niv Instance (${nextInstanceLevelData.level}): ${Object.entries(nextInstanceLevelData.stats || {}).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v}`).join(', ')}</p>`;
                    message += `<p class="text-xs text-yellow-500">Coût Amélio. Instance: ${upgradeCostString}</p>`;
                    canUpgradeThisInstance = true; 
                    for(const res in upgradeCost) {
                        if (itemsData[res]) { if ((gameState.inventory || []).filter(itemId => itemId === res).length < upgradeCost[res]) canUpgradeThisInstance = false; }
                        else { if ((gameState.resources[res] || 0) < upgradeCost[res]) canUpgradeThisInstance = false; }
                        if(!canUpgradeThisInstance) break;
                    }
                }
            }
        } else {
            message += `<p class="text-xs text-green-400 mt-1">Niveau Max pour cette instance.</p>`;
        }
        
        let totalInvestedBiomass = (defenseTypeData.placementCost ? defenseTypeData.placementCost.biomass : 0) || 0;
        let totalInvestedNanites = (defenseTypeData.placementCost ? defenseTypeData.placementCost.nanites : 0) || 0;
        for(let i = 0; i < defenseInstance.level -1 ; i++){ 
            const levelDataForCost = defenseTypeData.levels[i]; 
            const levelUpgradeCost = levelDataForCost?.costToUpgrade || (i === 0 ? levelDataForCost?.costToUnlockOrUpgrade : null) ;
            if(levelUpgradeCost){
                totalInvestedBiomass += levelUpgradeCost.biomass || 0;
                totalInvestedNanites += levelUpgradeCost.nanites || 0;
            }
        }
        const sellValueBiomass = Math.floor(totalInvestedBiomass * SELL_REFUND_FACTOR);
        const sellValueNanites = Math.floor(totalInvestedNanites * SELL_REFUND_FACTOR);
        message += `<p class="text-xs text-red-300 mt-1">Vendre pour: ${sellValueBiomass} Biomasse, ${sellValueNanites} Nanites</p>`;

        let modalButtonsHtml = `<div class="flex justify-end space-x-2 mt-4">`;
        if (nextInstanceLevelData && canUpgradeThisInstance) {
            modalButtonsHtml += `<button id="modal-upgrade-defense" class="btn btn-success btn-sm">Améliorer Instance</button>`;
        }
        modalButtonsHtml += `<button id="modal-sell-defense" class="btn btn-danger btn-sm">Vendre</button>`;
        modalButtonsHtml += `<button id="modal-defense-cancel" class="btn btn-secondary btn-sm">Annuler</button>`;
        modalButtonsHtml += `</div>`;
        
        showModal("Gestion de Défense", message + modalButtonsHtml, null, false); 

        const modalUpgradeBtn = document.getElementById('modal-upgrade-defense');
        const modalSellBtn = document.getElementById('modal-sell-defense');
        const modalDefenseCancelBtn = document.getElementById('modal-defense-cancel');

        if (modalUpgradeBtn) { modalUpgradeBtn.onclick = () => { if(typeof executeUpgradePlacedDefense === 'function') executeUpgradePlacedDefense(instanceId); hideModal(); }; }
        if (modalSellBtn) { modalSellBtn.onclick = () => { if(typeof sellPlacedDefense === 'function') sellPlacedDefense(instanceId, row, col); hideModal(); }; }
        if (modalDefenseCancelBtn) { modalDefenseCancelBtn.onclick = hideModal; }
    },

    updateDisplays: function() {
        // console.log("UI: uiUpdates.updateDisplays CALLED");
        if (!gameState) { console.warn("UI: updateDisplays - gameState non défini, arrêt."); return; }

        if(typeof this.updateResourceDisplay === 'function') this.updateResourceDisplay();
        if(typeof this.updateBuildingDisplay === 'function') this.updateBuildingDisplay();
        
        if(typeof researchContentEl !== 'undefined' && researchContentEl && !researchContentEl.classList.contains('hidden')) {
            if(typeof this.updateResearchDisplay === 'function') this.updateResearchDisplay();
        }
        if(typeof nanobotContentEl !== 'undefined' && nanobotContentEl && !nanobotContentEl.classList.contains('hidden')) {
            if(typeof this.updateNanobotDisplay === 'function') this.updateNanobotDisplay();
        }
        if(typeof inventoryContentEl !== 'undefined' && inventoryContentEl && !inventoryContentEl.classList.contains('hidden')) {
            if(typeof updateInventoryDisplay === 'function') updateInventoryDisplay(); 
        }
         if(typeof shopContentEl !== 'undefined' && shopContentEl && !shopContentEl.classList.contains('hidden')) {
            if(typeof updateShopDisplay === 'function') updateShopDisplay(); 
        }
        if(typeof overviewContentElTab !== 'undefined' && overviewContentElTab && !overviewContentElTab.classList.contains('hidden')) {
            if(typeof this.updateBaseStatusDisplay === 'function') this.updateBaseStatusDisplay();
        }
        if (typeof explorationContentEl !== 'undefined' && explorationContentEl && !explorationContentEl.classList.contains('hidden')) {
            if(typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') {
                explorationUI.updateFullExplorationView();
            } else { console.warn("explorationUI.updateFullExplorationView non trouvée.")}
        }
        if (typeof questsContentEl !== 'undefined' && questsContentEl && !questsContentEl.classList.contains('hidden')) {
            if(typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function') {
                questUI.updateQuestDisplay();
            } else { console.warn("questUI.updateQuestDisplay non trouvée.")}
        }
        if(typeof this.updateXpBar === 'function') this.updateXpBar(); 
    }
};

console.log("uiUpdates.js - Objet uiUpdates défini.");