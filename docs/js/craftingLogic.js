// js/craftingLogic.js
console.log("craftingLogic.js - Fichier chargé.");

var craftingLogic = {

    canCraft: function(recipeId, gs = window.gameState) {
        if (!gs || typeof window.craftingRecipesData === 'undefined' || !window.craftingRecipesData[recipeId]) {
            console.warn(`canCraft: gameState ou recette ${recipeId} non trouvée.`);
            return false;
        }
        const recipe = window.craftingRecipesData[recipeId];

        // 1. Vérifier les conditions de déblocage
        if (recipe.unlockCondition) {
            if (recipe.unlockCondition.research && (!gs.research || !gs.research[recipe.unlockCondition.research])) {
                return false; // Recherche non complétée
            }
            if (recipe.unlockCondition.gameplayFlag && (!gs.gameplayFlags || !gs.gameplayFlags[recipe.unlockCondition.gameplayFlag])) {
                return false; // Flag de jeu non actif
            }
            // Ajouter d'autres types de conditions de déblocage ici si besoin
        }

        // 2. Vérifier le bâtiment requis
        if (recipe.requiredBuilding) {
            if (!gs.buildings || (gs.buildings[recipe.requiredBuilding] || 0) < (recipe.requiredBuildingLevel || 1)) {
                return false; // Bâtiment requis non construit ou niveau insuffisant
            }
        }

        // 3. Vérifier les ingrédients
        for (const ingredient of recipe.ingredients) {
            if (ingredient.type === "item") {
                const countInInventory = (gs.inventory || []).filter(itemId => itemId === ingredient.id).length;
                if (countInInventory < ingredient.quantity) {
                    return false; // Pas assez d'items
                }
            } else if (ingredient.type === "resource") {
                if ((gs.resources[ingredient.id] || 0) < ingredient.quantity) {
                    return false; // Pas assez de ressources
                }
            }
        }
        return true;
    },

    attemptCraft: function(recipeId, gs = window.gameState) {
        if (!this.canCraft(recipeId, gs)) {
            if(typeof addLogEntry === 'function') addLogEntry(`Conditions non remplies pour fabriquer ${window.craftingRecipesData[recipeId]?.name || recipeId}.`, "warning", window.eventLogEl, gs.eventLog);
            if(typeof window.craftingUI !== 'undefined' && typeof window.craftingUI.updateCraftingDisplay === 'function') window.craftingUI.updateCraftingDisplay();
            return false;
        }

        const recipe = window.craftingRecipesData[recipeId];

        // Consommer les ingrédients
        for (const ingredient of recipe.ingredients) {
            if (ingredient.type === "item") {
                for (let i = 0; i < ingredient.quantity; i++) {
                    if(typeof removeFromInventory === 'function') removeFromInventory(ingredient.id);
                }
            } else if (ingredient.type === "resource") {
                gs.resources[ingredient.id] -= ingredient.quantity;
            }
        }

        // Ajouter l'output à l'inventaire
        if(typeof addToInventory === 'function') {
            for (let i = 0; i < (recipe.output.quantity || 1); i++) {
                addToInventory(recipe.output.itemId);
            }
        }

        if(typeof addLogEntry === 'function') addLogEntry(`${recipe.name} fabriqué avec succès !`, "success", window.eventLogEl, gs.eventLog);
        
        // Mettre à jour les UI pertinentes
        if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateResourceDisplay === 'function') window.uiUpdates.updateResourceDisplay();
        if(typeof updateInventoryDisplay === 'function') updateInventoryDisplay();
        if(typeof window.craftingUI !== 'undefined' && typeof window.craftingUI.updateCraftingDisplay === 'function') window.craftingUI.updateCraftingDisplay(); // Rafraîchir l'UI de craft
        
        // TODO: Gérer le temps de craft si nécessaire (pour l'instant, c'est instantané)

        return true;
    }
};
window.craftingLogic = craftingLogic;
console.log("craftingLogic.js - Objet défini.");