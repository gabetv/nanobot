// js/main.js
console.log("main.js - Fichier chargé et en cours d'analyse...");

// --- Références DOM ---
let biomassEl, nanitesEl, energyEl, biomassRateEl, nanitesRateEl, crystalShardsEl;
let mobilityEl;
let eventLogEl, gameTimeEl, cycleStatusEl;
let modal, modalTitle, modalMessage, modalConfirm, modalCancel;
let nanobotHealthEl, nanobotAttackEl, nanobotDefenseEl, nanobotSpeedEl;
let nanobotVisualBody, equippedModulesDisplayEl, equippedItemsDisplayBriefEl;
let nanobotEquipmentSlotsEl;
let simulateCombatBtn, combatLogSummaryEl;
let combatModalEl;
let combatNanobotSprite, combatEnemySprite;
let combatNanobotHealthbar, combatEnemyHealthbar;
let combatEnemyNameEl, combatLogVisualEl;
let combatTurnIndicatorEl; 
let mapGridEl, nanobotMapPosEl, tileInfoDisplayEl, explorationTitleEl, zoneListContainerEl;
let combatEndModalEl, combatEndTitleEl, combatEndRewardsEl, xpGainEl, xpBarEl, lootListEl, closeEndModalBtn;
let inventoryListEl, shopItemsListEl;
let baseHealthDisplayEl, baseHealthValueEl, baseMaxHealthValueEl;
let overviewBaseHealthEl, baseHealthBarContainerEl, baseHealthBarEl, basePreviewContainerEl, placementInfoDivEl, selectedDefenseForPlacementSpanEl, cancelPlacementBtnEl;
let baseDefensePowerEl;
let repairBaseBtn, repairDefensesBtn, toggleNanobotDefendBaseBtn, forceCycleChangeBtn;
let nightAssaultEnemiesDisplayEl, nightAssaultLogEl;
let crystalShardsDisplayContainer;
let explorationLogEl, tileInteractionPanelEl, tileInteractionDetailsEl, tileInteractionActionsEl;
let activeQuestsListEl, completedQuestsListEl;
let nightAssaultVideoContainerEl, nightAssaultVideoEl, closeNightAssaultVideoBtnEl;
let combatCloseAftermathBtnEl;


