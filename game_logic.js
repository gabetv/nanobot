// --- Configuration du Jeu ---
const TICK_SPEED = 1000;
const DAY_DURATION = 5 * 60 * 1000; const NIGHT_DURATION = 3 * 60 * 1000; 
// const DAY_DURATION = 30 * 1000; const NIGHT_DURATION = 45 * 1000; // DEV: Short cycles for testing night assault
const COMBAT_ANIMATION_DELAY_BASE = 700; 
const EXPLORATION_COST_ENERGY = 5;
const MAP_SIZE = { width: 15, height: 10 };
const TILE_TYPES = { UNEXPLORED: 0, EMPTY: 1, BASE: 2, RESOURCE_BIOMASS: 10, RESOURCE_NANITES: 11, ENEMY_DRONE: 20, ENEMY_SAURIAN: 21, UPGRADE_CACHE: 30, IMPASSABLE: 99 };
const BASE_COORDINATES = { x: 0, y: 0 };
const EQUIPMENT_SLOTS = { weapon: "Arme Principale", armor: "Blindage", utility1: "Utilitaire Alpha", utility2: "Utilitaire Beta" };
const BASE_INITIAL_HEALTH = 500;
const NIGHT_ASSAULT_TICK_INTERVAL = 5000; 
const REPAIR_COST_BASE_HEALTH_BIOMASS = 2;
const REPAIR_COST_BASE_HEALTH_NANITES = 1;
const REPAIR_COST_DEFENSE_HEALTH_BIOMASS = 1;


// --- État du Jeu ---
let gameState = {
    resources: { biomass: 200, nanites: 100, energy: 50 },
    productionRates: { biomass: 0, nanites: 0 },
    capacity: { energy: 50 },
    buildings: {}, research: {}, gameTime: 0, isDay: true, currentCycleTime: 0,
    eventLog: ["Bienvenue, Nexus-7. Initialisation..."],
    nanobotStats: { 
        baseHealth: 100, currentHealth: 100, baseAttack: 10, baseDefense: 5, baseSpeed: 10, 
        health: 100, attack: 10, defense: 5, speed: 10, 
        level: 1, xp: 0, xpToNext: 100,
        isDefendingBase: false 
    },
    activeModules: [],
    inventory: [], 
    nanobotEquipment: { weapon: null, armor: null, utility1: null, utility2: null },
    combatLogSummary: ["Journal de combat initialisé."],
    map: { tiles: [], explored: [], nanobotPos: { ...BASE_COORDINATES }, currentEnemyEncounter: null },
    shopStock: ['item_laser_mk1', 'item_plating_basic', 'item_repair_kit_s'],
    baseStats: {
        currentHealth: BASE_INITIAL_HEALTH,
        maxHealth: BASE_INITIAL_HEALTH,
        defensePower: 0 
    },
    defenses: {}, 
    nightAssault: {
        isActive: false,
        wave: 0,
        enemies: [], 
        lastAttackTime: 0,
        log: ["Journal d'assaut initialisé."] 
    }
};

// --- Définitions (Bâtiments, Modules, Recherches, Objets, Ennemis d'Assaut) ---
const buildingsData = { 
    'biomassHarvester': { name: "Collecteur de Biomasse", type:"production", description: "Récolte la Biomasse.", levels: [ { cost: { biomass: 50 }, production: { biomass: 1 }, energyConsumption: 2 }, { cost: { biomass: 120, nanites: 20 }, production: { biomass: 3 }, energyConsumption: 4 } ] },
    'naniteFactory': { name: "Usine de Nanites", type:"production", description: "Assemble des Nanites.", levels: [ { cost: { biomass: 80, nanites: 10 }, production: { nanites: 0.5 }, energyConsumption: 5 }, { cost: { biomass: 200, nanites: 50 }, production: { nanites: 1.5 }, energyConsumption: 8 } ] },
    'powerPlant': { name: "Générateur d'Énergie", type:"utility", description: "Fournit de l'Énergie.", levels: [ { cost: { biomass: 60, nanites: 20 }, capacity: { energy: 50 } }, { cost: { biomass: 150, nanites: 50 }, capacity: { energy: 100 } } ] },
    'researchLab': { name: "Laboratoire de Recherche", type:"utility", description: "Débloque des technologies.", levels: [ { cost: { biomass: 100, nanites: 100 }, researchSpeedFactor: 1, energyConsumption: 10 }, { cost: { biomass: 250, nanites: 250 }, researchSpeedFactor: 1.5, energyConsumption: 15 } ] },
    'defenseFoundry': { name: "Fonderie Défensive", type:"utility", description: "Fabrique modules défensifs pour Nexus-7.", levels: [ { cost: { biomass: 200, nanites: 150 }, energyConsumption: 15, grantsModule: 'shieldGeneratorMk1' }, { cost: { biomass: 500, nanites: 400 }, energyConsumption: 25, grantsModule: 'shieldGeneratorMk2' }] },
    'laserTurret': { 
        name: "Tourelle Laser MkI", type: "defense", 
        description: "Tourelle défensive automatisée à courte portée.", 
        levels: [ 
            { cost: { biomass: 100, nanites: 75 }, stats: { attack: 5, health: 100 }, energyConsumption: 5 }, 
            { cost: { biomass: 250, nanites: 150 }, stats: { attack: 10, health: 180 }, energyConsumption: 8 },
            { cost: { biomass: 500, nanites: 350 }, stats: { attack: 18, health: 300 }, energyConsumption: 12 }
        ] 
    },
    'reinforcedWall': {
        name: "Mur Renforcé", type: "defense",
        description: "Augmente les points de vie maximum du Noyau.",
        levels: [
            { cost: { biomass: 150, nanites: 50 }, baseHealthBonus: 200, energyConsumption: 1 },
            { cost: { biomass: 300, nanites: 120 }, baseHealthBonus: 450, energyConsumption: 2 }
        ]
    }
};
const nanobotModulesData = { 
    'armBlade': { name: "Lame de Bras", description: "Un bras transformable en lame tranchante.", statBoost: { attack: 5 }, visualClass: 'module-arm-blade' },
    'gravLegs': { name: "Jambes Anti-Grav", description: "Permet un déplacement rapide et agile.", statBoost: { speed: 5, defense: 1 }, visualClasses: ['module-legs-antigrav left', 'module-legs-antigrav right'] },
    'shieldGeneratorMk1': { name: "Bouclier Énergétique Mk1", description: "Génère un champ de force protecteur de base.", statBoost: { defense: 10, health: 20 }, visualClass: 'module-shield' },
    'shieldGeneratorMk2': { name: "Bouclier Énergétique Mk2", description: "Génère un champ de force protecteur amélioré.", statBoost: { defense: 20, health: 50 }, visualClass: 'module-shield' }
};
const researchData = { 
    'naniteSwarm': { name: "Tempête de Nanites", description: "Arme dévastatrice.", cost: { biomass: 500, nanites: 1000 }, time: 300, requirements: { buildings: { researchLab: 1 } }, grantsStatBoost: { attack: 15 } },
    'graviticManipulation': { name: "Manipulation Gravitique", description: "Développement de modules de déplacement.", cost: { biomass: 300, nanites: 200 }, time: 180, requirements: { buildings: { researchLab: 1 } }, grantsModule: 'gravLegs' },
    'combatAlgorithms': { name: "Algorithmes de Combat", description: "Améliore l'efficacité au combat.", cost: { biomass: 150, nanites: 300 }, time: 120, requirements: { buildings: { researchLab: 1 } }, grantsStatBoost: { attack: 5, defense: 3 } },
    'weaponizedNanites': { name: "Nanites Armés", description: "Intègre des nanites offensives.", cost: { biomass: 400, nanites: 250 }, time: 240, requirements: { buildings: { researchLab: 2 } }, grantsModule: 'armBlade' },
    'ecoSymbiosis': { name: "Symbiose Écologique", description: "Contrôle des formes de vie.", cost: { biomass: 1000, nanites: 500 }, time: 600, requirements: { buildings: { researchLab: 2 }, research: ['naniteSwarm'] }, grantsStatBoost: { health: 50, speed: -2 } }
};
const itemsData = {
    'item_laser_mk1': { id: 'item_laser_mk1', name: "Laser de Précision Mk1", slot: "weapon", description: "Un laser compact offrant une bonne puissance de feu initiale.", statBoost: { attack: 8 }, visualClass: 'item-weapon-laser', cost: { nanites: 150, biomass: 50 }, rarity: "uncommon" },
    'item_plating_basic': { id: 'item_plating_basic', name: "Plaquage Standard", slot: "armor", description: "Plaques de blindage basiques mais fiables.", statBoost: { defense: 5, health: 10 }, visualClass: 'item-armor-plating', cost: { nanites: 100, biomass: 100 }, rarity: "common" },
    'item_repair_kit_s': { id: 'item_repair_kit_s', name: "Kit de Réparation (S)", slot: "utility1", description: "Restaure instantanément 25 PV. Consommable (non implémenté).", statBoost: { health_regen_on_use: 25 }, cost: { nanites: 75 }, rarity: "common" },
    'item_advanced_scope': { id: 'item_advanced_scope', name: "Viseur Avancé", slot: "utility2", description: "Améliore la précision, augmentant légèrement l'attaque.", statBoost: { attack: 3, speed: -1 }, cost: { nanites: 200 }, rarity: "uncommon" },
    'comp_av': { id: 'comp_av', name: "Composant Avancé", slot: null, description: "Matériau de fabrication.", cost: null, rarity: "material" },
    'crist_stock': { id: 'crist_stock', name: "Cristal de Stockage", slot: null, description: "Matériau de fabrication.", cost: null, rarity: "material" },
    'mod_proto': { id: 'mod_proto', name: "Module Prototypé", slot: null, description: "Matériau de fabrication.", cost: null, rarity: "material" },
    'frag_alien': { id: 'frag_alien', name: "Fragment Alien", slot: null, description: "Matériau de fabrication.", cost: null, rarity: "material" },
    'arte_rare': { id: 'arte_rare', name: "Artefact Rare", slot: null, description: "Objet de grande valeur ou puissant.", cost: null, rarity: "rare_material" }
};
const nightAssaultEnemies = [ 
    { id: 'swarm_drone', name: "Drone d'Essaim", baseHealth: 15, baseAttack: 2, reward: { biomass: 2, nanites: 1 } },
    { id: 'assault_bot', name: "Bot d'Assaut", baseHealth: 40, baseAttack: 5, reward: { biomass: 5, nanites: 3 } },
    { id: 'heavy_crawler', name: "Rampant Lourd", baseHealth: 80, baseAttack: 3, reward: { biomass: 8, nanites: 2 } } 
];

