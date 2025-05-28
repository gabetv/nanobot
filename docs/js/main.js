// js/main.js
console.log("main.js - Fichier chargé et en cours d'analyse...");

// Références DOM Globales (initialisées dans initDOMReferences)
// Déclarées avec let ici pour le scope de ce fichier, mais assignées à window pour la globalité
let eventLogEl, biomassEl, nanitesEl, mobilityEl, energyEl, crystalShardsEl, crystalShardsDisplayContainer,
    biomassRateEl, nanitesRateEl, gameTimeEl, cycleStatusEl,
    xpBarEl, nanobotHealthEl, nanobotAttackEl, nanobotDefenseEl, nanobotSpeedEl,
    equippedModulesDisplayEl, nanobotVisualBody, equippedItemsDisplayBriefEl, nanobotEquipmentSlotsEl,
    buildingsContainerEl, researchContainerEl, inventoryListEl, shopItemsListEl,
    baseHealthValueEl, baseMaxHealthValueEl, overviewBaseHealthEl, baseHealthBarEl, baseDefensePowerEl,
    repairBaseBtn, repairBaseFullBtn, repairDefensesBtn, forceCycleChangeBtn, baseHealthDisplayEl, 
    basePreviewContainerEl, placementInfoEl, selectedDefenseForPlacementEl, cancelPlacementBtnEl,
    nightAssaultEnemiesDisplayEl, nightAssaultLogEl,
    mapGridEl, mapScrollContainerEl, nanobotMapPosEl, tileInfoDisplayEl, centerMapBtnEl,
    scanMapButtonEl, explorationLogEl, zoneListEl, tileInteractionPanelEl, tileInteractionDetailsEl, tileInteractionActionsEl,
    explorationTitleEl, worldSectionContentEl,
    activeTileExplorationUIEl, activeExplorationTitleEl, exitActiveExplorationBtnEl,
    // previewNorthEl, previewWestEl, previewEastEl, previewSouthEl, // Anciens previews supprimés
    currentTileViewContainerEl, currentTileViewEl, currentTileImageEl, currentTileDescriptionEl, currentTileActionsGridEl,
    activeTileLogContainerEl, activeTileLogEl,
    // activeExploreNavNorthBtn, activeExploreNavWestBtn, activeExploreNavEastBtn, activeExploreNavSouthBtn, // Anciens boutons de nav supprimés
    activeExplorationNanobotStatusEl,
    modalEl, modalTitleEl, modalMessageEl, modalConfirmBtn, modalCancelBtn,
    combatModalEl, combatModalContentEl, combatTurnIndicatorEl, combatNanobotEl, combatNanobotSpriteEl, combatNanobotHealthbarEl,
    combatNanobotRageEl, combatNanobotGlobalEnergyEl,
    combatEnemyEl, combatEnemyNameEl, combatEnemySpriteEl, combatEnemyHealthbarEl,
    combatLogDetailsContainerEl, combatLogVisualEl,
    combatActionsContainerEl, combatActionFleeBtn,
    combatEndModalEl, combatEndTitleEl, combatEndRewardsEl, xpGainEl, combatXpBarEl, lootListEl, closeEndModalBtn,
    nightAssaultVideoContainerEl, nightAssaultVideoEl, closeNightAssaultVideoBtnEl,
    tutorialModalEl, tooltipEl,
    toggleNanobotDefendBaseBtn,
    questsContentEl, activeQuestsListEl, completedQuestsListEl,
    shopContentEl, craftingContentEl; 

var gameState;

let gameLoopInterval = null;
let lastTickTime = 0;
let isGamePaused = false;
const currentVersion = "1.1.4"; 

