// js/combat.js                                               //
console.log("combat.js - VERIFICATION SYNTAXE");
var combatSpeedMultiplier = 1;
var COMBAT_ANIMATION_DELAY = 700; // Valeur simple pour le test
function setupCombatVisuals(nanobot, enemy) {
    // console.log("Combat: setupCombatVisuals - Nanobot:", JSON.parse(JSON.stringify(nanobot)), "Ennemi:", JSON.parse(JSON.stringify(enemy)));
    if(!combatModalEl || !combatLogVisualEl || !combatNanobotHealthbar || !combatNanobotSprite || !combatEnemyNameEl || !combatEnemyHealthbar || !combatEnemySprite) {
        console.warn("Combat: setupCombatVisuals - Éléments DOM manquants.");
        return;
    }
    if (!gameState || typeof nanobotModulesData === 'undefined' || typeof itemsData === 'undefined') {
        console.warn("Combat: setupCombatVisuals - gameState, nanobotModulesData ou itemsData non défini.");
        // Peut continuer, mais les visuels du nanobot pourraient être incomplets
    }

    combatModalEl.classList.remove('hidden');
    combatLogVisualEl.innerHTML = '<p class="text-gray-400">Préparation du combat...</p>';
    combatNanobotHealthbar.style.width = '100%';
    combatNanobotHealthbar.classList.remove('low', 'medium');
    combatNanobotSprite.innerHTML = '';

    if (gameState && gameState.nanobotModuleLevels && typeof nanobotModulesData !== 'undefined') {
        for (const moduleId in gameState.nanobotModuleLevels) {
            const currentLevel = gameState.nanobotModuleLevels[moduleId];
            if (currentLevel > 0) {
                const moduleData = nanobotModulesData[moduleId];
                if (moduleData) {
                    if (moduleData.visualClass) { const visualEl = document.createElement('div'); visualEl.className = `nanobot-module ${moduleData.visualClass}`; combatNanobotSprite.appendChild(visualEl); }
                    else if (moduleData.visualClasses) { moduleData.visualClasses.forEach(className => { const visualEl = document.createElement('div'); visualEl.className = `nanobot-module ${className}`; combatNanobotSprite.appendChild(visualEl); }); }
                }
            }
        }
    } else { /* console.warn("setupCombatVisuals: gameState.nanobotModuleLevels ou nanobotModulesData non défini."); */ }

    if (gameState && gameState.nanobotEquipment && typeof itemsData !== 'undefined') {
        for (const slot in gameState.nanobotEquipment) {
            const itemId = gameState.nanobotEquipment[slot];
            if (itemId && itemsData[itemId] && itemsData[itemId].visualClass) {
                const item = itemsData[itemId];
                const visualEl = document.createElement('div');
                visualEl.className = `nanobot-item-visual ${item.visualClass}`;
                combatNanobotSprite.appendChild(visualEl);
            }
        }
    } else { /* console.warn("setupCombatVisuals: gameState.nanobotEquipment ou itemsData non défini."); */ }

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
    if(!healthBar) { return; }
    const percentage = Math.max(0, (maxHealth > 0 ? (currentHealth / maxHealth) : 0) * 100);
    healthBar.style.width = `${percentage}%`;
    healthBar.classList.remove('low', 'medium');
    if (percentage < 30) healthBar.classList.add('low');
    else if (percentage < 60) healthBar.classList.add('medium');
}

