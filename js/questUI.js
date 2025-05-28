// js/questUI.js
console.log("questUI.js - Fichier chargé et en cours d'analyse...");

var questUI = {
    updateQuestDisplay: function() {
        // console.log("questUI: updateQuestDisplay CALLED");

        if (!window.activeQuestsListEl || !window.completedQuestsListEl || !gameState || !gameState.quests ||
            typeof window.QUEST_DATA === 'undefined' || typeof window.QUEST_STATUS === 'undefined' ||
            typeof window.itemsData === 'undefined' || typeof window.researchData === 'undefined' ||
            typeof window.WORLD_ZONES === 'undefined') { // S'assurer que c'est bien WORLD_ZONES ici
            console.warn("questUI.updateQuestDisplay: Éléments DOM ou données de quêtes/config manquants (Condition: WORLD_ZONES).");
             // Log de débogage pour identifier quelle dépendance manque précisément
            if (!window.activeQuestsListEl) console.warn("questUI: activeQuestsListEl manquant");
            if (!window.completedQuestsListEl) console.warn("questUI: completedQuestsListEl manquant");
            if (!gameState) console.warn("questUI: gameState manquant");
            else if (!gameState.quests) console.warn("questUI: gameState.quests manquant");
            if (typeof window.QUEST_DATA === 'undefined') console.warn("questUI: QUEST_DATA manquant");
            if (typeof window.QUEST_STATUS === 'undefined') console.warn("questUI: QUEST_STATUS manquant");
            if (typeof window.itemsData === 'undefined') console.warn("questUI: itemsData manquant");
            if (typeof window.researchData === 'undefined') console.warn("questUI: researchData manquant");
            if (typeof window.WORLD_ZONES === 'undefined') console.warn("questUI: WORLD_ZONES manquant");


            if (window.activeQuestsListEl) window.activeQuestsListEl.innerHTML = "<p class='text-red-500 italic'>Erreur chargement des quêtes.</p>";
            if (window.completedQuestsListEl) window.completedQuestsListEl.innerHTML = "<p class='text-red-500 italic'>Erreur chargement des quêtes terminées.</p>";
            return;
        }

        window.activeQuestsListEl.innerHTML = '';
        window.completedQuestsListEl.innerHTML = '';

        let hasActiveOrAvailableQuests = false;
        let hasCompletedQuests = false;

        const sortedQuestIds = Object.keys(window.QUEST_DATA).sort((a, b) => {
            const questA = window.QUEST_DATA[a];
            const questB = window.QUEST_DATA[b];
            const questTypeEnum = window.QUEST_TYPE || {};
            const typeOrderValue = { [questTypeEnum.TUTORIAL]:0, [questTypeEnum.MAIN_STORY]: 1, [questTypeEnum.SIDE_QUEST]: 2, [questTypeEnum.EVENT]: 3, [questTypeEnum.REPEATABLE]: 4 };
            const orderA = typeOrderValue[questA.type] ?? 5;
            const orderB = typeOrderValue[questB.type] ?? 5;
            if (orderA !== orderB) return orderA - orderB;
            return (questA.order || 0) - (questB.order || 0) || a.localeCompare(b);
        });

        for (const questId of sortedQuestIds) {
            const questDef = window.QUEST_DATA[questId];
            const questState = gameState.quests[questId];

            if (!questState || questState.status === window.QUEST_STATUS.LOCKED) continue;
            if (!questDef) {
                console.warn(`Aucune définition de quête trouvée pour l'ID ${questId} dans QUEST_DATA, mais présente dans gameState.`);
                continue;
            }

            const questDiv = document.createElement('div');
            const statusNameKey = Object.keys(window.QUEST_STATUS).find(key => window.QUEST_STATUS[key] === questState.status);
            const statusName = statusNameKey ? statusNameKey.toLowerCase() : 'unknown';
            questDiv.className = `quest-item quest-status-${statusName} p-3 rounded-md shadow`;

            let content = `<h4 class="font-semibold text-md mb-1 ${questState.status === window.QUEST_STATUS.ACTIVE ? 'text-yellow-300' : (questState.status === window.QUEST_STATUS.AVAILABLE ? 'text-blue-300' : 'text-gray-400')}">${questDef.title} <span class="text-xs text-gray-500">(${(questDef.type || 'Général').replace("_", " ")})</span></h4>`;
            content += `<p class="text-sm text-gray-400 mb-2">${questDef.description}</p>`;

            if (questState.status === window.QUEST_STATUS.ACTIVE || questState.status === window.QUEST_STATUS.AVAILABLE || questState.status === window.QUEST_STATUS.COMPLETED) {
                if (questDef.objectives && Array.isArray(questDef.objectives)) {
                    content += '<p class="text-xs font-semibold text-gray-300 mb-1">Objectifs:</p>';
                    content += '<ul class="objectives-list text-xs space-y-0.5 pl-5 list-disc">';
                    questDef.objectives.forEach((obj, index) => {
                        let progressText = "";
                        if (questState.status === window.QUEST_STATUS.ACTIVE) {
                            const currentProgress = questState.progress[`objective_${index}`] || 0;
                            if (obj.amount || obj.count) {
                                progressText = ` (${currentProgress}/${obj.amount || obj.count})`;
                            }
                        }
                        const completedClass = questState.objectivesCompleted && questState.objectivesCompleted[index] ? "completed" : "";
                        content += `<li class="${completedClass}">${obj.text}${progressText}</li>`;
                    });
                    content += '</ul>';
                }
            }

            if (questState.status === window.QUEST_STATUS.COMPLETED || questState.status === window.QUEST_STATUS.FINISHED) {
                if (questDef.rewards) {
                    content += '<p class="rewards mt-2 text-sm">Récompenses: ';
                    let rewardsText = [];
                    if (questDef.rewards.xp) rewardsText.push(`${questDef.rewards.xp} XP`);
                    if (questDef.rewards.resources) {
                        rewardsText.push(...Object.entries(questDef.rewards.resources).map(([res, val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`));
                    }
                    if (questDef.rewards.items && window.itemsData) {
                        rewardsText.push(...questDef.rewards.items.map(itemReward => {
                             const itemIdVal = typeof itemReward === 'string' ? itemReward : itemReward.itemId;
                             const quantity = typeof itemReward === 'string' ? '' : ` (x${itemReward.quantity || 1})`;
                             return `${(window.itemsData[itemIdVal]?.name || "Objet inconnu")}${quantity}`;
                        }));
                    }
                    if (questDef.rewards.unlocksQuest && window.QUEST_DATA && window.QUEST_DATA[questDef.rewards.unlocksQuest]) {
                        // rewardsText.push(`Débloque: ${window.QUEST_DATA[questDef.rewards.unlocksQuest].title}`);
                    }
                    if (questDef.rewards.unlocksBuilding && window.buildingsData && window.buildingsData[questDef.rewards.unlocksBuilding]) {
                        rewardsText.push(`Bâtiment: ${window.buildingsData[questDef.rewards.unlocksBuilding].name}`);
                    }
                    if (questDef.rewards.unlocksResearch && window.researchData && window.researchData[questDef.rewards.unlocksResearch]) {
                         rewardsText.push(`Recherche: ${window.researchData[questDef.rewards.unlocksResearch].name}`);
                    }
                    // Correction ici: utiliser window.WORLD_ZONES
                    if (questDef.rewards.unlocksZone && typeof window.WORLD_ZONES !== 'undefined' && window.WORLD_ZONES[questDef.rewards.unlocksZone]) {
                        rewardsText.push(`Zone: ${window.WORLD_ZONES[questDef.rewards.unlocksZone].name}`);
                    } else if (questDef.rewards.unlocksZone) {
                         // Si window.WORLD_ZONES est indéfini, on ne peut pas afficher le nom.
                        rewardsText.push(`Zone: ${questDef.rewards.unlocksZone} (données WORLD_ZONES non disponibles)`);
                    }
                    content += rewardsText.length > 0 ? rewardsText.join(', ') : "Aucune récompense spécifique." + '</p>';
                }
            }
            questDiv.innerHTML = content;

            if (questState.status === window.QUEST_STATUS.AVAILABLE) {
                hasActiveOrAvailableQuests = true;
                const activateButton = document.createElement('button');
                activateButton.className = 'btn btn-success btn-xs mt-3';
                activateButton.textContent = "Commencer la Quête";
                activateButton.onclick = () => {
                    if (typeof window.questController !== 'undefined' && typeof window.questController.activateQuest === 'function') {
                        window.questController.activateQuest(questId);
                    } else { console.error("questController.activateQuest non défini.");}
                };
                questDiv.appendChild(activateButton);
                window.activeQuestsListEl.appendChild(questDiv);
            } else if (questState.status === window.QUEST_STATUS.ACTIVE) {
                hasActiveOrAvailableQuests = true;
                window.activeQuestsListEl.appendChild(questDiv);
            } else if (questState.status === window.QUEST_STATUS.COMPLETED || questState.status === window.QUEST_STATUS.FINISHED) {
                hasCompletedQuests = true;
                window.completedQuestsListEl.appendChild(questDiv);
            }
        }

        if (!window.activeQuestsListEl.querySelector('h3.font-orbitron')) {
            window.activeQuestsListEl.insertAdjacentHTML('afterbegin', '<h3 class="font-orbitron text-md text-yellow-300 mb-1">Actives & Disponibles</h3>');
        }
        if (!hasActiveOrAvailableQuests) {
            if (window.activeQuestsListEl.children.length <= 1) { // <=1 car le h3 compte pour 1
                 window.activeQuestsListEl.insertAdjacentHTML('beforeend', '<p class="text-gray-500 italic text-xs">Aucune quête active ou disponible pour le moment.</p>');
            }
        }

        if (!window.completedQuestsListEl.querySelector('h3.font-orbitron')) {
            window.completedQuestsListEl.insertAdjacentHTML('afterbegin', '<h3 class="font-orbitron text-md text-gray-500 mb-1">Terminées</h3>');
        }
        if (!hasCompletedQuests) {
             if (window.completedQuestsListEl.children.length <= 1) { // <=1 car le h3 compte pour 1
                window.completedQuestsListEl.insertAdjacentHTML('beforeend', '<p class="text-gray-500 italic text-xs">Aucune quête terminée.</p>');
            }
        }
    }
};
window.questUI = questUI;

console.log("questUI.js - Objet questUI défini.");