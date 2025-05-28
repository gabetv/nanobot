// js/questController.js
console.log("questController.js - Fichier chargé et en cours d'analyse...");

var questController = {

    initializeQuests: function() {
        console.log("questController: initializeQuests CALLED");
        if (!gameState || typeof window.QUEST_DATA === 'undefined' || typeof window.QUEST_STATUS === 'undefined') {
            console.error("questController.initializeQuests: Dépendances gameState, QUEST_DATA ou QUEST_STATUS manquantes (vérifié via window).");
            if (gameState) gameState.quests = {};
            return;
        }
        if (!gameState.quests) gameState.quests = {};

        for (const questId in window.QUEST_DATA) {
            const questDef = window.QUEST_DATA[questId];
            if (!gameState.quests[questId]) {
                gameState.quests[questId] = {
                    id: questId,
                    status: window.QUEST_STATUS.LOCKED,
                    progress: {},
                    objectivesCompleted: questDef.objectives.map(() => false)
                };
            } else {
                // Assurer la cohérence des données sauvegardées avec les définitions actuelles
                const currentQuestState = gameState.quests[questId];
                if (questDef && (!currentQuestState.objectivesCompleted || currentQuestState.objectivesCompleted.length !== questDef.objectives.length)) {
                    currentQuestState.objectivesCompleted = questDef.objectives.map(() => false);
                }
                if (currentQuestState.status === undefined || !Object.values(window.QUEST_STATUS).includes(currentQuestState.status)) {
                    currentQuestState.status = window.QUEST_STATUS.LOCKED; // Réinitialiser si statut invalide
                }
                if (typeof currentQuestState.progress !== 'object' || currentQuestState.progress === null) {
                    currentQuestState.progress = {}; // S'assurer que progress est un objet
                }
            }
        }
        this.updateAvailableQuests(); // Mettre à jour les statuts initiaux
        console.log("questController: Quests initialisées.");
    },

    updateAvailableQuests: function() {
        if (!gameState || !gameState.quests || typeof window.QUEST_DATA === 'undefined' || typeof window.QUEST_STATUS === 'undefined') return;
        let changed = false;
        for (const questId in window.QUEST_DATA) {
            const questDef = window.QUEST_DATA[questId];
            const questState = gameState.quests[questId];

            if (questState && questState.status === window.QUEST_STATUS.LOCKED) {
                let allPrerequisitesMet = true;
                if (questDef.prerequisites) {
                    if (questDef.prerequisites.level && gameState.nanobotStats.level < questDef.prerequisites.level) {
                        allPrerequisitesMet = false;
                    }
                    if (allPrerequisitesMet && questDef.prerequisites.questsCompleted) {
                        for (const reqQuestId of questDef.prerequisites.questsCompleted) {
                            if (!gameState.quests[reqQuestId] || (gameState.quests[reqQuestId].status !== window.QUEST_STATUS.COMPLETED && gameState.quests[reqQuestId].status !== window.QUEST_STATUS.FINISHED)) {
                                allPrerequisitesMet = false; break;
                            }
                        }
                    }
                    // TODO: Ajouter d'autres types de prérequis ici (recherche, item, flag de jeu, etc.)
                    // if (allPrerequisitesMet && questDef.prerequisites.research && !gameState.research[questDef.prerequisites.research]) {
                    //     allPrerequisitesMet = false;
                    // }
                    // if (allPrerequisitesMet && questDef.prerequisites.gameplayFlag && !gameState.gameplayFlags[questDef.prerequisites.gameplayFlag]) {
                    //     allPrerequisitesMet = false;
                    // }
                }
                
                // Conditions de déblocage personnalisées (si définies dans la quête)
                if (allPrerequisitesMet && questDef.unlockConditions && typeof questDef.unlockConditions === 'function') {
                    if (!questDef.unlockConditions(gameState)) {
                        allPrerequisitesMet = false;
                    }
                } else if (allPrerequisitesMet && !questDef.unlockConditions && !questDef.prerequisites) {
                    // Pour les quêtes sans prérequis ni conditions de déblocage spécifiques, elles deviennent disponibles par défaut
                    // allPrerequisitesMet reste true
                }


                if (allPrerequisitesMet) {
                    questState.status = window.QUEST_STATUS.AVAILABLE;
                    if (typeof addLogEntry === 'function' && window.eventLogEl) addLogEntry(`Nouvelle quête disponible: ${questDef.title}`, "info", window.eventLogEl, gameState.eventLog);
                    changed = true;
                }
            }
        }
        // MODIFICATION : Ne plus appeler questUI.updateQuestDisplay() directement ici.
        // La mise à jour de l'UI sera gérée par uiUpdates.updateDisplays() lorsque l'onglet Quêtes est actif.
        // if (changed && typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function' && window.questsContentEl && !window.questsContentEl.classList.contains('hidden')) {
        //     questUI.updateQuestDisplay();
        // }
        // Si une quête a changé de statut, on peut signaler une mise à jour globale qui sera prise en compte
        // par le système d'UI principal.
        if (changed && typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') {
            // Optionnel : Forcer une mise à jour. Si l'onglet des quêtes n'est pas actif, cela mettra à jour les autres onglets.
            // Si l'onglet des quêtes est actif, il sera mis à jour.
            // window.uiUpdates.updateDisplays();
            // Pour l'instant, on se fie au fait que si l'onglet est actif, updateDisplays sera appelé naturellement.
        }
    },

    activateQuest: function(questId) {
        console.log(`questController: activateQuest pour ${questId}`);
        if (!gameState || !gameState.quests || typeof window.QUEST_DATA === 'undefined' || !window.QUEST_DATA[questId] || !gameState.quests[questId]) {
            console.warn(`questController.activateQuest: Quête ${questId} non trouvée ou gameState.quests non initialisé.`);
            return;
        }
        const questState = gameState.quests[questId];
        const questDef = window.QUEST_DATA[questId];

        if (questState.status === window.QUEST_STATUS.AVAILABLE) {
            questState.status = window.QUEST_STATUS.ACTIVE;
            questState.progress = {}; // Réinitialiser la progression pour les objectifs de cette quête
            questState.objectivesCompleted = questDef.objectives.map(() => false); // Réinitialiser les objectifs complétés
            
            // Initialiser la progression pour les types d'objectifs comptables
            questDef.objectives.forEach((obj, index) => {
                if (obj.type === "collect_resource" || obj.type === "explore_tiles" || obj.type === "interact_poi_type" || obj.type === "defeat_enemy_type") {
                    questState.progress[`objective_${index}`] = 0;
                }
            });

            if (typeof addLogEntry === 'function' && window.eventLogEl) addLogEntry(`Quête activée: ${questDef.title}`, "success", window.eventLogEl, gameState.eventLog);
            this.checkQuestCompletion(questId, null, true); // Vérifier immédiatement si la quête est déjà complétée par l'état actuel du jeu
            
            if (typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function') {
                questUI.updateQuestDisplay(); // Mettre à jour l'UI des quêtes immédiatement après activation
            }
        } else {
            if (typeof addLogEntry === 'function' && window.eventLogEl) addLogEntry(`Impossible d'activer la quête: ${questDef.title} (Statut actuel: ${questState.status})`, "warning", window.eventLogEl, gameState.eventLog);
        }
    },

    checkAllQuestsProgress: function() { // Appelé par des actions de jeu (ex: fin de recherche, construction)
        if (!gameState || !gameState.quests || typeof window.QUEST_DATA === 'undefined') return;
        let questUIneedsUpdate = false;
        for (const questId in gameState.quests) {
            const questState = gameState.quests[questId];
            if (questState.status === window.QUEST_STATUS.ACTIVE) {
                if (this.checkQuestCompletion(questId, null, true)) { // true pour generalCheck
                    questUIneedsUpdate = true;
                }
            }
        }
        this.updateAvailableQuests(); // Peut débloquer de nouvelles quêtes
        if (questUIneedsUpdate && typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function' && window.questsContentEl && !window.questsContentEl.classList.contains('hidden')) {
            questUI.updateQuestDisplay();
        }
    },

    checkQuestProgress: function(eventData) { // Appelé par des événements spécifiques (collecte, kill, etc.)
        if (!gameState || !gameState.quests || typeof window.QUEST_DATA === 'undefined') return;
        let questUIneedsUpdate = false;

        for (const questId in gameState.quests) {
            const questState = gameState.quests[questId];
            const questDef = window.QUEST_DATA[questId];

            if (!questDef || questState.status !== window.QUEST_STATUS.ACTIVE) continue;

            let objectiveStatusChangedThisEvent = false;
            questDef.objectives.forEach((obj, index) => {
                if (questState.objectivesCompleted[index]) return; // Si cet objectif est déjà marqué comme complété, on passe

                let currentProgress = questState.progress[`objective_${index}`] || 0;
                let progressMadeThisEvent = false;

                if (obj.type === eventData.type) {
                    if (obj.type === "collect_resource" && obj.resource === eventData.resource) {
                        currentProgress += eventData.amount; progressMadeThisEvent = true;
                    } else if (obj.type === "explore_tiles" && eventData.count) {
                        currentProgress += eventData.count; progressMadeThisEvent = true;
                    } else if (obj.type === "explore_tile_type" && obj.tileType === eventData.tileType && (!obj.zoneId || obj.zoneId === eventData.zoneId)) {
                        currentProgress += 1; progressMadeThisEvent = true;
                    } else if (obj.type === "interact_poi_type" && obj.poiType === eventData.poiType && (!obj.zoneId || obj.zoneId === eventData.zoneId)) {
                        currentProgress += (eventData.count || 1); progressMadeThisEvent = true;
                    } else if (obj.type === "defeat_enemy_type" && obj.enemyId === eventData.enemyId) {
                        currentProgress += (eventData.count || 1); progressMadeThisEvent = true;
                    }
                    // TODO: Ajouter d'autres types d'objectifs basés sur les événements ici
                }

                if (progressMadeThisEvent) {
                    questState.progress[`objective_${index}`] = currentProgress;
                    objectiveStatusChangedThisEvent = true;
                }
            });

            // Vérifier la complétion de la quête après avoir mis à jour la progression de tous ses objectifs pour cet événement
            if (this.checkQuestCompletion(questId, eventData, false)) { // false car ce n'est pas un generalCheck
                questUIneedsUpdate = true; // La quête elle-même a changé de statut (complétée)
            } else if (objectiveStatusChangedThisEvent) {
                questUIneedsUpdate = true; // Au moins un objectif a progressé, l'UI doit être màj
            }
        }

        if (questUIneedsUpdate && typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function' && window.questsContentEl && !window.questsContentEl.classList.contains('hidden')) {
            questUI.updateQuestDisplay();
        }
    },

    checkQuestCompletion: function(questId, eventData = null, isGeneralCheck = false) {
        if (!gameState || !gameState.quests || typeof window.QUEST_DATA === 'undefined' || !window.QUEST_DATA[questId] || !gameState.quests[questId]) return false;

        const questState = gameState.quests[questId];
        const questDef = window.QUEST_DATA[questId];

        if (questState.status !== window.QUEST_STATUS.ACTIVE) return false;

        let allObjectivesNowMet = true;
        let objectiveStatusChangedThisCheck = false; // Pour savoir si un objectif a été marqué comme complété *pendant cette vérification*

        questDef.objectives.forEach((obj, index) => {
            if (questState.objectivesCompleted[index] && !isGeneralCheck) { // Si déjà complété et pas un general check, on skip
                return;
            }

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
                    if (typeof window.mapManager !== 'undefined' && typeof window.mapManager.getTile === 'function' && typeof window.TILE_TYPES !== 'undefined') {
                        let baseDestroyed = false;
                        const zoneToCheck = obj.zoneId || gameState.currentZoneId; // Utiliser la zone spécifiée ou la zone actuelle
                        if (gameState.map.tiles && gameState.map.tiles[zoneToCheck]) {
                            const zoneMap = gameState.map.tiles[zoneToCheck];
                            for (let y = 0; y < zoneMap.length; y++) {
                                if (!zoneMap[y]) continue;
                                for (let x = 0; x < zoneMap[y].length; x++) {
                                    const tile = zoneMap[y][x];
                                    if (tile && tile.content && tile.content.type === 'enemy_base' && tile.content.id === obj.baseId) {
                                        if (tile.content.currentHealth <= 0) baseDestroyed = true;
                                        break; // Sortir de la boucle interne x
                                    }
                                    // Vérifier aussi si la base a été remplacée par des ruines
                                    if (tile && tile.actualType === window.TILE_TYPES.RUINS && tile.content?.originalBaseId === obj.baseId) {
                                        baseDestroyed = true; break; // Sortir de la boucle interne x
                                    }
                                }
                                if (baseDestroyed) break; // Sortir de la boucle externe y
                            }
                        }
                        if(baseDestroyed) currentObjectiveMet = true;
                    }
                    break;
                case "reach_level":
                    if (gameState.nanobotStats.level >= obj.level) currentObjectiveMet = true;
                    break;
                case "research_tech":
                     if (gameState.research && gameState.research[obj.researchId]) currentObjectiveMet = true;
                     break;
                // TODO: Ajoutez d'autres types d'objectifs ici
            }

            if (currentObjectiveMet) {
                if (!questState.objectivesCompleted[index]) { // Si on le marque complété maintenant
                    questState.objectivesCompleted[index] = true;
                    objectiveStatusChangedThisCheck = true;
                }
            } else { // Si un seul objectif n'est pas rempli
                allObjectivesNowMet = false;
            }
        });

        if (allObjectivesNowMet) {
            this.completeQuest(questId); // Change le statut de la quête en FINISHED et donne les récompenses
            return true; // La quête est maintenant terminée
        }
        return objectiveStatusChangedThisCheck; // Retourne true si au moins un objectif a été marqué comme complété
    },

    completeQuest: function(questId) {
        console.log(`questController: completeQuest pour ${questId}`);
        if (!gameState || !gameState.quests || typeof window.QUEST_DATA === 'undefined' || !window.QUEST_DATA[questId] || !gameState.quests[questId]) return;
        const questState = gameState.quests[questId];
        const questDef = window.QUEST_DATA[questId];

        if (questState && questState.status === window.QUEST_STATUS.ACTIVE) { // Doit être active pour être complétée
            questState.status = window.QUEST_STATUS.FINISHED; // Marquer comme terminée et récompenses données
            if (typeof addLogEntry === 'function' && window.eventLogEl && window.explorationLogEl) {
                addLogEntry(`Quête terminée: ${questDef.title}! Récompenses obtenues.`, "success", window.eventLogEl, gameState.eventLog);
                addLogEntry(`Objectif atteint: ${questDef.title}`, "map-event", window.explorationLogEl, gameState.explorationLog); // Log exploration aussi
            }

            // Donner les récompenses
            if (questDef.rewards) {
                if (questDef.rewards.xp && typeof gainXP === 'function') gainXP(questDef.rewards.xp);
                if (questDef.rewards.resources) {
                    for (const res in questDef.rewards.resources) {
                        gameState.resources[res] = (gameState.resources[res] || 0) + questDef.rewards.resources[res];
                        if (typeof addLogEntry === 'function' && window.eventLogEl) addLogEntry(`Récompense: +${questDef.rewards.resources[res]} ${res.charAt(0).toUpperCase() + res.slice(1)}`, "success", window.eventLogEl, gameState.eventLog);
                    }
                     if (typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
                }
                if (questDef.rewards.items && typeof addToInventory === 'function' && typeof window.itemsData !== 'undefined') {
                    questDef.rewards.items.forEach(itemReward => {
                        const itemId = typeof itemReward === 'string' ? itemReward : itemReward.itemId;
                        const quantity = typeof itemReward === 'string' ? 1 : (itemReward.quantity || 1);
                        if(window.itemsData[itemId]) {
                            for(let i=0; i<quantity; i++) addToInventory(itemId);
                        } else {
                            console.warn(`Item de récompense inconnu: ${itemId}`);
                        }
                    });
                }
                if (questDef.rewards.unlocksQuest && window.QUEST_DATA[questDef.rewards.unlocksQuest]) {
                    // Le déblocage se fera par updateAvailableQuests
                }
                if (questDef.rewards.unlocksBuilding && window.buildingsData && window.buildingsData[questDef.rewards.unlocksBuilding]) {
                     if (typeof addLogEntry === 'function' && window.eventLogEl) addLogEntry(`Nouveau bâtiment débloqué : ${window.buildingsData[questDef.rewards.unlocksBuilding].name}`, "info", window.eventLogEl, gameState.eventLog);
                }
                if (questDef.rewards.unlocksResearch && window.researchData && window.researchData[questDef.rewards.unlocksResearch]) {
                     if (typeof addLogEntry === 'function' && window.eventLogEl) addLogEntry(`Nouvelle recherche disponible : ${window.researchData[questDef.rewards.unlocksResearch].name}`, "info", window.eventLogEl, gameState.eventLog);
                }
                 if (questDef.rewards.unlocksZone && typeof window.ZONE_DATA !== 'undefined' && window.ZONE_DATA[questDef.rewards.unlocksZone]) {
                    if (!gameState.unlockedZones.includes(questDef.rewards.unlocksZone)) {
                        gameState.unlockedZones.push(questDef.rewards.unlocksZone);
                        if (typeof addLogEntry === 'function' && window.eventLogEl) addLogEntry(`Nouvelle zone débloquée: ${window.ZONE_DATA[questDef.rewards.unlocksZone].name}`, "success", window.eventLogEl, gameState.eventLog);
                    }
                }
            }

            this.updateAvailableQuests(); // Vérifier si cette quête débloque d'autres quêtes
            if (typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function') {
                questUI.updateQuestDisplay(); // Mettre à jour l'UI des quêtes immédiatement
            }
        }
    }
};
window.questController = questController;

console.log("questController.js - Objet questController défini.");