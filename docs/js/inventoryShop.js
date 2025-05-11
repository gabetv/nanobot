// js/inventoryShop.js
// console.log("inventoryShop.js chargé !");

function gainXP(amount) { 
    let stats = gameState.nanobotStats; 
    if (!stats) { console.error("gameState.nanobotStats non défini dans gainXP"); return; }
    if (stats.level === undefined) { stats.level = 1; stats.xp = 0; stats.xpToNext = 100; } 
    stats.xp += amount; 
    while (stats.xp >= stats.xpToNext && stats.xpToNext > 0) { 
        stats.xp -= stats.xpToNext; 
        stats.level++; 
        stats.xpToNext = Math.floor(stats.xpToNext * 1.5); 
        if(stats.xpToNext === 0) stats.xpToNext = Infinity; 
        addLogEntry("Niveau atteint: " + stats.level, "success", combatLogSummaryEl, gameState.combatLogSummary); 
        stats.baseAttack += 2; stats.baseDefense += 1; stats.baseHealth += 10; 
        if(typeof calculateNanobotStats === 'function') calculateNanobotStats(); 
    } 
    if(typeof updateXpBar === 'function') updateXpBar(); 
    if(xpGainEl) xpGainEl.textContent = `+${amount} XP (Niv. ${stats.level})`; 
}

function generateLoot(enemyDetails) { const possibleLootItems = ['comp_av', 'crist_stock', 'mod_proto', 'frag_alien']; let results = []; if (Math.random() < 0.6) { results.push(possibleLootItems[Math.floor(Math.random() * possibleLootItems.length)]); } if (Math.random() < 0.15) { results.push('arte_rare'); } if (Math.random() < 0.05) { results.push('item_laser_mk1'); } if (Math.random() < 0.08) { results.push('item_plating_basic'); } return results; }
function addToInventory(itemId) { if (!itemsData[itemId]) { console.warn(`Tentative d'ajout d'un objet inconnu à l'inventaire: ${itemId}`); return; } if(!gameState.inventory) gameState.inventory = []; gameState.inventory.push(itemId); if(typeof updateInventoryDisplay === 'function') updateInventoryDisplay(); addLogEntry(`Objet reçu: ${itemsData[itemId].name}`, "success"); }
function removeFromInventory(itemId) { if(!gameState.inventory) return false; const index = gameState.inventory.indexOf(itemId); if (index > -1) { gameState.inventory.splice(index, 1); return true; } return false; } 

