// js/utils.js
// alert("utils.js chargé !"); // Pour tester

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

function addLogEntry(message, type = "info", logElement = eventLogEl, logArray = gameState.eventLog) { 
    const timestamp = type !== "combat-visual" && type !== "map-event" && type !== "base-assault-event" && type !== "base-defense-event" && type !== "base-info-event"
                    ? `[${formatTime(gameState.gameTime)}] ` : ""; 
    const entry = document.createElement('p'); 
    entry.innerHTML = `<span class="text-gray-400">${timestamp}</span>${message}`; 
    
    if (logElement === nightAssaultLogEl) {
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
        if (logElement.firstChild && (logElement.firstChild.textContent === "En attente d'événements..." || logElement.firstChild.textContent === "Journal d'assaut initialisé.")) {
            logElement.innerHTML = ""; 
        }
        logElement.appendChild(entry); 
        logElement.scrollTop = logElement.scrollHeight; 
    } 
    if (logArray) { 
        if (logArray.length > 0 && logArray[0] === "Journal d'assaut initialisé.") logArray.shift(); 
        logArray.push(`${timestamp}${message}`); 
        if (logArray.length > 75 && logElement === nightAssaultLogEl) logArray.shift(); 
        else if (logArray.length > 100 && logElement === eventLogEl) logArray.shift();
    } 
}