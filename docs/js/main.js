// js/main.js
// console.log("main.js - Fichier chargé et exécuté"); 

let biomassEl, nanitesEl, energyEl, biomassRateEl, nanitesRateEl, energyCapacityEl, energyCostMoveEl, crystalShardsEl; 
let buildingsSection, researchSection, eventLogEl, gameTimeEl, cycleStatusEl;
let tabOverview, tabResearch, tabNanobot, tabExploration, tabInventory, tabShop;
let overviewContentElTab, researchContentEl, nanobotContentEl, explorationContentEl, inventoryContentEl, shopContentEl;
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


function initDOMReferences() {
    // console.log("main.js: initDOMReferences - Début");
    try {
        biomassEl=document.getElementById('biomass'); 
        nanitesEl=document.getElementById('nanites'); 
        energyEl=document.getElementById('energy'); 
        biomassRateEl=document.getElementById('biomassRate'); 
        nanitesRateEl=document.getElementById('nanitesRate'); 
        energyCapacityEl=document.getElementById('energyCapacity'); 
        energyCostMoveEl=document.getElementById('energyCostMove');
        buildingsSection=document.getElementById('buildings-section'); 
        researchSection=document.getElementById('research-content'); 
        eventLogEl=document.getElementById('event-log'); 
        gameTimeEl=document.getElementById('gameTime'); 
        cycleStatusEl=document.getElementById('cycleStatus');
        tabOverview=document.getElementById('tab-overview'); 
        tabResearch=document.getElementById('tab-research'); 
        tabNanobot=document.getElementById('tab-nanobot'); 
        tabExploration=document.getElementById('tab-exploration'); 
        tabInventory=document.getElementById('tab-inventory'); 
        tabShop=document.getElementById('tab-shop');
        overviewContentElTab=document.getElementById('overview-content'); 
        researchContentEl=document.getElementById('research-content'); 
        nanobotContentEl=document.getElementById('nanobot-content'); 
        explorationContentEl=document.getElementById('exploration-content'); 
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
    } catch (e) {
        console.error("Erreur DANS initDOMReferences: ", e);
    }
    // console.log("main.js: initDOMReferences - Fin");
}

