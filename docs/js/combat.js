// js/combat.js
// console.log("combat.js - Fichier chargé.");

let combatSpeedMultiplier = 1; 
let COMBAT_ANIMATION_DELAY = COMBAT_ANIMATION_DELAY_BASE;

function setupCombatVisuals(nanobot, enemy) { 
    if(!combatModalEl || !combatLogVisualEl || !combatNanobotHealthbar || !combatNanobotSprite || !combatEnemyNameEl || !combatEnemyHealthbar || !combatEnemySprite) {
        console.warn("Éléments DOM manquants pour setupCombatVisuals");
        return;
    }
    combatModalEl.classList.remove('hidden'); 
    combatLogVisualEl.innerHTML = '<p class="text-gray-400">Préparation du combat...</p>'; 
    combatNanobotHealthbar.style.width = '100%'; 
    combatNanobotHealthbar.classList.remove('low'); 
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
    }
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
    }
    combatEnemyNameEl.textContent = enemy.name || "Ennemi"; 
    combatEnemyHealthbar.style.width = '100%'; 
    combatEnemyHealthbar.classList.remove('low'); 
    
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
    if(!healthBar) return;
    const percentage = Math.max(0, (maxHealth > 0 ? (currentHealth / maxHealth) : 0) * 100); 
    healthBar.style.width = `${percentage}%`; 
    healthBar.classList.toggle('low', percentage < 30); 
}

async function showDamageFloat(targetElement, damage) { 
    if(!targetElement) return;
    const damageEl = document.createElement('div'); 
    damageEl.className = 'damage-float'; 
    damageEl.textContent = `-${damage}`; 
    targetElement.appendChild(damageEl); 
    await sleep(1000 / combatSpeedMultiplier); 
    if(damageEl.parentElement) damageEl.remove(); 
} 

async function animateAttack(attackerElement, targetElement, isNanobotAttacking) { 
    if(!attackerElement || !targetElement) return;
    const originalTransform = attackerElement.style.transform; 
    const direction = isNanobotAttacking ? 1 : -1; 
    attackerElement.style.transform = `translateX(${20 * direction}px) scale(1.05)`; 
    targetElement.style.filter = 'brightness(1.5) saturate(2)'; 
    await sleep( (COMBAT_ANIMATION_DELAY / 2) ); 
    attackerElement.style.transform = originalTransform; 
    targetElement.style.filter = 'none'; 
    await sleep( (COMBAT_ANIMATION_DELAY / 2) ); 
}

function checkAndActivateSkill(skillId, nanobot, enemy, currentCombatLog) {
    if (typeof nanobotSkills === 'undefined' || typeof gameState === 'undefined' || !gameState.activeCombatSkills) {
        console.error("Dépendances manquantes pour checkAndActivateSkill (nanobotSkills ou gameState.activeCombatSkills)");
        return null;
    }
    const skill = nanobotSkills[skillId];
    if (!skill) return null;

    if (skill.cooldown > 0) {
        const lastUsed = gameState.activeCombatSkills[skillId] || 0;
        if (gameState.gameTime < lastUsed + (skill.cooldown / TICK_SPEED)) {
            return null; 
        }
    }

    let canActivate = false;
    if (skill.trigger) {
        if (skill.trigger.healthPercentBelow && nanobot.health > 0 && (nanobot.currentHealth / nanobot.health * 100) < skill.trigger.healthPercentBelow) {
            canActivate = true;
        }
        if (skill.trigger.onNanobotAttackHit && skill.id === 'adaptiveFocus') { 
            canActivate = true; 
        }
    }

    if (skill.cost) {
        if (skill.cost.rage && nanobot.rage >= skill.cost.rage) {
            canActivate = true; 
        } else if (!skill.trigger) { 
             canActivate = false;
        }
    } else if (!skill.trigger && skill.id !== 'adaptiveFocus') { 
        canActivate = true; 
    }


    if (canActivate) {
        if (skill.cost) {
            if (skill.cost.rage) nanobot.rage -= skill.cost.rage;
        }
        gameState.activeCombatSkills[skillId] = gameState.gameTime; 
        
        let activationMsg = skill.activationMessage;
        if (typeof skill.activationMessage === 'function') {
            activationMsg = skill.activationMessage(nanobot.focusStacks); 
        }
        addLogEntry(`<span class="skill-activation">${activationMsg}</span>`, "combat-visual", currentCombatLog, null);
        return skill; 
    }
    return null; 
}
        
