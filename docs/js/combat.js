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
        nanobotVisualClone.style.transform = 'scale(0.75) translateY(-5px)'; 
        window.combatNanobotSpriteEl.appendChild(nanobotVisualClone);
    } else {
         window.combatNanobotSpriteEl.style.backgroundColor = 'var(--accent-blue)'; 
    }
    
    updateCombatHealthBar('nanobot', nanobotCombatStats.currentHealth, nanobotCombatStats.health, currentCombatInstance.nanobot.activeShield);
    window.combatNanobotRageEl.textContent = currentCombatInstance.nanobot.rage || 0;
    window.combatNanobotGlobalEnergyEl.textContent = window.gameState?.resources?.energy || 0;

    // Ennemi UI
    window.combatEnemyNameEl.textContent = enemyData.name;
    window.combatEnemySpriteEl.style.backgroundImage = `url('${enemyData.spritePath || 'https://placehold.co/80x100/cc0000/ffffff?text=ENNEMI'}')`;
    if(!enemyData.spritePath && enemyData.color) window.combatEnemySpriteEl.style.backgroundColor = enemyData.color;
    updateCombatHealthBar('enemy', currentCombatInstance.enemy.currentHealth, enemyData.maxHealth || enemyData.health, currentCombatInstance.enemy.activeShield);


    renderCombatActions(); 
    window.combatTurnIndicatorEl.textContent = currentCombatInstance.turn === 'nanobot' ? "Tour de Nexus-7" : `Tour de ${enemyData.name}`;

    const arenaEl = document.querySelector('.combat-arena'); 
    if (arenaEl) {
        arenaEl.className = 'combat-arena'; 
        if (currentCombatInstance.arenaBackground && currentCombatInstance.arenaBackground !== 'default') {
            arenaEl.classList.add(`combat-arena-${currentCombatInstance.arenaBackground}`);
        } else {
            arenaEl.classList.add('combat-arena-default');
        }
    }
    
    updateEffectsDisplay('nanobot');
    updateEffectsDisplay('enemy');

    window.combatModalEl.classList.remove('hidden');
    isGamePaused = true;
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

    const globalEnemyData = window.enemyData || window.explorationEnemyData; 
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
    const enemyDataForCombat = { ...enemyBaseData, ...enemyDataInput };

    if (window.combatLogVisualEl) window.combatLogVisualEl.innerHTML = '';
    if (window.combatLogDetailsContainerEl) window.combatLogDetailsContainerEl.open = false;

    const nanobotInitialCombatStats = JSON.parse(JSON.stringify(window.gameState.nanobotStats));
    nanobotInitialCombatStats.currentHealth = nanobotInitialCombatStats.currentHealth > 0 ? nanobotInitialCombatStats.currentHealth : nanobotInitialCombatStats.health;

    currentCombatInstance = {
        nanobot: {
            baseStats: nanobotInitialCombatStats, // Stats de base avant buffs/debuffs de combat
            effectiveStats: { ...nanobotInitialCombatStats }, // Stats avec buffs/debuffs
            currentHealth: nanobotInitialCombatStats.currentHealth,
            rage: 0, 
            effects: [], // { id, sourceSkillId, duration, value, effectKey }
            activeShield: 0 // Valeur actuelle du bouclier
        },
        enemy: {
            data: enemyDataForCombat, 
            baseStats: { // Stats de base de l'ennemi (pourraient être modifiées par des effets)
                health: enemyDataForCombat.maxHealth || enemyDataForCombat.health,
                attack: enemyDataForCombat.attack,
                defense: enemyDataForCombat.defense,
                speed: enemyDataForCombat.speed,
                resistances: enemyDataForCombat.resistances || {},
                damageType: enemyDataForCombat.damageType || (typeof window.DAMAGE_TYPES !== 'undefined' ? window.DAMAGE_TYPES.KINETIC : 'kinetic')
            },
            effectiveStats: { // Stats avec buffs/debuffs
                health: enemyDataForCombat.maxHealth || enemyDataForCombat.health,
                attack: enemyDataForCombat.attack,
                defense: enemyDataForCombat.defense,
                speed: enemyDataForCombat.speed,
                resistances: enemyDataForCombat.resistances || {},
                damageType: enemyDataForCombat.damageType || (typeof window.DAMAGE_TYPES !== 'undefined' ? window.DAMAGE_TYPES.KINETIC : 'kinetic')
            },
            currentHealth: enemyDataForCombat.currentHealth || enemyDataForCombat.maxHealth || enemyDataForCombat.health, 
            effects: [],
            activeShield: 0
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

    if ((currentCombatInstance.enemy.effectiveStats.speed || 0) > (currentCombatInstance.nanobot.effectiveStats.speed || 0)) {
        currentCombatInstance.turn = 'enemy';
    }

    if(typeof addLogEntry === 'function') addLogEntry(`Combat engagé contre ${enemyDataForCombat.name} !`, "system", "combat", currentCombatInstance.combatLog);
    initializeCombatUI(currentCombatInstance.nanobot.effectiveStats, currentCombatInstance.enemy.data);

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
        return Promise.resolve({ outcome: "error", message: "Nanobot data missing" });
    }
     if (!enemyDetailsInput || !enemyDetailsInput.id) {
        console.error("ERREUR FATALE DANS simulateCombat: enemyDetailsInput invalide ou ID manquant.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur critique: Données ennemi invalides pour simulateCombat.", "error", "event");
        return Promise.resolve({ outcome: "error", message: "Enemy data invalid" });
    }

    const globalEnemyData = window.enemyData || window.explorationEnemyData;
    if (!globalEnemyData || !globalEnemyData[enemyDetailsInput.id]) {
        console.error(`simulateCombat: Données de base pour l'ennemi ID ${enemyDetailsInput.id} non trouvées.`);
         if(typeof addLogEntry === 'function') addLogEntry(`Erreur config pour simulation: ${enemyDetailsInput.id}.`, "error", "event");
        return Promise.resolve({ outcome: "error", message: `Base data for ${enemyDetailsInput.id} missing` });
    }
    
    const enemyForSimulation = {
        ...globalEnemyData[enemyDetailsInput.id], 
        ...enemyDetailsInput 
    };
    enemyForSimulation.name = enemyForSimulation.name || "Ennemi Inconnu";
    enemyForSimulation.health = enemyForSimulation.health || 50;
    enemyForSimulation.maxHealth = enemyForSimulation.maxHealth || enemyForSimulation.health;
    enemyForSimulation.currentHealth = enemyDetailsInput.currentHealth || enemyForSimulation.maxHealth;
    enemyForSimulation.attack = enemyForSimulation.attack || 10;
    enemyForSimulation.defense = enemyForSimulation.defense || 5;
    enemyForSimulation.speed = enemyForSimulation.speed || 5;
    enemyForSimulation.spritePath = enemyForSimulation.spritePath || 'https://placehold.co/80x100/ff0000/ffffff?text=SIM';
    enemyForSimulation.damageType = enemyForSimulation.damageType || (typeof window.DAMAGE_TYPES !== 'undefined' ? window.DAMAGE_TYPES.KINETIC : 'kinetic');

    if(typeof addLogEntry === 'function') addLogEntry(`Simulation de combat lancée contre ${enemyForSimulation.name}.`, "system", "event");
    
    startCombat(enemyForSimulation, 'default');

    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (currentCombatInstance && currentCombatInstance.isCombatOver) {
                clearInterval(checkInterval);
                const nanobotWon = currentCombatInstance.nanobot.currentHealth > 0;
                window.gameState.nanobotStats.currentHealth = currentCombatInstance.nanobot.currentHealth;
                if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateNanobotDisplay === 'function') {
                    window.uiUpdates.updateNanobotDisplay();
                }
                resolve({
                    outcome: nanobotWon ? "victory" : "defeat",
                    enemyDefeated: nanobotWon, 
                    nanobotHealth: currentCombatInstance.nanobot.currentHealth,
                    enemyRemainingHealth: currentCombatInstance.enemy.currentHealth,
                    message: nanobotWon ? `${enemyForSimulation.name} vaincu.` : `Nexus-7 vaincu par ${enemyForSimulation.name}.`
                });
            } else if (!currentCombatInstance) { 
                clearInterval(checkInterval);
                resolve({ outcome: "error", message: "Combat instance failed to initialize." });
            }
        }, 100); 
    });
}
window.simulateCombat = simulateCombat;

