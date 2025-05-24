// js/main.js
console.log("main.js - Fichier chargé et en cours d'analyse...");

// --- Références DOM (celles utilisées directement par main.js ou pour la configuration initiale) ---
let biomassEl, nanitesEl, energyEl, biomassRateEl, nanitesRateEl, crystalShardsEl;
let mobilityEl;
let eventLogEl, gameTimeEl, cycleStatusEl;
let modal, modalTitle, modalMessage, modalConfirm, modalCancel; // Pour la modale générique
let nanobotHealthEl, nanobotAttackEl, nanobotDefenseEl, nanobotSpeedEl;
let nanobotVisualBody, equippedModulesDisplayEl, equippedItemsDisplayBriefEl;
let nanobotEquipmentSlotsEl;
// let simulateCombatBtn; // Décommenter si vous le réactivez
let combatLogSummaryEl;
let combatModalEl; // Utilisé par combat.js, mais peut être référencé ici pour des checks
let combatNanobotSprite, combatEnemySprite;
let combatNanobotHealthbar, combatEnemyHealthbar;
let combatEnemyNameEl, combatLogVisualEl;
let combatTurnIndicatorEl;
let mapGridEl, nanobotMapPosEl, tileInfoDisplayEl, explorationTitleEl, zoneListContainerEl; // Pour la carte du monde
let combatEndModalEl, combatEndTitleEl, combatEndRewardsEl, xpGainEl, xpBarEl, lootListEl, closeEndModalBtn;
let inventoryListEl, shopItemsListEl;
let baseHealthDisplayEl, baseHealthValueEl, baseMaxHealthValueEl;
let overviewBaseHealthEl, baseHealthBarContainerEl, baseHealthBarEl, basePreviewContainerEl, placementInfoDivEl, selectedDefenseForPlacementSpanEl, cancelPlacementBtnEl;
let baseDefensePowerEl;
let repairBaseBtn, repairDefensesBtn, toggleNanobotDefendBaseBtn, forceCycleChangeBtn;
let nightAssaultEnemiesDisplayEl, nightAssaultLogEl;
let crystalShardsDisplayContainer;
let explorationLogEl, tileInteractionPanelEl, tileInteractionDetailsEl, tileInteractionActionsEl; // Panneau latéral d'info
let activeQuestsListEl, completedQuestsListEl;
let nightAssaultVideoContainerEl, nightAssaultVideoEl, closeNightAssaultVideoBtnEl;
// let combatCloseAftermathBtnEl; // Décommenter si vous le réactivez (il est dans combat.js)

// Les éléments de l'UI d'exploration active sont gérés par explorationUI.js directement

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
        modal = document.getElementById('modal'); // Modale générique
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
        // simulateCombatBtn=document.getElementById('simulate-combat-btn'); // Décommenter si utilisé
        combatLogSummaryEl=document.getElementById('combat-log-summary');
        combatModalEl=document.getElementById('combat-modal'); // Vérif si existe
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
        // combatCloseAftermathBtnEl = document.getElementById('combat-close-aftermath-btn'); // Dans combat.js

        // Les éléments de l'UI d'exploration active sont initialisés par explorationUI.initializeActiveTileUIElements()
        console.log("main.js: initDOMReferences - Références DOM initialisées.");
    } catch (e) {
        console.error("Erreur DANS initDOMReferences: ", e);
    }
}

