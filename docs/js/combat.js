// js/combat.js
console.log("combat.js - VERIFICATION SYNTAXE");
var combatSpeedMultiplier = 1;
var COMBAT_ANIMATION_DELAY = 700; // Sera ajusté par combatSpeedMultiplier

// Fonction Screen Shake
function screenShake(intensity = 4, duration = 150) {
    const arena = document.querySelector('.combat-arena');
    if (!arena) return;
    const originalTransform = arena.style.transform;
    let startTime = Date.now();
    function shake() {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= duration) {
            arena.style.transform = originalTransform;
            return;
        }
        const x = (Math.random() - 0.5) * 2 * intensity;
        const y = (Math.random() - 0.5) * 2 * intensity;
        arena.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(shake);
    }
    requestAnimationFrame(shake);
}

function setupCombatVisuals(nanobot, enemy) {
    if(!combatModalEl || !combatLogVisualEl || !combatNanobotHealthbar || !combatNanobotSprite || !combatEnemyNameEl || !combatEnemyHealthbar || !combatEnemySprite) {
        console.warn("Combat: setupCombatVisuals - Éléments DOM de combat manquants.");
        return;
    }
    if (!gameState || typeof nanobotModulesData === 'undefined' || typeof itemsData === 'undefined') {
        console.warn("Combat: setupCombatVisuals - gameState, nanobotModulesData ou itemsData non défini. Visuels Nanobot peuvent être incomplets.");
    }

    combatModalEl.classList.remove('hidden');
    combatLogVisualEl.innerHTML = '<p class="text-gray-400">Préparation du combat...</p>';

    const arenaElement = document.querySelector('.combat-arena');
    if (arenaElement) {
        arenaElement.classList.remove('combat-arena-verdant', 'combat-arena-caves', 'combat-arena-default');
        if (gameState && gameState.currentZoneId === 'crystal_caves') {
            arenaElement.classList.add('combat-arena-caves');
        } else if (gameState && gameState.currentZoneId === 'verdant_archipelago') {
            arenaElement.classList.add('combat-arena-verdant');
        } else {
            arenaElement.classList.add('combat-arena-default');
        }
    }

    combatNanobotHealthbar.style.width = '100%';
    combatNanobotHealthbar.classList.remove('low', 'medium');
    combatNanobotSprite.innerHTML = ''; 
    const nanobotBaseImagePath = 'images/nanobot_base_body.png';
    const bodyBaseVisualEl = document.createElement('div');
    bodyBaseVisualEl.style.width = '100%'; bodyBaseVisualEl.style.height = '100%'; bodyBaseVisualEl.style.position = 'absolute'; 
    bodyBaseVisualEl.style.left = '0'; bodyBaseVisualEl.style.top = '0';
    bodyBaseVisualEl.style.backgroundImage = `url('${nanobotBaseImagePath}')`;
    bodyBaseVisualEl.style.backgroundSize = 'contain'; bodyBaseVisualEl.style.backgroundPosition = 'center bottom'; bodyBaseVisualEl.style.backgroundRepeat = 'no-repeat';
    combatNanobotSprite.appendChild(bodyBaseVisualEl);

    if (gameState && gameState.nanobotModuleLevels && typeof nanobotModulesData !== 'undefined') {
        for (const moduleId in gameState.nanobotModuleLevels) {
            const currentLevel = gameState.nanobotModuleLevels[moduleId];
            if (currentLevel > 0) {
                const moduleData = nanobotModulesData[moduleId];
                if (moduleData) { 
                    const imagePath = `images/module_visual_${moduleId}.png`;
                    const createAndAppendVisual = (baseClass, specificClassFromData) => {
                        const visualEl = document.createElement('div');
                        visualEl.className = `${baseClass} ${specificClassFromData || ''}`;
                        visualEl.style.backgroundImage = `url('${imagePath}')`;
                        combatNanobotSprite.appendChild(visualEl);
                    };
                    if (moduleData.visualClass) createAndAppendVisual('nanobot-module', moduleData.visualClass);
                    else if (moduleData.visualClasses) moduleData.visualClasses.forEach(className => createAndAppendVisual('nanobot-module', className));
                }
            }
        }
    }
    if (gameState && gameState.nanobotEquipment && typeof itemsData !== 'undefined') {
        for (const slot in gameState.nanobotEquipment) {
            const itemId = gameState.nanobotEquipment[slot];
            if (itemId && itemsData[itemId] && itemsData[itemId].visualClass) {
                const item = itemsData[itemId];
                const imagePath = `images/item_visual_${itemId}.png`;
                const visualEl = document.createElement('div');
                visualEl.className = `nanobot-item-visual ${item.visualClass}`;
                visualEl.style.backgroundImage = `url('${imagePath}')`;
                combatNanobotSprite.appendChild(visualEl);
            }
        }
    }
    combatEnemyNameEl.textContent = enemy.name || "Ennemi";
    combatEnemyHealthbar.style.width = '100%';
    combatEnemyHealthbar.classList.remove('low', 'medium');
    let enemySpriteSource = enemy.spritePath || (enemy.details ? enemy.details.spritePath : null);
    if (enemySpriteSource && enemySpriteSource.startsWith('http')) {
        combatEnemySprite.style.backgroundImage = `url('${enemySpriteSource}')`;
        combatEnemySprite.style.backgroundColor = 'transparent';
    } else if (enemy.color) { 
        combatEnemySprite.style.backgroundColor = enemy.color;
        combatEnemySprite.style.backgroundImage = 'none';
    } else { 
        combatEnemySprite.style.backgroundColor = '#c53030'; 
        combatEnemySprite.style.backgroundImage = 'none';
    }
}