function updateInventoryDisplay() { 
    if (!inventoryListEl) return; 
    inventoryListEl.innerHTML = ""; 
    if (!gameState.inventory || gameState.inventory.length === 0) { inventoryListEl.innerHTML = "<p class='text-gray-500 italic'>L'inventaire est vide.</p>"; return; } 
    const itemCounts = gameState.inventory.reduce((acc, itemId) => { acc[itemId] = (acc[itemId] || 0) + 1; return acc; }, {}); 
    Object.entries(itemCounts).forEach(([itemId, count]) => { 
        const item = itemsData[itemId]; 
        if (!item) return; 
        const li = document.createElement("li"); 
        li.className = "inventory-item"; 
        let content = `<div class="item-details"><span class="item-name">${item.name} ${count > 1 ? `(x${count})` : ''}</span><p class="item-stats">${item.description}</p>`; 
        if (item.statBoost) { content += `<p class="item-stats">Stats: ${Object.entries(item.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v > 0 ? '+' : ''}${v}`).join(', ')}</p>`; } 
        if (item.damageType) { content += `<p class="item-stats">Type Dégât: ${item.damageType.charAt(0).toUpperCase() + item.damageType.slice(1)}</p>`; }
        content += `</div>`; 
        if (item.slot) { content += `<button class="btn btn-primary btn-sm" onclick="equipItem('${item.id}')">Équiper</button>`; } 
        li.innerHTML = content; 
        inventoryListEl.appendChild(li); 
    }); 
}

function equipItem(itemId) { const item = itemsData[itemId]; if (!item || !item.slot) { addLogEntry("Cet objet ne peut pas être équipé.", "warning"); return; } const currentEquippedItemId = gameState.nanobotEquipment[item.slot]; if (currentEquippedItemId) { addToInventory(currentEquippedItemId); } gameState.nanobotEquipment[item.slot] = itemId; removeFromInventory(itemId); addLogEntry(`${item.name} équipé sur ${EQUIPMENT_SLOTS[item.slot]}.`, "success"); if(typeof calculateNanobotStats === 'function') calculateNanobotStats(); if(typeof updateDisplays === 'function') updateDisplays(); }
function unequipItem(slotId) { const itemId = gameState.nanobotEquipment[slotId]; if (itemId && itemsData[itemId]) { const item = itemsData[itemId]; addToInventory(itemId); gameState.nanobotEquipment[slotId] = null; addLogEntry(`${item.name} retiré de ${EQUIPMENT_SLOTS[slotId]}.`, "info"); if(typeof calculateNanobotStats === 'function') calculateNanobotStats(); if(typeof updateDisplays === 'function') updateDisplays(); } }

function updateShopDisplay() { 
    if(!shopItemsListEl) return;
    shopItemsListEl.innerHTML = ""; 
    let displayedItems = 0;
    if (!gameState.shopStock || gameState.shopStock.length === 0) {
        shopItemsListEl.innerHTML = "<p class='text-gray-500 italic'>La boutique est actuellement vide de nouveaux arrivages.</p>";
        return;
    }
    gameState.shopStock.forEach(itemId => { 
        const item = itemsData[itemId]; 
        if (!item || !item.cost) return; 
        const isPurchased = gameState.purchasedShopItems.includes(itemId);
        const li = document.createElement("div"); 
        li.className = "shop-item panel" + (isPurchased ? " opacity-50" : ""); 
        let costString = Object.entries(item.cost).map(([res, val]) => `${val} ${res.charAt(0).toUpperCase() + res.slice(1)}`).join(', '); 
        let canAfford = true; 
        if (!isPurchased) { for (const resource in item.cost) { if ((gameState.resources[resource]||0) < item.cost[resource]) { canAfford = false; break; } } }
        let content = `<div class="item-details"><h4 class="item-name text-lg ${isPurchased ? 'text-gray-500' : 'text-blue-300'}">${item.name} ${isPurchased ? '(Acquis)' : ''}</h4><p class="item-stats text-sm text-gray-400">${item.description}</p>`; 
        if (item.statBoost) { content += `<p class="item-stats text-sm ${isPurchased ? 'text-gray-500' : 'text-green-300'}">Effets: ${Object.entries(item.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v > 0 ? '+' : ''}${v}`).join(', ')}</p>`; } 
        if (item.damageType) { content += `<p class="item-stats text-sm ${isPurchased ? 'text-gray-500' : 'text-teal-300'}">Type Dégât: ${item.damageType.charAt(0).toUpperCase() + item.damageType.slice(1)}</p>`;}
        content += `<p class="text-sm ${isPurchased ? 'text-gray-500' : 'text-yellow-400'} mt-1">Coût: ${costString}</p></div>`; 
        if (!isPurchased) { content += `<button class="btn ${canAfford ? 'btn-success' : 'btn-disabled'} btn-sm mt-2" onclick="buyItem('${item.id}')" ${!canAfford ? 'disabled' : ''}>Acheter</button>`; } 
        else { content += `<button class="btn btn-disabled btn-sm mt-2" disabled>Déjà Acquis</button>`; }
        li.innerHTML = content; 
        shopItemsListEl.appendChild(li); 
        displayedItems++;
    });
    if(displayedItems === 0 && shopItemsListEl.innerHTML === "" && gameState.shopStock.length > 0){ shopItemsListEl.innerHTML = "<p class='text-gray-500 italic'>Tous les articles disponibles ont été acquis.</p>"; } 
    else if (gameState.shopStock.length === 0 && displayedItems === 0) { shopItemsListEl.innerHTML = "<p class='text-gray-500 italic'>La boutique est actuellement vide de nouveaux arrivages.</p>"; }
}

function buyItem(itemId) { 
    const item = itemsData[itemId]; 
    if (!item || !item.cost) { addLogEntry("Objet non disponible à l'achat.", "error"); return; }
    if (gameState.purchasedShopItems.includes(itemId)) { addLogEntry(`${item.name} a déjà été acquis.`, "info"); return; }
    for (const resource in item.cost) { if ((gameState.resources[resource]||0) < item.cost[resource]) { addLogEntry(`Ressources insuffisantes pour acheter ${item.name}.`, "error"); return; } } 
    for (const resource in item.cost) { gameState.resources[resource] -= item.cost[resource]; } 
    addToInventory(itemId); 
    addLogEntry(`${item.name} acheté !`, "success");
    if (gameState.shopStock.includes(itemId)) { gameState.purchasedShopItems.push(itemId); }
    updateResourceDisplay(); 
    updateShopDisplay(); 
}