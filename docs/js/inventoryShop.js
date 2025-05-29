// js/inventoryShop.js
// console.log("inventoryShop.js - Fichier chargé.");

function addToInventory(itemId) {
    if (!window.itemsData || !window.itemsData[itemId]) {
        console.warn(`Tentative d'ajout d'un objet inconnu à l'inventaire: ${itemId}`);
        return;
    }
    if(!window.gameState.inventory) window.gameState.inventory = [];
    window.gameState.inventory.push(itemId);

    if(typeof updateInventoryDisplay === 'function') updateInventoryDisplay();
    else if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();


    if (typeof addLogEntry === 'function' && window.itemsData && window.itemsData[itemId]) {
        addLogEntry(`Objet reçu: ${window.itemsData[itemId].name}`, "success", window.eventLogEl, window.gameState.eventLog);
    }
}
window.addToInventory = addToInventory;

function removeFromInventory(itemId) {
    if(!window.gameState.inventory) return false;
    const index = window.gameState.inventory.indexOf(itemId);
    if (index > -1) {
        window.gameState.inventory.splice(index, 1);
        return true;
    }
    return false;
}
window.removeFromInventory = removeFromInventory;


function updateInventoryDisplay() {
    if (!window.inventoryListEl) { console.warn("inventoryListEl non trouvé."); return; }
    window.inventoryListEl.innerHTML = "";
    if (!window.gameState.inventory || window.gameState.inventory.length === 0) {
        window.inventoryListEl.innerHTML = "<p class='text-gray-500 italic text-xs p-2'>L'inventaire est vide.</p>";
        return;
    }
    const itemCounts = window.gameState.inventory.reduce((acc, itemId) => { acc[itemId] = (acc[itemId] || 0) + 1; return acc; }, {});

    Object.entries(itemCounts).forEach(([itemId, count]) => {
        if (!window.itemsData) { console.warn("itemsData non défini dans updateInventoryDisplay"); return; }
        const item = window.itemsData[itemId];
        if (!item) { console.warn(`Item ID ${itemId} non trouvé dans itemsData.`); return; }

        const li = document.createElement("li");
        li.className = "inventory-item panel p-2.5 rounded-md shadow border border-gray-700 bg-gray-800 bg-opacity-50";
        li.dataset.tooltipType = 'inventory-item';
        li.dataset.tooltipId = itemId;

        const infoIconContainer = document.createElement('div');
        infoIconContainer.className = 'info-icon-container';
        const infoIcon = document.createElement('i');
        infoIcon.className = 'ti ti-info-circle info-icon text-sky-400 hover:text-sky-300';
        infoIcon.title = `Plus d'infos sur ${item.name}`;
        infoIconContainer.appendChild(infoIcon);
        li.appendChild(infoIconContainer);

        let content = `<div class="item-details mb-1.5">`;
        content += `<span class="item-name text-sm font-semibold text-gray-100">${item.name} ${count > 1 ? `<span class="text-xs text-gray-400">(x${count})</span>` : ''}</span>`;
        content += `<p class="item-stats text-xs text-gray-400 mt-0.5">${item.description}</p>`;
        if (item.statBoost) { content += `<p class="item-stats text-xs text-green-300 mt-0.5">Stats: ${Object.entries(item.statBoost).map(([s,v]) => `${(window.STAT_NAMES && window.STAT_NAMES[s] || s.charAt(0).toUpperCase()+s.slice(1))}: ${v > 0 ? '+' : ''}${v}`).join(', ')}</p>`; }
        if (item.damageType && window.DAMAGE_TYPES) { content += `<p class="item-stats text-xs text-cyan-300 mt-0.5">Type Dégât: ${window.DAMAGE_TYPES[item.damageType]?.charAt(0).toUpperCase() + window.DAMAGE_TYPES[item.damageType]?.slice(1) || item.damageType}</p>`;}
        content += `</div>`;
        
        const actionButtonsContainer = document.createElement('div');
        actionButtonsContainer.className = "mt-auto flex gap-x-1.5";

        if (item.slot && window.EQUIPMENT_SLOTS && window.EQUIPMENT_SLOTS[item.slot]) {
            const equipButton = document.createElement('button');
            equipButton.className = "btn btn-primary btn-xs flex-grow";
            equipButton.innerHTML = `<i class="ti ti-armor-2-filled mr-1"></i>Équiper`;
            equipButton.onclick = (e) => { equipItem(item.id); };
            actionButtonsContainer.appendChild(equipButton);
        }
        if (item.consumable && typeof item.effects_on_use === 'function') {
            const useButton = document.createElement('button');
            useButton.className = "btn btn-info btn-xs flex-grow";
            useButton.innerHTML = `<i class="ti ti-arrow-capsule mr-1"></i>Utiliser`;
            useButton.onclick = (e) => { useConsumableItem(item.id); };
            actionButtonsContainer.appendChild(useButton);
        }
        
        li.insertAdjacentHTML('beforeend', content);
        if (actionButtonsContainer.hasChildNodes()) {
            li.appendChild(actionButtonsContainer);
        }
        window.inventoryListEl.appendChild(li);
    });
}
window.updateInventoryDisplay = updateInventoryDisplay;