let activeResearch = null;
let combatSpeedMultiplier = 1;
let COMBAT_ANIMATION_DELAY = COMBAT_ANIMATION_DELAY_BASE; 

// --- Éléments DOM ---
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
let repairBaseBtn, repairDefensesBtn, toggleNanobotDefendBaseBtn;
let nightAssaultEnemiesDisplayEl, nightAssaultLogEl;


// --- Fonctions Utilitaires ---
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); } 
function formatTime(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }
let modalConfirmCallback = null; 
function showModal(title, message, onConfirm, showCancel = true) { modalTitle.textContent = title; modalMessage.innerHTML = message; modalConfirmCallback = onConfirm; modalConfirm.classList.toggle('hidden', !onConfirm); modalCancel.classList.toggle('hidden', !showCancel); modal.classList.remove('hidden'); } 
function hideModal() { modal.classList.add('hidden'); modalConfirmCallback = null; }

function addLogEntry(message, type = "info", logElement = eventLogEl, logArray = gameState.eventLog) { 
    const timestamp = type !== "combat-visual" && type !== "map-event" && type !== "base-assault-event" && type !== "base-defense-event" && type !== "base-info-event"
                    ? `[${formatTime(gameState.gameTime)}] ` : ""; 
    const entry = document.createElement('p'); 
    entry.innerHTML = `<span class="text-gray-400">${timestamp}</span>${message}`; 
    
    if (logElement === nightAssaultLogEl) {
        if (type === "base-assault-event") entry.classList.add("text-red-400"); 
        else if (type === "base-defense-event") entry.classList.add("text-teal-300"); 
        else if (type === "success") entry.classList.add("text-green-400"); 
        else if (type === "error") entry.classList.add("text-red-400"); 
        else if (type === "base-info-event") entry.classList.add("text-gray-400");
        else entry.classList.add("text-orange-300"); 
    } else { 
        if (type === "error") entry.classList.add("text-red-400"); 
        if (type === "success") entry.classList.add("text-green-400"); 
        if (type === "warning") entry.classList.add("text-yellow-400"); 
        if (type === "combat" || type === "combat-visual" || type === "map-event") entry.classList.add("text-orange-300");
    }

    if (logElement) { 
        if (logElement.firstChild && (logElement.firstChild.textContent === "En attente d'événements..." || logElement.firstChild.textContent === "Journal d'assaut initialisé.")) {
            logElement.innerHTML = ""; 
        }
        logElement.appendChild(entry); 
        logElement.scrollTop = logElement.scrollHeight; 
    } 
    if (logArray) { 
        if (logArray.length > 0 && logArray[0] === "Journal d'assaut initialisé.") logArray.shift(); 
        logArray.push(`${timestamp}${message}`); 
        if (logArray.length > 75 && logElement === nightAssaultLogEl) logArray.shift(); 
        else if (logArray.length > 100 && logElement === eventLogEl) logArray.shift();
    } 
}


