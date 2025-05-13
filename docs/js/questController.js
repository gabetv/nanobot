// js/questController.js
console.log("questController.js - Fichier chargé et en cours d'analyse...");

var questController = {

    initializeQuests: function() {
        console.log("questController: initializeQuests CALLED");
        if (!gameState || typeof QUEST_DATA === 'undefined' || typeof QUEST_STATUS === 'undefined') {
            console.error("questController.initializeQuests: Dépendances gameState ou QUEST_DATA/QUEST_STATUS manquantes.");
            if (gameState) gameState.quests = {};
            return;
        }
        if (!gameState.quests) gameState.quests = {};

        for (const questId in QUEST_DATA) {
            if (!gameState.quests[questId]) {
                gameState.quests[questId] = {
                    id: questId,
                    status: QUEST_STATUS.LOCKED,
                    progress: {},
                    objectivesCompleted: QUEST_DATA[questId].objectives.map(() => false)
                };
            } else {
                const questDef = QUEST_DATA[questId];
                const currentQuestState = gameState.quests[questId];
                if (questDef && (!currentQuestState.objectivesCompleted || currentQuestState.objectivesCompleted.length !== questDef.objectives.length)) {
                    // console.warn(`questController.initializeQuests: Nombre d'objectifs décalé pour la quête ${questId}. Réinitialisation de objectivesCompleted.`);
                    currentQuestState.objectivesCompleted = questDef.objectives.map(() => false);
                }
                if (currentQuestState.status === undefined || !Object.values(QUEST_STATUS).includes(currentQuestState.status)) {
                    // console.warn(`questController.initializeQuests: Statut invalide ${currentQuestState.status} pour la quête ${questId}. Réinitialisation à LOCKED.`);
                    currentQuestState.status = QUEST_STATUS.LOCKED;
                }
                 // S'assurer que progress est un objet
                if (typeof currentQuestState.progress !== 'object' || currentQuestState.progress === null) {
                    currentQuestState.progress = {};
                }
            }
        }
        this.updateAvailableQuests();
        console.log("questController: Quests initialisées.");
    },

    updateAvailableQuests: function() {
        // console.log("questController: updateAvailableQuests CALLED");
        if (!gameState || !gameState.quests || typeof QUEST_DATA === 'undefined' || typeof QUEST_STATUS === 'undefined') return;
        let changed = false;
        for (const questId in QUEST_DATA) {
            const questDef = QUEST_DATA[questId];
            const questState = gameState.quests[questId];

            if (questState && questState.status === QUEST_STATUS.LOCKED) {
                if (questDef.unlockConditions && typeof questDef.unlockConditions === 'function') {
                    if (questDef.unlockConditions(gameState)) {
                        questState.status = QUEST_STATUS.AVAILABLE;
                        if (typeof addLogEntry === 'function') addLogEntry(`Nouvelle quête disponible: ${questDef.title}`, "info", eventLogEl, gameState.eventLog);
                        changed = true;
                    }
                } else if (!questDef.unlockConditions) { // Quêtes sans conditions d'unlock (après initialisation)
                    questState.status = QUEST_STATUS.AVAILABLE;
                     if (typeof addLogEntry === 'function') addLogEntry(`Nouvelle quête disponible: ${questDef.title}`, "info", eventLogEl, gameState.eventLog);
                    changed = true;
                }
            }
        }
        // Mise à jour de l'UI seulement si l'onglet est visible et qu'il y a eu un changement
        if (changed && typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function' && typeof questsContentEl !== 'undefined' && questsContentEl && !questsContentEl.classList.contains('hidden')) {
            questUI.updateQuestDisplay();
        }
    },

    activateQuest: function(questId) {
        console.log(`questController: activateQuest pour ${questId}`);
        if (!gameState || !gameState.quests || typeof QUEST_DATA === 'undefined' || !QUEST_DATA[questId] || !gameState.quests[questId]) {
            console.warn(`questController.activateQuest: Quête ${questId} non trouvée ou gameState.quests non initialisé.`);
            return;
        }
        const questState = gameState.quests[questId];
        const questDef = QUEST_DATA[questId];

        if (questState.status === QUEST_STATUS.AVAILABLE) {
            questState.status = QUEST_STATUS.ACTIVE;
            questState.progress = {};
            questState.objectivesCompleted = questDef.objectives.map(() => false);
            questDef.objectives.forEach((obj, index) => {
                if (obj.type === "collect_resource" || obj.type === "explore_tiles" || obj.type === "interact_poi_type" || obj.type === "defeat_enemy_type") {
                    questState.progress[`objective_${index}`] = 0;
                }
            });
            if (typeof addLogEntry === 'function') addLogEntry(`Quête activée: ${questDef.title}`, "success", eventLogEl, gameState.eventLog);
            this.checkQuestCompletion(questId, null, true); // Vérifier si déjà complétée
            if (typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function') {
                questUI.updateQuestDisplay();
            }
        } else {
            if (typeof addLogEntry === 'function') addLogEntry(`Impossible d'activer la quête: ${questDef.title} (Statut actuel: ${questState.status})`, "warning", eventLogEl, gameState.eventLog);
        }
    },

    checkAllQuestsProgress: function() {
        // console.log("questController: checkAllQuestsProgress CALLED");
        if (!gameState || !gameState.quests || typeof QUEST_DATA === 'undefined') return;
        let questUIDneedsUpdate = false;
        for (const questId in gameState.quests) {
            const questState = gameState.quests[questId];
            if (questState.status === QUEST_STATUS.ACTIVE) {
                if (this.checkQuestCompletion(questId, null, true)) {
                    questUIDneedsUpdate = true;
                }
            }
        }
        this.updateAvailableQuests();
        if (questUIDneedsUpdate && typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function' && typeof questsContentEl !== 'undefined' && questsContentEl && !questsContentEl.classList.contains('hidden')) {
            questUI.updateQuestDisplay();
        }
    },

    checkQuestProgress: function(eventData) {
        // console.log("questController: checkQuestProgress pour l'événement:", eventData);
        if (!gameState || !gameState.quests || typeof QUEST_DATA === 'undefined') return;
        let questUIDneedsUpdate = false;

        for (const questId in gameState.quests) {
            const questState = gameState.quests[questId];
            const questDef = QUEST_DATA[questId];

            if (!questDef || questState.status !== QUEST_STATUS.ACTIVE) continue;

            questDef.objectives.forEach((obj, index) => {
                if (questState.objectivesCompleted[index]) return;

                let objectiveProgressMadeThisEvent = false;
                let currentProgress = questState.progress[`objective_${index}`] || 0;

                if (obj.type === eventData.type) {
                    if (obj.type === "collect_resource" && obj.resource === eventData.resource) {
                        currentProgress += eventData.amount; objectiveProgressMadeThisEvent = true;
                    } else if (obj.type === "explore_tiles" && eventData.count) {
                        currentProgress += eventData.count; objectiveProgressMadeThisEvent = true;
                    } else if (obj.type === "explore_tile_type" && obj.tileType === eventData.tileType && (!obj.zoneId || obj.zoneId === eventData.zoneId)) {
                        currentProgress += 1; objectiveProgressMadeThisEvent = true;
                    } else if (obj.type === "interact_poi_type" && obj.poiType === eventData.poiType && (!obj.zoneId || obj.zoneId === eventData.zoneId)) {
                        currentProgress += (eventData.count || 1); objectiveProgressMadeThisEvent = true;
                    } else if (obj.type === "defeat_enemy_type" && obj.enemyId === eventData.enemyId) { // eventData.enemyId doit être l'ID de explorationEnemyData
                        currentProgress += 1; objectiveProgressMadeThisEvent = true;
                    }
                }

                if (objectiveProgressMadeThisEvent) {
                    questState.progress[`objective_${index}`] = currentProgress;
                    questUIDneedsUpdate = true;
                }
            });
            if (this.checkQuestCompletion(questId, eventData)) {
                questUIDneedsUpdate = true;
            }
        }
        if (questUIDneedsUpdate && typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function' && typeof questsContentEl !== 'undefined' && questsContentEl && !questsContentEl.classList.contains('hidden')) {
            questUI.updateQuestDisplay();
        }
    },

    checkQuestCompletion: function(questId, eventData = null, isGeneralCheck = false) {
        // console.log(`questController: checkQuestCompletion pour ${questId}`);
        if (!gameState || !gameState.quests || typeof QUEST_DATA === 'undefined' || !QUEST_DATA[questId] || !gameState.quests[questId]) return false;

        const questState = gameState.quests[questId];
        const questDef = QUEST_DATA[questId];

        if (questState.status !== QUEST_STATUS.ACTIVE) return false;

        let allObjectivesNowMet = true;
        let objectiveStatusChangedThisCheck = false;

        questDef.objectives.forEach((obj, index) => {
            if (questState.objectivesCompleted[index]) return;

            let currentObjectiveMet = false;
            const currentProgress = questState.progress[`objective_${index}`] || 0;

            switch(obj.type) {
                case "collect_resource": if (currentProgress >= obj.amount) currentObjectiveMet = true; break;
                case "explore_tiles": case "interact_poi_type": case "defeat_enemy_type":
                    if (currentProgress >= obj.count) currentObjectiveMet = true; break;
                case "build_level":
                    if (typeof gameState.buildings !== 'undefined' && (gameState.buildings[obj.buildingId] || 0) >= obj.level) currentObjectiveMet = true;
                    break;
                case "destroy_enemy_base":
                    if (typeof mapManager !== 'undefined' && typeof mapManager.getTile === 'function') {
                        // Tenter de trouver la base par son ID spécifique sur la carte de la zone
                        let baseDestroyed = false;
                        const zoneToCheck = obj.zoneId || gameState.currentZoneId; // Utiliser la zone spécifiée ou la zone actuelle
                        // On ne peut vérifier que la zone actuelle facilement pour l'instant
                        if (gameState.map.zoneId === zoneToCheck) {
                            for (let y = 0; y < gameState.map.tiles.length; y++) {
                                if (!gameState.map.tiles[y]) continue;
                                for (let x = 0; x < gameState.map.tiles[y].length; x++) {
                                    const tile = mapManager.getTile(x,y);
                                    if (tile && tile.content && tile.content.type === 'enemy_base' && tile.content.id === obj.baseId) {
                                        if (tile.content.currentHealth <= 0) baseDestroyed = true;
                                        break;
                                    }
                                    // Alternative si on marque la tuile après destruction
                                    if (tile && tile.actualType === TILE_TYPES.RUINS && tile.content?.originalBaseId === obj.baseId) {
                                        baseDestroyed = true;
                                        break;
                                    }
                                }
                                if (baseDestroyed) break;
                            }
                        }
                        if(baseDestroyed) currentObjectiveMet = true;
                    }
                    break;
                case "reach_level":
                    if (gameState.nanobotStats.level >= obj.level) currentObjectiveMet = true;
                    break;
            }

            if (currentObjectiveMet) {
                if (!questState.objectivesCompleted[index]) {
                    questState.objectivesCompleted[index] = true;
                    objectiveStatusChangedThisCheck = true;
                }
            } else {
                allObjectivesNowMet = false;
            }
        });

        if (allObjectivesNowMet) {
            this.completeQuest(questId);
            return true; // Indique que la quête a été complétée et son statut mis à jour
        }
        return objectiveStatusChangedThisCheck; // Retourne true si au moins un objectif a été complété ce tick
    },

    completeQuest: function(questId) {
        console.log(`questController: completeQuest pour ${questId}`);
        if (!gameState || !gameState.quests || typeof QUEST_DATA === 'undefined' || !QUEST_DATA[questId] || !gameState.quests[questId]) return;
        const questState = gameState.quests[questId];
        const questDef = QUEST_DATA[questId];

        if (questState && questState.status === QUEST_STATUS.ACTIVE) {
            questState.status = QUEST_STATUS.COMPLETED; // Ou FINISHED si pas d'étape de "claim"
            if (typeof addLogEntry === 'function') {
                addLogEntry(`Quête terminée: ${questDef.title}! Récompenses obtenues.`, "success", eventLogEl, gameState.eventLog);
                addLogEntry(`Objectif atteint: ${questDef.title}`, "map-event", explorationLogEl, gameState.explorationLog);
            }

            if (questDef.rewards) {
                if (questDef.rewards.xp && typeof gainXP === 'function') gainXP(questDef.rewards.xp);
                if (questDef.rewards.resources) {
                    for (const res in questDef.rewards.resources) {
                        gameState.resources[res] = (gameState.resources[res] || 0) + questDef.rewards.resources[res];
                        if (typeof addLogEntry === 'function') addLogEntry(`Récompense: +${questDef.rewards.resources[res]} ${res.charAt(0).toUpperCase() + res.slice(1)}`, "success", eventLogEl, gameState.eventLog);
                    }
                     if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
                     else if (typeof updateResourceDisplay === 'function') updateResourceDisplay();
                }
                if (questDef.rewards.items && typeof addToInventory === 'function' && typeof itemsData !== 'undefined') {
                    questDef.rewards.items.forEach(itemId => { if(itemsData[itemId]) addToInventory(itemId); else console.warn(`Item de récompense inconnu: ${itemId}`);});
                }
                if (questDef.rewards.unlocks) {
                    if(questDef.rewards.unlocks.research && typeof researchData !== 'undefined') {
                         if (typeof addLogEntry === 'function') addLogEntry(`Nouvelle technologie de recherche potentiellement disponible : ${researchData[questDef.rewards.unlocks.research]?.name || questDef.rewards.unlocks.research}`, "info", eventLogEl, gameState.eventLog);
                    }
                    if (questDef.rewards.unlocks.zone && typeof ZONE_DATA !== 'undefined' && ZONE_DATA[questDef.rewards.unlocks.zone]) {
                        if (!gameState.unlockedZones.includes(questDef.rewards.unlocks.zone)) {
                            gameState.unlockedZones.push(questDef.rewards.unlocks.zone);
                             if (typeof addLogEntry === 'function') addLogEntry(`Nouvelle zone débloquée: ${ZONE_DATA[questDef.rewards.unlocks.zone].name}`, "success", eventLogEl, gameState.eventLog);
                        }
                    }
                }
            }
            questState.status = QUEST_STATUS.FINISHED;

            if (questDef.nextQuest && QUEST_DATA[questDef.nextQuest] && gameState.quests[questDef.nextQuest]) {
                // L'appel à updateAvailableQuests s'en chargera
            }
            this.updateAvailableQuests(); // Crucial pour débloquer la suite
            if (typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function') {
                questUI.updateQuestDisplay();
            }
        }
    }
};
console.log("questController.js - Objet questController défini.");