function initDOMReferences() {
    console.log("main.js: initDOMReferences - Début");
    eventLogEl = document.getElementById('event-log'); window.eventLogEl = eventLogEl;
    biomassEl = document.getElementById('biomass'); window.biomassEl = biomassEl;
    nanitesEl = document.getElementById('nanites'); window.nanitesEl = nanitesEl;
    mobilityEl = document.getElementById('mobility'); window.mobilityEl = mobilityEl;
    energyEl = document.getElementById('energy'); window.energyEl = energyEl;
    crystalShardsEl = document.getElementById('crystal_shards'); window.crystalShardsEl = crystalShardsEl;
    crystalShardsDisplayContainer = document.getElementById('crystal-shards-display-container'); window.crystalShardsDisplayContainer = crystalShardsDisplayContainer;
    biomassRateEl = document.getElementById('biomassRate'); window.biomassRateEl = biomassRateEl;
    nanitesRateEl = document.getElementById('nanitesRate'); window.nanitesRateEl = nanitesRateEl;
    gameTimeEl = document.getElementById('gameTime'); window.gameTimeEl = gameTimeEl;
    cycleStatusEl = document.getElementById('cycleStatus'); window.cycleStatusEl = cycleStatusEl;

    xpBarEl = document.getElementById('xp-bar'); window.xpBarEl = xpBarEl;
    nanobotHealthEl = document.getElementById('nanobot-health'); window.nanobotHealthEl = nanobotHealthEl;
    nanobotAttackEl = document.getElementById('nanobot-attack'); window.nanobotAttackEl = nanobotAttackEl;
    nanobotDefenseEl = document.getElementById('nanobot-defense'); window.nanobotDefenseEl = nanobotDefenseEl;
    nanobotSpeedEl = document.getElementById('nanobot-speed'); window.nanobotSpeedEl = nanobotSpeedEl;
    equippedModulesDisplayEl = document.getElementById('equipped-modules-display'); window.equippedModulesDisplayEl = equippedModulesDisplayEl;
    nanobotVisualBody = document.getElementById('nanobot-body'); window.nanobotVisualBody = nanobotVisualBody;
    equippedItemsDisplayBriefEl = document.getElementById('equipped-items-display-brief'); window.equippedItemsDisplayBriefEl = equippedItemsDisplayBriefEl;
    nanobotEquipmentSlotsEl = document.getElementById('nanobot-equipment-slots'); window.nanobotEquipmentSlotsEl = nanobotEquipmentSlotsEl;

    buildingsContainerEl = document.getElementById('buildings-section'); window.buildingsContainerEl = buildingsContainerEl;
    researchContainerEl = document.getElementById('research-content'); window.researchContainerEl = researchContainerEl;
    inventoryListEl = document.getElementById('inventory-list'); window.inventoryListEl = inventoryListEl;
    shopItemsListEl = document.getElementById('shop-items-list'); window.shopItemsListEl = shopItemsListEl;
    craftingContentEl = document.getElementById('crafting-content'); window.craftingContentEl = craftingContentEl;


    baseHealthValueEl = document.getElementById('base-health-value'); window.baseHealthValueEl = baseHealthValueEl;
    baseMaxHealthValueEl = document.getElementById('base-max-health-value'); window.baseMaxHealthValueEl = baseMaxHealthValueEl;
    overviewBaseHealthEl = document.getElementById('overview-base-health'); window.overviewBaseHealthEl = overviewBaseHealthEl;
    baseHealthBarEl = document.getElementById('base-health-bar'); window.baseHealthBarEl = baseHealthBarEl;
    baseDefensePowerEl = document.getElementById('base-defense-power'); window.baseDefensePowerEl = baseDefensePowerEl;
    repairBaseBtn = document.getElementById('repair-base-btn'); window.repairBaseBtn = repairBaseBtn;
    repairBaseFullBtn = document.getElementById('repair-base-full-btn'); window.repairBaseFullBtn = repairBaseFullBtn;
    repairDefensesBtn = document.getElementById('repair-defenses-btn'); window.repairDefensesBtn = repairDefensesBtn;
    forceCycleChangeBtn = document.getElementById('force-cycle-change-btn'); window.forceCycleChangeBtn = forceCycleChangeBtn;
    baseHealthDisplayEl = document.getElementById('base-health-display'); window.baseHealthDisplayEl = baseHealthDisplayEl;

    basePreviewContainerEl = document.getElementById('base-preview-container'); window.basePreviewContainerEl = basePreviewContainerEl;
    placementInfoEl = document.getElementById('placement-info'); window.placementInfoEl = placementInfoEl;
    selectedDefenseForPlacementEl = document.getElementById('selected-defense-for-placement'); window.selectedDefenseForPlacementEl = selectedDefenseForPlacementEl;
    cancelPlacementBtnEl = document.getElementById('cancel-placement-btn'); window.cancelPlacementBtnEl = cancelPlacementBtnEl;
    nightAssaultEnemiesDisplayEl = document.getElementById('night-assault-enemies-display'); window.nightAssaultEnemiesDisplayEl = nightAssaultEnemiesDisplayEl;
    nightAssaultLogEl = document.getElementById('night-assault-log'); window.nightAssaultLogEl = nightAssaultLogEl;

    mapGridEl = document.getElementById('map-grid'); window.mapGridEl = mapGridEl;
    mapScrollContainerEl = document.getElementById('map-scroll-container'); window.mapScrollContainerEl = mapScrollContainerEl;
    nanobotMapPosEl = document.getElementById('nanobot-map-pos'); window.nanobotMapPosEl = nanobotMapPosEl;
    tileInfoDisplayEl = document.getElementById('tile-info-display'); window.tileInfoDisplayEl = tileInfoDisplayEl;
    centerMapBtnEl = document.getElementById('center-map-btn'); window.centerMapBtnEl = centerMapBtnEl;
    scanMapButtonEl = document.getElementById('scan-map-button'); window.scanMapButtonEl = scanMapButtonEl;
    explorationLogEl = document.getElementById('exploration-log'); window.explorationLogEl = explorationLogEl;
    zoneListEl = document.getElementById('zone-list'); window.zoneListEl = zoneListEl;
    tileInteractionPanelEl = document.getElementById('tile-interaction-panel'); window.tileInteractionPanelEl = tileInteractionPanelEl;
    tileInteractionDetailsEl = document.getElementById('tile-interaction-details'); window.tileInteractionDetailsEl = tileInteractionDetailsEl;
    tileInteractionActionsEl = document.getElementById('tile-interaction-actions'); window.tileInteractionActionsEl = tileInteractionActionsEl;
    explorationTitleEl = document.getElementById('exploration-title'); window.explorationTitleEl = explorationTitleEl;
    worldSectionContentEl = document.getElementById('world-section-content'); window.worldSectionContentEl = worldSectionContentEl;

    // UI Exploration Active (nouvelle structure)
    activeTileExplorationUIEl = document.getElementById('active-tile-exploration-ui'); window.activeTileExplorationUIEl = activeTileExplorationUIEl;
    activeExplorationTitleEl = document.getElementById('active-exploration-title'); window.activeExplorationTitleEl = activeExplorationTitleEl;
    exitActiveExplorationBtnEl = document.getElementById('exit-active-exploration-btn'); window.exitActiveExplorationBtnEl = exitActiveExplorationBtnEl;
    // Plus besoin de previewNorthEl, WestEl, EastEl, SouthEl et des boutons de nav directionnels ici car la grille 3x3 les remplace
    
    // Éléments dans le panneau de détails de l'exploration active
    currentTileImageEl = document.getElementById('current-tile-image'); window.currentTileImageEl = currentTileImageEl;
    currentTileDescriptionEl = document.getElementById('current-tile-description'); window.currentTileDescriptionEl = currentTileDescriptionEl;
    currentTileActionsGridEl = document.getElementById('current-tile-actions-grid'); window.currentTileActionsGridEl = currentTileActionsGridEl;
    activeTileLogContainerEl = document.getElementById('active-tile-log-container'); window.activeTileLogContainerEl = activeTileLogContainerEl;
    activeTileLogEl = document.getElementById('active-tile-log'); window.activeTileLogEl = activeTileLogEl;
    activeExplorationNanobotStatusEl = document.getElementById('active-exploration-nanobot-status'); window.activeExplorationNanobotStatusEl = activeExplorationNanobotStatusEl;


    modalEl = document.getElementById('modal'); window.modalEl = modalEl;
    modalTitleEl = document.getElementById('modal-title'); window.modalTitleEl = modalTitleEl;
    modalMessageEl = document.getElementById('modal-message'); window.modalMessageEl = modalMessageEl;
    modalConfirmBtn = document.getElementById('modal-confirm'); window.modalConfirmBtn = modalConfirmBtn;
    modalCancelBtn = document.getElementById('modal-cancel'); window.modalCancelBtn = modalCancelBtn;

    combatModalEl = document.getElementById('combat-modal'); window.combatModalEl = combatModalEl;
    combatModalContentEl = document.getElementById('combat-modal-content'); window.combatModalContentEl = combatModalContentEl;
    combatTurnIndicatorEl = document.getElementById('combat-turn-indicator'); window.combatTurnIndicatorEl = combatTurnIndicatorEl;
    combatNanobotEl = document.getElementById('combat-nanobot'); window.combatNanobotEl = combatNanobotEl;
    combatNanobotSpriteEl = document.getElementById('combat-nanobot-sprite'); window.combatNanobotSpriteEl = combatNanobotSpriteEl;
    combatNanobotHealthbarEl = document.getElementById('combat-nanobot-healthbar'); window.combatNanobotHealthbarEl = combatNanobotHealthbarEl;
    combatNanobotRageEl = document.getElementById('combat-nanobot-rage'); window.combatNanobotRageEl = combatNanobotRageEl;
    combatNanobotGlobalEnergyEl = document.getElementById('combat-nanobot-global-energy'); window.combatNanobotGlobalEnergyEl = combatNanobotGlobalEnergyEl;
    combatEnemyEl = document.getElementById('combat-enemy'); window.combatEnemyEl = combatEnemyEl;
    combatEnemyNameEl = document.getElementById('combat-enemy-name'); window.combatEnemyNameEl = combatEnemyNameEl;
    combatEnemySpriteEl = document.getElementById('combat-enemy-sprite'); window.combatEnemySpriteEl = combatEnemySpriteEl;
    combatEnemyHealthbarEl = document.getElementById('combat-enemy-healthbar'); window.combatEnemyHealthbarEl = combatEnemyHealthbarEl;
    combatLogDetailsContainerEl = document.getElementById('combat-log-details-container'); window.combatLogDetailsContainerEl = combatLogDetailsContainerEl;
    combatLogVisualEl = document.getElementById('combat-log-visual'); window.combatLogVisualEl = combatLogVisualEl;
    if (!combatLogVisualEl) console.error("ERREUR initDOMReferences: #combat-log-visual non trouvé !"); else console.log("combatLogVisualEl trouvé:", combatLogVisualEl);
    combatActionsContainerEl = document.getElementById('combat-actions-container'); window.combatActionsContainerEl = combatActionsContainerEl;
    combatActionFleeBtn = document.getElementById('combat-action-flee'); window.combatActionFleeBtn = combatActionFleeBtn;

    combatEndModalEl = document.getElementById('combat-end-modal'); window.combatEndModalEl = combatEndModalEl;
    combatEndTitleEl = document.getElementById('combat-end-title'); window.combatEndTitleEl = combatEndTitleEl;
    combatEndRewardsEl = document.getElementById('combat-end-rewards'); window.combatEndRewardsEl = combatEndRewardsEl;
    xpGainEl = document.getElementById('xp-gain'); window.xpGainEl = xpGainEl;
    combatXpBarEl = document.getElementById('combat-end-modal').querySelector('#xp-bar'); window.combatXpBarEl = combatXpBarEl;
    lootListEl = document.getElementById('loot-list'); window.lootListEl = lootListEl;
    closeEndModalBtn = document.getElementById('close-end-modal'); window.closeEndModalBtn = closeEndModalBtn;

    nightAssaultVideoContainerEl = document.getElementById('night-assault-video-container'); window.nightAssaultVideoContainerEl = nightAssaultVideoContainerEl;
    nightAssaultVideoEl = document.getElementById('night-assault-video'); window.nightAssaultVideoEl = nightAssaultVideoEl;
    closeNightAssaultVideoBtnEl = document.getElementById('close-night-assault-video-btn'); window.closeNightAssaultVideoBtnEl = closeNightAssaultVideoBtnEl;

    tutorialModalEl = document.getElementById('tutorial-modal'); window.tutorialModalEl = tutorialModalEl;
    tooltipEl = document.getElementById('tooltip'); window.tooltipEl = tooltipEl;

    toggleNanobotDefendBaseBtn = document.getElementById('toggle-nanobot-defend-base-btn'); window.toggleNanobotDefendBaseBtn = toggleNanobotDefendBaseBtn;

    questsContentEl = document.getElementById('quests-content'); window.questsContentEl = questsContentEl;
    activeQuestsListEl = document.getElementById('active-quests-list'); window.activeQuestsListEl = activeQuestsListEl;
    completedQuestsListEl = document.getElementById('completed-quests-list'); window.completedQuestsListEl = completedQuestsListEl;
    shopContentEl = document.getElementById('shop-content'); window.shopContentEl = shopContentEl;

    console.log("main.js: initDOMReferences - Références DOM initialisées.");
}


