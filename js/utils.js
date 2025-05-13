// js/utils.js
console.log("utils.js - Fichier chargé et en cours d'analyse...");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatTime(seconds) {
    const flooredSeconds = Math.floor(seconds);
    return `${Math.floor(flooredSeconds / 60).toString().padStart(2, '0')}:${(flooredSeconds % 60).toString().padStart(2, '0')}`;
}

var modalConfirmCallback = null; // Utiliser var pour assurer la portée globale

function showModal(title, message, onConfirm, showCancel = true) {
    // console.log("utils.js: showModal appelée avec titre:", title);
    if (typeof modalTitle !== 'undefined' && modalTitle) modalTitle.textContent = title;
    else console.warn("utils.js: showModal - modalTitle non trouvé.");

    if (typeof modalMessage !== 'undefined' && modalMessage) modalMessage.innerHTML = message;
    else console.warn("utils.js: showModal - modalMessage non trouvé.");

    modalConfirmCallback = onConfirm;

    if (typeof modalConfirm !== 'undefined' && modalConfirm) {
        modalConfirm.style.display = onConfirm ? 'inline-block' : 'none';
        modalConfirm.classList.toggle('hidden', !onConfirm);
    } else console.warn("utils.js: showModal - modalConfirm non trouvé.");

    if (typeof modalCancel !== 'undefined' && modalCancel) {
         modalCancel.style.display = showCancel ? 'inline-block' : 'none';
         modalCancel.classList.toggle('hidden', !showCancel);
    } else console.warn("utils.js: showModal - modalCancel non trouvé.");

    if (typeof modal !== 'undefined' && modal) modal.classList.remove('hidden');
    else console.warn("utils.js: showModal - modal non trouvé.");
}

function hideModal() {
    // console.log("utils.js: hideModal appelée");
    if (typeof modal !== 'undefined' && modal) modal.classList.add('hidden');
    else console.warn("utils.js: hideModal - modal non trouvé.");
    modalConfirmCallback = null;
}

function addLogEntry(message, type = "info", logElement = null, logArray = null) {
    // console.log(`utils.js: addLogEntry - [Type: ${type}] Message: "${message}"`);

    if (typeof gameState === 'undefined' || gameState === null) {
        console.warn("addLogEntry: gameState non défini.");
        // Tenter d'afficher dans la console du navigateur au moins
        console.log(`LOG (gameState non défini) [${type}]: ${message}`);
        return;
    }
    const currentGameTime = gameState.gameTime !== undefined ? gameState.gameTime : 0;
    const currentTickSpeed = typeof TICK_SPEED !== 'undefined' ? TICK_SPEED : 1000;

    // Définir les éléments et tableaux de log par défaut
    // S'assurer que les éléments DOM existent avant de les assigner
    if (logElement === null) {
        if (type === "map-event" && typeof explorationLogEl !== 'undefined' && explorationLogEl) {
            logElement = explorationLogEl;
        } else if ((type === "base-assault-event" || type === "base-defense-event" || type === "base-info-event") && typeof nightAssaultLogEl !== 'undefined' && nightAssaultLogEl) {
            logElement = nightAssaultLogEl;
        } else if (typeof eventLogEl !== 'undefined' && eventLogEl) {
            logElement = eventLogEl;
        }
    }

    if (logArray === null) {
        if (type === "map-event" && Array.isArray(gameState.explorationLog)) {
            logArray = gameState.explorationLog;
        } else if ((type === "base-assault-event" || type === "base-defense-event" || type === "base-info-event") && gameState.nightAssault && Array.isArray(gameState.nightAssault.log)) {
            logArray = gameState.nightAssault.log;
        } else if (Array.isArray(gameState.eventLog)) {
            logArray = gameState.eventLog;
        }
    }

    const timestamp = (type !== "combat-visual" && type !== "map-event" && type !== "base-assault-event" && type !== "base-defense-event" && type !== "base-info-event")
                    ? `[${formatTime(Math.floor(currentGameTime * (currentTickSpeed/1000)))}] `
                    : "";
    const entry = document.createElement('p');

    // Appliquer les classes de couleur
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
    entry.innerHTML = `<span class="text-gray-500">${timestamp}</span>${message}`;

    if (logElement) {
        const titleElements = logElement.querySelectorAll('h3, h4');
        let titleTextContent = "";
        if (titleElements.length > 0) { titleTextContent = titleElements[0].outerHTML; }

        const initialMessages = ["En attente d'événements...", "Journal d'assaut initialisé.", "Journal d'exploration initialisé.", "Aucun événement d'exploration récent...", "Initialisé.", "Résumé Combat :"];
        const placeholderP = logElement.querySelector('p.text-gray-500.italic');

        if (placeholderP && initialMessages.some(msg => placeholderP.textContent.trim().includes(msg.replace("...", "")))) {
             logElement.innerHTML = titleTextContent;
        }
        logElement.appendChild(entry);
        logElement.scrollTop = logElement.scrollHeight;
    }

    if (logArray && Array.isArray(logArray)) {
        const initialMessagesForArray = ["initialisé.", "Aucun événement d'exploration récent...", "En attente d'événements..."];
        let shouldClearArray = false;
        if (logArray.length === 1 && typeof logArray[0] === 'string' &&
            initialMessagesForArray.some(initMsg => logArray[0].includes(initMsg.replace("...", "")))) {
            if (message && !initialMessagesForArray.some(initMsg => message.includes(initMsg.replace("...", "")))) {
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
console.log("utils.js - Fin du fichier, fonctions définies.");