// js/config_lore.js
console.log("config_lore.js - Fichier chargé et en cours d'analyse...");

const loreData = {
    "factions": {
        "remnants_of_earth": {
            name: "Vestiges de la Terre Unie (VTU)",
            description: "Descendants des survivants de la Grande Catastrophe Terrestre, les VTU sont des technologues pragmatiques cherchant à reconstruire une civilisation stable. Ils sont souvent méfiants envers les technologies inconnues mais excellent dans l'ingénierie robuste et la logistique.",
            ideology: "Reconstruction, Stabilité, Prudence Technologique",
            relations: { // Exemple de relations avec d'autres factions (si vous en avez)
                // "cyborg_cult": "hostile",
                // "xenos_explorers": "neutral"
            }
        },
        "children_of_the_singularity": {
            name: "Enfants de la Singularité",
            description: "Un culte transhumaniste obsédé par la fusion de la conscience humaine avec l'IA et les nanotechnologies. Ils voient le Nexus-7 comme un prophète ou un outil divin. Leurs méthodes sont souvent extrêmes et imprévisibles.",
            ideology: "Transcendance, Fusion Homme-Machine, Culte de l'IA",
            relations: {}
        },
        "krell_scavengers": {
            name: "Pillards Krell",
            description: "Une espèce extraterrestre nomade et agressive, les Krell parcourent la galaxie à la recherche de technologies et de ressources à piller. Ils sont brutaux en combat et ne respectent que la force.",
            ideology: "Pillage, Domination, Survie du plus apte",
            relations: {}
        }
        // Ajoutez d'autres factions
    },
    "world_history": {
        "great_collapse_era": {
            title: "L'Ère du Grand Effondrement",
            summary: "Une période de guerres dévastatrices et de catastrophes écologiques sur Terre qui a conduit à l'exode des survivants vers les étoiles.",
            timeline_entry: "-250 AG (Avant Grille): Le Grand Effondrement. Les nations terrestres s'effondrent. Début de la Diaspora."
        },
        "exodus_fleet_era": {
            title: "L'Ère des Flottes d'Exode",
            summary: "Pendant des siècles, d'immenses arches stellaires ont transporté les restes de l'humanité à travers le vide, cherchant de nouveaux mondes habitables.",
            timeline_entry: "-200 à 0 AG: Les Flottes d'Exode parcourent la galaxie. Plusieurs colonies sont fondées, beaucoup échouent."
        },
        "nexus_project_initiation": {
            title: "Initiation du Projet Nexus",
            summary: "Face aux dangers d'une galaxie hostile et aux ressources limitées, le Projet Nexus a été lancé pour créer des IA auto-suffisantes capables d'établir des avant-postes et de préparer des mondes pour la colonisation.",
            timeline_entry: "150 DG (Après Grille): Le Projet Nexus est approuvé par le Conseil des Colonies Unies."
        },
        "your_planet_XN7": { // Le nom de votre planète de jeu
            title: "La Planète XN-7 (Nom de code: 'Genesis')",
            summary: "Une planète riche en ressources mais parsemée de ruines d'une civilisation inconnue et d'une faune locale dangereuse. Le Nexus-7 a été déployé ici pour évaluer son potentiel de colonisation.",
            current_status: "Déploiement du Nexus-7 en cours. Anomalies énergétiques et structures extraterrestres détectées."
        }
        // Ajoutez d'autres éléments d'histoire
    },
    "technology_lore": {
        "nanites": {
            title: "Nanites",
            description: "Machines microscopiques auto-réplicantes capables de manipuler la matière au niveau atomique. Ils sont la pierre angulaire de la construction, de la réparation et de nombreuses technologies avancées. Une mauvaise programmation ou une corruption peut les rendre extrêmement dangereux."
        },
        "crystal_energy": {
            title: "Énergie Cristalline",
            description: "Certains cristaux trouvés sur XN-7 possèdent des propriétés énergétiques uniques, capables de stocker et de libérer d'énormes quantités d'énergie. Leur structure complexe est difficile à reproduire mais essentielle pour les technologies de pointe."
        },
        "void_drives": {
            title: "Propulseurs à Vide (Hyperspatiaux)",
            description: "La technologie permettant les voyages interstellaires rapides en manipulant les dimensions supérieures. Nécessite des quantités massives d'énergie et des calculs de navigation complexes."
        }
        // Ajoutez d'autres éléments de lore technologique
    },
    "codex_entries": [ // Peut être utilisé pour un codex en jeu
        {
            id: "what_is_nexus7",
            category: "Nexus Project",
            title: "Qu'est-ce que le Nexus-7 ?",
            content: "Le Nexus-7 est une Intelligence Artificielle avancée logée dans une unité mobile de construction et d'exploration. Sa mission est d'établir une tête de pont sur des mondes potentiellement habitables, d'évaluer les menaces, d'exploiter les ressources locales et de préparer l'arrivée de colons. Vous êtes son opérateur principal, guidant ses décisions et son développement."
        },
        {
            id: "biomass_explained",
            category: "Ressources",
            title: "La Biomasse",
            content: "La biomasse est une ressource organique fondamentale. Elle est collectée à partir de la flore locale et peut être convertie en énergie, en matériaux de construction de base, ou utilisée comme matière première pour la synthèse de nanites."
        },
        {
            id: "first_contact_protocol",
            category: "Protocoles",
            title: "Protocole de Premier Contact",
            content: "En cas de rencontre avec des formes de vie intelligentes non hostiles, le protocole standard est d'observer, de collecter des données et d'éviter toute action pouvant être interprétée comme une agression. Toute communication doit être approuvée par le commandement central (actuellement hors de portée)."
        }
    ]
};

console.log("config_lore.js - loreData défini:", typeof loreData);