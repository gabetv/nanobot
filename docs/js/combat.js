// js/combat.js
console.log("combat.js - VERIFICATION SYNTAXE");

// --- Variables spécifiques à l'état du combat en cours ---
let currentCombatInstance = null;

// --- Fonctions principales de gestion du combat ---

/**
 * Initialise et affiche l'interface utilisateur du combat.
 * @param {object} nanobotCombatStats - Les statistiques de combat actuelles du nanobot.
 * @param {object} enemyData - Les données complètes de l'ennemi.
 */
function initializeCombatUI(nanobotCombatStats, enemyData) {
    if (!window.combatModalEl || !window.combatTurnIndicatorEl || !window.combatNanobotSpriteEl || !window.combatNanobotHealthbarEl ||
        !window.combatEnemyNameEl || !window.combatEnemySpriteEl || !window.combatEnemyHealthbarEl || !window.combatActionsContainerEl ||
        !window.combatNanobotRageEl || !window.combatNanobotGlobalEnergyEl || !window.combatLogVisualEl) {
        console.error("Éléments UI de combat manquants ! Impossible d'initialiser l'UI.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur critique: Interface de combat non trouvée.", "error", "event");
        return;
    }

    // Nanobot UI
    if (window.nanobotVisualBody && window.nanobotVisualBody.innerHTML) {
        window.combatNanobotSpriteEl.innerHTML = '';
        const nanobotVisualClone = window.nanobotVisualBody.cloneNode(true);
        nanobotVisualClone.style.width = '100%'; nanobotVisualClone.style.height = '100%';
        nanobotVisualClone.style.transform = 'scale(0.75) translateY(-5px)'; // Ajuster pour mieux fitter
        window.combatNanobotSpriteEl.appendChild(nanobotVisualClone);
    } else {
         window.combatNanobotSpriteEl.style.backgroundColor = 'var(--accent-blue)'; // Fallback
    }

    updateCombatHealthBar('nanobot', nanobotCombatStats.currentHealth, nanobotCombatStats.health);
    window.combatNanobotRageEl.textContent = currentCombatInstance.nanobot.rage || 0;
    // Accéder à gameState via window pour l'énergie globale
    window.combatNanobotGlobalEnergyEl.textContent = window.gameState?.resources?.energy || 0;


    // Ennemi UI
    window.combatEnemyNameEl.textContent = enemyData.name;
    window.combatEnemySpriteEl.style.backgroundImage = `url('${enemyData.spritePath || 'https://placehold.co/80x100/cc0000/ffffff?text=ENNEMI'}')`; // Fallback image
    if(!enemyData.spritePath && enemyData.color) window.combatEnemySpriteEl.style.backgroundColor = enemyData.color;
    updateCombatHealthBar('enemy', currentCombatInstance.enemy.currentHealth, enemyData.maxHealth || enemyData.health);

    renderCombatActions(); // Appelé ici pour s'assurer qu'il est mis à jour avant l'affichage
    window.combatTurnIndicatorEl.textContent = currentCombatInstance.turn === 'nanobot' ? "Tour de Nexus-7" : `Tour de ${enemyData.name}`;


    const arenaEl = document.querySelector('.combat-arena'); // Pas besoin de window. pour querySelector
    if (arenaEl) {
        arenaEl.className = 'combat-arena'; // Reset classes
        if (currentCombatInstance.arenaBackground && currentCombatInstance.arenaBackground !== 'default') {
            arenaEl.classList.add(`combat-arena-${currentCombatInstance.arenaBackground}`);
        } else {
            arenaEl.classList.add('combat-arena-default');
        }
    }

    window.combatModalEl.classList.remove('hidden');
    isGamePaused = true; // isGamePaused est global (défini dans main.js)
}
window.initializeCombatUI = initializeCombatUI;