function setupEventListeners() {
    console.log("main.js: setupEventListeners - Début");

    if(window.repairBaseBtn) window.repairBaseBtn.addEventListener('click', () => { if(typeof repairBase === 'function') repairBase(); });
    if(window.repairBaseFullBtn) window.repairBaseFullBtn.addEventListener('click', () => { if(typeof repairBaseFull === 'function') repairBaseFull(); });
    if(window.repairDefensesBtn) window.repairDefensesBtn.addEventListener('click', () => { if(typeof repairAllDefenses === 'function') repairAllDefenses(); });
    if(window.forceCycleChangeBtn) window.forceCycleChangeBtn.addEventListener('click', () => { if(typeof forceCycleChange === 'function') forceCycleChange(); });
    if(window.cancelPlacementBtnEl) window.cancelPlacementBtnEl.addEventListener('click', () => { if(typeof cancelPlacementMode === 'function') cancelPlacementMode(); });

    if(window.centerMapBtnEl) window.centerMapBtnEl.addEventListener('click', () => { if(typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.centerMapOnPlayer === 'function') window.explorationUI.centerMapOnPlayer(); });
    
    if(window.modalConfirmBtn) window.modalConfirmBtn.addEventListener('click', () => { if(typeof confirmModal === 'function') confirmModal(); });
    if(window.modalCancelBtn) window.modalCancelBtn.addEventListener('click', () => { if(typeof hideModal === 'function') hideModal(); });
    if(window.closeEndModalBtn) window.closeEndModalBtn.addEventListener('click', () => { if(typeof closeCombatEndModal === 'function') closeCombatEndModal(); });
    if(window.closeNightAssaultVideoBtnEl) window.closeNightAssaultVideoBtnEl.addEventListener('click', () => { if(typeof hideNightAssaultVideo === 'function') hideNightAssaultVideo(); });

    if(window.combatActionFleeBtn) window.combatActionFleeBtn.addEventListener('click', () => { if(typeof fleeCombat === 'function') fleeCombat(); });

    const simulateCombatButton = document.getElementById('simulate-combat-btn');
    if (simulateCombatButton) {
        simulateCombatButton.addEventListener('click', () => {
            if (typeof window.simulateCombat === 'function' && typeof window.DAMAGE_TYPES !== 'undefined') {
                const testEnemy = {
                    id: "training_drone_01", name: "Drone d'Entraînement",
                    health: 40, maxHealth: 40, attack: 10, defense: 3, speed: 5,
                    color: "#4299e1", spritePath: "https://placehold.co/80x100/4299e1/e2e8f0?text=TRAIN",
                    resistances: {}, damageType: window.DAMAGE_TYPES.KINETIC, xpValue: 15, lootTable: null, skills: []
                };
                window.simulateCombat(testEnemy);
            } else {
                console.error("La fonction simulateCombat ou DAMAGE_TYPES n'est pas définie.");
            }
        });
    }

    if(window.toggleNanobotDefendBaseBtn) {
        window.toggleNanobotDefendBaseBtn.addEventListener('click', () => {
            if (typeof toggleNanobotDefendBase === 'function') {
                toggleNanobotDefendBase();
            } else {
                console.error("toggleNanobotDefendBase function not found");
            }
        });
    }

    document.body.addEventListener('click', function(event) {
        const closestInfoIcon = event.target.closest('.info-icon');
        if (closestInfoIcon) {
            event.stopPropagation();
            const tooltipContainer = closestInfoIcon.closest('[data-tooltip-type][data-tooltip-id]');
            if (tooltipContainer) {
                const tooltipType = tooltipContainer.dataset.tooltipType;
                const tooltipId = tooltipContainer.dataset.tooltipId;
                const itemName = closestInfoIcon.title.replace("Plus d'infos sur ", "");
                if (tooltipType && tooltipId && typeof showItemInfoModal === 'function') {
                    showItemInfoModal(tooltipType, tooltipId, itemName);
                } else {
                    console.warn("Impossible d'afficher les infos: type ou id manquant pour l'info-icon.", closestInfoIcon);
                    if (typeof showModal === 'function') showModal("Information", "Détails non disponibles pour cet élément.", null, false);
                }
            }
        }
    });

    console.log("main.js: setupEventListeners - Fin");
}

