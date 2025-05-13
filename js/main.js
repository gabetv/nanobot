// js/main.js
console.log("main.js - Fichier chargé et en cours d'analyse...");

// --- Références DOM ---
let biomassEl, nanitesEl, energyEl, biomassRateEl, nanitesRateEl, energyCapacityEl, energyCostMoveEl, crystalShardsEl;
let buildingsSection, eventLogEl, gameTimeEl, cycleStatusEl;
let tabOverview, tabResearch, tabNanobot, tabExploration, tabInventory, tabShop, tabQuests;
let overviewContentElTab, researchContentEl, nanobotContentEl, explorationContentEl, inventoryContentEl, shopContentEl, questsContentEl;
let modal, modalTitle, modalMessage, modalConfirm, modalCancel;
let nanobotHealthEl, nanobotAttackEl, nanobotDefenseEl, nanobotSpeedEl;
let nanobotVisualBody, equippedModulesDisplayEl, equippedItemsDisplayBriefEl;
let nanobotEquipmentSlotsEl;
let simulateCombatBtn, combatLogSummaryEl;
let combatModalEl;
let combatNanobotSprite, combatEnemySprite;
let combatNanobotHealthbar, combatEnemyHealthbar;
let combatEnemyNameEl, combatLogVisualEl, closeCombatModalBtn;
let mapGridEl, nanobotMapPosEl, tileInfoDisplayEl, explorationTitleEl, zoneListContainerEl;
let combatEndModalEl, combatEndTitleEl, combatEndRewardsEl, xpGainEl, xpBarEl, lootListEl, closeEndModalBtn, toggleSpeedBtn;
let inventoryListEl, shopItemsListEl;
let baseHealthDisplayEl, baseHealthValueEl, baseMaxHealthValueEl;
let overviewBaseHealthEl, baseHealthBarContainerEl, baseHealthBarEl, basePreviewContainerEl, placementInfoDivEl, selectedDefenseForPlacementSpanEl, cancelPlacementBtnEl;
let baseDefensePowerEl, activeDefensesDisplayEl;
let repairBaseBtn, repairDefensesBtn, toggleNanobotDefendBaseBtn, forceCycleChangeBtn;
let nightAssaultEnemiesDisplayEl, nightAssaultLogEl;
let crystalShardsDisplayContainer;
let explorationLogEl, tileInteractionPanelEl, tileInteractionDetailsEl, tileInteractionActionsEl;
let activeQuestsListEl, completedQuestsListEl;

// La variable combatSpeedMultiplier est définie dans combat.js avec 'var' pour la portée globale

function initDOMReferences() {
    console.log("main.js: initDOMReferences - Début");
    try {
        biomassEl=document.getElementById('biomass');
        nanitesEl=document.getElementById('nanites');
        energyEl=document.getElementById('energy');
        biomassRateEl=document.getElementById('biomassRate');
        nanitesRateEl=document.getElementById('nanitesRate');
        energyCapacityEl=document.getElementById('energyCapacity');
        energyCostMoveEl=document.getElementById('energyCostMove');
        crystalShardsDisplayContainer=document.getElementById('crystal-shards-display-container');
        crystalShardsEl=document.getElementById('crystal_shards');
        buildingsSection=document.getElementById('buildings-section');
        eventLogEl=document.getElementById('event-log');
        gameTimeEl=document.getElementById('gameTime');
        cycleStatusEl=document.getElementById('cycleStatus');
        tabOverview=document.getElementById('tab-overview');
        tabResearch=document.getElementById('tab-research');
        tabNanobot=document.getElementById('tab-nanobot');
        tabExploration=document.getElementById('tab-exploration');
        tabQuests = document.getElementById('tab-quests');
        tabInventory=document.getElementById('tab-inventory');
        tabShop=document.getElementById('tab-shop');
        overviewContentElTab=document.getElementById('overview-content');
        researchContentEl=document.getElementById('research-content');
        nanobotContentEl=document.getElementById('nanobot-content');
        explorationContentEl=document.getElementById('exploration-content');
        questsContentEl = document.getElementById('quests-content');
        inventoryContentEl=document.getElementById('inventory-content');
        shopContentEl=document.getElementById('shop-content');
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
        closeCombatModalBtn=document.getElementById('close-combat-modal-btn');
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
        toggleSpeedBtn = document.getElementById('toggle-speed-btn');
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
        activeDefensesDisplayEl = document.getElementById('active-defenses-display');
        repairBaseBtn = document.getElementById('repair-base-btn');
        repairDefensesBtn = document.getElementById('repair-defenses-btn');
        toggleNanobotDefendBaseBtn = document.getElementById('toggle-nanobot-defend-base-btn');
        nightAssaultEnemiesDisplayEl = document.getElementById('night-assault-enemies-display');
        nightAssaultLogEl = document.getElementById('night-assault-log');
        forceCycleChangeBtn = document.getElementById('force-cycle-change-btn');
        console.log("main.js: initDOMReferences - Références DOM initialisées.");
    } catch (e) {
        console.error("Erreur DANS initDOMReferences: ", e);
    }
}