async function _simulateCombat(enemyDetailsInput) { 
    if (!gameState || !gameState.nanobotStats || gameState.nanobotStats.currentHealth <= 0) { 
        if(typeof addLogEntry === 'function' && typeof combatLogSummaryEl !== 'undefined' && combatLogSummaryEl) addLogEntry("Nexus-7 hors combat ou état du jeu invalide.", "error", combatLogSummaryEl, gameState ? gameState.combatLogSummary : null); 
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
        reward: enemyData.reward || {biomass:0, nanites:0, xp:0}, 
        currentHealth: enemyData.health || enemyData.maxHealth || 1
    };

    let nanobotCombatStats = { ...gameState.nanobotStats }; 
    nanobotCombatStats.rage = (nanobotCombatStats.rage || 0) + 10; 
    nanobotCombatStats.focusStacks = 0; 
    let activeShield = null; 

    setupCombatVisuals(nanobotCombatStats, enemy);
    if(combatLogVisualEl) combatLogVisualEl.innerHTML = ''; 
    addLogEntry(`Affrontement avec ${enemy.name}!`, "combat-visual", combatLogVisualEl, null);
    
    await sleep(COMBAT_ANIMATION_DELAY); 
    let combatRound = 0; 
    if(closeCombatModalBtn) closeCombatModalBtn.disabled = true; 
    if(toggleSpeedBtn) toggleSpeedBtn.disabled = true; 
    let combatEnded = false;
            
    while (nanobotCombatStats.currentHealth > 0 && enemy.currentHealth > 0 && combatRound < 20) { 
        combatRound++; 
        addLogEntry(`--- Round ${combatRound} ---`, "combat-visual", combatLogVisualEl, null);
        await sleep(COMBAT_ANIMATION_DELAY / 2);

        let nanobotDamageMultiplier = 1.0;
        let nanobotAttackMessageSuffix = "";
        let nanobotFinalDamageType = DAMAGE_TYPES.KINETIC; 
        if(gameState.nanobotEquipment.weapon && itemsData[gameState.nanobotEquipment.weapon] && itemsData[gameState.nanobotEquipment.weapon].damageType){
            nanobotFinalDamageType = itemsData[gameState.nanobotEquipment.weapon].damageType;
        }

        const emergencyShieldSkill = checkAndActivateSkill('emergencyShield', nanobotCombatStats, enemy, combatLogVisualEl);
        if (emergencyShieldSkill) {
            activeShield = { amount: emergencyShieldSkill.effect.damageAbsorption, duration: emergencyShieldSkill.effect.duration };
            addLogEntry(`<span class="skill-effect">${emergencyShieldSkill.effectMessage}</span>`, "combat-visual", combatLogVisualEl, null);
        }

        const powerStrikeSkill = checkAndActivateSkill('powerStrike', nanobotCombatStats, enemy, combatLogVisualEl);
        if (powerStrikeSkill) { nanobotDamageMultiplier = powerStrikeSkill.effect.damageMultiplier; }

        addLogEntry("Nexus-7 attaque...", "combat-visual", combatLogVisualEl, null); 
        await animateAttack(document.getElementById('combat-nanobot'), document.getElementById('combat-enemy'), true);
        
        let baseDamage = nanobotCombatStats.attack;
        if (nanobotCombatStats.focusStacks > 0 && typeof nanobotSkills !== 'undefined' && nanobotSkills.adaptiveFocus) {
            baseDamage += (nanobotSkills.adaptiveFocus.effect.damageBonusPerStack * nanobotCombatStats.focusStacks);
            nanobotAttackMessageSuffix += ` (Concentration x${nanobotCombatStats.focusStacks})`;
        }

        let damageToEnemyPreDefense = calculateModifiedDamage(baseDamage * nanobotDamageMultiplier, nanobotFinalDamageType, enemy.resistances);
        let damageToEnemy = Math.max(1, Math.floor(damageToEnemyPreDefense) - enemy.defense); 
        
        enemy.currentHealth -= damageToEnemy;
        
        if (powerStrikeSkill) { addLogEntry(`<span class="skill-effect">${powerStrikeSkill.effectMessage(damageToEnemy)}</span>`, "combat-visual", combatLogVisualEl, null); }

        await showDamageFloat(document.getElementById('combat-enemy'), damageToEnemy); 
        updateCombatantHealthVisual('combat-enemy', enemy.currentHealth, enemy.maxHealth);
        addLogEntry(`Nexus-7 inflige ${damageToEnemy} dégâts ${nanobotFinalDamageType}${nanobotAttackMessageSuffix}. PV ${enemy.name}: ${Math.max(0, Math.floor(enemy.currentHealth))}`, "combat-visual", combatLogVisualEl, null); 
        addLogEntry(`Nexus-7 inflige ${damageToEnemy} à ${enemy.name}.`, "combat", combatLogSummaryEl, gameState.combatLogSummary);
        
        if(typeof nanobotSkills !== 'undefined' && nanobotSkills.adaptiveFocus){ 
            nanobotCombatStats.focusStacks = Math.min((nanobotCombatStats.focusStacks + 1), nanobotSkills.adaptiveFocus.effect.maxStacks);
            if (nanobotCombatStats.focusStacks > 0) { addLogEntry(`<span class="skill-activation">${nanobotSkills.adaptiveFocus.activationMessage(nanobotCombatStats.focusStacks)}</span>`, "combat-visual", combatLogVisualEl, null); }
        }

        nanobotCombatStats.rage = Math.min(100, (nanobotCombatStats.rage || 0) + 5); 

        await sleep(COMBAT_ANIMATION_DELAY);
        if (enemy.currentHealth <= 0) { 
            addLogEntry(`${enemy.name} détruit! Victoire!`, "success", combatLogVisualEl, null); 
            addLogEntry(`${enemy.name} détruit! Victoire!`, "success", combatLogSummaryEl, gameState.combatLogSummary); 
            if (gameState.map.currentEnemyEncounter) { 
                const {x, y} = gameState.map.currentEnemyEncounter; 
                if(gameState.map.tiles && gameState.map.tiles[y]) gameState.map.tiles[y][x] = TILE_TYPES.EMPTY; 
            } 
            combatEnded = true; break; 
        }
        
        addLogEntry(`${enemy.name} attaque...`, "combat-visual", combatLogVisualEl, null); 
        await animateAttack(document.getElementById('combat-enemy'), document.getElementById('combat-nanobot'), false);
        
        let enemyBaseAttackDamage = enemy.attack;
        let enemyDamageType = enemy.damageType || DAMAGE_TYPES.KINETIC;

        let damageToNanobotCalc = calculateModifiedDamage(enemyBaseAttackDamage, enemyDamageType, null); 
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
            if (nanobotCombatStats.focusStacks > 0 && typeof nanobotSkills !== 'undefined' && nanobotSkills.adaptiveFocus && nanobotSkills.adaptiveFocus.resetCondition.onNanobotHit) {
                addLogEntry("<span class='skill-effect'>Concentration perdue !</span>", "combat-visual", combatLogVisualEl, null);
                nanobotCombatStats.focusStacks = 0;
            }
            nanobotCombatStats.rage = Math.min(100, (nanobotCombatStats.rage || 0) + 10); 
        }

        await showDamageFloat(document.getElementById('combat-nanobot'), actualDamageToNanobot); 
        updateCombatantHealthVisual('combat-nanobot', nanobotCombatStats.currentHealth, nanobotCombatStats.health);
        addLogEntry(`${enemy.name} inflige ${actualDamageToNanobot} dégâts ${enemyDamageType}. PV Nexus-7: ${Math.max(0, Math.floor(nanobotCombatStats.currentHealth))}`, "combat-visual", combatLogVisualEl, null); 
        addLogEntry(`${enemy.name} inflige ${actualDamageToNanobot} à Nexus-7.`, "combat", combatLogSummaryEl, gameState.combatLogSummary);
        
        if (activeShield) {
            activeShield.duration--;
            if (activeShield.duration <= 0 && activeShield.amount > 0) { addLogEntry("Bouclier d'urgence se dissipe.", "combat-visual", combatLogVisualEl, null); activeShield = null; }
        }

        await sleep(COMBAT_ANIMATION_DELAY);
        if (nanobotCombatStats.currentHealth <= 0) { 
            nanobotCombatStats.currentHealth = 0; 
            addLogEntry("Nexus-7 vaincu... Retour à la base!", "error", combatLogVisualEl, null); 
            addLogEntry("Nexus-7 vaincu... Retour à la base.", "error", combatLogSummaryEl, gameState.combatLogSummary); 
            gameState.map.nanobotPos = { ...BASE_COORDINATES }; 
            gameState.nanobotStats.currentHealth = Math.max(1, Math.floor(gameState.nanobotStats.health * 0.1)); 
            addLogEntry("Systèmes critiques. Réparation d'urgence à la base.", "error", eventLogEl); 
            combatEnded = true; break; 
        }
    }

    gameState.nanobotStats.currentHealth = nanobotCombatStats.currentHealth; 
    gameState.nanobotStats.rage = nanobotCombatStats.rage; 

    if (!combatEnded && combatRound >= 20) { addLogEntry("Combat indécis. Retraite.", "warning", combatLogVisualEl, null); addLogEntry("Combat indécis.", "warning", combatLogSummaryEl, gameState.combatLogSummary); }
    
    if(closeCombatModalBtn) closeCombatModalBtn.disabled = false; 
    if(toggleSpeedBtn) toggleSpeedBtn.disabled = false; 
    gameState.map.currentEnemyEncounter = null;
    if(typeof calculateNanobotStats === 'function') calculateNanobotStats(); 
    if(typeof updateDisplays === 'function') updateDisplays(); 
}