function setupEventListeners() {
    // console.log("main.js: setupEventListeners - Début");
    try {
        if (modalConfirm) modalConfirm.addEventListener('click', () => { if (modalConfirmCallback) modalConfirmCallback(); hideModal(); }); else console.warn("modalConfirm non trouvé");
        if (modalCancel) modalCancel.addEventListener('click', hideModal); else console.warn("modalCancel non trouvé");
        
        if(simulateCombatBtn) simulateCombatBtn.addEventListener('click', () => { const testEnemy = { name: "Drone d'Entraînement", health: 40, maxHealth:40, attack: 10, defense: 3, color: '#4299e1', spritePath: 'https://placehold.co/80x100/4299e1/e2e8f0?text=TRAIN' }; simulateCombat(testEnemy); }); else console.warn("simulateCombatBtn non trouvé");
        if(closeCombatModalBtn) closeCombatModalBtn.addEventListener('click', () => { if(combatModalEl) combatModalEl.classList.add('hidden'); if(typeof updateExplorationDisplay === 'function') updateExplorationDisplay(); }); else console.warn("closeCombatModalBtn non trouvé");
        if(toggleSpeedBtn) {
            toggleSpeedBtn.addEventListener('click', () => { 
                combatSpeedMultiplier = (combatSpeedMultiplier === 1) ? 3 : 1; 
                toggleSpeedBtn.textContent = combatSpeedMultiplier === 1 ? "Vitesse x3" : "Vitesse x1"; 
                COMBAT_ANIMATION_DELAY = COMBAT_ANIMATION_DELAY_BASE / combatSpeedMultiplier; 
            });
            toggleSpeedBtn.textContent = combatSpeedMultiplier === 1 ? "Vitesse x3" : "Vitesse x1"; 
        } else console.warn("toggleSpeedBtn non trouvé");
        if(closeEndModalBtn) closeEndModalBtn.addEventListener('click', () => { if(combatEndModalEl) combatEndModalEl.classList.add('hidden'); }); else console.warn("closeEndModalBtn non trouvé");
        if(repairBaseBtn) repairBaseBtn.addEventListener('click', () => repairBase(20)); else console.warn("repairBaseBtn non trouvé");
        if(repairDefensesBtn) repairDefensesBtn.addEventListener('click', repairAllDefenses); else console.warn("repairDefensesBtn non trouvé");
        if(toggleNanobotDefendBaseBtn) toggleNanobotDefendBaseBtn.addEventListener('click', toggleNanobotDefendBase); else console.warn("toggleNanobotDefendBaseBtn non trouvé");
        if(forceCycleChangeBtn) forceCycleChangeBtn.addEventListener('click', () => forceCycleChange(false)); else console.warn("forceCycleChangeBtn non trouvé");
        if(cancelPlacementBtnEl) cancelPlacementBtnEl.addEventListener('click', cancelPlacementMode); else console.warn("cancelPlacementBtnEl non trouvé");

        let tabs = [ 
            { btn: tabOverview, content: overviewContentElTab, name: "Overview" }, 
            { btn: tabResearch, content: researchContentEl, name: "Research" }, 
            { btn: tabNanobot, content: nanobotContentEl, name: "Nanobot" }, 
            { btn: tabExploration, content: explorationContentEl, name: "Exploration" }, 
            { btn: tabInventory, content: inventoryContentEl, name: "Inventory" }, 
            { btn: tabShop, content: shopContentEl, name: "Shop" } 
        ];
        tabs.forEach((tabInfo, index) => {
            if (tabInfo.btn && tabInfo.content) { 
                tabInfo.btn.addEventListener('click', () => {
                    // console.log(`Clic sur onglet: ${tabInfo.name || tabInfo.btn.id}`); 
                    tabs.forEach(t => { 
                        if(t.content) t.content.classList.add('hidden'); 
                        if(t.btn) { t.btn.classList.remove('border-blue-400', 'text-blue-300'); t.btn.classList.add('text-gray-500'); } 
                    });
                    tabInfo.content.classList.remove('hidden'); 
                    tabInfo.btn.classList.add('border-blue-400', 'text-blue-300'); 
                    tabInfo.btn.classList.remove('text-gray-500');
                    
                    if (tabInfo.btn === tabExploration && typeof updateExplorationDisplay === 'function') updateExplorationDisplay(); 
                    if (tabInfo.btn === tabInventory && typeof updateInventoryDisplay === 'function') updateInventoryDisplay();
                    if (tabInfo.btn === tabShop && typeof updateShopDisplay === 'function') updateShopDisplay();
                    if (tabInfo.btn === tabNanobot && typeof updateNanobotModulesDisplay === 'function') updateNanobotModulesDisplay(); 
                });
            } else { 
                console.warn(`Élément manquant pour l'onglet ${tabInfo.name || 'NONAME'}: Bouton ${tabInfo.btn ? 'OK' : 'MANQUANT'}, Contenu ${tabInfo.content ? 'OK' : 'MANQUANT'}`);
            }
        });
         if(tabOverview) {
            tabOverview.click(); 
         } else { 
            console.error("ERREUR CRITIQUE: Onglet Overview (tabOverview) non trouvé pour clic initial !"); 
        }
    } catch (e) {
        console.error("Erreur DANS setupEventListeners: ", e);
    }
    // console.log("main.js: setupEventListeners - Fin");
}

let gameLoopCounter = 0; 
let gameIntervalId = null; 