function setupEventListeners() {
    console.log("main.js: setupEventListeners - Début");
    try {
        console.log("main.js: setupEventListeners - Vérification des modules UI et fonctions globales au début de setupEventListeners:");
        console.log("  typeof uiUpdates:", typeof uiUpdates, ", uiUpdates.updateBaseStatusDisplay est fonction?", typeof uiUpdates?.updateBaseStatusDisplay === 'function');
        console.log("  typeof explorationUI:", typeof explorationUI, ", explorationUI.updateFullExplorationView est fonction?", typeof explorationUI?.updateFullExplorationView === 'function');
        console.log("  typeof questUI:", typeof questUI, ", questUI.updateQuestDisplay est fonction?", typeof questUI?.updateQuestDisplay === 'function');
        console.log("  typeof updateInventoryDisplay (global?):", typeof updateInventoryDisplay);
        console.log("  typeof updateShopDisplay (global?):", typeof updateShopDisplay);
        console.log("  typeof simulateCombat (global?):", typeof simulateCombat);
        console.log("  typeof combatSpeedMultiplier (global?):", typeof combatSpeedMultiplier);


        if (modalConfirm) modalConfirm.addEventListener('click', () => { if (modalConfirmCallback) modalConfirmCallback(); hideModal(); });
        if (modalCancel) modalCancel.addEventListener('click', hideModal);

        if(simulateCombatBtn && typeof simulateCombat === 'function') {
            simulateCombatBtn.addEventListener('click', () => { const testEnemy = { name: "Drone d'Entraînement", health: 40, maxHealth:40, attack: 10, defense: 3, color: '#4299e1', spritePath: 'https://placehold.co/80x100/4299e1/e2e8f0?text=TRAIN' }; simulateCombat(testEnemy); });
        } else if (!simulateCombatBtn) console.warn("main.js: setupEventListeners - simulateCombatBtn non trouvé.");
        else if (typeof simulateCombat !== 'function') console.warn("main.js: setupEventListeners - simulateCombat n'est pas une fonction.");


        if(closeCombatModalBtn) closeCombatModalBtn.addEventListener('click', () => { if(combatModalEl) combatModalEl.classList.add('hidden'); if(typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function' && typeof explorationContentEl !== 'undefined' && explorationContentEl && !explorationContentEl.classList.contains('hidden')) explorationUI.updateFullExplorationView(); });
        if(toggleSpeedBtn) {
            toggleSpeedBtn.addEventListener('click', () => {
                if (typeof combatSpeedMultiplier === 'undefined') window.combatSpeedMultiplier = 1;
                combatSpeedMultiplier = (combatSpeedMultiplier === 1) ? 3 : 1;
                toggleSpeedBtn.textContent = combatSpeedMultiplier === 1 ? "Vitesse x3" : "Vitesse x1";
                let baseDelay = typeof COMBAT_ANIMATION_DELAY_BASE !== 'undefined' ? COMBAT_ANIMATION_DELAY_BASE : 700;
                COMBAT_ANIMATION_DELAY = baseDelay / combatSpeedMultiplier;
            });
            if (typeof combatSpeedMultiplier !== 'undefined') {
                 toggleSpeedBtn.textContent = combatSpeedMultiplier === 1 ? "Vitesse x3" : "Vitesse x1";
            } else {
                 toggleSpeedBtn.textContent = "Vitesse x3";
                 console.warn("main.js: setupEventListeners - combatSpeedMultiplier non défini lors de l'init du texte du bouton toggleSpeed.");
            }
        }
        if(closeEndModalBtn) closeEndModalBtn.addEventListener('click', () => { if(combatEndModalEl) combatEndModalEl.classList.add('hidden'); });
        if(repairBaseBtn && typeof repairBase === 'function') repairBaseBtn.addEventListener('click', () => repairBase(20));
        if(repairDefensesBtn && typeof repairAllDefenses === 'function') repairDefensesBtn.addEventListener('click', repairAllDefenses);
        if(toggleNanobotDefendBaseBtn && typeof toggleNanobotDefendBase === 'function') toggleNanobotDefendBaseBtn.addEventListener('click', toggleNanobotDefendBase);
        if(forceCycleChangeBtn && typeof forceCycleChange === 'function') forceCycleChangeBtn.addEventListener('click', () => forceCycleChange(false));
        if(cancelPlacementBtnEl && typeof cancelPlacementMode === 'function') cancelPlacementBtnEl.addEventListener('click', cancelPlacementMode);

        let tabs = [
            { btn: tabOverview,    content: overviewContentElTab,   name: "Overview",    updateKey: "uiUpdates.updateBaseStatusDisplay" },
            { btn: tabResearch,    content: researchContentEl,      name: "Research",    updateKey: "uiUpdates.updateResearchDisplay" },
            { btn: tabNanobot,     content: nanobotContentEl,       name: "Nanobot",     updateKey: "uiUpdates.updateNanobotDisplay" },
            { btn: tabExploration, content: explorationContentEl,   name: "Exploration", updateKey: "explorationUI.updateFullExplorationView" },
            { btn: tabQuests,      content: questsContentEl,        name: "Quests",      updateKey: "questUI.updateQuestDisplay" },
            { btn: tabInventory,   content: inventoryContentEl,     name: "Inventory",   updateKey: "updateInventoryDisplay" },
            { btn: tabShop,        content: shopContentEl,          name: "Shop",        updateKey: "updateShopDisplay" }
        ];

        tabs.forEach((tabInfo) => {
            if (tabInfo.btn && tabInfo.content) {
                tabInfo.btn.addEventListener('click', () => {
                    // console.log(`main.js: Clic sur onglet: ${tabInfo.name}`);
                    tabs.forEach(t => {
                        if(t.content) t.content.classList.add('hidden');
                        if(t.btn) { t.btn.classList.remove('border-blue-400', 'text-blue-300'); t.btn.classList.add('text-gray-500'); }
                    });
                    tabInfo.content.classList.remove('hidden');
                    tabInfo.btn.classList.add('border-blue-400', 'text-blue-300');
                    tabInfo.btn.classList.remove('text-gray-500');

                    let funcToCall = null;
                    const keys = tabInfo.updateKey.split('.');
                    if (keys.length === 2) {
                        const moduleObj = window[keys[0]];
                        if (moduleObj && typeof moduleObj[keys[1]] === 'function') {
                            funcToCall = moduleObj[keys[1]].bind(moduleObj);
                        } else {
                             console.warn(`main.js: Méthode ${tabInfo.updateKey} non trouvée ou l'objet ${keys[0]} (window.${keys[0]}) n'est pas défini ou n'a pas cette méthode.`);
                        }
                    } else if (keys.length === 1) {
                        if (typeof window[keys[0]] === 'function') {
                            funcToCall = window[keys[0]];
                        } else {
                            console.warn(`main.js: Fonction globale ${tabInfo.updateKey} non trouvée.`);
                        }
                    }

                    if (funcToCall) {
                        // console.log(`main.js: Appel de ${tabInfo.updateKey}`);
                        funcToCall();
                    } else {
                         console.warn(`main.js: Pas de fonction de mise à jour VALIDE trouvée pour l'onglet ${tabInfo.name} via la clé "${tabInfo.updateKey}"`);
                    }
                });
            } else {
                console.warn(`Élément manquant pour l'onglet ${tabInfo.name || 'NONAME'} (btn: ${!!tabInfo.btn}, content: ${!!tabInfo.content})`);
            }
        });

         if(tabOverview) {
            console.log("main.js: Clic initial sur l'onglet Overview.")
            tabOverview.click();
         } else {
            console.error("ERREUR CRITIQUE: Onglet Overview (tabOverview) non trouvé pour clic initial !");
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
            if (gameState.capacity.energy >= gameState.resources.energy) { // energy est la consommation
                gameState.resources.biomass += gameState.productionRates.biomass * (TICK_SPEED / 1000);
                gameState.resources.nanites += gameState.productionRates.nanites * (TICK_SPEED / 1000);
            }
        }

        if (gameState.activeResearch && typeof researchData !== 'undefined' && researchData[gameState.activeResearch.id] && typeof buildingsData !== 'undefined' && typeof TICK_SPEED !== 'undefined') {
            const research = researchData[gameState.activeResearch.id];
            const labLevel = gameState.buildings['researchLab'] || 0;
            const researchLabData = buildingsData['researchLab'];
            let researchSpeedFactor = 0.5;
            if (labLevel > 0 && researchLabData && researchLabData.levels[labLevel-1] && researchLabData.levels[labLevel-1].researchSpeedFactor) {
                researchSpeedFactor = researchLabData.levels[labLevel - 1].researchSpeedFactor;
            }
            // research.time est en secondes dans config_gameplay.js
            const researchTimeInTicks = research.time * (1000 / TICK_SPEED);
            const actualResearchTimeTicks = researchTimeInTicks / researchSpeedFactor;

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

        if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay();
        if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateXpBar === 'function') uiUpdates.updateXpBar();

        if (gameLoopCounter % 5 === 0) { // Mises à jour d'onglets moins fréquentes
             if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') {
                uiUpdates.updateDisplays();
             }
        } else { // Mises à jour ciblées pour les onglets actifs qui nécessitent une réactivité plus grande
            if (typeof uiUpdates !== 'undefined') {
                if (overviewContentElTab && !overviewContentElTab.classList.contains('hidden') && typeof uiUpdates.updateBaseStatusDisplay === 'function') uiUpdates.updateBaseStatusDisplay();
                if (researchContentEl && !researchContentEl.classList.contains('hidden') && gameState.activeResearch && typeof uiUpdates.updateResearchDisplay === 'function') uiUpdates.updateResearchDisplay();
            }
        }

        if ((scanTilesNeedUpdate || gameLoopCounter % 2 === 0) && typeof explorationContentEl !== 'undefined' && explorationContentEl && !explorationContentEl.classList.contains('hidden')) {
            if(typeof explorationUI !== 'undefined' && typeof explorationUI.updateFullExplorationView === 'function') explorationUI.updateFullExplorationView();
        }
         if (gameLoopCounter % 2 === 0 && typeof questsContentEl !== 'undefined' && questsContentEl && !questsContentEl.classList.contains('hidden')) {
            if(typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function') questUI.updateQuestDisplay();
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

    if (typeof ZONE_DATA === 'undefined' || typeof BASE_COORDINATES === 'undefined' || typeof BASE_INITIAL_HEALTH === 'undefined' || typeof TICK_SPEED === 'undefined' || typeof buildingsData === 'undefined' || typeof QUEST_STATUS === 'undefined' || typeof QUEST_DATA === 'undefined' || typeof itemsData === 'undefined' || typeof nanobotModulesData === 'undefined' || typeof researchData === 'undefined' || typeof nightAssaultEnemies === 'undefined' || typeof bossDefinitions === 'undefined' || typeof nightEvents === 'undefined' || typeof nanobotSkills === 'undefined' || typeof explorationEnemyData === 'undefined' || typeof enemyBaseDefinitions === 'undefined' || typeof MAP_FEATURE_DATA === 'undefined' || typeof DAMAGE_TYPES === 'undefined' || typeof TILE_TYPES === 'undefined') {
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            console.warn(`main.js: init() - Constantes de config.js non prêtes (ex: ZONE_DATA: ${typeof ZONE_DATA}). Tentative ${initAttempts}/${MAX_INIT_ATTEMPTS}. Nouvel essai dans 250ms...`);
            setTimeout(init, 250);
            return;
        } else {
            console.error("ERREUR CRITIQUE: Les constantes de config.js ne sont toujours pas définies après plusieurs tentatives! Vérifiez l'ordre des scripts et les erreurs dans les fichiers config_*.js.");
            alert("Erreur critique de configuration persistante. Le jeu ne peut pas démarrer.");
            return;
        }
    }
    console.log("main.js: init() - Toutes les constantes de config.js semblent DÉTECTÉES.");

    try {
        initDOMReferences();

        console.log("main.js: init() - Initialisation de gameState...");
        gameState = {
            resources: { biomass: 250, nanites: 100, energy: 100, crystal_shards: 0 },
            productionRates: { biomass: 0, nanites: 0 },
            capacity: { energy: 100 },
            buildings: {}, research: {}, gameTime: 0, isDay: true, currentCycleTime: 0,
            eventLog: ["Bienvenue au Nexus-7. Systèmes en ligne."],
            nanobotStats: {
                baseHealth: 100, currentHealth: 100, baseAttack: 10, baseDefense: 5, baseSpeed: 10,
                health: 100, attack: 10, defense: 5, speed: 10,
                level: 1, xp: 0, xpToNext: 100,
                isDefendingBase: false, rage: 0, focusStacks: 0, lastScanTime: 0
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
            activeCombatSkills: {}, activeResearch: null
        };
        console.log("main.js: init() - gameState initialisé avec valeurs par défaut. Ressources:", JSON.parse(JSON.stringify(gameState.resources)));

        if (Object.keys(buildingsData).length > 0) {
            for (const id in buildingsData) {
                if (gameState.buildings[id] === undefined) gameState.buildings[id] = 0;
            }
        } else { console.warn("main.js: init() - buildingsData est vide, gameState.buildings non peuplé par défaut.");}
        console.log("main.js: init() - gameState.buildings après défauts:", JSON.parse(JSON.stringify(gameState.buildings)));


        if (typeof questController !== 'undefined' && typeof questController.initializeQuests === 'function') {
            questController.initializeQuests();
        } else { console.error("questController.initializeQuests non défini."); }


        console.log("main.js: init() - Appel de loadGame()...");
        if(typeof loadGame === 'function') loadGame(); else { console.error("ERREUR: loadGame n'est pas défini !"); }
        console.log("main.js: init() - gameState après loadGame():", JSON.parse(JSON.stringify(gameState)));


        if (typeof mapManager !== 'undefined' && typeof mapManager.generateMap === 'function') {
            console.log("main.js: init() - Génération de la carte pour la zone:", gameState.currentZoneId);
            mapManager.generateMap(gameState.currentZoneId);
        } else { console.error("mapManager ou mapManager.generateMap n'est pas défini dans init"); }

        if (typeof initializeBaseGrid === 'function') {
            console.log("main.js: init() - Initialisation de la grille de base.");
            initializeBaseGrid(BASE_GRID_SIZE); // Passer BASE_GRID_SIZE ici
        } else { console.error("initializeBaseGrid n'est pas défini dans init");}

        console.log("main.js: init() - Calculs initiaux...");
        if(typeof calculateNanobotStats === 'function') calculateNanobotStats();
        if(typeof calculateBaseStats === 'function') calculateBaseStats();
        if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
        console.log("main.js: init() - gameState.resources après calculs initiaux:", JSON.parse(JSON.stringify(gameState.resources)));

        console.log("main.js: init() - Remplissage initial des logs et UI...");
        if(eventLogEl && gameState && Array.isArray(gameState.eventLog)) { eventLogEl.innerHTML = '<h3 class="font-semibold mb-2 text-gray-300">Journal Principal des Événements :</h3>'; gameState.eventLog.forEach(msg => { const e = document.createElement('p'); e.innerHTML = msg; eventLogEl.appendChild(e); }); eventLogEl.scrollTop = eventLogEl.scrollHeight; }
        if(combatLogSummaryEl && gameState && Array.isArray(gameState.combatLogSummary)) { combatLogSummaryEl.innerHTML = '<h4 class="font-semibold mb-1 text-gray-300">Résumé Combat :</h4>'; gameState.combatLogSummary.forEach(msg => { const e = document.createElement('p'); e.innerHTML = msg; combatLogSummaryEl.appendChild(e); }); combatLogSummaryEl.scrollTop = combatLogSummaryEl.scrollHeight; }
        if(nightAssaultLogEl && gameState && gameState.nightAssault && Array.isArray(gameState.nightAssault.log)) {
            const h3Title = nightAssaultLogEl.querySelector('h3');
            nightAssaultLogEl.innerHTML = h3Title ? h3Title.outerHTML : '<h3 class="font-orbitron text-lg mb-2 text-red-300 border-b border-gray-600 pb-1">Journal d\'Assaut Nocturne</h3>';
            (gameState.nightAssault.log).forEach(msg => {
                const entry = document.createElement('p');
                if (msg.includes("subit") || msg.includes("ALERTE CRITIQUE") || msg.includes("détruit")) entry.classList.add("text-red-400");
                else if (msg.includes("neutralisent") || msg.includes("intercepte") || msg.includes("Défenses") || msg.includes("tire sur")) entry.classList.add("text-teal-300");
                else if (msg.includes("Récupéré") || msg.includes("survivée")) entry.classList.add("text-green-400");
                else if (msg.includes("approche") || msg.includes("Vague")) entry.classList.add("text-orange-300");
                else entry.classList.add("text-gray-400");
                entry.innerHTML = msg;
                nightAssaultLogEl.appendChild(entry);
            });
            if (!Array.isArray(gameState.nightAssault.log) || gameState.nightAssault.log.length === 0 || (gameState.nightAssault.log.length === 1 && gameState.nightAssault.log[0].includes("initialisé"))) {
                if(nightAssaultLogEl && !nightAssaultLogEl.querySelector('p.text-gray-500.italic')) {
                    nightAssaultLogEl.insertAdjacentHTML('beforeend', '<p class="text-gray-500 italic">En attente d\'événements...</p>');
                }
            }
           if(nightAssaultLogEl) nightAssaultLogEl.scrollTop = nightAssaultLogEl.scrollHeight;
        }
        if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateExplorationLogDisplay === 'function') explorationUI.updateExplorationLogDisplay(); else console.warn("explorationUI.updateExplorationLogDisplay non défini.");
        if (typeof explorationUI !== 'undefined' && typeof explorationUI.updateTileInteractionPanel === 'function') explorationUI.updateTileInteractionPanel(); else console.warn("explorationUI.updateTileInteractionPanel non défini.");
        if (typeof questUI !== 'undefined' && typeof questUI.updateQuestDisplay === 'function') questUI.updateQuestDisplay(); else console.warn("questUI.updateQuestDisplay non défini.");


        if(typeof setupEventListeners === 'function') setupEventListeners(); else { console.error("ERREUR: setupEventListeners n'est pas défini !"); }

        // L'appel à updateDisplays() est fait par le clic simulé sur tabOverview dans setupEventListeners
        // si setupEventListeners est appelé APRES que les objets UI soient prêts.
        // Un appel explicite ici peut être nécessaire si le clic simulé ne suffit pas ou pour le premier chargement.
        // console.log("main.js: init() - Appel final de updateDisplays() après setupEventListeners.");
        // if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays();
        // else if(typeof updateDisplays === 'function') updateDisplays(); // Si uiUpdates est une collection de fonctions globales
        // else { console.error("updateDisplays (ni uiUpdates.updateDisplays) n'est pas défini dans init pour l'appel final");}


        console.log("main.js: init() - Démarrage de la boucle de jeu...");
        if(typeof gameLoop === 'function') {
            if (gameIntervalId) clearInterval(gameIntervalId);
            gameIntervalId = setInterval(gameLoop, TICK_SPEED);
        } else {
            console.error("ERREUR CRITIQUE: gameLoop n'est pas défini !");
        }
        console.log("main.js: init() - Terminé avec succès.");

    } catch (e) {
        console.error("Erreur majeure DANS init(): ", e, e.stack);
        if(eventLogEl && typeof addLogEntry === 'function' && typeof gameState !== 'undefined') addLogEntry("ERREUR D'INITIALISATION CRITIQUE.", "error", eventLogEl, gameState ? gameState.eventLog : ["Erreur Init."]);
        else { alert("Erreur critique d'initialisation. Voir console.");}
    }
}

const SAVE_KEY = 'nexus7GameState_v1.1.0'; // Maintenir ou incrémenter si structure de sauvegarde change
function saveGame() {
    try {
        if (typeof gameState === 'undefined') { /* ... */ return; }
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    } catch (e) { /* ... */ }
}
function loadGame() {
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (savedGame) {
        console.log("loadGame: Sauvegarde trouvée (" + SAVE_KEY + "), tentative de chargement...");
        try {
            const loadedState = JSON.parse(savedGame);
            for (const key in gameState) {
                if (loadedState.hasOwnProperty(key)) {
                    if (typeof gameState[key] === 'object' && gameState[key] !== null && !Array.isArray(gameState[key]) &&
                        typeof loadedState[key] === 'object' && loadedState[key] !== null && !Array.isArray(loadedState[key])) {
                        gameState[key] = { ...JSON.parse(JSON.stringify(gameState[key])), ...loadedState[key] };

                        if (key === 'map' && loadedState.map && typeof TILE_TYPES !== 'undefined' && typeof ZONE_DATA !== 'undefined' && typeof BASE_COORDINATES !== 'undefined') {
                             gameState.map.tiles = loadedState.map.tiles || [];
                             const zoneForPos = loadedState.currentZoneId || gameState.currentZoneId || 'verdant_archipelago';
                             const defaultPos = (ZONE_DATA[zoneForPos]?.entryPoint) ? {...ZONE_DATA[zoneForPos].entryPoint} : ({...BASE_COORDINATES});
                             gameState.map.nanobotPos = loadedState.map.nanobotPos || defaultPos;
                             gameState.map.zoneId = loadedState.map.zoneId || zoneForPos;
                             gameState.map.selectedTile = loadedState.map.selectedTile || null;
                             if(Array.isArray(gameState.map.tiles)){
                                 const zoneMapSize = ZONE_DATA[gameState.map.zoneId]?.mapSize || DEFAULT_MAP_SIZE; // Utiliser DEFAULT_MAP_SIZE en fallback
                                 const expectedHeight = zoneMapSize.height;
                                 const expectedWidth = zoneMapSize.width;
                                 let newTiles = [];
                                 for(let y=0; y < expectedHeight; y++){
                                     newTiles[y] = [];
                                     for(let x=0; x < expectedWidth; x++){
                                         const defaultTileProps = { actualType: TILE_TYPES.EMPTY_GRASSLAND, baseType: TILE_TYPES.PRE_EMPTY, structureType: null, isExplored: false, content: null, isScanned: false, scannedRevealTime: 0, scannedActualType: null };
                                         // Utiliser les données chargées si elles existent pour cette tuile, sinon les valeurs par défaut du tile
                                         const loadedTileData = loadedState.map.tiles?.[y]?.[x];
                                         newTiles[y][x] = {...defaultTileProps, ...(loadedTileData || {})};
                                     }
                                 }
                                 gameState.map.tiles = newTiles;
                             } else { gameState.map.tiles = []; }
                        }
                         if (key === 'nanobotStats' && loadedState.nanobotStats) { /* ... (Fusion identique) ... */ }
                         if (key === 'explorationLog' && loadedState.explorationLog && Array.isArray(loadedState.explorationLog)) { gameState.explorationLog = loadedState.explorationLog; }
                        if (key === 'quests' && loadedState.quests && typeof QUEST_DATA !== 'undefined' && typeof QUEST_STATUS !== 'undefined') { /* ... (Fusion identique) ... */ }
                        if (key === 'nightAssault' && loadedState.nightAssault && typeof nightAssaultEnemies !== 'undefined') { /* ... (Fusion identique) ... */ }
                    } else {
                        gameState[key] = loadedState[key];
                    }
                }
            }
            if(typeof addLogEntry === 'function' && eventLogEl && gameState.eventLog) addLogEntry(`Partie chargée (${SAVE_KEY}).`, "info", eventLogEl, gameState.eventLog);
            console.log("loadGame: Partie chargée avec succès.");
        } catch(e) { /* ... (Gestion erreur identique) ... */ }
    } else { console.log("loadGame: Aucune sauvegarde trouvée."); }
    if (!Array.isArray(gameState.explorationLog)) gameState.explorationLog = ["Journal d'exploration initialisé."];
    if (!gameState.quests || typeof gameState.quests !== 'object') gameState.quests = {};
    if (gameState.map && gameState.map.selectedTile === undefined) gameState.map.selectedTile = null;
    if (gameState.nanobotStats && gameState.nanobotStats.lastScanTime === undefined) gameState.nanobotStats.lastScanTime = 0;
}

window.onload = init;
console.log("main.js - Fin du fichier, 'window.onload = init' configuré.");