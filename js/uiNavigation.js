// js/uiNavigation.js
console.log("uiNavigation.js - Fichier chargé et en cours d'initialisation des listeners de navigation...");

const uiNavigation = {
    activeMainTab: null,
    activeSubTabs: {}, 
    isReady: false,

    switchMainTab: function(sectionId, forceUpdate = false) {
        // console.log(`[Nav] switchMainTab pour: ${sectionId} Force update: ${forceUpdate}`);
        if (!forceUpdate && this.activeMainTab === sectionId) return;

        if (this.activeMainTab) {
            const oldMainSection = document.getElementById(this.activeMainTab);
            if (oldMainSection) oldMainSection.classList.remove('active');
            const oldNavButton = document.querySelector(`#main-navigation .nav-button[data-section="${this.activeMainTab}"]`);
            if (oldNavButton) oldNavButton.classList.remove('active');
        }

        const newMainSection = document.getElementById(sectionId);
        if (newMainSection) newMainSection.classList.add('active');
        const newNavButton = document.querySelector(`#main-navigation .nav-button[data-section="${sectionId}"]`);
        if (newNavButton) newNavButton.classList.add('active');
        
        this.activeMainTab = sectionId;

        let subTabToActivate = this.activeSubTabs[sectionId];
        if (!subTabToActivate) {
            const firstSubNavButton = document.querySelector(`#${sectionId} .sub-nav-button`);
            if (firstSubNavButton) {
                subTabToActivate = firstSubNavButton.dataset.subtab;
            }
        }

        if (subTabToActivate) {
            this.switchSubTab(subTabToActivate, sectionId, forceUpdate);
        } else {
            this.triggerUIUpdateForSection(sectionId);
        }

        if (sectionId === 'world-section') {
            // console.log("[Nav] Entrée dans l'onglet Monde.");
            if (typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateFullExplorationView === 'function') {
                window.explorationUI.isFirstExplorationViewUpdate = true; // Pour forcer le centrage
                window.explorationUI.updateFullExplorationView();
            }
            // Le centrage de la carte est maintenant géré par updateFullExplorationView via isFirstExplorationViewUpdate
        }
    },

    switchSubTab: function(subTabId, parentSectionId, forceUpdate = false) {
        // console.log(`[Nav] switchSubTab pour: ${subTabId} dans ${parentSectionId} Force update: ${forceUpdate}`);
        if (!forceUpdate && this.activeSubTabs[parentSectionId] === subTabId) return;

        const parentSection = document.getElementById(parentSectionId);
        if (!parentSection) return;

        const currentActiveSubTabId = this.activeSubTabs[parentSectionId];
        if (currentActiveSubTabId) {
            const oldSubContent = parentSection.querySelector(`.sub-content[id="${currentActiveSubTabId}"]`);
            if (oldSubContent) oldSubContent.classList.remove('active');
            const oldSubNavButton = parentSection.querySelector(`.sub-nav-button[data-subtab="${currentActiveSubTabId}"]`);
            if (oldSubNavButton) oldSubNavButton.classList.remove('active');
        }

        const newSubContent = parentSection.querySelector(`.sub-content[id="${subTabId}"]`);
        if (newSubContent) newSubContent.classList.add('active');
        const newSubNavButton = parentSection.querySelector(`.sub-nav-button[data-subtab="${subTabId}"]`);
        if (newSubNavButton) newSubNavButton.classList.add('active');
        
        this.activeSubTabs[parentSectionId] = subTabId;

        this.triggerUIUpdateForSubTab(subTabId, parentSectionId);

        if (parentSectionId === 'world-section' && subTabId === 'exploration-subtab') {
            // console.log("[Nav] Sous-onglet Exploration activé.");
             if (typeof window.explorationUI !== 'undefined' && typeof window.explorationUI.updateFullExplorationView === 'function') {
                window.explorationUI.updateFullExplorationView();
            }
        }
    },

    triggerUIUpdateForSection: function(sectionId) {
        // console.log(`[Nav] triggerUIUpdateForSection: ${sectionId}`);
        if (typeof window.uiUpdates === 'undefined' || typeof window.uiUpdates.updateDisplays !== 'function') {
            console.warn("uiUpdates.updateDisplays non défini.");
            return;
        }
        window.uiUpdates.updateDisplays();
    },

    triggerUIUpdateForSubTab: function(subTabId, parentSectionId) {
        // console.log(`[Nav] triggerUIUpdateForSubTab: ${subTabId} dans ${parentSectionId}`);
        if (typeof window.uiUpdates === 'undefined' || typeof window.uiUpdates.updateDisplays !== 'function') {
            console.warn("uiUpdates.updateDisplays non défini.");
            return;
        }
        window.uiUpdates.updateDisplays();
    },

    setupNavEventListeners: function() {
        const mainNavButtons = document.querySelectorAll('#main-navigation .nav-button');
        mainNavButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchMainTab(button.dataset.section);
            });
        });

        const subNavButtons = document.querySelectorAll('.sub-nav-button');
        subNavButtons.forEach(button => {
            button.addEventListener('click', () => {
                const parentSectionId = button.dataset.parentsection || button.closest('.content-section')?.id;
                if (parentSectionId) {
                    this.switchSubTab(button.dataset.subtab, parentSectionId);
                } else {
                    console.warn("Impossible de déterminer la section parente pour le sous-onglet:", button);
                }
            });
        });

        if (mainNavButtons.length > 0) {
            const initialMainSectionId = mainNavButtons[0].dataset.section;
            this.activeMainTab = initialMainSectionId;
            mainNavButtons[0].classList.add('active');
            const initialMainSectionEl = document.getElementById(initialMainSectionId);
            if (initialMainSectionEl) initialMainSectionEl.classList.add('active');

            const firstSubNavButtonOfInitialSection = document.querySelector(`#${initialMainSectionId} .sub-nav-button`);
            if (firstSubNavButtonOfInitialSection) {
                const initialSubTabId = firstSubNavButtonOfInitialSection.dataset.subtab;
                this.activeSubTabs[initialMainSectionId] = initialSubTabId;
                firstSubNavButtonOfInitialSection.classList.add('active');
                const initialSubContentEl = document.querySelector(`#${initialMainSectionId} .sub-content[id="${initialSubTabId}"]`);
                if (initialSubContentEl) initialSubContentEl.classList.add('active');
            }
        }
        this.isReady = true;
        console.log("uiNavigation.js: Écouteurs et fonctions de navigation prêts (après DOMContentLoaded). isReady = true.");
    },

    forceInitialUIUpdate: function() {
        console.log("[Nav] forceInitialUIUpdate appelée.");
        if (!this.isReady) {
            console.warn("[Nav] Tentative de forcer la MAJ UI avant que la navigation ne soit prête.");
            // Essayer de rappeler après un délai si pas prêt
            setTimeout(() => this.forceInitialUIUpdate(), 100);
            return;
        }
        if (this.activeMainTab && document.getElementById(this.activeMainTab)) { // Vérifier si l'onglet existe
            console.log(`[Nav] Forçage de la mise à jour pour la section active: ${this.activeMainTab}`);
            this.switchMainTab(this.activeMainTab, true);
        } else {
            console.warn("[Nav] Aucun onglet principal actif valide à mettre à jour lors de forceInitialUIUpdate. Tentative sur le premier onglet.");
            const firstMainNavButton = document.querySelector('#main-navigation .nav-button');
            if (firstMainNavButton && firstMainNavButton.dataset.section) {
                this.switchMainTab(firstMainNavButton.dataset.section, true);
            } else {
                console.error("[Nav] Aucun onglet principal trouvé pour la mise à jour initiale.");
            }
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => uiNavigation.setupNavEventListeners());
} else {
    // DOM déjà chargé si on arrive ici après l'événement DOMContentLoaded
    uiNavigation.setupNavEventListeners();
}

// window.uiNavigation = uiNavigation; // Inutile si script classique