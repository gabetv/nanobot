// js/craftingLogic.js
console.log("craftingLogic.js - Fichier chargé.");

var craftingLogic = {

    canCraft: function(recipeId, gs = window.gameState) {
        if (!gs || typeof window.craftingRecipesData === 'undefined' || !window.craftingRecipesData[recipeId]) {
            console.warn(`canCraft: gameState ou recette ${recipeId} non trouvée.`);
            return false;
        }
        const recipe = window.craftingRecipesData[recipeId];

        if (recipe.unlockCondition) {
            if (recipe.unlockCondition.research && (!gs.research || !gs.research[recipe.unlockCondition.research])) {
                return false;
            }
            if (recipe.unlockCondition.gameplayFlag && (!gs.gameplayFlags || !gs.gameplayFlags[recipe.unlockCondition.gameplayFlag])) {
                return false;
            }
        }

        if (recipe.requiredBuilding) {
            if (!gs.buildings || (gs.buildings[recipe.requiredBuilding] || 0) < (recipe.requiredBuildingLevel || 1)) {
                return false;
            }
        }

        for (const ingredient of recipe.ingredients) {
            if (ingredient.type === "item") {
                const countInInventory = (gs.inventory || []).filter(itemId => itemId === ingredient.id).length;
                if (countInInventory < ingredient.quantity) {
                    return false;
                }
            } else if (ingredient.type === "resource") {
                if ((gs.resources[ingredient.id] || 0) < ingredient.quantity) {
                    // Spécial pour l'énergie : elle n'est pas "consommée" directement des ressources globales pour le craft (sauf si explicitement indiqué)
                    // Mais ici on vérifie si on A assez d'énergie si c'est un ingrédient de type "resource"
                    // Le coût en énergie de fonctionnement du bâtiment est géré ailleurs.
                    return false;
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

        for (const ingredient of recipe.ingredients) {
            if (ingredient.type === "item") {
                for (let i = 0; i < ingredient.quantity; i++) {
                    if(typeof removeFromInventory === 'function') removeFromInventory(ingredient.id);
                }
            } else if (ingredient.type === "resource") {
                // Ne pas déduire l'énergie ici si elle représente une "capacité" ou un "coût de fonctionnement"
                // Déduire seulement si c'est listé comme un ingrédient ressource à consommer.
                 if (gs.resources[ingredient.id] !== undefined) { // Vérifie que la ressource existe dans gs.resources
                    gs.resources[ingredient.id] -= ingredient.quantity;
                } else {
                    console.warn(`Tentative de déduction d'une ressource inconnue '${ingredient.id}' de gs.resources.`);
                }
            }
        }

        if(typeof addToInventory === 'function') {
            for (let i = 0; i < (recipe.output.quantity || 1); i++) {
                addToInventory(recipe.output.itemId);
            }
        }

        if(typeof addLogEntry === 'function') addLogEntry(`${recipe.name} fabriqué avec succès !`, "success", window.eventLogEl, gs.eventLog);
        
        if(typeof window.uiUpdates !== 'undefined' && typeof window.uiUpdates.updateResourceDisplay === 'function') window.uiUpdates.updateResourceDisplay();
        if(typeof updateInventoryDisplay === 'function') updateInventoryDisplay();
        if(typeof window.craftingUI !== 'undefined' && typeof window.craftingUI.updateCraftingDisplay === 'function') window.craftingUI.updateCraftingDisplay();
        
        return true;
    }
};
window.craftingLogic = craftingLogic;
console.log("craftingLogic.js - Objet défini.");