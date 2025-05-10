// js/main.js
// alert("main.js chargé !"); // Test de chargement du fichier

// --- Variables globales pour les éléments DOM (déclarées, mais assignées dans initDOMReferences) ---
let biomassEl, nanitesEl, energyEl, biomassRateEl, nanitesRateEl, energyCapacityEl, energyCostMoveEl;
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
let mapGridEl, nanobotMapPosEl, tileInfoDisplayEl;
let combatEndModalEl, combatEndTitleEl, combatEndRewardsEl, xpGainEl, xpBarEl, lootListEl, closeEndModalBtn, toggleSpeedBtn;
let inventoryListEl, shopItemsListEl;
let baseHealthDisplayEl, baseHealthValueEl, baseMaxHealthValueEl;
let overviewBaseHealthEl, baseHealthBarContainerEl, baseHealthBarEl;
let baseDefensePowerEl, activeDefensesDisplayEl;
let repairBaseBtn, repairDefensesBtn, toggleNanobotDefendBaseBtn, forceCycleChangeBtn; // Ajout de forceCycleChangeBtn ici

let activeResearch = null; // Garder activeResearch ici s'il est global à la logique de jeu principale


// --- Boucle de Jeu Principale ---
function gameLoop() { 
    if (gameState.capacity.energy >= gameState.resources.energy) { gameState.resources.biomass += gameState.productionRates.biomass * (TICK_SPEED / 1000); gameState.resources.nanites += gameState.productionRates.nanites * (TICK_SPEED / 1000); } 
    if (activeResearch) { const research = researchData[activeResearch.id]; if (gameState.gameTime - activeResearch.startTime >= activeResearch.totalTime) { gameState.research[activeResearch.id] = true; addLogEntry(`Technologie ${research.name} acquise!`, "success"); if (research.grantsModule || research.grantsStatBoost) calculateNanobotStats(); activeResearch = null; updateResearchDisplay(); /* MAJ UI spécifique */ } } 
    if (gameState.nightAssault.isActive && !gameState.isDay) { processNightAssaultTick(); }
    updateGameTimeAndCycle(); updateDisplays(); saveGame(); 
}

