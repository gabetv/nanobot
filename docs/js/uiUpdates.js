// js/uiUpdates.js
console.log("uiUpdates.js - Fichier chargé et en cours d'analyse...");

var uiUpdates = {
    updateResourceDisplay: function() {
        if (!gameState) { /*console.warn("UI: updateResourceDisplay - gameState non défini.");*/ return; }
        if (!gameState.resources || !gameState.productionRates || !gameState.capacity ||
            typeof gameState.mobilityRechargeTimer === 'undefined') {
            // console.warn("UI: updateResourceDisplay - gameState.resources, productionRates, capacity ou mobilityRechargeTimer non défini.");
            return;
        }
        // Utiliser les références DOM globales
        if(window.biomassEl) window.biomassEl.textContent = Math.floor(gameState.resources.biomass);
        if(window.nanitesEl) window.nanitesEl.textContent = Math.floor(gameState.resources.nanites);
        
        if(window.mobilityEl && typeof gameState.resources.mobility !== 'undefined' && typeof window.MAX_MOBILITY_POINTS !== 'undefined') {
            window.mobilityEl.textContent = `${Math.floor(gameState.resources.mobility)} / ${window.MAX_MOBILITY_POINTS}`;
        } else if (window.mobilityEl) {
            window.mobilityEl.textContent = '? / ?';
        }

        if(typeof gameState.resources.crystal_shards !== 'undefined'){
            if(window.crystalShardsDisplayContainer) window.crystalShardsDisplayContainer.classList.toggle('hidden', gameState.resources.crystal_shards <= 0 && !window.crystalShardsDisplayContainer.classList.contains('always-visible'));
            if(window.crystalShardsEl) window.crystalShardsEl.textContent = Math.floor(gameState.resources.crystal_shards || 0);
        } else if (window.crystalShardsDisplayContainer) {
            window.crystalShardsDisplayContainer.classList.add('hidden');
        }

        if(window.energyEl && typeof gameState.resources.totalEnergyConsumed !== 'undefined' && typeof gameState.capacity.energy !== 'undefined') {
             const totalCapacity = gameState.capacity.energy;
             window.energyEl.textContent = `${Math.floor(gameState.resources.totalEnergyConsumed)} / ${totalCapacity}`;
        } else if (window.energyEl) {
            window.energyEl.textContent = `? / ?`;
        }

        if(window.biomassRateEl) window.biomassRateEl.textContent = gameState.productionRates.biomass.toFixed(1);
        if(window.nanitesRateEl) window.nanitesRateEl.textContent = gameState.productionRates.nanites.toFixed(1);
    },

    updateBuildingDisplay: function() {
        const buildingsContainer = window.buildingsContainerEl; // Utiliser la ref globale
        if (!buildingsContainer) { console.warn("UI: updateBuildingDisplay - Conteneur #buildings-section non trouvé."); return; }
        
        if (typeof window.buildingsData === 'undefined' || Object.keys(window.buildingsData).length === 0) {
            buildingsContainer.innerHTML = '<p class="text-gray-500 italic text-sm p-2">Données des modules de base non chargées.</p>'; return;
        }
        if (!gameState || !gameState.buildings) {
            buildingsContainer.innerHTML = '<p class="text-gray-500 italic text-sm p-2">État des bâtiments non initialisé.</p>'; return;
        }
        buildingsContainer.innerHTML = ''; let buildingCount = 0;

        for (const id in window.buildingsData) {
            buildingCount++;
            const building = window.buildingsData[id];
            const level = gameState.buildings[id] || 0;
            const currentLevelData = level > 0 && building.levels && building.levels[level - 1] ? building.levels[level - 1] : null;
            const nextLevelDefinition = building.levels && building.levels[level] ? building.levels[level] : null;
            
            const div = document.createElement('div');
            div.className = 'panel p-2.5 mb-2.5 rounded-lg shadow-md border border-gray-700 bg-gray-800 bg-opacity-60'; // Style amélioré
            div.dataset.tooltipType = 'building-card';
            div.dataset.tooltipId = id;

            // Info Icon
            const infoIconContainer = document.createElement('div');
            infoIconContainer.className = 'info-icon-container';
            const infoIcon = document.createElement('i');
            infoIcon.className = 'ti ti-info-circle info-icon text-sky-400 hover:text-sky-300';
            infoIcon.title = `Plus d'infos sur ${building.name}`;
            // infoIcon.onclick est géré par le listener global dans main.js
            infoIconContainer.appendChild(infoIcon);
            div.appendChild(infoIconContainer);

            let content = `<h4 class="text-md font-semibold mb-1 ${building.type === 'defense' ? 'text-yellow-300' : 'text-sky-300'}">${building.name} <span class="text-sm text-gray-400">(Niv. ${level})</span></h4>`;
            content += `<p class="text-xs text-gray-400 mb-1.5 leading-relaxed">${building.description}</p>`; // leading-relaxed

            if (currentLevelData) {
                content += `<div class="text-xs space-y-0.5 mb-1.5">`; // Conteneur pour les stats
                if(currentLevelData.production) content += `<p class="text-green-300">Prod: ${Object.entries(currentLevelData.production).map(([res,val])=>`${val}/s ${res}`).join(', ')}</p>`;
                if(currentLevelData.capacity) content += `<p class="text-blue-300">Cap: ${Object.entries(currentLevelData.capacity).map(([res,val])=>`${val} ${res}`).join(', ')}</p>`;
                if(currentLevelData.researchSpeedFactor) content += `<p class="text-purple-300">Vitesse Rech: x${currentLevelData.researchSpeedFactor}</p>`;
                if(currentLevelData.energyConsumption) content += `<p class="text-red-400">Conso. Énergie: ${currentLevelData.energyConsumption}</p>`;
                if(currentLevelData.baseHealthBonus && building.id === 'reinforcedWall') content += `<p class="text-teal-300">Bonus PV Noyau: +${currentLevelData.baseHealthBonus}</p>`;
                if(currentLevelData.defensePowerBonus) content += `<p class="text-sky-400">Bonus Déf. Base: +${currentLevelData.defensePowerBonus}</p>`; // Ajouté
                if(building.type === 'crafting' && currentLevelData.unlockedCategories) content += `<p class="text-orange-300">Catégories débloq.: ${currentLevelData.unlockedCategories.join(', ')}</p>`;

                content += `</div>`;
            } else if (level === 0) {
                content += `<p class="text-xs text-yellow-400 italic">Non débloqué.</p>`;
            }
            div.insertAdjacentHTML('beforeend', content);

            if (nextLevelDefinition) {
                const costObject = level === 0 ? nextLevelDefinition.costToUnlockOrUpgrade : nextLevelDefinition.costToUpgrade;
                if (costObject) {
                    let canAfford = true;
                    for (const resource in costObject) {
                        if (typeof window.itemsData !== 'undefined' && window.itemsData[resource]) { // C'est un item
                            if ((gameState.inventory.filter(invId => invId === resource).length || 0) < costObject[resource]) { canAfford = false; break; }
                        } else { // C'est une ressource standard
                            if ((gameState.resources[resource]||0) < costObject[resource]) { canAfford = false; break; }
                        }
                    }
                    const button = document.createElement('button');
                    button.className = `btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-xs mt-2 w-full`; // mt-2
                    let buttonTextContent = level === 0 ? `<i class="ti ti-lock-open mr-1"></i>Débloquer (` : `<i class="ti ti-arrow-up-circle mr-1"></i>Améliorer Niv. ${level + 1} (`;
                    buttonTextContent += Object.entries(costObject).map(([res, val]) => {
                        const resourceName = (typeof window.itemsData !== 'undefined' && window.itemsData[res]) ? window.itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1);
                        return `<span class="cost-part" data-resource-id="${res}" data-required-amount="${val}">${val} ${resourceName}</span>`;
                    }).join(', ');
                    buttonTextContent += `)`;
                    button.innerHTML = buttonTextContent;
                    if (!canAfford) button.disabled = true;
                    button.onclick = (e) => { /*e.stopPropagation();*/ if(typeof build === 'function') build(id); }; // build est global
                    if (typeof highlightInsufficientCosts === 'function' && typeof clearCostHighlights === 'function') { // Fonctions globales de utils.js
                        button.addEventListener('mouseover', () => highlightInsufficientCosts(button, costObject));
                        button.addEventListener('mouseout', () => clearCostHighlights(button));
                    }
                    div.appendChild(button);
                }
            } else if (level > 0 && building.type !== 'defense' && building.levels && level >= building.levels.length) {
                div.insertAdjacentHTML('beforeend', `<p class="text-xs text-green-400 mt-2 italic">Tech Max</p>`);
            }

            if (building.type === 'defense' && level > 0 && building.placementCost) {
                const placeButton = document.createElement('button');
                placeButton.className = 'btn btn-info btn-xs mt-1.5 w-full'; // mt-1.5
                placeButton.innerHTML = `<i class="ti ti-map-pin-plus mr-1"></i>Placer ${building.name}`;
                placeButton.onclick = (e) => { /*e.stopPropagation();*/ if(typeof enterPlacementMode === 'function') enterPlacementMode(id); else console.error("enterPlacementMode non défini"); }; // enterPlacementMode est global
                div.appendChild(placeButton);
            }
            buildingsContainer.appendChild(div);
        }
        if (buildingCount === 0) { buildingsContainer.innerHTML += "<p class='text-gray-500 italic text-sm p-2'>Aucun module structurel ou défensif disponible.</p>"; }
    },

    updateResearchDisplay: function() {
        const researchContainer = window.researchContainerEl; // Utiliser la ref globale
        if(!researchContainer) { console.warn("UI: updateResearchDisplay - Conteneur #research-content non trouvé."); return; }

        if (typeof window.researchData === 'undefined' || Object.keys(window.researchData).length === 0) {
            researchContainer.innerHTML = '<p class="text-gray-500 italic text-sm p-2">Données de recherche non chargées.</p>'; return;
        }
        if (!gameState || !gameState.research || !gameState.buildings) {
            researchContainer.innerHTML = '<p class="text-gray-500 italic text-sm p-2">État recherche/bâtiments non initialisé.</p>'; return;
        }
        researchContainer.innerHTML = ''; let researchAvailableCount = 0;

        if (gameState.activeResearch && window.researchData[gameState.activeResearch.id] && typeof window.buildingsData !== 'undefined' && typeof window.TICK_SPEED !== 'undefined') {
            const research = window.researchData[gameState.activeResearch.id];
            const labLevel = gameState.buildings['researchLab'] || 0;
            const researchLabData = window.buildingsData['researchLab'];
            let researchSpeedFactor = 0.5; // Default or base speed if lab data is missing
            if (labLevel > 0 && researchLabData && researchLabData.levels[labLevel-1] && researchLabData.levels[labLevel-1].researchSpeedFactor) {
                researchSpeedFactor = researchLabData.levels[labLevel - 1].researchSpeedFactor;
            }
            // Utiliser actualTotalTimeSeconds si disponible, sinon le recalculer
            const effectiveTotalTimeSeconds = gameState.activeResearch.actualTotalTimeSeconds || (research.time / researchSpeedFactor);
            const elapsedTicks = gameState.gameTime - gameState.activeResearch.startTime;
            const elapsedSeconds = elapsedTicks; // gameTime et startTime sont déjà en secondes
            const timeRemainingSecondsDisplay = Math.max(0, effectiveTotalTimeSeconds - elapsedSeconds);
            const progress = Math.min(100, (effectiveTotalTimeSeconds > 0 ? (elapsedSeconds / effectiveTotalTimeSeconds) : 0) * 100);

            const researchDiv = document.createElement('div');
            researchDiv.className = 'panel p-2.5 mb-2.5 rounded-lg shadow-md border border-yellow-500 bg-gray-800 bg-opacity-70'; // Style en cours
            researchDiv.dataset.tooltipType = 'research-card'; researchDiv.dataset.tooltipId = gameState.activeResearch.id;

            const infoIconContainer = document.createElement('div'); infoIconContainer.className = 'info-icon-container';
            const infoIcon = document.createElement('i'); infoIcon.className = 'ti ti-info-circle info-icon text-sky-400 hover:text-sky-300';
            infoIcon.title = `Plus d'infos sur ${research.name}`;
            infoIconContainer.appendChild(infoIcon); researchDiv.appendChild(infoIconContainer);

            researchDiv.insertAdjacentHTML('beforeend',
                `<h4 class="text-md font-semibold text-yellow-400 mb-1">En cours: ${research.name}</h4>
                 <p class="text-xs text-gray-400 mb-1.5">${research.description}</p>
                 <div class="w-full bg-gray-700 rounded-full h-2.5 mb-1">
                     <div class="bg-blue-500 h-2.5 rounded-full" style="width: ${progress.toFixed(2)}%"></div>
                 </div>
                 <p class="text-xs text-gray-300">Temps Restant: ${formatTime(timeRemainingSecondsDisplay)} (Facteur Labo: x${researchSpeedFactor.toFixed(1)})</p>`); // formatTime global
            researchContainer.appendChild(researchDiv);
            researchAvailableCount++;
        }

        for (const id in window.researchData) {
            const research = window.researchData[id];
            if (gameState.research[id]) { // Si la recherche est complétée
                const div = document.createElement('div');
                div.className = 'panel p-2.5 mb-2.5 opacity-70 rounded-lg shadow border border-gray-700 bg-gray-900'; // Style complété
                div.dataset.tooltipType = 'research-card'; div.dataset.tooltipId = id;
                // ... info icon ...
                const infoIconContainer = document.createElement('div'); infoIconContainer.className = 'info-icon-container';
                const infoIcon = document.createElement('i'); infoIcon.className = 'ti ti-info-circle info-icon text-sky-400 hover:text-sky-300';
                infoIcon.title = `Plus d'infos sur ${research.name}`;
                infoIconContainer.appendChild(infoIcon); div.appendChild(infoIconContainer);
                div.insertAdjacentHTML('beforeend', `<h4 class="text-md font-semibold text-green-400">${research.name} <span class="text-sm text-gray-500">(Acquis)</span></h4><p class="text-xs text-gray-500">${research.description}</p>`);
                researchContainer.appendChild(div);
                researchAvailableCount++; continue;
            }

            if (gameState.activeResearch && gameState.activeResearch.id === id) continue; // Déjà affiché comme "en cours"

            let canResearch = true; let requirementText = "";
            if (research.requirements) {
                if (research.requirements.buildings) {
                    for (const buildingId in research.requirements.buildings) {
                        if ((gameState.buildings[buildingId] || 0) < research.requirements.buildings[buildingId]) {
                            canResearch = false;
                            requirementText += `<span class="text-red-400">${(typeof window.buildingsData !== 'undefined' && window.buildingsData[buildingId]?.name) || buildingId} Niv. ${research.requirements.buildings[buildingId]} requis.</span><br>`;
                        }
                    }
                }
                if (research.requirements.research) {
                    research.requirements.research.forEach(reqResearchId => {
                        if (!gameState.research[reqResearchId]) {
                            canResearch = false;
                            requirementText += `<span class="text-red-400">Recherche "${(window.researchData && window.researchData[reqResearchId]?.name) || reqResearchId}" requise.</span><br>`;
                        }
                    });
                }
            }

            const div = document.createElement('div');
            div.className = 'panel p-2.5 mb-2.5 rounded-lg shadow border border-gray-700 bg-gray-800 bg-opacity-60'; // Style disponible
            div.dataset.tooltipType = 'research-card'; div.dataset.tooltipId = id;
            // ... info icon ...
            const infoIconContainer = document.createElement('div'); infoIconContainer.className = 'info-icon-container';
            const infoIcon = document.createElement('i'); infoIcon.className = 'ti ti-info-circle info-icon text-sky-400 hover:text-sky-300';
            infoIcon.title = `Plus d'infos sur ${research.name}`;
            infoIconContainer.appendChild(infoIcon); div.appendChild(infoIconContainer);

            let effectsText = "";
            if(research.grantsStatBoost) effectsText += `Stats: ${Object.entries(research.grantsStatBoost).map(([s,v])=>`${s}:+${v}`).join(', ')}. `;
            if(research.grantsModule && typeof window.nanobotModulesData !== 'undefined' && window.nanobotModulesData[research.grantsModule]) effectsText += `Module: ${window.nanobotModulesData[research.grantsModule].name}. `;
            // ... autres effets ...
            
            let content = `<h4 class="text-md font-semibold text-sky-300 mb-1">${research.name}</h4> <p class="text-xs text-gray-400 mb-1">${research.description}</p>`;
            if (effectsText) content += `<p class="text-xs text-green-300 mb-1">Effets: ${effectsText}</p>`;
            if (requirementText) content += `<div class="text-xs mt-1 text-red-400">${requirementText}</div>`; // text-red-400 pour les prérequis non remplis
            div.insertAdjacentHTML('beforeend', content);

            const button = document.createElement('button');
            let canAfford = true;
            for (const resource_1 in research.cost) { if ((gameState.resources[resource_1]||0) < research.cost[resource_1]) { canAfford = false; break; }}
            
            button.className = `btn ${(canResearch && canAfford && !gameState.activeResearch) ? 'btn-success' : 'btn-disabled'} btn-xs mt-2 w-full`;
            let buttonTextContent = `<i class="ti ti-flask mr-1"></i>Lancer Recherche (`;
            buttonTextContent += Object.entries(research.cost).map(([res, val]) => {
                const resourceName = (typeof window.itemsData !== 'undefined' && window.itemsData[res]) ? window.itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1);
                return `<span class="cost-part" data-resource-id="${res}" data-required-amount="${val}">${val} ${resourceName}</span>`;
            }).join(', ');
            buttonTextContent += ` - ${formatTime(research.time)})`; // formatTime global
            button.innerHTML = buttonTextContent;

            if (!canResearch || !canAfford || gameState.activeResearch) button.disabled = true;
            button.onclick = (e) => { /*e.stopPropagation();*/ if(typeof startResearch === 'function') startResearch(id); }; // startResearch global
            if (typeof highlightInsufficientCosts === 'function' && typeof clearCostHighlights === 'function') { // Fonctions globales
                button.addEventListener('mouseover', () => highlightInsufficientCosts(button, research.cost));
                button.addEventListener('mouseout', () => clearCostHighlights(button));
            }
            div.appendChild(button);
            researchContainer.appendChild(div);
            researchAvailableCount++;
        }
        if (researchAvailableCount === 0) { researchContainer.innerHTML += "<p class='text-gray-500 italic text-sm p-2'>Aucune recherche disponible ou en cours.</p>"; }
    },

    updateNanobotModulesDisplay: function() {
        const container = window.equippedModulesDisplayEl; // Utiliser ref globale
        if (!container) { console.warn("UI: updateNanobotModulesDisplay - #equipped-modules-display non trouvé."); return; }
        container.innerHTML = ''; let hasModules = false;

        if (typeof window.nanobotModulesData === 'undefined' || Object.keys(window.nanobotModulesData).length === 0) {
            container.innerHTML = "<p class='text-xs text-gray-500 italic p-1'>Données modules non chargées.</p>"; return;
        }
        if (!gameState || !gameState.nanobotModuleLevels) {
            container.innerHTML = "<p class='text-xs text-gray-500 italic p-1'>État modules non initialisé.</p>"; return;
        }

        for (const moduleId in window.nanobotModulesData) {
            const moduleData = window.nanobotModulesData[moduleId];
            if (!moduleData) { console.error(`[ModulesDisplay] ERREUR: Aucune donnée pour module ID '${moduleId}'.`); continue; }
            if (!moduleData.levels || !Array.isArray(moduleData.levels) || moduleData.levels.length === 0) {
                // ... gestion erreur données niveaux manquantes ...
                console.error(`[ModulesDisplay] ERREUR: Données de niveaux manquantes pour module '${moduleId}'.`);
                const errorDiv = document.createElement('div'); /* ... style erreur ... */ container.appendChild(errorDiv);
                hasModules = true; continue;
            }

            let isUnlocked = false; // Logique de déblocage du module
            if (moduleData.unlockMethod) {
                 if (moduleData.unlockMethod.research && gameState.research && gameState.research[moduleData.unlockMethod.research]) isUnlocked = true;
                 else if (moduleData.unlockMethod.building && typeof window.buildingsData !== 'undefined' && window.buildingsData[moduleData.unlockMethod.building] && (gameState.buildings[moduleData.unlockMethod.building] || 0) >= (moduleData.unlockMethod.buildingLevel || 1) ) isUnlocked = true;
            } else { isUnlocked = true; } // Débloqué par défaut si pas de méthode spécifiée


            let currentLevel = gameState.nanobotModuleLevels[moduleId] || 0;
            let isReplacedByActiveHigherTier = false;
            for (const checkId in window.nanobotModulesData) {
                if (window.nanobotModulesData[checkId].replaces === moduleId && (gameState.nanobotModuleLevels[checkId] || 0) > 0) {
                    isReplacedByActiveHigherTier = true; break;
                }
            }
            // Ne pas afficher si non débloqué ET niveau 0 ET remplacé (évite d'afficher des modules de bas niveau obsolètes jamais activés)
            if(isReplacedByActiveHigherTier && currentLevel === 0 && !isUnlocked) continue;

            if (isUnlocked || currentLevel > 0) {
                hasModules = true;
                const moduleDiv = document.createElement('div');
                moduleDiv.className = 'module-card bg-gray-700 bg-opacity-70 p-2.5 rounded-md shadow border border-gray-600';
                moduleDiv.dataset.tooltipType = 'module-card'; moduleDiv.dataset.tooltipId = moduleId;
                // ... info icon ...
                const infoIconContainer = document.createElement('div'); infoIconContainer.className = 'info-icon-container';
                const infoIcon = document.createElement('i'); infoIcon.className = 'ti ti-info-circle info-icon text-sky-400 hover:text-sky-300';
                infoIcon.title = `Plus d'infos sur ${moduleData.name}`;
                infoIconContainer.appendChild(infoIcon); moduleDiv.appendChild(infoIconContainer);

                let content = `<div class="flex justify-between items-baseline mb-1"><h4 class="font-semibold text-sm text-lime-400">${moduleData.name}</h4><span class="text-xs text-gray-400">Niv. ${currentLevel}</span></div>`;
                content += `<p class="text-xs text-gray-300 mb-1.5">${moduleData.description}</p>`;
                if (currentLevel > 0) {
                    const currentLevelDataDef = moduleData.levels.find(l => l.level === currentLevel);
                    if (currentLevelDataDef && currentLevelDataDef.statBoost) content += `<div class="text-xs text-green-300 mb-1.5"><strong>Actuel:</strong> ${Object.entries(currentLevelDataDef.statBoost).map(([s,v]) => `${(window.STAT_NAMES && window.STAT_NAMES[s] || s.charAt(0).toUpperCase() + s.slice(1))}:+${v}`).join(', ')}</div>`;
                } else if (isReplacedByActiveHigherTier) {
                    content += `<p class="text-xs text-gray-500 italic">Remplacé par une version supérieure.</p>`;
                } else {
                    content += `<p class="text-xs text-yellow-400">Prêt à activer.</p>`;
                }
                moduleDiv.insertAdjacentHTML('beforeend', content);

                const nextLevelDataDef = moduleData.levels.find(l => l.level === currentLevel + 1);
                const costDataForNextLevel = currentLevel === 0 ? moduleData.levels[0].costToUnlockOrUpgrade : (nextLevelDataDef ? nextLevelDataDef.costToUpgrade : null) ;

                if (costDataForNextLevel && (currentLevel < moduleData.levels.length) && !isReplacedByActiveHigherTier) {
                    let canAfford = true;
                    for(const res_1 in costDataForNextLevel) {
                        if (typeof window.itemsData !== 'undefined' && window.itemsData[res_1]) { // Item
                            if ((gameState.inventory || []).filter(itemId => itemId === res_1).length < costDataForNextLevel[res_1]) canAfford = false;
                        } else { // Ressource
                            if ((gameState.resources[res_1] || 0) < costDataForNextLevel[res_1]) canAfford = false;
                        }
                        if (!canAfford) break;
                    }
                    const buttonText = currentLevel === 0 ? "Activer" : "Améliorer";
                    const upgradeButton = document.createElement('button');
                    upgradeButton.className = `btn ${canAfford ? 'btn-primary' : 'btn-disabled'} btn-xs mt-2 w-full`;
                    let buttonHtmlContent = `<i class="ti ti-trending-up mr-1"></i>${buttonText} (`;
                    buttonHtmlContent += Object.entries(costDataForNextLevel).map(([res, val]) => {
                        const resourceName = (typeof window.itemsData !== 'undefined' && window.itemsData[res]) ? window.itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1);
                        return `<span class="cost-part" data-resource-id="${res}" data-required-amount="${val}">${val} ${resourceName}</span>`;
                    }).join(', ');
                    buttonHtmlContent += `)`;
                    upgradeButton.innerHTML = buttonHtmlContent;
                    if(!canAfford) upgradeButton.disabled = true;
                    upgradeButton.onclick = (e) => { /*e.stopPropagation();*/ if(typeof upgradeNanobotModule === 'function') upgradeNanobotModule(moduleId);}; // upgradeNanobotModule global
                    if (typeof highlightInsufficientCosts === 'function' && typeof clearCostHighlights === 'function') { // global
                        upgradeButton.addEventListener('mouseover', () => highlightInsufficientCosts(upgradeButton, costDataForNextLevel));
                        upgradeButton.addEventListener('mouseout', () => clearCostHighlights(upgradeButton));
                    }
                    moduleDiv.appendChild(upgradeButton);
                } else if (currentLevel > 0 && !isReplacedByActiveHigherTier) {
                    moduleDiv.insertAdjacentHTML('beforeend', `<p class="text-xs text-green-400 mt-1.5 italic">Niveau Max Atteint</p>`);
                }
                container.appendChild(moduleDiv);
            }
        }
        if (!hasModules) { container.innerHTML = "<p class='text-xs text-gray-500 italic p-1'>Aucun module débloqué ou disponible pour activation.</p>"; }
    },

    updateNanobotDisplay: function() {
        if (!gameState || !gameState.nanobotStats) { console.error("UI: updateNanobotDisplay - gameState ou nanobotStats non défini."); return; }
        if(window.nanobotHealthEl) window.nanobotHealthEl.textContent = `${Math.floor(gameState.nanobotStats.currentHealth)} / ${gameState.nanobotStats.health}`;
        if(window.nanobotAttackEl) window.nanobotAttackEl.textContent = gameState.nanobotStats.attack;
        if(window.nanobotDefenseEl) window.nanobotDefenseEl.textContent = gameState.nanobotStats.defense;
        if(window.nanobotSpeedEl) window.nanobotSpeedEl.textContent = gameState.nanobotStats.speed;
        
        if(window.nanobotVisualBody) {
            window.nanobotVisualBody.innerHTML = ''; // Vider
            const nanobotBaseImagePath = 'images/nanobot_base_body.png';
            window.nanobotVisualBody.style.backgroundImage = `url('${nanobotBaseImagePath}')`;
        }

        if (gameState.nanobotModuleLevels && typeof window.nanobotModulesData !== 'undefined' && window.nanobotVisualBody) {
            for (const moduleId in gameState.nanobotModuleLevels) {
                const currentLevel = gameState.nanobotModuleLevels[moduleId];
                if (currentLevel > 0) {
                    const moduleData = window.nanobotModulesData[moduleId];
                    if (moduleData) {
                        const imagePath = `images/module_visual_${moduleId}.png`; // Assurez-vous que ces images existent
                        const createAndAppendVisual = (baseClass, specificClassFromData) => {
                            const visualEl = document.createElement('div');
                            visualEl.className = `${baseClass} ${specificClassFromData || ''}`;
                            visualEl.style.backgroundImage = `url('${imagePath}')`;
                            window.nanobotVisualBody.appendChild(visualEl);
                        };
                        if (moduleData.visualClass) createAndAppendVisual('nanobot-module', moduleData.visualClass);
                        else if (moduleData.visualClasses && Array.isArray(moduleData.visualClasses)) {
                            moduleData.visualClasses.forEach(className => createAndAppendVisual('nanobot-module', className));
                        }
                    }
                }
            }
        }
        let equippedItemsNames = [];
        if (gameState.nanobotEquipment && typeof window.itemsData !== 'undefined' && window.nanobotVisualBody) {
            for (const slot in gameState.nanobotEquipment) {
                const itemId = gameState.nanobotEquipment[slot];
                if (itemId && window.itemsData[itemId]) {
                    const item = window.itemsData[itemId];
                    equippedItemsNames.push(item.name);
                    if (item.visualClass) {
                        const imagePath = `images/item_visual_${itemId}.png`; // Assurez-vous que ces images existent
                        const visualEl = document.createElement('div');
                        visualEl.className = `nanobot-item-visual ${item.visualClass}`;
                        visualEl.style.backgroundImage = `url('${imagePath}')`;
                        window.nanobotVisualBody.appendChild(visualEl);
                    }
                }
            }
        }
        if(window.equippedItemsDisplayBriefEl) window.equippedItemsDisplayBriefEl.textContent = equippedItemsNames.length > 0 ? `Actif: ${equippedItemsNames.join(', ')}` : "Aucun équipement (visuel).";
        
        if(typeof this.updateEquippedItemsDisplay === 'function') this.updateEquippedItemsDisplay();
        if(typeof this.updateNanobotModulesDisplay === 'function') this.updateNanobotModulesDisplay(); // S'assurer que c'est appelé
    },

    updateEquippedItemsDisplay: function() {
        const container = window.nanobotEquipmentSlotsEl; // Ref globale
        if(!container) { console.warn("UI: updateEquippedItemsDisplay - #nanobot-equipment-slots non trouvé."); return;}
        container.innerHTML = '';
        if (typeof window.EQUIPMENT_SLOTS === 'undefined' || typeof window.itemsData === 'undefined' || !gameState || !gameState.nanobotEquipment) {
            container.innerHTML = "<p class='text-xs text-gray-500 italic p-1'>Données d'équipement non disponibles.</p>"; return;
        }
        for (const slotId in window.EQUIPMENT_SLOTS) {
            const slotName = window.EQUIPMENT_SLOTS[slotId];
            const itemId = gameState.nanobotEquipment[slotId];
            const item = itemId ? window.itemsData[itemId] : null;
            
            const slotDiv = document.createElement('div');
            slotDiv.className = 'equipment-slot p-2.5 rounded-md shadow border border-gray-600 bg-gray-700 bg-opacity-70';
            slotDiv.dataset.tooltipType = 'equipment-slot'; slotDiv.dataset.tooltipId = slotId;

            if (item) {
                const infoIconContainer = document.createElement('div'); infoIconContainer.className = 'info-icon-container';
                const infoIcon = document.createElement('i'); infoIcon.className = 'ti ti-info-circle info-icon text-sky-400 hover:text-sky-300';
                infoIcon.title = `Plus d'infos sur ${item.name}`;
                infoIconContainer.appendChild(infoIcon); slotDiv.appendChild(infoIconContainer);
            }

            let contentHtml = `<div class="flex justify-between items-center mb-1"><span class="slot-name text-sm font-semibold text-fuchsia-400">${slotName}:</span>`;
            if (item) {
                contentHtml += `<span class="equipped-item-name text-sm text-gray-100">${item.name}</span></div>`;
                let itemEffects = [];
                if (item.statBoost) itemEffects.push(Object.entries(item.statBoost).map(([s,v]) => `<span class="text-xs ${v > 0 ? 'text-green-300' : 'text-red-300'}">${(window.STAT_NAMES && window.STAT_NAMES[s] || s.charAt(0).toUpperCase() + s.slice(1))}: ${v > 0 ? '+' : ''}${v}</span>`).join(', '));
                if (item.damageType && typeof window.DAMAGE_TYPES !== 'undefined') itemEffects.push(`<span class="text-xs text-cyan-300">Type Dégât: ${window.DAMAGE_TYPES[item.damageType]?.charAt(0).toUpperCase() + window.DAMAGE_TYPES[item.damageType]?.slice(1) || item.damageType}</span>`);
                if (itemEffects.length > 0) contentHtml += `<div class="text-xs text-gray-300 mt-0.5 mb-1.5">${itemEffects.join('; ')}</div>`;
                contentHtml += `<p class="text-xs text-gray-400 mb-2 italic">${item.description}</p>`;
                contentHtml += `<button class="btn btn-outline btn-danger btn-xs w-full" onclick="/*event.stopPropagation();*/ if(typeof unequipItem === 'function') unequipItem('${slotId}');"><i class="ti ti-player-eject mr-1"></i>Retirer</button>`; // unequipItem global
            } else {
                contentHtml += `<span class="empty-slot text-sm text-gray-500 italic">Vide</span></div>`;
                contentHtml += `<p class="text-xs text-gray-500 h-10 mb-2 flex items-center justify-center italic">Choisissez un objet depuis l'inventaire.</p>`; // Centré et placeholder
                contentHtml += `<button class="btn btn-disabled btn-xs w-full" disabled>Retirer</button>`;
            }
            slotDiv.insertAdjacentHTML('beforeend', contentHtml);
            container.appendChild(slotDiv);
        }
    },

    updateXpBar: function() {
        // Assurer que window.xpBarEl est la bonne référence (celui de la modale de fin de combat est combatXpBarEl)
        const generalXpBar = window.xpBarEl; // Celui dans le header ou panneau joueur principal
        if(!generalXpBar || !gameState || !gameState.nanobotStats || gameState.nanobotStats.level === undefined) return;
        const stats = gameState.nanobotStats;
        const xpToNextLevel = stats.xpToNext > 0 && stats.xpToNext !== Infinity ? stats.xpToNext : 1; // Éviter division par zéro
        const percent = (stats.xp / xpToNextLevel) * 100;
        generalXpBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    },

    updateBaseStatusDisplay: function() {
        // Utiliser les refs globales
        if(!window.baseHealthValueEl || !window.baseMaxHealthValueEl || !window.overviewBaseHealthEl || !window.baseHealthBarEl || !window.baseDefensePowerEl || !window.repairBaseBtn || !window.repairDefensesBtn || !window.baseHealthDisplayEl ) return;
        if (!gameState || !gameState.baseStats || !gameState.nightAssault) return;

        const base = gameState.baseStats;
        window.baseHealthValueEl.textContent = Math.floor(base.currentHealth);
        window.baseMaxHealthValueEl.textContent = base.maxHealth;
        window.overviewBaseHealthEl.textContent = `${Math.floor(base.currentHealth)} / ${base.maxHealth}`;
        
        const healthPercent = (base.maxHealth > 0 ? (base.currentHealth / base.maxHealth) : 0) * 100;
        window.baseHealthBarEl.style.width = `${healthPercent}%`;
        window.baseHealthBarEl.classList.remove('bg-red-500', 'bg-yellow-500', 'bg-green-500'); // Enlever anciennes classes de couleur Tailwind
        if (healthPercent < 30) window.baseHealthBarEl.classList.add('bg-red-500'); // low
        else if (healthPercent < 60) window.baseHealthBarEl.classList.add('bg-yellow-500'); // medium
        else window.baseHealthBarEl.classList.add('bg-green-500'); // high

        window.baseDefensePowerEl.textContent = `Défense: ${base.defensePower}`;
        window.repairBaseBtn.disabled = gameState.baseStats.currentHealth >= gameState.baseStats.maxHealth;
        window.repairBaseBtn.classList.toggle('btn-disabled', window.repairBaseBtn.disabled);
        
        let hasDamagedDefenses = false;
        if (gameState.defenses) {
            for (const defId in gameState.defenses) {
                if (gameState.defenses[defId].currentHealth < gameState.defenses[defId].maxHealth) {
                    hasDamagedDefenses = true; break;
                }
            }
        }
        window.repairDefensesBtn.disabled = !hasDamagedDefenses;
        window.repairDefensesBtn.classList.toggle('btn-disabled', window.repairDefensesBtn.disabled);
        
        const baseStatusSection = document.getElementById('base-status-section'); // Peut être null si pas sur la page
        if(baseStatusSection) baseStatusSection.classList.toggle('night-assault-active', gameState.nightAssault.isActive && !gameState.isDay);
        
        // Clignotement du texte de santé de la base pendant l'assaut
        window.baseHealthDisplayEl.classList.toggle('text-[var(--accent-red)]', gameState.nightAssault.isActive && !gameState.isDay);
        window.baseHealthDisplayEl.classList.toggle('font-bold', gameState.nightAssault.isActive && !gameState.isDay);
        window.baseHealthDisplayEl.classList.toggle('animate-pulse', gameState.nightAssault.isActive && !gameState.isDay);


        if(typeof this.updateBasePreview === 'function') this.updateBasePreview();
    },

    updateBasePreview: function() {
        const previewContainer = window.basePreviewContainerEl; // Ref globale
        if (!previewContainer) { /* console.error("UI: updateBasePreview - basePreviewContainerEl est null !"); */ return; }
        
        if (typeof window.BASE_GRID_SIZE === 'undefined' || !gameState || !Array.isArray(gameState.baseGrid) || typeof gameState.defenses !== 'object' || typeof window.buildingsData === 'undefined') {
            previewContainer.innerHTML = "<p class='text-red-500 text-xs p-2'>Erreur: Schéma base indisponible.</p>"; return;
        }
        previewContainer.style.setProperty('--base-grid-cols', String(window.BASE_GRID_SIZE.cols)); // S'assurer que c'est une chaîne
        previewContainer.style.setProperty('--base-grid-rows', String(window.BASE_GRID_SIZE.rows));
        previewContainer.innerHTML = '';
        previewContainer.style.gridTemplateRows = `repeat(${window.BASE_GRID_SIZE.rows}, minmax(0, 1fr))`;
        previewContainer.style.gridTemplateColumns = `repeat(${window.BASE_GRID_SIZE.cols}, minmax(0, 1fr))`;

        for (let r = 0; r < window.BASE_GRID_SIZE.rows; r++) {
            for (let c = 0; c < window.BASE_GRID_SIZE.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'base-preview-cell';
                cell.style.gridRowStart = r + 1; cell.style.gridColumnStart = c + 1;
                cell.dataset.row = r; cell.dataset.col = c;

                const coreRow = Math.floor(window.BASE_GRID_SIZE.rows / 2);
                const coreCol = Math.floor(window.BASE_GRID_SIZE.cols / 2);

                if (r === coreRow && c === coreCol) {
                    cell.classList.add('core');
                    const coreVisual = document.createElement('div');
                    coreVisual.className = 'base-core-visual'; coreVisual.textContent = 'N';
                    cell.appendChild(coreVisual); cell.id = 'base-core-visual-cell';
                } else {
                    const defenseOnCell = gameState.baseGrid[r] && gameState.baseGrid[r][c];
                    if (defenseOnCell && defenseOnCell.instanceId && gameState.defenses[defenseOnCell.instanceId]) {
                        cell.classList.add('occupied');
                        const defenseData = window.buildingsData[defenseOnCell.id];
                        if(defenseData && defenseData.gridVisual && defenseData.gridVisual.class){
                            const visual = document.createElement('div');
                            visual.className = `defense-visual-on-grid ${defenseData.gridVisual.class}`;
                            visual.textContent = defenseData.gridVisual.char || '';
                            cell.appendChild(visual);
                        }
                        if (gameState.placementMode.isActive) cell.classList.add('placement-blocked');
                    } else if (gameState.placementMode.isActive && typeof window.buildingsData !== 'undefined' && window.buildingsData[gameState.placementMode.selectedDefenseType]) {
                        cell.classList.add('placement-active');
                        cell.title = `Placer ${window.buildingsData[gameState.placementMode.selectedDefenseType]?.name || 'défense'}`;
                    }
                }
                if(typeof handleGridCellClick === 'function') cell.addEventListener('click', () => handleGridCellClick(r, c)); // handleGridCellClick global
                previewContainer.appendChild(cell);
            }
        }
        // Logique de dessin des ennemis et projectiles (sera appelée par la boucle de jeu principale si besoin)
        if(gameState.nightAssault.isActive && gameState.nightAssault.enemies.length > 0){
            this.drawNightAssaultEnemiesOnPreview();
        }
    },

    drawNightAssaultEnemiesOnPreview: function() {
        if (!window.basePreviewContainerEl || !gameState || !gameState.nightAssault || !gameState.nightAssault.enemies) return;
        // Enlever les anciens visuels d'ennemis et barres de vie
        window.basePreviewContainerEl.querySelectorAll('.base-enemy-visual, .enemy-health-bar-on-grid-container').forEach(el => el.remove());

        gameState.nightAssault.enemies.forEach(enemy => {
            if (enemy.currentHealth <= 0) return;
            const enemyVisual = document.createElement('div');
            enemyVisual.className = `base-enemy-visual ${enemy.typeInfo.id || 'generic-enemy'}`; // Classe basée sur l'ID du type d'ennemi
            enemyVisual.style.left = `${enemy.x}px`; // Supposant que x,y sont déjà en pixels relatifs au conteneur
            enemyVisual.style.top = `${enemy.y}px`;
            enemyVisual.style.width = `${enemy.typeInfo.visualSize?.width || 10}px`; // Taille par défaut
            enemyVisual.style.height = `${enemy.typeInfo.visualSize?.height || 10}px`;
            if (enemy.typeInfo.spritePathGrid) { // Si une image spécifique pour la grille
                enemyVisual.style.backgroundImage = `url('${enemy.typeInfo.spritePathGrid}')`;
                enemyVisual.style.backgroundColor = 'transparent';
            } else {
                enemyVisual.style.backgroundColor = enemy.typeInfo.color || 'var(--accent-red)';
            }
            window.basePreviewContainerEl.appendChild(enemyVisual);

            // Barre de vie
            const healthBarContainer = document.createElement('div');
            healthBarContainer.className = 'enemy-health-bar-on-grid-container';
            const healthPercent = (enemy.maxHealth > 0 ? (enemy.currentHealth / enemy.maxHealth) : 0) * 100;
            healthBarContainer.style.width = `${enemy.typeInfo.visualSize?.width || 10}px`;
            healthBarContainer.style.height = `3px`;
            healthBarContainer.style.left = `${enemy.x}px`;
            healthBarContainer.style.top = `${enemy.y - 5}px`; // Au-dessus du visuel

            const healthBarFill = document.createElement('div');
            healthBarFill.className = 'enemy-health-bar-on-grid-fill';
            healthBarFill.style.width = `${healthPercent}%`;
            healthBarContainer.appendChild(healthBarFill);
            window.basePreviewContainerEl.appendChild(healthBarContainer);
        });
    },

    drawLaserShot: function(startX, startY, endX, endY, type = 'friendly') {
        if (typeof drawProjectileVisual === 'function') drawProjectileVisual(startX, startY, endX, endY, type, 'laser'); // drawProjectileVisual global
    },
    drawEnemyProjectile: function(startX, startY, endX, endY, damageType) {
        this.drawLaserShot(startX, startY, endX, endY, 'enemy'); // Simplifié pour l'instant
    },

    managePlacedDefense: function(instanceId, row, col) {
        if (!gameState || !gameState.defenses || !gameState.defenses[instanceId] || typeof window.buildingsData === 'undefined' || !window.buildingsData[gameState.defenses[instanceId].id] || typeof window.itemsData === 'undefined') {
            if (typeof showModal === 'function') showModal("Erreur", "Impossible de gérer cette défense, données manquantes ou corrompues.");
            return;
        }
        const defenseInstance = gameState.defenses[instanceId];
        const defenseTypeData = window.buildingsData[defenseInstance.id];
        const currentTechLevel = gameState.buildings[defenseInstance.id] || 0; // Niveau technologique du type de défense

        let modalContent = `<h4 class="font-orbitron text-md mb-1">${defenseInstance.name} (Niv. Instance ${defenseInstance.level} / Tech ${currentTechLevel})</h4>`;
        modalContent += `<p class="text-xs">PV: ${Math.floor(defenseInstance.currentHealth)} / ${defenseInstance.maxHealth}</p>`;
        if (defenseInstance.attack !== undefined) modalContent += `<p class="text-xs">Attaque: ${defenseInstance.attack}</p>`;
        if (defenseInstance.range !== undefined) modalContent += `<p class="text-xs">Portée: ${defenseInstance.range}</p>`;
        modalContent += `<hr class="my-2 border-gray-600">`;
        
        let actionsHtml = `<div class="flex flex-col space-y-1">`;
        const canUpgradeInstance = defenseInstance.level < currentTechLevel && defenseTypeData.levels && defenseInstance.level < defenseTypeData.levels.length;

        if (canUpgradeInstance) {
            const nextLevelData = defenseTypeData.levels.find(l => l.level === defenseInstance.level + 1);
            if (nextLevelData && nextLevelData.costToUpgradeInstance) { // Renommé de costToUpgrade
                let costStringForButton = typeof getCostString === 'function' ? getCostString(nextLevelData.costToUpgradeInstance, false, true) : "Coût non affichable"; // getCostString global
                
                const upgradeButton = document.createElement('button');
                upgradeButton.className = 'btn btn-primary btn-sm';
                upgradeButton.innerHTML = `Améliorer Instance (<span class="upgrade-cost-wrapper">${costStringForButton}</span>)`;
                
                let canAffordUpgrade = true;
                for(const res in nextLevelData.costToUpgradeInstance) {
                    if (window.itemsData[res]) { // Item
                        if ((gameState.inventory.filter(id => id === res).length || 0) < nextLevelData.costToUpgradeInstance[res]) {canAffordUpgrade=false; break;}
                    } else { // Ressource
                        if ((gameState.resources[res] || 0) < nextLevelData.costToUpgradeInstance[res]) {canAffordUpgrade=false; break;}
                    }
                }
                if (!canAffordUpgrade) { upgradeButton.classList.add('btn-disabled'); upgradeButton.disabled = true; }
                upgradeButton.onclick = (e) => { /*e.stopPropagation();*/ handleDefenseAction(instanceId, 'upgrade'); }; // handleDefenseAction global
                
                if (typeof highlightInsufficientCosts === 'function' && typeof clearCostHighlights === 'function') { // global
                    const costWrapper = document.createElement('div'); costWrapper.innerHTML = costStringForButton; // Pour que querySelectorAll fonctionne
                    upgradeButton.addEventListener('mouseover', () => highlightInsufficientCosts(upgradeButton, nextLevelData.costToUpgradeInstance));
                    upgradeButton.addEventListener('mouseout', () => clearCostHighlights(upgradeButton));
                }
                actionsHtml += upgradeButton.outerHTML;
            }
        } else if (defenseInstance.level >= currentTechLevel && defenseTypeData.levels && defenseInstance.level < defenseTypeData.levels.length) {
            actionsHtml += `<p class="text-xs text-yellow-400 italic">Améliorez d'abord la technologie de ${defenseTypeData.name}.</p>`;
        } else if (defenseTypeData.levels && defenseInstance.level >= defenseTypeData.levels.length) {
            actionsHtml += `<p class="text-xs text-green-400 italic">Niveau d'instance maximum atteint.</p>`;
        }

        actionsHtml += `<button class="btn btn-danger btn-sm" onclick="/*event.stopPropagation();*/ handleDefenseAction('${instanceId}', 'sell', ${row}, ${col})">Vendre</button>`; // handleDefenseAction global
        actionsHtml += `</div>`;
        modalContent += actionsHtml;
        if (typeof showModal === 'function') showModal("Gérer Défense", modalContent, null, true); // showModal global
    },

    updateDisplays: function() {
        if (!gameState) { /*console.warn("UI: updateDisplays - gameState non défini, arrêt.");*/ return; }
        
        if(typeof this.updateResourceDisplay === 'function') this.updateResourceDisplay();
        if(typeof this.updateXpBar === 'function') this.updateXpBar(); // XpBar général du header

        const activeMainSectionButton = document.querySelector('#main-navigation .nav-button.active');
        if (!activeMainSectionButton) return;
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
                if (activeSubTabId === 'nanobot-config-subtab' && typeof this.updateNanobotDisplay === 'function') this.updateNanobotDisplay();
                else if (activeSubTabId === 'inventory-subtab' && typeof updateInventoryDisplay === 'function') updateInventoryDisplay(); 
            }
        } else if (activeMainSectionId === 'crafting-section') { // NOUVELLE SECTION
            if (typeof window.craftingUI !== 'undefined' && typeof window.craftingUI.updateCraftingDisplay === 'function') {
                window.craftingUI.updateCraftingDisplay();
            }
        } else if (activeMainSectionId === 'world-section') {
            if (gameState.map && gameState.map.activeExplorationTileCoords && typeof window.explorationUI !== 'undefined' && 
                typeof window.explorationUI.updateActiveTileExplorationView === 'function' &&
                window.explorationUI.activeTileUiElements && window.explorationUI.activeTileUiElements.container && 
                !window.explorationUI.activeTileUiElements.container.classList.contains('hidden')) {
                // Si en mode exploration active, mettre à jour cette vue
                window.explorationUI.updateActiveTileExplorationView(gameState.map.activeExplorationTileCoords.x, gameState.map.activeExplorationTileCoords.y);
            } else {
                // Sinon, mettre à jour la carte du monde et le panneau d'aperçu
                const activeSubTabButton = document.querySelector('#world-section .sub-nav-button.active');
                if (activeSubTabButton) {
                    const activeSubTabId = activeSubTabButton.dataset.subtab;
                    if (activeSubTabId === 'exploration-subtab' && typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateFullExplorationView === 'function') {
                        window.explorationUI.updateFullExplorationView();
                    } else if (activeSubTabId === 'quests-subtab' && typeof window.questUI !== 'undefined' && typeof window.questUI.updateQuestDisplay === 'function') {
                        window.questUI.updateQuestDisplay();
                    }
                }
            }
        } else if (activeMainSectionId === 'shop-section') {
            if (typeof updateShopDisplay === 'function') updateShopDisplay(); 
        }
    }
};
window.uiUpdates = uiUpdates; // Rendre global

// handleDefenseAction est déjà globalement défini à la fin de ce fichier.

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