async function showDamageFloat(targetElement, damage, type = 'damage') {
    if(!targetElement) return;
    const floatEl = document.createElement('div');
    floatEl.className = 'damage-float';

    if (type === 'damage' && damage > 0) {
        floatEl.textContent = `-${damage}`;
        floatEl.style.color = '#e53e3e';
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
    if (typeof combatSpeedMultiplier === 'undefined') window.combatSpeedMultiplier = 1; // Fallback
    await sleep(1000 / combatSpeedMultiplier);
    if(floatEl.parentElement) floatEl.remove();
}

async function animateAttack(attackerElement, targetElement, isNanobotAttacking) {
    if(!attackerElement || !targetElement) return;
    const originalTransform = attackerElement.style.transform;
    const direction = isNanobotAttacking ? 1 : -1;
    attackerElement.style.transform = `translateX(${20 * direction}px) scale(1.05)`;
    targetElement.style.filter = 'brightness(1.5) saturate(2)';
    let currentCombatAnimDelay = typeof COMBAT_ANIMATION_DELAY !== 'undefined' ? COMBAT_ANIMATION_DELAY : 700;
    await sleep( (currentCombatAnimDelay / 2) );
    attackerElement.style.transform = originalTransform;
    targetElement.style.filter = 'none';
    await sleep( (currentCombatAnimDelay / 2) );
}

function checkAndActivateSkill(skillId, combatant, opponent, currentCombatLog) {
    if (typeof nanobotSkills === 'undefined' || typeof gameState === 'undefined' || !gameState.activeCombatSkills) {
        console.error("Combat: Dépendances manquantes pour checkAndActivateSkill.");
        return null;
    }
    const skill = nanobotSkills[skillId];
    if (!skill) { /* console.warn(`Combat: Compétence ${skillId} non trouvée dans nanobotSkills.`); */ return null; }

    if (skill.cooldown > 0) { // cooldown est en ticks
        const lastUsedTick = gameState.activeCombatSkills[skillId] || 0;
        if (gameState.gameTime < lastUsedTick + skill.cooldown) {
            return null;
        }
    }

    let canActivate = false;
    if (skill.trigger) {
        if (skill.trigger.healthPercentBelow && combatant.currentHealth > 0 && (combatant.currentHealth / combatant.health * 100) < skill.trigger.healthPercentBelow) {
            canActivate = true;
        }
        if (skill.trigger.onNanobotAttackHit && skill.id === 'adaptiveFocus') { // Cas spécifique pour adaptiveFocus
            canActivate = true;
        }
    }

    if (skill.cost) {
        if (skill.cost.rage && combatant.rage >= skill.cost.rage) {
            canActivate = canActivate || true;
        } else if (!skill.trigger) { // Si pas de trigger et coût non satisfait
             canActivate = false;
        }
    } else if (!skill.trigger && skill.id !== 'adaptiveFocus') { // Compétence sans coût ni trigger (sauf adaptiveFocus)
        canActivate = true;
    }


    if (canActivate) {
        if (skill.cost) {
            if (skill.cost.rage) combatant.rage -= skill.cost.rage;
        }
        gameState.activeCombatSkills[skillId] = gameState.gameTime;

        let activationMsg = skill.activationMessage;
        if (typeof skill.activationMessage === 'function') {
            activationMsg = skill.activationMessage(combatant.focusStacks);
        }
        addLogEntry(`<span class="skill-activation">${activationMsg}</span>`, "combat-visual", currentCombatLog, null);
        return skill;
    }
    return null;
}

var isCombatInProgress = false; // Utiliser var pour la portée globale, car _simulateCombat l'utilise aussi

async function _simulateCombat(enemyDetailsInput) {
    console.log("Combat: _simulateCombat appelé avec:", JSON.parse(JSON.stringify(enemyDetailsInput)));
    if (isCombatInProgress) {
        console.warn("Combat: _simulateCombat - Un combat est déjà en cours. Nouvel appel ignoré.");
        return; // Important de retourner pour ne pas lancer un deuxième combat
    }
    isCombatInProgress = true;

    if (!gameState || !gameState.nanobotStats || gameState.nanobotStats.currentHealth <= 0) {
        if (typeof addLogEntry === 'function') addLogEntry("Nexus-7 hors combat ou état du jeu invalide.", "error", combatLogSummaryEl, gameState?.combatLogSummary);
        isCombatInProgress = false;
        return;
    }
    // Vérifier les dépendances critiques de config.js
    if (typeof DAMAGE_TYPES === 'undefined' || typeof itemsData === 'undefined' || typeof nanobotSkills === 'undefined' || typeof ZONE_DATA === 'undefined' || typeof BASE_COORDINATES === 'undefined' || typeof TILE_TYPES === 'undefined') {
        console.error("Combat: _simulateCombat - Dépendances de config manquantes.");
        if (typeof addLogEntry === 'function') addLogEntry("Erreur de configuration de combat.", "error", combatLogSummaryEl, gameState?.combatLogSummary);
        isCombatInProgress = false;
        return;
    }

    const enemyData = enemyDetailsInput.details ? { ...enemyDetailsInput.details } : { ...enemyDetailsInput };
    const enemy = {
        name: enemyData.name || "Ennemi Inconnu",
        health: enemyData.health || 1,
        maxHealth: enemyData.maxHealth || enemyData.health || 1,
        attack: enemyData.attack || 0,
        defense: enemyData.defense || 0,
        color: enemyData.color || '#e53e3e',
        spritePath: enemyData.spritePath || null,
        damageType: enemyData.damageType || DAMAGE_TYPES.KINETIC,
        resistances: enemyData.resistances || {},
        reward: enemyData.reward || {biomass:0, nanites:0, xp:0, loot:[]},
        currentHealth: enemyData.health || enemyData.maxHealth || 1
    };
    // console.log("Combat: Stats de l'ennemi pour le combat:", JSON.parse(JSON.stringify(enemy)));


    let nanobotCombatStats = JSON.parse(JSON.stringify(gameState.nanobotStats));
    nanobotCombatStats.rage = (nanobotCombatStats.rage || 0) + 10;
    nanobotCombatStats.focusStacks = 0;
    let activeShield = null;

    setupCombatVisuals(nanobotCombatStats, enemy);
    if(combatLogVisualEl) combatLogVisualEl.innerHTML = '';
    addLogEntry(`Affrontement avec ${enemy.name}!`, "combat-visual", combatLogVisualEl, null);

    if (typeof COMBAT_ANIMATION_DELAY === 'undefined') COMBAT_ANIMATION_DELAY = 700;
    await sleep(COMBAT_ANIMATION_DELAY);
    let combatRound = 0;
    if(closeCombatModalBtn) closeCombatModalBtn.disabled = true;
    if(toggleSpeedBtn) toggleSpeedBtn.disabled = true;
    let combatEnded = false;

    while (nanobotCombatStats.currentHealth > 0 && enemy.currentHealth > 0 && combatRound < 20) {
        combatRound++;
        // console.log(`Combat: --- Round ${combatRound} --- Nanobot PV: ${nanobotCombatStats.currentHealth}, Ennemi PV: ${enemy.currentHealth}`);
        addLogEntry(`--- Round ${combatRound} ---`, "combat-visual", combatLogVisualEl, null);
        await sleep(COMBAT_ANIMATION_DELAY / 2);

        let nanobotDamageMultiplier = 1.0;
        let nanobotAttackMessageSuffix = "";
        let nanobotFinalDamageType = DAMAGE_TYPES.KINETIC;
        if(gameState.nanobotEquipment.weapon && itemsData[gameState.nanobotEquipment.weapon] && itemsData[gameState.nanobotEquipment.weapon].damageType){
            nanobotFinalDamageType = itemsData[gameState.nanobotEquipment.weapon].damageType;
        }

        const emergencyShieldSkill = checkAndActivateSkill('emergencyShield', nanobotCombatStats, enemy, combatLogVisualEl);
        if (emergencyShieldSkill && nanobotSkills.emergencyShield) {
            activeShield = { amount: emergencyShieldSkill.effect.damageAbsorption, duration: emergencyShieldSkill.effect.duration };
            addLogEntry(`<span class="skill-effect">${nanobotSkills.emergencyShield.effectMessage}</span>`, "combat-visual", combatLogVisualEl, null);
        }

        const powerStrikeSkill = checkAndActivateSkill('powerStrike', nanobotCombatStats, enemy, combatLogVisualEl);
        if (powerStrikeSkill) { nanobotDamageMultiplier = powerStrikeSkill.effect.damageMultiplier; }

        addLogEntry("Nexus-7 attaque...", "combat-visual", combatLogVisualEl, null);
        await animateAttack(document.getElementById('combat-nanobot'), document.getElementById('combat-enemy'), true);

        let baseDamage = nanobotCombatStats.attack;
        if (nanobotCombatStats.focusStacks > 0 && nanobotSkills.adaptiveFocus) {
            baseDamage += (nanobotSkills.adaptiveFocus.effect.damageBonusPerStack * nanobotCombatStats.focusStacks);
            nanobotAttackMessageSuffix += ` (Concentration x${nanobotCombatStats.focusStacks})`;
        }

        let damageToEnemyPreDefense = calculateModifiedDamage(baseDamage * nanobotDamageMultiplier, nanobotFinalDamageType, enemy.resistances);
        let damageToEnemy = Math.max(1, Math.floor(damageToEnemyPreDefense) - enemy.defense);

        enemy.currentHealth -= damageToEnemy;

        if (powerStrikeSkill) { addLogEntry(`<span class="skill-effect">${powerStrikeSkill.effectMessage(damageToEnemy)}</span>`, "combat-visual", combatLogVisualEl, null); }

        await showDamageFloat(document.getElementById('combat-enemy'), damageToEnemy, 'damage');
        updateCombatantHealthVisual('combat-enemy', enemy.currentHealth, enemy.maxHealth);
        addLogEntry(`Nexus-7 inflige ${damageToEnemy} dégâts ${nanobotFinalDamageType}${nanobotAttackMessageSuffix}. PV ${enemy.name}: ${Math.max(0, Math.floor(enemy.currentHealth))}`, "combat-visual", combatLogVisualEl, null);
        addLogEntry(`Nexus-7 inflige ${damageToEnemy} à ${enemy.name}.`, "combat", combatLogSummaryEl, gameState.combatLogSummary);

        const adaptiveFocusSkill = checkAndActivateSkill('adaptiveFocus', nanobotCombatStats, enemy, combatLogVisualEl);
        if(adaptiveFocusSkill && nanobotSkills.adaptiveFocus){
            nanobotCombatStats.focusStacks = Math.min((nanobotCombatStats.focusStacks + 1), nanobotSkills.adaptiveFocus.effect.maxStacks);
            if (nanobotCombatStats.focusStacks > 0) {
                 addLogEntry(`<span class="skill-activation">${nanobotSkills.adaptiveFocus.activationMessage(nanobotCombatStats.focusStacks)}</span>`, "combat-visual", combatLogVisualEl, null);
            }
        }

        nanobotCombatStats.rage = Math.min(100, (nanobotCombatStats.rage || 0) + 5);

        await sleep(COMBAT_ANIMATION_DELAY);
        if (enemy.currentHealth <= 0) {
            addLogEntry(`${enemy.name} détruit! Victoire!`, "success", combatLogVisualEl, null);
            addLogEntry(`${enemy.name} détruit! Victoire!`, "success", combatLogSummaryEl, gameState.combatLogSummary);
            if (gameState.map.currentEnemyEncounter && TILE_TYPES) { // Vérifier TILE_TYPES
                const {x, y} = gameState.map.currentEnemyEncounter;
                const tile = mapManager.getTile(x,y); // Utiliser mapManager pour obtenir la tuile
                if(tile) {
                    tile.actualType = TILE_TYPES.EMPTY_GRASSLAND; // ou le type de base de la tuile
                    tile.content = null;
                } else {
                    console.warn(`Combat: Impossible de trouver la tuile (${x},${y}) pour la vider après combat.`);
                }
            }
            combatEnded = true; break;
        }

        addLogEntry(`${enemy.name} attaque...`, "combat-visual", combatLogVisualEl, null);
        await animateAttack(document.getElementById('combat-enemy'), document.getElementById('combat-nanobot'), false);

        let enemyBaseAttackDamage = enemy.attack;
        let enemyDamageType = enemy.damageType || DAMAGE_TYPES.KINETIC;

        let damageToNanobotCalc = calculateModifiedDamage(enemyBaseAttackDamage, enemyDamageType, nanobotCombatStats.resistances || {});
        damageToNanobotCalc = Math.max(1, damageToNanobotCalc - nanobotCombatStats.defense);
        let actualDamageToNanobot = damageToNanobotCalc;

        if (activeShield && activeShield.amount > 0) {
            const absorbed = Math.min(actualDamageToNanobot, activeShield.amount);
            actualDamageToNanobot -= absorbed; activeShield.amount -= absorbed;
            addLogEntry(`Bouclier absorbe ${absorbed} dégâts !`, "combat-visual", combatLogVisualEl, null);
            if (activeShield.amount <= 0) { addLogEntry("Bouclier d'urgence épuisé.", "combat-visual", combatLogVisualEl, null); activeShield = null; }
        }

        if (actualDamageToNanobot > 0) {
            nanobotCombatStats.currentHealth -= actualDamageToNanobot;
            if (nanobotCombatStats.focusStacks > 0 && nanobotSkills.adaptiveFocus && nanobotSkills.adaptiveFocus.resetCondition.onNanobotHit) {
                addLogEntry("<span class='skill-effect'>Concentration perdue !</span>", "combat-visual", combatLogVisualEl, null);
                nanobotCombatStats.focusStacks = 0;
            }
            nanobotCombatStats.rage = Math.min(100, (nanobotCombatStats.rage || 0) + 10);
        }

        await showDamageFloat(document.getElementById('combat-nanobot'), actualDamageToNanobot, 'damage');
        updateCombatantHealthVisual('combat-nanobot', nanobotCombatStats.currentHealth, nanobotCombatStats.health);
        addLogEntry(`${enemy.name} inflige ${actualDamageToNanobot} dégâts ${enemyDamageType}. PV Nexus-7: ${Math.max(0, Math.floor(nanobotCombatStats.currentHealth))}`, "combat-visual", combatLogVisualEl, null);
        addLogEntry(`${enemy.name} inflige ${actualDamageToNanobot} à Nexus-7.`, "combat", combatLogSummaryEl, gameState.combatLogSummary);

        if (activeShield) {
            activeShield.duration--; // Durée en rounds/tours
            if (activeShield.duration <= 0 && activeShield.amount > 0) {
                addLogEntry("Bouclier d'urgence se dissipe.", "combat-visual", combatLogVisualEl, null);
                activeShield = null;
            }
        }

        await sleep(COMBAT_ANIMATION_DELAY);
        if (nanobotCombatStats.currentHealth <= 0) {
            nanobotCombatStats.currentHealth = 0;
            addLogEntry("Nexus-7 vaincu... Retour à la base!", "error", combatLogVisualEl, null);
            addLogEntry("Nexus-7 vaincu... Retour à la base.", "error", combatLogSummaryEl, gameState.combatLogSummary);

            const playerBaseZoneId = 'verdant_archipelago'; // Ou la zone de base principale
            const playerBaseEntryPoint = (ZONE_DATA[playerBaseZoneId]?.entryPoint) ?
                                         {...ZONE_DATA[playerBaseZoneId].entryPoint} :
                                         ({...BASE_COORDINATES});

            gameState.map.nanobotPos = playerBaseEntryPoint;
            gameState.nanobotStats.currentHealth = Math.max(1, Math.floor(gameState.nanobotStats.health * 0.1));
            addLogEntry("Systèmes critiques. Réparation d'urgence à la base.", "error", eventLogEl, gameState.eventLog);
            combatEnded = true; break;
        }
    }

    gameState.nanobotStats.currentHealth = nanobotCombatStats.currentHealth;
    gameState.nanobotStats.rage = nanobotCombatStats.rage;

    if (!combatEnded && combatRound >= 20) {
        addLogEntry("Combat indécis. Retraite.", "warning", combatLogVisualEl, null);
        addLogEntry("Combat indécis.", "warning", combatLogSummaryEl, gameState.combatLogSummary);
    }

    if(closeCombatModalBtn) closeCombatModalBtn.disabled = false;
    if(toggleSpeedBtn) toggleSpeedBtn.disabled = false;
    gameState.map.currentEnemyEncounter = null;
    if(typeof calculateNanobotStats === 'function') calculateNanobotStats();
    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays();
    else if(typeof updateDisplays === 'function') updateDisplays(); // Fallback
    // console.log("Combat: _simulateCombat terminé.");
    isCombatInProgress = false;
}

var simulateCombat = async function(enemyDetailsInput) {
    // console.log("Combat: simulateCombat (wrapper) appelé avec:", JSON.parse(JSON.stringify(enemyDetailsInput)));
    if (isCombatInProgress) {
        console.warn("Combat: simulateCombat (wrapper) - Un combat est déjà en cours. Appel ignoré.");
        return;
    }

    const enemyCombatData = enemyDetailsInput.details ? { ...enemyDetailsInput.details } : { ...enemyDetailsInput };
    enemyCombatData.health = enemyCombatData.health || enemyCombatData.maxHealth || 1;
    enemyCombatData.maxHealth = enemyCombatData.maxHealth || enemyCombatData.health || 1;
    enemyCombatData.attack = enemyCombatData.attack || 0;
    enemyCombatData.defense = enemyCombatData.defense || 0;
    enemyCombatData.name = enemyCombatData.name || "Ennemi Inconnu";
    enemyCombatData.currentHealth = enemyCombatData.health; // S'assurer que currentHealth est initialisé

    await _simulateCombat(enemyCombatData);

    // La logique de récompense / affichage de la modale de fin de combat
    if (gameState.nanobotStats.currentHealth > 0 && enemyCombatData.currentHealth <=0 ) { // Victoire
        // console.log("Combat: Victoire !");
        if(combatEndTitleEl) combatEndTitleEl.textContent = "Victoire !";
        if(combatEndTitleEl) combatEndTitleEl.className = "font-orbitron text-lg mb-4 text-green-300";

        const rewardData = enemyCombatData.reward || {};
        const biomassReward = rewardData.biomass || Math.floor(enemyCombatData.maxHealth / 5 + enemyCombatData.attack);
        const naniteReward = rewardData.nanites || Math.floor(enemyCombatData.defense * 2 + enemyCombatData.attack / 2);
        const xpAmount = rewardData.xp || Math.floor(enemyCombatData.maxHealth / 2 + enemyCombatData.attack * 2 + enemyCombatData.defense * 3);

        if(combatEndRewardsEl) combatEndRewardsEl.innerHTML = `+${biomassReward} Biomasse<br>+${naniteReward} Nanites`;
        gameState.resources.biomass += biomassReward; gameState.resources.nanites += naniteReward;
        addLogEntry(`Récompenses: +${biomassReward} Biomasse, +${naniteReward} Nanites.`, "success", combatLogSummaryEl, gameState.combatLogSummary);

        if(typeof gainXP === 'function') gainXP(xpAmount);
        else console.error("La fonction gainXP n'est pas définie.");

        const lootItems = typeof generateLoot === 'function' ? generateLoot(enemyCombatData) : [];
        if(lootListEl) lootListEl.innerHTML = ""; // Vider la liste de butin précédente
        if (lootItems.length > 0 && typeof itemsData !== 'undefined') {
            lootItems.forEach(itemId => {
                if(typeof addToInventory === 'function') addToInventory(itemId); else console.error("addToInventory n'est pas défini.");
                const itemData = itemsData[itemId];
                if (itemData && lootListEl) {
                    const li = document.createElement("li");
                    li.textContent = `🎁 ${itemData.name}`;
                    lootListEl.appendChild(li);
                }
            });
        } else { if(lootListEl) lootListEl.innerHTML = "<li>Aucun butin spécifique trouvé.</li>"; }

        if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
        else if(typeof updateResourceDisplay === 'function') updateResourceDisplay(); // Fallback

        if(combatEndModalEl) combatEndModalEl.classList.remove('hidden');
    } else if (gameState.nanobotStats.currentHealth <= 0) { // Défaite
        // console.log("Combat: Défaite...");
        if(combatEndTitleEl) combatEndTitleEl.textContent = "Défaite...";
        if(combatEndTitleEl) combatEndTitleEl.className = "font-orbitron text-lg mb-4 text-red-400";
        if(combatEndRewardsEl) combatEndRewardsEl.innerHTML = "Aucune récompense.";
        if(xpGainEl) xpGainEl.textContent = "+0 XP";
        if(lootListEl) lootListEl.innerHTML = "<li>Aucun butin récupéré.</li>";
        if(combatEndModalEl) combatEndModalEl.classList.remove('hidden');
    }
    // isCombatInProgress est remis à false à la fin de _simulateCombat
    // et les boutons sont réactivés là-bas aussi.
    // console.log("Combat: simulateCombat (wrapper) terminé.");
};

console.log("combat.js - Fin du fichier, fonctions définies.");