// --- Initialisation et Tabs ---
function initDOMReferences() {
    // alert("initDOMReferences appelée"); // Test
    biomassEl=document.getElementById('biomass'); nanitesEl=document.getElementById('nanites'); energyEl=document.getElementById('energy'); biomassRateEl=document.getElementById('biomassRate'); nanitesRateEl=document.getElementById('nanitesRate'); energyCapacityEl=document.getElementById('energyCapacity'); energyCostMoveEl=document.getElementById('energyCostMove');
    buildingsSection=document.getElementById('buildings-section'); researchSection=document.getElementById('research-content'); eventLogEl=document.getElementById('event-log'); gameTimeEl=document.getElementById('gameTime'); cycleStatusEl=document.getElementById('cycleStatus');
    tabOverview=document.getElementById('tab-overview'); tabResearch=document.getElementById('tab-research'); tabNanobot=document.getElementById('tab-nanobot'); tabExploration=document.getElementById('tab-exploration'); tabInventory=document.getElementById('tab-inventory'); tabShop=document.getElementById('tab-shop');
    overviewContentElTab=document.getElementById('overview-content'); researchContentEl=document.getElementById('research-content'); nanobotContentEl=document.getElementById('nanobot-content'); explorationContentEl=document.getElementById('exploration-content'); inventoryContentEl=document.getElementById('inventory-content'); shopContentEl=document.getElementById('shop-content');
    modal = document.getElementById('modal'); modalTitle = document.getElementById('modal-title'); modalMessage = document.getElementById('modal-message'); modalConfirm = document.getElementById('modal-confirm'); modalCancel = document.getElementById('modal-cancel');
    nanobotHealthEl=document.getElementById('nanobot-health'); nanobotAttackEl=document.getElementById('nanobot-attack'); nanobotDefenseEl=document.getElementById('nanobot-defense'); nanobotSpeedEl=document.getElementById('nanobot-speed');
    nanobotVisualBody=document.getElementById('nanobot-body'); equippedModulesDisplayEl=document.getElementById('equipped-modules-display'); equippedItemsDisplayBriefEl = document.getElementById('equipped-items-display-brief');
    nanobotEquipmentSlotsEl = document.getElementById('nanobot-equipment-slots');
    simulateCombatBtn=document.getElementById('simulate-combat-btn'); combatLogSummaryEl=document.getElementById('combat-log-summary');
    combatModalEl=document.getElementById('combat-modal'); 
    combatNanobotSprite=document.getElementById('combat-nanobot-sprite'); combatEnemySprite=document.getElementById('combat-enemy-sprite');
    combatNanobotHealthbar=document.getElementById('combat-nanobot-healthbar'); combatEnemyHealthbar=document.getElementById('combat-enemy-healthbar');
    combatEnemyNameEl=document.getElementById('combat-enemy-name'); combatLogVisualEl=document.getElementById('combat-log-visual'); closeCombatModalBtn=document.getElementById('close-combat-modal-btn');
    mapGridEl = document.getElementById('map-grid'); nanobotMapPosEl = document.getElementById('nanobot-map-pos'); tileInfoDisplayEl = document.getElementById('tile-info-display');
    combatEndModalEl = document.getElementById('combat-end-modal'); combatEndTitleEl = document.getElementById('combat-end-title'); combatEndRewardsEl = document.getElementById('combat-end-rewards'); xpGainEl = document.getElementById('xp-gain'); xpBarEl = document.getElementById('xp-bar'); lootListEl = document.getElementById('loot-list'); closeEndModalBtn = document.getElementById('close-end-modal'); toggleSpeedBtn = document.getElementById('toggle-speed-btn');
    inventoryListEl = document.getElementById("inventory-list"); shopItemsListEl = document.getElementById("shop-items-list");
    baseHealthDisplayEl = document.getElementById('base-health-display'); baseHealthValueEl = document.getElementById('base-health-value'); baseMaxHealthValueEl = document.getElementById('base-max-health-value');
    overviewBaseHealthEl = document.getElementById('overview-base-health'); baseHealthBarContainerEl = document.getElementById('base-health-bar-container'); baseHealthBarEl = document.getElementById('base-health-bar');
    baseDefensePowerEl = document.getElementById('base-defense-power'); activeDefensesDisplayEl = document.getElementById('active-defenses-display');
    repairBaseBtn = document.getElementById('repair-base-btn'); repairDefensesBtn = document.getElementById('repair-defenses-btn'); toggleNanobotDefendBaseBtn = document.getElementById('toggle-nanobot-defend-base-btn');
    nightAssaultEnemiesDisplayEl = document.getElementById('night-assault-enemies-display'); nightAssaultLogEl = document.getElementById('night-assault-log');
    forceCycleChangeBtn = document.getElementById('force-cycle-change-btn'); 
}