function setupEventListeners() {
    console.log("main.js: setupEventListeners - Début");
    try {
        if (modalConfirm) modalConfirm.addEventListener('click', () => { if (modalConfirmCallback) modalConfirmCallback(); hideModal(); });
        else console.warn("setupEventListeners: modalConfirm non trouvé.");
        if (modalCancel) modalCancel.addEventListener('click', () => { if(modalCancelCallback) modalCancelCallback(); hideModal(); });
        else console.warn("setupEventListeners: modalCancel non trouvé.");

        // if(simulateCombatBtn && typeof simulateCombat === 'function') { // Décommenter si bouton réactivé
        //     simulateCombatBtn.addEventListener('click', () => { /* ... */ });
        // } else if (!simulateCombatBtn) console.warn("main.js: setupEventListeners - simulateCombatBtn non trouvé.");

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
            // La fonction hideNightAssaultVideo est dans utils.js
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

        // Production de ressources (si énergie suffisante pour bâtiments NON défensifs)
        if (gameState.capacity && gameState.resources && gameState.productionRates && typeof TICK_SPEED !== 'undefined') {
            const energyForNonDefenseBuildings = (gameState.resources.totalEnergyConsumed || 0) - (gameState.resources.energyConsumedByDefenses || 0);
            if (gameState.capacity.energy >= energyForNonDefenseBuildings) {
                gameState.resources.biomass += gameState.productionRates.biomass * (TICK_SPEED / 1000);
                gameState.resources.nanites += gameState.productionRates.nanites * (TICK_SPEED / 1000);
            }
        }

        // Recharge de mobilité
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

        // Progression de la recherche
        if (gameState.activeResearch && typeof researchData !== 'undefined' && researchData[gameState.activeResearch.id] && typeof buildingsData !== 'undefined' && typeof TICK_SPEED !== 'undefined') {
            // ... (logique de recherche comme avant) ...
             const research = researchData[gameState.activeResearch.id];
            const labLevel = gameState.buildings['researchLab'] || 0;
            const researchLabData = buildingsData['researchLab'];
            let researchSpeedFactor = 0.5;
            if (labLevel > 0 && researchLabData && researchLabData.levels[labLevel-1] && researchLabData.levels[labLevel-1].researchSpeedFactor) {
                researchSpeedFactor = researchLabData.levels[labLevel - 1].researchSpeedFactor;
            }
            const researchTimeInTicks = research.time * (1000 / TICK_SPEED);
            const actualResearchTimeTicks = researchTimeInTicks / researchSpeedFactor;

            if (gameState.gameTime >= gameState.activeResearch.startTime + actualResearchTimeTicks) {
                addLogEntry(`Technologie ${research.name} acquise!`, "success", eventLogEl, gameState.eventLog);
                gameState.research[gameState.activeResearch.id] = true;
                if (research.grantsModule || research.grantsStatBoost) { if(typeof calculateNanobotStats === 'function') calculateNanobotStats(); }
                if (typeof ZONE_DATA !== 'undefined') { /* ... (déblocage zones) ... */ }
                gameState.activeResearch = null;
                if (typeof questController !== 'undefined') questController.checkAllQuestsProgress();
            }
        }

        // Mise à jour des scans de carte expirés
        let mapScanTilesNeedUpdate = false;
        if (typeof explorationController !== 'undefined' && typeof explorationController.updateExpiredMapScans === 'function') {
            if (explorationController.updateExpiredMapScans()) { // Notez le changement de nom de fonction
                mapScanTilesNeedUpdate = true;
            }
        }

        // Assaut nocturne
        if (gameState.nightAssault && gameState.nightAssault.isActive && !gameState.isDay) {
            if(typeof processNightAssaultTick === 'function') processNightAssaultTick();
        }

        // Temps et cycle jour/nuit
        if(typeof updateGameTimeAndCycle === 'function') updateGameTimeAndCycle();

        // Progression des quêtes (moins fréquent)
        if (gameLoopCounter % 3 === 0 && typeof questController !== 'undefined' && typeof questController.checkAllQuestsProgress === 'function') {
            questController.checkAllQuestsProgress();
        }

        // Mises à jour UI générales
        if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') {
            uiUpdates.updateDisplays();
        }

        // Mise à jour spécifique de la carte du monde si des scans ont expiré ET si l'onglet est visible
        const explorationSubTab = document.getElementById('exploration-subtab');
        if (mapScanTilesNeedUpdate && explorationSubTab && explorationSubTab.classList.contains('active') &&
            gameState.map.activeExplorationTileCoords === null) { // Seulement si on n'est PAS en mode exploration active
            if(typeof explorationUI !== 'undefined' && typeof explorationUI.updateExplorationMapDisplay === 'function') {
                 explorationUI.updateExplorationMapDisplay(); // Pour rafraîchir les classes CSS
            }
        }
        
        // Sauvegarde automatique (moins fréquente)
        if(gameLoopCounter % 60 === 0) { // Toutes les minutes si TICK_SPEED = 1000ms
            if(typeof saveGame === 'function') saveGame();
        }

    } catch (e) {
        console.error("Erreur dans gameLoop (iteration " + gameLoopCounter + "): ", e.message, e.stack);
        if (gameIntervalId) {
            clearInterval(gameIntervalId);
            if (typeof addLogEntry === 'function' && typeof gameState !== 'undefined' && gameState?.eventLog) {
                 addLogEntry("ERREUR CRITIQUE dans gameLoop. Jeu arrêté.", "error", eventLogEl, gameState.eventLog);
            } else { alert("Erreur critique dans gameLoop. Voir console."); }
        }
    }
}