function checkAllConfigLoaded() {
    const configs = [
        { name: "buildingsData", data: typeof window.buildingsData !== 'undefined' ? window.buildingsData : undefined, canBeEmpty: false },
        { name: "researchData", data: typeof window.researchData !== 'undefined' ? window.researchData : undefined, canBeEmpty: false },
        { name: "itemsData", data: typeof window.itemsData !== 'undefined' ? window.itemsData : undefined, canBeEmpty: false },
        { name: "nanobotModulesData", data: typeof window.nanobotModulesData !== 'undefined' ? window.nanobotModulesData : undefined, canBeEmpty: true },
        { name: "enemyData", data: typeof window.enemyData !== 'undefined' ? window.enemyData : undefined, canBeEmpty: false },
        { name: "tileData", data: typeof window.tileData !== 'undefined' ? window.tileData : undefined, canBeEmpty: false },
        { name: "zoneBiomesData", data: typeof window.zoneBiomesData !== 'undefined' ? window.zoneBiomesData : undefined, canBeEmpty: false },
        { name: "biomeColorMapping", data: typeof window.biomeColorMapping !== 'undefined' ? window.biomeColorMapping : undefined, canBeEmpty: false },
        { name: "storyEvents", data: typeof window.storyEvents !== 'undefined' ? window.storyEvents : undefined, canBeEmpty: true },
        { name: "QUEST_DATA", data: typeof window.QUEST_DATA !== 'undefined' ? window.QUEST_DATA : undefined, canBeEmpty: false }, 
        { name: "shopInventoryData", data: typeof window.shopInventoryData !== 'undefined' ? window.shopInventoryData : undefined, canBeEmpty: false }, 
        { name: "tutorialSteps", data: typeof window.tutorialSteps !== 'undefined' ? window.tutorialSteps : undefined, canBeEmpty: true },
        { name: "craftingRecipesData", data: typeof window.craftingRecipesData !== 'undefined' ? window.craftingRecipesData : undefined, canBeEmpty: true }, 
        { name: "EQUIPMENT_SLOTS", data: typeof window.EQUIPMENT_SLOTS !== 'undefined' ? window.EQUIPMENT_SLOTS : undefined, canBeEmpty: false },
        { name: "DAMAGE_TYPES", data: typeof window.DAMAGE_TYPES !== 'undefined' ? window.DAMAGE_TYPES : undefined, canBeEmpty: false },
        { name: "RESOURCE_TYPES", data: typeof window.RESOURCE_TYPES !== 'undefined' ? window.RESOURCE_TYPES : undefined, canBeEmpty: false },
        { name: "STAT_NAMES", data: typeof window.STAT_NAMES !== 'undefined' ? window.STAT_NAMES : undefined, canBeEmpty: false },
        { name: "ENEMY_TAGS", data: typeof window.ENEMY_TAGS !== 'undefined' ? window.ENEMY_TAGS : undefined, canBeEmpty: false },
        { name: "QUEST_STATUS", data: typeof window.QUEST_STATUS !== 'undefined' ? window.QUEST_STATUS : undefined, canBeEmpty: false },
        { name: "QUEST_TYPE", data: typeof window.QUEST_TYPE !== 'undefined' ? window.QUEST_TYPE : undefined, canBeEmpty: false },
        { name: "OBJECTIVE_TYPE", data: typeof window.OBJECTIVE_TYPE !== 'undefined' ? window.OBJECTIVE_TYPE : undefined, canBeEmpty: false },
        { name: "UNLOCK_TYPE", data: typeof window.UNLOCK_TYPE !== 'undefined' ? window.UNLOCK_TYPE : undefined, canBeEmpty: false },
        { name: "RARITY_COLORS", data: typeof window.RARITY_COLORS !== 'undefined' ? window.RARITY_COLORS : undefined, canBeEmpty: false },
        { name: "LOOT_TABLE_TIERS", data: typeof window.LOOT_TABLE_TIERS !== 'undefined' ? window.LOOT_TABLE_TIERS : undefined, canBeEmpty: false },
        { name: "TILE_TYPES", data: typeof window.TILE_TYPES !== 'undefined' ? window.TILE_TYPES : undefined, canBeEmpty: false },
        { name: "INITIAL_RESOURCES", data: typeof window.INITIAL_RESOURCES !== 'undefined' ? window.INITIAL_RESOURCES : undefined, canBeEmpty: false },
        { name: "MAX_MOBILITY_POINTS", data: typeof window.MAX_MOBILITY_POINTS !== 'undefined' ? window.MAX_MOBILITY_POINTS : undefined, canBeEmpty: false },
        { name: "BASE_STATS_CONFIG", data: typeof window.BASE_STATS_CONFIG !== 'undefined' ? window.BASE_STATS_CONFIG : undefined, canBeEmpty: false },
        { name: "NIGHT_ASSAULT_CONFIG", data: typeof window.NIGHT_ASSAULT_CONFIG !== 'undefined' ? window.NIGHT_ASSAULT_CONFIG : undefined, canBeEmpty: false },
        { name: "BASE_GRID_SIZE", data: typeof window.BASE_GRID_SIZE !== 'undefined' ? window.BASE_GRID_SIZE : undefined, canBeEmpty: false },
        { name: "NANOBOT_INITIAL_STATS", data: typeof window.NANOBOT_INITIAL_STATS !== 'undefined' ? window.NANOBOT_INITIAL_STATS : undefined, canBeEmpty: false },
        { name: "NANOBOT_SKILLS_CONFIG", data: typeof window.NANOBOT_SKILLS_CONFIG !== 'undefined' ? window.NANOBOT_SKILLS_CONFIG : undefined, canBeEmpty: true }, 
        { name: "LEVEL_XP_THRESHOLDS", data: typeof window.LEVEL_XP_THRESHOLDS !== 'undefined' ? window.LEVEL_XP_THRESHOLDS : undefined, isArray: true, canBeEmpty: false },
        { name: "EXPLORATION_SETTINGS", data: typeof window.EXPLORATION_SETTINGS !== 'undefined' ? window.EXPLORATION_SETTINGS : undefined, canBeEmpty: false },
        { name: "WORLD_ZONES", data: typeof window.WORLD_ZONES !== 'undefined' ? window.WORLD_ZONES : undefined, canBeEmpty: false }, 
        { name: "EVENT_TRIGGERS", data: typeof window.EVENT_TRIGGERS !== 'undefined' ? window.EVENT_TRIGGERS : undefined, canBeEmpty: false },
        { name: "GAME_VERSION_CONFIG_CHECK", data: typeof window.GAME_VERSION_CONFIG_CHECK !== 'undefined' ? window.GAME_VERSION_CONFIG_CHECK : undefined, canBeEmpty: false },
        { name: "TICK_SPEED", data: typeof window.TICK_SPEED !== 'undefined' ? window.TICK_SPEED : undefined, canBeEmpty: false },
        { name: "tileActiveExplorationOptions", data: typeof window.tileActiveExplorationOptions !== 'undefined' ? window.tileActiveExplorationOptions : undefined, canBeEmpty: false },
        { name: "activeTileViewData", data: typeof window.activeTileViewData !== 'undefined' ? window.activeTileViewData : undefined, canBeEmpty: false },
        { name: "explorationEnemyData", data: typeof window.explorationEnemyData !== 'undefined' ? window.explorationEnemyData : undefined, canBeEmpty: false },
        { name: "enemyBaseDefinitions", data: typeof window.enemyBaseDefinitions !== 'undefined' ? window.enemyBaseDefinitions : undefined, canBeEmpty: true },
        { name: "BASE_COORDINATES", data: typeof window.BASE_COORDINATES !== 'undefined' ? window.BASE_COORDINATES : undefined, canBeEmpty: false },
        { name: "DEFAULT_MAP_SIZE", data: typeof window.DEFAULT_MAP_SIZE !== 'undefined' ? window.DEFAULT_MAP_SIZE : undefined, canBeEmpty: false },
        { name: "TILE_TYPES_TO_RESOURCE_KEY", data: typeof window.TILE_TYPES_TO_RESOURCE_KEY !== 'undefined' ? window.TILE_TYPES_TO_RESOURCE_KEY : undefined, canBeEmpty: true },
        { name: "NANOBOT_BASE_PATROL_POINTS", data: typeof window.NANOBOT_BASE_PATROL_POINTS !== 'undefined' ? window.NANOBOT_BASE_PATROL_POINTS : undefined, isArray: true, canBeEmpty: true },
    ];
    let allLoaded = true;
    let missingConfigsMessages = [];
    configs.forEach(config => {
        if (typeof config.data === 'undefined') {
            allLoaded = false;
            missingConfigsMessages.push(`${config.name} (non défini)`);
        } else if (config.data === null && !config.canBeEmpty) {
            allLoaded = false;
            missingConfigsMessages.push(`${config.name} (est null mais ne doit pas être vide)`);
        } else if (typeof config.data === 'object' && !Array.isArray(config.data) && config.data !== null) {
            if (Object.keys(config.data).length === 0 && !config.canBeEmpty) {
                allLoaded = false;
                missingConfigsMessages.push(`${config.name} (objet vide non autorisé)`);
            }
        } else if (Array.isArray(config.data)) {
            if (config.data.length === 0 && !config.canBeEmpty) {
                allLoaded = false;
                missingConfigsMessages.push(`${config.name} (tableau vide non autorisé)`);
            }
        }
    });
    if (!allLoaded) {
        if(typeof showModal === 'function') {
            showModal("Erreur Critique de Configuration",
                `Les configurations suivantes sont manquantes ou invalides: <br> - ${missingConfigsMessages.join('<br> - ')}. <br><br>Le jeu ne peut pas démarrer correctement. Veuillez vérifier les fichiers config_*.js et la console pour plus de détails.`,
                null, false
            );
            const okButton = document.getElementById('modal-confirm');
            if (okButton) okButton.classList.add('hidden');
            const cancelButton = document.getElementById('modal-cancel');
            if (cancelButton) cancelButton.textContent = "Fermer";
        }
        console.error("main.js: ERREUR CRITIQUE - Configurations manquantes/invalides:", missingConfigsMessages);
    } else {
        console.log("main.js: init() - Toutes les constantes de config.js semblent DÉTECTÉES et valides.");
    }
    return allLoaded;
}

