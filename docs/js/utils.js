// js/utils.js
console.log("utils.js - Fichier chargé et en cours d'analyse...");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatTime(seconds) {
    const flooredSeconds = Math.floor(seconds);
    const minutes = Math.floor(flooredSeconds / 60);
    const remainingSeconds = flooredSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

var modalConfirmCallback = null;
var modalCancelCallback = null;

function showModal(title, message, onConfirm, showCancel = true, onCancel = null) {
    if (typeof modalTitle !== 'undefined' && modalTitle) modalTitle.textContent = title;
    else console.warn("utils.js: showModal - modalTitle non trouvé.");

    if (typeof modalMessage !== 'undefined' && modalMessage) modalMessage.innerHTML = message; // Utiliser innerHTML pour permettre les <br>
    else console.warn("utils.js: showModal - modalMessage non trouvé.");

    modalConfirmCallback = onConfirm;
    modalCancelCallback = onCancel;

    if (typeof modalConfirm !== 'undefined' && modalConfirm) {
        modalConfirm.style.display = onConfirm ? 'inline-block' : 'none';
        modalConfirm.classList.toggle('hidden', !onConfirm);
    } else console.warn("utils.js: showModal - modalConfirm non trouvé.");

    if (typeof modalCancel !== 'undefined' && modalCancel) {
         modalCancel.style.display = showCancel ? 'inline-block' : 'none';
         modalCancel.classList.toggle('hidden', !showCancel);
         modalCancel.onclick = () => {
            if (modalCancelCallback) modalCancelCallback();
            hideModal();
         };
    } else console.warn("utils.js: showModal - modalCancel non trouvé.");

    if (typeof modal !== 'undefined' && modal) modal.classList.remove('hidden');
    else console.warn("utils.js: showModal - modal non trouvé.");
}

function hideModal() {
    if (typeof modal !== 'undefined' && modal) modal.classList.add('hidden');
    else console.warn("utils.js: hideModal - modal non trouvé.");
    modalConfirmCallback = null;
    modalCancelCallback = null;
}

function addLogEntry(message, type = "info", logElement = null, logArray = null) {
    if (typeof gameState === 'undefined' || gameState === null) {
        console.warn("addLogEntry: gameState non défini.");
        console.log(`LOG (gameState non défini) [${type}]: ${message}`);
        return;
    }
    const currentGameTime = gameState.gameTime !== undefined ? gameState.gameTime : 0;
    const currentTickSpeed = typeof TICK_SPEED !== 'undefined' ? TICK_SPEED : 1000;

    if (logElement === null) {
        if (type === "map-event" && typeof explorationLogEl !== 'undefined' && explorationLogEl) logElement = explorationLogEl;
        else if ((type === "base-assault-event" || type === "base-defense-event" || type === "base-info-event") && typeof nightAssaultLogEl !== 'undefined' && nightAssaultLogEl) logElement = nightAssaultLogEl;
        else if (typeof eventLogEl !== 'undefined' && eventLogEl) logElement = eventLogEl;
    }

    if (logArray === null) {
        if (type === "map-event" && Array.isArray(gameState.explorationLog)) logArray = gameState.explorationLog;
        else if ((type === "base-assault-event" || type === "base-defense-event" || type === "base-info-event") && gameState.nightAssault && Array.isArray(gameState.nightAssault.log)) logArray = gameState.nightAssault.log;
        else if (Array.isArray(gameState.eventLog)) logArray = gameState.eventLog;
    }

    const timestamp = (type !== "combat-visual" && type !== "map-event" && type !== "base-assault-event" && type !== "base-defense-event" && type !== "base-info-event")
                    ? `[${formatTime(Math.floor(currentGameTime * (currentTickSpeed/1000)))}] `
                    : "";
    const entry = document.createElement('p');
    entry.className = 'text-xs'; 

    if (logElement === nightAssaultLogEl) {
        if (type === "base-assault-event" || type === "error") entry.classList.add("text-red-400");
        else if (type === "base-defense-event") entry.classList.add("text-teal-300");
        else if (type === "success") entry.classList.add("text-green-400");
        else if (type === "base-info-event") entry.classList.add("text-gray-400"); 
        else entry.classList.add("text-orange-300"); 
    } else if (logElement === explorationLogEl) {
        if (type === "error") entry.classList.add("text-red-400");
        else if (type === "success") entry.classList.add("text-green-400");
        else if (type === "warning") entry.classList.add("text-yellow-400");
        else if (type === "map-event") entry.classList.add("text-blue-300");
        else entry.classList.add("text-gray-300");
    } else if (logElement === eventLogEl) {
        if (type === "error") entry.classList.add("text-red-400");
        else if (type === "success") entry.classList.add("text-green-400");
        else if (type === "warning") entry.classList.add("text-yellow-400");
        else if (type === "combat") entry.classList.add("text-orange-300");
        else entry.classList.add("text-gray-300");
    } else if (logElement === combatLogSummaryEl) {
         if (type === "error") entry.classList.add("text-red-400");
        else if (type === "success") entry.classList.add("text-green-400");
        else if (type === "warning") entry.classList.add("text-yellow-400");
        else entry.classList.add("text-orange-300"); 
    } else { 
        if (type === "error") entry.classList.add("text-red-400");
        else if (type === "success") entry.classList.add("text-green-400");
    }
    entry.innerHTML = `<span class="text-gray-500 text-xs">${timestamp}</span>${message}`;

    if (logElement) {
        const titleElements = logElement.querySelectorAll('h3, h4');
        let titleHTML = "";
        if (titleElements.length > 0 && titleElements[0].closest(`#${logElement.id}`)) {
            titleHTML = titleElements[0].outerHTML;
        }

        const initialMessages = ["En attente", "initialisé", "Aucun événement récent", "Log Combat:"];
        const placeholderP = logElement.querySelector('p.text-gray-500.italic');

        if (placeholderP && initialMessages.some(msg => placeholderP.textContent.trim().toLowerCase().includes(msg.toLowerCase().replace("...", "")))) {
             logElement.innerHTML = titleHTML; 
        }
        logElement.appendChild(entry);
        logElement.scrollTop = logElement.scrollHeight;
    }

    if (logArray && Array.isArray(logArray)) {
        const initialMessagesForArray = ["initialisé", "Aucun événement récent", "En attente"];
        let shouldClearArray = false;
        if (logArray.length === 1 && typeof logArray[0] === 'string' &&
            initialMessagesForArray.some(initMsg => logArray[0].toLowerCase().includes(initMsg.toLowerCase().replace("...", "")))) {
            if (message && !initialMessagesForArray.some(initMsg => message.toLowerCase().includes(initMsg.toLowerCase().replace("...", "")))) {
                shouldClearArray = true;
            }
        }
        if (shouldClearArray) { logArray.length = 0; }

        logArray.push(`${timestamp}${message}`);
        const maxLogLength = (logElement === nightAssaultLogEl) ? 75 : (logElement === explorationLogEl ? 50 : (logElement === combatLogSummaryEl ? 30 : 100));
        while (logArray.length > maxLogLength) {
            logArray.shift();
        }
    }
}

function calculateModifiedDamage(baseDamage, damageType, targetResistances) {
    if (!damageType || typeof targetResistances !== 'object' || targetResistances === null) {
        return Math.max(0, Math.floor(baseDamage));
    }
    const resistanceValue = targetResistances[damageType] || 0;
    return Math.max(0, Math.floor(baseDamage * (1 - resistanceValue)));
}

function showNightAssaultVideo(videoSrc = "videos/night_assault_alert.mp4") {
    const videoContainer = document.getElementById('night-assault-video-container');
    const videoElement = document.getElementById('night-assault-video');

    if (!videoContainer || !videoElement) {
        console.warn("Éléments de la vidéo d'assaut nocturne non trouvés.");
        return;
    }
    const currentVideoFile = videoElement.getAttribute('src');
    if (currentVideoFile !== videoSrc) {
         videoElement.src = videoSrc;
         videoElement.load(); 
    }
    videoContainer.classList.remove('hidden');
    videoElement.currentTime = 0;
    videoElement.muted = true; 

    videoElement.play().then(() => {}).catch(error => {
        console.warn("showNightAssaultVideo: Lecture automatique de la vidéo bloquée :", error);
        if(typeof addLogEntry === 'function' && typeof eventLogEl !== 'undefined' && typeof gameState !== 'undefined' && gameState.eventLog){
            addLogEntry("Animation d'alerte: lecture auto bloquée.", "warning", eventLogEl, gameState.eventLog);
        }
    });
    videoElement.onended = function() { hideNightAssaultVideo(); videoElement.onended = null; };
    videoElement.onerror = function(e) {
        console.error("showNightAssaultVideo: Erreur de chargement/lecture vidéo.", videoElement.error);
        if(typeof addLogEntry === 'function' && typeof eventLogEl !== 'undefined' && typeof gameState !== 'undefined' && gameState.eventLog){
            addLogEntry("Erreur lors du chargement de l'animation d'alerte.", "error", eventLogEl, gameState.eventLog);
        }
        hideNightAssaultVideo(); videoElement.onerror = null; 
    };
}
function hideNightAssaultVideo() {
    const videoContainer = document.getElementById('night-assault-video-container');
    const videoElement = document.getElementById('night-assault-video');
    if (!videoContainer || !videoElement) return;
    videoContainer.classList.add('hidden');
    if (!videoElement.paused) videoElement.pause();
}


// --- DEBUT SYSTEME DE TOOLTIP ---
let tooltipElement;
let tooltipTimeout; // Pour un léger délai avant l'affichage

function initializeTooltipSystem() {
    tooltipElement = document.getElementById('tooltip');
    if (!tooltipElement) {
        console.error("Élément Tooltip non trouvé ! Assurez-vous qu'il existe dans l'HTML.");
        return;
    }

    // Utiliser la délégation d'événements sur un conteneur plus global si possible
    // ou document.body si nécessaire.
    const gameAreaForTooltips = document.getElementById('game-container') || document.body;

    gameAreaForTooltips.addEventListener('mouseover', handleTooltipShow);
    gameAreaForTooltips.addEventListener('mouseout', handleTooltipHide);
    gameAreaForTooltips.addEventListener('mousemove', positionTooltip); // Pour que le tooltip suive la souris
    console.log("Système de Tooltip initialisé.");
}

function handleTooltipShow(event) {
    const target = event.target.closest('[data-tooltip-type]');
    if (!target || !tooltipElement) return;

    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
        const tooltipType = target.dataset.tooltipType;
        const tooltipId = target.dataset.tooltipId;
        const tooltipExtra = target.dataset.tooltipExtra;

        const content = generateTooltipContent(tooltipType, tooltipId, tooltipExtra, target);
        if (content) {
            tooltipElement.innerHTML = content;
            tooltipElement.classList.remove('hidden');
            // Laisser positionTooltip gérer le positionnement initial basé sur l'événement mousemove capturé
        } else {
            tooltipElement.classList.add('hidden');
        }
    }, 200); // Délai de 200ms
}