let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;

function init() {
    console.log(`main.js: init() - Tentative ${initAttempts + 1}`);
    initAttempts++;

    // Vérification robuste des dépendances de config.js
    const requiredConfigs = [
        'ZONE_DATA', 'BASE_COORDINATES', 'BASE_INITIAL_HEALTH', 'TICK_SPEED',
        'buildingsData', 'QUEST_STATUS', 'QUEST_DATA', 'itemsData',
        'nanobotModulesData', 'researchData', 'nightAssaultEnemies',
        'bossDefinitions', 'nightEvents', 'nanobotSkills', 'explorationEnemyData',
        'enemyBaseDefinitions', 'MAP_FEATURE_DATA', 'DAMAGE_TYPES', 'TILE_TYPES',
        'TILE_TYPES_TO_RESOURCE_KEY', 'MAX_MOBILITY_POINTS', 'MOBILITY_RECHARGE_TICKS',
        'tileActiveExplorationOptions', 'activeTileViewData', 'loreData' // Nouvelles configs
    ];
    let allConfigsReady = true;
    for (const configKey of requiredConfigs) {
        if (typeof window[configKey] === 'undefined') {
            console.warn(`main.js: init() - Constante de config '${configKey}' non prête.`);
            allConfigsReady = false;
            break;
        }
    }

    if (!allConfigsReady) {
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            console.warn(`main.js: init() - Tentative ${initAttempts}/${MAX_INIT_ATTEMPTS}. Nouvel essai dans 250ms...`);
            setTimeout(init, 250);
            return;
        } else {
            console.error("ERREUR CRITIQUE: Des constantes de config.js ne sont toujours pas définies !");
            alert("Erreur critique de configuration. Le jeu ne peut pas démarrer.");
            return;
        }
    }
    console.log("main.js: init() - Toutes les constantes de config.js semblent DÉTECTÉES.");

    try {
        initDOMReferences();

        if (typeof initializeTooltipSystem === 'function') {
            initializeTooltipSystem();
            console.log("main.js: init() - Système de Tooltip initialisé.");
        } else console.warn("main.js: init() - initializeTooltipSystem non trouvée.");

        console.log("main.js: init() - Initialisation de gameState...");
        gameState = {
            resources: {
                biomass: 250, nanites: 100, energy: 0, crystal_shards: 0,
                totalEnergyConsumed: 0, energyConsumedByDefenses: 0,
                mobility: typeof MAX_MOBILITY_POINTS !== 'undefined' ? MAX_MOBILITY_POINTS : 10,
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
                isDefendingBase: false, rage: 0, focusStacks: 0, lastMapScanTime: 0, // lastScanTime -> lastMapScanTime
                skillLastUsed: {}, activeBuffs: {}, resistances: {}
            },
            nanobotModuleLevels: {}, inventory: [],
            nanobotEquipment: { weapon: null, armor: null, utility1: null, utility2: null },
            combatLogSummary: ["Journal de combat initialisé."],
            currentZoneId: 'verdant_archipelago', unlockedZones: ['verdant_archipelago'],
            map: {
                zoneId: 'verdant_archipelago', tiles: [],
                nanobotPos: { ...((typeof ZONE_DATA !== 'undefined' && ZONE_DATA['verdant_archipelago']?.entryPoint) || (typeof BASE_COORDINATES !== 'undefined' ? BASE_COORDINATES : {x:0,y:0})) },
                selectedTile: null, currentEnemyEncounter: null,
                activeExplorationTileCoords: null, // NOUVEAU
            },
            explorationLog: ["Journal d'exploration initialisé."],
            quests: {},
            shopStock: ['item_laser_mk1', 'item_nanosword', 'item_plating_basic', 'item_repair_kit_s'],
            purchasedShopItems: [], baseGrid: [],
            placementMode: { isActive: false, selectedDefenseType: null, selectedDefenseLevel: 1},
            baseStats: { currentHealth: (typeof BASE_INITIAL_HEALTH !== 'undefined' ? BASE_INITIAL_HEALTH : 500), maxHealth: (typeof BASE_INITIAL_HEALTH !== 'undefined' ? BASE_INITIAL_HEALTH : 500), defensePower: 0 },
            defenses: {},
            nightAssault: { isActive: false, wave: 0, enemies: [], lastAttackTime: 0, log: ["Journal d'assaut initialisé."], currentEvent: null, globalModifiers: {} },
            activeResearch: null,
            tutorialCompleted: false,
            unlockedLoreEntries: [], // NOUVEAU
        };
        console.log("main.js: init() - gameState initialisé.");

        if (typeof buildingsData !== 'undefined' && Object.keys(buildingsData).length > 0) {
            for (const id in buildingsData) {
                if (gameState.buildings[id] === undefined) gameState.buildings[id] = 0;
            }
        } else console.warn("main.js: init() - buildingsData est vide ou non défini.");

        if (typeof questController !== 'undefined') questController.initializeQuests();
        else console.error("questController.initializeQuests non défini.");

        console.log("main.js: init() - Appel de loadGame()...");
        if(typeof loadGame === 'function') loadGame();
        else console.error("ERREUR: loadGame n'est pas défini !");
        console.log("main.js: init() - gameState après loadGame().");

        if (typeof tutorialController !== 'undefined' && typeof tutorialController.checkAndOfferTutorial === 'function') {
            setTimeout(() => { tutorialController.checkAndOfferTutorial(); }, 500);
        } else console.warn("tutorialController.checkAndOfferTutorial non défini.");

        if (typeof mapManager !== 'undefined') {
            console.log("main.js: init() - Génération de la carte pour la zone:", gameState.currentZoneId);
            mapManager.generateMap(gameState.currentZoneId);
        } else console.error("mapManager ou mapManager.generateMap n'est pas défini dans init");

        if (typeof initializeBaseGrid === 'function') {
            console.log("main.js: init() - Initialisation de la grille de base.");
            initializeBaseGrid();
        } else console.error("initializeBaseGrid n'est pas défini dans init");

        console.log("main.js: init() - Calculs initiaux...");
        if(typeof calculateNanobotStats === 'function') calculateNanobotStats();
        if(typeof calculateBaseStats === 'function') calculateBaseStats();
        if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption();
        console.log("main.js: init() - gameState.resources après calculs initiaux:", JSON.parse(JSON.stringify(gameState.resources)));

        console.log("main.js: init() - Remplissage initial des logs et UI...");
        // ... (Remplissage des logs comme avant) ...
        if(eventLogEl && gameState && Array.isArray(gameState.eventLog)) { /* ... */ }
        if(combatLogSummaryEl && gameState && Array.isArray(gameState.combatLogSummary)) { /* ... */ }
        if(nightAssaultLogEl && gameState && gameState.nightAssault && Array.isArray(gameState.nightAssault.log)) { /* ... */ }
        if (typeof explorationUI !== 'undefined') {
            explorationUI.updateExplorationLogDisplay();
            if (gameState.map.nanobotPos) {
                explorationUI.updateTileInteractionPanel(gameState.map.nanobotPos.x, gameState.map.nanobotPos.y);
            }
        }
        if (typeof questUI !== 'undefined') questUI.updateQuestDisplay();


        if(typeof setupEventListeners === 'function') setupEventListeners();
        else console.error("ERREUR: setupEventListeners n'est pas défini !");

        console.log("main.js: init() - Démarrage de la boucle de jeu...");
        if(typeof gameLoop === 'function') {
            if (gameIntervalId) clearInterval(gameIntervalId);
            gameIntervalId = setInterval(gameLoop, (typeof TICK_SPEED !== 'undefined' ? TICK_SPEED : 1000));
        } else console.error("ERREUR CRITIQUE: gameLoop n'est pas défini !");

        if (typeof window.forceInitialUIUpdate === 'function') {
            console.log("main.js: init() - Appel de forceInitialUIUpdate.");
            window.forceInitialUIUpdate();
        } else console.warn("main.js: init() - window.forceInitialUIUpdate non trouvée.");

        console.log("main.js: init() - Terminé avec succès.");

    } catch (e) {
        console.error("Erreur majeure DANS init(): ", e, e.stack);
        if(eventLogEl && typeof addLogEntry === 'function' && typeof gameState !== 'undefined') {
            addLogEntry("ERREUR D'INITIALISATION CRITIQUE.", "error", eventLogEl, gameState ? gameState.eventLog : ["Erreur Init."]);
        } else alert("Erreur critique d'initialisation. Voir console.");
    }
}

