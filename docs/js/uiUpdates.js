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
        
        // AFFICHAGE MOBILITÉ
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
             energyEl.textContent = `${Math.floor(gameState.resources.totalEnergyConsumed)} / ${gameState.capacity.energy}`;
        } else if (energyEl && typeof gameState.capacity.energy !== 'undefined') {
             energyEl.textContent = `? / ${gameState.capacity.energy}`;
        } else if (energyEl) {
            energyEl.textContent = `? / ?`;
        }

        if(biomassRateEl) biomassRateEl.textContent = gameState.productionRates.biomass.toFixed(1);
        if(nanitesRateEl) nanitesRateEl.textContent = gameState.productionRates.nanites.toFixed(1);
    },

    updateBuildingDisplay: function() {
        const buildingsContainer = document.getElementById('buildings-section');
        if (!buildingsContainer) { console.warn("UI: updateBuildingDisplay - Conteneur #buildings-section non trouvé."); return; }

        if (typeof buildingsData === 'undefined' || Object.keys(buildingsData).length === 0) {
            buildingsContainer.innerHTML = '<p class="text-gray-500 italic text-sm">Données de modules non chargées.</p>';
            return;
        }
        if (!gameState || !gameState.buildings) {
            buildingsContainer.innerHTML = '<p class="text-gray-500 italic text-sm">État des bâtiments non initialisé.</p>';
            return;
        }
        buildingsContainer.innerHTML = '';
        let buildingCount = 0;
        for (const id in buildingsData) {
            buildingCount++;
            const building = buildingsData[id];
            const level = gameState.buildings[id] || 0;
            const currentLevelData = level > 0 && building.levels && building.levels[level - 1] ? building.levels[level - 1] : null;
            const nextLevelDefinition = building.levels && building.levels[level] ? building.levels[level] : null;

            const div = document.createElement('div');
            div.className = 'panel p-2 mb-2'; 
            let content = `<h4 class="text-sm font-semibold ${building.type === 'defense' ? 'text-[var(--accent-yellow)]' : 'text-[var(--accent-blue)]'}">${building.name} (Niv. ${level})</h4>`;
            content += `<p class="text-xs text-gray-400 mb-1">${building.description}</p>`;

            if (currentLevelData) {
                if(currentLevelData.production) content += `<p class="text-xs text-green-300">Prod: ${Object.entries(currentLevelData.production).map(([res,val])=>`${val}/s ${res}`).join(', ')}</p>`;
                if(currentLevelData.capacity) content += `<p class="text-xs text-blue-300">Cap: ${Object.entries(currentLevelData.capacity).map(([res,val])=>`${val} ${res}`).join(', ')}</p>`;
                if(currentLevelData.researchSpeedFactor) content += `<p class="text-xs text-purple-300">Vitesse Rech: x${currentLevelData.researchSpeedFactor}</p>`;
                if(currentLevelData.energyConsumption) content += `<p class="text-xs text-red-300">Conso. Énergie: ${currentLevelData.energyConsumption}</p>`;
                if(currentLevelData.baseHealthBonus && building.id === 'reinforcedWall') content += `<p class="text-xs text-teal-300">Bonus PV Noyau: +${currentLevelData.baseHealthBonus}</p>`;
            } else if (level === 0) {
                content += `<p class="text-xs text-yellow-400">Non débloqué.</p>`;
            }
            div.innerHTML = content;

            if (nextLevelDefinition) {
                const costObject = level === 0 ? nextLevelDefinition.costToUnlockOrUpgrade : nextLevelDefinition.costToUpgrade;
                if (costObject) {
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
                    button.className = `btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-xs mt-1 w-full`;
                    button.textContent = level === 0 ? `Débloquer (${costString})` : `Améliorer Niv. ${level + 1} (${costString})`;
                    if (!canAfford) button.disabled = true;
                    button.onclick = () => { if(typeof build === 'function') build(id); };
                    div.appendChild(button);
                }
            } else if (level > 0 && building.type !== 'defense' && building.levels && level >= building.levels.length) {
                 div.innerHTML += `<p class="text-xs text-green-400 mt-1">Tech Max</p>`;
            }

            if (building.type === 'defense' && level > 0 && building.placementCost) {
                const placeButton = document.createElement('button');
                placeButton.className = 'btn btn-info btn-xs mt-1 w-full';
                placeButton.textContent = `Placer ${building.name}`;
                placeButton.onclick = () => {
                    if(typeof enterPlacementMode === 'function') enterPlacementMode(id); else console.error("enterPlacementMode non défini");
                };
                div.appendChild(placeButton);
            }
            buildingsContainer.appendChild(div);
        }
        if (buildingCount === 0) { buildingsContainer.innerHTML += "<p class='text-gray-500 italic text-sm'>Aucun module structurel ou défensif disponible.</p>"; }
    },

    updateResearchDisplay: function() {
        const researchContainer = document.getElementById('research-content');
        if(!researchContainer) { console.warn("UI: updateResearchDisplay - Conteneur #research-content non trouvé."); return; }

        if (typeof researchData === 'undefined' || Object.keys(researchData).length === 0) {
            researchContainer.innerHTML = '<p class="text-gray-500 italic text-sm">Données de recherche non chargées.</p>';
            return;
        }
        if (!gameState || !gameState.research || !gameState.buildings) {
            researchContainer.innerHTML = '<p class="text-gray-500 italic text-sm">État recherche/bâtiments non initialisé.</p>';
            return;
        }
        researchContainer.innerHTML = '';
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

            const researchDiv = document.createElement('div');
            researchDiv.className = 'panel p-2 mb-2';
            researchDiv.innerHTML = `
                <h4 class="text-sm font-semibold text-yellow-400">En cours: ${research.name}</h4>
                <p class="text-xs text-gray-400 mb-1">${research.description}</p>
                <div class="w-full bg-gray-700 rounded-full h-2 mb-0.5">
                    <div class="bg-blue-500 h-2 rounded-full" style="width: ${progress.toFixed(2)}%"></div>
                </div>
                <p class="text-xs text-gray-300">Temps Restant: ${formatTime(timeRemainingSecondsDisplay)}</p>`;
            researchContainer.appendChild(researchDiv);
            researchAvailableCount++;
        }

        for (const id in researchData) {
            const research = researchData[id];
            if (gameState.research[id]) {
                const div = document.createElement('div');
                div.className = 'panel p-2 mb-2 opacity-60';
                div.innerHTML = `
                    <h4 class="text-sm font-semibold text-green-400">${research.name} (Acquis)</h4>
                    <p class="text-xs text-gray-500">${research.description}</p>`;
                researchContainer.appendChild(div);
                researchAvailableCount++;
                continue;
            }
            if (gameState.activeResearch && gameState.activeResearch.id === id) continue;

            let canResearch = true; let requirementText = "";
            if (research.requirements) {
                if (research.requirements.buildings) { for (const buildingId in research.requirements.buildings) { if ((gameState.buildings[buildingId] || 0) < research.requirements.buildings[buildingId]) { canResearch = false; requirementText += `<span class="text-red-400">${buildingsData[buildingId]?.name || buildingId} Niv. ${research.requirements.buildings[buildingId]} requis.</span><br>`;}}}
                if (research.requirements.research) { research.requirements.research.forEach(reqResearchId => { if (!gameState.research[reqResearchId]) { canResearch = false; requirementText += `<span class="text-red-400">Recherche "${researchData[reqResearchId]?.name || reqResearchId}" requise.</span><br>`;}});}}

            const div = document.createElement('div'); div.className = 'panel p-2 mb-2';
            let costString = Object.entries(research.cost).map(([res, val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', ');
            let effectsText = "";
            if(research.grantsStatBoost) effectsText += `Stats: ${Object.entries(research.grantsStatBoost).map(([s,v])=>`${s}:+${v}`).join(', ')}. `;
            if(research.grantsModule && typeof nanobotModulesData !== 'undefined' && nanobotModulesData[research.grantsModule]) effectsText += `Module: ${nanobotModulesData[research.grantsModule].name}. `;
            let content = `<h4 class="text-sm font-semibold text-blue-300">${research.name}</h4> <p class="text-xs text-gray-400 mb-0.5">${research.description}</p> <p class="text-xs text-yellow-500">Coût: ${costString}</p> <p class="text-xs text-gray-300">Temps Base: ${formatTime(research.time)}</p>`;
            if (effectsText) content += `<p class="text-xs text-green-300">Effets: ${effectsText}</p>`;
            if (requirementText) content += `<div class="text-xs mt-0.5">${requirementText}</div>`;
            div.innerHTML = content;
            const button = document.createElement('button'); let canAfford = true;
            for (const resource_1 in research.cost) { if ((gameState.resources[resource_1]||0) < research.cost[resource_1]) { canAfford = false; break; }}
            button.className = `btn ${(canResearch && canAfford && !gameState.activeResearch) ? 'btn-success' : 'btn-disabled'} btn-xs mt-1 w-full`;
            button.textContent = "Lancer Recherche"; if (!canResearch || !canAfford || gameState.activeResearch) button.disabled = true;
            button.onclick = () => { if(typeof startResearch === 'function') startResearch(id); };
            div.appendChild(button); researchContainer.appendChild(div); researchAvailableCount++;
        }
        if (researchAvailableCount === 0) { researchContainer.innerHTML += "<p class='text-gray-500 italic text-sm'>Aucune recherche disponible ou en cours.</p>"; }
    },

    updateNanobotModulesDisplay: function() {
        const container = equippedModulesDisplayEl;
        if (!container) { console.warn("UI: updateNanobotModulesDisplay - #equipped-modules-display non trouvé."); return; }
        container.innerHTML = '';
        let hasModules = false;
        if (typeof nanobotModulesData === 'undefined' || Object.keys(nanobotModulesData).length === 0) {
            container.innerHTML = "<p class='text-xs text-gray-500 italic'>Données modules non chargées.</p>"; return;
        }
        if (!gameState || !gameState.nanobotModuleLevels) {
            container.innerHTML = "<p class='text-xs text-gray-500 italic'>État modules non initialisé.</p>"; return;
        }

        for (const moduleId in nanobotModulesData) {
            const moduleData = nanobotModulesData[moduleId];
            let isUnlocked = false;
            let currentLevel = gameState.nanobotModuleLevels[moduleId] || 0;

            if (moduleData.unlockMethod) {
                if (moduleData.unlockMethod.research && gameState.research[moduleData.unlockMethod.research]) isUnlocked = true;
                else if (moduleData.unlockMethod.building && typeof buildingsData !== 'undefined' && buildingsData[moduleData.unlockMethod.building] && (gameState.buildings[moduleData.unlockMethod.building] || 0) >= moduleData.unlockMethod.buildingLevel) isUnlocked = true;
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
                moduleDiv.className = 'module-card bg-gray-700 bg-opacity-70 p-2.5 rounded-md shadow border border-gray-600';

                let content = `<div class="flex justify-between items-baseline mb-1">
                                  <h4 class="font-semibold text-sm text-lime-400">${moduleData.name}</h4>
                                  <span class="text-xs text-gray-400">Niv. ${currentLevel}</span>
                               </div>`;
                content += `<p class="text-xs text-gray-300 mb-1.5">${moduleData.description}</p>`;

                if (currentLevel > 0) {
                    const currentLevelData = moduleData.levels.find(l => l.level === currentLevel);
                    if (currentLevelData && currentLevelData.statBoost) {
                        content += `<div class="text-xs text-green-300 mb-1.5"><strong>Actuel:</strong> ${Object.entries(currentLevelData.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase() + s.slice(1)}:+${v}`).join(', ')}</div>`;
                    }
                } else if (isReplacedByActiveHigherTier) {
                    content += `<p class="text-xs text-gray-500 italic">Remplacé par une version supérieure.</p>`;
                } else {
                    content += `<p class="text-xs text-yellow-400">Prêt à activer.</p>`;
                }
                
                moduleDiv.innerHTML = content;

                const nextLevelData = moduleData.levels.find(l => l.level === currentLevel + 1);
                const costDataForNextLevel = currentLevel === 0 ? moduleData.levels[0].costToUnlockOrUpgrade : (nextLevelData ? nextLevelData.costToUpgrade : null) ;

                if (costDataForNextLevel && (currentLevel < moduleData.levels.length) && !isReplacedByActiveHigherTier) {
                    let costHtml = "";
                    let costString = Object.entries(costDataForNextLevel)
                        .map(([res, val]) => `${val} ${ (typeof itemsData !== 'undefined' && itemsData[res]) ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`)
                        .join(', ');
                    
                    let canAfford = true;
                    for(const res_1 in costDataForNextLevel) {
                        if (typeof itemsData !== 'undefined' && itemsData[res_1]) { 
                            if ((gameState.inventory || []).filter(itemId => itemId === res_1).length < costDataForNextLevel[res_1]) canAfford = false;
                        } else { 
                            if ((gameState.resources[res_1] || 0) < costDataForNextLevel[res_1]) canAfford = false;
                        }
                        if (!canAfford) break;
                    }

                    const buttonText = currentLevel === 0 ? "Activer" : "Améliorer";
                    
                    if (nextLevelData && nextLevelData.statBoost) {
                        costHtml += `<div class="text-xs text-gray-400 mt-1"><strong>Prochain Niv (${nextLevelData.level}):</strong> ${Object.entries(nextLevelData.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase() + s.slice(1)}:+${v}`).join(', ')}</div>`;
                    }
                    costHtml += `<div class="text-xs text-amber-400 mt-1"><strong>Coût ${buttonText}:</strong> ${costString}</div>`;
                    moduleDiv.innerHTML += costHtml;

                    const upgradeButton = document.createElement('button');
                    upgradeButton.className = `btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-xs mt-2 w-full`;
                    upgradeButton.textContent = buttonText;
                    if(!canAfford) upgradeButton.disabled = true;
                    upgradeButton.onclick = () => { if(typeof upgradeNanobotModule === 'function') upgradeNanobotModule(moduleId);};
                    moduleDiv.appendChild(upgradeButton);
                } else if (currentLevel > 0 && !isReplacedByActiveHigherTier) {
                    moduleDiv.innerHTML += `<p class="text-xs text-green-400 mt-1.5">Niveau Max de Technologie Atteint</p>`;
                }
                container.appendChild(moduleDiv);
            }
        }
        if (!hasModules) {
            container.innerHTML = "<p class='text-xs text-gray-500 italic'>Aucun module débloqué ou disponible pour activation.</p>";
        }
    },

    updateNanobotDisplay: function() { 
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
        if(equippedItemsDisplayBriefEl) {
            equippedItemsDisplayBriefEl.textContent = equippedItemsNames.length > 0 ? `Actif: ${equippedItemsNames.join(', ')}` : "Aucun équipement actif sur le visuel.";
        }

        if(typeof this.updateEquippedItemsDisplay === 'function') this.updateEquippedItemsDisplay();
        if(typeof this.updateNanobotModulesDisplay === 'function') this.updateNanobotModulesDisplay();
    },

    updateEquippedItemsDisplay: function() {
        const container = nanobotEquipmentSlotsEl; 
        if(!container) { console.warn("UI: updateEquippedItemsDisplay - #nanobot-equipment-slots non trouvé."); return;}
        container.innerHTML = ''; 

        if (typeof EQUIPMENT_SLOTS === 'undefined' || typeof itemsData === 'undefined' || !gameState || !gameState.nanobotEquipment) {
            container.innerHTML = "<p class='text-xs text-gray-500 italic'>Données d'équipement non disponibles.</p>";
            return;
        }
        let hasEquipment = false;
        for (const slotId in EQUIPMENT_SLOTS) {
            const slotName = EQUIPMENT_SLOTS[slotId];
            const itemId = gameState.nanobotEquipment[slotId];
            const item = itemId ? itemsData[itemId] : null;

            const slotDiv = document.createElement('div');
            slotDiv.className = 'equipment-slot bg-gray-700 bg-opacity-70 p-2.5 rounded-md shadow border border-gray-600';
            
            let contentHtml = `<div class="flex justify-between items-center mb-1">
                                  <span class="slot-name text-sm font-semibold text-fuchsia-400">${slotName}:</span>`;
            if (item) {
                hasEquipment = true;
                contentHtml +=    `<span class="equipped-item-name text-sm text-gray-100">${item.name}</span>
                               </div>`; 
                let itemEffects = [];
                if (item.statBoost) {
                    itemEffects.push(Object.entries(item.statBoost).map(([s,v]) => 
                        `<span class="text-xs ${v > 0 ? 'text-green-400' : 'text-red-400'}">${s.charAt(0).toUpperCase() + s.slice(1)}: ${v > 0 ? '+' : ''}${v}</span>`
                    ).join(', '));
                }
                if (item.damageType) {
                    itemEffects.push(`<span class="text-xs text-cyan-400">Type Dégât: ${item.damageType.charAt(0).toUpperCase() + item.damageType.slice(1)}</span>`);
                }
                if (itemEffects.length > 0) {
                    contentHtml += `<div class="text-xs text-gray-300 mt-0.5 mb-1.5">${itemEffects.join('; ')}</div>`;
                }
                contentHtml += `<p class="text-xs text-gray-400 mb-2 italic">${item.description}</p>`;
                contentHtml += `<button class="btn btn-outline btn-danger btn-xs w-full" onclick="unequipItem('${slotId}')">Retirer</button>`;

            } else {
                contentHtml +=    `<span class="empty-slot text-sm text-gray-500 italic">Vide</span>
                               </div>`; 
                contentHtml += `<p class="text-xs text-gray-500 h-10 mb-2">Choisissez un objet depuis l'inventaire pour l'équiper.</p>`;
                 contentHtml += `<button class="btn btn-disabled btn-xs w-full" disabled>Retirer</button>`;
            }
            slotDiv.innerHTML = contentHtml;
            container.appendChild(slotDiv);
        }
        if (!hasEquipment && Object.keys(EQUIPMENT_SLOTS).length > 0 && Object.values(gameState.nanobotEquipment).every(val => val === null)) {
           // Optionnel
        }
    },


    updateXpBar: function() {
        if(!xpBarEl || !gameState || !gameState.nanobotStats || gameState.nanobotStats.level === undefined) return;
        const stats = gameState.nanobotStats;
        const percent = (stats.xpToNext > 0 && stats.xpToNext !== Infinity ? (stats.xp / stats.xpToNext) : (stats.xpToNext === Infinity ? 100 : 0) ) * 100;
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
        const previewContainer = basePreviewContainerEl;
        if (!previewContainer) { console.error("UI: updateBasePreview - basePreviewContainerEl est null !"); return; }
        
        if (typeof BASE_GRID_SIZE === 'undefined' || !gameState || !Array.isArray(gameState.baseGrid) || typeof gameState.defenses !== 'object' || typeof buildingsData === 'undefined') { 
            previewContainer.innerHTML = "<p class='text-red-500 text-xs'>Erreur: Schéma base.</p>"; return; 
        }
        
        previewContainer.style.setProperty('--base-grid-cols', BASE_GRID_SIZE.cols);
        previewContainer.style.setProperty('--base-grid-rows', BASE_GRID_SIZE.rows);
        previewContainer.innerHTML = '';
        previewContainer.style.gridTemplateRows = `repeat(${BASE_GRID_SIZE.rows}, minmax(0, 1fr))`;
        previewContainer.style.gridTemplateColumns = `repeat(${BASE_GRID_SIZE.cols}, minmax(0, 1fr))`;

        for (let r = 0; r < BASE_GRID_SIZE.rows; r++) { 
            for (let c = 0; c < BASE_GRID_SIZE.cols; c++) {
                const cell = document.createElement('div'); cell.className = 'base-preview-cell'; 
                cell.style.gridRowStart = r + 1; cell.style.gridColumnStart = c + 1;
                cell.dataset.row = r; cell.dataset.col = c;
                const coreRow = Math.floor(BASE_GRID_SIZE.rows / 2); const coreCol = Math.floor(BASE_GRID_SIZE.cols / 2);
                if (r === coreRow && c === coreCol) {
                    cell.classList.add('core'); const coreVisual = document.createElement('div'); coreVisual.className = 'base-core-visual'; coreVisual.textContent = 'N'; cell.appendChild(coreVisual); cell.id = 'base-core-visual-cell';
                } else {
                    const defenseOnCell = gameState.baseGrid[r] && gameState.baseGrid[r][c];
                    if (defenseOnCell && defenseOnCell.instanceId && gameState.defenses[defenseOnCell.instanceId]) { 
                        cell.classList.add('occupied'); 
                        if (gameState.placementMode.isActive) cell.classList.add('placement-blocked');
                    } else if (gameState.placementMode.isActive && buildingsData[gameState.placementMode.selectedDefenseType]) { 
                        cell.classList.add('placement-active'); 
                        cell.title = `Placer ${buildingsData[gameState.placementMode.selectedDefenseType]?.name || 'défense'}`; 
                    }
                }
                if(typeof handleGridCellClick === 'function') cell.addEventListener('click', () => handleGridCellClick(r, c));
                previewContainer.appendChild(cell);
            }
        }

        requestAnimationFrame(() => {
            const cells = previewContainer.querySelectorAll('.base-preview-cell'); 
            if (cells.length === 0) return;
            const firstCell = cells[0]; 
            if (!firstCell.offsetWidth && previewContainer.clientWidth === 0) { 
                return; 
            }
            const cellClientWidth = firstCell.offsetWidth || (previewContainer.clientWidth / BASE_GRID_SIZE.cols);
            const cellClientHeight = firstCell.offsetHeight || (previewContainer.clientHeight / BASE_GRID_SIZE.rows);

            const containerStyle = getComputedStyle(previewContainer); 
            const containerPaddingLeft = parseFloat(containerStyle.paddingLeft) || 0; 
            const containerPaddingTop = parseFloat(containerStyle.paddingTop) || 0; 
            const containerBorderLeft = parseFloat(containerStyle.borderLeftWidth) || 0; 
            const containerBorderTop = parseFloat(containerStyle.borderTopWidth) || 0;
            const offsetX = containerPaddingLeft + containerBorderLeft; 
            const offsetY = containerPaddingTop + containerBorderTop;

            const oldVisuals = previewContainer.querySelectorAll('.defense-visual-on-grid, .base-enemy-visual, .boss-visual-dynamic, .enemy-health-bar-on-grid-container, .projectile-visual');
            oldVisuals.forEach(v => v.remove());

            for (const instanceId in gameState.defenses) {
                const defenseState = gameState.defenses[instanceId]; 
                const buildingDef = buildingsData[defenseState.id];
                if (defenseState.currentHealth > 0 && buildingDef && defenseState.gridPos) {
                    const defenseVisual = document.createElement('div'); 
                    defenseVisual.classList.add('defense-visual-on-grid', defenseState.id); 
                    defenseVisual.textContent = `${buildingDef.name.substring(0,1).toUpperCase()}${defenseState.level}`; 
                    defenseVisual.title = `${defenseState.name} L${defenseState.level} (PV:${Math.floor(defenseState.currentHealth)}/${defenseState.maxHealth})`;
                    
                    defenseVisual.style.position = 'absolute'; 
                    defenseVisual.style.width = `${cellClientWidth - 2}px`;
                    defenseVisual.style.height = `${cellClientHeight - 2}px`;
                    defenseVisual.style.display = 'flex'; 
                    defenseVisual.style.alignItems = 'center'; 
                    defenseVisual.style.justifyContent = 'center'; 
                    defenseVisual.style.fontSize = '0.6rem'; 
                    defenseVisual.style.boxSizing = 'border-box'; 
                    defenseVisual.style.pointerEvents = 'none';
                    
                    const parentCellElement = previewContainer.querySelector(`.base-preview-cell[data-row="${defenseState.gridPos.r}"][data-col="${defenseState.gridPos.c}"]`);
                    if (parentCellElement) { 
                        defenseVisual.style.left = `${parentCellElement.offsetLeft + 1}px`;
                        defenseVisual.style.top = `${parentCellElement.offsetTop + 1}px`;
                    } else { 
                        defenseVisual.style.left = `${(defenseState.gridPos.c * cellClientWidth) + offsetX + 1}px`; 
                        defenseVisual.style.top = `${(defenseState.gridPos.r * cellClientHeight) + offsetY + 1}px`; 
                    }
                    
                    const healthPercentage = (defenseState.maxHealth > 0 ? (defenseState.currentHealth / defenseState.maxHealth) : 0) * 100;
                    
                    const tempStyleEl = document.createElement('div'); tempStyleEl.className = `defense-visual-on-grid ${defenseState.id}`; 
                    document.body.appendChild(tempStyleEl); const computedStyleForType = getComputedStyle(tempStyleEl);
                    let bgColor = computedStyleForType.backgroundColor && computedStyleForType.backgroundColor !== "rgba(0, 0, 0, 0)" ? computedStyleForType.backgroundColor : 'rgba(100, 116, 139, 0.7)';
                    let borderColor = computedStyleForType.borderColor && computedStyleForType.borderColor !== "rgba(0, 0, 0, 0)" ? computedStyleForType.borderColor : 'var(--border-color)';
                    let textColor = computedStyleForType.color || 'white';
                    document.body.removeChild(tempStyleEl);

                    if (healthPercentage < 30) { bgColor = 'rgba(229, 62, 62, 0.8)'; borderColor = '#c53030'; textColor = 'white'; } 
                    else if (healthPercentage < 60) { bgColor = 'rgba(236, 201, 75, 0.8)'; borderColor = '#d69e2e'; textColor = 'black'; }
                    
                    defenseVisual.style.backgroundColor = bgColor;
                    defenseVisual.style.border = `1px solid ${borderColor}`;
                    defenseVisual.style.color = textColor;
                    previewContainer.appendChild(defenseVisual);
                }
            }
            if (nightAssaultEnemiesDisplayEl) {
                if (gameState.nightAssault && gameState.nightAssault.isActive && gameState.nightAssault.enemies.length > 0) {
                    gameState.nightAssault.enemies.forEach(enemy => {
                        if (!enemy || !enemy.typeInfo || enemy.currentHealth <= 0) return;
                        const enemyVisual = document.createElement('div'); const isBoss = enemy.isBoss;
                        if (isBoss) { enemyVisual.classList.add('boss-visual-dynamic'); if (enemy.typeInfo.visualSize) { enemyVisual.style.width = `${enemy.typeInfo.visualSize.width}px`; enemyVisual.style.height = `${enemy.typeInfo.visualSize.height}px`; }}
                        else { enemyVisual.classList.add('base-enemy-visual'); if (enemy.typeInfo.visualClass) enemyVisual.classList.add(enemy.typeInfo.visualClass); }
                        if (enemy.typeInfo.spritePath && enemy.typeInfo.spritePath.startsWith('http')) { enemyVisual.style.backgroundImage = `url('${enemy.typeInfo.spritePath}')`; enemyVisual.style.backgroundColor = 'transparent';}
                        enemyVisual.style.position = 'absolute';
                        const visualWidth = parseInt(enemyVisual.style.width) || (isBoss ? (enemy.typeInfo.visualSize?.width || 18) : 10);
                        const visualHeight = parseInt(enemyVisual.style.height) || (isBoss ? (enemy.typeInfo.visualSize?.height || 18) : 10);
                        
                        let clampedX = Math.max(visualWidth / 2, Math.min(enemy.x, previewContainer.clientWidth - visualWidth / 2));
                        let clampedY = Math.max(visualHeight / 2, Math.min(enemy.y, previewContainer.clientHeight - visualHeight / 2));

                        const enemyLeft = (clampedX - (visualWidth / 2)) + offsetX;
                        const enemyTop = (clampedY - (visualHeight / 2)) + offsetY;
                        
                        enemyVisual.style.left = `${enemyLeft}px`; enemyVisual.style.top = `${enemyTop}px`; enemyVisual.title = `${enemy.typeInfo.name} (PV:${Math.ceil(enemy.currentHealth)})`; previewContainer.appendChild(enemyVisual);
                        
                        const healthBarContainer = document.createElement('div'); healthBarContainer.className = 'enemy-health-bar-on-grid-container'; healthBarContainer.style.position = 'absolute'; const healthBarWidth = Math.max(10, visualWidth * 0.8); healthBarContainer.style.width = `${healthBarWidth}px`; healthBarContainer.style.height = '3px'; healthBarContainer.style.left = `${enemyLeft + (visualWidth / 2) - (healthBarWidth / 2)}px`; healthBarContainer.style.top = `${enemyTop - 5}px`;
                        const healthBarFill = document.createElement('div'); healthBarFill.className = 'enemy-health-bar-on-grid-fill'; const healthPercent = (enemy.maxHealth > 0 ? (enemy.currentHealth / enemy.maxHealth) : 0) * 100; healthBarFill.style.width = `${Math.max(0, healthPercent)}%`;
                        healthBarContainer.appendChild(healthBarFill); previewContainer.appendChild(healthBarContainer);
                    });
                    nightAssaultEnemiesDisplayEl.innerHTML = ''; 
                } else if (gameState.nightAssault && gameState.nightAssault.isActive && gameState.nightAssault.enemies.length === 0 && gameState.baseStats.currentHealth > 0){
                    nightAssaultEnemiesDisplayEl.innerHTML = `<p class="text-green-400 italic text-xs">Vague neutralisée.</p>`;
                } else {
                    nightAssaultEnemiesDisplayEl.innerHTML = `<p class="text-gray-500 italic text-xs">Aucune menace.</p>`;
                }
            }
        });
    },

    drawLaserShot: function(startX, startY, endX, endY, type = 'friendly') {
        const container = basePreviewContainerEl;
        if (!container) {
            return;
        }

        const projectile = document.createElement('div');
        projectile.className = 'projectile-visual';

        let projectileHeightString = '3px'; 
        let projectileHeightNumeric = parseFloat(projectileHeightString);
        let projectileShadow;

        if (type === 'friendly') {
            projectile.style.backgroundColor = 'var(--accent-green)';
            projectileShadow = '0 0 5px var(--accent-green), 0 0 8px #90ee90';
        } else { 
            projectile.style.backgroundColor = 'var(--accent-red)';
            projectileShadow = '0 0 5px var(--accent-red), 0 0 8px #ff7f7f';
        }
        projectile.style.height = projectileHeightString;
        projectile.style.boxShadow = projectileShadow;
        projectile.style.borderRadius = '1px';


        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        if (distance < 1.5) { 
            projectile.style.width = projectileHeightString; 
            projectile.style.left = `${startX - projectileHeightNumeric / 2}px`;
            projectile.style.top = `${startY - projectileHeightNumeric / 2}px`;
        } else {
            projectile.style.width = `${distance}px`;
            projectile.style.left = `${startX}px`;
            projectile.style.top = `${startY - projectileHeightNumeric / 2}px`; 
            projectile.style.transform = `rotate(${angle}deg)`;
        }

        container.appendChild(projectile);
        setTimeout(() => {
            if (projectile.parentElement) {
                projectile.remove();
            }
        }, 200); 
    },

    drawEnemyProjectile: function(startX, startY, endX, endY, damageType) {
        this.drawLaserShot(startX, startY, endX, endY, 'enemy');
    },
    
    managePlacedDefense: function(instanceId, row, col) {
        if (!gameState || !gameState.defenses || !gameState.defenses[instanceId] || !buildingsData || !buildingsData[gameState.defenses[instanceId].id]) {
            showModal("Erreur", "Impossible de gérer cette défense, données manquantes.");
            return;
        }
        const defenseInstance = gameState.defenses[instanceId];
        const defenseTypeData = buildingsData[defenseInstance.id];
        const currentTechLevel = gameState.buildings[defenseInstance.id] || 0;

        let modalContent = `<h4 class="font-orbitron text-md mb-1">${defenseInstance.name} (Niv. ${defenseInstance.level})</h4>`;
        modalContent += `<p class="text-xs">PV: ${Math.floor(defenseInstance.currentHealth)} / ${defenseInstance.maxHealth}</p>`;
        if (defenseInstance.attack !== undefined) modalContent += `<p class="text-xs">Attaque: ${defenseInstance.attack}</p>`;
        if (defenseInstance.range !== undefined) modalContent += `<p class="text-xs">Portée: ${defenseInstance.range}</p>`;
        modalContent += `<hr class="my-2 border-gray-600">`;

        let actionsHtml = `<div class="flex flex-col space-y-1">`;
        
        const canUpgradeInstance = defenseInstance.level < currentTechLevel && defenseInstance.level < defenseTypeData.levels.length;
        if (canUpgradeInstance) {
            const nextLevelData = defenseTypeData.levels.find(l => l.level === defenseInstance.level + 1);
            if (nextLevelData && nextLevelData.costToUpgrade) {
                let costString = Object.entries(nextLevelData.costToUpgrade)
                    .map(([res, val]) => `${val} ${ (typeof itemsData !== 'undefined' && itemsData[res]) ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1)}`)
                    .join(', ');
                actionsHtml += `<button class="btn btn-primary btn-sm" onclick="handleDefenseAction('${instanceId}', 'upgrade')">Améliorer (Coût: ${costString})</button>`;
            }
        } else if (defenseInstance.level >= currentTechLevel && defenseInstance.level < defenseTypeData.levels.length) {
             actionsHtml += `<p class="text-xs text-yellow-400 italic">Améliorez d'abord la technologie de ${defenseTypeData.name} (via l'onglet Ingénierie) pour améliorer cette instance.</p>`;
        } else if (defenseInstance.level >= defenseTypeData.levels.length) {
             actionsHtml += `<p class="text-xs text-green-400 italic">Niveau d'instance maximum atteint.</p>`;
        }

        actionsHtml += `<button class="btn btn-danger btn-sm" onclick="handleDefenseAction('${instanceId}', 'sell', ${row}, ${col})">Vendre</button>`;
        actionsHtml += `</div>`;
        modalContent += actionsHtml;

        showModal("Gérer Défense", modalContent, null, true);
    },

    updateDisplays: function() {
        if (!gameState) { console.warn("UI: updateDisplays - gameState non défini, arrêt."); return; }

        if(typeof this.updateResourceDisplay === 'function') this.updateResourceDisplay();
        if(typeof this.updateXpBar === 'function') this.updateXpBar();

        const activeMainSectionButton = document.querySelector('#main-navigation .nav-button.active');
        if (!activeMainSectionButton) { return; }
        const activeMainSectionId = activeMainSectionButton.dataset.section;

        if (activeMainSectionId === 'base-section') {
            if(typeof this.updateBaseStatusDisplay === 'function') this.updateBaseStatusDisplay();
            const activeSubTabButton = document.querySelector('#base-section .sub-nav-button.active');
            if (activeSubTabButton) {
                const activeSubTabId = activeSubTabButton.dataset.subtab;
                if (activeSubTabId === 'engineering-subtab' && typeof this.updateBuildingDisplay === 'function') this.updateBuildingDisplay();
                else if (activeSubTabId === 'research-subtab' && typeof this.updateResearchDisplay === 'function') this.updateResearchDisplay();
            }
        } else if (activeMainSectionId === 'nexus-section') {
            const activeSubTabButton = document.querySelector('#nexus-section .sub-nav-button.active');
            if (activeSubTabButton) {
                const activeSubTabId = activeSubTabButton.dataset.subtab;
                if (activeSubTabId === 'nanobot-config-subtab' && typeof this.updateNanobotDisplay === 'function') {
                    this.updateNanobotDisplay();
                }
                else if (activeSubTabId === 'inventory-subtab' && typeof updateInventoryDisplay === 'function') updateInventoryDisplay();
            }
        } else if (activeMainSectionId === 'world-section') {
            const activeSubTabButton = document.querySelector('#world-section .sub-nav-button.active');
            if (activeSubTabButton) {
                const activeSubTabId = activeSubTabButton.dataset.subtab;
                if (activeSubTabId === 'exploration-subtab' && typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') explorationUI.updateFullExplorationView();
                else if (activeSubTabId === 'quests-subtab' && typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function') questUI.updateQuestDisplay();
            }
        } else if (activeMainSectionId === 'shop-section') {
            if (typeof updateShopDisplay === 'function') updateShopDisplay();
        }
    }
}; // FIN DE L'OBJET uiUpdates

window.handleDefenseAction = function(instanceId, action, row, col) {
    if (action === 'upgrade') {
        if (typeof executeUpgradePlacedDefense === 'function') {
            executeUpgradePlacedDefense(instanceId);
        } else {
            console.error("La fonction executeUpgradePlacedDefense n'est pas définie.");
        }
    } else if (action === 'sell') {
        if (typeof sellPlacedDefense === 'function') {
            sellPlacedDefense(instanceId, row, col);
        } else {
            console.error("La fonction sellPlacedDefense n'est pas définie.");
        }
    }
    hideModal();
};

console.log("uiUpdates.js - Objet uiUpdates défini.");