function updateCombatantHealthVisual(combatantElementId, currentHealth, maxHealth) {
    const healthBar = document.getElementById(`${combatantElementId}-healthbar`);
    if(!healthBar) { console.warn(`Barre de vie pour ${combatantElementId} non trouvée.`); return; }
    const percentage = Math.max(0, (maxHealth > 0 ? (currentHealth / maxHealth) : 0) * 100);
    healthBar.style.width = `${percentage}%`;
    healthBar.classList.remove('low', 'medium');
    if (percentage < 30) healthBar.classList.add('low');
    else if (percentage < 60) healthBar.classList.add('medium');
}

async function showDamageFloat(targetElement, damage, type = 'damage', isCritical = false) {
    if(!targetElement) return;
    const floatEl = document.createElement('div');
    floatEl.className = 'damage-float'; 
    if (type === 'damage' && damage > 0) {
        floatEl.textContent = `-${damage}`;
        if (isCritical) floatEl.classList.add('critical');
        else floatEl.style.color = '#e53e3e'; 
    } else if (type === 'heal' && damage > 0) {
        floatEl.textContent = `+${damage}`;
        floatEl.style.color = '#48bb78';
    } else if (type === 'miss') {
        floatEl.textContent = 'Raté!';
        floatEl.style.color = '#a0aec0';
    } else { 
        floatEl.textContent = `${damage}`; 
        floatEl.style.color = '#cbd5e0';
    }
    targetElement.appendChild(floatEl);
    const displayDuration = isCritical ? 1500 : 1000; 
    await sleep(displayDuration / (typeof combatSpeedMultiplier !== 'undefined' ? combatSpeedMultiplier : 1) );
    if(floatEl.parentElement) floatEl.remove();
}

async function animateAttack(attackerElement, targetElement, isNanobotAttacking) {
    if(!attackerElement || !targetElement) return;
    const attackerSprite = attackerElement.querySelector('.combatant-sprite');
    const targetSprite = targetElement.querySelector('.combatant-sprite');
    if (attackerSprite) attackerSprite.classList.add('is-acting');
    const originalTransformAttacker = attackerElement.style.transform;
    const originalFilterTarget = targetSprite ? (targetSprite.style.filter || 'none') : 'none';
    const direction = isNanobotAttacking ? 1 : -1;
    attackerElement.style.transform = `translateX(${20 * direction}px) scale(1.05)`;
    if (targetSprite) targetSprite.style.filter = 'brightness(1.5) saturate(2)';
    let currentAnimDelay = typeof COMBAT_ANIMATION_DELAY !== 'undefined' ? COMBAT_ANIMATION_DELAY : 700;
    currentAnimDelay = currentAnimDelay / (typeof combatSpeedMultiplier !== 'undefined' ? combatSpeedMultiplier : 1);
    await sleep(currentAnimDelay / 2); 
    if (targetSprite) {
        targetSprite.classList.add('sprite-hit-flash');
        setTimeout(() => { if (targetSprite) targetSprite.classList.remove('sprite-hit-flash'); }, 200); 
    }
    attackerElement.style.transform = originalTransformAttacker;
    if (targetSprite) targetSprite.style.filter = originalFilterTarget;
    setTimeout(() => { if (attackerSprite) attackerSprite.classList.remove('is-acting'); }, currentAnimDelay / 2 + 50);
    await sleep(currentAnimDelay / 2);
}