function updateCombatHealthBar(targetType, currentHealth, maxHealth, currentShield = 0) {
    const healthBarEl = targetType === 'nanobot' ? window.combatNanobotHealthbarEl : window.combatEnemyHealthbarEl;
    if (!healthBarEl) return;

    const totalEffectiveHealth = maxHealth + currentShield;
    const currentTotal = currentHealth + currentShield;
    
    const percentage = totalEffectiveHealth > 0 ? (currentTotal / totalEffectiveHealth) * 100 : 0;
    healthBarEl.style.width = `${Math.max(0, Math.min(100, percentage))}%`;

    healthBarEl.classList.remove('low', 'medium', 'bg-red-500', 'bg-yellow-300', 'bg-green-500', 'bg-blue-400'); // Retirer bg-blue-400 pour bouclier
    
    if (currentShield > 0) {
        healthBarEl.classList.add('bg-blue-400'); // Couleur pour bouclier
        // On pourrait ajouter une deuxième barre pour le bouclier si on veut plus de détails visuels
    } else {
        const healthOnlyPercentage = maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0;
        if (healthOnlyPercentage < 30) { healthBarEl.classList.add('low', 'bg-red-500'); }
        else if (healthOnlyPercentage < 60) { healthBarEl.classList.add('medium', 'bg-yellow-300'); }
        else { healthBarEl.classList.add('bg-green-500');}
    }
}
window.updateCombatHealthBar = updateCombatHealthBar;