function handleTooltipHide(event) {
    // Vérifier si la souris est toujours sur un élément qui *devrait* afficher un tooltip
    // ou si elle est passée sur le tooltip lui-même (ce qu'on évite avec pointer-events: none)
    const relatedTargetIsTooltipChild = tooltipElement && tooltipElement.contains(event.relatedTarget);
    const currentTargetHasTooltip = event.target.closest && event.target.closest('[data-tooltip-type]');

    if (!relatedTargetIsTooltipChild && !tooltipElement.matches(':hover') && (!currentTargetHasTooltip || !event.relatedTarget || !event.relatedTarget.closest || !event.relatedTarget.closest('[data-tooltip-type]'))) {
        clearTimeout(tooltipTimeout);
        tooltipElement.classList.add('hidden');
    }
}


function positionTooltip(event) {
    if (!tooltipElement || tooltipElement.classList.contains('hidden')) return;

    let x = event.clientX + 15; // Décalage pour ne pas être sous le curseur
    let y = event.clientY + 15;

    const tooltipWidth = tooltipElement.offsetWidth;
    const tooltipHeight = tooltipElement.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Ajuster si le tooltip sort de l'écran
    if (x + tooltipWidth > windowWidth - 10) { // 10px de marge
        x = event.clientX - tooltipWidth - 15; // Le mettre à gauche du curseur
    }
    if (y + tooltipHeight > windowHeight - 10) {
        y = event.clientY - tooltipHeight - 15; // Le mettre au-dessus du curseur
    }
    if (x < 10) x = 10;
    if (y < 10) y = 10;


    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
}