// --- NOUVELLES FONCTIONS POUR LES ACTIONS DE COMBAT ---
let currentCombatRound = 0;
let currentNanobotCombatData;
let currentEnemyCombatData;
let resolveNanobotTurn;
let currentSelectedAction = null;

function displayCombatActions(nanobotCombatStats, combatRoundForDisplay) {
    const actionsContainer = document.getElementById('combat-actions-container');
    if (!actionsContainer) return;

    actionsContainer.innerHTML = '<button id="combat-action-attack" class="btn btn-danger btn-sm">Attaquer</button>'; 

    if (typeof nanobotSkills === 'undefined' || !gameState || !nanobotCombatStats) { // Utiliser nanobotCombatStats ici
        console.warn("displayCombatActions: nanobotSkills, gameState ou nanobotCombatStats manquant.");
        return;
    }

    for (const skillId in nanobotSkills) {
        const skill = nanobotSkills[skillId];
        if (skill.type && skill.type.startsWith('active_')) {
            const skillButton = document.createElement('button');
            skillButton.id = `combat-action-${skillId}`;
            skillButton.className = 'btn btn-primary btn-sm skill-button'; // Classe de base
            skillButton.dataset.skillId = skillId;
            skillButton.dataset.tooltipType = 'nanobot-skill-combat'; // Pour tooltip
            skillButton.dataset.tooltipId = skillId;


            let reasonsToDisable = [];
            const roundsSinceLastUse = combatRoundForDisplay - (nanobotCombatStats.skillLastUsed ? nanobotCombatStats.skillLastUsed[skillId] || -Infinity : -Infinity);
            
            if (skill.cooldown && roundsSinceLastUse < skill.cooldown) {
                skillButton.classList.add('on-cooldown');
                skillButton.disabled = true;
                reasonsToDisable.push(`CD: ${skill.cooldown - roundsSinceLastUse}t`);
            }

            if (skill.cost) {
                if (skill.cost.rage && (nanobotCombatStats.rage || 0) < skill.cost.rage) {
                    skillButton.classList.add('insufficient-resources');
                    skillButton.disabled = true;
                    reasonsToDisable.push(`Rage ${skill.cost.rage}`);
                }
                if (skill.cost.energy && (gameState.resources.energy || 0) < skill.cost.energy) {
                    skillButton.classList.add('insufficient-resources');
                    skillButton.disabled = true;
                    reasonsToDisable.push(`NRG ${skill.cost.energy}`);
                }
            }
            
            if (reasonsToDisable.length > 0) {
                skillButton.textContent = `${skill.name} (${reasonsToDisable.join('/')})`;
            } else {
                skillButton.textContent = skill.name;
            }

            skillButton.addEventListener('click', () => {
                if (!skillButton.disabled) {
                    // Utiliser les variables globales pour le contexte du combat
                    handleNanobotAction(skillId, currentNanobotCombatData, currentEnemyCombatData); 
                }
            });
            actionsContainer.appendChild(skillButton);
        }
    }
    const attackButton = document.getElementById('combat-action-attack');
    if (attackButton) {
        attackButton.addEventListener('click', () => {
            handleNanobotAction('basic_attack', currentNanobotCombatData, currentEnemyCombatData);
        });
    }
}

async function handleNanobotAction(actionId) { // Plus besoin de passer les stats ici, elles sont globales au combat
    const actionButtons = document.querySelectorAll('#combat-actions-container button');
    actionButtons.forEach(btn => btn.disabled = true);
    currentSelectedAction = actionId;
    if (resolveNanobotTurn) {
        resolveNanobotTurn();
        resolveNanobotTurn = null; // Important pour ne pas le résoudre plusieurs fois
    }
}
// --- FIN NOUVELLES FONCTIONS ---