function setupEventListeners() {
    // alert("setupEventListeners appelée"); // Test
    modalConfirm.addEventListener('click', () => { if (modalConfirmCallback) modalConfirmCallback(); hideModal(); });
    modalCancel.addEventListener('click', hideModal);

    if(simulateCombatBtn) simulateCombatBtn.addEventListener('click', () => { 
        const testEnemy = { name: "Drone d'Entraînement", health: 40, maxHealth:40, attack: 10, defense: 3, color: '#4299e1', spritePath: 'images/enemy_drone_training.png' }; // Assurez-vous que spritePath est défini ou null
        simulateCombat(testEnemy); 
    });
    if(closeCombatModalBtn) closeCombatModalBtn.addEventListener('click', () => { combatModalEl.classList.add('hidden'); updateExplorationDisplay(); });
    if(toggleSpeedBtn) {
        toggleSpeedBtn.addEventListener('click', () => { 
            combatSpeedMultiplier = (combatSpeedMultiplier === 1) ? 3 : 1; 
            toggleSpeedBtn.textContent = combatSpeedMultiplier === 1 ? "Vitesse x3" : "Vitesse x1"; 
            COMBAT_ANIMATION_DELAY = COMBAT_ANIMATION_DELAY_BASE / combatSpeedMultiplier; 
        });
        toggleSpeedBtn.textContent = combatSpeedMultiplier === 1 ? "Vitesse x3" : "Vitesse x1"; 
    }
    if(closeEndModalBtn) closeEndModalBtn.addEventListener('click', () => { combatEndModalEl.classList.add('hidden'); });
    if(repairBaseBtn) repairBaseBtn.addEventListener('click', () => repairBase(20)); 
    if(repairDefensesBtn) repairDefensesBtn.addEventListener('click', repairAllDefenses);
    if(toggleNanobotDefendBaseBtn) toggleNanobotDefendBaseBtn.addEventListener('click', toggleNanobotDefendBase);
    if(forceCycleChangeBtn) forceCycleChangeBtn.addEventListener('click', () => forceCycleChange(false));

    // Tabs setup
    let tabs = [ 
        { btn: tabOverview, content: overviewContentElTab }, 
        { btn: tabResearch, content: researchContentEl }, 
        { btn: tabNanobot, content: nanobotContentEl }, 
        { btn: tabExploration, content: explorationContentEl }, 
        { btn: tabInventory, content: inventoryContentEl }, 
        { btn: tabShop, content: shopContentEl } 
    ];
    tabs.forEach(tabInfo => {
        if (tabInfo.btn) { 
            tabInfo.btn.addEventListener('click', () => {
                tabs.forEach(t => { 
                    if(t.content) t.content.classList.add('hidden'); 
                    if(t.btn) {
                        t.btn.classList.remove('border-blue-400', 'text-blue-300'); 
                        t.btn.classList.add('text-gray-500');
                    } 
                });
                if(tabInfo.content) tabInfo.content.classList.remove('hidden'); 
                if(tabInfo.btn) {
                    tabInfo.btn.classList.add('border-blue-400', 'text-blue-300'); 
                    tabInfo.btn.classList.remove('text-gray-500');
                }
                // Appels de mise à jour spécifiques à l'onglet
                if (tabInfo.btn === tabExploration && typeof updateExplorationDisplay === 'function') updateExplorationDisplay(); 
                if (tabInfo.btn === tabInventory && typeof updateInventoryDisplay === 'function') updateInventoryDisplay();
                if (tabInfo.btn === tabShop && typeof updateShopDisplay === 'function') updateShopDisplay();
                if (tabInfo.btn === tabNanobot && typeof updateNanobotModulesDisplay === 'function') updateNanobotModulesDisplay(); 
            });
        } else {
            console.warn("Un bouton d'onglet est manquant dans le DOM:", tabInfo);
        }
    });
     if(tabOverview) tabOverview.click(); // Clicker sur le premier onglet pour l'activer
}