// --- Fonctions de Mise à Jour de l'UI ---
function updateResourceDisplay() { biomassEl.textContent = Math.floor(gameState.resources.biomass); nanitesEl.textContent = Math.floor(gameState.resources.nanites); energyEl.textContent = Math.floor(gameState.resources.energy); biomassRateEl.textContent = gameState.productionRates.biomass.toFixed(1); nanitesRateEl.textContent = gameState.productionRates.nanites.toFixed(1); energyCapacityEl.textContent = gameState.capacity.energy; energyCostMoveEl.textContent = EXPLORATION_COST_ENERGY; }
function updateBuildingDisplay() { buildingsSection.innerHTML = '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Modules Structurels & Défensifs</h2>'; for (const id in buildingsData) { const building = buildingsData[id]; const level = gameState.buildings[id] || 0; const currentLevelData = level > 0 ? building.levels[level - 1] : null; const nextLevel = level < building.levels.length ? building.levels[level] : null; const div = document.createElement('div'); div.className = 'mb-4 p-3 bg-gray-800 rounded shadow'; let content = `<h3 class="text-lg font-semibold ${building.type === 'defense' ? 'text-yellow-400' : 'text-blue-400'}">${building.name} (Niv. ${level})</h3>`; content += `<p class="text-sm text-gray-400 mb-1">${building.description}</p>`; if (currentLevelData) { content += `<p class="text-xs text-gray-500">Effet actuel: `; let effects = []; if (currentLevelData.production) { effects.push(...Object.entries(currentLevelData.production).map(([res, val]) => `${val}/s ${res}`)); } if (currentLevelData.capacity) { effects.push(...Object.entries(currentLevelData.capacity).map(([res, val]) => `+${val} Cap. ${res}`)); } if (currentLevelData.researchSpeedFactor) { effects.push(`Vitesse Rech. x${currentLevelData.researchSpeedFactor}`); } if (currentLevelData.grantsModule && nanobotModulesData[currentLevelData.grantsModule]) { effects.push(`Débloque: ${nanobotModulesData[currentLevelData.grantsModule].name}`); } if (building.type === 'defense' && currentLevelData.stats) { effects.push(`Att: ${currentLevelData.stats.attack}, PV: ${currentLevelData.stats.health}`); } if (building.type === 'defense' && currentLevelData.baseHealthBonus) { effects.push(`PV Noyau: +${currentLevelData.baseHealthBonus}`); } content += effects.join(', ') || "Aucun"; content += ` / Cons.: ${currentLevelData.energyConsumption || 0} Énergie</p>`; } if (nextLevel) { const canAfford = Object.entries(nextLevel.cost).every(([res, val]) => gameState.resources[res] >= val); let costString = Object.entries(nextLevel.cost).map(([res, val]) => `${val} ${res}`).join(', '); content += `<button onclick="build('${id}')" class="btn ${canAfford ? (building.type === 'defense' ? 'btn-warning' : 'btn-primary') : 'btn-disabled'} mt-2 text-sm w-full" ${!canAfford ? 'disabled' : ''}>Améliorer (Coût: ${costString})</button>`; } else { content += `<p class="text-sm text-green-400 mt-2">Niveau Max Atteint</p>`; } div.innerHTML = content; buildingsSection.appendChild(div); } }
function updateResearchDisplay() { researchSection.innerHTML = '<h2 class="font-orbitron text-xl mb-3 text-blue-300 border-b border-gray-600 pb-2">Arbre Technologique</h2>'; if (activeResearch) { const research = researchData[activeResearch.id]; const timeRemaining = Math.max(0, Math.ceil(activeResearch.totalTime - (gameState.gameTime - activeResearch.startTime))); const progress = Math.min(100, ((activeResearch.totalTime - timeRemaining) / activeResearch.totalTime) * 100); researchSection.innerHTML += `<div class="mb-4 p-3 bg-gray-800 rounded shadow"><h3 class="text-lg font-semibold text-yellow-400">En cours: ${research.name}</h3><p class="text-sm text-gray-400 mb-1">${research.description}</p><div class="w-full bg-gray-700 rounded-full h-2.5 mb-1"><div class="bg-blue-500 h-2.5 rounded-full" style="width: ${progress}%"></div></div><p class="text-sm text-gray-300">Temps: ${formatTime(timeRemaining)}</p></div>`; } for (const id in researchData) { const research = researchData[id]; if (gameState.research[id]) { researchSection.innerHTML += `<div class="mb-2 p-3 bg-gray-700 rounded opacity-70"><h3 class="text-md font-semibold text-green-400">${research.name} (Terminé)</h3><p class="text-xs text-gray-500">${research.description}</p></div>`; continue; } if (activeResearch && activeResearch.id === id) continue; let canResearch = true; let requirementText = []; const costEntries = Object.entries(research.cost); costEntries.forEach(([res, val]) => { if (gameState.resources[res] < val) canResearch = false; }); let costString = costEntries.map(([res, val]) => `${val} ${res}`).join(', '); if (research.requirements) { if (research.requirements.buildings) { Object.entries(research.requirements.buildings).forEach(([bId, rLvl]) => { if ((gameState.buildings[bId] || 0) < rLvl) { canResearch = false; requirementText.push(`${buildingsData[bId].name} Niv. ${rLvl}`); } }); } if (research.requirements.research) { research.requirements.research.forEach(rId => { if (!gameState.research[rId]) { canResearch = false; requirementText.push(`Rech.: ${researchData[rId].name}`); } }); } } let effectsText = []; if (research.grantsModule && nanobotModulesData[research.grantsModule]) { effectsText.push(`Module: ${nanobotModulesData[research.grantsModule].name}`); } if (research.grantsStatBoost) { effectsText.push(...Object.entries(research.grantsStatBoost).map(([stat, val]) => `${stat.replace('base', '')}: +${val}`)); } const div = document.createElement('div'); div.className = 'mb-4 p-3 bg-gray-800 rounded shadow'; let content = `<h3 class="text-lg font-semibold text-blue-400">${research.name}</h3>`; content += `<p class="text-sm text-gray-400 mb-1">${research.description}</p>`; if (effectsText.length > 0) content += `<p class="text-xs text-green-300 mb-1">Effet: ${effectsText.join(', ')}.</p>`; content += `<p class="text-xs text-gray-500 mb-1">Coût: ${costString}. Temps: ${formatTime(research.time)}.</p>`; if (requirementText.length > 0) content += `<p class="text-xs text-yellow-500 mb-1">Prérequis: ${requirementText.join(', ')}.</p>`; content += `<button onclick="startResearch('${id}')" class="btn ${canResearch && !activeResearch ? 'btn-primary' : 'btn-disabled'} mt-2 text-sm w-full" ${(!canResearch || activeResearch) ? 'disabled' : ''}>Lancer</button>`; div.innerHTML = content; researchSection.appendChild(div); } }
function updateNanobotDisplay() { nanobotHealthEl.textContent = `${Math.floor(gameState.nanobotStats.currentHealth)} / ${gameState.nanobotStats.health}`; nanobotAttackEl.textContent = gameState.nanobotStats.attack; nanobotDefenseEl.textContent = gameState.nanobotStats.defense; nanobotSpeedEl.textContent = gameState.nanobotStats.speed; nanobotVisualBody.innerHTML = ''; let equippedModulesNames = []; gameState.activeModules.forEach(moduleId => { const moduleData = nanobotModulesData[moduleId]; if (moduleData) { equippedModulesNames.push(moduleData.name); if (moduleData.visualClass) { const visualEl = document.createElement('div'); visualEl.className = `nanobot-module ${moduleData.visualClass}`; nanobotVisualBody.appendChild(visualEl); } else if (moduleData.visualClasses) { moduleData.visualClasses.forEach(className => { const visualEl = document.createElement('div'); visualEl.className = `nanobot-module ${className}`; nanobotVisualBody.appendChild(visualEl); }); } } }); equippedModulesDisplayEl.textContent = equippedModulesNames.length > 0 ? `Modules: ${equippedModulesNames.join(', ')}` : "Aucun module actif."; let equippedItemsNames = []; for (const slot in gameState.nanobotEquipment) { const itemId = gameState.nanobotEquipment[slot]; if (itemId && itemsData[itemId]) { const item = itemsData[itemId]; equippedItemsNames.push(item.name); if (item.visualClass) { const visualEl = document.createElement('div'); visualEl.className = `nanobot-item-visual ${item.visualClass}`; nanobotVisualBody.appendChild(visualEl); } } } equippedItemsDisplayBriefEl.textContent = equippedItemsNames.length > 0 ? `Équipement: ${equippedItemsNames.join(', ')}` : "Aucun équipement."; updateEquippedItemsDisplay(); }
function updateEquippedItemsDisplay() { nanobotEquipmentSlotsEl.innerHTML = ''; for (const slotId in EQUIPMENT_SLOTS) { const slotName = EQUIPMENT_SLOTS[slotId]; const itemId = gameState.nanobotEquipment[slotId]; const item = itemId ? itemsData[itemId] : null; const slotDiv = document.createElement('div'); slotDiv.className = 'equipment-slot'; let content = `<div class="item-details"><span class="slot-name">${slotName}:</span> `; if (item) { content += `<span class="equipped-item-name">${item.name}</span>`; if (item.statBoost) { content += `<span class="item-stats ml-2">(${Object.entries(item.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v > 0 ? '+' : ''}${v}`).join(', ')})</span>`; } } else { content += `<span class="empty-slot">Vide</span>`; } content += `</div>`; if (item) { content += `<button class="btn btn-secondary btn-sm" onclick="unequipItem('${slotId}')">Retirer</button>`; } slotDiv.innerHTML = content; nanobotEquipmentSlotsEl.appendChild(slotDiv); } }
function gainXP(amount) { let stats = gameState.nanobotStats; if (!stats.level) { stats.level = 1; stats.xp = 0; stats.xpToNext = 100; } stats.xp += amount; while (stats.xp >= stats.xpToNext) { stats.xp -= stats.xpToNext; stats.level++; stats.xpToNext = Math.floor(stats.xpToNext * 1.5); addLogEntry("Niveau atteint: " + stats.level, "success", combatLogSummaryEl, gameState.combatLogSummary); stats.baseAttack += 2; stats.baseDefense += 1; stats.baseHealth += 10; calculateNanobotStats(); } updateXpBar(); xpGainEl.textContent = `+${amount} XP (Niv. ${stats.level})`; }
function updateXpBar() { const stats = gameState.nanobotStats; if (!stats.level) return; const percent = (stats.xp / stats.xpToNext) * 100; xpBarEl.style.width = percent + "%"; }
function generateLoot(enemyDetails) { const possibleLootItems = ['comp_av', 'crist_stock', 'mod_proto', 'frag_alien']; let results = []; if (Math.random() < 0.6) { results.push(possibleLootItems[Math.floor(Math.random() * possibleLootItems.length)]); } if (Math.random() < 0.15) { results.push('arte_rare'); } if (Math.random() < 0.05) { results.push('item_laser_mk1'); } if (Math.random() < 0.08) { results.push('item_plating_basic'); } return results; }
function addToInventory(itemId) { if (!itemsData[itemId]) { console.warn(`Tentative d'ajout d'un objet inconnu à l'inventaire: ${itemId}`); return; } gameState.inventory.push(itemId); updateInventoryDisplay(); addLogEntry(`Objet reçu: ${itemsData[itemId].name}`, "success"); }
function removeFromInventory(itemId) { const index = gameState.inventory.indexOf(itemId); if (index > -1) { gameState.inventory.splice(index, 1); updateInventoryDisplay(); return true; } return false; }
function updateInventoryDisplay() { if (!inventoryListEl) return; inventoryListEl.innerHTML = ""; if (gameState.inventory.length === 0) { inventoryListEl.innerHTML = "<p class='text-gray-500 italic'>L'inventaire est vide.</p>"; return; } const itemCounts = gameState.inventory.reduce((acc, itemId) => { acc[itemId] = (acc[itemId] || 0) + 1; return acc; }, {}); Object.entries(itemCounts).forEach(([itemId, count]) => { const item = itemsData[itemId]; if (!item) return; const li = document.createElement("li"); li.className = "inventory-item"; let content = `<div class="item-details"><span class="item-name">${item.name} ${count > 1 ? `(x${count})` : ''}</span><p class="item-stats">${item.description}</p>`; if (item.statBoost) { content += `<p class="item-stats">Stats: ${Object.entries(item.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v > 0 ? '+' : ''}${v}`).join(', ')}</p>`; } content += `</div>`; if (item.slot) { content += `<button class="btn btn-primary btn-sm" onclick="equipItem('${item.id}')">Équiper</button>`; } li.innerHTML = content; inventoryListEl.appendChild(li); }); }
function equipItem(itemId) { const item = itemsData[itemId]; if (!item || !item.slot) { addLogEntry("Cet objet ne peut pas être équipé.", "warning"); return; } const currentEquippedItemId = gameState.nanobotEquipment[item.slot]; if (currentEquippedItemId) { addToInventory(currentEquippedItemId); } gameState.nanobotEquipment[item.slot] = itemId; removeFromInventory(itemId); addLogEntry(`${item.name} équipé sur ${EQUIPMENT_SLOTS[item.slot]}.`, "success"); calculateNanobotStats(); updateDisplays(); }
function unequipItem(slotId) { const itemId = gameState.nanobotEquipment[slotId]; if (itemId && itemsData[itemId]) { const item = itemsData[itemId]; addToInventory(itemId); gameState.nanobotEquipment[slotId] = null; addLogEntry(`${item.name} retiré de ${EQUIPMENT_SLOTS[slotId]}.`, "info"); calculateNanobotStats(); updateDisplays(); } }
function updateShopDisplay() { shopItemsListEl.innerHTML = ""; if (gameState.shopStock.length === 0) { shopItemsListEl.innerHTML = "<p class='text-gray-500 italic'>La boutique est actuellement vide.</p>"; return; } gameState.shopStock.forEach(itemId => { const item = itemsData[itemId]; if (!item || !item.cost) return; const li = document.createElement("div"); li.className = "shop-item panel"; let costString = Object.entries(item.cost).map(([res, val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', '); let canAfford = true; for (const resource in item.cost) { if (gameState.resources[resource] < item.cost[resource]) { canAfford = false; break; } } let content = `<div class="item-details"><h4 class="item-name text-lg text-blue-300">${item.name}</h4><p class="item-stats text-sm text-gray-400">${item.description}</p>`; if (item.statBoost) { content += `<p class="item-stats text-sm text-green-300">Effets: ${Object.entries(item.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v > 0 ? '+' : ''}${v}`).join(', ')}</p>`; } content += `<p class="text-sm text-yellow-400 mt-1">Coût: ${costString}</p></div>`; content += `<button class="btn ${canAfford ? 'btn-success' : 'btn-disabled'} btn-sm mt-2" onclick="buyItem('${item.id}')" ${!canAfford ? 'disabled' : ''}>Acheter</button>`; li.innerHTML = content; shopItemsListEl.appendChild(li); }); }
function buyItem(itemId) { const item = itemsData[itemId]; if (!item || !item.cost) { addLogEntry("Objet non disponible à l'achat.", "error"); return; } for (const resource in item.cost) { if (gameState.resources[resource] < item.cost[resource]) { addLogEntry(`Ressources insuffisantes pour acheter ${item.name}.`, "error"); return; } } for (const resource in item.cost) { gameState.resources[resource] -= item.cost[resource]; } addToInventory(itemId); addLogEntry(`${item.name} acheté !`, "success"); updateResourceDisplay(); updateShopDisplay(); }
        
function updateBaseStatusDisplay() {
    const base = gameState.baseStats;
    baseHealthValueEl.textContent = Math.floor(base.currentHealth);
    baseMaxHealthValueEl.textContent = base.maxHealth;
    overviewBaseHealthEl.textContent = `${Math.floor(base.currentHealth)} / ${base.maxHealth}`;
    const healthPercent = (base.maxHealth > 0 ? (base.currentHealth / base.maxHealth) : 0) * 100; 
    baseHealthBarEl.style.width = `${healthPercent}%`;
    baseHealthBarEl.classList.remove('low', 'medium');
    if (healthPercent < 30) baseHealthBarEl.classList.add('low');
    else if (healthPercent < 60) baseHealthBarEl.classList.add('medium');

    baseDefensePowerEl.textContent = `Puissance Défensive: ${base.defensePower}`;
    repairBaseBtn.disabled = gameState.baseStats.currentHealth >= gameState.baseStats.maxHealth;
    let hasDamagedDefenses = false;
    for (const defId in gameState.defenses) { if (gameState.defenses[defId].currentHealth < gameState.defenses[defId].maxHealth) { hasDamagedDefenses = true; break; } }
    repairDefensesBtn.disabled = !hasDamagedDefenses;

    let defenseDetails = [];
    for (const buildingId in gameState.defenses) { const defense = gameState.defenses[buildingId]; defenseDetails.push(`${defense.name} Niv.${defense.level} (PV: ${Math.floor(defense.currentHealth)}/${defense.maxHealth}, Att: ${defense.attack})`); }
    activeDefensesDisplayEl.innerHTML = defenseDetails.length > 0 ? `<strong>Défenses Actives:</strong><br>` + defenseDetails.join('<br>') : "<strong>Aucune défense active.</strong>";
    
    overviewContentElTab.classList.toggle('night-assault-active', gameState.nightAssault.isActive);
    baseHealthDisplayEl.classList.toggle('text-red-400', gameState.nightAssault.isActive);
    baseHealthDisplayEl.classList.toggle('font-bold', gameState.nightAssault.isActive);

    nightAssaultEnemiesDisplayEl.innerHTML = ""; 
    if (gameState.nightAssault.isActive && gameState.nightAssault.enemies.length > 0) {
        gameState.nightAssault.enemies.forEach(group => {
            const displayCount = Math.min(group.count, 20); 
            for (let i = 0; i < displayCount; i++) {
                const dot = document.createElement('div');
                dot.classList.add('assault-enemy-dot');
                if (group.id === 'swarm_drone') dot.classList.add('drone');
                else if (group.id === 'assault_bot') dot.classList.add('bot');
                else if (group.id === 'heavy_crawler') dot.classList.add('crawler');
                dot.title = `${group.name} (PV: ${group.baseHealth} / Att: ${group.baseAttack})`; 
                nightAssaultEnemiesDisplayEl.appendChild(dot);
            }
            if (group.count > 20) { const moreText = document.createElement('span'); moreText.className = 'text-xs text-gray-400 italic ml-1'; moreText.textContent = `(+${group.count - 20} ${group.name.split(' ')[0]}s)`; nightAssaultEnemiesDisplayEl.appendChild(moreText); }
        });
    } else if (gameState.nightAssault.isActive && gameState.nightAssault.enemies.length === 0 && gameState.baseStats.currentHealth > 0){
            nightAssaultEnemiesDisplayEl.innerHTML = `<p class="text-green-400 italic text-xs">Vague ennemie neutralisée. En attente...</p>`;
    } else {
        nightAssaultEnemiesDisplayEl.innerHTML = `<p class="text-gray-500 italic text-xs">Aucune menace détectée pour le moment.</p>`;
    }
}