function generateTooltipContent(type, id, extra, targetElement) {
    if (typeof gameState === 'undefined' || gameState === null) return null; // S'assurer que gameState est disponible

    // Charger les données de config si elles ne sont pas globales (ce qui devrait être le cas avec 'var')
    // Normalement, elles sont globales via les fichiers de config chargés avant.
    if (typeof buildingsData === 'undefined' || typeof itemsData === 'undefined' ||
        typeof researchData === 'undefined' || typeof nanobotModulesData === 'undefined' ||
        typeof EQUIPMENT_SLOTS === 'undefined' || typeof MAX_MOBILITY_POINTS === 'undefined' ||
        typeof MOBILITY_RECHARGE_TICKS === 'undefined' || typeof TICK_SPEED === 'undefined'
    ) {
        console.warn("generateTooltipContent: Une ou plusieurs structures de données de config sont manquantes.");
        return "Erreur de données...";
    }


    switch (type) {
        case 'resource-header':
            return getResourceHeaderTooltip(id);
        case 'stat-nanobot':
            return getNanobotStatTooltip(id);
        case 'building-card':
            return getBuildingCardTooltip(id);
        case 'research-card':
            return getResearchCardTooltip(id);
        case 'module-card': // Pour les modules Nanobot
            return getModuleCardTooltip(id);
        case 'inventory-item':
            return getItemTooltip(id, 'inventory');
        case 'shop-item':
            return getItemTooltip(id, 'shop');
        case 'equipment-slot':
            return getEquipmentSlotTooltip(id); // id ici serait 'weapon', 'armor', etc.
        // case 'base-defense-grid': // Pourrait être utile plus tard si vous voulez survoler les défenses sur la grille
        //     return getPlacedDefenseTooltip(id, extra);
        default:
            return `<i>Tooltip pour "${type}" non implémenté.</i>`;
    }
}