function gameLoop() { 
    gameLoopCounter++;
    // if (gameLoopCounter <= 5) { console.log("gameLoop - Tick " + gameLoopCounter + ", Temps Jeu: " + (gameState ? gameState.gameTime : 'gameState_ND')); }

    try {
        if (typeof gameState !== 'undefined' && gameState && gameState.capacity && gameState.resources && gameState.productionRates) { 
            if (gameState.capacity.energy >= gameState.resources.energy) { 
                gameState.resources.biomass += gameState.productionRates.biomass * (TICK_SPEED / 1000); 
                gameState.resources.nanites += gameState.productionRates.nanites * (TICK_SPEED / 1000); 
            } 
        } else {
            if (gameLoopCounter <= 3) console.warn("gameLoop - gameState ou propriétés critiques non initialisées.");
        }

        if (gameState && gameState.activeResearch && typeof researchData !== 'undefined' && researchData[gameState.activeResearch.id]) { 
            const research = researchData[gameState.activeResearch.id]; 
            const labLevel = gameState.buildings['researchLab'] || 0;
            const researchLabData = buildingsData['researchLab'];
            let researchSpeedFactor = 0.5; 
            if (labLevel > 0 && researchLabData && researchLabData.levels[labLevel-1] && researchLabData.levels[labLevel-1].researchSpeedFactor) {
                researchSpeedFactor = researchLabData.levels[labLevel - 1].researchSpeedFactor;
            }
            const actualResearchTime = research.time / researchSpeedFactor;

            if (gameState.gameTime - gameState.activeResearch.startTime >= actualResearchTime) { 
                gameState.research[gameState.activeResearch.id] = true; 
                addLogEntry(`Technologie ${research.name} acquise!`, "success"); 
                if (research.grantsModule || research.grantsStatBoost) calculateNanobotStats(); 
                for(const zoneId in ZONE_DATA) {
                    if (ZONE_DATA[zoneId].unlockCondition && ZONE_DATA[zoneId].unlockCondition.research === gameState.activeResearch.id) {
                        if (!gameState.unlockedZones.includes(zoneId)) {
                            gameState.unlockedZones.push(zoneId);
                            addLogEntry(`Nouvelle zone d'exploration débloquée: ${ZONE_DATA[zoneId].name}!`, "success");
                            if(typeof updateZoneSelectionUI === 'function') updateZoneSelectionUI();
                        }
                    }
                }
                gameState.activeResearch = null; 
                if(typeof updateResearchDisplay === 'function') updateResearchDisplay();
            } 
        } 
        if (gameState && gameState.nightAssault && gameState.nightAssault.isActive && !gameState.isDay) { 
            if(typeof processNightAssaultTick === 'function') processNightAssaultTick(); 
            else if (gameLoopCounter <= 3) console.warn("gameLoop - processNightAssaultTick non défini !");
        }
        
        if(typeof updateGameTimeAndCycle === 'function') {
            updateGameTimeAndCycle(); 
        } else { 
            if (gameLoopCounter <= 3) console.warn("gameLoop - updateGameTimeAndCycle non défini !");
        }
        
        if(typeof updateDisplays === 'function') {
            updateDisplays(); 
        } else { 
            if (gameLoopCounter <= 3) console.warn("gameLoop - updateDisplays non défini !");
        }
        
        if(typeof saveGame === 'function') {
            saveGame(); 
        } else { 
            if (gameLoopCounter <= 3) console.warn("gameLoop - saveGame non défini !");
        }

    } catch (e) {
        console.error("Erreur dans gameLoop (iteration " + gameLoopCounter + "): ", e.message, e.stack);
        if (gameIntervalId) { 
            clearInterval(gameIntervalId);
            addLogEntry("ERREUR CRITIQUE dans gameLoop. Boucle de jeu arrêtée. Vérifiez la console.", "error");
        }
    }
}