const SAVE_KEY = 'nexus7GameState_v1.1.4'; // Incrémenter la version si la structure de gameState change significativement
function saveGame() {
    try {
        if (typeof gameState === 'undefined') {
            console.warn("saveGame: gameState non défini.");
            return;
        }
        // Simplification: sauvegarder gameState directement
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
        // console.log("Jeu sauvegardé.", SAVE_KEY); // Optionnel: log de succès
    } catch (e) {
        console.error("Erreur lors de la sauvegarde:", e);
        if(typeof addLogEntry === 'function' && typeof eventLogEl !== 'undefined' && gameState?.eventLog) { // Vérifier que eventLogEl est défini
            addLogEntry("Erreur lors de la sauvegarde de la progression.", "error", eventLogEl, gameState.eventLog);
        }
    }
}function loadGame() {
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (savedGame) {
        console.log("loadGame: Sauvegarde (" + SAVE_KEY + ") trouvée...");
        try {
            const loadedState = JSON.parse(savedGame);
            // Fusionner intelligemment pour préserver la structure par défaut de gameState
            // et ajouter/écraser avec les valeurs chargées.
            for (const key in gameState) {
                if (loadedState.hasOwnProperty(key)) {
                    if (typeof gameState[key] === 'object' && gameState[key] !== null && !Array.isArray(gameState[key]) &&
                        typeof loadedState[key] === 'object' && loadedState[key] !== null && !Array.isArray(loadedState[key])) {
                        // Fusionner les objets
                        gameState[key] = { ...gameState[key], ...loadedState[key] };
                        // Cas spécifiques pour les sous-objets importants
                        if (key === 'nanobotStats' && loadedState.nanobotStats) {
                            gameState.nanobotStats.skillLastUsed = loadedState.nanobotStats.skillLastUsed || {};
                            gameState.nanobotStats.activeBuffs = {}; // Ne pas sauvegarder les buffs actifs
                            gameState.nanobotStats.resistances = loadedState.nanobotStats.resistances || {};
                            gameState.nanobotStats.lastMapScanTime = loadedState.nanobotStats.lastMapScanTime || 0;
                        }
                        if (key === 'map' && loadedState.map) {
                            // ... (logique de chargement de la carte comme avant, s'assurer que tiles est bien géré)
                            gameState.map.tiles = loadedState.map.tiles || []; // S'assurer que c'est un tableau
                            // S'assurer que `tiles` est un tableau 2D valide après chargement
                            const zoneForMap = loadedState.currentZoneId || gameState.currentZoneId || 'verdant_archipelago';
                            const zoneMapSize = (typeof ZONE_DATA !== 'undefined' && ZONE_DATA[zoneForMap]?.mapSize) || (typeof DEFAULT_MAP_SIZE !== 'undefined' ? DEFAULT_MAP_SIZE : {width:10, height:10});
                            if (!Array.isArray(gameState.map.tiles) || gameState.map.tiles.length !== zoneMapSize.height ||
                                (gameState.map.tiles.length > 0 && (!gameState.map.tiles[0] || gameState.map.tiles[0].length !== zoneMapSize.width))) {
                                console.warn("loadGame: `tiles` corrompu ou de taille incorrecte, réinitialisation pour la zone.");
                                // Il faudrait appeler mapManager.generateMap(zoneForMap) ici ou marquer pour regénération
                                // Pour l'instant, on laisse mais c'est un point d'attention.
                                gameState.map.tiles = []; // Forcer une regénération si vide
                            }
                             gameState.map.activeExplorationTileCoords = loadedState.map.activeExplorationTileCoords || null; // Charger
                        }
                        // ... (cas spécifique pour 'quests' comme avant)
                         if (key === 'quests' && loadedState.quests && typeof QUEST_DATA !== 'undefined' && typeof QUEST_STATUS !== 'undefined') {
                            gameState.quests = {};
                            for(const qId in loadedState.quests) {
                                if (QUEST_DATA[qId]) {
                                    gameState.quests[qId] = {
                                        id: qId,
                                        status: loadedState.quests[qId].status !== undefined ? loadedState.quests[qId].status : QUEST_STATUS.LOCKED,
                                        progress: loadedState.quests[qId].progress || {},
                                        objectivesCompleted: loadedState.quests[qId].objectivesCompleted || QUEST_DATA[qId].objectives.map(() => false)
                                    };
                                     if (gameState.quests[qId].objectivesCompleted.length !== QUEST_DATA[qId].objectives.length) {
                                        gameState.quests[qId].objectivesCompleted = QUEST_DATA[qId].objectives.map(() => false);
                                    }
                                }
                            }
                        }


                    } else {
                        gameState[key] = loadedState[key];
                    }
                }
            }
            // Vérifications pour les nouvelles propriétés si la sauvegarde est ancienne
            if (gameState.nanobotStats.lastMapScanTime === undefined) gameState.nanobotStats.lastMapScanTime = 0;
            if (gameState.tutorialCompleted === undefined) gameState.tutorialCompleted = false;
            if (gameState.resources.mobility === undefined) gameState.resources.mobility = (typeof MAX_MOBILITY_POINTS !== 'undefined' ? MAX_MOBILITY_POINTS : 10);
            if (gameState.mobilityRechargeTimer === undefined) gameState.mobilityRechargeTimer = 0;
            if (gameState.map.activeExplorationTileCoords === undefined) gameState.map.activeExplorationTileCoords = null;
            if (gameState.unlockedLoreEntries === undefined) gameState.unlockedLoreEntries = [];


            if(typeof addLogEntry === 'function' && eventLogEl && gameState.eventLog) addLogEntry(`Partie chargée (${SAVE_KEY}).`, "info", eventLogEl, gameState.eventLog);
            console.log("loadGame: Partie chargée avec succès.");
        } catch(e) {
            console.error("Erreur chargement sauvegarde:", e);
            localStorage.removeItem(SAVE_KEY);
            // ... (log d'erreur)
        }
    } else {
        console.log("loadGame: Aucune sauvegarde (" + SAVE_KEY + ").");
    }
    // Assurer que les logs sont des tableaux
    if (!Array.isArray(gameState.eventLog)) gameState.eventLog = ["Journal événements initialisé."];
    if (!Array.isArray(gameState.explorationLog)) gameState.explorationLog = ["Journal exploration initialisé."];
    // ... (autres logs)
}


window.onload = init;
console.log("main.js - Fin du fichier, 'window.onload = init' configuré.");