function getResourceHeaderTooltip(resourceId) {
    let html = `<strong>${resourceId.charAt(0).toUpperCase() + resourceId.slice(1)}</strong><hr>`;
    const currentAmount = gameState.resources[resourceId] !== undefined ? Math.floor(gameState.resources[resourceId]) : 'N/A';
    html += `<p>Actuel: ${currentAmount}</p>`;

    let producers = [];
    let consumers = [];

    if (resourceId === 'biomass' || resourceId === 'nanites') {
        const rate = gameState.productionRates[resourceId] !== undefined ? gameState.productionRates[resourceId].toFixed(1) : 'N/A';
        html += `<p>Taux Net: ${rate}/s</p>`;
        for (const buildingId in gameState.buildings) {
            const level = gameState.buildings[buildingId];
            if (level > 0 && buildingsData[buildingId] && buildingsData[buildingId].levels[level - 1]) {
                const prod = buildingsData[buildingId].levels[level - 1].production?.[resourceId];
                if (prod > 0) producers.push(`${buildingsData[buildingId].name} (Niv.${level}): +${prod}/s`);
            }
        }
    } else if (resourceId === 'energy') {
        const totalCapacity = gameState.capacity.energy;
        const totalConsumed = gameState.resources.totalEnergyConsumed || 0;
        html += `<p>Consommé: ${Math.floor(totalConsumed)}</p>`;
        html += `<p>Capacité: ${totalCapacity}</p>`;
        if(totalCapacity < totalConsumed) html += `<p class="resource-cost insufficient">DÉFICIT: ${totalCapacity - totalConsumed}</p>`;

        for (const buildingId in gameState.buildings) {
            const level = gameState.buildings[buildingId];
            if (level > 0 && buildingsData[buildingId] && buildingsData[buildingId].levels[level - 1]) {
                const consumption = buildingsData[buildingId].levels[level - 1].energyConsumption;
                const capacity = buildingsData[buildingId].levels[level-1].capacity?.energy;
                if (capacity > 0) producers.push(`${buildingsData[buildingId].name} (Niv.${level}): +${capacity}`);
                if (consumption > 0) consumers.push(`${buildingsData[buildingId].name} (Niv.${level}): -${consumption}`);
            }
        }
         if(gameState.resources.energyConsumedByDefenses > 0) consumers.push(`Défenses Actives: -${gameState.resources.energyConsumedByDefenses}`);


    } else if (resourceId === 'mobility') {
         html += `<p>Max: ${MAX_MOBILITY_POINTS}</p>`;
         const ticksPerPoint = MOBILITY_RECHARGE_TICKS || 60 * (1000 / TICK_SPEED);
         const secondsPerPoint = ticksPerPoint * (TICK_SPEED / 1000);
         html += `<p>Recharge: 1 pt / ${formatTime(secondsPerPoint)}</p>`;
         if (gameState.resources.mobility < MAX_MOBILITY_POINTS) {
            const ticksRemaining = ticksPerPoint - (gameState.mobilityRechargeTimer || 0);
            html += `<p>Prochain point dans: ${formatTime(Math.ceil(ticksRemaining * (TICK_SPEED / 1000)))}</p>`;
         }
    } else if (resourceId === 'base-health-value') { // Pour le tooltip sur les PV de la base
        html = `<strong>Santé du Noyau</strong><hr>`;
        html += `<p>Actuel: ${Math.floor(gameState.baseStats.currentHealth)} / ${gameState.baseStats.maxHealth}</p>`;
        let bonuses = [];
         if (buildingsData.reinforcedWall && gameState.buildings.reinforcedWall > 0) {
            const wallTechLevel = gameState.buildings.reinforcedWall;
            const wallTechData = buildingsData.reinforcedWall.levels[wallTechLevel - 1];
            if (wallTechData?.baseHealthBonus) {
                bonuses.push(`Tech Muraille (Niv.${wallTechLevel}): <span class="stat-bonus">+${wallTechData.baseHealthBonus} PV</span>`);
            }
        }
        // Pourrait aussi lister les défenses actives contribuant à la défense (pas directement aux PV max)
        if (bonuses.length > 0) html += `<hr><p><strong>Sources de PV Max:</strong><br>${bonuses.join('<br>')}</p>`;
        html += `<p>Défense totale base: ${gameState.baseStats.defensePower}</p>`;
    } else if (resourceId === 'crystal_shards') {
        // Pourrait lister où trouver/utiliser les cristaux si c'est pertinent
    }

    if (producers.length > 0) html += `<hr><p><strong>Sources:</strong><br>${producers.join('<br>')}</p>`;
    if (consumers.length > 0) html += `<hr><p><strong>Consommateurs:</strong><br>${consumers.join('<br>')}</p>`;

    return html;
}

