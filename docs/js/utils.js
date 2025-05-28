// js/utils.js
console.log("utils.js - Fichier chargé et en cours d'analyse...");

// Fonctions Utilitaires Générales

/**
 * Génère un nombre aléatoire entre min (inclus) et max (inclus).
 * @param {number} min - La borne minimale.
 * @param {number} max - La borne maximale.
 * @returns {number} Un nombre entier aléatoire.
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
window.getRandomInt = getRandomInt;

/**
 * Sélectionne un élément aléatoire dans un tableau.
 * @param {Array<any>} array - Le tableau source.
 * @returns {any} Un élément aléatoire du tableau, ou undefined si le tableau est vide.
 */
function getRandomElement(array) {
    if (!array || array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
}
window.getRandomElement = getRandomElement;

/**
 * Formate le temps en secondes en une chaîne MM:SS.
 * @param {number} totalSeconds - Le nombre total de secondes.
 * @returns {string} Le temps formaté.
 */
function formatTime(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
window.formatTime = formatTime;

/**
 * Ajoute une entrée au log d'événements ou à un autre log spécifié.
 * @param {string} message - Le message à logger.
 * @param {string} type - Le type de message ('info', 'success', 'warning', 'error', 'system', 'combat', 'exploration', 'quest', 'item', 'map-event', 'base-assault-event', 'base-defense-event', 'base-info-event').
 * @param {string | HTMLElement} targetLogOrElement - La chaîne identifiant le log ('event', 'combat', 'exploration', 'tile', 'night_assault') ou l'élément DOM du log lui-même. Par défaut: log d'événement principal.
 * @param {Array<string>} logArray - Le tableau gameState correspondant où stocker le message brut (optionnel).
 */
function addLogEntry(message, type = 'info', targetLogOrElement = 'event', logArray = null) {
    let logElement;
    let messagePrefix = "";

    if (typeof targetLogOrElement === 'string') {
        switch (targetLogOrElement.toLowerCase()) {
            case 'event': logElement = window.eventLogEl; if (logArray === null && window.gameState) logArray = window.gameState.eventLog; break;
            case 'combat':
                logElement = window.combatLogVisualEl;
                if (logElement && window.combatLogDetailsContainerEl && !window.combatLogDetailsContainerEl.open) {
                   window.combatLogDetailsContainerEl.open = true;
                }
                if (logArray === null && window.currentCombatInstance) logArray = window.currentCombatInstance.combatLog; 
                else if (logArray === null && window.gameState) logArray = window.gameState.combatLogSummary;
                break;
            case 'exploration': logElement = window.explorationLogEl; if (logArray === null && window.gameState) logArray = window.gameState.explorationLog; break;
            case 'tile': logElement = window.activeTileLogEl; /* Tile log is UI only, not stored in gameState array typically */ break;
            case 'night_assault': logElement = window.nightAssaultLogEl; if (logArray === null && window.gameState?.nightAssault) logArray = window.gameState.nightAssault.log; break;
            default:
                console.warn(`addLogEntry: Type de log cible inconnu '${targetLogOrElement}', utilisation du log d'événement par défaut.`);
                logElement = window.eventLogEl; if (logArray === null && window.gameState) logArray = window.gameState.eventLog;
        }
    } else if (targetLogOrElement instanceof HTMLElement) {
        logElement = targetLogOrElement;
        // logArray n'est pas automatiquement déterminé si un élément est passé directement.
    } else {
        console.warn("addLogEntry: targetLogOrElement n'est ni une chaîne ni un HTMLElement. Utilisation du log d'événement par défaut.");
        logElement = window.eventLogEl; if (logArray === null && window.gameState) logArray = window.gameState.eventLog;
    }

    if (!logElement) {
        console.error(`addLogEntry: Impossible de trouver l'élément de log pour la cible:`, targetLogOrElement, "Message:", message);
        if (window.eventLogEl && targetLogOrElement !== 'event' && window.eventLogEl !== logElement) {
             const pError = document.createElement('p');
             pError.style.color = 'red'; pError.style.fontWeight = 'bold';
             pError.textContent = `[LOG ROUTING ERROR for '${typeof targetLogOrElement === 'string' ? targetLogOrElement : 'custom_element'} log'] >> ${message}`;
             window.eventLogEl.prepend(pError);
             window.eventLogEl.scrollTop = 0;
        } else if (!window.eventLogEl) {
            console.error("CRITICAL: eventLogEl (global) est également non défini. Impossible de logger :", message);
        }
        return;
    }

    const p = document.createElement('p');
    let textColor = 'var(--text-secondary)';

    switch (type) {
        case 'success': textColor = 'var(--accent-green)'; messagePrefix = "✓ "; break;
        case 'warning': textColor = 'var(--accent-yellow)'; messagePrefix = "⚠ "; break;
        case 'error': textColor = 'var(--accent-red)'; messagePrefix = "✗ ERREUR: "; break;
        case 'system': textColor = 'var(--accent-blue)'; messagePrefix = "[SYS] "; break;
        case 'combat': textColor = '#E0E0E0'; break; // Pas de préfixe, géré par le message
        case 'exploration': textColor = '#A0D2DB'; messagePrefix = "[EXPL] "; break;
        case 'quest': textColor = '#D6A2E8'; messagePrefix = "[QUÊTE] "; break;
        case 'item': textColor = '#F0DBAF'; messagePrefix = "[OBJET] "; break;
        case 'map-event': textColor = '#B8D8BE'; messagePrefix = "[MAP] "; break; // Vert pâle
        case 'base-assault-event': textColor = '#F4A09D'; messagePrefix = "[ASSAUT] "; break; // Rougeâtre
        case 'base-defense-event': textColor = '#A0CAF4'; messagePrefix = "[DÉFENSE] "; break; // Bleuâtre
        case 'base-info-event': textColor = 'var(--text-secondary)'; messagePrefix = "[BASE] "; break;
        case 'info': default: textColor = 'var(--text-primary)'; messagePrefix = "ℹ "; break;
    }
    p.style.color = textColor;
    p.style.marginBottom = '2px';
    p.style.lineHeight = '1.3';
    p.innerHTML = messagePrefix + message;

    const MAX_LOG_ENTRIES = 100;
    while (logElement.children.length >= MAX_LOG_ENTRIES) {
        if (logElement.firstChild) logElement.removeChild(logElement.firstChild);
        else break; 
    }
    logElement.appendChild(p);
    logElement.scrollTop = logElement.scrollHeight;

    if (logArray && Array.isArray(logArray)) {
        logArray.push(messagePrefix + message); // Stocker le message brut dans le tableau gameState correspondant
        if (logArray.length > MAX_LOG_ENTRIES) {
            logArray.splice(0, logArray.length - MAX_LOG_ENTRIES);
        }
    }
}
window.addLogEntry = addLogEntry;

/**
 * Affiche une modale générique.
 * @param {string} title - Le titre de la modale.
 * @param {string} messageOrHtml - Le message (texte brut) ou le contenu HTML à afficher.
 * @param {function | null} onConfirm - Fonction à appeler si l'utilisateur confirme.
 * @param {boolean} showCancelButton - Afficher ou non le bouton Annuler.
 * @param {function | null} onCancel - Fonction à appeler si l'utilisateur annule (optionnel).
 */
function showModal(title, messageOrHtml, onConfirm = null, showCancelButton = true, onCancel = null) {
    if (!window.modalEl || !window.modalTitleEl || !window.modalMessageEl || !window.modalConfirmBtn || !window.modalCancelBtn) {
        console.error("Éléments de la modale non trouvés. Impossible d'afficher la modale.");
        alert(`${title}\n${messageOrHtml}`); // Fallback
        return;
    }
    window.modalTitleEl.textContent = title;
    window.modalMessageEl.innerHTML = messageOrHtml;

    // Cloner et remplacer les boutons pour enlever les anciens listeners
    const newConfirmBtn = window.modalConfirmBtn.cloneNode(true);
    window.modalConfirmBtn.parentNode.replaceChild(newConfirmBtn, window.modalConfirmBtn);
    window.modalConfirmBtn = newConfirmBtn;

    const newCancelBtn = window.modalCancelBtn.cloneNode(true);
    window.modalCancelBtn.parentNode.replaceChild(newCancelBtn, window.modalCancelBtn);
    window.modalCancelBtn = newCancelBtn;

    if (onConfirm) {
        window.modalConfirmBtn.style.display = 'inline-block';
        window.modalConfirmBtn.onclick = () => { 
            onConfirm();
            hideModal();
        };
    } else {
        window.modalConfirmBtn.style.display = 'none'; // Cacher si pas de callback onConfirm
    }

    if (showCancelButton) {
        window.modalCancelBtn.style.display = 'inline-block';
        window.modalCancelBtn.onclick = () => {
            if (typeof onCancel === 'function') {
                onCancel(); 
            }
            // Toujours appeler hideModal, que onCancel soit défini ou non,
            // car le but du bouton Cancel est de fermer la modale.
            hideModal(); 
        };
    } else {
        window.modalCancelBtn.style.display = 'none';
    }

    window.modalEl.classList.remove('hidden');
    isGamePaused = true;
}
window.showModal = showModal;

function hideModal() {
    if(window.modalEl) window.modalEl.classList.add('hidden');
    isGamePaused = false;
}
window.hideModal = hideModal;

function confirmModal() { /* Placeholder, la logique est dans showModal */ hideModal(); }
window.confirmModal = confirmModal;


// --- Système de Tooltip ---
let tooltipTimeout;

function initializeTooltip() {
    if (!window.tooltipEl) {
        console.error("Tooltip element #tooltip non trouvé. Le système de tooltip ne fonctionnera pas.");
        return;
    }

    document.body.addEventListener('mouseover', (event) => {
        const target = event.target.closest('[data-tooltip-type]');
        if (target) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = setTimeout(() => {
                const tooltipType = target.dataset.tooltipType;
                const tooltipId = target.dataset.tooltipId;
                let content = "";

                if (tooltipType && (tooltipId || target.title)) { // Autoriser tooltipId ou title comme fallback
                    content = getTooltipContent(tooltipType, tooltipId || target.title, target);
                } else if (target.title && !tooltipType) {
                    content = target.title;
                }

                if (content) {
                    window.tooltipEl.innerHTML = content;
                    positionTooltip(event, target);
                    window.tooltipEl.classList.remove('hidden');
                }
            }, 200);
        }
    });

    document.body.addEventListener('mouseout', (event) => {
        // Vérifier si la souris se déplace vers le tooltip lui-même
        if (event.relatedTarget === window.tooltipEl || window.tooltipEl.contains(event.relatedTarget)) {
            return; // Ne pas cacher si on entre dans le tooltip
        }
        const target = event.target.closest('[data-tooltip-type]');
         if (target || event.target === window.tooltipEl || window.tooltipEl.contains(event.target)) {
            clearTimeout(tooltipTimeout);
            window.tooltipEl.classList.add('hidden');
        }
    });
     // Ajouter un mouseout pour le tooltip lui-même
    window.tooltipEl.addEventListener('mouseout', (event) => {
        // Si la souris quitte le tooltip et n'entre pas dans un élément qui l'a déclenché
        const currentHoverTarget = event.relatedTarget ? event.relatedTarget.closest('[data-tooltip-type]') : null;
        if (currentHoverTarget !== document.querySelector('[data-tooltip-type]:hover')) { // Vérif simple
            clearTimeout(tooltipTimeout);
            window.tooltipEl.classList.add('hidden');
        }
    });


    document.body.addEventListener('mousemove', (event) => {
        if (!window.tooltipEl.classList.contains('hidden')) {
            const currentHoverTarget = event.target.closest('[data-tooltip-type]');
            if (currentHoverTarget) {
                positionTooltip(event, currentHoverTarget);
            }
        }
    });
    console.log("Système de Tooltip initialisé.");
}
window.initializeTooltip = initializeTooltip;

function positionTooltip(event, targetElement) {
    if (!window.tooltipEl) return;
    const { clientX: mouseX, clientY: mouseY } = event;
    const tooltipRect = window.tooltipEl.getBoundingClientRect();
    let x = mouseX + 15; let y = mouseY + 15;
    if (x + tooltipRect.width > window.innerWidth) x = mouseX - tooltipRect.width - 15;
    if (y + tooltipRect.height > window.innerHeight) y = mouseY - tooltipRect.height - 15;
    if (x < 0) x = 5; if (y < 0) y = 5;
    window.tooltipEl.style.left = `${x}px`;
    window.tooltipEl.style.top = `${y}px`;
}
window.positionTooltip = positionTooltip;

function getTooltipContent(type, id, targetElement) {
    if (!window.gameState) return "Erreur: gameState non défini.";
    let content = `<strong>${id}</strong> (${type})<hr class="my-1 border-gray-600">`;

    switch (type) {
        case 'resource-header':
            const resourceKey = id; // id est la clé de la ressource (biomass, nanites, etc.)
            const currentValue = Math.floor(window.gameState.resources[resourceKey] || 0);
            let rate = 0; let capacity = Infinity; let capacityString = "";

            if (resourceKey === 'biomass' || resourceKey === 'nanites') {
                rate = window.gameState.productionRates[resourceKey] !== undefined ? window.gameState.productionRates[resourceKey].toFixed(1) : '?';
                capacity = window.gameState.capacity[resourceKey] !== undefined ? window.gameState.capacity[resourceKey] : '?';
                capacityString = ` / ${capacity}`;
                content = `<strong>${resourceKey.charAt(0).toUpperCase() + resourceKey.slice(1)}</strong>: ${currentValue}${capacityString}<br>Taux: ${rate}/s`;
            } else if (resourceKey === 'crystal_shards') {
                content = `<strong>Cristaux</strong>: ${currentValue}`;
            } else if (resourceKey === 'energy') {
                const consumed = Math.floor(window.gameState.resources.totalEnergyConsumed || 0);
                const totalCap = window.gameState.capacity.energy || 0;
                content = `<strong>Énergie</strong><br>Consommée: ${consumed}<br>Capacité Totale: ${totalCap}<br>Disponible: ${Math.max(0, totalCap - consumed)}`;
            } else if (resourceKey === 'mobility') {
                const currentMobility = Math.floor(window.gameState.resources.mobility || 0);
                content = `<strong>Mobilité</strong>: ${currentMobility} / ${(typeof window.MAX_MOBILITY_POINTS !== 'undefined' ? window.MAX_MOBILITY_POINTS : '?')}<br>Recharge dans: ${formatTime(window.gameState.mobilityRechargeTimer || 0)}`;
            } else if (resourceKey === 'base-health-value') {
                 content = `<strong>Santé du Noyau</strong>: ${Math.floor(window.gameState.baseStats.currentHealth)} / ${window.gameState.baseStats.maxHealth}<br>Défense: ${window.gameState.baseStats.defensePower}`;
                 if (window.gameState.nightAssault.isActive && !window.gameState.isDay) {
                    content += `<br><span class="text-[var(--accent-red)]">SOUS ATTAQUE !</span>`;
                 }
            }
            break;

        case 'building-card':
            if (window.buildingsData && window.buildingsData[id]) {
                const building = window.buildingsData[id];
                const level = window.gameState.buildings[id] || 0;
                content = `<strong>${building.name} (Niv. ${level})</strong><hr class="my-1 border-gray-600">${building.description_long || building.description}<br>`;
                if (level > 0 && building.levels[level - 1]) {
                    const currentLvl = building.levels[level-1];
                    content += `<hr class="my-1 border-gray-700"><strong>Effets Actuels:</strong><br>`;
                    if(currentLvl.production) content += `Production: ${Object.entries(currentLvl.production).map(([res,val])=>`${val}/s ${res}`).join(', ')}<br>`;
                    if(currentLvl.capacity) content += `Capacité: ${Object.entries(currentLvl.capacity).map(([res,val])=>`${val} ${res}`).join(', ')}<br>`;
                    if(currentLvl.researchSpeedFactor) content += `Vitesse Recherche: x${currentLvl.researchSpeedFactor}<br>`;
                    if(currentLvl.energyConsumption) content += `<span class="text-red-400">Conso. Énergie: ${currentLvl.energyConsumption}</span><br>`;
                    if(currentLvl.baseHealthBonus && building.id === 'reinforcedWall') content += `<span class="text-teal-300">Bonus PV Noyau: +${currentLvl.baseHealthBonus}</span><br>`;
                    if(currentLvl.defensePowerBonus) content += `<span class="text-sky-300">Bonus Défense Noyau: +${currentLvl.defensePowerBonus}</span><br>`;
                }
                const nextLevelDef = building.levels[level]; // Définition du prochain niveau
                if (nextLevelDef) {
                    const cost = level === 0 ? nextLevelDef.costToUnlockOrUpgrade : nextLevelDef.costToUpgrade;
                    content += `<hr class="my-1 border-gray-700"><strong>Prochain Niveau (${level + 1}):</strong><br>`;
                    if (cost) content += `Coût: ${getCostString(cost, false, true)}<br>`; // true pour checkAffordability
                    if(nextLevelDef.production) content += `Production: ${Object.entries(nextLevelDef.production).map(([res,val])=>`${val}/s ${res}`).join(', ')}<br>`;
                    if(nextLevelDef.capacity) content += `Capacité: ${Object.entries(nextLevelDef.capacity).map(([res,val])=>`${val} ${res}`).join(', ')}<br>`;
                    // ... autres stats du prochain niveau
                } else if (level > 0) {
                    content += `<hr class="my-1 border-gray-700"><span class="text-green-400">Niveau Technologique Maximum Atteint.</span>`;
                }
            } else { content = `Infos sur bâtiment ${id} non trouvées.`;}
            break;

        case 'research-card':
             if (window.researchData && window.researchData[id]) {
                const research = window.researchData[id];
                content = `<strong>${research.name}</strong>`;
                if (window.gameState.research[id]) content += ` <span class="text-green-400">(Acquis)</span>`;
                content += `<hr class="my-1 border-gray-600">${research.description_long || research.description}<br>`;
                // ... (logique d'affichage des effets, coûts, prérequis) ...
                if (!window.gameState.research[id] && !(window.gameState.activeResearch && window.gameState.activeResearch.id === id)) {
                    content += `<hr class="my-1 border-gray-700">Coût: ${getCostString(research.cost, false, true)}<br>`;
                    content += `Temps: ${formatTime(research.time)}<br>`;
                }
            } else { content = `Infos sur recherche ${id} non trouvées.`;}
            break;

        case 'module-card':
            if (window.nanobotModulesData && window.nanobotModulesData[id]) {
                const module = window.nanobotModulesData[id];
                const currentLevel = window.gameState.nanobotModuleLevels[id] || 0;
                content = `<strong>${module.name} (Niv. ${currentLevel})</strong><hr class="my-1 border-gray-600">${module.description_long || module.description}<br>`;
                // ... (logique d'affichage des stats actuelles, coût prochain niveau) ...
                const nextLevelDataDef = module.levels.find(l => l.level === currentLevel + 1);
                const costData = currentLevel === 0 ? (module.levels[0]?.costToUnlockOrUpgrade) : (nextLevelDataDef?.costToUpgrade);
                 if (costData) {
                    content += `<hr class="my-1 border-gray-700"><strong>${currentLevel === 0 ? "Activation" : `Amélioration (Niv. ${currentLevel + 1})`}:</strong><br>`;
                    content += `Coût: ${getCostString(costData, false, true)}<br>`;
                 }
            } else { content = `Infos sur module ${id} non trouvées.`;}
            break;
        
        case 'inventory-item':
        case 'shop-item': // Gérer les items du shop de manière similaire
             if (window.itemsData && window.itemsData[id]) {
                const item = window.itemsData[id];
                content = `<strong>${item.name}</strong> <span class="text-xs text-gray-400">(${item.type})</span><hr class="my-1 border-gray-600">${item.description_long || item.description}<br>`;
                if (item.statBoost) content += `Stats: ${Object.entries(item.statBoost).map(([s,v]) => `<span class="${v > 0 ? 'stat-bonus' : 'stat-malus'}">${(window.STAT_NAMES && window.STAT_NAMES[s]) || s}: ${v > 0 ? '+' : ''}${v}</span>`).join(', ')}<br>`;
                if (item.damageType && window.DAMAGE_TYPES) content += `Type Dégâts: <span class="text-cyan-400">${window.DAMAGE_TYPES[item.damageType] || item.damageType}</span><br>`;
                if (item.slot && window.EQUIPMENT_SLOTS) content += `Emplacement: <span class="text-purple-400">${window.EQUIPMENT_SLOTS[item.slot] || item.slot}</span><br>`;
                if (item.value && type === 'inventory-item') content += `Valeur: <span class="text-yellow-400">${item.value} Nanites</span><br>`;
                
                // Pour le shop, trouver les infos de coût depuis gameState.shopStock
                if (type === 'shop-item' && window.gameState && window.gameState.shopStock) {
                    const shopEntry = window.gameState.shopStock.find(entry => entry.itemId === id);
                    if (shopEntry && shopEntry.cost) {
                        content += `Prix d'achat: ${getCostString(shopEntry.cost, false, true)}<br>`;
                    }
                }

                if (item.rarity && window.RARITY_COLORS) content += `<span class="text-xs ${window.RARITY_COLORS[item.rarity] || 'text-gray-400'}">Rareté: ${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}</span>`;
            } else { content = `Infos sur item ${id} non trouvées.`;}
            break;

        case 'equipment-slot':
            const slotName = (window.EQUIPMENT_SLOTS && window.EQUIPMENT_SLOTS[id]) || id;
            const equippedItemId = window.gameState.nanobotEquipment[id];
            content = `<strong>Emplacement: ${slotName}</strong><hr class="my-1 border-gray-600">`;
            if (equippedItemId && window.itemsData && window.itemsData[equippedItemId]) {
                const equippedItem = window.itemsData[equippedItemId];
                content += `Équipé: <span class="font-semibold">${equippedItem.name}</span><br>`;
                content += `<span class="text-xs">${equippedItem.description}</span>`;
            } else {
                content += `<span class="text-gray-500 italic">Vide</span>`;
            }
            break;
        
        case 'map-tile': // id devrait être "x,y"
            // ... (utiliser window.WORLD_ZONES, window.tileData, etc.) ...
            break;
        case 'stat-nanobot':
            // ... (utiliser window.STAT_NAMES) ...
            break;

        default:
            content = `Tooltip pour ${type}: ${id} non implémenté.`;
    }
    return content;
}
window.getTooltipContent = getTooltipContent;


function getCostString(costObject, useIcon = false, checkAffordability = true) {
    if (!costObject || Object.keys(costObject).length === 0) return "Gratuit";
    return Object.entries(costObject).map(([res, val]) => {
        const isItemResource = window.itemsData && window.itemsData[res];
        const resourceName = isItemResource ? window.itemsData[res].name : (window.RESOURCE_TYPES && window.RESOURCE_TYPES[res] ? window.RESOURCE_TYPES[res].toLowerCase() : res.charAt(0).toUpperCase() + res.slice(1));
        const displayVal = useIcon ? `<i class="${getResourceIconClass(res)}"></i> ${val}` : `${val} ${resourceName}`;
        
        let currentAmount;
        if (isItemResource) {
            currentAmount = (window.gameState.inventory || []).filter(itemId => itemId === res).length;
        } else {
            currentAmount = window.gameState.resources[res] || 0;
        }

        const canAfford = !checkAffordability || currentAmount >= val;
        return `<span class="resource-cost ${canAfford ? '' : 'insufficient'}">${displayVal}</span>`;
    }).join(', ');
}
window.getCostString = getCostString;

function getResourceIconClass(resourceId) {
    // S'assurer que window.itemsData est vérifié en premier s'il peut contenir des ressources
    if (window.itemsData && window.itemsData[resourceId] && window.itemsData[resourceId].iconClass) {
        return window.itemsData[resourceId].iconClass;
    }
    switch (resourceId) {
        case 'biomass': return 'ti ti-leaf text-green-400';
        case 'nanites': return 'ti ti-settings-2 text-blue-400';
        case 'crystal_shards': return 'ti ti-diamond text-cyan-400';
        case 'energy': return 'ti ti-bolt text-yellow-400';
        default: return 'ti ti-question-mark';
    }
}
window.getResourceIconClass = getResourceIconClass;


function highlightInsufficientCosts(buttonOrContainer, costObject) {
    if (!buttonOrContainer || !costObject || !window.gameState) return;
    const costParts = buttonOrContainer.querySelectorAll('.cost-part');
    costParts.forEach(part => {
        const resourceId = part.dataset.resourceId;
        const requiredAmount = parseInt(part.dataset.requiredAmount);
        if (resourceId && !isNaN(requiredAmount)) {
            let currentAmount;
            const isItemResource = window.itemsData && window.itemsData[resourceId];
            if (isItemResource) {
                currentAmount = (window.gameState.inventory || []).filter(itemId => itemId === resourceId).length;
            } else {
                currentAmount = window.gameState.resources[resourceId] || 0;
            }
            if (currentAmount < requiredAmount) {
                part.classList.add('insufficient');
                const headerResourceKey = isItemResource ? resourceId : resourceId; // Pour trouver le nom d'affichage
                const headerResourceName = isItemResource ? (window.itemsData[headerResourceKey]?.name) : (headerResourceKey.charAt(0).toUpperCase() + headerResourceKey.slice(1));
                const headerResourceEl = document.querySelector(`.resource-item[title*="${headerResourceName}"]`);
                if (headerResourceEl) {
                    headerResourceEl.classList.add('insufficient-flash');
                    setTimeout(() => headerResourceEl.classList.remove('insufficient-flash'), 1400);
                }
            } else {
                part.classList.remove('insufficient');
            }
        }
    });
}
window.highlightInsufficientCosts = highlightInsufficientCosts;

function clearCostHighlights(buttonOrContainer) {
     if (!buttonOrContainer) return;
    const costParts = buttonOrContainer.querySelectorAll('.cost-part');
    costParts.forEach(part => {
        part.classList.remove('insufficient');
    });
}
window.clearCostHighlights = clearCostHighlights;


function deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target) || !isObject(target[key])) { // S'assurer que target[key] est aussi un objet
                    Object.assign(output, { [key]: deepMerge({}, source[key]) }); // Fusionner dans un objet vide si target[key] n'est pas un objet
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else if (Array.isArray(source[key])) {
                Object.assign(output, { [key]: [...source[key]] }); // Fusionner des tableaux pour éviter les références partagées
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    } else if (isObject(source)) { // Si target n'est pas un objet mais source l'est
        return deepMerge({}, source);
    }
    return output;
}
window.deepMerge = deepMerge;

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}
window.isObject = isObject;


