// js/inventoryShop.js
// console.log("inventoryShop.js - Fichier chargé.");

function gainXP(amount) { /* ... (identique) ... */ 
    let stats = gameState.nanobotStats; 
    if (!stats) { console.error("gameState.nanobotStats non défini dans gainXP"); return; }
    if (stats.level === undefined) { stats.level = 1; stats.xp = 0; stats.xpToNext = 100; } 
    stats.xp += amount; 
    while (stats.xpToNext > 0 && stats.xp >= stats.xpToNext) { 
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
function generateLoot(enemyDetails) { /* ... (identique) ... */ const possibleLootItems = ['comp_av', 'crist_stock', 'mod_proto', 'frag_alien']; let results = []; if (Math.random() < 0.6) { results.push(possibleLootItems[Math.floor(Math.random() * possibleLootItems.length)]); } if (Math.random() < 0.15) { results.push('arte_rare'); } if (Math.random() < 0.05) { results.push('item_laser_mk1'); } if (Math.random() < 0.08) { results.push('item_plating_basic'); } return results; }
function addToInventory(itemId) { /* ... (identique) ... */ if (!itemsData[itemId]) { console.warn(`Tentative d'ajout d'un objet inconnu à l'inventaire: ${itemId}`); return; } if(!gameState.inventory) gameState.inventory = []; gameState.inventory.push(itemId); if(typeof updateInventoryDisplay === 'function') updateInventoryDisplay(); addLogEntry(`Objet reçu: ${itemsData[itemId].name}`, "success"); }
function removeFromInventory(itemId) { /* ... (identique) ... */ if(!gameState.inventory) return false; const index = gameState.inventory.indexOf(itemId); if (index > -1) { gameState.inventory.splice(index, 1); return true; } return false; } 
function updateInventoryDisplay() { /* ... (identique, avec data-tooltip-type/id) ... */ 
    if (!inventoryListEl) return; inventoryListEl.innerHTML = ""; 
    if (!gameState.inventory || gameState.inventory.length === 0) { inventoryListEl.innerHTML = "<p class='text-gray-500 italic'>L'inventaire est vide.</p>"; return; } 
    const itemCounts = gameState.inventory.reduce((acc, itemId) => { acc[itemId] = (acc[itemId] || 0) + 1; return acc; }, {}); 
    Object.entries(itemCounts).forEach(([itemId, count]) => { 
        const item = itemsData[itemId]; if (!item) return; 
        const li = document.createElement("li"); li.className = "inventory-item panel p-3"; 
        li.dataset.tooltipType = 'inventory-item'; li.dataset.tooltipId = itemId;
        let content = `<div class="item-details"><span class="item-name">${item.name} ${count > 1 ? `(x${count})` : ''}</span><p class="item-stats">${item.description}</p>`; 
        if (item.statBoost) { content += `<p class="item-stats">Stats: ${Object.entries(item.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v > 0 ? '+' : ''}${v}`).join(', ')}</p>`; } 
        if (item.damageType) { content += `<p class="item-stats">Type Dégât: ${item.damageType.charAt(0).toUpperCase() + item.damageType.slice(1)}</p>`; }
        content += `</div>`; 
        if (item.slot) { content += `<button class="btn btn-primary btn-sm mt-2" onclick="equipItem('${item.id}')">Équiper</button>`; } 
        else if (item.consumable && typeof item.onUse === 'function') { content += `<button class="btn btn-info btn-sm mt-2" onclick="useConsumableItem('${item.id}', event)">Utiliser</button>`; }
        li.innerHTML = content; inventoryListEl.appendChild(li); 
    }); 
}
function useConsumableItem(itemId, event) { /* ... (identique) ... */ 
    if (event) event.stopPropagation(); 
    const item = itemsData[itemId]; if (!item || !item.consumable || typeof item.onUse !== 'function') { addLogEntry("Cet objet n'est pas un consommable ou ne peut être utilisé.", "warning"); return; }
    if (item.onUse(gameState)) { const wasRemoved = removeFromInventory(itemId); if (wasRemoved) updateInventoryDisplay(); else addLogEntry(`Erreur lors de la suppression de ${item.name} de l'inventaire après consommation.`, "error"); }
}
function equipItem(itemId) { /* ... (identique) ... */ const item = itemsData[itemId]; if (!item || !item.slot) { addLogEntry("Cet objet ne peut pas être équipé.", "warning"); return; } const currentEquippedItemId = gameState.nanobotEquipment[item.slot]; if (currentEquippedItemId) { addToInventory(currentEquippedItemId); } gameState.nanobotEquipment[item.slot] = itemId; removeFromInventory(itemId); addLogEntry(`${item.name} équipé sur ${EQUIPMENT_SLOTS[item.slot]}.`, "success"); if(typeof calculateNanobotStats === 'function') calculateNanobotStats(); if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays(); }
function unequipItem(slotId) { /* ... (identique) ... */ const itemId = gameState.nanobotEquipment[slotId]; if (itemId && itemsData[itemId]) { const item = itemsData[itemId]; addToInventory(itemId); gameState.nanobotEquipment[slotId] = null; addLogEntry(`${item.name} retiré de ${EQUIPMENT_SLOTS[slotId]}.`, "info"); if(typeof calculateNanobotStats === 'function') calculateNanobotStats(); if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateDisplays === 'function') uiUpdates.updateDisplays(); } }
function updateShopDisplay() { /* ... (identique, avec data-tooltip-type/id et listeners sur bouton) ... */ 
    if(!shopItemsListEl) return; shopItemsListEl.innerHTML = ""; let displayedItems = 0;
    if (!gameState.shopStock || gameState.shopStock.length === 0) { shopItemsListEl.innerHTML = "<p class='text-gray-500 italic'>La boutique est actuellement vide de nouveaux arrivages.</p>"; return; }
    gameState.shopStock.forEach(itemId => { 
        const item = itemsData[itemId]; if (!item || !item.cost) return; 
        const isPurchased = gameState.purchasedShopItems.includes(itemId);
        const shopItemDiv = document.createElement("div"); shopItemDiv.className = "shop-item panel" + (isPurchased ? " opacity-50" : ""); 
        shopItemDiv.dataset.tooltipType = 'shop-item'; shopItemDiv.dataset.tooltipId = itemId;
        let canAfford = true; if (!isPurchased) { for (const resource in item.cost) { if ((gameState.resources[resource]||0) < item.cost[resource]) { canAfford = false; break; } } }
        let content = `<div class="item-details"><h4 class="item-name text-lg ${isPurchased ? 'text-gray-500' : 'text-blue-300'}">${item.name} ${isPurchased ? '(Acquis)' : ''}</h4><p class="item-stats text-sm text-gray-400">${item.description}</p>`; 
        if (item.statBoost) { content += `<p class="item-stats text-sm ${isPurchased ? 'text-gray-500' : 'text-green-300'}">Effets: ${Object.entries(item.statBoost).map(([s,v]) => `${s.charAt(0).toUpperCase()+s.slice(1)}: ${v > 0 ? '+' : ''}${v}`).join(', ')}</p>`; } 
        if (item.damageType) { content += `<p class="item-stats text-sm ${isPurchased ? 'text-gray-500' : 'text-teal-300'}">Type Dégât: ${item.damageType.charAt(0).toUpperCase() + item.damageType.slice(1)}</p>`;}
        content += `</div>`; shopItemDiv.innerHTML = content; 
        const buyButton = document.createElement('button'); buyButton.className = `btn btn-sm mt-2`;
        if (!isPurchased) { 
            buyButton.classList.add(canAfford ? 'btn-success' : 'btn-disabled'); if (!canAfford) buyButton.disabled = true;
            buyButton.onclick = () => buyItem(itemId);
            let buttonHtmlContent = `Acheter (`;
            buttonHtmlContent += Object.entries(item.cost).map(([res, val]) => { const resourceName = (typeof itemsData !== 'undefined' && itemsData[res]) ? itemsData[res].name : res.charAt(0).toUpperCase() + res.slice(1); return `<span class="cost-part" data-resource-id="${res}" data-required-amount="${val}">${val} ${resourceName}</span>`; }).join(', ');
            buttonHtmlContent += `)`; buyButton.innerHTML = buttonHtmlContent;
            if (typeof highlightInsufficientCosts === 'function' && typeof clearCostHighlights === 'function') { buyButton.addEventListener('mouseover', () => highlightInsufficientCosts(buyButton, item.cost)); buyButton.addEventListener('mouseout', () => clearCostHighlights(buyButton)); }
        } else { buyButton.classList.add('btn-disabled'); buyButton.disabled = true; buyButton.textContent = 'Déjà Acquis'; }
        shopItemDiv.appendChild(buyButton); shopItemsListEl.appendChild(shopItemDiv); displayedItems++;
    });
    if(displayedItems === 0 && shopItemsListEl.innerHTML === "" && gameState.shopStock.length > 0){ shopItemsListEl.innerHTML = "<p class='text-gray-500 italic'>Tous les articles disponibles ont été acquis.</p>"; } 
    else if (gameState.shopStock.length === 0 && displayedItems === 0) { shopItemsListEl.innerHTML = "<p class='text-gray-500 italic'>La boutique est actuellement vide de nouveaux arrivages.</p>"; }
}
function buyItem(itemId) { /* ... (identique) ... */ 
    const item = itemsData[itemId]; if (!item || !item.cost) { addLogEntry("Objet non disponible à l'achat.", "error"); return; }
    if (gameState.purchasedShopItems.includes(itemId)) { addLogEntry(`${item.name} a déjà été acquis.`, "info"); return; }
    for (const resource in item.cost) { if ((gameState.resources[resource]||0) < item.cost[resource]) { addLogEntry(`Ressources insuffisantes pour acheter ${item.name}.`, "error"); return; } } 
    for (const resource in item.cost) { gameState.resources[resource] -= item.cost[resource]; } 
    addToInventory(itemId); addLogEntry(`${item.name} acheté !`, "success");
    if (gameState.shopStock.includes(itemId)) { gameState.purchasedShopItems.push(itemId); }
    if(typeof uiUpdates !== 'undefined' && typeof uiUpdates.updateResourceDisplay === 'function') uiUpdates.updateResourceDisplay(); 
    if(typeof updateShopDisplay === 'function') updateShopDisplay(); 
}