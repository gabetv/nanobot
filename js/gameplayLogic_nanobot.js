// js/gameplayLogic_nanobot.js
console.log("gameplayLogic_nanobot.js - Fichier chargé et en cours d'analyse...");

function calculateNanobotStats() {
    if (!window.gameState || !window.gameState.nanobotStats ||
        typeof window.NANOBOT_INITIAL_STATS === 'undefined' ||
        typeof window.researchData === 'undefined' ||
        typeof window.nanobotModulesData === 'undefined' ||
        typeof window.itemsData === 'undefined'
    ) {
        return;
    }

    const stats = window.gameState.nanobotStats;

    stats.health = stats.baseHealth || (window.NANOBOT_INITIAL_STATS?.baseHealth || 100);
    stats.attack = stats.baseAttack || (window.NANOBOT_INITIAL_STATS?.baseAttack || 10);
    stats.defense = stats.baseDefense || (window.NANOBOT_INITIAL_STATS?.baseDefense || 5);
    stats.speed = stats.baseSpeed || (window.NANOBOT_INITIAL_STATS?.baseSpeed || 10);
    stats.resistances = {};

    if (window.gameState.research) {
        for (const researchId in window.gameState.research) {
            if (window.gameState.research[researchId] && window.researchData[researchId]) {
                const resData = window.researchData[researchId];
                if (resData.grantsStatBoost) {
                    for (const stat in resData.grantsStatBoost) {
                        if (stat === 'resistances' && typeof resData.grantsStatBoost.resistances === 'object') {
                            for (const resType in resData.grantsStatBoost.resistances) {
                                stats.resistances[resType] = (stats.resistances[resType] || 0) + resData.grantsStatBoost.resistances[resType];
                            }
                        } else if (stat !== 'resistances' && typeof stats[stat] === 'number') {
                            stats[stat] = (stats[stat] || 0) + resData.grantsStatBoost[stat];
                        } else if (stat === 'health' || stat === 'attack' || stat === 'defense' || stat === 'speed') {
                             stats[stat] = (stats[stat] || 0) + resData.grantsStatBoost[stat];
                        }
                    }
                }
            }
        }
    }

    if (window.gameState.nanobotModuleLevels) {
        for (const moduleId in window.gameState.nanobotModuleLevels) {
            const currentLevel = window.gameState.nanobotModuleLevels[moduleId];
            if (currentLevel > 0) {
                const moduleData = window.nanobotModulesData[moduleId];
                if (moduleData && moduleData.levels && moduleData.levels[currentLevel - 1]) {
                    const levelStats = moduleData.levels[currentLevel - 1].statBoost;
                    if (levelStats) {
                        for (const stat in levelStats) {
                            if (stat === 'resistances' && typeof levelStats.resistances === 'object') {
                                for (const resType in levelStats.resistances) {
                                    stats.resistances[resType] = (stats.resistances[resType] || 0) + levelStats.resistances[resType];
                                }
                            } else if (stat !== 'resistances' && typeof stats[stat] === 'number') {
                                stats[stat] = (stats[stat] || 0) + levelStats[stat];
                            } else if (stat === 'health' || stat === 'attack' || stat === 'defense' || stat === 'speed') {
                                 stats[stat] = (stats[stat] || 0) + levelStats[stat];
                            }
                        }
                    }
                }
            }
        }
    }

    if (window.gameState.nanobotEquipment) {
        for (const slot in window.gameState.nanobotEquipment) {
            const itemId = window.gameState.nanobotEquipment[slot];
            if (itemId && window.itemsData[itemId] && window.itemsData[itemId].statBoost) {
                const item = window.itemsData[itemId];
                if (typeof item.effects_on_use === 'undefined' && !item.consumable) {
                    for (const stat in item.statBoost) {
                        if (stat === 'resistances' && typeof item.statBoost.resistances === 'object') {
                            for (const resType in item.statBoost.resistances) {
                                stats.resistances[resType] = (stats.resistances[resType] || 0) + item.statBoost.resistances[resType];
                            }
                        } else if (stat !== 'resistances' && typeof stats[stat] === 'number') {
                            stats[stat] = (stats[stat] || 0) + item.statBoost[stat];
                        } else if (stat === 'health' || stat === 'attack' || stat === 'defense' || stat === 'speed') {
                            stats[stat] = (stats[stat] || 0) + item.statBoost[stat];
                        }
                    }
                }
            }
        }
    }
    stats.currentHealth = Math.min(stats.currentHealth, stats.health);
    if (stats.currentHealth < 0) stats.currentHealth = 0;
}
window.calculateNanobotStats = calculateNanobotStats;