function init() {
    // alert("init appelée"); // Test
    initDOMReferences(); 
    
    // Default initializations (seront écrasées par loadGame si une sauvegarde existe)
    if (!gameState.inventory) gameState.inventory = [];
    if (!gameState.nanobotEquipment) gameState.nanobotEquipment = { weapon: null, armor: null, utility1: null, utility2: null };
    if (!gameState.shopStock) gameState.shopStock = ['item_laser_mk1', 'item_plating_basic', 'item_repair_kit_s'];
    if (!gameState.nanobotStats.level) { gameState.nanobotStats.level = 1; gameState.nanobotStats.xp = 0; gameState.nanobotStats.xpToNext = 100; }
    if (!gameState.baseStats) gameState.baseStats = { currentHealth: BASE_INITIAL_HEALTH, maxHealth: BASE_INITIAL_HEALTH, defensePower: 0 };
    if (!gameState.defenses) gameState.defenses = {};
    if (!gameState.nightAssault) gameState.nightAssault = { isActive: false, wave: 0, enemies: [], lastAttackTime: 0, log: ["Journal d'assaut initialisé."] };
    if (gameState.nanobotStats.isDefendingBase === undefined) gameState.nanobotStats.isDefendingBase = false;
    if (gameState.nanobotStats.rage === undefined) gameState.nanobotStats.rage = 0;
    if (gameState.nanobotStats.focusStacks === undefined) gameState.nanobotStats.focusStacks = 0;
    if (!gameState.activeCombatSkills) gameState.activeCombatSkills = {};
    if (!gameState.nanobotModuleLevels) gameState.nanobotModuleLevels = {};
    if (!gameState.purchasedShopItems) gameState.purchasedShopItems = [];
    
    for (const id in buildingsData) if (gameState.buildings[id] === undefined) gameState.buildings[id] = 0;
    
    loadGame(); // Tenter de charger une partie sauvegardée
    
    if (!gameState.map.tiles || gameState.map.tiles.length === 0) { generateMap(); }
    
    // Calculs initiaux et mise à jour de l'affichage
    calculateNanobotStats(); 
    calculateBaseStats(); 
    calculateProductionAndConsumption(); 
    updateDisplays(); // Ceci devrait mettre à jour tous les éléments d'UI basé sur gameState
    
    // Remplir les logs initiaux
    eventLogEl.innerHTML = '<h3 class="font-semibold mb-2 text-gray-300">Journal Principal des Événements :</h3>'; 
    (gameState.eventLog || ["Bienvenue, Nexus-7. Initialisation..."]).forEach(msg => { 
        const e = document.createElement('p'); e.innerHTML = msg; eventLogEl.appendChild(e); 
    }); 
    eventLogEl.scrollTop = eventLogEl.scrollHeight;

    combatLogSummaryEl.innerHTML = '<h4 class="font-semibold mb-1 text-gray-300">Résumé Combat :</h4>'; 
    (gameState.combatLogSummary || ["Journal de combat initialisé."]).forEach(msg => { 
        const e = document.createElement('p'); e.innerHTML = msg; combatLogSummaryEl.appendChild(e); 
    }); 
    combatLogSummaryEl.scrollTop = combatLogSummaryEl.scrollHeight;
    
    nightAssaultLogEl.innerHTML = "";
    (gameState.nightAssault.log || ["Journal d'assaut initialisé."]).forEach(msg => { 
        const entry = document.createElement('p'); 
        // ... (logique de coloration pour le log d'assaut) ...
        if (msg.includes("subit") || msg.includes("ALERTE CRITIQUE") || msg.includes("détruit")) entry.classList.add("text-red-400");
        else if (msg.includes("neutralisent") || msg.includes("intercepte") || msg.includes("Défenses")) entry.classList.add("text-teal-300");
        else if (msg.includes("Récupéré") || msg.includes("survivée")) entry.classList.add("text-green-400");
        else if (msg.includes("approche") || msg.includes("Vague")) entry.classList.add("text-orange-300");
        else entry.classList.add("text-gray-400");
        entry.innerHTML = msg; 
        nightAssaultLogEl.appendChild(entry); 
    }); 
    if (gameState.nightAssault.log.length === 0 || (gameState.nightAssault.log.length === 1 && gameState.nightAssault.log[0].includes("initialisé"))) { 
        nightAssaultLogEl.innerHTML = '<p class="text-gray-500 italic">En attente d\'événements...</p>'; 
    }
    nightAssaultLogEl.scrollTop = nightAssaultLogEl.scrollHeight;

    setupEventListeners(); // Attacher les écouteurs d'événements après que tout le reste soit prêt

    setInterval(gameLoop, TICK_SPEED);
}
        
