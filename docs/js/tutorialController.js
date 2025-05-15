// js/tutorialController.js
console.log("tutorialController.js - Fichier chargé.");

var tutorialController = {
    isActive: false,
    currentStep: 0,
    highlightedElement: null,
    originalOutline: '',
    originalZIndex: '',

    steps: [
        {
            elementId: null, // Pas d'élément spécifique pour le message de bienvenue
            title: "Bienvenue au Nexus-7 !",
            text: "Ce bref tutoriel vous guidera à travers les bases. Vous pouvez le passer à tout moment.",
            position: 'center', // Ou une autre valeur pour positionner la modale du tutoriel
        },
        {
            elementId: 'persistent-header', // L'en-tête entier
            title: "Ressources et Statut",
            text: "En haut, vous trouverez vos ressources principales (Biomasse, Nanites, Énergie), leur taux de production, ainsi que la santé de votre Noyau et le cycle jour/nuit actuel.",
            highlightPadding: '5px',
            position: 'bottom-center',
        },
        {
            elementId: 'main-navigation',
            title: "Navigation Principale",
            text: "Utilisez ces boutons pour naviguer entre les différentes sections du jeu : Base, Nexus-7 (votre unité), Monde et Marché.",
            highlightPadding: '5px',
            position: 'top-center',
        },
        {
            targetTab: { main: 'base-section', sub: 'engineering-subtab' }, // Pour forcer l'ouverture de l'onglet
            elementId: 'buildings-section',
            title: "Ingénierie (Base)",
            text: "Ici, vous pouvez construire et améliorer des bâtiments qui produisent des ressources, débloquent des technologies ou défendent votre base.",
            highlightPadding: '10px',
            position: 'center',
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
            elementId: 'exploration-map-container',
            title: "Exploration du Monde",
            text: "Cliquez sur les cases adjacentes à votre Nanobot (♦) pour explorer, collecter des ressources et découvrir des points d'intérêt. L'exploration coûte de l'énergie.",
            highlightPadding: '10px',
            position: 'center',
        },
        {
            elementId: 'event-log', // Assurez-vous que cet ID existe
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
                true // showCancel
            );
            // Si le joueur refuse, on ne marque pas tutorialCompleted pour qu'il soit reproposé plus tard
            // Ou alors, on pourrait ajouter un bouton "Ne plus afficher" et stocker ce choix.
            // Pour l'instant, s'il refuse, la modale se ferme, et c'est tout.
        }
    },

    startTutorial: function() {
        if (this.isActive) return;
        console.log("Tutoriel démarré.");
        this.isActive = true;
        this.currentStep = 0;
        this.showStep();
        // On pourrait marquer le tutoriel comme "vu" ici pour ne pas le reproposer,
        // mais il vaut mieux le faire à la fin ou si le joueur le passe explicitement.
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
            this.endTutorial(false);
            return;
        }

        // Forcer l'affichage du bon onglet si spécifié
        if (step.targetTab) {
            if (typeof switchMainTab === 'function' && typeof switchSubTab === 'function') {
                // Simuler les clics ou appeler directement les fonctions de changement d'onglet
                // Cela dépend de comment vos fonctions switchMainTab/switchSubTab sont structurées dans index.html
                // Pour l'instant, on suppose qu'elles existent globalement (ce qui est le cas via le <script> dans index.html)
                
                // D'abord l'onglet principal
                const mainTabButton = document.querySelector(`#main-navigation .nav-button[data-section="${step.targetTab.main}"]`);
                if (mainTabButton) mainTabButton.click(); // Simule un clic
                
                // Ensuite le sous-onglet, avec un petit délai pour laisser le DOM se mettre à jour
                if (step.targetTab.sub) {
                    setTimeout(() => {
                        const subTabButton = document.querySelector(`#${step.targetTab.main} .sub-nav-button[data-subtab="${step.targetTab.sub}"]`);
                        if (subTabButton) subTabButton.click(); // Simule un clic
                        this.applyHighlightAndModal(step);
                    }, 100); // Un petit délai peut être nécessaire
                } else {
                     this.applyHighlightAndModal(step);
                }
            } else {
                console.warn("Les fonctions switchMainTab ou switchSubTab ne sont pas disponibles globalement.");
                this.applyHighlightAndModal(step);
            }
        } else {
             this.applyHighlightAndModal(step);
        }
    },
    
    applyHighlightAndModal: function(step) {
        if (step.elementId) {
            const element = document.getElementById(step.elementId);
            if (element) {
                this.highlightedElement = element;
                this.originalOutline = element.style.outline;
                this.originalZIndex = element.style.zIndex;
                element.style.outline = `3px dashed var(--accent-yellow)`;
                element.style.zIndex = '1001'; // Pour être au-dessus de la modale de base mais en dessous de celle du tuto
                if (step.highlightPadding) {
                     element.style.outlineOffset = step.highlightPadding;
                }
                // Faire défiler l'élément dans la vue si nécessaire
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            } else {
                console.warn(`Élément du tutoriel non trouvé: ${step.elementId}`);
            }
        }

        // Créer et afficher la modale spécifique au tutoriel
        this.showTutorialModal(step);
    },

    showTutorialModal: function(step) {
        let tutorialModal = document.getElementById('tutorial-modal');
        if (!tutorialModal) {
            tutorialModal = document.createElement('div');
            tutorialModal.id = 'tutorial-modal';
            tutorialModal.className = 'modal'; // Utilisez vos classes de modale existantes
            tutorialModal.style.zIndex = '1002'; // Au-dessus de l'highlight
            document.body.appendChild(tutorialModal);
        }

        let contentHtml = `<div class="modal-content" style="max-width: 400px; text-align: left;">`; // Contenu spécifique du tutoriel
        contentHtml += `<h3 class="font-orbitron text-lg mb-2 text-[var(--accent-yellow)]">${step.title}</h3>`;
        contentHtml += `<p class="mb-3 text-sm text-gray-200">${step.text}</p>`;
        contentHtml += `<p class="text-xs text-gray-400 mb-3">Étape ${this.currentStep + 1} / ${this.steps.length}</p>`;
        contentHtml += `<div class="flex justify-between items-center">`;
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
        tutorialModal.classList.remove('hidden');

        // Positionnement de la modale (simpliste, à améliorer si besoin)
        const highlightedEl = this.highlightedElement;
        if (highlightedEl && step.position !== 'center') {
            const modalContent = tutorialModal.querySelector('.modal-content');
            const rect = highlightedEl.getBoundingClientRect();
            modalContent.style.position = 'absolute'; // Pour positionner par rapport à l'élément
            
            if (step.position === 'bottom-center') {
                modalContent.style.top = `${rect.bottom + 10}px`;
                modalContent.style.left = `${rect.left + (rect.width / 2) - (modalContent.offsetWidth / 2)}px`;
            } else if (step.position === 'top-center') {
                 modalContent.style.top = `${rect.top - modalContent.offsetHeight - 10}px`;
                 modalContent.style.left = `${rect.left + (rect.width / 2) - (modalContent.offsetWidth / 2)}px`;
            }
            // Assurer que la modale reste dans la fenêtre
            const modalRect = modalContent.getBoundingClientRect();
            if (modalRect.right > window.innerWidth) modalContent.style.left = `${window.innerWidth - modalRect.width - 10}px`;
            if (modalRect.left < 0) modalContent.style.left = '10px';
            if (modalRect.bottom > window.innerHeight) modalContent.style.top = `${window.innerHeight - modalRect.height - 10}px`;
            if (modalRect.top < 0) modalContent.style.top = '10px';

        } else {
            // Centrer la modale si pas d'élément ou position 'center'
             const modalContent = tutorialModal.querySelector('.modal-content');
             modalContent.style.position = 'relative'; // Ou 'fixed' si la modale principale l'est
             modalContent.style.top = '';
             modalContent.style.left = '';
        }


        // Attacher les écouteurs d'événements
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
            this.highlightedElement.style.outlineOffset = '';
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
            gameState.tutorialCompleted = true; // Marquer comme complété/vu pour ne plus le proposer
        }
        if (typeof saveGame === 'function') saveGame(); // Sauvegarder l'état
    }
};

console.log("tutorialController.js - Objet défini.");