function renderCombatActions() {
    if (!window.combatActionsContainerEl || !currentCombatInstance) return;
    window.combatActionsContainerEl.innerHTML = ''; 

    const attackButton = document.createElement('button');
    attackButton.className = 'btn btn-danger btn-sm md:btn-base'; // Ajuster taille pour mobile/desktop
    attackButton.innerHTML = `<i class="ti ti-sword mr-1"></i>Attaquer`;
    attackButton.onclick = () => handleCombatAction('attack');
    attackButton.disabled = currentCombatInstance.playerTurnActionTaken; 
    window.combatActionsContainerEl.appendChild(attackButton);

    if (gameState && gameState.nanobotSkills && typeof window.NANOBOT_SKILLS_CONFIG !== 'undefined') {
        for (const skillId in gameState.nanobotSkills) {
            const skillRuntimeData = gameState.nanobotSkills[skillId]; 
            const skillConfig = window.NANOBOT_SKILLS_CONFIG[skillId];

            if (skillConfig && skillConfig.unlock && gameState.nanobotStats.level >= skillConfig.unlock.level) {
                const skillButton = document.createElement('button');
                skillButton.className = 'btn btn-info btn-sm md:btn-base skill-button'; 
                skillButton.dataset.skillId = skillId;
                
                let buttonHtml = skillConfig.icon ? `<i class="${skillConfig.icon} mr-1"></i>` : "";
                buttonHtml += skillConfig.name;
                
                let canUseSkill = true;
                let reasonDisabled = "";

                if (skillRuntimeData.cooldownRemaining > 0) {
                    buttonHtml += ` <span class="text-xs text-gray-400">(CD: ${skillRuntimeData.cooldownRemaining}t)</span>`;
                    canUseSkill = false;
                    reasonDisabled = `En recharge (${skillRuntimeData.cooldownRemaining} tours).`;
                    skillButton.classList.add('on-cooldown');
                }

                if (canUseSkill && skillConfig.cost) {
                    let costStringParts = [];
                    let tempCanAfford = true;
                    if (skillConfig.cost.rage) {
                        costStringParts.push(`${skillConfig.cost.rage} Rage`);
                        if ((currentCombatInstance.nanobot.rage || 0) < skillConfig.cost.rage) tempCanAfford = false;
                    }
                    if (skillConfig.cost.energy) {
                        costStringParts.push(`${skillConfig.cost.energy} Énergie`);
                        if ((gameState.resources.energy || 0) < skillConfig.cost.energy) tempCanAfford = false;
                    }
                    
                    if (!tempCanAfford) {
                        canUseSkill = false;
                        reasonDisabled = "Ressources insuffisantes.";
                        skillButton.classList.add('insufficient-resources');
                    }
                    if (costStringParts.length > 0) buttonHtml += ` <span class="text-xs text-yellow-300">(${costStringParts.join('/')})</span>`;
                }

                skillButton.innerHTML = buttonHtml;
                skillButton.disabled = !canUseSkill || currentCombatInstance.playerTurnActionTaken;
                if (reasonDisabled && !canUseSkill) skillButton.title = reasonDisabled;
                
                skillButton.onclick = () => handleCombatAction('skill', skillId);
                window.combatActionsContainerEl.appendChild(skillButton);
            }
        }
    }
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

    const nanobot = currentCombatInstance.nanobot;
    const enemy = currentCombatInstance.enemy;

    if (actionType === 'attack') {
        const damage = calculateDamage(nanobot.effectiveStats, enemy.effectiveStats, { baseDamage: nanobot.effectiveStats.attack });
        dealDamage(enemy, damage, 'nanobot');
        nanobot.rage = Math.min((nanobot.rage || 0) + 10, 100); // Augmenter la rage sur attaque de base
        if(window.combatNanobotRageEl) window.combatNanobotRageEl.textContent = nanobot.rage;
        addLogEntryToCombat(`Nexus-7 attaque ${enemy.data.name} et inflige ${damage} dégâts.`);
    } else if (actionType === 'skill' && skillId && typeof window.NANOBOT_SKILLS_CONFIG !== 'undefined') {
        const skillConfig = window.NANOBOT_SKILLS_CONFIG[skillId];
        const skillRuntime = gameState.nanobotSkills[skillId];

        if (!skillConfig || !skillRuntime || skillRuntime.cooldownRemaining > 0) {
            addLogEntryToCombat("Capacité non prête ou inconnue.", "warning");
            currentCombatInstance.playerTurnActionTaken = false; 
            renderCombatActions(); 
            return;
        }
        
        let canAfford = true; let costPaid = {};
        if (skillConfig.cost) {
            if (skillConfig.cost.rage) {
                if (skillConfig.cost.rage === "all") {
                    if ((nanobot.rage || 0) > 0) { costPaid.rage = nanobot.rage; } else { canAfford = false; }
                } else if ((nanobot.rage || 0) < skillConfig.cost.rage) { canAfford = false; }
                  else { costPaid.rage = skillConfig.cost.rage; }
            }
            if (canAfford && skillConfig.cost.energy) {
                if ((gameState.resources.energy || 0) < skillConfig.cost.energy) { canAfford = false; }
                else { costPaid.energy = skillConfig.cost.energy; }
            }
        }
        if (!canAfford) {
            addLogEntryToCombat(`Ressources insuffisantes pour ${skillConfig.name}.`, "error");
            currentCombatInstance.playerTurnActionTaken = false; 
            renderCombatActions();
            return;
        }
        
        if (costPaid.rage) nanobot.rage -= costPaid.rage;
        if (costPaid.energy) gameState.resources.energy -= costPaid.energy;
        
        addLogEntryToCombat(`Nexus-7 utilise ${skillConfig.name}!`, "success");
        skillRuntime.cooldownRemaining = skillConfig.cooldown || 0; 

        // --- Application des effets de la compétence ---
        switch(skillConfig.type) {
            case "active_damage":
                const damageDetails = {
                    baseDamage: skillConfig.baseDamage || 0,
                    damageMultiplier: skillConfig.damageMultiplier,
                    damageType: skillConfig.damageType,
                    defensePiercing: skillConfig.defensePiercing || 0,
                    bonusDamage: 0
                };
                if(skillId === "rage_fueled_strike" && costPaid.rage) { // Cas spécial pour Rage Fueled Strike
                    damageDetails.bonusDamage = Math.floor(costPaid.rage * (skillConfig.damagePerRagePoint || 0));
                }
                const skillDamage = calculateDamage(nanobot.effectiveStats, enemy.effectiveStats, damageDetails);
                dealDamage(enemy, skillDamage, 'nanobot');
                addLogEntryToCombat(`${skillConfig.name} inflige ${skillDamage} dégâts ${skillConfig.damageType} à ${enemy.data.name}.`);
                break;
            case "active_heal":
                nanobot.currentHealth = Math.min(nanobot.effectiveStats.health, nanobot.currentHealth + (skillConfig.healAmount || 0));
                addLogEntryToCombat(`${skillConfig.name} restaure ${skillConfig.healAmount} PV à Nexus-7.`);
                createDamageFloat(skillConfig.healAmount || 0, 'nanobot', false, true);
                updateCombatHealthBar('nanobot', nanobot.currentHealth, nanobot.effectiveStats.health, nanobot.activeShield);
                break;
            case "shield":
                applyEffect(nanobot, { 
                    id: skillConfig.effectKey, 
                    sourceSkillId: skillId,
                    type: 'shield', 
                    duration: skillConfig.duration, 
                    value: skillConfig.shieldAmount,
                    displayText: `Bouclier (${skillConfig.shieldAmount})`
                });
                addLogEntryToCombat(`${skillConfig.name} applique un bouclier de ${skillConfig.shieldAmount} PV pour ${skillConfig.duration} tours.`);
                break;
            case "hot": // Heal Over Time
                 applyEffect(nanobot, {
                    id: skillConfig.effectKey,
                    sourceSkillId: skillId,
                    type: 'hot',
                    duration: skillConfig.duration,
                    value: skillConfig.healPerTurn, // Soin par tour
                    displayText: `Réparation (${skillConfig.healPerTurn}/tour)`
                });
                addLogEntryToCombat(`${skillConfig.name} active une réparation de ${skillConfig.healPerTurn} PV/tour pour ${skillConfig.duration} tours.`);
                break;
            // TODO: Ajouter cas pour buff_self, debuff_enemy, etc.
        }
        
        if(window.combatNanobotRageEl) window.combatNanobotRageEl.textContent = nanobot.rage;
        if(window.combatNanobotGlobalEnergyEl) window.combatNanobotGlobalEnergyEl.textContent = gameState.resources.energy;
        if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateResourceDisplay === 'function') window.uiUpdates.updateResourceDisplay();
    }

    checkCombatStatus();
    if (!currentCombatInstance.isCombatOver) {
        currentCombatInstance.turn = 'enemy';
        if(window.combatTurnIndicatorEl) window.combatTurnIndicatorEl.textContent = `Tour de ${currentCombatInstance.enemy.data.name}`;
        renderCombatActions(); 
        setTimeout(processEnemyTurn, 1000);
    } else {
        renderCombatActions(); 
    }
}
window.handleCombatAction = handleCombatAction;


