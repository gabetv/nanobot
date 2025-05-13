// js/questUI.js
console.log("questUI.js - Fichier chargé et en cours d'analyse...");

var questUI = {
    updateQuestDisplay: function() {
        console.log("questUI: updateQuestDisplay CALLED");
        if (!activeQuestsListEl || !completedQuestsListEl || !gameState || !gameState.quests || typeof QUEST_DATA === 'undefined' || typeof QUEST_STATUS === 'undefined' || typeof itemsData === 'undefined' || typeof researchData === 'undefined' || typeof ZONE_DATA === 'undefined') {
            console.warn("questUI.updateQuestDisplay: Éléments DOM ou données de quêtes/config manquants.");
            if (activeQuestsListEl) activeQuestsListEl.innerHTML = "<p class='text-red-500 italic'>Erreur chargement des quêtes.</p>";
            if (completedQuestsListEl) completedQuestsListEl.innerHTML = "<p class='text-red-500 italic'>Erreur chargement des quêtes terminées.</p>";
            return;
        }

        activeQuestsListEl.innerHTML = '';
        completedQuestsListEl.innerHTML = '';

        let hasActiveOrAvailableQuests = false;
        let hasCompletedQuests = false;

        const sortedQuestIds = Object.keys(QUEST_DATA).sort((a, b) => {
            const questA = QUEST_DATA[a];
            const questB = QUEST_DATA[b];
            const typeOrder = { "main": 0, "exploration": 1, "combat": 2, "building": 3, "side": 4 };
            const orderA = typeOrder[questA.type] ?? 5;
            const orderB = typeOrder[questB.type] ?? 5;
            if (orderA !== orderB) return orderA - orderB;
            return a.localeCompare(b);
        });

        for (const questId of sortedQuestIds) {
            const questDef = QUEST_DATA[questId];
            const questState = gameState.quests[questId];

            if (!questState || questState.status === QUEST_STATUS.LOCKED) continue;

            const questDiv = document.createElement('div');
            const statusName = Object.keys(QUEST_STATUS).find(key => QUEST_STATUS[key] === questState.status) || 'UNKNOWN';
            questDiv.className = `quest-item quest-status-${statusName} p-4 rounded-md shadow-md`; // Ajout de padding/shadow ici

            let content = `<h4 class="font-semibold text-lg mb-1 ${questState.status === QUEST_STATUS.ACTIVE ? 'text-yellow-300' : (questState.status === QUEST_STATUS.AVAILABLE ? 'text-blue-300' : 'text-gray-400')}">${questDef.title} <span class="text-xs text-gray-500">(${questDef.type})</span></h4>`;
            content += `<p class="text-sm text-gray-400 mb-2">${questDef.description}</p>`;

            if (questState.status === QUEST_STATUS.ACTIVE || questState.status === QUEST_STATUS.AVAILABLE || questState.status === QUEST_STATUS.COMPLETED) {
                content += '<p class="text-xs font-semibold text-gray-300 mb-1">Objectifs:</p>';
                content += '<ul class="objectives-list text-xs space-y-1 pl-5 list-disc">'; // list-disc pour des puces
                questDef.objectives.forEach((obj, index) => {
                    let progressText = "";
                    if (questState.status === QUEST_STATUS.ACTIVE) {
                        const currentProgress = questState.progress[`objective_${index}`] || 0;
                        if (obj.amount || obj.count) {
                            progressText = ` (${currentProgress}/${obj.amount || obj.count})`;
                        }
                    }
                    const completedClass = questState.objectivesCompleted[index] ? "completed" : "";
                    content += `<li class="${completedClass}">${obj.text}${progressText}</li>`;
                });
                content += '</ul>';
            }

            if (questState.status === QUEST_STATUS.COMPLETED || questState.status === QUEST_STATUS.FINISHED) {
                if (questDef.rewards) {
                    content += '<p class="rewards mt-2 text-sm">Récompenses: ';
                    let rewardsText = [];
                    if (questDef.rewards.xp) rewardsText.push(`${questDef.rewards.xp} XP`);
                    if (questDef.rewards.resources) {
                        rewardsText.push(...Object.entries(questDef.rewards.resources).map(([res, val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`));
                    }
                    if (questDef.rewards.items) {
                        rewardsText.push(...questDef.rewards.items.map(itemId => itemsData[itemId]?.name || "Objet inconnu"));
                    }
                    if (questDef.rewards.unlocks) {
                        if(questDef.rewards.unlocks.research && researchData[questDef.rewards.unlocks.research]) rewardsText.push(`Recherche: ${researchData[questDef.rewards.unlocks.research]?.name}`);
                        if(questDef.rewards.unlocks.zone && ZONE_DATA[questDef.rewards.unlocks.zone]) rewardsText.push(`Zone: ${ZONE_DATA[questDef.rewards.unlocks.zone]?.name}`);
                    }
                    content += rewardsText.join(', ') + '</p>';
                }
            }
            questDiv.innerHTML = content;

            if (questState.status === QUEST_STATUS.AVAILABLE) {
                hasActiveOrAvailableQuests = true;
                const activateButton = document.createElement('button');
                activateButton.className = 'btn btn-success btn-xs mt-3';
                activateButton.textContent = "Commencer la Quête";
                activateButton.onclick = () => {
                    if (typeof questController !== 'undefined' && typeof questController.activateQuest === 'function') {
                        questController.activateQuest(questId);
                    } else { console.error("questController.activateQuest non défini.");}
                };
                questDiv.appendChild(activateButton);
                activeQuestsListEl.appendChild(questDiv);
            } else if (questState.status === QUEST_STATUS.ACTIVE) {
                hasActiveOrAvailableQuests = true;
                activeQuestsListEl.appendChild(questDiv);
            } else if (questState.status === QUEST_STATUS.COMPLETED || questState.status === QUEST_STATUS.FINISHED) {
                hasCompletedQuests = true;
                completedQuestsListEl.appendChild(questDiv);
            }
        }

        if (!hasActiveOrAvailableQuests) {
            activeQuestsListEl.innerHTML = '<h3 class="font-orbitron text-lg text-yellow-300 mb-2">Quêtes Actives & Disponibles</h3><p class="text-gray-500 italic">Aucune quête active ou disponible pour le moment.</p>';
        } else {
             // S'assurer que le titre est présent
            if (!activeQuestsListEl.querySelector('h3')) {
                activeQuestsListEl.insertAdjacentHTML('afterbegin', '<h3 class="font-orbitron text-lg text-yellow-300 mb-2">Quêtes Actives & Disponibles</h3>');
            }
        }
        if (!hasCompletedQuests) {
            completedQuestsListEl.innerHTML = '<h3 class="font-orbitron text-lg text-gray-500 mb-2">Quêtes Terminées</h3><p class="text-gray-500 italic">Aucune quête terminée.</p>';
        } else {
            if (!completedQuestsListEl.querySelector('h3')) {
                completedQuestsListEl.insertAdjacentHTML('afterbegin', '<h3 class="font-orbitron text-lg text-gray-500 mb-2">Quêtes Terminées</h3>');
            }
        }
    }
};

console.log("questUI.js - Objet questUI défini.");