// --- Logique de Jeu ---
function calculateNanobotStats() { const stats = gameState.nanobotStats; stats.health = stats.baseHealth; stats.attack = stats.baseAttack; stats.defense = stats.baseDefense; stats.speed = stats.baseSpeed; gameState.activeModules = []; for (const researchId in gameState.research) { if (gameState.research[researchId] && researchData[researchId]) { const resData = researchData[researchId]; if (resData.grantsStatBoost) { for (const stat in resData.grantsStatBoost) { stats[stat] = (stats[stat] || 0) + resData.grantsStatBoost[stat]; } } if (resData.grantsModule && !gameState.activeModules.includes(resData.grantsModule)) { gameState.activeModules.push(resData.grantsModule); } } } for (const buildingId in gameState.buildings) { const level = gameState.buildings[buildingId]; if (level > 0) { const buildingDef = buildingsData[buildingId]; const levelData = buildingDef.levels[level-1]; if (levelData.grantsModule && nanobotModulesData[levelData.grantsModule] && !gameState.activeModules.includes(levelData.grantsModule)) { gameState.activeModules.push(levelData.grantsModule); } } } gameState.activeModules.forEach(moduleId => { const moduleData = nanobotModulesData[moduleId]; if (moduleData && moduleData.statBoost) { for (const stat in moduleData.statBoost) { stats[stat] = (stats[stat] || 0) + moduleData.statBoost[stat]; } } }); for (const slot in gameState.nanobotEquipment) { const itemId = gameState.nanobotEquipment[slot]; if (itemId && itemsData[itemId] && itemsData[itemId].statBoost) { const itemBoosts = itemsData[itemId].statBoost; for (const stat in itemBoosts) { stats[stat] = (stats[stat] || 0) + itemBoosts[stat]; } } } stats.currentHealth = Math.min(stats.currentHealth, stats.health); if (stats.currentHealth < 0) stats.currentHealth = 0; }
function calculateBaseStats() {
    let maxHealth = BASE_INITIAL_HEALTH; let defensePower = 0;
    for (const buildingId in gameState.buildings) {
        const level = gameState.buildings[buildingId];
        if (level > 0 && buildingsData[buildingId].type === 'defense') {
            const defData = buildingsData[buildingId]; const currentLevelData = defData.levels[level - 1];
            if (currentLevelData.stats) { if (gameState.defenses[buildingId] && gameState.defenses[buildingId].currentHealth > 0) { defensePower += gameState.defenses[buildingId].attack; } }
            if (currentLevelData.baseHealthBonus) { maxHealth += currentLevelData.baseHealthBonus; }
        }
    }
    if (gameState.nanobotStats.isDefendingBase && gameState.map.nanobotPos.x === BASE_COORDINATES.x && gameState.map.nanobotPos.y === BASE_COORDINATES.y) { defensePower += gameState.nanobotStats.attack; }
    gameState.baseStats.maxHealth = maxHealth; gameState.baseStats.defensePower = defensePower;
    gameState.baseStats.currentHealth = Math.min(gameState.baseStats.currentHealth, gameState.baseStats.maxHealth);
    if (gameState.baseStats.currentHealth <= 0 && gameState.baseStats.maxHealth > 0) { gameState.baseStats.currentHealth = 0; }
}
function calculateProductionAndConsumption() { gameState.productionRates.biomass = 0; gameState.productionRates.nanites = 0; let totalEnergyConsumption = 0; for (const buildingId in gameState.buildings) { const level = gameState.buildings[buildingId]; if (level > 0) { const buildingDef = buildingsData[buildingId]; const levelData = buildingDef.levels[level - 1]; if (buildingDef.type === "production") { if (levelData.production) { if (levelData.production.biomass) gameState.productionRates.biomass += levelData.production.biomass; if (levelData.production.nanites) gameState.productionRates.nanites += levelData.production.nanites; } } if (levelData.energyConsumption) totalEnergyConsumption += levelData.energyConsumption; } } gameState.capacity.energy = 50; const powerPlantLevel = gameState.buildings['powerPlant'] || 0; if (powerPlantLevel > 0) { gameState.capacity.energy += buildingsData['powerPlant'].levels[powerPlantLevel - 1].capacity.energy; } if (!gameState.isDay) { gameState.productionRates.biomass *= 0.7; gameState.productionRates.nanites *= 0.7; } gameState.resources.energy = totalEnergyConsumption; if (totalEnergyConsumption > gameState.capacity.energy) { const deficitFactor = gameState.capacity.energy > 0 ? gameState.capacity.energy / totalEnergyConsumption : 0; gameState.productionRates.biomass *= deficitFactor; gameState.productionRates.nanites *= deficitFactor; if (Math.random() < 0.1) addLogEntry("Surcharge énergétique! Production et défenses réduites.", "error"); gameState.baseStats.defensePower = Math.floor(gameState.baseStats.defensePower * deficitFactor); } }
function build(buildingId) { const building = buildingsData[buildingId]; const currentLevel = gameState.buildings[buildingId] || 0; if (currentLevel >= building.levels.length) { addLogEntry(`${building.name} est au niveau maximum.`, "info"); return; } const nextLevelData = building.levels[currentLevel]; for (const resource in nextLevelData.cost) { if (gameState.resources[resource] < nextLevelData.cost[resource]) { addLogEntry(`Ressources insuffisantes pour ${building.name}. Requis: ${nextLevelData.cost[resource]} ${resource}.`, "error"); return; } } const title = building.type === 'defense' ? `Construire/Améliorer ${building.name}?` : `Améliorer ${building.name}?`; showModal(title, `Passer ${building.name} au Niveau ${currentLevel + 1}?`, () => { for (const resource in nextLevelData.cost) gameState.resources[resource] -= nextLevelData.cost[resource]; gameState.buildings[buildingId] = currentLevel + 1; addLogEntry(`${building.name} ${building.type === 'defense' && currentLevel === 0 ? 'construit(e)' : 'amélioré(e)'} au Niveau ${currentLevel + 1}.`, "success"); if (nextLevelData.grantsModule) calculateNanobotStats(); if (building.type === 'defense') { if (nextLevelData.stats){ gameState.defenses[buildingId] = { id: buildingId, name: building.name, level: currentLevel + 1, currentHealth: nextLevelData.stats.health, maxHealth: nextLevelData.stats.health, attack: nextLevelData.stats.attack }; } calculateBaseStats(); } calculateProductionAndConsumption(); updateDisplays(); }); }
function startResearch(researchId) { if (activeResearch) { addLogEntry("Recherche en cours.", "info"); return; } if (gameState.research[researchId]) { addLogEntry("Technologie acquise.", "info"); return; } const research = researchData[researchId]; let labLevel = gameState.buildings['researchLab'] || 0; let researchSpeedFactor = labLevel > 0 ? buildingsData['researchLab'].levels[labLevel - 1].researchSpeedFactor : 0.5; for (const resource in research.cost) { if (gameState.resources[resource] < research.cost[resource]) { addLogEntry(`Ressources insuffisantes: ${research.name}.`, "error"); return; } } showModal(`Lancer ${research.name}?`, `Coût & Temps adaptés.`, () => { for (const resource in research.cost) gameState.resources[resource] -= research.cost[resource]; activeResearch = { id: researchId, startTime: gameState.gameTime, totalTime: research.time / researchSpeedFactor }; addLogEntry(`Recherche ${research.name} initiée.`, "success"); updateDisplays(); });}
function repairBase(amount = 10) { if (gameState.baseStats.currentHealth >= gameState.baseStats.maxHealth) { addLogEntry("Le Noyau est déjà à son intégrité maximale.", "info"); return; } const healthToRestore = Math.min(amount, gameState.baseStats.maxHealth - gameState.baseStats.currentHealth); const costBiomass = healthToRestore * REPAIR_COST_BASE_HEALTH_BIOMASS; const costNanites = healthToRestore * REPAIR_COST_BASE_HEALTH_NANITES; if (gameState.resources.biomass < costBiomass || gameState.resources.nanites < costNanites) { addLogEntry(`Ressources insuffisantes pour réparer le Noyau. Requis: ${costBiomass} Biomasse, ${costNanites} Nanites.`, "error"); return; } gameState.resources.biomass -= costBiomass; gameState.resources.nanites -= costNanites; gameState.baseStats.currentHealth += healthToRestore; addLogEntry(`Noyau réparé de ${healthToRestore} PV. (-${costBiomass} Bio, -${costNanites} Nan).`, "success"); updateResourceDisplay(); updateBaseStatusDisplay(); }
function repairAllDefenses() { let totalBiomassCost = 0; let totalHealthRestored = 0; let defensesToRepair = []; for (const defId in gameState.defenses) { const defense = gameState.defenses[defId]; if (defense.currentHealth < defense.maxHealth) { const healthNeeded = defense.maxHealth - defense.currentHealth; defensesToRepair.push({ defId, healthNeeded }); totalBiomassCost += healthNeeded * REPAIR_COST_DEFENSE_HEALTH_BIOMASS; } } if (defensesToRepair.length === 0) { addLogEntry("Toutes les défenses sont opérationnelles.", "info"); return; } if (gameState.resources.biomass < totalBiomassCost) { addLogEntry(`Ressources insuffisantes pour réparer toutes les défenses. Requis: ${totalBiomassCost} Biomasse.`, "error"); return; } gameState.resources.biomass -= totalBiomassCost; defensesToRepair.forEach(item => { gameState.defenses[item.defId].currentHealth += item.healthNeeded; totalHealthRestored += item.healthNeeded; }); addLogEntry(`Toutes les défenses endommagées ont été réparées (+${totalHealthRestored} PV total). (-${totalBiomassCost} Bio).`, "success"); calculateBaseStats(); updateResourceDisplay(); updateBaseStatusDisplay(); }
function toggleNanobotDefendBase() { gameState.nanobotStats.isDefendingBase = !gameState.nanobotStats.isDefendingBase; if (gameState.nanobotStats.isDefendingBase) { toggleNanobotDefendBaseBtn.textContent = "Désactiver Défense du Noyau"; toggleNanobotDefendBaseBtn.classList.remove('btn-secondary'); toggleNanobotDefendBaseBtn.classList.add('btn-warning'); addLogEntry("Nexus-7 en mode défense du Noyau. Retournez à la base pour être effectif.", "info"); if (gameState.map.nanobotPos.x === BASE_COORDINATES.x && gameState.map.nanobotPos.y === BASE_COORDINATES.y) { addLogEntry("Nexus-7 est positionné pour défendre le Noyau.", "success"); } } else { toggleNanobotDefendBaseBtn.textContent = "Activer Défense du Noyau"; toggleNanobotDefendBaseBtn.classList.add('btn-secondary'); toggleNanobotDefendBaseBtn.classList.remove('btn-warning'); addLogEntry("Nexus-7 n'est plus en mode défense active du Noyau.", "info"); } calculateBaseStats(); updateBaseStatusDisplay(); }
function updateGameTimeAndCycle() { gameState.gameTime++; gameState.currentCycleTime += TICK_SPEED; const currentCycleDuration = gameState.isDay ? DAY_DURATION : NIGHT_DURATION; if (gameState.currentCycleTime >= currentCycleDuration) { gameState.isDay = !gameState.isDay; gameState.currentCycleTime = 0; addLogEntry(`Changement de cycle: C'est maintenant ${gameState.isDay ? 'le JOUR' : 'la NUIT'}.`, "info"); if (!gameState.isDay) { addLogEntry("L'activité hostile augmente... Préparez les défenses!", "warning"); startNightAssault(); } else { addLogEntry("L'activité hostile diminue avec l'aube.", "info"); endNightAssault(); } calculateProductionAndConsumption(); calculateBaseStats(); } gameTimeEl.textContent = formatTime(gameState.gameTime); cycleStatusEl.textContent = `${gameState.isDay ? "Jour" : "Nuit"} (${formatTime(Math.floor((currentCycleDuration - gameState.currentCycleTime)/1000))})`; }
function updateDisplays() { updateResourceDisplay(); updateBuildingDisplay(); updateResearchDisplay(); updateNanobotDisplay(); updateInventoryDisplay(); updateShopDisplay(); updateXpBar(); updateBaseStatusDisplay(); if (explorationContentEl && explorationContentEl.classList.contains('hidden') === false) updateExplorationDisplay(); }