// Gérer les passifs comme Emergency Shield
function checkAndApplyPassiveSkills(combatant, opponent, eventType, combatLogEl) {
    // console.log(`Checking passive skills for ${combatant.name}, event: ${eventType}`);
    if (typeof nanobotSkills === 'undefined') return;

    for (const skillId in nanobotSkills) {
        const skill = nanobotSkills[skillId];
        if (!skill.type || skill.type.startsWith('active_')) continue; // Ignorer les actives

        let canActivate = false;
        
        // Cooldown check (basé sur les rounds de combat)
        const lastUsed = combatant.skillLastUsed ? combatant.skillLastUsed[skillId] || -Infinity : -Infinity;
        if (currentCombatRound < lastUsed + (skill.cooldown || 0) ) {
            continue; // En cooldown
        }

        if (skill.trigger) {
            if (eventType === 'health_check' && skill.trigger.healthPercentBelow && combatant.currentHealth > 0 && (combatant.currentHealth / combatant.health * 100) < skill.trigger.healthPercentBelow) {
                canActivate = true;
            }
            if (eventType === 'after_nanobot_attack_hit' && skill.trigger.onNanobotAttackHit && skill.id === 'adaptiveFocus') {
                canActivate = true;
            }
            // Ajoutez d'autres triggers ici si nécessaire
        }

        if (canActivate) {
            combatant.skillLastUsed = combatant.skillLastUsed || {};
            combatant.skillLastUsed[skillId] = currentCombatRound;

            let activationMsg = skill.activationMessage;
            if (typeof skill.activationMessage === 'function') {
                 activationMsg = skill.id === 'adaptiveFocus' ? skill.activationMessage(combatant.focusStacks +1) : skill.activationMessage();
            }
            addLogEntry(`<span class="skill-activation">${activationMsg}</span>`, "combat-visual", combatLogEl, null);

            // Appliquer l'effet du passif
            if (skill.id === 'emergencyShield' && skill.effect.damageAbsorption) {
                // Le bouclier sera stocké dans `activeShield` dans la boucle de combat
                return skill; // Retourner le skill pour que la boucle principale le gère
            }
            if (skill.id === 'adaptiveFocus' && skill.effect.damageBonusPerStack) {
                combatant.focusStacks = Math.min((combatant.focusStacks || 0) + 1, skill.effect.maxStacks);
                // Le message d'activation a déjà été affiché avec le nombre correct de stacks
            }
        }
    }
    return null; // Aucun passif activé ou applicable
}