function drawProjectileVisual(startX, startY, endX, endY, type = 'friendly', visualType = 'laser') {
    if (!window.basePreviewContainerEl) return;
    const projectile = document.createElement('div');
    projectile.className = 'projectile-visual';
    const dx = endX - startX; const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    projectile.style.width = `${distance}px`; projectile.style.height = '2px';
    projectile.style.backgroundColor = type === 'friendly' ? 'var(--accent-yellow)' : 'var(--accent-red)';
    projectile.style.boxShadow = `0 0 5px ${type === 'friendly' ? 'var(--accent-yellow)' : 'var(--accent-red)'}`;
    projectile.style.position = 'absolute'; projectile.style.left = `${startX}px`;
    projectile.style.top = `${startY - 1}px`; projectile.style.transformOrigin = '0 50%';
    projectile.style.transform = `rotate(${angle}deg)`; projectile.style.zIndex = '20';
    window.basePreviewContainerEl.appendChild(projectile);
    projectile.animate([
        { opacity: 1, width: `${distance}px` },
        { opacity: 0, width: '0px',  transform: `translateX(${distance}px) rotate(${angle}deg)` }
    ], { duration: 200, easing: 'ease-out' }).onfinish = () => {
        if (projectile.parentNode) projectile.parentNode.removeChild(projectile);
    };
}
window.drawProjectileVisual = drawProjectileVisual;