// --- Night Assault Logic ---
function startNightAssault() {
    if (gameState.baseStats.currentHealth <= 0) { addLogEntry("Le Noyau est détruit. Impossible de subir un assaut.", "error", eventLogEl); gameState.nightAssault.isActive = false; return; }
    gameState.nightAssault.isActive = true; gameState.nightAssault.wave++; gameState.nightAssault.enemies = []; gameState.nightAssault.lastAttackTime = gameState.gameTime; 
    gameState.nightAssault.log = [`Début de l'assaut nocturne - Vague ${gameState.nightAssault.wave}`]; nightAssaultLogEl.innerHTML = ""; 
    const wave = gameState.nightAssault.wave; let numDrones = wave * 2 + Math.floor(Math.random() * wave * 1.5); let numBots = Math.floor(wave / 2.5) + Math.floor(Math.random() * (wave/2 +1)); let numCrawlers = Math.floor(wave / 3.5) + Math.floor(Math.random() * (wave/3+1) );
    if (numDrones > 0) gameState.nightAssault.enemies.push({ ...nightAssaultEnemies.find(e => e.id === 'swarm_drone'), count: numDrones, currentHealth: nightAssaultEnemies.find(e => e.id === 'swarm_drone').baseHealth * numDrones });
    if (numBots > 0) gameState.nightAssault.enemies.push({ ...nightAssaultEnemies.find(e => e.id === 'assault_bot'), count: numBots, currentHealth: nightAssaultEnemies.find(e => e.id === 'assault_bot').baseHealth * numBots });
    if (numCrawlers > 0 && wave > 1) gameState.nightAssault.enemies.push({ ...nightAssaultEnemies.find(e => e.id === 'heavy_crawler'), count: numCrawlers, currentHealth: nightAssaultEnemies.find(e => e.id === 'heavy_crawler').baseHealth * numCrawlers });
    let enemySummary = gameState.nightAssault.enemies.map(g => `${g.count} ${g.name}(s)`).join(', ');
    if (gameState.nightAssault.enemies.length === 0) enemySummary = "Vague de reconnaissance très faible"; 
    addLogEntry(`ALERTE! Vague ${gameState.nightAssault.wave} d'ennemis approche: ${enemySummary}.`, "error", eventLogEl); 
    addLogEntry(`Vague ${gameState.nightAssault.wave} en approche: ${enemySummary}.`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log); 
    updateBaseStatusDisplay(); 
}
function endNightAssault() {
    gameState.nightAssault.isActive = false;
    if (gameState.nightAssault.enemies.length > 0 && gameState.baseStats.currentHealth > 0) { let remainingEnemies = gameState.nightAssault.enemies.map(g => `${g.count} ${g.name}(s)`).join(', '); addLogEntry(`L'aube arrive. Les ennemis restants (${remainingEnemies}) se retirent.`, "base-defense-event", nightAssaultLogEl, gameState.nightAssault.log);
    } else if (gameState.baseStats.currentHealth > 0 && gameState.nightAssault.wave > 0) { addLogEntry(`Nuit ${gameState.nightAssault.wave} survivée ! Les défenses ont tenu.`, "success", nightAssaultLogEl, gameState.nightAssault.log);
    } else if (gameState.baseStats.currentHealth <=0) { addLogEntry(`Le Noyau a été détruit pendant la vague ${gameState.nightAssault.wave}.`, "error", nightAssaultLogEl, gameState.nightAssault.log); }
    gameState.nightAssault.enemies = []; updateBaseStatusDisplay();
}
function processNightAssaultTick() {
    if (!gameState.nightAssault.isActive || gameState.isDay || gameState.baseStats.currentHealth <= 0) return;
    if (gameState.gameTime < gameState.nightAssault.lastAttackTime + (NIGHT_ASSAULT_TICK_INTERVAL / TICK_SPEED)) return;
    gameState.nightAssault.lastAttackTime = gameState.gameTime;
    if (gameState.nightAssault.enemies.length === 0) { if (!gameState.isDay && gameState.nightAssault.isActive) { addLogEntry("Secteur calme...", "base-info-event", nightAssaultLogEl, gameState.nightAssault.log); } return; }

    let baseAttackPower = gameState.baseStats.defensePower; let enemiesDestroyedThisTickInfo = []; let totalBiomassReward = 0; let totalNaniteReward = 0;
    for (let i = gameState.nightAssault.enemies.length - 1; i >= 0; i--) {
        let enemyGroup = gameState.nightAssault.enemies[i]; if (baseAttackPower <= 0) break;
        let damageToGroup = Math.min(baseAttackPower, enemyGroup.currentHealth); enemyGroup.currentHealth -= damageToGroup; baseAttackPower -= damageToGroup;
        let numDefeatedInTick = Math.min(Math.floor(damageToGroup / enemyGroup.baseHealth), enemyGroup.count); enemyGroup.count -= numDefeatedInTick;
        if (numDefeatedInTick > 0) { enemiesDestroyedThisTickInfo.push(`${numDefeatedInTick} ${enemyGroup.name}(s)`); totalBiomassReward += enemyGroup.reward.biomass * numDefeatedInTick; totalNaniteReward += enemyGroup.reward.nanites * numDefeatedInTick; }
        if (enemyGroup.count <= 0) { gameState.nightAssault.enemies.splice(i, 1); } else { enemyGroup.currentHealth = enemyGroup.count * enemyGroup.baseHealth; }
    }
    if (enemiesDestroyedThisTickInfo.length > 0) { addLogEntry(`Défenses neutralisent: ${enemiesDestroyedThisTickInfo.join(', ')}.`, "base-defense-event", nightAssaultLogEl, gameState.nightAssault.log); if (totalBiomassReward > 0 || totalNaniteReward > 0) { gameState.resources.biomass += totalBiomassReward; gameState.resources.nanites += totalNaniteReward; addLogEntry(`Récupéré: +${totalBiomassReward} Biomasse, +${totalNaniteReward} Nanites.`, "success", nightAssaultLogEl, gameState.nightAssault.log); updateResourceDisplay(); } }

    let totalEnemyAttackAfterLosses = gameState.nightAssault.enemies.reduce((sum, group) => sum + (group.baseAttack * group.count), 0);
    if (totalEnemyAttackAfterLosses > 0 && gameState.nightAssault.enemies.length > 0) {
        let remainingEnemyAttack = totalEnemyAttackAfterLosses; let defensesTargetedLog = [];
        for (const defId in gameState.defenses) { if (remainingEnemyAttack <= 0) break; const defense = gameState.defenses[defId]; if (defense.currentHealth > 0) { const damageToThisDefense = Math.min(remainingEnemyAttack, defense.currentHealth); defense.currentHealth -= damageToThisDefense; remainingEnemyAttack -= damageToThisDefense; defensesTargetedLog.push(`${defense.name} (-${damageToThisDefense} PV, reste ${Math.floor(defense.currentHealth)})`); if (defense.currentHealth <= 0) { addLogEntry(`${defense.name} détruit(e)!`, "error", nightAssaultLogEl, gameState.nightAssault.log); calculateBaseStats(); calculateProductionAndConsumption(); } } }
        if (defensesTargetedLog.length > 0) { addLogEntry(`Assaut ennemi sur les défenses: ${defensesTargetedLog.join(', ')}.`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log); }

        let damageToCore = 0; let damageToNanobot = 0;
        if (remainingEnemyAttack > 0) {
            damageToCore = remainingEnemyAttack;
            if (gameState.nanobotStats.isDefendingBase && gameState.map.nanobotPos.x === BASE_COORDINATES.x && gameState.map.nanobotPos.y === BASE_COORDINATES.y && gameState.nanobotStats.currentHealth > 0) {
                damageToNanobot = Math.min(Math.floor(remainingEnemyAttack * 0.5), gameState.nanobotStats.currentHealth); damageToCore = remainingEnemyAttack - damageToNanobot;
                if (damageToNanobot > 0) { gameState.nanobotStats.currentHealth -= damageToNanobot; addLogEntry(`Nexus-7 intercepte ${damageToNanobot} dégâts! (PV: ${Math.floor(gameState.nanobotStats.currentHealth)}/${gameState.nanobotStats.health})`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log); updateNanobotDisplay(); if (gameState.nanobotStats.currentHealth <= 0) { addLogEntry("Nexus-7 est hors de combat!", "error", nightAssaultLogEl, gameState.nightAssault.log); calculateBaseStats(); } }
            }
            if (damageToCore > 0) { gameState.baseStats.currentHealth -= damageToCore; addLogEntry(`Le Noyau subit ${damageToCore} dégâts directs! (PV: ${Math.floor(gameState.baseStats.currentHealth)}/${gameState.baseStats.maxHealth})`, "base-assault-event", nightAssaultLogEl, gameState.nightAssault.log); }
        }
        if (gameState.baseStats.currentHealth <= 0) { gameState.baseStats.currentHealth = 0; addLogEntry("ALERTE CRITIQUE! L'INTÉGRITÉ DU NOYAU EST COMPROMISE!", "error", nightAssaultLogEl, gameState.nightAssault.log); let biomassLoss = Math.floor(gameState.resources.biomass * 0.25); let naniteLoss = Math.floor(gameState.resources.nanites * 0.25); gameState.resources.biomass -= biomassLoss; gameState.resources.nanites -= naniteLoss; addLogEntry(`Perte de ressources: -${biomassLoss} Biomasse, -${naniteLoss} Nanites.`, "error", nightAssaultLogEl, gameState.nightAssault.log); addLogEntry("Le Noyau est détruit. L'assaut prend fin.", "error", eventLogEl); endNightAssault(); }
    }
    updateBaseStatusDisplay(); 
}

