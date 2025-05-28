// js/inventoryShop.js
// console.log("inventoryShop.js - Fichier chargé."); // Peut être décommenté pour débogage

// gainXP est maintenant dans gameplayLogic.js et devrait être global (window.gainXP)
// generateLoot est maintenant dans gameplayLogic.js et devrait être global (window.generateLoot)

function addToInventory(itemId) {
    if (!window.itemsData || !window.itemsData[itemId]) { // Vérifier window.itemsData
        console.warn(`Tentative d'ajout d'un objet inconnu à l'inventaire: ${itemId}`);
        return;
    }
    if(!window.gameState.inventory) window.gameState.inventory = [];
    window.gameState.inventory.push(itemId);

    if(typeof updateInventoryDisplay === 'function') updateInventoryDisplay(); // Supposant que c'est global
    else if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();


    if (typeof addLogEntry === 'function' && window.itemsData && window.itemsData[itemId]) { // Vérifier addLogEntry et itemsData
        addLogEntry(`Objet reçu: ${window.itemsData[itemId].name}`, "success", window.eventLogEl, window.gameState.eventLog);
    }
}
window.addToInventory = addToInventory; // Rendre global

function removeFromInventory(itemId) {
    if(!window.gameState.inventory) return false;
    const index = window.gameState.inventory.indexOf(itemId);
    if (index > -1) {
        window.gameState.inventory.splice(index, 1);
        // Pas besoin d'appeler updateInventoryDisplay ici, c'est fait par la fonction appelante si nécessaire
        return true;
    }
    return false;
}
window.removeFromInventory = removeFromInventory;