var isCombatInProgress = false;
async function _simulateCombat(enemyDetailsInput) {
    console.log("Combat: _simulateCombat appelé avec:", JSON.parse(JSON.stringify(enemyDetailsInput)));
    if (isCombatInProgress) {
        console.warn("Combat: _simulateCombat - Un combat est déjà en cours.");
        return { outcome: "already_in_progress", enemyDefeated: false, nanobotDefeated: true, enemyData: enemyDetailsInput }; 
    }
    isCombatInProgress = true;

    if (!gameState || !gameState.nanobotStats || gameState.nanobotStats.currentHealth <= 0) {
        if (typeof addLogEntry === 'function') addLogEntry("Nexus-7 hors combat ou état du jeu invalide.", "error", combatLogSummaryEl, gameState?.combatLogSummary);
        isCombatInProgress = false;
        return { outcome: "nanobot_incapacitated", enemyDefeated: false, nanobotDefeated: true, enemyData: enemyDetailsInput };
    }
    if (typeof DAMAGE_TYPES === 'undefined' || typeof itemsData === 'undefined' || typeof nanobotSkills === 'undefined' || typeof ZONE_DATA === 'undefined' || typeof BASE_COORDINATES === 'undefined' || typeof TILE_TYPES === 'undefined' || typeof mapManager === 'undefined') {
        console.error("Combat: _simulateCombat - Dépendances de config ou mapManager manquantes.");
        if (typeof addLogEntry === 'function') addLogEntry("Erreur de configuration de combat.", "error", combatLogSummaryEl, gameState?.combatLogSummary);
        isCombatInProgress = false;
        return { outcome: "config_error", enemyDefeated: false, nanobotDefeated: false, enemyData: enemyDetailsInput };
    }

    const enemyInputData = enemyDetailsInput.details ? { ...enemyDetailsInput.details } : { ...enemyDetailsInput };
    currentEnemyCombatData = {
        name: enemyInputData.name || "Ennemi Inconnu",
        health: enemyInputData.health || enemyInputData.maxHealth || 1,
        maxHealth: enemyInputData.maxHealth || enemyInputData.health || 1,
        attack: enemyInputData.attack || 0,
        defense: enemyInputData.defense || 0,
        color: enemyInputData.color || '#e53e3e',
        spritePath: enemyInputData.spritePath || null,
        damageType: enemyInputData.damageType || DAMAGE_TYPES.KINETIC,
        resistances: enemyInputData.resistances || {},
        reward: enemyInputData.reward || {biomass:0, nanites:0, xp:0, loot:[]},
        currentHealth: enemyInputData.health || enemyInputData.maxHealth || 1
    };
    const enemy = currentEnemyCombatData; // alias pour compatibilité

    currentNanobotCombatData = JSON.parse(JSON.stringify(gameState.nanobotStats));
    currentNanobotCombatData.rage = (currentNanobotCombatData.rage || 0) + 10;
    currentNanobotCombatData.focusStacks = 0;
    currentNanobotCombatData.skillLastUsed = currentNanobotCombatData.skillLastUsed || {}; // Garder les cooldowns de la dernière session
    currentNanobotCombatData.activeBuffs = {}; // Réinitialiser les buffs de combat

    let nanobotCombatStats = currentNanobotCombatData; // alias pour compatibilité
    let activeShield = null;

    setupCombatVisuals(nanobotCombatStats, enemy);
    if(combatLogVisualEl) combatLogVisualEl.innerHTML = '';
    addLogEntry(`Affrontement avec ${enemy.name}!`, "combat-visual", combatLogVisualEl, null);

    if (typeof COMBAT_ANIMATION_DELAY_BASE === 'undefined') window.COMBAT_ANIMATION_DELAY_BASE = 700;
    COMBAT_ANIMATION_DELAY = COMBAT_ANIMATION_DELAY_BASE / (typeof combatSpeedMultiplier !== 'undefined' ? combatSpeedMultiplier : 1);
    
    await sleep(COMBAT_ANIMATION_DELAY);
    currentCombatRound = 0;
    if(closeCombatModalBtn) closeCombatModalBtn.disabled = true;
    if(toggleSpeedBtn) toggleSpeedBtn.disabled = true;
    let combatOutcome = "ongoing";

    while (nanobotCombatStats.currentHealth > 0 && enemy.currentHealth > 0 && currentCombatRound < 30) { // Augmenté à 30 rounds max
        currentCombatRound++;
        addLogEntry(`--- Round ${currentCombatRound} ---`, "combat-visual", combatLogVisualEl, null);
        displayCombatActions(nanobotCombatStats, currentCombatRound);
        await sleep(COMBAT_ANIMATION_DELAY / 2);

        // --- NANOBOT'S TURN ---
        addLogEntry("Tour du Nexus-7. Choisissez une action...", "combat-visual", combatLogVisualEl, null);
        currentSelectedAction = null;
        const turnPromise = new Promise(resolve => { resolveNanobotTurn = resolve; });
        await turnPromise; // Attend que handleNanobotAction soit appelé
        
        const actionToPerform = currentSelectedAction;
        if (!actionToPerform) {
             console.warn("Aucune action sélectionnée pour le Nanobot, attaque de base par défaut.");
             currentSelectedAction = 'basic_attack'; // Fallback, ne devrait pas arriver
        }

        let nanobotDamageMultiplier = 1.0;
        let nanobotAttackMessageSuffix = "";
        let nanobotFinalDamageType = DAMAGE_TYPES.KINETIC;
        if(gameState.nanobotEquipment.weapon && itemsData[gameState.nanobotEquipment.weapon] && itemsData[gameState.nanobotEquipment.weapon].damageType){
            nanobotFinalDamageType = itemsData[gameState.nanobotEquipment.weapon].damageType;
        }
        let isNanobotAttackCritical = false;
        let nanobotHealedAmount = 0;
        let performedOffensiveAction = false;

        // Gérer l'action choisie
        if (actionToPerform === 'basic_attack') {
            addLogEntry("Nexus-7 effectue une attaque de base...", "combat-visual", combatLogVisualEl, null);
            performedOffensiveAction = true;
        } else {
            const skill = nanobotSkills[actionToPerform];
            if (skill) {
                addLogEntry(`<span class="skill-activation">${skill.activationMessage || skill.name + ' activé !'}</span>`, "combat-visual", combatLogVisualEl, null);
                if (skill.cost) {
                    if (skill.cost.rage) nanobotCombatStats.rage = Math.max(0, nanobotCombatStats.rage - skill.cost.rage);
                    if (skill.cost.energy) gameState.resources.energy = Math.max(0, gameState.resources.energy - skill.cost.energy);
                    if (skill.cost.energy && typeof uiUpdates !== 'undefined') uiUpdates.updateResourceDisplay();
                }
                nanobotCombatStats.skillLastUsed[skill.id] = currentCombatRound;

                if (skill.effect.damageMultiplier) {
                    nanobotDamageMultiplier = skill.effect.damageMultiplier;
                    isNanobotAttackCritical = true;
                    performedOffensiveAction = true;
                }
                if (skill.effect.healAmount) {
                    nanobotHealedAmount = skill.effect.healAmount;
                    nanobotCombatStats.currentHealth = Math.min(nanobotCombatStats.health, nanobotCombatStats.currentHealth + nanobotHealedAmount);
                    addLogEntry(`<span class="skill-effect">${skill.effectMessage(nanobotHealedAmount)}</span>`, "combat-visual", combatLogVisualEl, null);
                    await showDamageFloat(document.getElementById('combat-nanobot'), nanobotHealedAmount, 'heal');
                    updateCombatantHealthVisual('combat-nanobot', nanobotCombatStats.currentHealth, nanobotCombatStats.health);
                }
                if (skill.effect.defensePiercing) {
                    nanobotCombatStats.activeBuffs.defensePiercing = { value: skill.effect.defensePiercing, duration: skill.effect.duration || 1 };
                    if(typeof skill.effectMessage === 'function') addLogEntry(`<span class="skill-effect">${skill.effectMessage()}</span>`, "combat-visual", combatLogVisualEl, null);
                    // This skill type implies the next action will be an attack
                    performedOffensiveAction = true; // On considère que le buff prépare une attaque
                }
            }
        }

        // Logique d'attaque (si action offensive)
        if (performedOffensiveAction) {
            // Si c'est un buff comme Overcharge, l'attaque se fait "normalement" mais avec le buff actif.
            // Si c'est une attaque directe (basic ou powerStrike), la logique est ici.
             if (actionToPerform === 'basic_attack' || actionToPerform === 'powerStrike' || nanobotCombatStats.activeBuffs.defensePiercing) {
                await animateAttack(document.getElementById('combat-nanobot'), document.getElementById('combat-enemy'), true);

                let baseDamage = nanobotCombatStats.attack;
                if (nanobotCombatStats.focusStacks > 0 && nanobotSkills.adaptiveFocus) {
                    baseDamage += (nanobotSkills.adaptiveFocus.effect.damageBonusPerStack * nanobotCombatStats.focusStacks);
                    nanobotAttackMessageSuffix += ` (Concentration x${nanobotCombatStats.focusStacks})`;
                }
                let damageToEnemyPreDefense = calculateModifiedDamage(baseDamage * nanobotDamageMultiplier, nanobotFinalDamageType, enemy.resistances);
                let enemyEffectiveDefense = enemy.defense;

                if (nanobotCombatStats.activeBuffs.defensePiercing && nanobotCombatStats.activeBuffs.defensePiercing.duration > 0) {
                    enemyEffectiveDefense = Math.max(0, enemy.defense * (1 - nanobotCombatStats.activeBuffs.defensePiercing.value));
                    nanobotCombatStats.activeBuffs.defensePiercing.duration--;
                    if (nanobotCombatStats.activeBuffs.defensePiercing.duration <= 0) delete nanobotCombatStats.activeBuffs.defensePiercing;
                }
                let damageToEnemy = Math.max(1, Math.floor(damageToEnemyPreDefense) - enemyEffectiveDefense);
                enemy.currentHealth -= damageToEnemy;
                if (damageToEnemy > 0) screenShake(3, 100);

                if (actionToPerform === 'powerStrike' && nanobotSkills.powerStrike) { 
                    addLogEntry(`<span class="skill-effect">${nanobotSkills.powerStrike.effectMessage(damageToEnemy)}</span>`, "combat-visual", combatLogVisualEl, null);
                }
                await showDamageFloat(document.getElementById('combat-enemy'), damageToEnemy, 'damage', isNanobotAttackCritical);
                updateCombatantHealthVisual('combat-enemy', enemy.currentHealth, enemy.maxHealth);
                addLogEntry(`Nexus-7 inflige ${damageToEnemy} dégâts ${nanobotFinalDamageType}${nanobotAttackMessageSuffix}. PV ${enemy.name}: ${Math.max(0, Math.floor(enemy.currentHealth))}`, "combat-visual", combatLogVisualEl, null);
                addLogEntry(`Nexus-7 inflige ${damageToEnemy} à ${enemy.name}.`, "combat", combatLogSummaryEl, gameState.combatLogSummary);
                checkAndApplyPassiveSkills(nanobotCombatStats, enemy, 'after_nanobot_attack_hit', combatLogVisualEl);
            }
        }
        
        nanobotCombatStats.rage = Math.min(100, (nanobotCombatStats.rage || 0) + 5); // Gain de rage passif

        await sleep(COMBAT_ANIMATION_DELAY);
        if (enemy.currentHealth <= 0) { combatOutcome="victory"; /*...*/ break; }

        // --- ENEMY'S TURN ---
        addLogEntry(`${enemy.name} attaque...`, "combat-visual", combatLogVisualEl, null);
        await animateAttack(document.getElementById('combat-enemy'), document.getElementById('combat-nanobot'), false);
        let enemyBaseAttackDamage = enemy.attack;
        let enemyDamageType = enemy.damageType || DAMAGE_TYPES.KINETIC;
        let damageToNanobotCalc = calculateModifiedDamage(enemyBaseAttackDamage, enemyDamageType, nanobotCombatStats.resistances || {});
        damageToNanobotCalc = Math.max(1, damageToNanobotCalc - nanobotCombatStats.defense);
        let actualDamageToNanobot = damageToNanobotCalc;

        // Vérifier si le bouclier d'urgence doit s'activer AVANT que les dégâts ne soient appliqués
        const activatedPassiveSkill = checkAndApplyPassiveSkills(nanobotCombatStats, enemy, 'health_check', combatLogVisualEl);
        if (activatedPassiveSkill && activatedPassiveSkill.id === 'emergencyShield') {
            activeShield = { amount: activatedPassiveSkill.effect.damageAbsorption, duration: activatedPassiveSkill.effect.duration };
        }

        if (activeShield && activeShield.amount > 0) {
            const absorbed = Math.min(actualDamageToNanobot, activeShield.amount);
            actualDamageToNanobot -= absorbed; activeShield.amount -= absorbed;
            addLogEntry(`Bouclier absorbe ${absorbed} dégâts !`, "combat-visual", combatLogVisualEl, null);
            if (activeShield.amount <= 0) { addLogEntry("Bouclier d'urgence épuisé.", "combat-visual", combatLogVisualEl, null); activeShield = null; }
        }

        if (actualDamageToNanobot > 0) {
            nanobotCombatStats.currentHealth -= actualDamageToNanobot;
            screenShake(5, 150);
            if (nanobotCombatStats.focusStacks > 0 && nanobotSkills.adaptiveFocus && nanobotSkills.adaptiveFocus.resetCondition.onNanobotHit) {
                addLogEntry("<span class='skill-effect'>Concentration perdue !</span>", "combat-visual", combatLogVisualEl, null);
                nanobotCombatStats.focusStacks = 0;
            }
            if (nanobotCombatStats.activeBuffs.defensePiercing && nanobotSkills.overchargeShot?.resetOnHit) { 
                 delete nanobotCombatStats.activeBuffs.defensePiercing;
                 addLogEntry("<span class='skill-effect'>Surcharge d'arme dissipée par l'impact !</span>", "combat-visual", combatLogVisualEl, null);
            }
            nanobotCombatStats.rage = Math.min(100, (nanobotCombatStats.rage || 0) + 10);
        }
        await showDamageFloat(document.getElementById('combat-nanobot'), actualDamageToNanobot, 'damage');
        updateCombatantHealthVisual('combat-nanobot', nanobotCombatStats.currentHealth, nanobotCombatStats.health);
        addLogEntry(`${enemy.name} inflige ${actualDamageToNanobot} dégâts ${enemyDamageType}. PV Nexus-7: ${Math.max(0, Math.floor(nanobotCombatStats.currentHealth))}`, "combat-visual", combatLogVisualEl, null);
        addLogEntry(`${enemy.name} inflige ${actualDamageToNanobot} à ${enemy.name}.`, "combat", combatLogSummaryEl, gameState.combatLogSummary); // Corrigé: à Nexus-7

        if (activeShield) {
            activeShield.duration--; 
            if (activeShield.duration <= 0 && activeShield.amount > 0) {
                addLogEntry("Bouclier d'urgence se dissipe.", "combat-visual", combatLogVisualEl, null);
                activeShield = null;
            }
        }
        await sleep(COMBAT_ANIMATION_DELAY);
        if (nanobotCombatStats.currentHealth <= 0) { combatOutcome="defeat"; /*...*/ break; }
        
        // Réactiver les boutons pour le prochain tour du Nanobot
        displayCombatActions(nanobotCombatStats, currentCombatRound + 1);
    }

    gameState.nanobotStats.currentHealth = nanobotCombatStats.currentHealth;
    gameState.nanobotStats.rage = nanobotCombatStats.rage;
    gameState.nanobotStats.skillLastUsed = nanobotCombatStats.skillLastUsed || {}; 
    
    const actionsContainer = document.getElementById('combat-actions-container');
    if (actionsContainer) actionsContainer.innerHTML = '';

    if (combatOutcome === "ongoing" && currentCombatRound >= 30) { combatOutcome = "timeout"; /*...*/ }
    if(closeCombatModalBtn) closeCombatModalBtn.disabled = false;
    if(toggleSpeedBtn) toggleSpeedBtn.disabled = false;
    gameState.map.currentEnemyEncounter = null;
    if(typeof calculateNanobotStats === 'function') calculateNanobotStats();
    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays();
    
    isCombatInProgress = false;
    console.log("Combat: _simulateCombat terminé. Résultat:", combatOutcome);
    return { outcome: combatOutcome, enemyDefeated: enemy.currentHealth <= 0, nanobotDefeated: nanobotCombatStats.currentHealth <= 0, enemyData: enemy };
}