let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 5;

function init() {
    initAttempts++;
    console.log(`main.js: init() - Tentative ${initAttempts}`);

    if (initAttempts > MAX_INIT_ATTEMPTS) {
        console.error("main.js: init() - Nombre maximum de tentatives d'initialisation atteint. Arrêt.");
        if(typeof showModal === 'function') showModal("Erreur d'Initialisation Fatale", "Le jeu n'a pas pu s'initialiser après plusieurs tentatives. Veuillez rafraîchir la page. Si le problème persiste, vérifiez la console pour des erreurs.", null, false);
        return;
    }

    if (typeof window.INITIAL_RESOURCES === 'undefined' || typeof getInitialGameState === 'undefined') {
        console.warn("main.js: init() - Dépendances initiales non encore disponibles. Nouvel essai dans 200ms.");
        setTimeout(init, 200);
        return;
    }
    
    initDOMReferences();

    if (!checkAllConfigLoaded()) {
         console.error("main.js: init() - Échec de checkAllConfigLoaded. Arrêt de l'initialisation.");
         return;
    }

    if (typeof initializeTooltip === "function") {
        initializeTooltip();
        console.log("main.js: init() - Système de Tooltip initialisé.");
    }

    console.log("main.js: init() - Initialisation de gameState...");
    gameState = getInitialGameState();
    console.log("main.js: init() - gameState initialisé.");

    console.log("main.js: init() - Appel de loadGame()...");
    loadGame();
    console.log("main.js: init() - gameState après loadGame().");

    if (gameState.shopStock.length === 0 && typeof window.shopInventoryData !== 'undefined' && Object.keys(window.shopInventoryData).length > 0) {
        console.log("Populating initial shop stock from shopInventoryData.");
        for (const key in window.shopInventoryData) {
            const shopEntryConfig = window.shopInventoryData[key];
            gameState.shopStock.push({
                itemId: shopEntryConfig.itemId,
                quantity: shopEntryConfig.quantity,
                cost: { ...shopEntryConfig.cost }, 
                isUnique: shopEntryConfig.isUnique || false,
                restockTime: shopEntryConfig.restockTime
            });
        }
    } else if (gameState.shopStock.length > 0) {
        console.log("Shop stock déjà peuplé ou shopInventoryData vide.");
    }


    if(typeof window.questController !== 'undefined' && typeof window.questController.initializeQuests === 'function') {
        console.log("main.js: init() - Appel de questController.initializeQuests() après loadGame.");
        window.questController.initializeQuests();
    } else {
        console.warn("main.js: init() - questController ou initializeQuests non défini (après loadGame).");
    }

    if (!gameState.map || !gameState.map.tiles || !gameState.map.tiles[gameState.currentZoneId]) {
        const initialZoneId = gameState.currentZoneId || (typeof window.EXPLORATION_SETTINGS !== 'undefined' ? window.EXPLORATION_SETTINGS.initialZoneId : 'verdant_archipelago');
        console.log(`main.js: init() - Pas de carte pour la zone ${initialZoneId}. Génération...`);
        if (typeof window.mapManager !== 'undefined' && typeof window.mapManager.generateMap === 'function') {
            window.mapManager.generateMap(initialZoneId);
        } else {
             console.error("mapManager ou mapManager.generateMap non défini.");
        }
    }

    if (!gameState.baseGrid || gameState.baseGrid.length === 0) {
        console.log("main.js: init() - Grille de base non chargée. Initialisation...");
        if(typeof initializeBaseGrid === 'function') initializeBaseGrid(); 
        else console.error("initializeBaseGrid function is not defined!");
    }
    
    console.log("main.js: init() - Calculs initiaux (si besoin) après chargement/initialisation...");
    if(typeof calculateInitialGameState === 'function') calculateInitialGameState(); 
    
    console.log("main.js: init() - gameState.resources après calculs initiaux:", JSON.parse(JSON.stringify(gameState.resources)));

    console.log("main.js: init() - Remplissage initial des logs et UI...");
    if (typeof addLogEntry === 'function') {
        addLogEntry("Nexus-7 initialisé et opérationnel.", "system");
        if (gameState.map && gameState.map.nanobotPos) {
          addLogEntry(`Position initiale du Nanobot: (${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y}) dans la zone ${gameState.currentZoneId}.`, "info", "exploration");
        } else {
          addLogEntry("Position initiale du Nanobot non définie.", "warning", "exploration");
        }
    }

    setupEventListeners();

    if (typeof uiNavigation !== 'undefined' && uiNavigation.isReady) {
         console.log("main.js: init() - Démarrage de la boucle de jeu...");
        lastTickTime = performance.now();
        if (typeof window.TICK_SPEED === 'number') {
            gameLoopInterval = setInterval(gameLoop, window.TICK_SPEED);
        } else {
            console.error("main.js: TICK_SPEED n'est pas défini ou n'est pas un nombre! Impossible de démarrer la boucle de jeu.");
            return;
        }
        console.log("main.js: init() - Appel de forceInitialUIUpdate.");
        if(typeof uiNavigation.forceInitialUIUpdate === 'function') uiNavigation.forceInitialUIUpdate();
    } else {
        console.warn("main.js: init() - uiNavigation non prêt. Nouvel essai d'init.");
        setTimeout(init, 250);
        return;
    }

    console.log("main.js: init() - Terminé avec succès.");

    if (typeof window.tutorialController !== 'undefined' && typeof window.tutorialController.checkAndOfferTutorial === 'function') {
        setTimeout(() => window.tutorialController.checkAndOfferTutorial(), 1500);
    } else {
        console.warn("main.js: tutorialController ou checkAndOfferTutorial non défini.");
    }
}