function processEnemyTurn() {
    if (!currentCombatInstance || currentCombatInstance.isCombatOver || currentCombatInstance.turn !== 'enemy') {
        return;
    }
    if(window.combatTurnIndicatorEl) window.combatTurnIndicatorEl.textContent = `Tour de ${currentCombatInstance.enemy.data.name}`;
    
    processEffects(currentCombatInstance.enemy, 'start'); // Appliquer DoTs/HoTs sur l'ennemi
    if (currentCombatInstance.isCombatOver) return; // Si l'ennemi meurt des DoTs

    // Logique IA Ennemi (simple pour l'instant: attaque de base)
    const enemy = currentCombatInstance.enemy;
    const nanobot = currentCombatInstance.nanobot;
    
    // Ici, l'ennemi pourrait utiliser une compétence si implémenté
    const damage = calculateDamage(enemy.effectiveStats, nanobot.effectiveStats, { baseDamage: enemy.effectiveStats.attack });
    dealDamage(nanobot, damage, 'enemy');
    addLogEntryToCombat(`${enemy.data.name} attaque Nexus-7 et inflige ${damage} dégâts.`);

    processEffects(currentCombatInstance.nanobot, 'start'); // Appliquer DoTs/HoTs sur le joueur APRÈS l'attaque ennemie
    if (currentCombatInstance.isCombatOver) return;

    // Fin de tour pour l'ennemi (décrémenter ses buffs/debuffs)
    processEffects(currentCombatInstance.enemy, 'end');
    
    checkCombatStatus();
    if (!currentCombatInstance.isCombatOver) {
        currentCombatInstance.turn = 'nanobot';
        currentCombatInstance.playerTurnActionTaken = false;
        currentCombatInstance.round++;

        // Fin de tour pour le joueur (décrémenter ses buffs/debuffs, cooldowns)
        processEffects(currentCombatInstance.nanobot, 'end');
        if (gameState && gameState.nanobotSkills) {
            for (const skillId in gameState.nanobotSkills) {
                if (gameState.nanobotSkills[skillId].cooldownRemaining > 0) {
                    gameState.nanobotSkills[skillId].cooldownRemaining--;
                }
            }
        }
        // TODO: Gérer les cooldowns des skills ennemis s'ils en ont

        if(window.combatTurnIndicatorEl) window.combatTurnIndicatorEl.textContent = "Tour de Nexus-7";
        renderCombatActions(); 
    } else {
        renderCombatActions(); 
    }
}
window.processEnemyTurn = processEnemyTurn;

