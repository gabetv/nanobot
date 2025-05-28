// js/craftingUI.js
console.log("craftingUI.js - Fichier chargé.");

var craftingUI = {
    updateCraftingDisplay: function() {
        const craftingContainer = document.getElementById('crafting-content'); // L'ID de la div dans l'onglet Fabrication
        if (!craftingContainer) {
            console.warn("CraftingUI: Conteneur #crafting-content non trouvé.");
            return;
        }
        craftingContainer.innerHTML = ''; // Vider le contenu précédent

        if (typeof window.craftingRecipesData === 'undefined' || Object.keys(window.craftingRecipesData).length === 0) {
            craftingContainer.innerHTML = '<p class="text-gray-500 italic text-sm p-2">Aucune recette de fabrication définie.</p>';
            return;
        }
        if (!window.gameState) {
            craftingContainer.innerHTML = '<p class="text-gray-500 italic text-sm p-2">État du jeu non initialisé.</p>';
            return;
        }

        let recipesDisplayed = 0;
        const recipeGrid = document.createElement('div');
        recipeGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3';


        for (const recipeId in window.craftingRecipesData) {
            const recipe = window.craftingRecipesData[recipeId];
            const canCurrentlyCraft = typeof window.craftingLogic !== 'undefined' ? window.craftingLogic.canCraft(recipeId, window.gameState) : false;
            let isRecipeUnlocked = true; // Par défaut, sauf si condition de déblocage

            // Vérifier les conditions de déblocage
            if (recipe.unlockCondition) {
                if (recipe.unlockCondition.research && (!window.gameState.research || !window.gameState.research[recipe.unlockCondition.research])) {
                    isRecipeUnlocked = false;
                }
                if (isRecipeUnlocked && recipe.unlockCondition.gameplayFlag && (!window.gameState.gameplayFlags || !window.gameState.gameplayFlags[recipe.unlockCondition.gameplayFlag])) {
                    isRecipeUnlocked = false;
                }
            }
            
            if (!isRecipeUnlocked) continue; // Ne pas afficher les recettes non débloquées

            recipesDisplayed++;
            const recipeDiv = document.createElement('div');
            recipeDiv.className = 'panel p-3 rounded-lg shadow-md border border-gray-700 bg-gray-800 bg-opacity-60 flex flex-col';
            recipeDiv.dataset.tooltipType = 'crafting-recipe'; // Pour un futur tooltip détaillé si besoin
            recipeDiv.dataset.tooltipId = recipeId;

            let content = `<h4 class="text-md font-semibold mb-1 text-sky-300">${recipe.name}</h4>`;
            content += `<p class="text-xs text-gray-400 mb-2">${recipe.description}</p>`;
            
            content += `<p class="text-xs font-semibold text-gray-300 mt-1 mb-0.5">Produit:</p>`;
            const outputItem = window.itemsData[recipe.output.itemId];
            content += `<p class="text-xs text-lime-300">- ${outputItem?.name || recipe.output.itemId} (x${recipe.output.quantity || 1})</p>`;

            content += `<p class="text-xs font-semibold text-gray-300 mt-2 mb-0.5">Ingrédients requis:</p>`;
            content += '<ul class="text-xs space-y-0.5 mb-2">';
            recipe.ingredients.forEach(ing => {
                let currentAmount = 0;
                let ingredientName = ing.id;
                let hasEnough = false;

                if (ing.type === "item") {
                    currentAmount = (window.gameState.inventory || []).filter(itemId => itemId === ing.id).length;
                    ingredientName = window.itemsData[ing.id]?.name || ing.id;
                    hasEnough = currentAmount >= ing.quantity;
                } else if (ing.type === "resource") {
                    currentAmount = window.gameState.resources[ing.id] || 0;
                    ingredientName = (window.RESOURCE_TYPES && window.RESOURCE_TYPES[ing.id]?.toLowerCase()) || ing.id.charAt(0).toUpperCase() + ing.id.slice(1);
                    hasEnough = currentAmount >= ing.quantity;
                }
                content += `<li class="${hasEnough ? 'text-green-400' : 'text-red-400'}">- ${ingredientName}: ${currentAmount}/${ing.quantity}</li>`;
            });
            content += '</ul>';

            if (recipe.requiredBuilding) {
                const reqBuilding = window.buildingsData[recipe.requiredBuilding];
                const currentBuildingLevel = window.gameState.buildings[recipe.requiredBuilding] || 0;
                const meetsBuildingReq = currentBuildingLevel >= (recipe.requiredBuildingLevel || 1);
                content += `<p class="text-xs mt-1 ${meetsBuildingReq ? 'text-gray-400' : 'text-red-400'}">Requis: ${reqBuilding?.name || recipe.requiredBuilding} (Niv. ${recipe.requiredBuildingLevel || 1}) - Actuel: Niv. ${currentBuildingLevel}</p>`;
            }
            
            // Instantané pour l'instant, mais on pourrait afficher le temps
            // if (recipe.craftTime) {
            //     content += `<p class="text-xs text-gray-500 mt-1">Temps: ${formatTime(recipe.craftTime)}</p>`;
            // }

            recipeDiv.innerHTML = content;

            const craftButton = document.createElement('button');
            craftButton.className = `btn ${canCurrentlyCraft ? 'btn-success' : 'btn-disabled'} btn-sm mt-auto w-full`;
            craftButton.innerHTML = `<i class="ti ti-hammer mr-1"></i>Fabriquer`;
            if (!canCurrentlyCraft) {
                craftButton.disabled = true;
            }
            craftButton.onclick = () => {
                if (typeof window.craftingLogic !== 'undefined' && typeof window.craftingLogic.attemptCraft === 'function') {
                    window.craftingLogic.attemptCraft(recipeId, window.gameState);
                }
            };
            recipeDiv.appendChild(craftButton);
            recipeGrid.appendChild(recipeDiv);
        }
        
        if (recipesDisplayed === 0) {
            craftingContainer.innerHTML = '<p class="text-gray-500 italic text-sm p-2">Aucune recette de fabrication disponible ou débloquée pour le moment.</p>';
        } else {
            craftingContainer.appendChild(recipeGrid);
        }
    }
};
window.craftingUI = craftingUI;
console.log("craftingUI.js - Objet défini.");