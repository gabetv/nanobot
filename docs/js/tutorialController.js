// js/tutorialController.js
console.log("tutorialController.js - Fichier chargé.");

var tutorialController = {
    isActive: false,
    currentStepIndex: 0, // Renommé de currentStep pour clarté (index du tableau)
    highlightedElement: null,
    originalStyles: {}, // Pour stocker plusieurs styles originaux si besoin

    // Les étapes du tutoriel devraient être dans config_gameplay.js (tutorialSteps)
    // On va supposer que window.tutorialSteps existe et contient le tableau d'étapes.

    checkAndOfferTutorial: function() {
        if (window.gameState && !window.gameState.tutorialCompleted && typeof window.tutorialSteps !== 'undefined' && Object.keys(window.tutorialSteps).length > 0) {
            if (typeof showModal === 'function') { // Assurez-vous que showModal est global
                showModal(
                    "Tutoriel de Prise en Main",
                    "Bienvenue ! Souhaitez-vous suivre un bref tutoriel pour apprendre les bases du jeu ?",
                    () => { this.startTutorial(); }, // onConfirm
                    true, // showCancelButton
                    () => { console.log("Tutoriel refusé pour cette session."); } // onCancel
                );
            } else {
                console.error("La fonction showModal n'est pas définie globalement.");
            }
        }
    },

    startTutorial: function(stepId = null) { // stepId peut être le premier ID d'étape (ex: 'gameStart')
        if (this.isActive || typeof window.tutorialSteps === 'undefined' || Object.keys(window.tutorialSteps).length === 0) return;
        console.log("Tutoriel démarré.");
        this.isActive = true;
        
        this.stepsArray = Object.values(window.tutorialSteps); // Convertir l'objet en tableau si ce n'est pas déjà fait
        if (!Array.isArray(this.stepsArray) || this.stepsArray.length === 0) {
            console.error("tutorialSteps n'est pas un tableau valide ou est vide.");
            this.isActive = false;
            return;
        }

        if (stepId && window.tutorialSteps[stepId]) {
            this.currentStepIndex = this.stepsArray.findIndex(s => s === window.tutorialSteps[stepId]);
            if (this.currentStepIndex === -1) this.currentStepIndex = 0; // Fallback
        } else {
            this.currentStepIndex = 0;
        }
        
        this.showStep();
    },

    nextStep: function() {
        if (!this.isActive) return;
        this.clearHighlight();
        this.currentStepIndex++;
        if (this.currentStepIndex < this.stepsArray.length) {
            this.showStep();
        } else {
            this.endTutorial(true); // true = complété
        }
    },

    prevStep: function() {
        if (!this.isActive || this.currentStepIndex === 0) return;
        this.clearHighlight();
        this.currentStepIndex--;
        this.showStep();
    },

    showStep: function() {
        if (!this.isActive) return;
        const step = this.stepsArray[this.currentStepIndex];
        if (!step) {
            this.endTutorial(false);
            return;
        }

        // Exécuter onStart si défini
        if (step.onStart && typeof step.onStart === 'function') {
            step.onStart(window.gameState);
        }

        // Gestion du changement d'onglet
        if (step.targetTab) {
            const attemptSwitchTab = () => {
                if (typeof window.uiNavigation !== 'undefined' && typeof window.uiNavigation.switchMainTab === 'function') {
                    window.uiNavigation.switchMainTab(step.targetTab.main, true); // true pour forcer la MAJ et l'activation du sous-onglet
                    if (step.targetTab.sub) {
                         // switchMainTab devrait gérer l'activation du sous-onglet mémorisé ou du premier.
                         // Si on veut forcer un sous-onglet spécifique:
                         setTimeout(() => {
                             window.uiNavigation.switchSubTab(step.targetTab.sub, step.targetTab.main, true);
                             setTimeout(() => this.applyHighlightAndModal(step), 150); // Délai pour le rendu du sous-onglet
                         }, 100);
                    } else {
                        setTimeout(() => this.applyHighlightAndModal(step), 100); // Délai pour le rendu de l'onglet principal
                    }
                } else { // Fallback si uiNavigation n'est pas disponible
                    const mainTabButton = document.querySelector(`#main-navigation .nav-button[data-section="${step.targetTab.main}"]`);
                    if (mainTabButton) mainTabButton.click();
                    if (step.targetTab.sub) {
                        setTimeout(() => {
                            const subTabButton = document.querySelector(`#${step.targetTab.main} .sub-nav-button[data-subtab="${step.targetTab.sub}"]`);
                            if (subTabButton) subTabButton.click();
                            setTimeout(() => this.applyHighlightAndModal(step), 150);
                        }, 100);
                    } else {
                        setTimeout(() => this.applyHighlightAndModal(step), 100);
                    }
                }
            };
            attemptSwitchTab();
        } else {
             this.applyHighlightAndModal(step);
        }
    },
    
    applyHighlightAndModal: function(step) {
        this.clearHighlight();

        if (step.elementId || step.targetElementHighlight) {
            const elementSelector = step.targetElementHighlight || `#${step.elementId}`;
            const element = document.querySelector(elementSelector);
            if (element) {
                this.highlightedElement = element;
                this.originalStyles = {
                    outline: element.style.outline,
                    zIndex: element.style.zIndex,
                    position: element.style.position,
                    outlineOffset: element.style.outlineOffset,
                    boxShadow: element.style.boxShadow // Ajout pour le surlignage par ombre
                };

                element.style.outline = `3px dashed var(--accent-yellow)`;
                element.style.outlineOffset = step.highlightPadding || '2px';
                // element.style.boxShadow = `0 0 0 9999px rgba(0,0,0,0.6), 0 0 15px 5px var(--accent-yellow)`; // Alternative de surlignage
                element.style.position = element.style.position === 'static' || !element.style.position ? 'relative' : element.style.position;
                element.style.zIndex = '1001';
                
                setTimeout(() => { // Délai pour s'assurer que l'élément est bien "dessiné" avant de scroller
                    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                }, 50);

            } else {
                console.warn(`Élément du tutoriel non trouvé: ${elementSelector}`);
            }
        }
        this.showTutorialModal(step);
    },

    showTutorialModal: function(step) {
        let tutorialModal = window.tutorialModalEl; // Utiliser la ref DOM globale
        if (!tutorialModal) {
            console.error("Élément #tutorial-modal non trouvé dans le DOM.");
            return;
        }
        tutorialModal.style.zIndex = '1050'; // Au-dessus du surlignage

        let contentHtml = `<div class="modal-content bg-[var(--bg-secondary)] border-2 border-[var(--accent-yellow)] shadow-xl p-4 rounded-lg" style="max-width: 400px; text-align: left; position: relative;">`; // Couleur de fond modifiée
        contentHtml += `<h3 class="font-orbitron text-lg mb-2 text-[var(--accent-yellow)]">${step.title}</h3>`;
        contentHtml += `<p class="mb-3 text-sm text-gray-200">${step.text}</p>`;
        contentHtml += `<p class="text-xs text-gray-400 mb-3">Étape ${this.currentStepIndex + 1} / ${this.stepsArray.length}</p>`;
        contentHtml += `<div class="flex justify-between items-center mt-4">`;
        contentHtml += `<div>`;
        if (this.currentStepIndex > 0) {
            contentHtml += `<button id="tutorial-prev" class="btn btn-secondary btn-sm mr-2">Précédent</button>`;
        }
        if (this.currentStepIndex < this.stepsArray.length - 1) {
            contentHtml += `<button id="tutorial-next" class="btn btn-primary btn-sm">Suivant</button>`;
        } else {
            contentHtml += `<button id="tutorial-finish" class="btn btn-success btn-sm">Terminer</button>`;
        }
        contentHtml += `</div>`;
        contentHtml += `<button id="tutorial-skip" class="btn btn-danger btn-sm">Passer le Tutoriel</button>`;
        contentHtml += `</div></div>`;

        tutorialModal.innerHTML = contentHtml;
        tutorialModal.classList.remove('hidden');

        const modalContentElement = tutorialModal.querySelector('.modal-content');
        const highlightedEl = this.highlightedElement;

        requestAnimationFrame(() => {
            if (!modalContentElement) return;
            if (highlightedEl && step.position && step.position !== 'center') {
                modalContentElement.style.position = 'fixed';
                const rect = highlightedEl.getBoundingClientRect();
                const modalRect = modalContentElement.getBoundingClientRect();
                let top, left;
                switch (step.position) {
                    case 'bottom-center': top = rect.bottom + 10; left = rect.left + (rect.width / 2) - (modalRect.width / 2); break;
                    case 'top-center': top = rect.top - modalRect.height - 10; left = rect.left + (rect.width / 2) - (modalRect.width / 2); break;
                    case 'right-center': top = rect.top + (rect.height / 2) - (modalRect.height / 2); left = rect.right + 10; break;
                    case 'left-center': top = rect.top + (rect.height / 2) - (modalRect.height / 2); left = rect.left - modalRect.width - 10; break;
                    default: modalContentElement.style.position = 'relative'; top = ''; left = ''; break;
                }
                if (top !== '' && left !== '') {
                    left = Math.max(10, Math.min(left, window.innerWidth - modalRect.width - 10));
                    top = Math.max(10, Math.min(top, window.innerHeight - modalRect.height - 10));
                    modalContentElement.style.top = `${top}px`;
                    modalContentElement.style.left = `${left}px`;
                }
            } else {
                modalContentElement.style.position = 'relative'; modalContentElement.style.top = ''; modalContentElement.style.left = '';
            }
        });

        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');
        const finishBtn = document.getElementById('tutorial-finish');
        const skipBtn = document.getElementById('tutorial-skip');

        if (prevBtn) prevBtn.onclick = () => this.prevStep();
        if (nextBtn) nextBtn.onclick = () => this.nextStep();
        if (finishBtn) finishBtn.onclick = () => this.endTutorial(true);
        if (skipBtn) skipBtn.onclick = () => this.endTutorial(false);
    },

    clearHighlight: function() {
        if (this.highlightedElement) {
            this.highlightedElement.style.outline = this.originalStyles.outline || '';
            this.highlightedElement.style.zIndex = this.originalStyles.zIndex || '';
            this.highlightedElement.style.position = this.originalStyles.position || '';
            this.highlightedElement.style.outlineOffset = this.originalStyles.outlineOffset || '';
            this.highlightedElement.style.boxShadow = this.originalStyles.boxShadow || '';
            this.highlightedElement = null;
            this.originalStyles = {};
        }
    },

    hideTutorialModal: function() {
        if (window.tutorialModalEl) {
            window.tutorialModalEl.classList.add('hidden');
        }
    },

    endTutorial: function(completed) {
        console.log(`Tutoriel terminé. Complété: ${completed}`);
        this.isActive = false;
        this.clearHighlight();
        this.hideTutorialModal();
        if (window.gameState) {
            window.gameState.tutorialCompleted = true; // Marquer comme complété globalement
            // Si vous voulez suivre quelle étape était en cours au moment où le joueur a quitté/passé:
            // window.gameState.tutorialCurrentStepId = completed ? null : this.stepsArray[this.currentStepIndex]?.id;
        }
        if (typeof saveGame === 'function') saveGame();

        // Exécuter onEnd si défini pour la dernière étape (ou l'étape actuelle si on skippe)
        const step = this.stepsArray[this.currentStepIndex];
        if (step && step.onEnd && typeof step.onEnd === 'function') {
            step.onEnd(window.gameState, completed);
        }
    }
};
window.tutorialController = tutorialController; // Rendre global

console.log("tutorialController.js - Objet défini.");