function getNanobotStatTooltip(statId) {
    const currentStats = gameState.nanobotStats; // Les stats finales déjà calculées par calculateNanobotStats
    const baseValues = { health: currentStats.baseHealth, attack: currentStats.baseAttack, defense: currentStats.baseDefense, speed: currentStats.baseSpeed };

    let html = `<strong>${statId.charAt(0).toUpperCase() + statId.slice(1)}</strong><hr>`;
    html += `<p>Valeur de Base: ${baseValues[statId] !== undefined ? baseValues[statId] : 'N/A'}</p>`;
    let totalBonus = 0;
    let bonusSources = [];

    // Bonus de recherche
    if (gameState.research && researchData) {
        for (const researchId in gameState.research) {
            if (gameState.research[researchId] && researchData[researchId] && researchData[researchId].grantsStatBoost && researchData[researchId].grantsStatBoost[statId]) {
                const bonus = researchData[researchId].grantsStatBoost[statId];
                bonusSources.push(`${researchData[researchId].name}: <span class="stat-bonus">+${bonus}</span>`);
                totalBonus += bonus;
            }
        }
    }
    // Bonus des modules
    if (gameState.nanobotModuleLevels && nanobotModulesData) {
        for (const moduleId in gameState.nanobotModuleLevels) {
            const level = gameState.nanobotModuleLevels[moduleId];
            if (level > 0 && nanobotModulesData[moduleId] && nanobotModulesData[moduleId].levels[level - 1]) {
                const moduleStatBoost = nanobotModulesData[moduleId].levels[level - 1].statBoost;
                if (moduleStatBoost && moduleStatBoost[statId]) {
                    const bonus = moduleStatBoost[statId];
                    bonusSources.push(`${nanobotModulesData[moduleId].name} (Niv.${level}): <span class="stat-bonus">+${bonus}</span>`);
                    totalBonus += bonus;
                }
            }
        }
    }
    // Bonus de l'équipement
    if (gameState.nanobotEquipment && itemsData) {
        for (const slot in gameState.nanobotEquipment) {
            const itemId = gameState.nanobotEquipment[slot];
            if (itemId && itemsData[itemId] && itemsData[itemId].statBoost && itemsData[itemId].statBoost[statId]) {
                const bonus = itemsData[itemId].statBoost[statId];
                const bonusClass = bonus > 0 ? "stat-bonus" : "stat-malus";
                bonusSources.push(`${itemsData[itemId].name}: <span class="${bonusClass}">${bonus > 0 ? '+' : ''}${bonus}</span>`);
                totalBonus += bonus;
            }
        }
    }

    if (bonusSources.length > 0) {
        html += `<p><strong>Bonus Totaux: <span class="${totalBonus >= 0 ? 'stat-bonus' : 'stat-malus'}">${totalBonus >= 0 ? '+' : ''}${totalBonus}</span></strong></p>`;
        html += `<ul style="list-style-type: none; padding-left: 0; margin-top: 5px;">${bonusSources.map(s => `<li>${s}</li>`).join('')}</ul>`;
    }
    html += `<hr><p><strong>Total Final: ${currentStats[statId] !== undefined ? currentStats[statId] : 'N/A'}</strong></p>`;
    if (statId === 'health') {
         html += `<p>Santé Actuelle: ${Math.floor(currentStats.currentHealth)}</p>`;
    }
    return html;
}