function startCombat(enemyDataInput, arenaStyle = 'default') {
    if (!window.gameState || !window.gameState.nanobotStats) {
        console.error("startCombat: gameState ou nanobotStats non défini.");
        if(typeof addLogEntry === 'function') addLogEntry("Impossible de démarrer le combat: données du Nanobot manquantes.", "error", "event");
        return;
    }
     if (!enemyDataInput || !enemyDataInput.id) {
        console.error("startCombat: enemyDataInput invalide ou ID manquant.");
        if(typeof addLogEntry === 'function') addLogEntry("Impossible de démarrer le combat: données de l'ennemi invalides.", "error", "event");
        return;
    }

    // S'assurer que enemyData (la config globale) est disponible
    const globalEnemyData = window.enemyData || window.explorationEnemyData; // explorationEnemyData si c'est celui qui contient les détails
    if (!globalEnemyData) {
        console.error("startCombat: Configuration globale enemyData/explorationEnemyData non trouvée.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur config: Données ennemis manquantes.", "error", "event");
        return;
    }
    const enemyBaseData = globalEnemyData[enemyDataInput.id];
    if (!enemyBaseData) {
        console.error(`startCombat: Données de base pour l'ennemi ID ${enemyDataInput.id} non trouvées dans la config globale.`);
        if(typeof addLogEntry === 'function') addLogEntry(`Impossible de démarrer le combat contre ${enemyDataInput.id}: données ennemi inconnues.`, "error", "event");
        return;
    }
    // Fusionner les données d'entrée (pour stats modifiées) avec les données de base
    const enemyDataForCombat = { ...enemyBaseData, ...enemyDataInput };


    if (window.combatLogVisualEl) window.combatLogVisualEl.innerHTML = '';
    if (window.combatLogDetailsContainerEl) window.combatLogDetailsContainerEl.open = false;

    const nanobotCombatStats = JSON.parse(JSON.stringify(window.gameState.nanobotStats));
    nanobotCombatStats.currentHealth = nanobotCombatStats.currentHealth > 0 ? nanobotCombatStats.currentHealth : nanobotCombatStats.health;

    currentCombatInstance = {
        nanobot: {
            stats: nanobotCombatStats,
            currentHealth: nanobotCombatStats.currentHealth,
            rage: 0, effects: []
        },
        enemy: {
            data: enemyDataForCombat, // Utiliser les données fusionnées
            currentHealth: enemyDataForCombat.currentHealth || enemyDataForCombat.maxHealth || enemyDataForCombat.health, // Priorité si currentHealth est passé
            effects: []
        },
        turn: 'nanobot', round: 1, isCombatOver: false,
        playerTurnActionTaken: false, arenaBackground: arenaStyle, combatLog: []
    };

    // Réinitialiser les cooldowns des skills du nanobot au début du combat
    if (window.gameState && window.gameState.nanobotSkills) {
        for (const skillId in window.gameState.nanobotSkills) {
            window.gameState.nanobotSkills[skillId].cooldownRemaining = 0;
        }
    }


    if (enemyDataForCombat.speed && nanobotCombatStats.speed < enemyDataForCombat.speed) {
        currentCombatInstance.turn = 'enemy';
    }

    if(typeof addLogEntry === 'function') addLogEntry(`Combat engagé contre ${enemyDataForCombat.name} !`, "system", "combat", currentCombatInstance.combatLog);
    initializeCombatUI(currentCombatInstance.nanobot.stats, currentCombatInstance.enemy.data);

    if (currentCombatInstance.turn === 'enemy') {
        setTimeout(processEnemyTurn, 1000);
    }
}
window.startCombat = startCombat;