function gameLoop(manualTriggerTime) {
    const currentTime = manualTriggerTime || performance.now();
    lastTickTime = currentTime;

    if (isGamePaused) return;

    const tickDelta = window.TICK_SPEED / 1000;
    gameState.gameTime += tickDelta;

    if(typeof updateResources === 'function') updateResources(tickDelta);
    if(typeof updateResearch === 'function') updateResearch(tickDelta);
    if(typeof updateDayNightCycle === 'function') updateDayNightCycle(tickDelta);
    
    if (!gameState.isDay) { 
        if(typeof window.processNightAssaultTick === 'function') window.processNightAssaultTick();
        else console.warn("processNightAssaultTick non défini");
        
        if(typeof window.processNanobotBaseDefenseAction === 'function' && gameState.nanobotStats.isDefendingBase) { 
            window.processNanobotBaseDefenseAction();
        }
    } else { 
        if(typeof window.processNanobotBaseDefenseAction === 'function' && gameState.nanobotStats.isDefendingBase && window.NANOBOT_BASE_PATROL_POINTS && window.NANOBOT_BASE_PATROL_POINTS.length > 0) {
            window.processNanobotBaseDefenseAction();
        }
    }

    if(typeof regenerateMobility === 'function') regenerateMobility(tickDelta);

    if(typeof window.uiUpdates !== 'undefined') {
        if (typeof window.uiUpdates.updateResourceDisplay === 'function') window.uiUpdates.updateResourceDisplay();
        if (typeof window.uiUpdates.updateXpBar === 'function') window.uiUpdates.updateXpBar();
        
        const activeMainSectionButton = document.querySelector('#main-navigation .nav-button.active');
        if (activeMainSectionButton && activeMainSectionButton.dataset.section === 'base-section') {
            if (typeof window.uiUpdates.updateBaseStatusDisplay === 'function') window.uiUpdates.updateBaseStatusDisplay();
        }
        if (activeMainSectionButton && activeMainSectionButton.dataset.section === 'world-section') {
            const activeSubTabButton = document.querySelector('#world-section .sub-nav-button.active');
            if (activeSubTabButton && activeSubTabButton.dataset.subtab === 'exploration-subtab') {
                // Vérifier si on est PAS en mode exploration active avant de mettre à jour le bouton scan
                 if (!gameState.map.activeExplorationTileCoords && typeof window.uiUpdates.updateScanButtonCooldown === 'function') {
                    window.uiUpdates.updateScanButtonCooldown();
                }
            }
        }
    }
    if(typeof updateGameTimeAndCycleDisplay === 'function') updateGameTimeAndCycleDisplay();

    if (typeof window.explorationController !== 'undefined' && typeof window.explorationController.updateExpiredMapScans === 'function') {
        if (window.explorationController.updateExpiredMapScans()) {
            if (gameState.map && gameState.map.activeExplorationTileCoords === null && 
                typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateExplorationMapDisplay === 'function' &&
                window.worldSectionContentEl && !window.worldSectionContentEl.classList.contains('blurred-background')) {
                const activeSubTabButton = document.querySelector('#world-section .sub-nav-button.active');
                if (activeSubTabButton && activeSubTabButton.dataset.subtab === 'exploration-subtab') {
                    window.explorationUI.updateExplorationMapDisplay();
                }
            }
        }
    }
}