function initDOMReferences() {
    console.log("main.js: initDOMReferences - Début");
    try {
        biomassEl=document.getElementById('biomass');
        nanitesEl=document.getElementById('nanites');
        energyEl=document.getElementById('energy');
        mobilityEl=document.getElementById('mobility'); 
        biomassRateEl=document.getElementById('biomassRate');
        nanitesRateEl=document.getElementById('nanitesRate');
        crystalShardsDisplayContainer=document.getElementById('crystal-shards-display-container');
        crystalShardsEl=document.getElementById('crystal_shards');
        eventLogEl=document.getElementById('event-log');
        gameTimeEl=document.getElementById('gameTime');
        cycleStatusEl=document.getElementById('cycleStatus');
        modal = document.getElementById('modal');
        modalTitle = document.getElementById('modal-title');
        modalMessage = document.getElementById('modal-message');
        modalConfirm = document.getElementById('modal-confirm');
        modalCancel = document.getElementById('modal-cancel');
        nanobotHealthEl=document.getElementById('nanobot-health');
        nanobotAttackEl=document.getElementById('nanobot-attack');
        nanobotDefenseEl=document.getElementById('nanobot-defense');
        nanobotSpeedEl=document.getElementById('nanobot-speed');
        nanobotVisualBody=document.getElementById('nanobot-body');
        equippedModulesDisplayEl=document.getElementById('equipped-modules-display');
        equippedItemsDisplayBriefEl = document.getElementById('equipped-items-display-brief');
        nanobotEquipmentSlotsEl = document.getElementById('nanobot-equipment-slots');
        simulateCombatBtn=document.getElementById('simulate-combat-btn');
        combatLogSummaryEl=document.getElementById('combat-log-summary');
        combatModalEl=document.getElementById('combat-modal');
        combatNanobotSprite=document.getElementById('combat-nanobot-sprite');
        combatEnemySprite=document.getElementById('combat-enemy-sprite');
        combatNanobotHealthbar=document.getElementById('combat-nanobot-healthbar');
        combatEnemyHealthbar=document.getElementById('combat-enemy-healthbar');
        combatEnemyNameEl=document.getElementById('combat-enemy-name');
        combatLogVisualEl=document.getElementById('combat-log-visual');
        combatTurnIndicatorEl = document.getElementById('combat-turn-indicator'); 
        combatCloseAftermathBtnEl = document.getElementById('combat-close-aftermath-btn');
        mapGridEl = document.getElementById('map-grid');
        nanobotMapPosEl = document.getElementById('nanobot-map-pos');
        tileInfoDisplayEl = document.getElementById('tile-info-display');
        explorationTitleEl = document.getElementById('exploration-title');
        zoneListContainerEl = document.getElementById('zone-list');
        explorationLogEl = document.getElementById('exploration-log');
        tileInteractionPanelEl = document.getElementById('tile-interaction-panel');
        tileInteractionDetailsEl = document.getElementById('tile-interaction-details');
        tileInteractionActionsEl = document.getElementById('tile-interaction-actions');
        activeQuestsListEl = document.getElementById('active-quests-list');
        completedQuestsListEl = document.getElementById('completed-quests-list');
        combatEndModalEl = document.getElementById('combat-end-modal');
        combatEndTitleEl = document.getElementById('combat-end-title');
        combatEndRewardsEl = document.getElementById('combat-end-rewards');
        xpGainEl = document.getElementById('xp-gain');
        xpBarEl = document.getElementById('xp-bar');
        lootListEl = document.getElementById('loot-list');
        closeEndModalBtn = document.getElementById('close-end-modal');
        inventoryListEl = document.getElementById("inventory-list");
        shopItemsListEl = document.getElementById("shop-items-list");
        baseHealthDisplayEl = document.getElementById('base-health-display');
        baseHealthValueEl = document.getElementById('base-health-value');
        baseMaxHealthValueEl = document.getElementById('base-max-health-value');
        overviewBaseHealthEl = document.getElementById('overview-base-health');
        baseHealthBarContainerEl = document.getElementById('base-health-bar-container');
        baseHealthBarEl = document.getElementById('base-health-bar');
        basePreviewContainerEl = document.getElementById('base-preview-container');
        placementInfoDivEl = document.getElementById('placement-info');
        selectedDefenseForPlacementSpanEl = document.getElementById('selected-defense-for-placement');
        cancelPlacementBtnEl = document.getElementById('cancel-placement-btn');
        baseDefensePowerEl = document.getElementById('base-defense-power');
        repairBaseBtn = document.getElementById('repair-base-btn');
        repairDefensesBtn = document.getElementById('repair-defenses-btn');
        toggleNanobotDefendBaseBtn = document.getElementById('toggle-nanobot-defend-base-btn');
        nightAssaultEnemiesDisplayEl = document.getElementById('night-assault-enemies-display');
        nightAssaultLogEl = document.getElementById('night-assault-log');
        forceCycleChangeBtn = document.getElementById('force-cycle-change-btn');
        nightAssaultVideoContainerEl = document.getElementById('night-assault-video-container');
        nightAssaultVideoEl = document.getElementById('night-assault-video');
        closeNightAssaultVideoBtnEl = document.getElementById('close-night-assault-video-btn');
        console.log("main.js: initDOMReferences - Références DOM initialisées.");
    } catch (e) {
        console.error("Erreur DANS initDOMReferences: ", e);
    }
}