// --- Exploration Map Functions ---
function generateMap() { gameState.map.tiles = []; gameState.map.explored = []; for (let y = 0; y < MAP_SIZE.height; y++) { const tileRow = []; const exploredRow = []; for (let x = 0; x < MAP_SIZE.width; x++) { tileRow.push(TILE_TYPES.EMPTY); exploredRow.push(false); } gameState.map.tiles.push(tileRow); gameState.map.explored.push(exploredRow); } gameState.map.tiles[BASE_COORDINATES.y][BASE_COORDINATES.x] = TILE_TYPES.BASE; gameState.map.explored[BASE_COORDINATES.y][BASE_COORDINATES.x] = true; for (let i = 0; i < 5; i++) { let rx, ry; do { rx = Math.floor(Math.random() * MAP_SIZE.width); ry = Math.floor(Math.random() * MAP_SIZE.height); } while (gameState.map.tiles[ry][rx] !== TILE_TYPES.EMPTY); gameState.map.tiles[ry][rx] = { type: TILE_TYPES.RESOURCE_BIOMASS, amount: Math.floor(Math.random() * 50) + 20 };} for (let i = 0; i < 3; i++) { let rx, ry; do { rx = Math.floor(Math.random() * MAP_SIZE.width); ry = Math.floor(Math.random() * MAP_SIZE.height); } while (gameState.map.tiles[ry][rx] !== TILE_TYPES.EMPTY); gameState.map.tiles[ry][rx] = { type: TILE_TYPES.RESOURCE_NANITES, amount: Math.floor(Math.random() * 30) + 10 };} for (let i = 0; i < 4; i++) { let ex, ey; do { ex = Math.floor(Math.random() * MAP_SIZE.width); ey = Math.floor(Math.random() * MAP_SIZE.height); } while (gameState.map.tiles[ey][ex] !== TILE_TYPES.EMPTY || (ex === BASE_COORDINATES.x && ey === BASE_COORDINATES.y)); gameState.map.tiles[ey][ex] = { type: TILE_TYPES.ENEMY_DRONE, details: { name: "Drone Éclaireur", health: 30, maxHealth:30, attack: 8, defense: 2, color: '#a0aec0' } };} let ux, uy; do { ux = Math.floor(Math.random() * MAP_SIZE.width); uy = Math.floor(Math.random() * MAP_SIZE.height); } while (gameState.map.tiles[uy][ux] !== TILE_TYPES.EMPTY || (ux === BASE_COORDINATES.x && uy === BASE_COORDINATES.y)); gameState.map.tiles[uy][ux] = { type: TILE_TYPES.UPGRADE_CACHE, reward: { biomass: 50, nanites: 25 } }; for (let i = 0; i < MAP_SIZE.width * MAP_SIZE.height * 0.1; i++) { let ix, iy; do { ix = Math.floor(Math.random() * MAP_SIZE.width); iy = Math.floor(Math.random() * MAP_SIZE.height); } while (gameState.map.tiles[iy][ix] !== TILE_TYPES.EMPTY || (ix === BASE_COORDINATES.x && iy === BASE_COORDINATES.y)); gameState.map.tiles[iy][ix] = TILE_TYPES.IMPASSABLE; } gameState.nanobotMapPos = { ...BASE_COORDINATES }; }
function getTileDisplayClass(x, y) { const isNanobotCurrentPos = gameState.map.nanobotPos.x === x && gameState.map.nanobotPos.y === y; if (isNanobotCurrentPos) return 'nanobot'; if (!gameState.map.explored[y][x]) return 'unexplored'; const tileData = gameState.map.tiles[y][x]; let tileType = tileData; if (typeof tileData === 'object' && tileData !== null) tileType = tileData.type; switch (tileType) { case TILE_TYPES.EMPTY: return 'explored'; case TILE_TYPES.BASE: return 'base'; case TILE_TYPES.RESOURCE_BIOMASS: return 'resource-biomass'; case TILE_TYPES.RESOURCE_NANITES: return 'resource-nanites'; case TILE_TYPES.ENEMY_DRONE: case TILE_TYPES.ENEMY_SAURIAN: return 'enemy'; case TILE_TYPES.UPGRADE_CACHE: return 'upgrade'; case TILE_TYPES.IMPASSABLE: return 'impassable'; default: return 'explored'; } }
function getTileInfo(x,y) { if (!gameState.map.explored[y][x]) return "Zone non explorée."; const tileData = gameState.map.tiles[y][x]; let tileType = tileData; if (typeof tileData === 'object' && tileData !== null) tileType = tileData.type; switch (tileType) { case TILE_TYPES.EMPTY: return "Zone vide."; case TILE_TYPES.BASE: return "Noyau Central - Zone sécurisée."; case TILE_TYPES.RESOURCE_BIOMASS: return `Dépôt de Biomasse (${tileData.amount}).`; case TILE_TYPES.RESOURCE_NANITES: return `Fragments de Nanites (${tileData.amount}).`; case TILE_TYPES.ENEMY_DRONE: return `Danger! ${tileData.details.name} détecté.`; case TILE_TYPES.UPGRADE_CACHE: return "Cache de matériaux détectée."; case TILE_TYPES.IMPASSABLE: return "Terrain infranchissable."; default: return "Zone explorée."; } }
function updateExplorationDisplay() { mapGridEl.innerHTML = ''; mapGridEl.style.gridTemplateColumns = `repeat(${MAP_SIZE.width}, 1fr)`; for (let y = 0; y < MAP_SIZE.height; y++) { for (let x = 0; x < MAP_SIZE.width; x++) { const tileDiv = document.createElement('div'); tileDiv.classList.add('map-tile', getTileDisplayClass(x,y)); tileDiv.dataset.x = x; tileDiv.dataset.y = y; tileDiv.addEventListener('click', () => handleTileClick(x, y)); tileDiv.addEventListener('mouseover', () => { tileInfoDisplayEl.textContent = `(${x},${y}) ${getTileInfo(x,y)}`; }); tileDiv.addEventListener('mouseout', () => { tileInfoDisplayEl.textContent = "Survolez une case explorée pour plus d'infos."; }); mapGridEl.appendChild(tileDiv); } } nanobotMapPosEl.textContent = `(${gameState.map.nanobotPos.x}, ${gameState.map.nanobotPos.y})`; }
function handleTileClick(targetX, targetY) { const currentX = gameState.map.nanobotPos.x; const currentY = gameState.map.nanobotPos.y; const dx = Math.abs(targetX - currentX); const dy = Math.abs(targetY - currentY); if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) { moveToTile(targetX, targetY); } else if (dx === 0 && dy === 0) { addLogEntry("Nexus-7 est déjà sur cette position.", "info", eventLogEl); } else { addLogEntry("Déplacement impossible: Cible trop éloignée.", "warning", eventLogEl); } }
async function moveToTile(targetX, targetY) { if (gameState.resources.energy < EXPLORATION_COST_ENERGY) { addLogEntry(`Énergie insuffisante (Requis: ${EXPLORATION_COST_ENERGY}).`, "error", eventLogEl); return; } const targetTileData = gameState.map.tiles[targetY][targetX]; let targetTileType = targetTileData; if (typeof targetTileData === 'object' && targetTileData !== null) targetTileType = targetTileData.type; if (targetTileType === TILE_TYPES.IMPASSABLE) { addLogEntry("Terrain infranchissable.", "warning", eventLogEl); if (!gameState.map.explored[targetY][targetX]) { gameState.map.explored[targetY][targetX] = true; updateExplorationDisplay(); } return; } gameState.resources.energy -= EXPLORATION_COST_ENERGY; gameState.map.nanobotPos.x = targetX; gameState.map.nanobotPos.y = targetY; const newTileWasUnexplored = !gameState.map.explored[targetY][targetX]; gameState.map.explored[targetY][targetX] = true; addLogEntry(`Déplacement vers (${targetX},${targetY}). Énergie: -${EXPLORATION_COST_ENERGY}.`, "info", eventLogEl); if (newTileWasUnexplored) { addLogEntry(`Nouvelle zone découverte!`, "success", eventLogEl); } 
    if (gameState.nanobotStats.isDefendingBase && (targetX !== BASE_COORDINATES.x || targetY !== BASE_COORDINATES.y)) {
        addLogEntry("Nexus-7 quitte la zone du Noyau et ne participe plus activement à sa défense.", "warning", eventLogEl);
        calculateBaseStats(); 
    }
    updateExplorationDisplay(); updateResourceDisplay(); await triggerTileEvent(targetX, targetY); 
}
async function triggerTileEvent(x, y) { const tileData = gameState.map.tiles[y][x]; let tileType = tileData; if (typeof tileData === 'object' && tileData !== null) tileType = tileData.type; switch (tileType) { case TILE_TYPES.RESOURCE_BIOMASS: gameState.resources.biomass += tileData.amount; addLogEntry(`Biomasse trouvée (+${tileData.amount})!`, "success", eventLogEl); gameState.map.tiles[y][x] = TILE_TYPES.EMPTY; break; case TILE_TYPES.RESOURCE_NANITES: gameState.resources.nanites += tileData.amount; addLogEntry(`Nanites trouvés (+${tileData.amount})!`, "success", eventLogEl); gameState.map.tiles[y][x] = TILE_TYPES.EMPTY; break; case TILE_TYPES.ENEMY_DRONE: case TILE_TYPES.ENEMY_SAURIAN: addLogEntry(`Danger! ${tileData.details.name} rencontré!`, "warning", eventLogEl); gameState.map.currentEnemyEncounter = { x, y, details: tileData.details }; await simulateCombat(tileData.details); break; case TILE_TYPES.UPGRADE_CACHE: const reward = tileData.reward; if (reward.biomass) gameState.resources.biomass += reward.biomass; if (reward.nanites) gameState.resources.nanites += reward.nanites; addLogEntry(`Cache ouverte! +${reward.biomass || 0} Biomasse, +${reward.nanites || 0} Nanites.`, "success", eventLogEl); gameState.map.tiles[y][x] = TILE_TYPES.EMPTY; break; case TILE_TYPES.BASE: addLogEntry("Retour au Noyau Central.", "info", eventLogEl); if (gameState.nanobotStats.currentHealth < gameState.nanobotStats.health) { let healAmount = Math.ceil(gameState.nanobotStats.health * 0.1); gameState.nanobotStats.currentHealth = Math.min(gameState.nanobotStats.health, gameState.nanobotStats.currentHealth + healAmount); addLogEntry(`Nexus-7: Réparation partielle du système (+${Math.floor(healAmount)} PV).`, "info", eventLogEl); updateNanobotDisplay(); } if (gameState.nanobotStats.isDefendingBase) { addLogEntry("Nexus-7 est en position pour défendre le Noyau.", "success", eventLogEl); calculateBaseStats(); updateBaseStatusDisplay(); } break; } updateResourceDisplay(); updateExplorationDisplay(); }