const SAVE_KEY_PREFIX = "nexus7GameState_v";
function getSaveKey() { return `${SAVE_KEY_PREFIX}${currentVersion}`; }

function saveGame() {
    try {
        localStorage.setItem(getSaveKey(), JSON.stringify(gameState));
        if(typeof addLogEntry === 'function') addLogEntry("Partie sauvegardée.", "success");
    } catch (error) {
        console.error("Erreur lors de la sauvegarde du jeu:", error);
        if(typeof addLogEntry === 'function') addLogEntry("Échec de la sauvegarde. Espace insuffisant ou erreur navigateur.", "error");
        if(typeof showModal === 'function') showModal("Erreur de Sauvegarde", "Impossible de sauvegarder la progression. L'espace de stockage local est peut-être plein ou votre navigateur bloque cette fonctionnalité.", null, false);
    }
}
window.saveGame = saveGame;

function loadGame() {
    const savedGame = localStorage.getItem(getSaveKey());
    if (savedGame) {
        try {
            const loadedState = JSON.parse(savedGame);
            const initialState = getInitialGameState();
            gameState = deepMerge(initialState, loadedState);

            if (!gameState.map || typeof gameState.map.tiles !== 'object') gameState.map = initialState.map;
            if (!gameState.buildings || typeof gameState.buildings !== 'object') gameState.buildings = initialState.buildings;
            if (!gameState.research || typeof gameState.research !== 'object') gameState.research = initialState.research;
            if (!gameState.inventory || !Array.isArray(gameState.inventory)) gameState.inventory = initialState.inventory;
            if (!gameState.baseGrid || !Array.isArray(gameState.baseGrid)) gameState.baseGrid = [];
            if (!gameState.defenses || typeof gameState.defenses !== 'object') gameState.defenses = {};
            if (!gameState.quests || typeof gameState.quests !== 'object') gameState.quests = {};
            if (!gameState.nanobotModuleLevels || typeof gameState.nanobotModuleLevels !== 'object') gameState.nanobotModuleLevels = {};
            if (!gameState.nanobotEquipment || typeof gameState.nanobotEquipment !== 'object') gameState.nanobotEquipment = {};
            if (!gameState.nightAssault || typeof gameState.nightAssault !== 'object') gameState.nightAssault = initialState.nightAssault;
            if (gameState.nightAssault && !Array.isArray(gameState.nightAssault.log)) gameState.nightAssault.log = [];
            if (!Array.isArray(gameState.explorationLog)) gameState.explorationLog = [];
            if (!Array.isArray(gameState.eventLog)) gameState.eventLog = [];
            if (!Array.isArray(gameState.shopStock)) gameState.shopStock = []; 
            if (!Array.isArray(gameState.purchasedShopItems)) gameState.purchasedShopItems = [];
            if (typeof gameState.nanobotSkills !== 'object' || gameState.nanobotSkills === null) gameState.nanobotSkills = {};


            if(typeof addLogEntry === 'function') addLogEntry("Partie chargée.", "success");
            console.log("Jeu chargé:", JSON.parse(JSON.stringify(gameState)));

            if(typeof calculateInitialGameState === 'function') calculateInitialGameState();

        } catch (error) {
            console.error("Erreur lors du chargement de la sauvegarde:", error);
            if(typeof addLogEntry === 'function') addLogEntry("Sauvegarde corrompue ou invalide. Démarrage d'une nouvelle partie.", "error");
            localStorage.removeItem(getSaveKey());
            gameState = getInitialGameState();
             if(typeof calculateInitialGameState === 'function') calculateInitialGameState();
        }
    } else {
        console.log(`loadGame: Aucune sauvegarde (${getSaveKey()}). Utilisation de l'état initial.`);
        if(typeof calculateInitialGameState === 'function') calculateInitialGameState();
    }
}
window.loadGame = loadGame;