function simulateCombat(enemyDetailsInput) {
    console.log("Combat: simulateCombat appelé avec:", JSON.parse(JSON.stringify(enemyDetailsInput)));
    if (!window.gameState || !window.gameState.nanobotStats) {
        console.error("ERREUR FATALE DANS simulateCombat: gameState ou nanobotStats non défini.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur critique: Données Nanobot manquantes pour simulateCombat.", "error", "event");
        return Promise.resolve({ outcome: "error", message: "Nanobot data missing" }); // Retourner une promesse résolue avec erreur
    }
     if (!enemyDetailsInput || !enemyDetailsInput.id) { // ID est crucial pour retrouver les data de base
        console.error("ERREUR FATALE DANS simulateCombat: enemyDetailsInput invalide ou ID manquant.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur critique: Données ennemi invalides pour simulateCombat.", "error", "event");
        return Promise.resolve({ outcome: "error", message: "Enemy data invalid" });
    }

    // S'assurer que la config globale des ennemis est chargée
    const globalEnemyData = window.enemyData || window.explorationEnemyData;
    if (!globalEnemyData || !globalEnemyData[enemyDetailsInput.id]) {
        console.error(`simulateCombat: Données de base pour l'ennemi ID ${enemyDetailsInput.id} non trouvées.`);
         if(typeof addLogEntry === 'function') addLogEntry(`Erreur config pour simulation: ${enemyDetailsInput.id}.`, "error", "event");
        return Promise.resolve({ outcome: "error", message: `Base data for ${enemyDetailsInput.id} missing` });
    }

    // Créer un objet complet pour l'ennemi, en fusionnant les détails passés avec ceux de la config.
    // Les détails passés (comme currentHealth) peuvent surcharger ceux de la config.
    const enemyForSimulation = {
        ...globalEnemyData[enemyDetailsInput.id], // Base stats from config
        ...enemyDetailsInput // Overrides from input (e.g., currentHealth for an already damaged enemy)
    };
    // S'assurer que les stats minimales sont là
    enemyForSimulation.name = enemyForSimulation.name || "Ennemi Inconnu";
    enemyForSimulation.health = enemyForSimulation.health || 50;
    enemyForSimulation.maxHealth = enemyForSimulation.maxHealth || enemyForSimulation.health;
    enemyForSimulation.currentHealth = enemyDetailsInput.currentHealth || enemyForSimulation.maxHealth; // Important pour les simulations
    enemyForSimulation.attack = enemyForSimulation.attack || 10;
    enemyForSimulation.defense = enemyForSimulation.defense || 5;
    enemyForSimulation.speed = enemyForSimulation.speed || 5;
    enemyForSimulation.spritePath = enemyForSimulation.spritePath || 'https://placehold.co/80x100/ff0000/ffffff?text=SIM';
    enemyForSimulation.damageType = enemyForSimulation.damageType || (typeof window.DAMAGE_TYPES !== 'undefined' ? window.DAMAGE_TYPES.KINETIC : 'kinetic');


    if(typeof addLogEntry === 'function') addLogEntry(`Simulation de combat lancée contre ${enemyForSimulation.name}.`, "system", "event");
    
    // `startCombat` est synchrone et met en place l'UI. La promesse sera pour le résultat du combat.
    startCombat(enemyForSimulation, 'default');

    // Retourner une promesse qui se résoudra avec le résultat du combat
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (currentCombatInstance && currentCombatInstance.isCombatOver) {
                clearInterval(checkInterval);
                const nanobotWon = currentCombatInstance.nanobot.currentHealth > 0;
                // Mettre à jour gameState.nanobotStats.currentHealth APRÈS que le combat soit résolu
                window.gameState.nanobotStats.currentHealth = currentCombatInstance.nanobot.currentHealth;
                if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateNanobotDisplay === 'function') {
                    window.uiUpdates.updateNanobotDisplay();
                }
                resolve({
                    outcome: nanobotWon ? "victory" : "defeat",
                    enemyDefeated: nanobotWon, // Si le nanobot gagne, l'ennemi est vaincu
                    nanobotHealth: currentCombatInstance.nanobot.currentHealth,
                    enemyRemainingHealth: currentCombatInstance.enemy.currentHealth,
                    message: nanobotWon ? `${enemyForSimulation.name} vaincu.` : `Nexus-7 vaincu par ${enemyForSimulation.name}.`
                });
            } else if (!currentCombatInstance) { // Si startCombat a échoué et currentCombatInstance est null
                clearInterval(checkInterval);
                resolve({ outcome: "error", message: "Combat instance failed to initialize." });
            }
        }, 100); // Vérifier toutes les 100ms
    });
}
window.simulateCombat = simulateCombat;