function setupEventListeners() {
    console.log("main.js: setupEventListeners - Début");
    try {
        if (modalConfirm) modalConfirm.addEventListener('click', () => { if (modalConfirmCallback) modalConfirmCallback(); hideModal(); });
        if (modalCancel) modalCancel.addEventListener('click', () => { if(modalCancelCallback) modalCancelCallback(); hideModal(); });

        if(simulateCombatBtn && typeof simulateCombat === 'function') {
            simulateCombatBtn.addEventListener('click', () => { const testEnemy = { name: "Drone d'Entraînement", health: 40, maxHealth:40, attack: 10, defense: 3, color: '#4299e1', spritePath: 'https://placehold.co/80x100/4299e1/e2e8f0?text=TRAIN' }; simulateCombat(testEnemy); });
        } else if (!simulateCombatBtn) console.warn("main.js: setupEventListeners - simulateCombatBtn non trouvé.");
        else if (typeof simulateCombat !== 'function') console.warn("main.js: setupEventListeners - simulateCombat n'est pas une fonction.");

        if(closeEndModalBtn) closeEndModalBtn.addEventListener('click', () => { if(combatEndModalEl) combatEndModalEl.classList.add('hidden'); });
        if(repairBaseBtn && typeof repairBase === 'function') repairBaseBtn.addEventListener('click', () => repairBase(20));
        if(repairDefensesBtn && typeof repairAllDefenses === 'function') repairDefensesBtn.addEventListener('click', repairAllDefenses);
        if(toggleNanobotDefendBaseBtn && typeof toggleNanobotDefendBase === 'function') toggleNanobotDefendBaseBtn.addEventListener('click', toggleNanobotDefendBase);
        if(forceCycleChangeBtn && typeof forceCycleChange === 'function') forceCycleChangeBtn.addEventListener('click', () => forceCycleChange(false));
        if(cancelPlacementBtnEl && typeof cancelPlacementMode === 'function') cancelPlacementBtnEl.addEventListener('click', cancelPlacementMode);

        if (closeNightAssaultVideoBtnEl && typeof hideNightAssaultVideo === 'function') {
            closeNightAssaultVideoBtnEl.addEventListener('click', hideNightAssaultVideo);
        } else {
            if(!closeNightAssaultVideoBtnEl) console.warn("Bouton #close-night-assault-video-btn non trouvé.");
            if(typeof hideNightAssaultVideo !== 'function') console.warn("Fonction hideNightAssaultVideo non trouvée.");
        }
        console.log("main.js: setupEventListeners - Fin");
    } catch (e) {
        console.error("Erreur DANS setupEventListeners: ", e, e.stack);
    }
}

let gameLoopCounter = 0;
let gameIntervalId = null;