var simulateCombat = async function(enemyDetailsInput) {
    if (isCombatInProgress) {
        console.warn("Combat: simulateCombat (wrapper) - Un combat est déjà en cours. Appel ignoré.");
        return { outcome: "already_in_progress", enemyDefeated: false, nanobotDefeated: false, enemyData: enemyDetailsInput };
    }
    const combatResult = await _simulateCombat(enemyDetailsInput);
    if (combatResult.outcome === "already_in_progress" || combatResult.outcome === "nanobot_incapacitated" || combatResult.outcome === "config_error") {
        return combatResult; 
    }
    if (combatModalEl) combatModalEl.classList.add('hidden');
    if (combatResult.outcome === "victory") {
        if(combatEndTitleEl) { combatEndTitleEl.textContent = "Victoire !"; combatEndTitleEl.className = "font-orbitron text-lg mb-4 text-green-300"; }
        const rewardData = combatResult.enemyData.reward || {};
        const biomassReward = rewardData.biomass || Math.floor(combatResult.enemyData.maxHealth / 5 + combatResult.enemyData.attack);
        const naniteReward = rewardData.nanites || Math.floor(combatResult.enemyData.defense * 2 + combatResult.enemyData.attack / 2);
        const xpAmount = rewardData.xp || Math.floor(combatResult.enemyData.maxHealth / 2 + combatResult.enemyData.attack * 2 + combatResult.enemyData.defense * 3);
        if(combatEndRewardsEl) combatEndRewardsEl.innerHTML = `+${biomassReward} Biomasse<br>+${naniteReward} Nanites`;
        if (gameState && gameState.resources) { gameState.resources.biomass += biomassReward; gameState.resources.nanites += naniteReward; }
        addLogEntry(`Récompenses: +${biomassReward} Biomasse, +${naniteReward} Nanites.`, "success", combatLogSummaryEl, gameState?.combatLogSummary);
        if(typeof gainXP === 'function') gainXP(xpAmount); else console.error("La fonction gainXP n'est pas définie.");
        const lootItems = typeof generateLoot === 'function' ? generateLoot(combatResult.enemyData) : [];
        if(lootListEl) lootListEl.innerHTML = ""; 
        if (lootItems.length > 0 && typeof itemsData !== 'undefined') {
            lootItems.forEach(itemId => {
                if(typeof addToInventory === 'function') addToInventory(itemId); else console.error("addToInventory n'est pas défini.");
                const itemData = itemsData[itemId];
                if (itemData && lootListEl) { const li = document.createElement("li"); li.textContent = `🎁 ${itemData.name}`; lootListEl.appendChild(li); }
            });
        } else { if(lootListEl) lootListEl.innerHTML = "<li>Aucun butin spécifique trouvé.</li>"; }
        if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
        else if(typeof updateResourceDisplay === 'function') updateResourceDisplay();
        if(combatEndModalEl) combatEndModalEl.classList.remove('hidden');
    } else if (combatResult.outcome === "defeat") {
        if(combatEndTitleEl) { combatEndTitleEl.textContent = "Défaite..."; combatEndTitleEl.className = "font-orbitron text-lg mb-4 text-red-400"; }
        if(combatEndRewardsEl) combatEndRewardsEl.innerHTML = "Aucune récompense.";
        if(xpGainEl) xpGainEl.textContent = "+0 XP";
        if(lootListEl) lootListEl.innerHTML = "<li>Aucun butin récupéré.</li>";
        if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateXpBar === 'function') uiUpdates.updateXpBar();
        if(combatEndModalEl) combatEndModalEl.classList.remove('hidden');
    } else if (combatResult.outcome === "timeout") {
        if (typeof addLogEntry === 'function') addLogEntry("Le combat s'est terminé sans vainqueur clair.", "warning", eventLogEl, gameState?.eventLog);
    }
    if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function' && typeof explorationContentEl !== 'undefined' && explorationContentEl && !explorationContentEl.classList.contains('hidden')) {
        explorationUI.updateFullExplorationView();
    }
    return combatResult; 
};

console.log("combat.js - Fin du fichier, fonctions définies.");