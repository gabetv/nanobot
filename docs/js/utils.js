// js/utils.js
// console.log("utils.js - Fichier chargé.");

function sleep(ms) { 
    return new Promise(resolve => setTimeout(resolve, ms)); 
} 
function formatTime(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }

let modalConfirmCallback = null; 
function showModal(title, message, onConfirm, showCancel = true) { 
    if (modalTitle) modalTitle.textContent = title; 
    if (modalMessage) modalMessage.innerHTML = message; 
    modalConfirmCallback = onConfirm; 
    if (modalConfirm) modalConfirm.classList.toggle('hidden', !onConfirm); 
    if (modalCancel) modalCancel.classList.toggle('hidden', !showCancel); 
    if (modal) modal.classList.remove('hidden'); 
} 
function hideModal() { 
    if (modal) modal.classList.add('hidden'); 
    modalConfirmCallback = null; 
}

function addLogEntry(message, type = "info", logElement = null, logArray = null) { 
    const currentGameTime = (typeof gameState !== 'undefined' && gameState && gameState.gameTime !== undefined) ? gameState.gameTime : 0;

    if (logElement === null && typeof eventLogEl !== 'undefined' && eventLogEl) logElement = eventLogEl;
    if (logArray === null && typeof gameState !== 'undefined' && gameState && Array.isArray(gameState.eventLog)) logArray = gameState.eventLog;

    const timestamp = type !== "combat-visual" && type !== "map-event" && type !== "base-assault-event" && type !== "base-defense-event" && type !== "base-info-event"
                    ? `[${formatTime(currentGameTime)}] ` : ""; 
    const entry = document.createElement('p'); 
    entry.innerHTML = `<span class="text-gray-400">${timestamp}</span>${message}`; 
    
    if (typeof nightAssaultLogEl !== 'undefined' && logElement === nightAssaultLogEl) {
        if (type === "base-assault-event") entry.classList.add("text-red-400"); 
        else if (type === "base-defense-event") entry.classList.add("text-teal-300"); 
        else if (type === "success") entry.classList.add("text-green-400"); 
        else if (type === "error") entry.classList.add("text-red-400"); 
        else if (type === "base-info-event") entry.classList.add("text-gray-400");
        else entry.classList.add("text-orange-300"); 
    } else { 
        if (type === "error") entry.classList.add("text-red-400"); 
        if (type === "success") entry.classList.add("text-green-400"); 
        if (type === "warning") entry.classList.add("text-yellow-400"); 
        if (type === "combat" || type === "combat-visual" || type === "map-event") entry.classList.add("text-orange-300");
    }

    if (logElement) { 
        const firstChild = logElement.firstChild;
        const firstChildText = firstChild ? firstChild.textContent : "";
        const initialMessages = ["En attente d'événements...", "Journal d'assaut initialisé."];
        const titleMessages = ["Journal Principal des Événements :", "Résumé Combat :", "Journal d'Assaut Nocturne"];
        
        let shouldClearP = false;
        if (initialMessages.includes(firstChildText) && firstChild.tagName === 'P') {
            shouldClearP = true;
        } else if (logElement.children.length > 0 && logElement.children[0].tagName && titleMessages.some(title => logElement.children[0].textContent.includes(title))) {
             if(logElement.children.length === 1){ // Only title, no other p
                // Don't clear, just append
             } else if (logElement.children.length > 1 && logElement.children[1].tagName === 'P' && initialMessages.includes(logElement.children[1].textContent)) {
                logElement.children[1].remove();
             }
        } else if (logElement.children.length === 0 || (logElement.children.length === 1 && initialMessages.includes(firstChildText))) {
            // If empty or only contains the initial placeholder P (not a title H3/H4)
            logElement.innerHTML = ""; // Clear completely
        }


        if (shouldClearP) {
            logElement.innerHTML = ""; 
            if (logElement === eventLogEl && typeof eventLogEl !== 'undefined' && eventLogEl.querySelector('h3') === null) {
                 eventLogEl.insertAdjacentHTML('afterbegin', '<h3 class="font-semibold mb-2 text-gray-300">Journal Principal des Événements :</h3>');
            } else if (logElement === combatLogSummaryEl && typeof combatLogSummaryEl !== 'undefined' && combatLogSummaryEl.querySelector('h4') === null) {
                 combatLogSummaryEl.insertAdjacentHTML('afterbegin', '<h4 class="font-semibold mb-1 text-gray-300">Résumé Combat :</h4>');
            } else if (logElement === nightAssaultLogEl && typeof nightAssaultLogEl !== 'undefined' && nightAssaultLogEl.querySelector('h3') === null) {
                 nightAssaultLogEl.insertAdjacentHTML('afterbegin', '<h3 class="font-orbitron text-lg mb-2 text-red-300 border-b border-gray-600 pb-1">Journal d\'Assaut Nocturne</h3>');
            }
        }
        
        logElement.appendChild(entry); 
        logElement.scrollTop = logElement.scrollHeight; 
    } 
    if (logArray && Array.isArray(logArray)) { 
        if (logArray.length > 0 && typeof logArray[0] === 'string' && logArray[0].includes("initialisé.")) logArray.shift(); 
        logArray.push(`${timestamp}${message}`); 
        if (logArray.length > 75 && typeof nightAssaultLogEl !== 'undefined' && logElement === nightAssaultLogEl) logArray.shift(); 
        else if (logArray.length > 100 && typeof eventLogEl !== 'undefined' && logElement === eventLogEl) logArray.shift();
    } 
}

function calculateModifiedDamage(baseDamage, damageType, targetResistances) {
    if (!damageType || !targetResistances) {
        return Math.max(0, Math.floor(baseDamage)); 
    }
    const resistanceValue = targetResistances[damageType] || 0; 
    return Math.max(0, Math.floor(baseDamage * (1 - resistanceValue)));
}