function resetGame() {
    if(typeof showModal === 'function') {
        showModal(
            "Réinitialiser la Progression",
            "Êtes-vous sûr de vouloir réinitialiser TOUTE votre progression ? Cette action est irréversible et supprimera votre sauvegarde actuelle.",
            () => {
                clearInterval(gameLoopInterval);
                localStorage.removeItem(getSaveKey());
                if(typeof addLogEntry === 'function') addLogEntry("Progression réinitialisée. Rechargement...", "warning");
                setTimeout(() => window.location.reload(), 1000);
            },
            true
        );
    } else {
        if (confirm("Êtes-vous sûr de vouloir réinitialiser TOUTE votre progression ?")) {
            localStorage.removeItem(getSaveKey());
            window.location.reload();
        }
    }
}
window.resetGame = resetGame;

window.onload = function() {
    console.log("window.onload déclenché.");
    function checkUINavReadyAndInit() {
        if (typeof uiNavigation !== 'undefined' && uiNavigation.isReady) {
            console.log("uiNavigation est prêt. Lancement de init().");
            init();
        } else {
            console.log("main.js (onload): uiNavigation pas encore prêt, attente...");
            setTimeout(checkUINavReadyAndInit, 100);
        }
    }
    checkUINavReadyAndInit();
};

console.log("main.js - Fin du fichier, 'window.onload' configuré.");