function checkCombatStatus() {
    if (!currentCombatInstance || currentCombatInstance.isCombatOver) return;
    const nanobotHealth = currentCombatInstance.nanobot.currentHealth;
    const enemyHealth = currentCombatInstance.enemy.currentHealth;

    if (enemyHealth <= 0) {
        currentCombatInstance.isCombatOver = true;
        addLogEntryToCombat(`${currentCombatInstance.enemy.data.name} a été vaincu !`, "success");
        setTimeout(() => endCombat(true), 1500);
    } else if (nanobotHealth <= 0) {
        currentCombatInstance.isCombatOver = true;
        addLogEntryToCombat("Nexus-7 a été mis hors de combat !", "error");
        setTimeout(() => endCombat(false), 1500);
    }
}
window.checkCombatStatus = checkCombatStatus;

function endCombat(nanobotWon) {
    if (!currentCombatInstance) return;
    if (window.combatModalEl) window.combatModalEl.classList.add('hidden');
    isGamePaused = false;

    // Retirer tous les effets de combat temporaires avant de sauvegarder la vie
    currentCombatInstance.nanobot.effects = [];
    currentCombatInstance.enemy.effects = [];
    currentCombatInstance.nanobot.activeShield = 0;
    currentCombatInstance.enemy.activeShield = 0;
    // Recalculer les stats effectives une dernière fois pour s'assurer qu'elles sont "propres"
    currentCombatInstance.nanobot.effectiveStats = { ...currentCombatInstance.nanobot.baseStats };
    currentCombatInstance.enemy.effectiveStats = { ...currentCombatInstance.enemy.baseStats };


    if (window.gameState && window.gameState.nanobotStats) {
        window.gameState.nanobotStats.currentHealth = currentCombatInstance.nanobot.currentHealth;
    }

    if (nanobotWon) {
        const enemy = currentCombatInstance.enemy.data;
        let rewardsMessage = `Vous avez vaincu ${enemy.name}.<br>`;
        let xpGained = enemy.xpValue || 0;
        let lootObtained = []; 

        if (typeof gainXP === 'function' && window.gameState) { 
            const levelUpDetails = gainXP(xpGained); 
            rewardsMessage += `XP gagnée: ${xpGained}.<br>`;
            if (levelUpDetails && levelUpDetails.leveledUp) { 
                rewardsMessage += `<span class="text-yellow-300">Niveau Supérieur ! Nexus-7 est maintenant niveau ${levelUpDetails.newLevel}.</span><br>`;
            }
        }
        showCombatEndModal(true, rewardsMessage, xpGained, lootObtained);
    } else {
        if (window.gameState && window.gameState.nanobotStats && window.gameState.nanobotStats.currentHealth <= 0) {
             window.gameState.nanobotStats.currentHealth = 1; 
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
    addLogEntryToCombat("Nexus-7 tente de fuir...", "warning");
    
    const fleePenalty = Math.floor(currentCombatInstance.nanobot.baseStats.health * 0.1);
    currentCombatInstance.nanobot.currentHealth -= fleePenalty;
    if (currentCombatInstance.nanobot.currentHealth < 0) currentCombatInstance.nanobot.currentHealth = 0;
    
    if (window.gameState && window.gameState.nanobotStats) {
        window.gameState.nanobotStats.currentHealth = currentCombatInstance.nanobot.currentHealth;
    }

    addLogEntryToCombat(`Fuite réussie ! Nexus-7 perd ${fleePenalty} PV.`);
    currentCombatInstance.isCombatOver = true;
    endCombat(false); 
}
window.fleeCombat = fleeCombat;


function createDamageFloat(amount, targetType, isCritical = false, isHeal = false, isMiss = false, isShieldHit = false) {
    const targetEl = targetType === 'nanobot' ? window.combatNanobotEl : window.combatEnemyEl;
    if (!targetEl) return;

    const floatEl = document.createElement('div');
    floatEl.className = 'damage-float';
    floatEl.textContent = isMiss ? "Raté!" : (isHeal ? `+${amount}` : `${amount}`);

    if (isCritical) floatEl.classList.add('critical');
    else if (isHeal) floatEl.style.color = 'var(--accent-green)';
    else if (isMiss) floatEl.style.color = 'var(--text-secondary)';
    else if (isShieldHit) floatEl.style.color = 'var(--accent-blue)'; // Couleur pour dégâts sur bouclier
    
    targetEl.appendChild(floatEl);
    floatEl.addEventListener('animationend', () => {
        if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
    });
}
window.createDamageFloat = createDamageFloat;

// --- Nouvelle Logique pour les Effets et Calculs ---

function calculateDamage(attackerStats, defenderStats, skillDetails = {}) {
    let baseDmg = skillDetails.baseDamage || attackerStats.attack;
    if (skillDetails.damageMultiplier) baseDmg *= skillDetails.damageMultiplier;
    if (skillDetails.bonusDamage) baseDmg += skillDetails.bonusDamage;

    let defense = defenderStats.defense || 0;
    if (skillDetails.defensePiercing) {
        defense *= (1 - skillDetails.defensePiercing);
    }
    
    let rawDamage = Math.max(1, baseDmg - defense);

    // TODO: Ajouter calcul de critique et résistances si besoin
    // if (Math.random() < (attackerStats.critChance || 0)) { rawDamage *= (attackerStats.critDamage || 1.5); /* isCritical = true; */ }
    // rawDamage = calculateModifiedDamage(rawDamage, skillDetails.damageType || attackerStats.damageType, defenderStats.resistances);

    return Math.floor(rawDamage);
}
window.calculateDamage = calculateDamage;

function dealDamage(target, amount, damageSourceType) { // damageSourceType: 'nanobot' ou 'enemy'
    let damageRemaining = amount;
    let shieldHit = false;

    if (target.activeShield > 0) {
        shieldHit = true;
        const shieldDamage = Math.min(target.activeShield, damageRemaining);
        target.activeShield -= shieldDamage;
        damageRemaining -= shieldDamage;
        createDamageFloat(shieldDamage, damageSourceType === 'nanobot' ? 'enemy' : 'nanobot', false, false, false, true);
    }

    if (damageRemaining > 0) {
        target.currentHealth -= damageRemaining;
        createDamageFloat(damageRemaining, damageSourceType === 'nanobot' ? 'enemy' : 'nanobot');
    }
    
    if (target.currentHealth < 0) target.currentHealth = 0;
    
    const targetMaxHealth = target.effectiveStats ? target.effectiveStats.health : (target.data ? target.data.maxHealth : 100);
    updateCombatHealthBar(damageSourceType === 'nanobot' ? 'enemy' : 'nanobot', target.currentHealth, targetMaxHealth, target.activeShield);
}
window.dealDamage = dealDamage;


function applyEffect(target, effect) { // target est currentCombatInstance.nanobot ou .enemy
    // Retirer un effet existant avec la même `effectKey` pour éviter les cumuls non désirés (sauf si cumulable)
    target.effects = target.effects.filter(e => e.id !== effect.id || effect.isStackable);
    
    target.effects.push(effect);
    if (effect.type === 'shield') {
        target.activeShield = (target.activeShield || 0) + effect.value;
    }
    // Recalculer les stats effectives si c'est un buff/debuff
    recalculateEffectiveStats(target);
    updateEffectsDisplay(target === currentCombatInstance.nanobot ? 'nanobot' : 'enemy');
    updateCombatHealthBar(target === currentCombatInstance.nanobot ? 'nanobot' : 'enemy', target.currentHealth, target.effectiveStats.health, target.activeShield);
}
window.applyEffect = applyEffect;

function processEffects(target, phase) { // phase: 'start' ou 'end' du tour de la cible
    if (!target || !target.effects) return;
    let effectsChanged = false;

    for (let i = target.effects.length - 1; i >= 0; i--) {
        const effect = target.effects[i];
        if (phase === 'start') {
            if (effect.type === 'hot') {
                const healAmount = effect.value;
                target.currentHealth = Math.min(target.effectiveStats.health, target.currentHealth + healAmount);
                createDamageFloat(healAmount, target === currentCombatInstance.nanobot ? 'nanobot' : 'enemy', false, true);
                addLogEntryToCombat(`${target.data?.name || "Nexus-7"} récupère ${healAmount} PV grâce à ${effect.id}.`);
                effectsChanged = true;
            }
            // TODO: Ajouter logique pour DoT (Damage over Time)
        }
        
        if (phase === 'end') {
            effect.duration--;
            if (effect.duration <= 0) {
                if (effect.type === 'shield') {
                    target.activeShield = Math.max(0, target.activeShield - effect.value); // Retirer la valeur du bouclier expiré
                }
                target.effects.splice(i, 1);
                addLogEntryToCombat(`L'effet ${effect.displayText || effect.id} s'est dissipé sur ${target.data?.name || "Nexus-7"}.`);
                effectsChanged = true;
                recalculateEffectiveStats(target); // Recalculer si un buff/debuff expire
            }
        }
    }
    if (effectsChanged) {
        updateEffectsDisplay(target === currentCombatInstance.nanobot ? 'nanobot' : 'enemy');
        updateCombatHealthBar(target === currentCombatInstance.nanobot ? 'nanobot' : 'enemy', target.currentHealth, target.effectiveStats.health, target.activeShield);
    }
}
window.processEffects = processEffects;

function recalculateEffectiveStats(target) {
    // Pour l'instant, on ne modifie pas les stats de base, mais cette fonction serait utile pour les buffs/debuffs
    // target.effectiveStats = { ...target.baseStats };
    // Parcourir target.effects et appliquer les modificateurs de stats à target.effectiveStats
}
window.recalculateEffectiveStats = recalculateEffectiveStats;

function updateEffectsDisplay(targetType) { // 'nanobot' ou 'enemy'
    const combatant = targetType === 'nanobot' ? currentCombatInstance.nanobot : currentCombatInstance.enemy;
    const effectsContainerId = targetType === 'nanobot' ? 'combat-nanobot-effects' : 'combat-enemy-effects';
    let effectsContainer = document.getElementById(effectsContainerId);

    if (!effectsContainer) { // Créer le conteneur s'il n'existe pas
        effectsContainer = document.createElement('div');
        effectsContainer.id = effectsContainerId;
        effectsContainer.className = 'combatant-effects-display flex gap-1 mt-1 justify-center flex-wrap';
        const targetElement = targetType === 'nanobot' ? window.combatNanobotEl : window.combatEnemyEl;
        if (targetElement) {
            // Insérer avant la barre de vie ou après les ressources du nanobot
            const healthBarCont = targetElement.querySelector('.health-bar-container');
            if(healthBarCont) healthBarCont.insertAdjacentElement('afterend', effectsContainer);
            else targetElement.appendChild(effectsContainer);
        } else return;
    }
    effectsContainer.innerHTML = '';

    combatant.effects.forEach(effect => {
        const effectEl = document.createElement('span');
        effectEl.className = 'effect-badge text-xs px-1.5 py-0.5 rounded-full border';
        let bgColor = 'bg-gray-600 border-gray-500';
        let textColor = 'text-gray-200';
        let icon = effect.icon || 'ti-question-mark'; // Icône par défaut
        
        if (effect.type === 'shield') { bgColor = 'bg-blue-700 border-blue-500'; icon = 'ti-shield'; }
        else if (effect.type === 'hot') { bgColor = 'bg-green-700 border-green-500'; icon = 'ti-progress-check'; }
        // Ajouter d'autres types (buff, debuff, dot)
        
        effectEl.classList.add(...bgColor.split(' '));
        effectEl.innerHTML = `<i class="${icon} ${textColor} text-xs mr-0.5"></i><span class="${textColor}">${effect.displayText || effect.id} (${effect.duration}t)</span>`;
        effectEl.title = `${effect.displayText || effect.id} - Dure encore ${effect.duration} tours.`;
        effectsContainer.appendChild(effectEl);
    });
}
window.updateEffectsDisplay = updateEffectsDisplay;

function addLogEntryToCombat(message, type = "combat") {
    if(typeof addLogEntry === 'function') {
        addLogEntry(message, type, "combat", currentCombatInstance.combatLog);
    }
}
window.addLogEntryToCombat = addLogEntryToCombat;


console.log("combat.js - Fin du fichier, fonctions définies.");