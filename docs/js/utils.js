// js/utils.js
console.log("utils.js - Fichier chargé et en cours d'analyse...");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatTime(seconds) {
    const flooredSeconds = Math.floor(seconds);
    return `${Math.floor(flooredSeconds / 60).toString().padStart(2, '0')}:${(flooredSeconds % 60).toString().padStart(2, '0')}`;
}

var modalConfirmCallback = null;

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
    entry.className = 'text-xs'; // Classe de base pour la taille

    if (logElement === nightAssaultLogEl) {
        if (type === "base-assault-event" || type === "error") entry.classList.add("text-red-400");
        else if (type === "base-defense-event") entry.classList.add("text-teal-300");
        else if (type === "success") entry.classList.add("text-green-400");
        else if (type === "base-info-event") entry.classList.add("text-gray-400"); // Plus neutre pour les infos de routine
        else entry.classList.add("text-orange-300"); // Pour les événements/alertes de vague
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
        else entry.classList.add("text-orange-300"); // Par défaut pour les logs de combat
    } else { // Fallback pour les logs non assignés à un élément spécifique
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
             logElement.innerHTML = titleHTML; // Réinsérer le titre si on efface le placeholder
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
    console.log("showNightAssaultVideo: Affichage de la vidéo", videoSrc);

    // Vérifier si la source doit être mise à jour
    // Utiliser videoElement.getAttribute('src') pour obtenir la valeur définie dans HTML/JS
    // et la comparer à videoSrc avant de faire new URL().
    const currentVideoFile = videoElement.getAttribute('src');
    if (currentVideoFile !== videoSrc) {
         videoElement.src = videoSrc;
         videoElement.load(); // Important pour que le navigateur prenne la nouvelle source
         console.log("showNightAssaultVideo: Source vidéo mise à jour et chargée :", videoSrc);
    } else {
        console.log("showNightAssaultVideo: Source vidéo déjà correcte.");
    }


    videoContainer.classList.remove('hidden');
    videoElement.currentTime = 0;
    // Laisser muted à true pour l'autoplay, l'utilisateur pourra démuter si le navigateur le permet
    videoElement.muted = true; // Essayez avec true pour maximiser les chances d'autoplay

    videoElement.play().then(() => {
        console.log("showNightAssaultVideo: Lecture vidéo démarrée.");
        // Si la lecture démarre, on peut tenter de démuter après un court instant
        // Mais cela peut aussi être bloqué par le navigateur.
        // setTimeout(() => { videoElement.muted = false; }, 100);
    }).catch(error => {
        console.warn("showNightAssaultVideo: Lecture automatique de la vidéo bloquée :", error);
        // Même si la lecture est bloquée, on affiche la modale.
        // L'utilisateur devra cliquer sur le bouton de fermeture ou la vidéo se fermera à la fin si elle se lance quand même.
        // On pourrait ajouter un message "Cliquez pour démarrer" si l'autoplay est critique
        // Ou simplement fermer la modale après un court délai si l'autoplay est essentiel ET échoue.
        // Pour l'instant, on se fie à onended et au bouton de fermeture.
    });

    videoElement.onended = function() {
        console.log("showNightAssaultVideo: Vidéo terminée (onended).");
        hideNightAssaultVideo();
        videoElement.onended = null; // Bonne pratique pour nettoyer l'écouteur
    };

    videoElement.onerror = function(e) {
        console.error("showNightAssaultVideo: Erreur de chargement/lecture vidéo.", videoElement.error);
        // Tenter d'ajouter au log du jeu si possible
        if(typeof addLogEntry === 'function' && typeof eventLogEl !== 'undefined' && typeof gameState !== 'undefined' && gameState.eventLog){
            addLogEntry("Erreur lors du chargement de l'animation d'alerte.", "error", eventLogEl, gameState.eventLog);
        }
        hideNightAssaultVideo(); // Masquer la modale même en cas d'erreur vidéo
        videoElement.onerror = null; // Nettoyer l'écouteur
    };
}

function hideNightAssaultVideo() {
    const videoContainer = document.getElementById('night-assault-video-container');
    const videoElement = document.getElementById('night-assault-video');
    if (!videoContainer || !videoElement) {
        console.warn("Éléments de la vidéo d'assaut nocturne non trouvés pour masquer.");
        return;
    }
    console.log("hideNightAssaultVideo: Masquage de la vidéo.");
    videoContainer.classList.add('hidden');
    if (!videoElement.paused) { // Ne mettre en pause que si elle est en train de jouer
        videoElement.pause();
    }
    // On ne remet pas currentTime à 0 ici, car si on la remontre, on veut qu'elle redémarre de 0 (géré dans showNightAssaultVideo)
}

console.log("utils.js - Fin du fichier, fonctions définies.");