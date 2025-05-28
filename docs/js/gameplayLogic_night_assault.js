// js/gameplayLogic_night_assault.js
console.log("gameplayLogic_night_assault.js - Fichier chargé et en cours d'analyse...");

function startNightAssault() {
    if (!window.gameState || !window.gameState.baseStats ||
        typeof window.nightAssaultEnemies === 'undefined' ||
        typeof window.bossDefinitions === 'undefined' ||
        typeof window.nightEvents === 'undefined' ||
        typeof window.SPECIAL_EVENT_CHANCE === 'undefined' ||
        typeof window.BOSS_WAVE_INTERVAL === 'undefined' ||
        typeof window.basePreviewContainerEl === 'undefined' ||
        typeof window.TICK_SPEED === 'undefined' ||
        typeof window.NIGHT_ASSAULT_CONFIG === 'undefined'
        ) {
        console.error("startNightAssault: Dépendances manquantes.");
        if(typeof addLogEntry === 'function') addLogEntry("Erreur de configuration de l'assaut.", "error", window.eventLogEl, window.gameState?.eventLog);
        return;
    }
    if (window.gameState.baseStats.currentHealth <= 0) {
        if(typeof addLogEntry === 'function') addLogEntry("Le Noyau est détruit. Impossible de subir un assaut.", "error", window.eventLogEl, window.gameState.eventLog);
        if(window.gameState.nightAssault) window.gameState.nightAssault.isActive = false;
        return;
    }

    window.gameState.nightAssault.isActive = true;
    window.gameState.nightAssault.wave = (window.gameState.nightAssault.wave || 0) + 1;
    window.gameState.nightAssault.enemies = [];
    window.gameState.nightAssault.spawnQueue = [];
    window.gameState.nightAssault.lastAttackTime = window.gameState.gameTime;
    window.gameState.nightAssault.log = [];

    if(window.nightAssaultLogEl) {
        const h3 = window.nightAssaultLogEl.querySelector('h3');
        window.nightAssaultLogEl.innerHTML = h3 ? h3.outerHTML : '<h3 class="font-orbitron text-lg mb-2 text-red-300 border-b border-gray-600 pb-1">Journal d\'Assaut Nocturne</h3>';
        window.nightAssaultLogEl.insertAdjacentHTML('beforeend', '<p class="text-gray-500 italic">En attente d\'événements...</p>');
    }
    if(typeof addLogEntry === 'function') addLogEntry(`Début de l'assaut nocturne - Vague ${window.gameState.nightAssault.wave}`, "base-info-event", window.nightAssaultLogEl, window.gameState.nightAssault.log);

    window.gameState.nightAssault.currentEvent = null;
    window.gameState.nightAssault.globalModifiers = {};

    const wave = window.gameState.nightAssault.wave;
    const previewContainer = window.basePreviewContainerEl;
    const containerContentWidth = previewContainer ? previewContainer.clientWidth : 300;
    const containerContentHeight = previewContainer ? previewContainer.clientHeight : 200;

    let isBossWave = (wave % window.BOSS_WAVE_INTERVAL === 0 && wave > 0);
    let enemySummary = "";

    if (isBossWave) {
        const bossConfig = window.bossDefinitions || window.BOSS_DATA || {};
        const bossKeys = Object.keys(bossConfig);
        if (bossKeys.length > 0) {
            const bossType = getRandomElement(bossKeys);
            const bossData = bossConfig[bossType];
            if (bossData) {
                window.gameState.nightAssault.spawnQueue.push({
                    isBoss: true,
                    id: bossData.id,
                    initialHealth: Math.floor((bossData.health || bossData.baseHealth || 500) * (1 + (wave / window.BOSS_WAVE_INTERVAL -1) * 0.3))
                });
                enemySummary = `BOSS - ${bossData.name} en approche !`;
            } else { isBossWave = false; console.warn("Boss data non trouvée pour le type:", bossType); }
        } else { isBossWave = false; }
    }

    if (!isBossWave || (isBossWave && window.NIGHT_ASSAULT_CONFIG?.spawnRegularWithBoss)) {
        let enemyCountMultiplier = 1 + (wave * 0.15);
        let enemyBaseCount = window.NIGHT_ASSAULT_CONFIG?.enemiesPerWaveBase || 3;
        let enemyCounts = {};
        const enemyTiers = window.NIGHT_ASSAULT_ENEMY_LIST || {};
        const currentTierKey = wave <= 3 ? 'tier1' : (wave <= 7 ? 'tier2' : 'tier3');
        const availableEnemyTypes = enemyTiers[currentTierKey] || enemyTiers.tier1 || [];

        if (availableEnemyTypes.length > 0) {
            for(let i = 0; i < Math.floor(enemyBaseCount * enemyCountMultiplier); i++) {
                const randomEnemyTypeId = getRandomElement(availableEnemyTypes);
                if (randomEnemyTypeId) {
                    enemyCounts[randomEnemyTypeId] = (enemyCounts[randomEnemyTypeId] || 0) + 1;
                     window.gameState.nightAssault.spawnQueue.push({ id: randomEnemyTypeId, isBoss: false });
                }
            }
        }
        if (Object.keys(enemyCounts).length > 0) {
             enemySummary += (enemySummary ? ", plus " : "") + Object.entries(enemyCounts).filter(([id,count])=> count > 0).map(([id, count]) => {
                const enemyInfo = (window.nightAssaultEnemies || []).find(e=>e.id===id) || (window.enemyData || {})[id];
                return `${count} ${enemyInfo?.name || 'Inconnu'}(s)`;
            }).join(', ');
        }
    }

    if (Math.random() < window.SPECIAL_EVENT_CHANCE && window.nightEvents.length > 0) {
        const event = getRandomElement(window.nightEvents);
        window.gameState.nightAssault.currentEvent = { id: event.id, startTime: window.gameState.gameTime, duration: event.duration };
        if (typeof event.effect === 'function') event.effect(window.gameState.nightAssault, window.gameState.baseGrid, window.gameState.defenses);
        if(typeof addLogEntry === 'function') addLogEntry(`Événement spécial: ${event.name}! ${event.description}`, "warning", window.nightAssaultLogEl, window.gameState.nightAssault.log);
    }
    if (window.gameState.nightAssault.spawnQueue.length === 0 && !isBossWave) enemySummary = "Vague de reconnaissance très faible";

    if(typeof addLogEntry === 'function') {
        addLogEntry(`ALERTE! Vague ${window.gameState.nightAssault.wave}: ${enemySummary || 'Contacts inconnus'}.`, "error", window.eventLogEl, window.gameState.eventLog);
        if(enemySummary && enemySummary !== "Vague de reconnaissance très faible") {
            addLogEntry(`Vague ${window.gameState.nightAssault.wave} en approche: ${enemySummary}.`, "base-assault-event", window.nightAssaultLogEl, window.gameState.nightAssault.log);
        }
    }
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBaseStatusDisplay === 'function') window.uiUpdates.updateBaseStatusDisplay();
}
window.startNightAssault = startNightAssault;