function gameLoop() {
    gameLoopCounter++;
    try {
        if (!gameState) { return; }

        if (gameState.capacity && gameState.resources && gameState.productionRates && typeof TICK_SPEED !== 'undefined') {
            if ( (gameState.capacity.energy + (gameState.resources.totalEnergyConsumed - gameState.resources.energyConsumedByDefenses) ) >= (gameState.resources.totalEnergyConsumed || 0) ) { // Vérifie si assez d'énergie pour les bâtiments NON défensifs
                gameState.resources.biomass += gameState.productionRates.biomass * (TICK_SPEED / 1000);
                gameState.resources.nanites += gameState.productionRates.nanites * (TICK_SPEED / 1000);
            }
        }
        
        if (typeof MAX_MOBILITY_POINTS !== 'undefined' && typeof MOBILITY_RECHARGE_TICKS !== 'undefined') {
            if (gameState.resources.mobility < MAX_MOBILITY_POINTS) {
                gameState.mobilityRechargeTimer = (gameState.mobilityRechargeTimer || 0) + 1; 
                if (gameState.mobilityRechargeTimer >= MOBILITY_RECHARGE_TICKS) {
                    gameState.resources.mobility = Math.min(MAX_MOBILITY_POINTS, gameState.resources.mobility + 1);
                    gameState.mobilityRechargeTimer = 0; 
                }
            } else {
                gameState.mobilityRechargeTimer = 0; 
            }
        }

        if (gameState.activeResearch && typeof researchData !== 'undefined' && researchData[gameState.activeResearch.id] && typeof buildingsData !== 'undefined' && typeof TICK_SPEED !== 'undefined') {
            const research = researchData[gameState.activeResearch.id];
            const labLevel = gameState.buildings['researchLab'] || 0;
            const researchLabData = buildingsData['researchLab'];
            let researchSpeedFactor = 0.5; // Facteur de base si le lab n'est pas trouvé ou niveau 0
            if (labLevel > 0 && researchLabData && researchLabData.levels[labLevel-1] && researchLabData.levels[labLevel-1].researchSpeedFactor) {
                researchSpeedFactor = researchLabData.levels[labLevel - 1].researchSpeedFactor;
            }
            const researchTimeInTicks = research.time * (1000 / TICK_SPEED); // Temps total en ticks nécessaire
            const actualResearchTimeTicks = researchTimeInTicks / researchSpeedFactor; // Temps ajusté par la vitesse du labo

            if (gameState.gameTime >= gameState.activeResearch.startTime + actualResearchTimeTicks) {
                addLogEntry(`Technologie ${research.name} acquise!`, "success", eventLogEl, gameState.eventLog);
                gameState.research[gameState.activeResearch.id] = true;
                if (research.grantsModule || research.grantsStatBoost) { if(typeof calculateNanobotStats === 'function') calculateNanobotStats(); }
                if (typeof ZONE_DATA !== 'undefined') {
                    for(const zoneId in ZONE_DATA) {
                        if (ZONE_DATA[zoneId].unlockCondition && ZONE_DATA[zoneId].unlockCondition.research === gameState.activeResearch.id) {
                            if (!gameState.unlockedZones.includes(zoneId)) {
                                gameState.unlockedZones.push(zoneId);
                                addLogEntry(`Nouvelle zone d'exploration débloquée: ${ZONE_DATA[zoneId].name}!`, "success", eventLogEl, gameState.eventLog);
                            }
                        }
                    }
                }
                gameState.activeResearch = null;
                if (typeof questController !== 'undefined' && typeof questController.checkAllQuestsProgress === 'function') {
                    questController.checkAllQuestsProgress();
                }
            }
        }

        let scanTilesNeedUpdate = false;
        if (typeof explorationController !== 'undefined' && typeof explorationController.updateExpiredScans === 'function') {
            if (explorationController.updateExpiredScans()) {
                scanTilesNeedUpdate = true;
            }
        }

        if (gameState.nightAssault && gameState.nightAssault.isActive && !gameState.isDay) {
            if(typeof processNightAssaultTick === 'function') processNightAssaultTick();
        }

        if(typeof updateGameTimeAndCycle === 'function') updateGameTimeAndCycle();

        if (gameLoopCounter % 3 === 0 && typeof questController !== 'undefined' && typeof questController.checkAllQuestsProgress === 'function') {
            questController.checkAllQuestsProgress();
        }

        if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') {
            uiUpdates.updateDisplays();
        }

        const explorationSubTab = document.getElementById('exploration-subtab');
        if (scanTilesNeedUpdate && explorationSubTab && explorationSubTab.classList.contains('active')) {
            if(typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') {
                 explorationUI.updateFullExplorationView();
            }
        }

        if(gameLoopCounter % 30 === 0) {
            if(typeof saveGame === 'function') saveGame();
        }

    } catch (e) {
        console.error("Erreur dans gameLoop (iteration " + gameLoopCounter + "): ", e.message, e.stack);
        if (gameIntervalId) {
            clearInterval(gameIntervalId);
            if (typeof addLogEntry === 'function' && typeof gameState !== 'undefined' && gameState.eventLog) {
                 addLogEntry("ERREUR CRITIQUE dans gameLoop.", "error", eventLogEl, gameState.eventLog);
            } else { alert("Erreur critique dans gameLoop. Voir console."); }
        }
    }
}

let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;