/**
 * Affiche une modale d'information pour un item, bâtiment, module ou recherche.
 * @param {string} itemType - 'inventory-item', 'building-card', 'module-card', 'research-card', 'shop-item'.
 * @param {string} itemId - L'ID de l'élément.
 * @param {string} itemNameFallback - Nom à afficher si l'élément n'est pas trouvé dans les données.
 */
function showItemInfoModal(itemType, itemId, itemNameFallback) {
    let title = itemNameFallback || "Détails";
    let detailedContent = `<p class="text-sm text-gray-400">Informations détaillées pour ${title}.</p>`;
    let dataObject;

    switch (itemType) {
        case 'inventory-item':
        case 'shop-item':
            dataObject = window.itemsData ? window.itemsData[itemId] : null;
            if (dataObject) {
                title = dataObject.name;
                detailedContent = `<p class="text-sm text-gray-300 mb-2">${dataObject.description_long || dataObject.description}</p>`;
                if (dataObject.statBoost) detailedContent += `<p class="text-xs"><strong>Stats:</strong> ${Object.entries(dataObject.statBoost).map(([s,v]) => `${(window.STAT_NAMES && window.STAT_NAMES[s]) || s}: ${v>0?'+':''}${v}`).join(', ')}</p>`;
                if (dataObject.damageType && window.DAMAGE_TYPES) detailedContent += `<p class="text-xs"><strong>Type Dégâts:</strong> ${window.DAMAGE_TYPES[dataObject.damageType] || dataObject.damageType}</p>`;
                if (dataObject.slot && window.EQUIPMENT_SLOTS) detailedContent += `<p class="text-xs"><strong>Emplacement:</strong> ${window.EQUIPMENT_SLOTS[dataObject.slot] || dataObject.slot}</p>`;
                if (dataObject.value) detailedContent += `<p class="text-xs"><strong>Valeur:</strong> ${dataObject.value} Nanites</p>`;
                if (dataObject.rarity && window.RARITY_COLORS) detailedContent += `<p class="text-xs"><strong>Rareté:</strong> <span class="${window.RARITY_COLORS[dataObject.rarity] || ''}">${dataObject.rarity.charAt(0).toUpperCase() + dataObject.rarity.slice(1)}</span></p>`;
                if (itemType === 'shop-item' && window.gameState && window.gameState.shopStock) {
                     const shopEntry = window.gameState.shopStock.find(entry => entry.itemId === itemId);
                    if (shopEntry && shopEntry.cost) {
                        detailedContent += `<p class="text-xs mt-2"><strong>Coût d'achat:</strong> ${getCostString(shopEntry.cost, false, true)}</p>`;
                    }
                }
            }
            break;
        case 'building-card':
            dataObject = window.buildingsData ? window.buildingsData[itemId] : null;
            if (dataObject) {
                const level = window.gameState.buildings[itemId] || 0;
                title = `${dataObject.name} (Niv. ${level})`;
                detailedContent = `<p class="text-sm text-gray-300 mb-2">${dataObject.description_long || dataObject.description}</p>`;
                // ... ajouter d'autres détails spécifiques aux bâtiments ...
            }
            break;
        case 'module-card':
            dataObject = window.nanobotModulesData ? window.nanobotModulesData[itemId] : null;
            if (dataObject) {
                const currentLevel = window.gameState.nanobotModuleLevels[itemId] || 0;
                title = `${dataObject.name} (Niv. ${currentLevel})`;
                 detailedContent = `<p class="text-sm text-gray-300 mb-2">${dataObject.description_long || dataObject.description}</p>`;
                // ... ajouter d'autres détails spécifiques aux modules ...
            }
            break;
        case 'research-card':
            dataObject = window.researchData ? window.researchData[itemId] : null;
             if (dataObject) {
                title = dataObject.name;
                detailedContent = `<p class="text-sm text-gray-300 mb-2">${dataObject.description_long || dataObject.description}</p>`;
                // ... ajouter d'autres détails spécifiques aux recherches ...
            }
            break;
        default:
            console.warn("showItemInfoModal: Type d'item inconnu:", itemType);
            break;
    }

    if (!dataObject) {
        detailedContent = `<p class="text-red-400">Impossible de charger les détails pour ${itemNameFallback || itemId}.</p>`;
    }

    showModal(title, detailedContent, null, true, hideModal); 
    
    const confirmButton = document.getElementById('modal-confirm');
    if (confirmButton) confirmButton.style.display = 'none'; 

    const cancelButton = document.getElementById('modal-cancel');
    if (cancelButton) {
        cancelButton.textContent = "Fermer";
        cancelButton.style.display = 'inline-block'; 
    }
}
window.showItemInfoModal = showItemInfoModal;


// Petite fonction utilitaire pour simuler un délai
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
window.sleep = sleep;

console.log("utils.js - Fin du fichier, fonctions utilitaires définies.");