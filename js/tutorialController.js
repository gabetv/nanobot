// js/tutorialController.js
console.log("tutorialController.js - Fichier chargé.");

var tutorialController = {
    isActive: false,
    currentStep: 0,
    highlightedElement: null,
    originalOutline: '',
    originalZIndex: '',
    originalOutlineOffset: '', // Pour stocker l'outline-offset original

    steps: [
        {
            elementId: null, // Pas d'élément spécifique pour le message de bienvenue
            title: "Bienvenue au Nexus-7 !",
            text: "Ce bref tutoriel vous guidera à travers les bases. Vous pouvez le passer à tout moment.",
            position: 'center',
        },
        {
            elementId: 'persistent-header',
            title: "Ressources et Statut",
            text: "En haut, vous trouverez vos ressources principales (Biomasse, Nanites, Énergie), leur taux de production, ainsi que la santé de votre Noyau et le cycle jour/nuit actuel.",
            highlightPadding: '5px', // Padding pour l'outline
            position: 'bottom-center',
        },
        {
            elementId: 'main-navigation',
            title: "Navigation Principale",
            text: "Utilisez ces boutons pour naviguer entre les différentes sections du jeu : Base, Nexus-7 (votre unité), Monde et Marché.",
            highlightPadding: '5px',
            position: 'top-center', // Positionner la modale au-dessus de la barre de nav sur desktop
                                    // Pour mobile, 'bottom-center' serait mieux si la nav est en bas, ou 'center'
        },
        {
            targetTab: { main: 'base-section', sub: 'engineering-subtab' },
            elementId: 'buildings-section', // Surligner toute la section des bâtiments
            title: "Ingénierie (Base)",
            text: "Ici, vous pouvez construire et améliorer des bâtiments qui produisent des ressources, débloquent des technologies ou défendent votre base.",
            highlightPadding: '10px',
            position: 'right-center', // À droite de la section des bâtiments
        },
        {
            targetTab: { main: 'nexus-section', sub: 'nanobot-config-subtab' },
            elementId: 'nanobot-content', // Le conteneur de la config du nanobot
            title: "Configuration du Nexus-7",
            text: "Consultez les statistiques de votre Nanobot, améliorez ses modules et équipez des objets trouvés ou achetés.",
            highlightPadding: '10px',
            position: 'center',
        },
        {
            targetTab: { main: 'world-section', sub: 'exploration-subtab' },
            elementId: 'exploration-map-container', // Le conteneur de la carte
            title: "Exploration du Monde",
            text: "Cliquez sur les cases adjacentes à votre Nanobot (♦) pour explorer, collecter des ressources et découvrir des points d'intérêt. L'exploration coûte de l'énergie.",
            highlightPadding: '10px',
            position: 'center',
        },
        {
            elementId: 'event-log',
            title: "Journal des Événements",
            text: "Le journal principal affiche les événements importants, les alertes et les récompenses.",
            highlightPadding: '5px',
            position: 'top-center',
        },
        {
            elementId: null,
            title: "Fin du Tutoriel",
            text: "Vous avez terminé les bases ! Explorez, construisez et survivez. Bonne chance, Commandant !",
            position: 'center',
        }
    ],

    checkAndOfferTutorial: function() {
        if (gameState && !gameState.tutorialCompleted) {
            showModal(
                "Tutoriel de Prise en Main",
                "Bienvenue ! Souhaitez-vous suivre un bref tutoriel pour apprendre les bases du jeu ?",
                () => { // onConfirm
                    this.startTutorial();
                },
                true, // showCancel
                () => { // onCancel (ou si le joueur ferme la modale autrement)
                    // Optionnel: Marquer comme "refusé une fois" pour ne pas redemander à chaque session
                    // Pour l'instant, on ne fait rien, il sera reproposé au prochain chargement si non complété.
                }
            );
        }
    },

    startTutorial: function() {
        if (this.isActive) return;
        console.log("Tutoriel démarré.");
        this.isActive = true;
        this.currentStep = 0;
        this.showStep();
    },

    nextStep: function() {
        if (!this.isActive) return;
        this.clearHighlight();
        this.currentStep++;
        if (this.currentStep < this.steps.length) {
            this.showStep();
        } else {
            this.endTutorial(true); // true = complété
        }
    },

    prevStep: function() {
        if (!this.isActive || this.currentStep === 0) return;
        this.clearHighlight();
        this.currentStep--;
        this.showStep();
    },

    showStep: function() {
        if (!this.isActive) return;
        const step = this.steps[this.currentStep];
        if (!step) {
            this.endTutorial(false); // Devrait pas arriver si la logique de nextStep est correcte
            return;
        }

        if (step.targetTab) {
            // Logique pour s'assurer que les fonctions de navigation sont prêtes
            const attemptSwitchTab = (retries = 5) => {
                if (typeof switchMainTab === 'function' && typeof switchSubTab === 'function') {
                    const mainTabButton = document.querySelector(`#main-navigation .nav-button[data-section="${step.targetTab.main}"]`);
                    if (mainTabButton) mainTabButton.click();

                    if (step.targetTab.sub) {
                        // Attendre un peu que la section principale soit rendue avant de cliquer sur le sous-onglet
                        setTimeout(() => {
                            const subTabButton = document.querySelector(`#${step.targetTab.main} .sub-nav-button[data-subtab="${step.targetTab.sub}"]`);
                            if (subTabButton) {
                                subTabButton.click();
                                // Encore un petit délai pour s'assurer que le contenu du sous-onglet est là avant de surligner
                                setTimeout(() => this.applyHighlightAndModal(step), 150);
                            } else {
                                console.warn(`Sous-onglet ${step.targetTab.sub} non trouvé pour le tutoriel.`);
                                this.applyHighlightAndModal(step); // Surligner même si le sous-onglet n'est pas trouvé
                            }
                        }, 100);
                    } else {
                        setTimeout(() => this.applyHighlightAndModal(step), 50); // Délai pour le rendu de l'onglet principal
                    }
                } else {
                    console.warn("Fonctions switchMainTab ou switchSubTab non disponibles.");
                    this.applyHighlightAndModal(step); // Continuer sans changer d'onglet
                }
            };
            attemptSwitchTab();
        } else {
             this.applyHighlightAndModal(step);
        }
    },
    
    applyHighlightAndModal: function(step) {
        this.clearHighlight(); // Assurer qu'il n'y a pas de surlignage précédent

        if (step.elementId) {
            const element = document.getElementById(step.elementId);
            if (element) {
                this.highlightedElement = element;
                this.originalOutline = element.style.outline;
                this.originalZIndex = element.style.zIndex;
                this.originalOutlineOffset = element.style.outlineOffset;

                element.style.outline = `3px dashed var(--accent-yellow)`;
                element.style.zIndex = '1001'; // Inférieur à la modale du tutoriel
                element.style.position = element.style.position || 'relative'; // Nécessaire pour que z-index s'applique correctement sur les éléments non positionnés
                
                if (step.highlightPadding) {
                     element.style.outlineOffset = step.highlightPadding;
                }
                
                // Faire défiler l'élément dans la vue si nécessaire
                // Mettre un léger délai pour s'assurer que l'élément est bien visible après changement d'onglet
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                }, 50);

            } else {
                console.warn(`Élément du tutoriel non trouvé: ${step.elementId}`);
            }
        }
        // Afficher la modale du tutoriel après avoir potentiellement surligné et scrollé
        this.showTutorialModal(step);
    },

    showTutorialModal: function(step) {
        let tutorialModal = document.getElementById('tutorial-modal');
        if (!tutorialModal) {
            tutorialModal = document.createElement('div');
            tutorialModal.id = 'tutorial-modal';
            tutorialModal.className = 'modal'; // La classe .modal doit avoir position:fixed et z-index:1000 (ou similaire)
            // Le z-index spécifique pour la modale du tutoriel est appliqué ici
            document.body.appendChild(tutorialModal);
        }
        tutorialModal.style.zIndex = '1050'; // Assure qu'il est au-dessus de l'highlight (1001) et des autres modales

        // Appliquer les classes Tailwind pour le style
        let contentHtml = `<div class="modal-content bg-[var(--bg-tertiary)] border-2 border-[var(--accent-yellow)] shadow-xl p-4 rounded-lg" style="max-width: 400px; text-align: left; position: relative;">`;
        contentHtml += `<h3 class="font-orbitron text-lg mb-2 text-[var(--accent-yellow)]">${step.title}</h3>`;
        contentHtml += `<p class="mb-3 text-sm text-gray-200">${step.text}</p>`;
        contentHtml += `<p class="text-xs text-gray-400 mb-3">Étape ${this.currentStep + 1} / ${this.steps.length}</p>`;
        contentHtml += `<div class="flex justify-between items-center mt-4">`; // mt-4 pour espacer les boutons
        contentHtml += `<div>`;
        if (this.currentStep > 0) {
            contentHtml += `<button id="tutorial-prev" class="btn btn-secondary btn-sm mr-2">Précédent</button>`;
        }
        if (this.currentStep < this.steps.length - 1) {
            contentHtml += `<button id="tutorial-next" class="btn btn-primary btn-sm">Suivant</button>`;
        } else {
            contentHtml += `<button id="tutorial-finish" class="btn btn-success btn-sm">Terminer</button>`;
        }
        contentHtml += `</div>`;
        contentHtml += `<button id="tutorial-skip" class="btn btn-danger btn-sm">Passer le Tutoriel</button>`;
        contentHtml += `</div></div>`;

        tutorialModal.innerHTML = contentHtml;
        tutorialModal.classList.remove('hidden'); // Important pour afficher

        const modalContentElement = tutorialModal.querySelector('.modal-content');
        const highlightedEl = this.highlightedElement;

        // Positionnement de la modale
        // Utiliser requestAnimationFrame pour obtenir les dimensions après le rendu du DOM
        requestAnimationFrame(() => {
            if (!modalContentElement) return;

            if (highlightedEl && step.position && step.position !== 'center') {
                modalContentElement.style.position = 'fixed'; // Position par rapport au viewport
                const rect = highlightedEl.getBoundingClientRect();
                const modalRect = modalContentElement.getBoundingClientRect();
                let top, left;

                switch (step.position) {
                    case 'bottom-center':
                        top = rect.bottom + 10;
                        left = rect.left + (rect.width / 2) - (modalRect.width / 2);
                        break;
                    case 'top-center':
                        top = rect.top - modalRect.height - 10;
                        left = rect.left + (rect.width / 2) - (modalRect.width / 2);
                        break;
                    case 'right-center':
                        top = rect.top + (rect.height / 2) - (modalRect.height / 2);
                        left = rect.right + 10;
                        break;
                    case 'left-center':
                        top = rect.top + (rect.height / 2) - (modalRect.height / 2);
                        left = rect.left - modalRect.width - 10;
                        break;
                    default: // 'center' ou inconnu
                        modalContentElement.style.position = 'relative'; // Pour centrage dans .modal
                        top = ''; left = '';
                        break;
                }

                if (top !== '' && left !== '') {
                    // Contraindre à la fenêtre
                    left = Math.max(10, Math.min(left, window.innerWidth - modalRect.width - 10));
                    top = Math.max(10, Math.min(top, window.innerHeight - modalRect.height - 10));
                    
                    modalContentElement.style.top = `${top}px`;
                    modalContentElement.style.left = `${left}px`;
                }
            } else {
                // Centrage standard de la modale si pas d'élément ou position 'center'
                modalContentElement.style.position = 'relative';
                modalContentElement.style.top = '';
                modalContentElement.style.left = '';
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
            this.highlightedElement.style.outline = this.originalOutline;
            this.highlightedElement.style.zIndex = this.originalZIndex;
            this.highlightedElement.style.outlineOffset = this.originalOutlineOffset;
            this.highlightedElement.style.position = this.highlightedElement.dataset.originalPosition || ''; // Restaurer la position originale
            delete this.highlightedElement.dataset.originalPosition;
            this.highlightedElement = null;
        }
    },

    hideTutorialModal: function() {
        const tutorialModal = document.getElementById('tutorial-modal');
        if (tutorialModal) {
            tutorialModal.classList.add('hidden');
        }
    },

    endTutorial: function(completed) {
        console.log(`Tutoriel terminé. Complété: ${completed}`);
        this.isActive = false;
        this.clearHighlight();
        this.hideTutorialModal();
        if (gameState) {
            gameState.tutorialCompleted = true;
        }
        if (typeof saveGame === 'function') saveGame();
    }
};

console.log("tutorialController.js - Objet défini.");