// --- Combat Visualisation Functions ---
function setupCombatVisuals(nanobot, enemy) { combatModalEl.classList.remove('hidden'); combatLogVisualEl.innerHTML = '<p class="text-gray-400">Préparation du combat...</p>'; combatNanobotHealthbar.style.width = '100%'; combatNanobotHealthbar.classList.remove('low'); combatNanobotSprite.innerHTML = ''; gameState.activeModules.forEach(moduleId => { const moduleData = nanobotModulesData[moduleId]; if (moduleData) { if (moduleData.visualClass) { const visualEl = document.createElement('div'); visualEl.className = `nanobot-module ${moduleData.visualClass}`; combatNanobotSprite.appendChild(visualEl); } else if (moduleData.visualClasses) { moduleData.visualClasses.forEach(className => { const visualEl = document.createElement('div'); visualEl.className = `nanobot-module ${className}`; combatNanobotSprite.appendChild(visualEl); }); } } }); for (const slot in gameState.nanobotEquipment) { const itemId = gameState.nanobotEquipment[slot]; if (itemId && itemsData[itemId] && itemsData[itemId].visualClass) { const item = itemsData[itemId]; const visualEl = document.createElement('div'); visualEl.className = `nanobot-item-visual ${item.visualClass}`; combatNanobotSprite.appendChild(visualEl); } } combatEnemyNameEl.textContent = enemy.name; combatEnemyHealthbar.style.width = '100%'; combatEnemyHealthbar.classList.remove('low'); combatEnemySprite.style.backgroundColor = enemy.color || '#c53030'; }
function updateCombatantHealthVisual(combatantElementId, currentHealth, maxHealth) { const healthBar = document.getElementById(`${combatantElementId}-healthbar`); const percentage = Math.max(0, (maxHealth > 0 ? (currentHealth / maxHealth) : 0) * 100); healthBar.style.width = `${percentage}%`; healthBar.classList.toggle('low', percentage < 30); }
async function showDamageFloat(targetElement, damage) { const damageEl = document.createElement('div'); damageEl.className = 'damage-float'; damageEl.textContent = `-${damage}`; targetElement.appendChild(damageEl); await sleep(1000 / combatSpeedMultiplier); damageEl.remove(); } 
async function animateAttack(attackerElement, targetElement, isNanobotAttacking) { const originalTransform = attackerElement.style.transform; const direction = isNanobotAttacking ? 1 : -1; attackerElement.style.transform = `translateX(${20 * direction}px) scale(1.05)`; targetElement.style.filter = 'brightness(1.5) saturate(2)'; await sleep( (COMBAT_ANIMATION_DELAY / 2) ); attackerElement.style.transform = originalTransform; targetElement.style.filter = 'none'; await sleep( (COMBAT_ANIMATION_DELAY / 2) ); }
        
async function _simulateCombat(enemyDetails) {
    if (gameState.nanobotStats.currentHealth <= 0) { addLogEntry("Nexus-7 hors combat.", "error", combatLogSummaryEl, gameState.combatLogSummary); return; }
    const enemy = { ...enemyDetails }; enemy.currentHealth = enemy.health; 
    if (!enemy.maxHealth) enemy.maxHealth = enemy.health; 

    setupCombatVisuals(gameState.nanobotStats, enemy);
    addLogEntry(`Affrontement avec ${enemy.name}!`, "combat-visual", combatLogVisualEl, null);
    await sleep(COMBAT_ANIMATION_DELAY); // Uses the global COMBAT_ANIMATION_DELAY updated by speed multiplier
    let combatRound = 0; closeCombatModalBtn.disabled = true; toggleSpeedBtn.disabled = true; let combatEnded = false;
    
    while (gameState.nanobotStats.currentHealth > 0 && enemy.currentHealth > 0 && combatRound < 20) { 
        combatRound++; addLogEntry(`--- Round ${combatRound} ---`, "combat-visual", combatLogVisualEl, null);
        addLogEntry("Nexus-7 attaque...", "combat-visual", combatLogVisualEl, null); await animateAttack(document.getElementById('combat-nanobot'), document.getElementById('combat-enemy'), true);
        let damageToEnemy = Math.max(1, gameState.nanobotStats.attack - enemy.defense); enemy.currentHealth -= damageToEnemy;
        await showDamageFloat(document.getElementById('combat-enemy'), damageToEnemy); updateCombatantHealthVisual('combat-enemy', enemy.currentHealth, enemy.maxHealth);
        addLogEntry(`Nexus-7 inflige ${damageToEnemy} dégâts. PV ${enemy.name}: ${Math.max(0, Math.floor(enemy.currentHealth))}`, "combat-visual", combatLogVisualEl, null); addLogEntry(`Nexus-7 inflige ${damageToEnemy} à ${enemy.name}.`, "combat", combatLogSummaryEl, gameState.combatLogSummary);
        await sleep(COMBAT_ANIMATION_DELAY);
        if (enemy.currentHealth <= 0) { addLogEntry(`${enemy.name} détruit! Victoire!`, "success", combatLogVisualEl, null); addLogEntry(`${enemy.name} détruit! Victoire!`, "success", combatLogSummaryEl, gameState.combatLogSummary); if (gameState.map.currentEnemyEncounter) { const {x, y} = gameState.map.currentEnemyEncounter; gameState.map.tiles[y][x] = TILE_TYPES.EMPTY; } combatEnded = true; break; }
        
        addLogEntry(`${enemy.name} attaque...`, "combat-visual", combatLogVisualEl, null); await animateAttack(document.getElementById('combat-enemy'), document.getElementById('combat-nanobot'), false);
        let damageToNanobot = Math.max(1, enemy.attack - gameState.nanobotStats.defense); gameState.nanobotStats.currentHealth -= damageToNanobot;
        await showDamageFloat(document.getElementById('combat-nanobot'), damageToNanobot); updateCombatantHealthVisual('combat-nanobot', gameState.nanobotStats.currentHealth, gameState.nanobotStats.health);
        addLogEntry(`${enemy.name} inflige ${damageToNanobot} dégâts. PV Nexus-7: ${Math.max(0, Math.floor(gameState.nanobotStats.currentHealth))}`, "combat-visual", combatLogVisualEl, null); addLogEntry(`${enemy.name} inflige ${damageToNanobot} à Nexus-7.`, "combat", combatLogSummaryEl, gameState.combatLogSummary);
        await sleep(COMBAT_ANIMATION_DELAY);
        if (gameState.nanobotStats.currentHealth <= 0) { gameState.nanobotStats.currentHealth = 0; addLogEntry("Nexus-7 vaincu... Retour à la base!", "error", combatLogVisualEl, null); addLogEntry("Nexus-7 vaincu... Retour à la base.", "error", combatLogSummaryEl, gameState.combatLogSummary); gameState.map.nanobotPos = { ...BASE_COORDINATES }; gameState.nanobotStats.currentHealth = Math.max(1, Math.floor(gameState.nanobotStats.health * 0.1)); addLogEntry("Systèmes critiques. Réparation d'urgence à la base.", "error", eventLogEl); combatEnded = true; break; }
    }
    if (!combatEnded && combatRound >= 20) { addLogEntry("Combat indécis. Retraite.", "warning", combatLogVisualEl, null); addLogEntry("Combat indécis.", "warning", combatLogSummaryEl, gameState.combatLogSummary); }
    closeCombatModalBtn.disabled = false; toggleSpeedBtn.disabled = false; gameState.map.currentEnemyEncounter = null;
    calculateNanobotStats(); updateDisplays(); 
}
var originalSimulateCombat = _simulateCombat; 
var simulateCombat = async function(enemyDetails) { 
    await _simulateCombat(enemyDetails); 
    
    if (enemyDetails && gameState.nanobotStats.currentHealth > 0 && enemyDetails.currentHealth <=0) { 
        combatEndTitleEl.textContent = "Victoire !";
        combatEndTitleEl.className = "font-orbitron text-lg mb-4 text-green-300";
        const biomassReward = enemyDetails.attack * 2; const naniteReward = enemyDetails.defense;
        combatEndRewardsEl.innerHTML = `+${biomassReward} Biomasse<br>+${naniteReward} Nanites`;
        gameState.resources.biomass += biomassReward; gameState.resources.nanites += naniteReward;
        addLogEntry(`Récompenses: +${biomassReward} Biomasse, +${naniteReward} Nanites.`, "success", combatLogSummaryEl, gameState.combatLogSummary);
        const xpAmount = Math.floor(enemyDetails.attack + enemyDetails.defense + (enemyDetails.maxHealth / 5)); gainXP(xpAmount);
        const lootItems = generateLoot(enemyDetails); lootListEl.innerHTML = ""; 
        if (lootItems.length > 0) { lootItems.forEach(itemId => { addToInventory(itemId); const itemData = itemsData[itemId]; if (itemData) { const li = document.createElement("li"); li.textContent = `🎁 ${itemData.name}`; lootListEl.appendChild(li); } });
        } else { lootListEl.innerHTML = "<li>Aucun butin spécifique trouvé.</li>"; }
        updateResourceDisplay(); combatEndModalEl.classList.remove('hidden');
    } else if (enemyDetails && gameState.nanobotStats.currentHealth <= 0) { 
        combatEndTitleEl.textContent = "Défaite...";
        combatEndTitleEl.className = "font-orbitron text-lg mb-4 text-red-400";
        combatEndRewardsEl.innerHTML = "Aucune récompense.";
        xpGainEl.textContent = "+0 XP";
        lootListEl.innerHTML = "<li>Aucun butin récupéré.</li>";
        combatEndModalEl.classList.remove('hidden'); 
    }
    closeCombatModalBtn.disabled = false; toggleSpeedBtn.disabled = false;
};