function endNightAssault() {
    if (!window.gameState || !window.gameState.nightAssault) { console.error("endNightAssault: gameState ou nightAssault non défini."); return; }
    window.gameState.nightAssault.isActive = false;
    if (window.gameState.nightAssault.currentEvent && window.nightEvents) {
        const eventData = window.nightEvents.find(e => e.id === window.gameState.nightAssault.currentEvent.id);
        if (eventData && typeof eventData.revertEffect === 'function') {
            eventData.revertEffect(window.gameState.nightAssault);
        }
    }
    window.gameState.nightAssault.currentEvent = null;
    window.gameState.nightAssault.globalModifiers = {};

    if (window.gameState.nightAssault.enemies.length > 0 && window.gameState.baseStats.currentHealth > 0) {
        let remainingEnemies = window.gameState.nightAssault.enemies.map(e => (e.typeInfo?.name || e.id || 'Inconnu')).join(', ');
        if(typeof addLogEntry === 'function') addLogEntry(`L'aube arrive. Les ennemis restants (${remainingEnemies}) se retirent.`, "base-defense-event", window.nightAssaultLogEl, window.gameState.nightAssault.log);
    } else if (window.gameState.baseStats.currentHealth > 0 && window.gameState.nightAssault.wave > 0) {
        if(typeof addLogEntry === 'function') addLogEntry(`Nuit ${window.gameState.nightAssault.wave} survivée ! Les défenses ont tenu.`, "success", window.nightAssaultLogEl, window.gameState.nightAssault.log);
    } else if (window.gameState.baseStats.currentHealth <=0) {
        if(typeof addLogEntry === 'function') addLogEntry(`Le Noyau a été détruit pendant la vague ${window.gameState.nightAssault.wave}.`, "error", window.nightAssaultLogEl, window.gameState.nightAssault.log);
    }
    window.gameState.nightAssault.enemies = [];
    window.gameState.nightAssault.spawnQueue = [];
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBaseStatusDisplay === 'function') window.uiUpdates.updateBaseStatusDisplay();
    if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
}
window.endNightAssault = endNightAssault;