function getBuildingCardTooltip(buildingId) {
    const building = buildingsData[buildingId];
    if (!building) return `Bâtiment inconnu: ${buildingId}`;
    const currentLevel = gameState.buildings[buildingId] || 0;

    let html = `<strong>${building.name}</strong><hr>`;
    html += `<p class="text-gray-300">${building.description}</p>`;

    if (currentLevel > 0) {
        const levelData = building.levels[currentLevel - 1];
        html += `<p class="mt-1"><strong>Niveau Actuel (${currentLevel}):</strong></p><ul class="list-none pl-0 text-xs">`;
        if (levelData.production) html += `<li>Prod: ${Object.entries(levelData.production).map(([k,v])=>`${v}/s ${k}`).join(', ')}</li>`;
        if (levelData.capacity) html += `<li>Capacité: ${Object.entries(levelData.capacity).map(([k,v])=>`${v} ${k}`).join(', ')}</li>`;
        if (levelData.energyConsumption !== undefined) html += `<li>Énergie: <span class="stat-malus">-${levelData.energyConsumption}</span></li>`;
        if (levelData.baseHealthBonus) html += `<li>Bonus PV Noyau: <span class="stat-bonus">+${levelData.baseHealthBonus}</span></li>`;
        if (levelData.researchSpeedFactor) html += `<li>Vitesse Recherche: x${levelData.researchSpeedFactor}</li>`;
        if (levelData.stats && building.type === "defense") html += `<li>Stats: PV ${levelData.stats.health}, Att ${levelData.stats.attack}, Portée ${levelData.stats.range}</li>`;
        html += `</ul>`;
    } else {
        html += `<p class="text-yellow-400 mt-1"><em>Non construit / Niveau 0</em></p>`;
    }

    const nextLevelData = building.levels[currentLevel]; // Prochain niveau (si currentLevel est 0, c'est le niveau 1)
    if (nextLevelData) {
        html += `<hr><p class="mt-1"><strong>Prochain Niveau (${nextLevelData.level}):</strong></p><ul class="list-none pl-0 text-xs">`;
        if (nextLevelData.production) html += `<li>Prod: ${Object.entries(nextLevelData.production).map(([k,v])=>`${v}/s ${k}`).join(', ')}</li>`;
        if (nextLevelData.capacity) html += `<li>Capacité: ${Object.entries(nextLevelData.capacity).map(([k,v])=>`${v} ${k}`).join(', ')}</li>`;
        if (nextLevelData.energyConsumption !== undefined) html += `<li>Énergie: <span class="stat-malus">-${nextLevelData.energyConsumption}</span></li>`;
        if (nextLevelData.baseHealthBonus) html += `<li>Bonus PV Noyau: <span class="stat-bonus">+${nextLevelData.baseHealthBonus}</span></li>`;
        if (nextLevelData.researchSpeedFactor) html += `<li>Vitesse Recherche: x${nextLevelData.researchSpeedFactor}</li>`;
        if (nextLevelData.stats && building.type === "defense") html += `<li>Stats: PV ${nextLevelData.stats.health}, Att ${nextLevelData.stats.attack}, Portée ${nextLevelData.stats.range}</li>`;
        html += `</ul>`;

        const costData = currentLevel === 0 ? nextLevelData.costToUnlockOrUpgrade : nextLevelData.costToUpgrade;
        if (costData) {
            html += `<p class="mt-1">Coût Amélioration: ${getCostString(costData, true)}</p>`;
        }
    } else if (currentLevel > 0) {
        html += `<hr><p class="text-green-400 mt-1">Niveau technologique maximum atteint.</p>`;
    }

    if (building.type === "defense" && building.placementCost) {
        html += `<hr><p class="mt-1">Coût Placement Instance: ${getCostString(building.placementCost, true)}</p>`;
    }
    return html;
}