function useConsumableItem(itemId) {
    if (!window.itemsData || !window.gameState) { console.error("Dépendances manquantes pour useConsumableItem."); return; }
    const item = window.itemsData[itemId];
    if (!item || !item.consumable || typeof item.effects_on_use !== 'function') {
        if (typeof addLogEntry === 'function') addLogEntry("Cet objet n'est pas un consommable ou ne peut être utilisé.", "warning", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    if (item.effects_on_use(window.gameState)) {
        const wasRemoved = removeFromInventory(itemId);
        if (wasRemoved) {
            updateInventoryDisplay();
            if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateNanobotDisplay === 'function') window.uiUpdates.updateNanobotDisplay();
        } else {
             if (typeof addLogEntry === 'function') addLogEntry(`Erreur lors de la suppression de ${item.name} de l'inventaire après consommation.`, "error", window.eventLogEl, window.gameState.eventLog);
        }
    }
}
window.useConsumableItem = useConsumableItem;

function equipItem(itemId) {
    if (!window.itemsData || !window.EQUIPMENT_SLOTS || !window.gameState) { console.error("Dépendances manquantes pour equipItem."); return; }
    const item = window.itemsData[itemId];
    if (!item || !item.slot || !window.EQUIPMENT_SLOTS[item.slot]) {
        if (typeof addLogEntry === 'function') addLogEntry("Cet objet ne peut pas être équipé ou l'emplacement est invalide.", "warning", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    const currentEquippedItemId = window.gameState.nanobotEquipment[item.slot];
    if (currentEquippedItemId) {
        addToInventory(currentEquippedItemId);
    }
    window.gameState.nanobotEquipment[item.slot] = itemId;
    removeFromInventory(itemId);

    if (typeof addLogEntry === 'function') addLogEntry(`${item.name} équipé sur ${window.EQUIPMENT_SLOTS[item.slot]}.`, "success", window.eventLogEl, window.gameState.eventLog);
    
    if(typeof calculateNanobotStats === 'function') calculateNanobotStats();
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();
}
window.equipItem = equipItem;

function unequipItem(slotId) {
    if (!window.itemsData || !window.EQUIPMENT_SLOTS || !window.gameState) { console.error("Dépendances manquantes pour unequipItem."); return; }
    const itemId = window.gameState.nanobotEquipment[slotId];
    if (itemId && window.itemsData[itemId]) {
        const item = window.itemsData[itemId];
        addToInventory(itemId);
        window.gameState.nanobotEquipment[slotId] = null;
        if (typeof addLogEntry === 'function') addLogEntry(`${item.name} retiré de ${window.EQUIPMENT_SLOTS[slotId]}.`, "info", window.eventLogEl, window.gameState.eventLog);
        
        if(typeof calculateNanobotStats === 'function') calculateNanobotStats();
        if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();
    }
}
window.unequipItem = unequipItem;


function updateShopDisplay() {
    if(!window.shopItemsListEl || !window.itemsData || !window.gameState) { console.warn("Éléments ou données manquants pour updateShopDisplay."); return; }
    window.shopItemsListEl.innerHTML = "";
    let displayedItems = 0;

    // Utiliser gameState.shopStock qui est censé être peuplé par main.js ou loadGame
    const currentShopStock = window.gameState.shopStock || []; 
    if (!Array.isArray(currentShopStock) || currentShopStock.length === 0) {
        window.shopItemsListEl.innerHTML = "<p class='text-gray-500 italic text-xs p-2'>La boutique est actuellement vide de nouveaux arrivages.</p>";
        return;
    }

    currentShopStock.forEach(shopEntryObject => {
        if (typeof shopEntryObject !== 'object' || !shopEntryObject.itemId) {
            console.warn("Format d'entrée de stock de magasin invalide:", shopEntryObject);
            return;
        }
        
        // Vérifier les conditions de déblocage de l'item du magasin
        const shopItemConfigFromGlobal = window.shopInventoryData[shopEntryObject.itemId] || Object.values(window.shopInventoryData).find(val => val.itemId === shopEntryObject.itemId);
        if (shopItemConfigFromGlobal && shopItemConfigFromGlobal.unlockCondition) {
            let conditionMet = true;
            if (shopItemConfigFromGlobal.unlockCondition.research && (!gameState.research || !gameState.research[shopItemConfigFromGlobal.unlockCondition.research])) {
                conditionMet = false;
            }
            // Ajouter d'autres types de conditions de déblocage ici si nécessaire
            if (!conditionMet) return; // Ne pas afficher cet item
        }


        const itemId = shopEntryObject.itemId;
        const itemCost = shopEntryObject.cost;
        let itemQuantity = shopEntryObject.quantity;
        const isUniqueItem = shopEntryObject.isUnique;
        
        const item = window.itemsData[itemId];
        if (!item || !itemCost) { 
            console.warn(`Item ${itemId} ou son coût non trouvé pour le magasin.`);
            return;
        }

        const isPurchasedOrOutOfStock = (isUniqueItem && window.gameState.purchasedShopItems && window.gameState.purchasedShopItems.includes(itemId)) || (!isUniqueItem && itemQuantity <= 0);

        const shopItemDiv = document.createElement("div");
        shopItemDiv.className = `shop-item panel p-3 rounded-md shadow border border-gray-700 bg-gray-800 bg-opacity-50 ${isPurchasedOrOutOfStock ? " opacity-60" : ""}`;
        shopItemDiv.dataset.tooltipType = 'shop-item'; 
        shopItemDiv.dataset.tooltipId = itemId;

        const infoIconContainer = document.createElement('div'); infoIconContainer.className = 'info-icon-container';
        const infoIcon = document.createElement('i'); infoIcon.className = 'ti ti-info-circle info-icon text-sky-400 hover:text-sky-300';
        infoIcon.title = `Plus d'infos sur ${item.name}`;
        infoIconContainer.appendChild(infoIcon); shopItemDiv.appendChild(infoIconContainer);

        let content = `<div class="item-details mb-1.5">`;
        content += `<h4 class="item-name text-md font-semibold ${isPurchasedOrOutOfStock ? 'text-gray-500' : 'text-blue-300'}">${item.name} ${isPurchasedOrOutOfStock ? (isUniqueItem ? '(Acquis)' : '(Épuisé)') : ''}</h4>`;
        content += `<p class="item-stats text-xs text-gray-400 mt-0.5">${item.description}</p>`;
        content += `<p class="item-stats text-xs text-yellow-300 mt-1">Prix: ${getCostString(itemCost, false, false)}</p>`; 
        if (!isUniqueItem && typeof itemQuantity === 'number' && itemQuantity !== Infinity) {
            content += `<p class="text-xs text-gray-500">Stock: ${itemQuantity}</p>`;
        }
        content += `</div>`;
        shopItemDiv.insertAdjacentHTML('beforeend', content);
        
        const buyButton = document.createElement('button');
        buyButton.className = `btn btn-sm mt-auto w-full`; 
        if (!isPurchasedOrOutOfStock) {
            let canAfford = true;
            for (const resource in itemCost) { if ((window.gameState.resources[resource]||0) < itemCost[resource]) { canAfford = false; break; } }
            
            buyButton.classList.add(canAfford ? 'btn-success' : 'btn-disabled');
            if (!canAfford) buyButton.disabled = true;
            // Passer shopEntryObject à buyItem pour qu'il puisse être modifié
            buyButton.onclick = (e) => { buyItem(itemId, itemCost, isUniqueItem, shopEntryObject); }; 
            
            let buttonHtmlContent = `<i class="ti ti-shopping-cart-plus mr-1"></i>Acheter`;
            buyButton.innerHTML = buttonHtmlContent;
            if (typeof highlightInsufficientCosts === 'function' && typeof clearCostHighlights === 'function') {
                buyButton.addEventListener('mouseover', () => highlightInsufficientCosts(buyButton, itemCost));
                buyButton.addEventListener('mouseout', () => clearCostHighlights(buyButton));
            }
        } else {
            buyButton.classList.add('btn-disabled'); buyButton.disabled = true;
            buyButton.textContent = isUniqueItem ? 'Déjà Acquis' : 'Épuisé';
        }
        shopItemDiv.appendChild(buyButton);
        window.shopItemsListEl.appendChild(shopItemDiv);
        displayedItems++;
    });

    if(displayedItems === 0 && window.shopItemsListEl.innerHTML === "" && currentShopStock.length > 0){
        window.shopItemsListEl.innerHTML = "<p class='text-gray-500 italic text-xs p-2'>Tous les articles disponibles ont été acquis, sont épuisés ou leurs conditions ne sont pas remplies.</p>";
    } else if (currentShopStock.length === 0 && displayedItems === 0) {
        window.shopItemsListEl.innerHTML = "<p class='text-gray-500 italic text-xs p-2'>La boutique est actuellement vide de nouveaux arrivages.</p>";
    }
}
window.updateShopDisplay = updateShopDisplay;

function buyItem(itemId, cost, isUniqueItem, shopEntryObjectRef) {
    if (!window.itemsData || !window.gameState) { console.error("Dépendances manquantes pour buyItem."); return; }
    const item = window.itemsData[itemId];
    if (!item || !cost) {
        if (typeof addLogEntry === 'function') addLogEntry("Objet ou coût non disponible à l'achat.", "error", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    if (isUniqueItem && window.gameState.purchasedShopItems && window.gameState.purchasedShopItems.includes(itemId)) {
        if (typeof addLogEntry === 'function') addLogEntry(`${item.name} (unique) a déjà été acquis.`, "info", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    // Vérifier la quantité pour les items non uniques via la référence à l'objet dans gameState.shopStock
    if (!isUniqueItem && shopEntryObjectRef && typeof shopEntryObjectRef.quantity === 'number' && shopEntryObjectRef.quantity <= 0) {
        if (typeof addLogEntry === 'function') addLogEntry(`${item.name} est en rupture de stock.`, "warning", window.eventLogEl, window.gameState.eventLog);
        return;
    }

    for (const resource in cost) {
        if ((window.gameState.resources[resource]||0) < cost[resource]) {
            if (typeof addLogEntry === 'function') addLogEntry(`Ressources insuffisantes pour acheter ${item.name}.`, "error", window.eventLogEl, window.gameState.eventLog);
            return;
        }
    }
    for (const resource in cost) { window.gameState.resources[resource] -= cost[resource]; }
    
    addToInventory(itemId); 
    if (typeof addLogEntry === 'function') addLogEntry(`${item.name} acheté !`, "success", window.eventLogEl, window.gameState.eventLog);

    if (isUniqueItem) {
        if (!window.gameState.purchasedShopItems) window.gameState.purchasedShopItems = [];
        window.gameState.purchasedShopItems.push(itemId);
         // Pour les items uniques, on peut aussi mettre leur quantité à 0 dans shopStock pour qu'ils apparaissent comme "Acquis"
        if (shopEntryObjectRef) shopEntryObjectRef.quantity = 0;
    } else if (shopEntryObjectRef && typeof shopEntryObjectRef.quantity === 'number') {
        shopEntryObjectRef.quantity--; // Décrémenter la quantité dans l'objet de référence
    }
    
    if(typeof window.uiUpdates !== 'undefined') {
        if(typeof window.uiUpdates.updateResourceDisplay === 'function') window.uiUpdates.updateResourceDisplay();
        if(typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays(); 
    }
}
window.buyItem = buyItem;