// --- Sauvegarde / Chargement ---
const SAVE_KEY = 'nexus7GameState_v0.9.2'; 
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(gameState)); } catch (e) { console.error("Err Sauvegarde: ", e); addLogEntry("Err Sauvegarde Locale.", "error"); } }
function loadGame() {
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (savedGame) {
        try {
            const loadedState = JSON.parse(savedGame);
            for (const key in loadedState) {
                if (loadedState.hasOwnProperty(key)) {
                    if (typeof loadedState[key] === 'object' && loadedState[key] !== null && !Array.isArray(loadedState[key]) && 
                        gameState.hasOwnProperty(key) && typeof gameState[key] === 'object' && gameState[key] !== null && !Array.isArray(gameState[key])) {
                        // Fusionne les objets de premier niveau, écrase les tableaux et les types primitifs
                        if (['resources', 'productionRates', 'capacity', 'buildings', 'research', 'map', 'baseStats', 'defenses', 'nanobotEquipment', 'activeCombatSkills', 'nanobotModuleLevels', 'purchasedShopItems'].includes(key)) {
                            gameState[key] = { ...gameState[key], ...loadedState[key] };
                            if (key === 'map' && loadedState.map) { 
                                gameState.map.tiles = loadedState.map.tiles || [];
                                gameState.map.explored = loadedState.map.explored || [];
                                gameState.map.nanobotPos = loadedState.map.nanobotPos || {...BASE_COORDINATES};
                            }
                        } else if (key === 'nanobotStats') { 
                            gameState.nanobotStats = { ...gameState.nanobotStats, ...loadedState.nanobotStats};
                        } else if (key === 'nightAssault') {
                            gameState.nightAssault = { ...gameState.nightAssault, ...loadedState.nightAssault};
                            if(gameState.nightAssault.enemies) { 
                                gameState.nightAssault.enemies = gameState.nightAssault.enemies.map(eg => { 
                                    const definition = nightAssaultEnemies.find(def => def.id === eg.id || def.name === eg.name); 
                                    return definition ? {...definition, ...eg} : eg; 
                                }); 
                            }
                        } else { 
                            gameState[key] = loadedState[key];
                        }
                    } else { 
                        gameState[key] = loadedState[key];
                    }
                }
            }
            // S'assurer que toutes les propriétés de gameState sont présentes après le chargement
            if (!gameState.baseStats) gameState.baseStats = { currentHealth: BASE_INITIAL_HEALTH, maxHealth: BASE_INITIAL_HEALTH, defensePower: 0 };
            if (!gameState.defenses) gameState.defenses = {};
            if (!gameState.nightAssault) gameState.nightAssault = { isActive: false, wave: 0, enemies: [], lastAttackTime: 0, log: ["Journal d'assaut initialisé."] };
            else if (!gameState.nightAssault.log) gameState.nightAssault.log = ["Journal d'assaut initialisé."]; 
            if (gameState.nanobotStats.isDefendingBase === undefined) gameState.nanobotStats.isDefendingBase = false;
            if (gameState.nanobotStats.rage === undefined) gameState.nanobotStats.rage = 0;
            if (gameState.nanobotStats.focusStacks === undefined) gameState.nanobotStats.focusStacks = 0;
            if (!gameState.activeCombatSkills) gameState.activeCombatSkills = {};
            if (!gameState.inventory) gameState.inventory = [];
            if (!gameState.nanobotEquipment) gameState.nanobotEquipment = { weapon: null, armor: null, utility1: null, utility2: null };
            if (!gameState.shopStock) gameState.shopStock = ['item_laser_mk1', 'item_plating_basic', 'item_repair_kit_s'];
            if (!gameState.purchasedShopItems) gameState.purchasedShopItems = [];
            if (!gameState.nanobotModuleLevels) gameState.nanobotModuleLevels = {};
            if (!gameState.nanobotStats.level) { gameState.nanobotStats.level = 1; gameState.nanobotStats.xp = 0; gameState.nanobotStats.xpToNext = 100; }

            // Log de chargement seulement si une sauvegarde a été effectivement chargée et parsée
            addLogEntry(`Partie chargée (${SAVE_KEY}).`, "info");
        } catch(e) { 
            console.error("Erreur lors du chargement de la sauvegarde: ", e); 
            addLogEntry(`Sauvegarde corrompue ou invalide (${SAVE_KEY}). Démarrage d'une nouvelle partie.`, "error"); 
            localStorage.removeItem(SAVE_KEY); 
            // Réinitialiser gameState à ses valeurs par défaut si le chargement échoue gravement
            // (la structure gameState de base est déjà définie, mais on pourrait forcer une réinitialisation plus complète ici si nécessaire)
        }
    } 
}

window.onload = init; 