function processNightAssaultTick() {
    if (!window.gameState || !window.gameState.nightAssault || !window.gameState.nightAssault.isActive || window.gameState.isDay) {
        return;
    }
    if (typeof window.NIGHT_ASSAULT_TICK_INTERVAL !== 'number' || typeof window.TICK_SPEED !== 'number' || typeof window.gameState.gameTime !== 'number') {
        return;
    }
   
    const gameTickDurationSeconds = window.TICK_SPEED / 1000;
    const timeSinceLastAssaultTick = (window.gameState.gameTime - (window.gameState.nightAssault.lastAttackTime || 0)); 
    const requiredTimeForAssaultTick = window.NIGHT_ASSAULT_TICK_INTERVAL * gameTickDurationSeconds;

    if (timeSinceLastAssaultTick < requiredTimeForAssaultTick && window.gameState.nightAssault.lastAttackTime !== 0) {
        return;
    }
    window.gameState.nightAssault.lastAttackTime = window.gameState.gameTime;

    if (typeof processDefenseActions === 'function') {
        processDefenseActions();
    }

    if (window.gameState.nightAssault.spawnQueue && window.gameState.nightAssault.spawnQueue.length > 0) {
        const enemyToSpawnData = window.gameState.nightAssault.spawnQueue.shift();
        let enemyTypeInfo;
        if (enemyToSpawnData.isBoss) {
            enemyTypeInfo = (typeof window.bossDefinitions !== 'undefined' && window.bossDefinitions[enemyToSpawnData.id]) ||
                            (typeof window.BOSS_DATA !== 'undefined' && window.BOSS_DATA[enemyToSpawnData.id]);
        } else {
            enemyTypeInfo = (typeof window.nightAssaultEnemies !== 'undefined' && window.nightAssaultEnemies.find(e => e.id === enemyToSpawnData.id)) ||
                            (typeof window.enemyData !== 'undefined' && window.enemyData[enemyToSpawnData.id]);
        }
        if (enemyTypeInfo) {
            const previewContainer = window.basePreviewContainerEl;
            const containerWidth = previewContainer ? previewContainer.clientWidth : 300;
            const containerHeight = previewContainer ? previewContainer.clientHeight : 200;
            const visualSize = enemyTypeInfo.visualSize || { width: 10, height: 10 };
            let startX, startY;
            const edge = Math.floor(Math.random() * 4);
            const offset = 10 + Math.max(visualSize.width, visualSize.height) / 2;
            if      (edge === 0) { startX = Math.random() * (containerWidth - visualSize.width) + (visualSize.width / 2); startY = -offset; }
            else if (edge === 1) { startX = containerWidth + offset; startY = Math.random() * (containerHeight - visualSize.height) + (visualSize.height / 2); }
            else if (edge === 2) { startX = Math.random() * (containerWidth - visualSize.width) + (visualSize.width / 2); startY = containerHeight + offset; }
            else                 { startX = -offset; startY = Math.random() * (containerHeight - visualSize.height) + (visualSize.height / 2); }

            const newEnemy = {
                id: `${enemyToSpawnData.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                typeId: enemyToSpawnData.id, isBoss: enemyToSpawnData.isBoss, x: startX, y: startY,
                currentHealth: enemyToSpawnData.initialHealth || enemyTypeInfo.health || enemyTypeInfo.baseHealth || 50,
                maxHealth: enemyToSpawnData.initialHealth || enemyTypeInfo.health || enemyTypeInfo.baseHealth || 50,
                attack: enemyTypeInfo.attack || enemyTypeInfo.baseAttack || 10,
                speed: enemyTypeInfo.speed || 2,
                attackRange: enemyTypeInfo.attackRange || (enemyTypeInfo.visualSize?.width || 10) * 1.5,
                typeInfo: enemyTypeInfo, targetCell: null, lastMoveTime: window.gameState.gameTime,
                gridTarget: null 
            };
            window.gameState.nightAssault.enemies.push(newEnemy);
            if(typeof addLogEntry === 'function') addLogEntry(`${newEnemy.typeInfo.name} est apparu !`, "base-assault-event", window.nightAssaultLogEl, window.gameState.nightAssault.log);
        }
    }

    const TILE_SIZE_IN_PIXELS = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--map-tile-effective-size')) || 22;
    const CORE_ROW = Math.floor((window.BASE_GRID_SIZE?.rows || 9) / 2);
    const CORE_COL = Math.floor((window.BASE_GRID_SIZE?.cols || 13) / 2);

    const targetX_core_pixel = CORE_COL * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;
    const targetY_core_pixel = CORE_ROW * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;


    window.gameState.nightAssault.enemies.forEach(enemy => {
        if (enemy.currentHealth <= 0) return;

        let targetX = targetX_core_pixel;
        let targetY = targetY_core_pixel;
        let attackingWall = false;
        let attackingNanobot = false;

        if (window.gameState.nanobotStats.isDefendingBase && window.gameState.nanobotStats.baseDefensePosition && window.gameState.nanobotStats.currentHealth > 0) {
            const nanobotPos = window.gameState.nanobotStats.baseDefensePosition;
            const nanobotPixelX = nanobotPos.col * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;
            const nanobotPixelY = nanobotPos.row * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;

            const dxToNanobot = nanobotPixelX - enemy.x;
            const dyToNanobot = nanobotPixelY - enemy.y;
            const distanceToNanobotSq = dxToNanobot * dxToNanobot + dyToNanobot * dyToNanobot;
            const ENEMY_AGGRO_RANGE_ON_NANOBOT_SQ = (enemy.attackRange * 1.5) * (enemy.attackRange * 1.5); 

            if (distanceToNanobotSq <= ENEMY_AGGRO_RANGE_ON_NANOBOT_SQ) {
                 if (window.gameState.nanobotStats.baseDefenseTargetEnemyId === enemy.id || Math.random() < 0.3) { 
                    targetX = nanobotPixelX;
                    targetY = nanobotPixelY;
                    attackingNanobot = true;
                    enemy.gridTarget = null; 
                 }
            }
        }

        if (!attackingNanobot && enemy.gridTarget) {
            const wallInstance = window.gameState.defenses[window.gameState.baseGrid[enemy.gridTarget.row][enemy.gridTarget.col]?.instanceId];
            if (wallInstance && wallInstance.currentHealth > 0) {
                targetX = enemy.gridTarget.col * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;
                targetY = enemy.gridTarget.row * TILE_SIZE_IN_PIXELS + TILE_SIZE_IN_PIXELS / 2;
                attackingWall = true;
            } else {
                enemy.gridTarget = null; 
            }
        }

        const dx = targetX - enemy.x; 
        const dy = targetY - enemy.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
        
        if (distanceToTarget <= enemy.attackRange) { 
            if (attackingNanobot && window.gameState.nanobotStats.currentHealth > 0) {
                let damageToNanobot = enemy.attack;
                damageToNanobot = Math.max(1, damageToNanobot - (window.gameState.nanobotStats.defense || 0));
                window.gameState.nanobotStats.currentHealth -= damageToNanobot;
                if(typeof addLogEntry === 'function') addLogEntry(`${enemy.typeInfo.name} attaque Nexus-7 (Base) pour ${damageToNanobot} PV! (Restants: ${Math.max(0, window.gameState.nanobotStats.currentHealth)})`, "base-assault-event", window.nightAssaultLogEl, window.gameState.nightAssault.log);
                
                if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.drawLaserShot === 'function') { 
                     window.uiUpdates.drawLaserShot(enemy.x, enemy.y, targetX, targetY, 'enemy');
                }

                if (window.gameState.nanobotStats.currentHealth <= 0) {
                    window.gameState.nanobotStats.currentHealth = 0;
                    if(typeof addLogEntry === 'function') addLogEntry(`Nexus-7 a été mis hors de combat par ${enemy.typeInfo.name} pendant la défense !`, "error", window.nightAssaultLogEl, window.gameState.nightAssault.log);
                    window.gameState.nanobotStats.isDefendingBase = false; 
                    window.gameState.nanobotStats.baseDefensePosition = null;
                     if(typeof window.uiUpdates !== 'undefined') {
                        if(typeof window.uiUpdates.updateBasePreview === 'function') window.uiUpdates.updateBasePreview();
                        if(typeof window.uiUpdates.updateNanobotDisplay === 'function') window.uiUpdates.updateNanobotDisplay(); 
                     }
                }
                 if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateNanobotDisplay === 'function') window.uiUpdates.updateNanobotDisplay();


            } else if (attackingWall && enemy.gridTarget) {
                const wallInstanceId = window.gameState.baseGrid[enemy.gridTarget.row][enemy.gridTarget.col]?.instanceId;
                const wallDefense = window.gameState.defenses[wallInstanceId];
                if (wallDefense && wallDefense.currentHealth > 0) {
                    let damage = enemy.attack;
                    if (window.gameState.nightAssault.globalModifiers && window.gameState.nightAssault.globalModifiers.enemyAttackFactor) {
                        damage *= window.gameState.nightAssault.globalModifiers.enemyAttackFactor;
                    }
                    damage = Math.max(1, Math.floor(damage));
                    wallDefense.currentHealth -= damage;
                    if(typeof addLogEntry === 'function') addLogEntry(`${enemy.typeInfo.name} attaque ${wallDefense.name} en (${enemy.gridTarget.row},${enemy.gridTarget.col}) pour ${damage} PV! (Restants: ${Math.max(0, wallDefense.currentHealth)})`, "base-assault-event", window.nightAssaultLogEl, window.gameState.nightAssault.log);
                    if (wallDefense.currentHealth <= 0) {
                        if(typeof addLogEntry === 'function') addLogEntry(`${wallDefense.name} en (${enemy.gridTarget.row},${enemy.gridTarget.col}) détruit!`, "error", window.nightAssaultLogEl, window.gameState.nightAssault.log);
                        delete window.gameState.defenses[wallInstanceId];
                        window.gameState.baseGrid[enemy.gridTarget.row][enemy.gridTarget.col] = null;
                        enemy.gridTarget = null; 
                        if(typeof calculateBaseStats === 'function') calculateBaseStats();
                        if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
                        if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBasePreview === 'function') window.uiUpdates.updateBasePreview();
                    }
                }
            } else if (window.gameState.baseStats.currentHealth > 0 && !attackingNanobot) { 
                let damage = enemy.attack;
                if (window.gameState.nightAssault.globalModifiers && window.gameState.nightAssault.globalModifiers.enemyAttackFactor) {
                    damage *= window.gameState.nightAssault.globalModifiers.enemyAttackFactor;
                }
                damage = Math.max(1, Math.floor(damage));
                window.gameState.baseStats.currentHealth -= damage;
                if(typeof addLogEntry === 'function') addLogEntry(`${enemy.typeInfo.name} attaque le Noyau pour ${damage} PV!`, "base-assault-event", window.nightAssaultLogEl, window.gameState.nightAssault.log);
                if (window.gameState.baseStats.currentHealth <= 0) {
                    window.gameState.baseStats.currentHealth = 0;
                    if(typeof addLogEntry === 'function') addLogEntry("ALERTE CRITIQUE: Le Noyau de la base a été détruit !", "error", window.eventLogEl, window.gameState.eventLog);
                    if(typeof addLogEntry === 'function') addLogEntry("DESTRUCTION DU NOYAU !", "error", window.nightAssaultLogEl, window.gameState.nightAssault.log);
                    isGamePaused = true;
                     if (typeof showModal === 'function') showModal("Défaite...", "Le noyau de votre base a été détruit. L'assaut a échoué.", () => { window.location.reload(); }, false);
                }
                 if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateBaseStatusDisplay === 'function') window.uiUpdates.updateBaseStatusDisplay();
            }
        } else { 
            const moveX = (dx / distanceToTarget) * enemy.speed; 
            const moveY = (dy / distanceToTarget) * enemy.speed;
            const nextX = enemy.x + moveX;
            const nextY = enemy.y + moveY;

            const enemyGridRow = Math.floor(nextY / TILE_SIZE_IN_PIXELS);
            const enemyGridCol = Math.floor(nextX / TILE_SIZE_IN_PIXELS);

            if (enemyGridRow >= 0 && enemyGridRow < window.BASE_GRID_SIZE.rows &&
                enemyGridCol >= 0 && enemyGridCol < window.BASE_GRID_SIZE.cols) {
                
                const cellContent = window.gameState.baseGrid[enemyGridRow]?.[enemyGridCol];
                if (cellContent && cellContent.id === 'reinforcedWall') {
                    const wallInstance = window.gameState.defenses[cellContent.instanceId];
                    if (wallInstance && wallInstance.currentHealth > 0) {
                        enemy.gridTarget = { row: enemyGridRow, col: enemyGridCol }; 
                    } else { 
                        enemy.x = nextX;
                        enemy.y = nextY;
                    }
                } else { 
                    enemy.x = nextX;
                    enemy.y = nextY;
                }
            } else { 
                 enemy.x = nextX;
                 enemy.y = nextY;
            }
        }
        enemy.lastMoveTime = window.gameState.gameTime;
    });

    window.gameState.nightAssault.enemies = window.gameState.nightAssault.enemies.filter(e => e.currentHealth > 0);
    if (window.gameState.nightAssault.spawnQueue.length === 0 && window.gameState.nightAssault.enemies.length === 0 && window.gameState.nightAssault.isActive) { 
        if(typeof addLogEntry === 'function') addLogEntry(`Vague ${window.gameState.nightAssault.wave} repoussée !`, "success", window.nightAssaultLogEl, window.gameState.nightAssault.log);
        window.gameState.nightAssault.isActive = false; 
    }
    if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.drawNightAssaultEnemiesOnPreview === 'function') {
        window.uiUpdates.drawNightAssaultEnemiesOnPreview();
    }
}
window.processNightAssaultTick = processNightAssaultTick;

function showNightAssaultVideo() {
    if (window.nightAssaultVideoContainerEl && window.nightAssaultVideoEl) {
        window.nightAssaultVideoContainerEl.classList.remove('hidden');
        window.nightAssaultVideoEl.currentTime = 0;
        window.nightAssaultVideoEl.play().catch(error => console.warn("Lecture auto de la vidéo d'assaut bloquée:", error));
    }
}
window.showNightAssaultVideo = showNightAssaultVideo;

function hideNightAssaultVideo() {
    if (window.nightAssaultVideoContainerEl && window.nightAssaultVideoEl) {
        window.nightAssaultVideoContainerEl.classList.add('hidden');
        window.nightAssaultVideoEl.pause();
    }
}
window.hideNightAssaultVideo = hideNightAssaultVideo;

function calculateModifiedDamage(baseDamage, damageType, targetResistances) {
    let modifier = 1.0;
    if (targetResistances && typeof targetResistances[damageType] === 'number') {
        modifier -= targetResistances[damageType];
    }
    return Math.max(0, Math.floor(baseDamage * modifier));
}
window.calculateModifiedDamage = calculateModifiedDamage;

console.log("gameplayLogic_night_assault.js - Fonctions d'assaut nocturne définies.");