function init() {
    console.log(`main.js: init() - Tentative ${initAttempts + 1}`);
    initAttempts++;

    if (typeof ZONE_DATA === 'undefined' || typeof BASE_COORDINATES === 'undefined' || typeof BASE_INITIAL_HEALTH === 'undefined' || typeof TICK_SPEED === 'undefined' || typeof buildingsData === 'undefined' || typeof QUEST_STATUS === 'undefined' || typeof QUEST_DATA === 'undefined' || typeof itemsData === 'undefined' || typeof nanobotModulesData === 'undefined' || typeof researchData === 'undefined' || typeof nightAssaultEnemies === 'undefined' || typeof bossDefinitions === 'undefined' || typeof nightEvents === 'undefined' || typeof nanobotSkills === 'undefined' || typeof explorationEnemyData === 'undefined' || typeof enemyBaseDefinitions === 'undefined' || typeof MAP_FEATURE_DATA === 'undefined' || typeof DAMAGE_TYPES === 'undefined' || typeof TILE_TYPES === 'undefined' || typeof TILE_TYPES_TO_RESOURCE_KEY === 'undefined' || typeof MAX_MOBILITY_POINTS === 'undefined' || typeof MOBILITY_RECHARGE_TICKS === 'undefined') {
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            console.warn(`main.js: init() - Constantes de config.js non prêtes. Tentative ${initAttempts}/${MAX_INIT_ATTEMPTS}. Nouvel essai dans 250ms...`);
            setTimeout(init, 250);
            return;
        } else {
            console.error("ERREUR CRITIQUE: Les constantes de config.js ne sont toujours pas définies après plusieurs tentatives! Vérifiez l'ordre des scripts et les erreurs dans config.js.");
            alert("Erreur critique de configuration persistante. Le jeu ne peut pas démarrer.");
            return;
        }
    }
    console.log("main.js: init() - Toutes les constantes de config.js semblent DÉTECTÉES.");

    try {
        initDOMReferences();

        if (typeof initializeTooltipSystem === 'function') {
            initializeTooltipSystem();
            console.log("main.js: init() - Système de Tooltip initialisé.");
        } else {
            console.warn("main.js: init() - initializeTooltipSystem non trouvée.");
        }

        console.log("main.js: init() - Initialisation de gameState...");
        gameState = {
            resources: { 
                biomass: 250, nanites: 100, energy: 0, crystal_shards: 0, 
                totalEnergyConsumed: 0, energyConsumedByDefenses: 0,
                mobility: MAX_MOBILITY_POINTS
            },
            mobilityRechargeTimer: 0,
            productionRates: { biomass: 0, nanites: 0 },
            capacity: { energy: 50 },
            buildings: {}, research: {}, gameTime: 0, isDay: true, currentCycleTime: 0, deficitWarningLogged: 0,
            eventLog: ["Bienvenue au Nexus-7. Systèmes en ligne."],
            nanobotStats: {
                baseHealth: 100, currentHealth: 100, baseAttack: 10, baseDefense: 5, baseSpeed: 10,
                health: 100, attack: 10, defense: 5, speed: 10,
                level: 1, xp: 0, xpToNext: 100,
                isDefendingBase: false, rage: 0, focusStacks: 0, lastScanTime: 0,
                skillLastUsed: {}, 
                activeBuffs: {},
                resistances: {} // Assurer que resistances est initialisé
            },
            nanobotModuleLevels: {}, inventory: [],
            nanobotEquipment: { weapon: null, armor: null, utility1: null, utility2: null },
            combatLogSummary: ["Journal de combat initialisé."],
            currentZoneId: 'verdant_archipelago', unlockedZones: ['verdant_archipelago'],
            map: {
                zoneId: 'verdant_archipelago', tiles: [],
                nanobotPos: { ...(ZONE_DATA['verdant_archipelago']?.entryPoint || BASE_COORDINATES || {x:0,y:0}) },
                selectedTile: null, currentEnemyEncounter: null
            },
            explorationLog: ["Journal d'exploration initialisé."],
            quests: {},
            shopStock: ['item_laser_mk1', 'item_nanosword', 'item_plating_basic', 'item_repair_kit_s'],
            purchasedShopItems: [], baseGrid: [],
            placementMode: { isActive: false, selectedDefenseType: null, selectedDefenseLevel: 1},
            baseStats: { currentHealth: BASE_INITIAL_HEALTH, maxHealth: BASE_INITIAL_HEALTH, defensePower: 0 },
            defenses: {},
            nightAssault: { isActive: false, wave: 0, enemies: [], lastAttackTime: 0, log: ["Journal d'assaut initialisé."], currentEvent: null, globalModifiers: {} },
            activeCombatSkills: {}, 
            activeResearch: null,
            tutorialCompleted: false
        };
        console.log("main.js: init() - gameState initialisé.");

        if (Object.keys(buildingsData).length > 0) {
            for (const id in buildingsData) {
                if (gameState.buildings[id] === undefined) gameState.buildings[id] = 0;
            }
        } else { console.warn("main.js: init() - buildingsData est vide.");}

        if (typeof questController !== 'undefined' && typeof questController.initializeQuests === 'function') {
            questController.initializeQuests();
        } else { console.error("questController.initializeQuests non défini."); }

        console.log("main.js: init() - Appel de loadGame()...");
        if(typeof loadGame === 'function') loadGame(); else { console.error("ERREUR: loadGame n'est pas défini !"); }
        console.log("main.js: init() - gameState après loadGame().");


        if (typeof tutorialController !== 'undefined' && typeof tutorialController.checkAndOfferTutorial === 'function') {
            setTimeout(() => {
                tutorialController.checkAndOfferTutorial();
            }, 500); 
        } else {
            console.warn("tutorialController.checkAndOfferTutorial non défini.");
        }


        if (typeof mapManager !== 'undefined' && typeof mapManager.generateMap === 'function') {
            console.log("main.js: init() - Génération de la carte pour la zone:", gameState.currentZoneId);
            mapManager.generateMap(gameState.currentZoneId);
        } else { console.error("mapManager ou mapManager.generateMap n'est pas défini dans init"); }

        if (typeof initializeBaseGrid === 'function') {
            console.log("main.js: init() - Initialisation de la grille de base.");
            initializeBaseGrid();
        } else { console.error("initializeBaseGrid n'est pas défini dans init");}

        console.log("main.js: init() - Calculs initiaux...");
        if(typeof calculateNanobotStats === 'function') calculateNanobotStats();
        if(typeof calculateBaseStats === 'function') calculateBaseStats();
        if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
        console.log("main.js: init() - gameState.resources après calculs initiaux:", JSON.parse(JSON.stringify(gameState.resources)));

        console.log("main.js: init() - Remplissage initial des logs et UI...");
        if(eventLogEl && gameState && Array.isArray(gameState.eventLog)) { eventLogEl.innerHTML = ''; gameState.eventLog.forEach(msg => { const e = document.createElement('p'); e.innerHTML = msg; eventLogEl.appendChild(e); }); eventLogEl.scrollTop = eventLogEl.scrollHeight; }
        if(combatLogSummaryEl && gameState && Array.isArray(gameState.combatLogSummary)) { combatLogSummaryEl.innerHTML = '<h4 class="font-semibold text-gray-300 text-xs">Log Combat:</h4>'; gameState.combatLogSummary.forEach(msg => { const e = document.createElement('p'); e.innerHTML = msg; combatLogSummaryEl.appendChild(e); }); combatLogSummaryEl.scrollTop = combatLogSummaryEl.scrollHeight; }
        if(nightAssaultLogEl && gameState && gameState.nightAssault && Array.isArray(gameState.nightAssault.log)) {
            nightAssaultLogEl.innerHTML = ''; 
            (gameState.nightAssault.log).forEach(msg => {
                const entry = document.createElement('p');
                if (typeof msg === 'string') {
                    if (msg.includes("subit") || msg.includes("ALERTE CRITIQUE") || msg.includes("détruit")) entry.classList.add("text-red-400");
                    else if (msg.includes("neutralisent") || msg.includes("intercepte") || msg.includes("Défenses") || msg.includes("tire sur")) entry.classList.add("text-teal-300");
                    else if (msg.includes("Récupéré") || msg.includes("survivée")) entry.classList.add("text-green-400");
                    else if (msg.includes("approche") || msg.includes("Vague")) entry.classList.add("text-orange-300");
                    else entry.classList.add("text-gray-400");
                    entry.innerHTML = msg;
                } else { entry.textContent = "Log invalide."; entry.classList.add("text-red-500");}
                nightAssaultLogEl.appendChild(entry);
            });
            if (!Array.isArray(gameState.nightAssault.log) || gameState.nightAssault.log.length === 0 || (gameState.nightAssault.log.length === 1 && gameState.nightAssault.log[0].includes("initialisé"))) {
                if(nightAssaultLogEl && !nightAssaultLogEl.querySelector('p.text-gray-500.italic')) { nightAssaultLogEl.insertAdjacentHTML('beforeend', '<p class="text-gray-500 italic text-xs">En attente...</p>');}
            }
           if(nightAssaultLogEl) nightAssaultLogEl.scrollTop = nightAssaultLogEl.scrollHeight;
        }
        if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateExplorationLogDisplay === 'function') explorationUI.updateExplorationLogDisplay();
        if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateTileInteractionPanel === 'function' && gameState.map.nanobotPos) {
            explorationUI.updateTileInteractionPanel(gameState.map.nanobotPos.x, gameState.map.nanobotPos.y);
        }
        if (typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function') questUI.updateQuestDisplay();


        if(typeof setupEventListeners === 'function') setupEventListeners(); else { console.error("ERREUR: setupEventListeners n'est pas défini !"); }

        console.log("main.js: init() - Démarrage de la boucle de jeu...");
        if(typeof gameLoop === 'function') {
            if (gameIntervalId) clearInterval(gameIntervalId);
            gameIntervalId = setInterval(gameLoop, TICK_SPEED);
        } else {
            console.error("ERREUR CRITIQUE: gameLoop n'est pas défini !");
        }

        if (typeof window.forceInitialUIUpdate === 'function') {
            console.log("main.js: init() - Appel de forceInitialUIUpdate.");
            window.forceInitialUIUpdate();
        } else {
            console.warn("main.js: init() - window.forceInitialUIUpdate non trouvée.");
        }

        console.log("main.js: init() - Terminé avec succès.");

    } catch (e) {
        console.error("Erreur majeure DANS init(): ", e, e.stack);
        if(eventLogEl && typeof addLogEntry === 'function' && typeof gameState !== 'undefined') addLogEntry("ERREUR D'INITIALISATION CRITIQUE.", "error", eventLogEl, gameState ? gameState.eventLog : ["Erreur Init."]);
        else { alert("Erreur critique d'initialisation. Voir console.");}
    }
}