function updateInventoryDisplay() {
    if (!window.inventoryListEl) { console.warn("inventoryListEl non trouvé."); return; }
    window.inventoryListEl.innerHTML = "";
    if (!window.gameState.inventory || window.gameState.inventory.length === 0) {
        window.inventoryListEl.innerHTML = "<p class='text-gray-500 italic text-xs p-2'>L'inventaire est vide.</p>"; // Ajout padding et text-xs
        return;
    }
    const itemCounts = window.gameState.inventory.reduce((acc, itemId) => { acc[itemId] = (acc[itemId] || 0) + 1; return acc; }, {});

    Object.entries(itemCounts).forEach(([itemId, count]) => {
        if (!window.itemsData) { console.warn("itemsData non défini dans updateInventoryDisplay"); return; }
        const item = window.itemsData[itemId];
        if (!item) { console.warn(`Item ID ${itemId} non trouvé dans itemsData.`); return; }

        const li = document.createElement("li");
        li.className = "inventory-item panel p-2.5 rounded-md shadow border border-gray-700 bg-gray-800 bg-opacity-50"; // Styles améliorés
        li.dataset.tooltipType = 'inventory-item';
        li.dataset.tooltipId = itemId;

        const infoIconContainer = document.createElement('div');
        infoIconContainer.className = 'info-icon-container';
        const infoIcon = document.createElement('i');
        infoIcon.className = 'ti ti-info-circle info-icon text-sky-400 hover:text-sky-300'; // Style icône
        infoIcon.title = `Plus d'infos sur ${item.name}`;
        // Pas besoin d'event.stopPropagation() ici car on attache au body dans main.js
        // infoIcon.onclick = (e) => { showItemInfoModal('inventory-item', itemId, item.name); }; // Géré par le listener global
        infoIconContainer.appendChild(infoIcon);
        li.appendChild(infoIconContainer);

        let content = `<div class="item-details mb-1.5">`; // mb-1.5
        content += `<span class="item-name text-sm font-semibold text-gray-100">${item.name} ${count > 1 ? `<span class="text-xs text-gray-400">(x${count})</span>` : ''}</span>`;
        content += `<p class="item-stats text-xs text-gray-400 mt-0.5">${item.description}</p>`;
        if (item.statBoost) { content += `<p class="item-stats text-xs text-green-300 mt-0.5">Stats: ${Object.entries(item.statBoost).map(([s,v]) => `${(window.STAT_NAMES && window.STAT_NAMES[s] || s.charAt(0).toUpperCase()+s.slice(1))}: ${v > 0 ? '+' : ''}${v}`).join(', ')}</p>`; }
        if (item.damageType && window.DAMAGE_TYPES) { content += `<p class="item-stats text-xs text-cyan-300 mt-0.5">Type Dégât: ${window.DAMAGE_TYPES[item.damageType]?.charAt(0).toUpperCase() + window.DAMAGE_TYPES[item.damageType]?.slice(1) || item.damageType}</p>`;}
        content += `</div>`;
        
        const actionButtonsContainer = document.createElement('div');
        actionButtonsContainer.className = "mt-auto flex gap-x-1.5"; // mt-auto pour pousser en bas, flex pour aligner

        if (item.slot && window.EQUIPMENT_SLOTS && window.EQUIPMENT_SLOTS[item.slot]) { // Vérifier EQUIPMENT_SLOTS
            const equipButton = document.createElement('button');
            equipButton.className = "btn btn-primary btn-xs flex-grow"; // flex-grow
            equipButton.innerHTML = `<i class="ti ti-armor-2-filled mr-1"></i>Équiper`;
            equipButton.onclick = (e) => { /*e.stopPropagation();*/ equipItem(item.id); }; // Le listener global info-icon ne devrait pas être affecté
            actionButtonsContainer.appendChild(equipButton);
        }
        if (item.consumable && typeof item.effects_on_use === 'function') { // Avant c'était item.onUse
            const useButton = document.createElement('button');
            useButton.className = "btn btn-info btn-xs flex-grow";
            useButton.innerHTML = `<i class="ti ti-arrow-capsule mr-1"></i>Utiliser`;
            useButton.onclick = (e) => { /*e.stopPropagation();*/ useConsumableItem(item.id); };
            actionButtonsContainer.appendChild(useButton);
        }
        // Ajouter un bouton Vendre si applicable
        // if (item.value && item.type !== 'quest_item') {
        //     const sellButton = document.createElement('button');
        //     /* ... */
        //     actionButtonsContainer.appendChild(sellButton);
        // }
        
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
    if (!item || !item.consumable || typeof item.effects_on_use !== 'function') { // Changé de onUse à effects_on_use
        if (typeof addLogEntry === 'function') addLogEntry("Cet objet n'est pas un consommable ou ne peut être utilisé.", "warning", window.eventLogEl, window.gameState.eventLog);
        return;
    }
    // La fonction effects_on_use devrait retourner true si l'item a été consommé avec succès
    if (item.effects_on_use(window.gameState)) { // Passer gameState
        const wasRemoved = removeFromInventory(itemId); // removeFromInventory est déjà global
        if (wasRemoved) {
            updateInventoryDisplay(); // Mettre à jour l'affichage
            if (typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateNanobotDisplay === 'function') window.uiUpdates.updateNanobotDisplay(); // Pour les stats
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
        addToInventory(currentEquippedItemId); // addToInventory est global
    }
    window.gameState.nanobotEquipment[item.slot] = itemId;
    removeFromInventory(itemId); // removeFromInventory est global

    if (typeof addLogEntry === 'function') addLogEntry(`${item.name} équipé sur ${window.EQUIPMENT_SLOTS[item.slot]}.`, "success", window.eventLogEl, window.gameState.eventLog);
    
    if(typeof calculateNanobotStats === 'function') calculateNanobotStats(); // Supposé global
    if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();
}
window.equipItem = equipItem;

function unequipItem(slotId) {
    if (!window.itemsData || !window.EQUIPMENT_SLOTS || !window.gameState) { console.error("Dépendances manquantes pour unequipItem."); return; }
    const itemId = window.gameState.nanobotEquipment[slotId];
    if (itemId && window.itemsData[itemId]) {
        const item = window.itemsData[itemId];
        addToInventory(itemId); // addToInventory est global
        window.gameState.nanobotEquipment[slotId] = null;
        if (typeof addLogEntry === 'function') addLogEntry(`${item.name} retiré de ${window.EQUIPMENT_SLOTS[slotId]}.`, "info", window.eventLogEl, window.gameState.eventLog);
        
        if(typeof calculateNanobotStats === 'function') calculateNanobotStats(); // Supposé global
        if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays();
    }
}
window.unequipItem = unequipItem;


function updateShopDisplay() {
    if(!window.shopItemsListEl || !window.itemsData || !window.gameState) { console.warn("Éléments ou données manquants pour updateShopDisplay."); return; }
    window.shopItemsListEl.innerHTML = "";
    let displayedItems = 0;

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

        const itemId = shopEntryObject.itemId;
        const itemCost = shopEntryObject.cost;
        let itemQuantity = shopEntryObject.quantity; // Quantité actuelle en stock
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
        // ... (autres détails de l'item comme stats, type de dégât) ...
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
        window.shopItemsListEl.innerHTML = "<p class='text-gray-500 italic text-xs p-2'>Tous les articles disponibles ont été acquis ou sont épuisés.</p>";
    } else if (currentShopStock.length === 0 && displayedItems === 0) { // Cas où gameState.shopStock est vide dès le début
        window.shopItemsListEl.innerHTML = "<p class='text-gray-500 italic text-xs p-2'>La boutique est actuellement vide de nouveaux arrivages.</p>";
    }
}
window.updateShopDisplay = updateShopDisplay;

function buyItem(itemId, cost, isUniqueItem, shopEntryObjectRef) { // Ajout de shopEntryObjectRef
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
    if (!isUniqueItem && shopEntryObjectRef && shopEntryObjectRef.quantity <= 0) {
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
    } else if (shopEntryObjectRef) { // Pour les items non uniques, décrémenter la quantité dans l'objet de référence
        shopEntryObjectRef.quantity--;
    }
    
    if(typeof window.uiUpdates !== 'undefined') {
        if(typeof window.uiUpdates.updateResourceDisplay === 'function') window.uiUpdates.updateResourceDisplay();
        // updateDisplays va rafraîchir le shop (pour montrer le stock mis à jour ou "Acquis") et l'inventaire
        if(typeof window.uiUpdates.updateDisplays === 'function') window.uiUpdates.updateDisplays(); 
    }
}
window.buyItem = buyItem;