var simulateCombat = async function(enemyDetailsInput) { 
    const enemyCombatData = enemyDetailsInput.details ? { ...enemyDetailsInput.details } : { ...enemyDetailsInput };
    enemyCombatData.health = enemyCombatData.health || enemyCombatData.maxHealth || 1;
    enemyCombatData.maxHealth = enemyCombatData.maxHealth || enemyCombatData.health || 1;
    enemyCombatData.attack = enemyCombatData.attack || 0;
    enemyCombatData.defense = enemyCombatData.defense || 0;
    enemyCombatData.name = enemyCombatData.name || "Ennemi Inconnu";
    enemyCombatData.currentHealth = enemyCombatData.health; 

    await _simulateCombat(enemyCombatData); 
    
    const enemyAttackForReward = enemyCombatData.attack;
    const enemyDefenseForReward = enemyCombatData.defense;
    const enemyMaxHealthForReward = enemyCombatData.maxHealth;

    if (enemyCombatData && gameState.nanobotStats.currentHealth > 0 && enemyCombatData.currentHealth <=0 ) { 
        if(combatEndTitleEl) combatEndTitleEl.textContent = "Victoire !";
        if(combatEndTitleEl) combatEndTitleEl.className = "font-orbitron text-lg mb-4 text-green-300";
        
        const biomassReward = enemyAttackForReward * 2; 
        const naniteReward = enemyDefenseForReward;
        if(combatEndRewardsEl) combatEndRewardsEl.innerHTML = `+${biomassReward} Biomasse<br>+${naniteReward} Nanites`;
        gameState.resources.biomass += biomassReward; gameState.resources.nanites += naniteReward;
        addLogEntry(`Récompenses: +${biomassReward} Biomasse, +${naniteReward} Nanites.`, "success", combatLogSummaryEl, gameState.combatLogSummary);
        const xpAmount = Math.floor(enemyAttackForReward + enemyDefenseForReward + (enemyMaxHealthForReward / 5)); 
        if(typeof gainXP === 'function') gainXP(xpAmount);
        
        const lootItems = typeof generateLoot === 'function' ? generateLoot(enemyCombatData) : []; 
        if(lootListEl) lootListEl.innerHTML = ""; 
        if (lootItems.length > 0) { lootItems.forEach(itemId => { addToInventory(itemId); const itemData = itemsData[itemId]; if (itemData) { const li = document.createElement("li"); li.textContent = `🎁 ${itemData.name}`; if(lootListEl) lootListEl.appendChild(li); } });
        } else { if(lootListEl) lootListEl.innerHTML = "<li>Aucun butin spécifique trouvé.</li>"; }
        
        if(typeof updateResourceDisplay === 'function') updateResourceDisplay(); 
        if(combatEndModalEl) combatEndModalEl.classList.remove('hidden');
    } else if (enemyCombatData && gameState.nanobotStats.currentHealth <= 0) { 
        if(combatEndTitleEl) combatEndTitleEl.textContent = "Défaite...";
        if(combatEndTitleEl) combatEndTitleEl.className = "font-orbitron text-lg mb-4 text-red-400";
        if(combatEndRewardsEl) combatEndRewardsEl.innerHTML = "Aucune récompense.";
        if(xpGainEl) xpGainEl.textContent = "+0 XP";
        if(lootListEl) lootListEl.innerHTML = "<li>Aucun butin récupéré.</li>";
        if(combatEndModalEl) combatEndModalEl.classList.remove('hidden'); 
    }
    if(closeCombatModalBtn) closeCombatModalBtn.disabled = false; 
    if(toggleSpeedBtn) toggleSpeedBtn.disabled = false;
};
// console.log("combat.js - Fin du fichier.");