const SAVE_KEY = 'nexus7GameState_v1.1.3';
function saveGame() { 
    try { 
        if (typeof gameState === 'undefined') { console.warn("saveGame: gameState non défini."); return; } 
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    } catch (e) { 
        console.error("Erreur lors de la sauvegarde:", e); 
        if(typeof addLogEntry === 'function' && eventLogEl && gameState?.eventLog) {
            addLogEntry("Erreur lors de la sauvegarde de la progression.", "error", eventLogEl, gameState.eventLog);
        }
    }
}
function loadGame() { 
    const savedGame = localStorage.getItem(SAVE_KEY); 
    if (savedGame) { 
        console.log("loadGame: Sauvegarde (" + SAVE_KEY + ") trouvée..."); 
        try { 
            const loadedState = JSON.parse(savedGame); 
            for (const key in gameState) {
                if (loadedState.hasOwnProperty(key)) {
                    if (typeof gameState[key] === 'object' && gameState[key] !== null && !Array.isArray(gameState[key]) &&
                        typeof loadedState[key] === 'object' && loadedState[key] !== null && !Array.isArray(loadedState[key])) {
                        gameState[key] = { ...gameState[key], ...loadedState[key] }; 
                        if (key === 'nanobotStats' && loadedState.nanobotStats) {
                            gameState.nanobotStats.skillLastUsed = loadedState.nanobotStats.skillLastUsed || {};
                            gameState.nanobotStats.activeBuffs = {}; 
                            gameState.nanobotStats.resistances = loadedState.nanobotStats.resistances || {}; // Assurer l'initialisation
                        }
                        if (key === 'map' && loadedState.map && typeof TILE_TYPES !== 'undefined' && typeof ZONE_DATA !== 'undefined' && typeof BASE_COORDINATES !== 'undefined' && typeof DEFAULT_MAP_SIZE !== 'undefined') {
                           gameState.map.tiles = loadedState.map.tiles || [];
                            const zoneForPos = loadedState.currentZoneId || gameState.currentZoneId || 'verdant_archipelago';
                            const defaultPos = (ZONE_DATA[zoneForPos]?.entryPoint) ? {...ZONE_DATA[zoneForPos].entryPoint} : ({...BASE_COORDINATES});
                            gameState.map.nanobotPos = loadedState.map.nanobotPos || defaultPos;
                            gameState.map.zoneId = loadedState.map.zoneId || zoneForPos;
                            gameState.map.selectedTile = loadedState.map.selectedTile || null;
                            gameState.map.currentEnemyEncounter = loadedState.map.currentEnemyEncounter || null;
                            if(Array.isArray(gameState.map.tiles)){
                                const zoneMapSize = ZONE_DATA[gameState.map.zoneId]?.mapSize || DEFAULT_MAP_SIZE;
                                const expectedHeight = zoneMapSize.height; const expectedWidth = zoneMapSize.width;
                                let newTiles = [];
                                for(let y=0; y < expectedHeight; y++){ newTiles[y] = []; for(let x=0; x < expectedWidth; x++){
                                    const defaultTileProps = { actualType: TILE_TYPES.EMPTY_GRASSLAND, baseType: TILE_TYPES.PRE_EMPTY, structureType: null, isExplored: false, content: null, isScanned: false, scannedRevealTime: 0, scannedActualType: null };
                                    const loadedTileData = loadedState.map.tiles?.[y]?.[x]; newTiles[y][x] = {...defaultTileProps, ...(loadedTileData || {})};
                                }}
                                gameState.map.tiles = newTiles;
                            } else { gameState.map.tiles = []; }
                        } else if (key === 'quests' && loadedState.quests && typeof QUEST_DATA !== 'undefined' && typeof QUEST_STATUS !== 'undefined') {
                            gameState.quests = {}; 
                            for(const qId in loadedState.quests) { if (QUEST_DATA[qId]) { 
                                gameState.quests[qId] = { id: qId, status: loadedState.quests[qId].status !== undefined ? loadedState.quests[qId].status : QUEST_STATUS.LOCKED, progress: loadedState.quests[qId].progress || {}, objectivesCompleted: loadedState.quests[qId].objectivesCompleted || QUEST_DATA[qId].objectives.map(() => false) };
                                if (gameState.quests[qId].objectivesCompleted.length !== QUEST_DATA[qId].objectives.length) gameState.quests[qId].objectivesCompleted = QUEST_DATA[qId].objectives.map(() => false);
                            }}
                        }
                    } else {
                        gameState[key] = loadedState[key]; 
                    }
                }
            }
            // Assurer la présence des nouvelles/importantes propriétés si la sauvegarde est ancienne
            if (gameState.nanobotStats.skillLastUsed === undefined) gameState.nanobotStats.skillLastUsed = {};
            if (gameState.nanobotStats.activeBuffs === undefined) gameState.nanobotStats.activeBuffs = {};
            if (gameState.nanobotStats.resistances === undefined) gameState.nanobotStats.resistances = {}; // Ajout crucial
            if (gameState.resources.totalEnergyConsumed === undefined) gameState.resources.totalEnergyConsumed = 0;
            if (gameState.resources.energyConsumedByDefenses === undefined) gameState.resources.energyConsumedByDefenses = 0;
            if (gameState.capacity.energy === undefined) gameState.capacity.energy = 50; 
            if (gameState.nanobotStats.lastScanTime === undefined) gameState.nanobotStats.lastScanTime = 0;
            if (gameState.tutorialCompleted === undefined) gameState.tutorialCompleted = false;
            if (gameState.resources.mobility === undefined) gameState.resources.mobility = MAX_MOBILITY_POINTS;
            if (gameState.mobilityRechargeTimer === undefined) gameState.mobilityRechargeTimer = 0;

            if(typeof addLogEntry === 'function' && eventLogEl && gameState.eventLog) addLogEntry(`Partie chargée (${SAVE_KEY}).`, "info", eventLogEl, gameState.eventLog);
            console.log("loadGame: Partie chargée avec succès.");
        } catch(e) { 
            console.error("Erreur chargement sauvegarde:", e); 
            localStorage.removeItem(SAVE_KEY); 
            if(typeof addLogEntry === 'function' && eventLogEl && gameState?.eventLog) addLogEntry("Erreur chargement sauvegarde. Réinitialisation.", "error", eventLogEl, gameState.eventLog);
        } 
    } else {
        console.log("loadGame: Aucune sauvegarde (" + SAVE_KEY + ").");
    }
    if (!Array.isArray(gameState.eventLog)) gameState.eventLog = ["Journal événements initialisé."];
    if (!Array.isArray(gameState.explorationLog)) gameState.explorationLog = ["Journal exploration initialisé."];
    if (!Array.isArray(gameState.combatLogSummary)) gameState.combatLogSummary = ["Journal combat initialisé."];
    if (gameState.nightAssault && !Array.isArray(gameState.nightAssault.log)) gameState.nightAssault.log = ["Journal assaut initialisé."];
    if (!gameState.quests || typeof gameState.quests !== 'object') gameState.quests = {};
    if (gameState.map && gameState.map.selectedTile === undefined) gameState.map.selectedTile = null;
}


window.onload = init;
console.log("main.js - Fin du fichier, 'window.onload = init' configuré.");