function init() {
    // console.log("init() - Début");
    try {
        if (typeof initDOMReferences !== 'function') { console.error("ERREUR CRITIQUE: initDOMReferences n'est PAS une fonction !"); return; }
        initDOMReferences(); 
        // console.log("init() - Après initDOMReferences");
        
        gameState = (typeof gameState === 'object' && gameState !== null) ? gameState : {};
        const defaultGameState = {
            resources: { biomass: 200 * 1000, nanites: 100 * 1000, energy: 50 * 10, crystal_shards: 0 },
            productionRates: { biomass: 0, nanites: 0 }, capacity: { energy: 50 * 10 },
            buildings: {}, research: {}, gameTime: 0, isDay: true, currentCycleTime: 0,
            eventLog: ["Bienvenue, Nexus-7. Initialisation..."],
            nanobotStats: { baseHealth: 100, currentHealth: 100, baseAttack: 10, baseDefense: 5, baseSpeed: 10, health: 100, attack: 10, defense: 5, speed: 10, level: 1, xp: 0, xpToNext: 100, isDefendingBase: false, rage: 0, focusStacks: 0 },
            nanobotModuleLevels: {}, inventory: [],
            nanobotEquipment: { weapon: null, armor: null, utility1: null, utility2: null },
            combatLogSummary: ["Journal de combat initialisé."],
            currentZoneId: 'sector_x9', unlockedZones: ['sector_x9'],
            map: { tiles: [], explored: [], nanobotPos: (typeof ZONE_DATA !== 'undefined' && ZONE_DATA['sector_x9'] ? {...ZONE_DATA['sector_x9'].entryPoint} : {x:0,y:0}), zoneId: 'sector_x9', currentEnemyEncounter: null },
            shopStock: ['item_laser_mk1', 'item_nanosword', 'item_plating_basic', 'item_repair_kit_s'],
            purchasedShopItems: [], baseGrid: [],
            placementMode: { isActive: false, selectedDefenseType: null, selectedDefenseLevel: 0},
            baseStats: { currentHealth: (typeof BASE_INITIAL_HEALTH !== 'undefined' ? BASE_INITIAL_HEALTH : 500) , maxHealth: (typeof BASE_INITIAL_HEALTH !== 'undefined' ? BASE_INITIAL_HEALTH : 500), defensePower: 0 },
            defenses: {},
            nightAssault: { isActive: false, wave: 0, enemies: [], lastAttackTime: 0, log: ["Journal d'assaut initialisé."], currentEvent: null, globalModifiers: {} },
            activeCombatSkills: {}, activeResearch: null
        };
        for(const key in defaultGameState){ 
            if(gameState[key] === undefined){ gameState[key] = JSON.parse(JSON.stringify(defaultGameState[key]));} 
            else if (typeof defaultGameState[key] === 'object' && defaultGameState[key] !== null && !Array.isArray(defaultGameState[key])) {
                 gameState[key] = {...defaultGameState[key], ...gameState[key]}; 
                 for(const subKey in defaultGameState[key]){ 
                     if(typeof gameState[key] === 'object' && gameState[key] !== null && gameState[key][subKey] === undefined){
                         gameState[key][subKey] = defaultGameState[key][subKey];
                     }
                 }
            }
        }
        if (typeof buildingsData !== 'undefined') { for (const id in buildingsData) if (gameState.buildings[id] === undefined) gameState.buildings[id] = 0; } 
        else { console.error("buildingsData n'est pas défini avant son utilisation dans init()."); return;}

        // console.log("init() - Avant loadGame");
        if(typeof loadGame === 'function') loadGame(); else { console.error("ERREUR: loadGame n'est pas défini !"); }
        // console.log("init() - Après loadGame");
        
        // console.log("init() - Avant generateMap/initializeBaseGrid");
        if (!gameState.map.tiles || gameState.map.tiles.length === 0 || gameState.map.zoneId !== gameState.currentZoneId) {
            if(typeof generateMap === 'function') generateMap(gameState.currentZoneId); 
            else console.error("generateMap n'est pas défini dans init");
        }
         if (!gameState.baseGrid || gameState.baseGrid.length === 0 || (gameState.baseGrid.length > 0 && typeof BASE_GRID_SIZE !== 'undefined' && gameState.baseGrid.length !== BASE_GRID_SIZE.rows) ) { 
            if(typeof initializeBaseGrid === 'function') initializeBaseGrid();
            else console.error("initializeBaseGrid n'est pas défini dans init");
        }
        // console.log("init() - Après generateMap/initializeBaseGrid");
        
        // console.log("init() - Avant calculs");
        if(typeof calculateNanobotStats === 'function') calculateNanobotStats(); else console.error("calculateNanobotStats n'est pas défini dans init");
        if(typeof calculateBaseStats === 'function') calculateBaseStats();  else console.error("calculateBaseStats n'est pas défini dans init");
        if(typeof calculateProductionAndConsumption === 'function') calculateProductionAndConsumption(); else console.error("calculateProductionAndConsumption n'est pas défini dans init");
        // console.log("init() - Après calculs");
        
        // console.log("init() - Avant updateDisplays");
        if(typeof updateDisplays === 'function') updateDisplays(); else console.error("updateDisplays n'est pas défini dans init");
        // console.log("init() - Après updateDisplays");
        
        // console.log("init() - Avant remplissage des logs");
        if(eventLogEl) { eventLogEl.innerHTML = '<h3 class="font-semibold mb-2 text-gray-300">Journal Principal des Événements :</h3>'; (gameState.eventLog || ["Bienvenue."]).forEach(msg => { const e = document.createElement('p'); e.innerHTML = msg; eventLogEl.appendChild(e); }); eventLogEl.scrollTop = eventLogEl.scrollHeight; }
        if(combatLogSummaryEl) { combatLogSummaryEl.innerHTML = '<h4 class="font-semibold mb-1 text-gray-300">Résumé Combat :</h4>'; (gameState.combatLogSummary || ["Initialisé."]).forEach(msg => { const e = document.createElement('p'); e.innerHTML = msg; combatLogSummaryEl.appendChild(e); }); combatLogSummaryEl.scrollTop = combatLogSummaryEl.scrollHeight; }
        if(nightAssaultLogEl) { 
            const h3Title = nightAssaultLogEl.querySelector('h3');
            if (h3Title) nightAssaultLogEl.innerHTML = h3Title.outerHTML; else nightAssaultLogEl.innerHTML = ""; 
            (gameState.nightAssault.log || ["Initialisé."]).forEach(msg => { 
                const entry = document.createElement('p'); 
                if (msg.includes("subit") || msg.includes("ALERTE CRITIQUE") || msg.includes("détruit")) entry.classList.add("text-red-400");
                else if (msg.includes("neutralisent") || msg.includes("intercepte") || msg.includes("Défenses")) entry.classList.add("text-teal-300");
                else if (msg.includes("Récupéré") || msg.includes("survivée")) entry.classList.add("text-green-400");
                else if (msg.includes("approche") || msg.includes("Vague")) entry.classList.add("text-orange-300");
                else entry.classList.add("text-gray-400");
                entry.innerHTML = msg; 
                nightAssaultLogEl.appendChild(entry); 
            }); 
            if (!gameState.nightAssault.log || gameState.nightAssault.log.length === 0 || (gameState.nightAssault.log.length === 1 && gameState.nightAssault.log[0].includes("initialisé"))) { 
                if(!nightAssaultLogEl.querySelector('p.text-gray-500.italic')) { 
                    nightAssaultLogEl.insertAdjacentHTML('beforeend', '<p class="text-gray-500 italic">En attente d\'événements...</p>'); 
                }
            }
            nightAssaultLogEl.scrollTop = nightAssaultLogEl.scrollHeight; 
        }
        // console.log("init() - Après remplissage des logs");

        // console.log("init() - Avant setupEventListeners");
        if(typeof setupEventListeners === 'function') setupEventListeners(); else console.error("ERREUR: setupEventListeners n'est pas défini !");
        // console.log("init() - Après setupEventListeners");

        // console.log("init() - Avant setInterval(gameLoop)");
        if(typeof gameLoop === 'function') {
            gameIntervalId = setInterval(gameLoop, TICK_SPEED); 
        } else { 
            console.error("ERREUR CRITIQUE: gameLoop n'est pas défini, la boucle de jeu ne démarrera pas !"); 
        }
        // console.log("init() - Après setInterval(gameLoop) - Fin normale de init");

    } catch (e) {
        // alert("Erreur majeure DANS init(): " + e.message + "\nLigne: " + (e.lineNumber || 'N/A') + "\nFichier: " + (e.fileName || 'N/A') + "\nStack: " + e.stack);
        console.error("Erreur majeure DANS init(): ", e);
    }
}
        