function getResearchCardTooltip(researchId) {
    const research = researchData[researchId];
    if (!research) return `Recherche inconnue: ${researchId}`;

    let html = `<strong>${research.name}</strong><hr>`;
    html += `<p class="text-gray-300">${research.description}</p>`;

    if (research.grantsStatBoost) {
        html += `<p class="mt-1">Bonus Stats: ${Object.entries(research.grantsStatBoost).map(([s,v]) => `<span class="stat-bonus">${s.charAt(0).toUpperCase()+s.slice(1)}: +${v}</span>`).join(', ')}</p>`;
    }
    if (research.grantsModule && nanobotModulesData[research.grantsModule]) {
        html += `<p class="mt-1">Débloque Module: <span class="text-lime-300">${nanobotModulesData[research.grantsModule].name}</span></p>`;
    }
    // Lister les prérequis de manière plus lisible
    if (research.requirements) {
        html += `<hr><p class="mt-1"><strong>Prérequis:</strong></p><ul class="list-none pl-0 text-xs">`;
        if (research.requirements.buildings) {
            Object.entries(research.requirements.buildings).forEach(([bId, lvl]) => {
                const reqMet = (gameState.buildings[bId] || 0) >= lvl;
                html += `<li class="${reqMet ? 'text-green-400' : 'text-red-400'}">${buildingsData[bId]?.name || bId} Niveau ${lvl} ${reqMet ? '(OK)' : '(Manquant)'}</li>`;
            });
        }
        if (research.requirements.research) {
            research.requirements.research.forEach(rId => {
                const reqMet = gameState.research[rId];
                html += `<li class="${reqMet ? 'text-green-400' : 'text-red-400'}">Recherche "${researchData[rId]?.name || rId}" ${reqMet ? '(OK)' : '(Manquante)'}</li>`;
            });
        }
        html += `</ul>`;
    }
    html += `<hr><p class="mt-1">Coût: ${getCostString(research.cost, true)}</p>`;
    html += `<p>Temps de recherche (base): ${formatTime(research.time)}</p>`;
    return html;
}

function getModuleCardTooltip(moduleId) {
    const moduleData = nanobotModulesData[moduleId];
    if (!moduleData) return `Module inconnu: ${moduleId}`;
    const currentLevel = gameState.nanobotModuleLevels[moduleId] || 0;

    let html = `<strong>${moduleData.name}</strong><hr>`;
    html += `<p class="text-gray-300">${moduleData.description}</p>`;

    if (moduleData.unlockMethod) {
        html += `<p class="mt-1 text-xs text-gray-400">Déblocage: `;
        if (moduleData.unlockMethod.research) html += `Recherche "${researchData[moduleData.unlockMethod.research]?.name}"`;
        if (moduleData.unlockMethod.building) html += `Bâtiment "${buildingsData[moduleData.unlockMethod.building]?.name}" Niv. ${moduleData.unlockMethod.buildingLevel}`;
        html += `</p>`;
    }

    if (currentLevel > 0) {
        const levelData = moduleData.levels[currentLevel - 1];
        html += `<p class="mt-1"><strong>Niveau Actuel (${currentLevel}):</strong></p><ul class="list-none pl-0 text-xs">`;
        if (levelData.statBoost) html += `<li>Bonus: ${Object.entries(levelData.statBoost).map(([s,v]) => `<span class="${v >= 0 ? 'stat-bonus' : 'stat-malus'}">${s.charAt(0).toUpperCase()+s.slice(1)}: ${v >= 0 ? '+' : ''}${v}</span>`).join(', ')}</li>`;
        html += `</ul>`;
    }

    const nextLevelData = moduleData.levels[currentLevel];
    if (nextLevelData) {
        html += `<hr><p class="mt-1"><strong>Prochain Niveau (${nextLevelData.level}):</strong></p><ul class="list-none pl-0 text-xs">`;
        if (nextLevelData.statBoost) html += `<li>Bonus: ${Object.entries(nextLevelData.statBoost).map(([s,v]) => `<span class="${v >= 0 ? 'stat-bonus' : 'stat-malus'}">${s.charAt(0).toUpperCase()+s.slice(1)}: ${v >= 0 ? '+' : ''}${v}</span>`).join(', ')}</li>`;
        html += `</ul>`;
        const costData = currentLevel === 0 ? nextLevelData.costToUnlockOrUpgrade : nextLevelData.costToUpgrade;
        if (costData) {
            html += `<p class="mt-1">Coût Amélioration: ${getCostString(costData, true)}</p>`;
        }
    } else if (currentLevel > 0) {
        html += `<hr><p class="text-green-400 mt-1">Niveau maximum atteint.</p>`;
    }
    return html;
}