function updateCombatHealthBar(target, currentHealth, maxHealth) {
    const healthBarEl = target === 'nanobot' ? window.combatNanobotHealthbarEl : window.combatEnemyHealthbarEl;
    if (!healthBarEl) return;
    const percentage = maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0;
    healthBarEl.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    healthBarEl.classList.remove('low', 'medium', 'bg-red-500', 'bg-yellow-500', 'bg-green-500');
    if (percentage < 30) { healthBarEl.classList.add('low'); healthBarEl.classList.add('bg-red-500'); }
    else if (percentage < 60) { healthBarEl.classList.add('medium'); healthBarEl.classList.add('bg-yellow-500'); }
    else { healthBarEl.classList.add('bg-green-500');}
}
window.updateCombatHealthBar = updateCombatHealthBar;

function renderCombatActions() {
    if (!window.combatActionsContainerEl || !currentCombatInstance) return;
    window.combatActionsContainerEl.innerHTML = ''; // Vider les anciennes actions

    // Bouton Attaque de base
    const attackButton = document.createElement('button');
    attackButton.className = 'btn btn-danger';
    attackButton.textContent = 'Attaquer';
    attackButton.onclick = () => handleCombatAction('attack');
    attackButton.disabled = currentCombatInstance.playerTurnActionTaken; // Désactiver si action déjà prise
    window.combatActionsContainerEl.appendChild(attackButton);

    // Affichage des Skills
    if (gameState && gameState.nanobotSkills && typeof window.NANOBOT_SKILLS_CONFIG !== 'undefined') {
        for (const skillId in gameState.nanobotSkills) {
            const skillRuntimeData = gameState.nanobotSkills[skillId]; // { cooldownRemaining: X }
            const skillConfig = window.NANOBOT_SKILLS_CONFIG[skillId];

            if (skillConfig) {
                const skillButton = document.createElement('button');
                skillButton.className = 'btn btn-info skill-button'; // Classe générique pour skills
                skillButton.dataset.skillId = skillId;
                
                let buttonText = skillConfig.name;
                let canUseSkill = true;
                let reasonDisabled = "";

                // Vérifier Cooldown
                if (skillRuntimeData.cooldownRemaining > 0) {
                    buttonText += ` (CD: ${skillRuntimeData.cooldownRemaining}t)`;
                    canUseSkill = false;
                    reasonDisabled = `En recharge (${skillRuntimeData.cooldownRemaining} tours).`;
                    skillButton.classList.add('on-cooldown');
                }

                // Vérifier Coût
                if (canUseSkill && skillConfig.cost) {
                    let costString = "";
                    if (skillConfig.cost.rage && (currentCombatInstance.nanobot.rage || 0) < skillConfig.cost.rage) {
                        canUseSkill = false;
                        reasonDisabled = "Rage insuffisante.";
                        skillButton.classList.add('insufficient-resources');
                    }
                    if (skillConfig.cost.energy && (gameState.resources.energy || 0) < skillConfig.cost.energy) {
                        canUseSkill = false;
                        reasonDisabled = "Énergie insuffisante.";
                        skillButton.classList.add('insufficient-resources');
                    }
                    costString = Object.entries(skillConfig.cost)
                                     .map(([res,val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`)
                                     .join('/');
                    if (costString) buttonText += ` (${costString})`;
                }

                skillButton.textContent = buttonText;
                skillButton.disabled = !canUseSkill || currentCombatInstance.playerTurnActionTaken;
                if (reasonDisabled) skillButton.title = reasonDisabled;
                
                skillButton.onclick = () => handleCombatAction('skill', skillId);
                window.combatActionsContainerEl.appendChild(skillButton);
            }
        }
    }
    // Désactiver tous les boutons si une action a déjà été prise ce tour-ci
    if (currentCombatInstance.playerTurnActionTaken) {
        window.combatActionsContainerEl.querySelectorAll('button').forEach(btn => btn.disabled = true);
    }
}
window.renderCombatActions = renderCombatActions;

function handleCombatAction(actionType, skillId = null) {
    if (!currentCombatInstance || currentCombatInstance.isCombatOver || currentCombatInstance.turn !== 'nanobot' || currentCombatInstance.playerTurnActionTaken) {
        return;
    }
    currentCombatInstance.playerTurnActionTaken = true;

    const nanobotCombat = currentCombatInstance.nanobot;
    const enemyCombat = currentCombatInstance.enemy;

    if (actionType === 'attack') {
        const nanobotStats = nanobotCombat.stats;
        const enemy = enemyCombat;
        let damage = Math.max(1, (nanobotStats.attack || 5) - (enemy.data.defense || 0));

        if(typeof addLogEntry === 'function') addLogEntry(`Nexus-7 attaque ${enemy.data.name} et inflige ${damage} dégâts.`, "combat", "combat", currentCombatInstance.combatLog);
        enemy.currentHealth -= damage;
        if(typeof createDamageFloat === 'function') createDamageFloat(damage, 'enemy'); 
        updateCombatHealthBar('enemy', enemy.currentHealth, enemy.data.maxHealth || enemy.data.health);

        nanobotCombat.rage = Math.min((nanobotCombat.rage || 0) + 5, 100);
        if(window.combatNanobotRageEl) window.combatNanobotRageEl.textContent = nanobotCombat.rage;

    } else if (actionType === 'skill' && skillId && typeof window.NANOBOT_SKILLS_CONFIG !== 'undefined') {
        const skillConfig = window.NANOBOT_SKILLS_CONFIG[skillId];
        const skillRuntime = gameState.nanobotSkills[skillId];

        if (!skillConfig || !skillRuntime || skillRuntime.cooldownRemaining > 0) {
            if(typeof addLogEntry === 'function') addLogEntry("Capacité non prête ou inconnue.", "warning", "combat", currentCombatInstance.combatLog);
            currentCombatInstance.playerTurnActionTaken = false; // Annuler l'action car elle a échoué
            renderCombatActions(); // Rafraîchir pour réactiver les boutons
            return;
        }

        // Payer le coût
        let canAfford = true;
        let tempPaidRage = 0;
        let tempPaidEnergy = 0;

        if (skillConfig.cost) {
            if (skillConfig.cost.rage) {
                if ((nanobotCombat.rage || 0) < skillConfig.cost.rage) canAfford = false;
                else tempPaidRage = skillConfig.cost.rage;
            }
            if (canAfford && skillConfig.cost.energy) { // Vérifier l'énergie seulement si la rage est suffisante
                if ((gameState.resources.energy || 0) < skillConfig.cost.energy) canAfford = false;
                else tempPaidEnergy = skillConfig.cost.energy;
            }
        }

        if (!canAfford) {
            if(typeof addLogEntry === 'function') addLogEntry(`Ressources insuffisantes pour ${skillConfig.name}.`, "error", "combat", currentCombatInstance.combatLog);
            currentCombatInstance.playerTurnActionTaken = false; 
            renderCombatActions();
            return;
        }
        
        // Déduire les coûts si afford
        if (tempPaidRage > 0) nanobotCombat.rage -= tempPaidRage;
        if (tempPaidEnergy > 0) gameState.resources.energy -= tempPaidEnergy;
        
        if(typeof addLogEntry === 'function') addLogEntry(`Nexus-7 utilise ${skillConfig.name}!`, "success", "combat", currentCombatInstance.combatLog);
        skillRuntime.cooldownRemaining = skillConfig.cooldown || 0; 

        // Appliquer les effets du skill
        if (skillConfig.type === "active_damage" && skillConfig.target === "enemy") {
            let damage = skillConfig.baseDamage || 0; // Utiliser baseDamage pour les skills
            damage = Math.max(1, damage - (enemyCombat.data.defense || 0));
            enemyCombat.currentHealth -= damage;
            if(typeof addLogEntry === 'function') addLogEntry(`${skillConfig.name} inflige ${damage} dégâts ${skillConfig.damageType || ''} à ${enemyCombat.data.name}.`, "combat", "combat", currentCombatInstance.combatLog);
            if(typeof createDamageFloat === 'function') createDamageFloat(damage, 'enemy');
            updateCombatHealthBar('enemy', enemyCombat.currentHealth, enemyCombat.data.maxHealth || enemyCombat.data.health);
        } else if (skillConfig.type === "active_heal" && skillConfig.target === "self") {
            const heal = skillConfig.healAmount || 0;
            nanobotCombat.currentHealth = Math.min(nanobotCombat.stats.health, nanobotCombat.currentHealth + heal);
             if(typeof addLogEntry === 'function') addLogEntry(`${skillConfig.name} restaure ${heal} PV à Nexus-7.`, "combat", "combat", currentCombatInstance.combatLog);
            if(typeof createDamageFloat === 'function') createDamageFloat(heal, 'nanobot', false, true);
            updateCombatHealthBar('nanobot', nanobotCombat.currentHealth, nanobotCombat.stats.health);
        }
        
        if(window.combatNanobotRageEl) window.combatNanobotRageEl.textContent = nanobotCombat.rage;
        if(window.combatNanobotGlobalEnergyEl) window.combatNanobotGlobalEnergyEl.textContent = gameState.resources.energy;
        if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateResourceDisplay === 'function') window.uiUpdates.updateResourceDisplay();
    }

    // Mettre à jour les cooldowns des autres skills (ceux non utilisés ce tour mais qui étaient en CD)
    // Cela est géré à la fin du tour de l'ennemi pour tous les skills.

    checkCombatStatus();
    if (!currentCombatInstance.isCombatOver) {
        currentCombatInstance.turn = 'enemy';
        if(window.combatTurnIndicatorEl) window.combatTurnIndicatorEl.textContent = `Tour de ${currentCombatInstance.enemy.data.name}`;
        renderCombatActions(); // Désactiver les boutons du joueur pendant le tour de l'ennemi
        setTimeout(processEnemyTurn, 1000);
    } else {
        renderCombatActions(); // S'assurer que les boutons sont désactivés si le combat se termine
    }
}
window.handleCombatAction = handleCombatAction;

function processEnemyTurn() {
    if (!currentCombatInstance || currentCombatInstance.isCombatOver || currentCombatInstance.turn !== 'enemy') {
        return;
    }
    if(window.combatTurnIndicatorEl) window.combatTurnIndicatorEl.textContent = `Tour de ${currentCombatInstance.enemy.data.name}`;

    const enemyData = currentCombatInstance.enemy.data;
    const nanobot = currentCombatInstance.nanobot;
    let damage = Math.max(1, (enemyData.attack || 5) - (nanobot.stats.defense || 0));

    if(typeof addLogEntry === 'function') addLogEntry(`${enemyData.name} attaque Nexus-7 et inflige ${damage} dégâts.`, "combat", "combat", currentCombatInstance.combatLog);
    nanobot.currentHealth -= damage;
    if(typeof createDamageFloat === 'function') createDamageFloat(damage, 'nanobot'); 
    updateCombatHealthBar('nanobot', nanobot.currentHealth, nanobot.stats.health);

    checkCombatStatus();
    if (!currentCombatInstance.isCombatOver) {
        currentCombatInstance.turn = 'nanobot';
        currentCombatInstance.playerTurnActionTaken = false;
        currentCombatInstance.round++;

        // Réduire les cooldowns du nanobot à la fin du tour de l'ennemi
        if (gameState && gameState.nanobotSkills) {
            for (const skillId in gameState.nanobotSkills) {
                if (gameState.nanobotSkills[skillId].cooldownRemaining > 0) {
                    gameState.nanobotSkills[skillId].cooldownRemaining--;
                }
            }
        }
        // TODO: Gérer les cooldowns des skills ennemis s'ils en ont

        if(window.combatTurnIndicatorEl) window.combatTurnIndicatorEl.textContent = "Tour de Nexus-7";
        renderCombatActions(); // IMPORTANT: Appeler pour rafraîchir les boutons (et leur état disabled/cooldown)
    } else {
        renderCombatActions(); // S'assurer que les boutons sont désactivés si le combat se termine
    }
}
window.processEnemyTurn = processEnemyTurn;

function checkCombatStatus() {
    if (!currentCombatInstance || currentCombatInstance.isCombatOver) return;
    const nanobotHealth = currentCombatInstance.nanobot.currentHealth;
    const enemyHealth = currentCombatInstance.enemy.currentHealth;

    if (enemyHealth <= 0) {
        currentCombatInstance.isCombatOver = true;
        if(typeof addLogEntry === 'function') addLogEntry(`${currentCombatInstance.enemy.data.name} a été vaincu !`, "success", "combat", currentCombatInstance.combatLog);
        setTimeout(() => endCombat(true), 1500);
    } else if (nanobotHealth <= 0) {
        currentCombatInstance.isCombatOver = true;
        if(typeof addLogEntry === 'function') addLogEntry("Nexus-7 a été mis hors de combat !", "error", "combat", currentCombatInstance.combatLog);
        setTimeout(() => endCombat(false), 1500);
    }
}
window.checkCombatStatus = checkCombatStatus;

function endCombat(nanobotWon) {
    if (!currentCombatInstance) return;
    if (window.combatModalEl) window.combatModalEl.classList.add('hidden');
    isGamePaused = false;

    // Mettre à jour la vie du nanobot DANS gameState
    if (window.gameState && window.gameState.nanobotStats) {
        window.gameState.nanobotStats.currentHealth = currentCombatInstance.nanobot.currentHealth;
    }


    if (nanobotWon) {
        const enemy = currentCombatInstance.enemy.data;
        let rewardsMessage = `Vous avez vaincu ${enemy.name}.<br>`;
        let xpGained = enemy.xpValue || 0;
        let lootObtained = []; // TODO: Implémenter la logique de loot

        if (typeof gainXP === 'function' && window.gameState) { // gainXP est global
            const levelUpDetails = gainXP(xpGained); // gainXP modifie gameState.nanobotStats
            rewardsMessage += `XP gagnée: ${xpGained}.<br>`;
            if (levelUpDetails && levelUpDetails.leveledUp) { // Vérifier que levelUpDetails est retourné
                rewardsMessage += `<span class="text-yellow-300">Niveau Supérieur ! Nexus-7 est maintenant niveau ${levelUpDetails.newLevel}.</span><br>`;
            }
        }
        showCombatEndModal(true, rewardsMessage, xpGained, lootObtained);
    } else {
        // Si le nanobot perd, sa vie dans gameState est déjà mise à jour (potentiellement à 0 ou 1)
        if (window.gameState && window.gameState.nanobotStats && window.gameState.nanobotStats.currentHealth <= 0) {
             window.gameState.nanobotStats.currentHealth = 1; // Le nanobot survit avec 1 PV
        }
        if(typeof addLogEntry === 'function') addLogEntry("Le combat est perdu. Nexus-7 est sévèrement endommagé.", "error", "event");
        showCombatEndModal(false, "Vous avez été vaincu...", 0, []);
    }

    if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateNanobotDisplay === 'function') {
        window.uiUpdates.updateNanobotDisplay();
    }
    currentCombatInstance = null;
}
window.endCombat = endCombat;

function showCombatEndModal(victory, message, xp, loot) {
    if (!window.combatEndModalEl || !window.combatEndTitleEl || !window.combatEndRewardsEl || !window.xpGainEl || !window.combatXpBarEl || !window.lootListEl) {
        console.error("Éléments de la modale de fin de combat non trouvés.");
        if(typeof addLogEntry === 'function') addLogEntry(message, victory ? "success" : "error", "event");
        return;
    }
    window.combatEndTitleEl.textContent = victory ? "Victoire !" : "Défaite...";
    window.combatEndRewardsEl.innerHTML = message;
    
    if (window.gameState && window.gameState.nanobotStats) {
        window.xpGainEl.textContent = `XP: ${Math.floor(window.gameState.nanobotStats.xp)} / ${window.gameState.nanobotStats.xpToNext === Infinity ? 'MAX' : window.gameState.nanobotStats.xpToNext}`;
        const xpToNextForBar = window.gameState.nanobotStats.xpToNext > 0 && window.gameState.nanobotStats.xpToNext !== Infinity ? window.gameState.nanobotStats.xpToNext : 1;
        const xpPercent = (window.gameState.nanobotStats.xp / xpToNextForBar) * 100;
        window.combatXpBarEl.style.width = `${Math.min(100, Math.max(0, xpPercent))}%`;
    }


    window.lootListEl.innerHTML = '';
    if (loot && loot.length > 0 && window.itemsData) {
        loot.forEach(itemId => {
            const item = window.itemsData[itemId];
            const li = document.createElement('li');
            li.textContent = item ? item.name : itemId;
            window.lootListEl.appendChild(li);
        });
    } else {
        window.lootListEl.innerHTML = '<li>Aucun butin supplémentaire.</li>';
    }
    window.combatEndModalEl.classList.remove('hidden');
    isGamePaused = true;
}
window.showCombatEndModal = showCombatEndModal;

function closeCombatEndModal() {
    if(window.combatEndModalEl) window.combatEndModalEl.classList.add('hidden');
    isGamePaused = false;
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();
}
window.closeCombatEndModal = closeCombatEndModal;

function fleeCombat() {
    if (!currentCombatInstance || currentCombatInstance.isCombatOver) return;
    if(typeof addLogEntry === 'function') addLogEntry("Nexus-7 tente de fuir...", "warning", "combat", currentCombatInstance.combatLog);
    
    const fleePenalty = Math.floor(currentCombatInstance.nanobot.stats.health * 0.1);
    currentCombatInstance.nanobot.currentHealth -= fleePenalty;
    if (currentCombatInstance.nanobot.currentHealth < 0) currentCombatInstance.nanobot.currentHealth = 0;
    // Mettre à jour gameState.nanobotStats.currentHealth immédiatement car le combat se termine
    if (window.gameState && window.gameState.nanobotStats) {
        window.gameState.nanobotStats.currentHealth = currentCombatInstance.nanobot.currentHealth;
    }


    if(typeof addLogEntry === 'function') addLogEntry(`Fuite réussie ! Nexus-7 perd ${fleePenalty} PV.`, "system", "combat", currentCombatInstance.combatLog);
    currentCombatInstance.isCombatOver = true;
    endCombat(false); // Fuite = défaite pour les récompenses
}
window.fleeCombat = fleeCombat;


function createDamageFloat(amount, targetType, isCritical = false, isHeal = false, isMiss = false) {
    const targetEl = targetType === 'nanobot' ? window.combatNanobotEl : window.combatEnemyEl;
    if (!targetEl) return;

    const floatEl = document.createElement('div');
    floatEl.className = 'damage-float';
    floatEl.textContent = isMiss ? "Raté!" : (isHeal ? `+${amount}` : `${amount}`);

    if (isCritical) floatEl.classList.add('critical');
    else if (isHeal) floatEl.style.color = 'var(--accent-green)';
    else if (isMiss) floatEl.style.color = 'var(--text-secondary)';
    // else floatEl.style.color = 'var(--accent-red)'; // Couleur par défaut via CSS

    targetEl.appendChild(floatEl);
    floatEl.addEventListener('animationend', () => {
        if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
    });
}
window.createDamageFloat = createDamageFloat;

console.log("combat.js - Fin du fichier, fonctions définies.");