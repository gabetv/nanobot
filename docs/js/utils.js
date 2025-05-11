// js/utils.js
// console.log("utils.js - Fichier chargé.");

function sleep(ms) { 
    return new Promise(resolve => setTimeout(resolve, ms)); 
} 
function formatTime(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }

let modalConfirmCallback = null; 
function showModal(title, message, onConfirm, showCancel = true) { 
    if (typeof modalTitle !== 'undefined' && modalTitle) modalTitle.textContent = title; 
    if (typeof modalMessage !== 'undefined' && modalMessage) modalMessage.innerHTML = message; 
    modalConfirmCallback = onConfirm; 
    if (typeof modalConfirm !== 'undefined' && modalConfirm) modalConfirm.classList.toggle('hidden', !onConfirm); 
    if (typeof modalCancel !== 'undefined' && modalCancel) modalCancel.classList.toggle('hidden', !showCancel); 
    if (typeof modal !== 'undefined' && modal) modal.classList.remove('hidden'); 
} 
function hideModal() { 
    if (typeof modal !== 'undefined' && modal) modal.classList.add('hidden'); 
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
        const titleElements = logElement.querySelectorAll('h3, h4'); // Chercher h3 ou h4

        let titleTextContent = "";
        if (titleElements.length > 0) {
            titleTextContent = titleElements[0].outerHTML; // Garder le HTML du titre
        }
        
        if (logElement.children.length === (titleElements.length > 0 ? 1 : 0) && initialMessages.includes(firstChildText) && firstChild.tagName === 'P') {
             logElement.innerHTML = titleTextContent; // Remettre le titre s'il existait, puis vider le reste
        } else if (logElement.children.length > titleElements.length && logElement.children[titleElements.length] && logElement.children[titleElements.length].tagName === 'P' && initialMessages.includes(logElement.children[titleElements.length].textContent)) {
             logElement.children[titleElements.length].remove();
        } else if (logElement.children.length === 0 && initialMessages.includes(firstChildText)){ // Si vide et que le texte était le placeholder
             logElement.innerHTML = titleTextContent;
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
// console.log("utils.js - Fin du fichier.");