function getItemTooltip(itemId, context) { // context peut être 'inventory', 'shop', 'reward'
    const item = itemsData[itemId];
    if (!item) return `Objet inconnu: ${itemId}`;

    let html = `<strong>${item.name}</strong> <span style="font-size:0.8em; color:var(--text-secondary);">- ${item.rarity || 'Commun'}</span><hr>`;
    html += `<p class="text-gray-300">${item.description}</p>`;
    if (item.statBoost) {
        html += `<p class="mt-1">Effets: ${Object.entries(item.statBoost).map(([s,v]) => `<span class="${v >= 0 ? 'stat-bonus' : 'stat-malus'}">${s.charAt(0).toUpperCase()+s.slice(1)}: ${v >= 0 ? '+' : ''}${v}</span>`).join(', ')}</p>`;
    }
    if (item.damageType) {
        html += `<p class="mt-1">Type Dégât: ${item.damageType.charAt(0).toUpperCase() + item.damageType.slice(1)}</p>`;
    }
    if (item.slot) {
        html += `<p class="mt-1">Emplacement: ${EQUIPMENT_SLOTS[item.slot] || item.slot}</p>`;
    }
    if (context === 'shop' && item.cost) {
        html += `<hr><p class="mt-1">Coût: ${getCostString(item.cost, true)}</p>`;
    }
    if (item.consumable && item.onUse && typeof item.onUse === 'function') {
        html += `<p class="mt-1 text-blue-300">Utilisable (Consommable)</p>`;
    }
    return html;
}

function getEquipmentSlotTooltip(slotId) {
    const slotName = EQUIPMENT_SLOTS[slotId];
    if (!slotName) return `Emplacement inconnu: ${slotId}`;

    const itemId = gameState.nanobotEquipment[slotId];
    const item = itemId ? itemsData[itemId] : null;

    let html = `<strong>${slotName}</strong><hr>`;
    if (item) {
        html += `<p class="text-lime-300">${item.name}</p>`;
        html += `<p class="text-xs text-gray-300">${item.description}</p>`;
        if (item.statBoost) {
            html += `<p class="text-xs mt-1">Bonus: ${Object.entries(item.statBoost).map(([s,v]) => `<span class="${v >= 0 ? 'stat-bonus' : 'stat-malus'}">${s.charAt(0).toUpperCase()+s.slice(1)}: ${v >= 0 ? '+' : ''}${v}</span>`).join(', ')}</p>`;
        }
         if (item.damageType) {
            html += `<p class="text-xs mt-1">Type Dégât: ${item.damageType.charAt(0).toUpperCase() + item.damageType.slice(1)}</p>`;
        }
    } else {
        html += `<p class="text-gray-500 italic">Aucun objet équipé dans cet emplacement.</p>`;
    }
    return html;
}

// Helper pour afficher les coûts avec indicateur de suffisance
function getCostString(costObject, checkAffordability = false) {
    return Object.entries(costObject)
        .map(([res, val]) => {
            let canAffordThis = true;
            const name = (itemsData && itemsData[res]) ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1);
            if (checkAffordability && gameState) { // S'assurer que gameState est défini
                if (itemsData && itemsData[res]) { // C'est un item/composant
                    canAffordThis = (gameState.inventory && gameState.inventory.filter(id => id === res).length || 0) >= val;
                } else { // C'est une ressource
                    canAffordThis = (gameState.resources && gameState.resources[res] || 0) >= val;
                }
            }
            return `<span class="resource-cost ${checkAffordability && !canAffordThis ? 'insufficient' : ''}">${val} ${name}</span>`;
        })
        .join(', ');
}

// --- FIN SYSTEME DE TOOLTIP ---


// --- DEBUT FEEDBACK VISUEL DES COUTS ---
function highlightInsufficientCosts(buttonElement, costObject) {
    if (!gameState || !costObject) return;
    const costParts = buttonElement.querySelectorAll('.cost-part');

    costParts.forEach(span => {
        const resourceId = span.dataset.resourceId;
        const requiredAmount = parseInt(span.dataset.requiredAmount);
        if (!resourceId || isNaN(requiredAmount)) return;

        let hasEnough = true;

        if (itemsData && itemsData[resourceId]) {
            hasEnough = (gameState.inventory && gameState.inventory.filter(id => id === resourceId).length || 0) >= requiredAmount;
        } else {
            hasEnough = (gameState.resources && gameState.resources[resourceId] || 0) >= requiredAmount;
        }

        if (!hasEnough) {
            span.classList.add('insufficient'); // La classe CSS .insufficient doit exister
        } else {
            span.classList.remove('insufficient');
        }
    });
}

function clearCostHighlights(buttonElement) {
    const costParts = buttonElement.querySelectorAll('.cost-part');
    costParts.forEach(span => {
        span.classList.remove('insufficient');
    });
}
// --- FIN FEEDBACK VISUEL DES COUTS ---


console.log("utils.js - Fin du fichier, fonctions définies.");