// js/utils.js
// console.log("utils.js - Fichier chargé.");

function sleep(ms) { 
    return new Promise(resolve => setTimeout(resolve, ms)); 
} 
function formatTime(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }

let modalConfirmCallback = null; 
function showModal(title, message, onConfirm, showCancel = true, confirmText = "Confirmer", cancelText = "Annuler") { 
    if (typeof modalTitle !== 'undefined' && modalTitle) modalTitle.textContent = title; 
    if (typeof modalMessage !== 'undefined' && modalMessage) modalMessage.innerHTML = message; 
    modalConfirmCallback = onConfirm; 
    if (typeof modalConfirm !== 'undefined' && modalConfirm) {
        modalConfirm.textContent = confirmText;
        modalConfirm.classList.toggle('hidden', !onConfirm); 
    }
    if (typeof modalCancel !== 'undefined' && modalCancel) {
        modalCancel.textContent = cancelText;
        modalCancel.classList.toggle('hidden', !showCancel);
    }
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
        // Conserver les titres H3/H4
        const titleElement = logElement.querySelector('h3, h4');
        let titleHTML = "";
        if (titleElement) {
            titleHTML = titleElement.outerHTML;
        }
        
        if (initialMessages.includes(firstChildText) && firstChild.tagName === 'P') {
             logElement.innerHTML = titleHTML; // Remettre le titre s'il existait, puis vider le reste (le placeholder P)
        } else if (logElement.children.length === (titleElement ? 1 : 0) && initialMessages.includes(firstChildText)) {
             logElement.innerHTML = titleHTML; // Si seulement le titre + placeholder P, ou juste placeholder P
        } else if (logElement.children.length > (titleElement ? 1 : 0) && 
                   logElement.children[(titleElement ? 1 : 0)] && 
                   logElement.children[(titleElement ? 1 : 0)].tagName === 'P' && 
                   initialMessages.includes(logElement.children[(titleElement ? 1 : 0)].textContent)) {
             logElement.children[(titleElement ? 1 : 0)].remove(); // Enlever juste le <p> initial après le H3/H4
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