function upgradeNanobotModule(moduleId) {
    if (typeof window.nanobotModulesData === 'undefined' || typeof window.itemsData === 'undefined' || typeof window.gameState === 'undefined') {
        console.error("upgradeNanobotModule: Dépendances non définies.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur de configuration des modules.", "error", window.eventLogEl, window.gameState?.eventLog);
        return;
    }
    const moduleData = window.nanobotModulesData[moduleId];
    if (!moduleData) { if(typeof addLogEntry === 'function') addLogEntry("Module inconnu.", "error", window.eventLogEl, window.gameState.eventLog); return; }

    let currentLevel = window.gameState.nanobotModuleLevels[moduleId] || 0;
    let isReplacedByActiveHigher = false;
    for (const checkId in window.nanobotModulesData) {
        if (window.nanobotModulesData[checkId].replaces === moduleId && window.gameState.nanobotModuleLevels[checkId] > 0) {
            isReplacedByActiveHigher = true; break;
        }
    }
    if(isReplacedByActiveHigher){
        if(typeof addLogEntry === 'function') addLogEntry(`Impossible d'améliorer ${moduleData.name}, il est déjà remplacé par une version supérieure.`, "warning", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    if (!moduleData.levels || currentLevel >= moduleData.levels.length) {
        if(typeof addLogEntry === 'function') addLogEntry(`${moduleData.name} est déjà au niveau maximum.`, "info", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    const costData = currentLevel === 0 ? moduleData.levels[0].costToUnlockOrUpgrade : moduleData.levels[currentLevel].costToUpgrade;
    if (!costData) {
         if(typeof addLogEntry === 'function') addLogEntry(`Coût non défini pour améliorer ${moduleData.name}.`, "error", window.eventLogEl, window.gameState.eventLog);
         return;
    }
    for(const resourceId in costData) {
        const requiredAmount = costData[resourceId];
        if (window.itemsData[resourceId]) {
            const countInInventory = window.gameState.inventory.filter(itemId => itemId === resourceId).length;
            if (countInInventory < requiredAmount) { if(typeof addLogEntry === 'function') addLogEntry(`Manque de ${window.itemsData[resourceId].name} (x${requiredAmount}) pour ${moduleData.name}.`, "error", window.eventLogEl, window.gameState.eventLog); return; }
        } else {
            if ((window.gameState.resources[resourceId] || 0) < requiredAmount) { if(typeof addLogEntry === 'function') addLogEntry(`Ressources (${resourceId}) insuffisantes pour ${moduleData.name}. Requis: ${requiredAmount}.`, "error", window.eventLogEl, window.gameState.eventLog); return; }
        }
    }
    for(const resourceId in costData) {
        const paidAmount = costData[resourceId];
        if (window.itemsData[resourceId]) { for (let i = 0; i < paidAmount; i++) { if(typeof removeFromInventory === 'function') removeFromInventory(resourceId); else console.error("removeFromInventory non défini"); }
        } else { window.gameState.resources[resourceId] -= paidAmount; }
    }
    if (moduleData.replaces && window.gameState.nanobotModuleLevels[moduleData.replaces]) {
        const replacedModuleId = moduleData.replaces;
        if(typeof addLogEntry === 'function') addLogEntry(`${window.nanobotModulesData[replacedModuleId].name} désactivé et remplacé par ${moduleData.name}.`, "info", window.eventLogEl, window.gameState.eventLog);
        delete window.gameState.nanobotModuleLevels[replacedModuleId];
    }
    window.gameState.nanobotModuleLevels[moduleId] = currentLevel + 1;
    const actionText = currentLevel === 0 ? "activé/fabriqué" : "amélioré";
    if(typeof addLogEntry === 'function') addLogEntry(`${moduleData.name} ${actionText} au Niveau ${currentLevel + 1}!`, "success", window.eventLogEl, window.gameState.eventLog);

    if(typeof calculateNanobotStats === 'function') calculateNanobotStats();
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();

    if (typeof window.questController !== 'undefined' && typeof window.questController.checkAllQuestsProgress === 'function') {
        window.questController.checkAllQuestsProgress();
    }
}
window.upgradeNanobotModule = upgradeNanobotModule;

function gainXP(amount) {
    if (!window.gameState || !window.gameState.nanobotStats) { console.error("gainXP: gameState.nanobotStats non défini."); return null; }
    let stats = window.gameState.nanobotStats;
    stats.xp = (stats.xp || 0) + amount;
    let leveledUp = false;
    let newLevel = stats.level;
    const xpThresholds = window.LEVEL_XP_THRESHOLDS;
    if (!xpThresholds) { console.error("LEVEL_XP_THRESHOLDS non défini."); return null; }

    if (typeof stats.xpToNext === 'undefined' && stats.level > 0 && stats.level <= xpThresholds.length) {
        stats.xpToNext = xpThresholds[stats.level - 1];
    } else if (typeof stats.xpToNext === 'undefined') {
        stats.xpToNext = Infinity;
    }

    while (stats.xpToNext > 0 && stats.xpToNext !== Infinity && stats.xp >= stats.xpToNext) {
        stats.xp -= stats.xpToNext;
        stats.level++;
        newLevel = stats.level;
        leveledUp = true;
        if (stats.level <= xpThresholds.length) {
            stats.xpToNext = xpThresholds[stats.level - 1];
        } else {
            stats.xpToNext = Infinity;
        }
        if(typeof addLogEntry === 'function') addLogEntry("Niveau Nanobot atteint: " + stats.level + "!", "success", window.eventLogEl, window.gameState.eventLog);
        stats.baseHealth = (stats.baseHealth || 100) + 10;
        stats.baseAttack = (stats.baseAttack || 10) + 2;
        stats.baseDefense = (stats.baseDefense || 5) + 1;

        // Déblocage des skills
        if (typeof window.NANOBOT_SKILLS_CONFIG !== 'undefined' && typeof gameState.nanobotSkills !== 'undefined') {
            for (const skillId in window.NANOBOT_SKILLS_CONFIG) {
                const skillConfig = window.NANOBOT_SKILLS_CONFIG[skillId];
                if (skillConfig.unlock && skillConfig.unlock.level === stats.level) {
                    if (!gameState.nanobotSkills[skillId]) { // S'il n'est pas déjà débloqué
                        gameState.nanobotSkills[skillId] = { cooldownRemaining: 0 }; // Initialiser avec cooldown à 0
                        if(typeof addLogEntry === 'function') addLogEntry(`Nouvelle capacité apprise: ${skillConfig.name}!`, "success", window.eventLogEl, window.gameState.eventLog);
                    }
                }
            }
        }

        if(typeof calculateNanobotStats === 'function') calculateNanobotStats();
    }
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateXpBar === 'function') window.uiUpdates.updateXpBar();
    if (leveledUp && typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateNanobotDisplay === 'function') window.uiUpdates.updateNanobotDisplay();
    return { leveledUp: leveledUp, newLevel: newLevel, currentXp: stats.xp, xpToNext: stats.xpToNext };
}
window.gainXP = gainXP;

// Doit être défini avant son utilisation dans toggleNanobotDefendBase
const NANOBOT_BASE_PATROL_POINTS = (typeof window.BASE_GRID_SIZE !== 'undefined' && window.BASE_GRID_SIZE.rows && window.BASE_GRID_SIZE.cols) ? [
    { row: Math.floor(window.BASE_GRID_SIZE.rows / 2) - 2, col: Math.floor(window.BASE_GRID_SIZE.cols / 2) }, // Nord
    { row: Math.floor(window.BASE_GRID_SIZE.rows / 2), col: Math.floor(window.BASE_GRID_SIZE.cols / 2) + 2 }, // Est
    { row: Math.floor(window.BASE_GRID_SIZE.rows / 2) + 2, col: Math.floor(window.BASE_GRID_SIZE.cols / 2) }, // Sud
    { row: Math.floor(window.BASE_GRID_SIZE.rows / 2), col: Math.floor(window.BASE_GRID_SIZE.cols / 2) - 2 }, // Ouest
] : []; // Tableau vide si BASE_GRID_SIZE n'est pas prêt (devrait être initialisé avant)
window.NANOBOT_BASE_PATROL_POINTS = NANOBOT_BASE_PATROL_POINTS;


function toggleNanobotDefendBase() {
    if (!window.gameState || !window.gameState.nanobotStats || typeof window.BASE_GRID_SIZE === 'undefined') {
        console.error("toggleNanobotDefendBase: gameState, nanobotStats ou BASE_GRID_SIZE manquants.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur système : Impossible de basculer le mode défense.", "error", window.eventLogEl, window.gameState?.eventLog);
        return;
    }

    window.gameState.nanobotStats.isDefendingBase = !window.gameState.nanobotStats.isDefendingBase;

    if (window.gameState.nanobotStats.isDefendingBase) {
        if (NANOBOT_BASE_PATROL_POINTS.length > 0) {
            let initialPatrolPoint = NANOBOT_BASE_PATROL_POINTS[0];
            let r = initialPatrolPoint.row;
            let c = initialPatrolPoint.col;

            // S'assurer que la grille de base est initialisée et que la case de patrouille est valide
            if (window.gameState.baseGrid && window.gameState.baseGrid[r] && 
                r >= 0 && r < window.BASE_GRID_SIZE.rows && 
                c >= 0 && c < window.BASE_GRID_SIZE.cols &&
                !window.gameState.baseGrid[r][c]) { // Vérifie si la case est vide (null)
                window.gameState.nanobotStats.baseDefensePosition = { ...initialPatrolPoint };
                window.gameState.nanobotStats.baseDefensePatrolIndex = 0;
            } else { 
                const coreRow = Math.floor(window.BASE_GRID_SIZE.rows / 2);
                const coreCol = Math.floor(window.BASE_GRID_SIZE.cols / 2);
                const adjacents = [
                    {r: coreRow-1, c: coreCol}, {r: coreRow+1, c: coreCol}, 
                    {r: coreRow, c: coreCol-1}, {r: coreRow, c: coreCol+1}
                ];
                let foundSpot = false;
                for (const spot of adjacents) {
                    if (window.gameState.baseGrid && window.gameState.baseGrid[spot.r] &&
                        spot.r >= 0 && spot.r < window.BASE_GRID_SIZE.rows && 
                        spot.c >= 0 && spot.c < window.BASE_GRID_SIZE.cols &&
                        !window.gameState.baseGrid[spot.r][spot.c]) {
                        window.gameState.nanobotStats.baseDefensePosition = { row: spot.r, col: spot.c };
                        window.gameState.nanobotStats.baseDefensePatrolIndex = 0; 
                        foundSpot = true;
                        break;
                    }
                }
                if (!foundSpot) {
                    console.warn("Impossible de trouver une case vide pour placer le Nanobot en défense.");
                    window.gameState.nanobotStats.baseDefensePosition = null;
                }
            }
        } else {
            window.gameState.nanobotStats.baseDefensePosition = null; 
            console.warn("Aucun point de patrouille défini pour la défense du Nanobot.");
        }
        window.gameState.nanobotStats.baseDefenseTargetEnemyId = null;
        window.gameState.nanobotStats.baseDefenseLastActionTime = window.gameState.gameTime;

        if(typeof addLogEntry === 'function') addLogEntry(`Nexus-7 se déploie pour défendre le noyau.`, 'system', window.eventLogEl, window.gameState.eventLog);
    } else {
        if(typeof addLogEntry === 'function') addLogEntry(`Nexus-7 revient en mode autonome.`, 'system', window.eventLogEl, window.gameState.eventLog);
        window.gameState.nanobotStats.baseDefensePosition = null;
        window.gameState.nanobotStats.baseDefenseTargetEnemyId = null;
    }
    
    const btn = window.toggleNanobotDefendBaseBtn;
    if (btn) {
        btn.innerHTML = `<i class="ti ti-home-shield mr-2"></i>${window.gameState.nanobotStats.isDefendingBase ? "Nexus-7 Déf. Noyau" : "Nexus-7 Autonome"}`;
        btn.classList.toggle('btn-success', window.gameState.nanobotStats.isDefendingBase);
        btn.classList.toggle('btn-secondary', !window.gameState.nanobotStats.isDefendingBase);
    }
    
    if(typeof calculateBaseStats === 'function') calculateBaseStats(); 
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBaseStatusDisplay === 'function') window.uiUpdates.updateBaseStatusDisplay(); 
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBasePreview === 'function') window.uiUpdates.updateBasePreview(); 
}
window.toggleNanobotDefendBase = toggleNanobotDefendBase;


console.log("gameplayLogic_nanobot.js - Fonctions liées au Nanobot définies.");