// --- Boucle de Jeu Principale ---
function gameLoop() { 
    if (gameState.capacity.energy >= gameState.resources.energy) { gameState.resources.biomass += gameState.productionRates.biomass * (TICK_SPEED / 1000); gameState.resources.nanites += gameState.productionRates.nanites * (TICK_SPEED / 1000); } 
    if (activeResearch) { const research = researchData[activeResearch.id]; if (gameState.gameTime - activeResearch.startTime >= activeResearch.totalTime) { gameState.research[activeResearch.id] = true; addLogEntry(`Technologie ${research.name} acquise!`, "success"); if (research.grantsModule || research.grantsStatBoost) calculateNanobotStats(); activeResearch = null; } } 
    if (gameState.nightAssault.isActive && !gameState.isDay) { processNightAssaultTick(); }
    updateGameTimeAndCycle(); updateDisplays(); saveGame(); 
}

// --- Initialisation et Tabs ---
function initDOMReferences() {
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
}

function init() {
    initDOMReferences(); 

    if (!gameState.inventory) gameState.inventory = [];
    if (!gameState.nanobotEquipment) gameState.nanobotEquipment = { weapon: null, armor: null, utility1: null, utility2: null };
    if (!gameState.shopStock) gameState.shopStock = ['item_laser_mk1', 'item_plating_basic', 'item_repair_kit_s'];
    if (!gameState.nanobotStats.level) { gameState.nanobotStats.level = 1; gameState.nanobotStats.xp = 0; gameState.nanobotStats.xpToNext = 100; }
    if (!gameState.baseStats) gameState.baseStats = { currentHealth: BASE_INITIAL_HEALTH, maxHealth: BASE_INITIAL_HEALTH, defensePower: 0 };
    if (!gameState.defenses) gameState.defenses = {};
    if (!gameState.nightAssault) gameState.nightAssault = { isActive: false, wave: 0, enemies: [], lastAttackTime: 0, log: ["Journal d'assaut initialisé."] };
    if (gameState.nanobotStats.isDefendingBase === undefined) gameState.nanobotStats.isDefendingBase = false;
    
    for (const id in buildingsData) if (gameState.buildings[id] === undefined) gameState.buildings[id] = 0;
    loadGame(); 
    if (!gameState.map.tiles || gameState.map.tiles.length === 0) { generateMap(); }
    
    calculateNanobotStats(); calculateBaseStats(); calculateProductionAndConsumption(); 
    updateDisplays(); 
    
    eventLogEl.innerHTML = '<h3 class="font-semibold mb-2 text-gray-300">Journal Principal des Événements :</h3>'; (gameState.eventLog || ["Bienvenue, Nexus-7. Initialisation..."]).forEach(msg => { const e = document.createElement('p'); e.innerHTML = msg; eventLogEl.appendChild(e); }); eventLogEl.scrollTop = eventLogEl.scrollHeight;
    combatLogSummaryEl.innerHTML = '<h4 class="font-semibold mb-1 text-gray-300">Résumé Combat :</h4>'; (gameState.combatLogSummary || ["Journal de combat initialisé."]).forEach(msg => { const e = document.createElement('p'); e.innerHTML = msg; combatLogSummaryEl.appendChild(e); }); combatLogSummaryEl.scrollTop = combatLogSummaryEl.scrollHeight;
    
    nightAssaultLogEl.innerHTML = "";
    (gameState.nightAssault.log || ["Journal d'assaut initialisé."]).forEach(msg => { 
        const entry = document.createElement('p'); 
        if (msg.includes("subit") || msg.includes("ALERTE CRITIQUE") || msg.includes("détruit")) entry.classList.add("text-red-400");
        else if (msg.includes("neutralisent") || msg.includes("intercepte") || msg.includes("Défenses")) entry.classList.add("text-teal-300");
        else if (msg.includes("Récupéré") || msg.includes("survivée")) entry.classList.add("text-green-400");
        else if (msg.includes("approche") || msg.includes("Vague")) entry.classList.add("text-orange-300");
        else entry.classList.add("text-gray-400");
        entry.innerHTML = msg; 
        nightAssaultLogEl.appendChild(entry); 
    }); 
    if (gameState.nightAssault.log.length === 0 || (gameState.nightAssault.log.length === 1 && gameState.nightAssault.log[0].includes("initialisé"))) { nightAssaultLogEl.innerHTML = '<p class="text-gray-500 italic">En attente d\'événements...</p>'; }
    nightAssaultLogEl.scrollTop = nightAssaultLogEl.scrollHeight;

    let tabs = [ { btn: tabOverview, content: overviewContentElTab }, { btn: tabResearch, content: researchContentEl }, { btn: tabNanobot, content: nanobotContentEl }, { btn: tabExploration, content: explorationContentEl }, { btn: tabInventory, content: inventoryContentEl }, { btn: tabShop, content: shopContentEl } ];
    tabs.forEach(tabInfo => {
        if (tabInfo.btn) { 
            tabInfo.btn.addEventListener('click', () => {
                tabs.forEach(t => { if(t.content) t.content.classList.add('hidden'); if(t.btn) {t.btn.classList.remove('border-blue-400', 'text-blue-300'); t.btn.classList.add('text-gray-500');} });
                if(tabInfo.content) tabInfo.content.classList.remove('hidden'); 
                if(tabInfo.btn) {tabInfo.btn.classList.add('border-blue-400', 'text-blue-300'); tabInfo.btn.classList.remove('text-gray-500');}
                if (tabInfo.btn === tabExploration) updateExplorationDisplay(); 
                if (tabInfo.btn === tabInventory) updateInventoryDisplay();
                if (tabInfo.btn === tabShop) updateShopDisplay();
                if (tabInfo.btn === tabNanobot) updateEquippedItemsDisplay(); 
            });
        }
    });
    
    modalConfirm.addEventListener('click', () => { if (modalConfirmCallback) modalConfirmCallback(); hideModal(); });
    modalCancel.addEventListener('click', hideModal);
    if(simulateCombatBtn) simulateCombatBtn.addEventListener('click', () => { const testEnemy = { name: "Drone d'Entraînement", health: 40, maxHealth:40, attack: 10, defense: 3, color: '#4299e1' }; simulateCombat(testEnemy); });
    if(closeCombatModalBtn) closeCombatModalBtn.addEventListener('click', () => { combatModalEl.classList.add('hidden'); updateExplorationDisplay(); });
    if(toggleSpeedBtn) toggleSpeedBtn.addEventListener('click', () => { combatSpeedMultiplier = (combatSpeedMultiplier === 1) ? 3 : 1; toggleSpeedBtn.textContent = combatSpeedMultiplier === 1 ? "Vitesse x3" : "Vitesse x1"; COMBAT_ANIMATION_DELAY = COMBAT_ANIMATION_DELAY_BASE / combatSpeedMultiplier; });
    if(closeEndModalBtn) closeEndModalBtn.addEventListener('click', () => { combatEndModalEl.classList.add('hidden'); });
    if(repairBaseBtn) repairBaseBtn.addEventListener('click', () => repairBase(20)); 
    if(repairDefensesBtn) repairDefensesBtn.addEventListener('click', repairAllDefenses);
    if(toggleNanobotDefendBaseBtn) toggleNanobotDefendBaseBtn.addEventListener('click', toggleNanobotDefendBase);

    if(tabOverview) tabOverview.click(); 
    setInterval(gameLoop, TICK_SPEED);
}
        
// --- Sauvegarde / Chargement ---
const SAVE_KEY = 'nexus7GameState_v0.8.0'; 
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
                        if (['resources', 'productionRates', 'capacity', 'buildings', 'research', 'map', 'baseStats', 'defenses', 'nanobotEquipment'].includes(key)) {
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
            if (!gameState.baseStats) gameState.baseStats = { currentHealth: BASE_INITIAL_HEALTH, maxHealth: BASE_INITIAL_HEALTH, defensePower: 0 };
            if (!gameState.defenses) gameState.defenses = {};
            if (!gameState.nightAssault) gameState.nightAssault = { isActive: false, wave: 0, enemies: [], lastAttackTime: 0, log: ["Journal d'assaut initialisé."] };
            else if (!gameState.nightAssault.log) gameState.nightAssault.log = ["Journal d'assaut initialisé."]; 
            if (gameState.nanobotStats.isDefendingBase === undefined) gameState.nanobotStats.isDefendingBase = false;
            if (!gameState.inventory) gameState.inventory = [];
            if (!gameState.nanobotEquipment) gameState.nanobotEquipment = { weapon: null, armor: null, utility1: null, utility2: null };
            if (!gameState.shopStock) gameState.shopStock = ['item_laser_mk1', 'item_plating_basic', 'item_repair_kit_s'];
            if (!gameState.nanobotStats.level) { gameState.nanobotStats.level = 1; gameState.nanobotStats.xp = 0; gameState.nanobotStats.xpToNext = 100; }

            addLogEntry(`Partie chargée (${SAVE_KEY}).`, "info");
        } catch(e) { console.error("Err Chargement: ", e); addLogEntry(`Sauvegarde corrompue (${SAVE_KEY}). Nouvelle partie.`, "error"); localStorage.removeItem(SAVE_KEY); }
    } 
}
window.onload = init;