const SAVE_KEY = 'nexus7GameState_v1.0.1'; // Incrément pour robustesse init/load
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(gameState)); } catch (e) { console.error("Err Sauvegarde: ", e); if(typeof addLogEntry === 'function' && eventLogEl) addLogEntry("Err Sauvegarde Locale.", "error"); } }
function loadGame() {
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (savedGame) {
        try {
            const loadedState = JSON.parse(savedGame);
            for (const key in gameState) { 
                if (loadedState.hasOwnProperty(key)) {
                    if (typeof gameState[key] === 'object' && gameState[key] !== null && !Array.isArray(gameState[key]) &&
                        typeof loadedState[key] === 'object' && loadedState[key] !== null && !Array.isArray(loadedState[key])) {
                        gameState[key] = { ...gameState[key], ...loadedState[key] };
                        if (key === 'map' && loadedState.map) { 
                             gameState.map.tiles = loadedState.map.tiles || [];
                             gameState.map.explored = loadedState.map.explored || [];
                             const zoneForPos = loadedState.currentZoneId || gameState.currentZoneId || 'sector_x9';
                             gameState.map.nanobotPos = loadedState.map.nanobotPos || {...(ZONE_DATA[zoneForPos]?.entryPoint || BASE_COORDINATES)};
                             gameState.map.zoneId = loadedState.map.zoneId || zoneForPos;
                        }
                         if (key === 'nanobotStats' && loadedState.nanobotStats) {
                            const defaultNanobotStats = {level: 1, xp: 0, xpToNext: 100, isDefendingBase: false, rage: 0, focusStacks: 0, baseHealth: 100, currentHealth: 100, baseAttack: 10, baseDefense: 5, baseSpeed: 10, health: 100, attack: 10, defense: 5, speed: 10};
                            gameState.nanobotStats = {...defaultNanobotStats, ...gameState.nanobotStats, ...loadedState.nanobotStats};
                        }
                        if (key === 'nightAssault' && loadedState.nightAssault) {
                            const defaultNightAssault = {isActive: false, wave: 0, enemies:[], lastAttackTime: 0, log: ["Journal d'assaut initialisé."], currentEvent: null, globalModifiers: {}};
                            gameState.nightAssault = {...defaultNightAssault, ...gameState.nightAssault, ...loadedState.nightAssault};
                            if(gameState.nightAssault.enemies && Array.isArray(gameState.nightAssault.enemies)) { 
                                gameState.nightAssault.enemies = gameState.nightAssault.enemies.map(eg => { 
                                    const definition = nightAssaultEnemies.find(def => def.id === eg.typeInfo?.id || def.name === eg.typeInfo?.name); 
                                    return definition ? {...eg, typeInfo: {...definition, ...eg.typeInfo}} : eg; 
                                }); 
                            } else { gameState.nightAssault.enemies = []; }
                        }
                    } else { 
                        gameState[key] = loadedState[key];
                    }
                }
            }
             if(typeof addLogEntry === 'function' && eventLogEl) addLogEntry(`Partie chargée (${SAVE_KEY}).`, "info");
        } catch(e) { 
            console.error("Erreur lors du chargement de la sauvegarde: ", e); 
            if(typeof addLogEntry === 'function' && eventLogEl) addLogEntry(`Sauvegarde corrompue ou invalide (${SAVE_KEY}). Démarrage d'une nouvelle partie.`, "error"); 
            localStorage.removeItem(SAVE_KEY); 
        }
    } 
    const defaultGameStateForLoad = { 
        currentZoneId: 'sector_x9', unlockedZones: ['sector_x9'], inventory: [],
        nanobotEquipment: { weapon: null, armor: null, utility1: null, utility2: null },
        shopStock: ['item_laser_mk1', 'item_nanosword', 'item_plating_basic', 'item_repair_kit_s'],
        purchasedShopItems: [], nanobotModuleLevels: {}, baseGrid: [],
        placementMode: { isActive: false, selectedDefenseType: null, selectedDefenseLevel: 0},
        activeCombatSkills: {}, activeResearch: null,
         map: { tiles: [], explored: [], nanobotPos: {...(ZONE_DATA['sector_x9']?.entryPoint || {x:0,y:0})}, zoneId: 'sector_x9', currentEnemyEncounter: null },
         baseStats: { currentHealth: BASE_INITIAL_HEALTH, maxHealth: BASE_INITIAL_HEALTH, defensePower: 0 },
         defenses: {},
         nightAssault: { isActive: false, wave: 0, enemies: [], lastAttackTime: 0, log: ["Journal d'assaut initialisé."], currentEvent: null, globalModifiers: {} },
         nanobotStats: { baseHealth: 100, currentHealth: 100, baseAttack: 10, baseDefense: 5, baseSpeed: 10, health: 100, attack: 10, defense: 5, speed: 10, level: 1, xp: 0, xpToNext: 100, isDefendingBase: false, rage: 0, focusStacks: 0 },
         eventLog: ["Bienvenue, Nexus-7. Initialisation..."], combatLogSummary: ["Journal de combat initialisé."]
    };
    for(const key in defaultGameStateForLoad){
        if(gameState[key] === undefined){ gameState[key] = JSON.parse(JSON.stringify(defaultGameStateForLoad[key])); } 
        else if (typeof defaultGameStateForLoad[key] === 'object' && defaultGameStateForLoad[key] !== null && !Array.isArray(defaultGameStateForLoad[key])) {
            for(const subKey in defaultGameStateForLoad[key]){ 
                if(typeof gameState[key] === 'object' && gameState[key] !== null && gameState[key][subKey] === undefined){
                    gameState[key][subKey] = defaultGameStateForLoad[key][subKey];
                }
            }
        } else if (Array.isArray(defaultGameStateForLoad[key]) && (!Array.isArray(gameState[key]) || (gameState[key].length === 0 && defaultGameStateForLoad[key].length > 0 ) ) ){
            gameState[key] = JSON.parse(JSON.stringify(defaultGameStateForLoad[key])); 
        }
    }
    if(typeof ZONE_DATA !== 'undefined' && ZONE_DATA[gameState.currentZoneId] && !gameState.map.nanobotPos){
        gameState.map.nanobotPos = {...ZONE_DATA[gameState.currentZoneId].entryPoint};
    } else if (!gameState.map.nanobotPos) { 
        gameState.map.nanobotPos = {x:0, y:0};
    }
    if(!gameState.map.zoneId) gameState.map.zoneId = gameState.currentZoneId;
}

window.onload = init; 
// console.log("main.js - Fin du fichier.");