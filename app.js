import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

let radarChart = null; // Stocke l'instance actuelle du graphique Chart.js

// --- FONCTION : GENERER LE GRAPHIQUE ET SAUVEGARDER ---
// On attache la fonction à l'objet global "window" pour que l'attribut HTML "onclick" puisse la trouver
window.calculate = async function() {
    const uE = +document.getElementById('e').value;
    const uC = +document.getElementById('c').value;
    const uI = +document.getElementById('i').value;

    // Affiche l'écran des résultats
    document.getElementById('result-screen').classList.add('on');

    const ctx = document.getElementById('radarChart').getContext('2d');
    
    // Si un graphique existe déjà, on le détruit pour éviter les superpositions graphiques au recalcul
    if (radarChart) {
        radarChart.destroy();
    }

    // Création du graphique radar triangulaire
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Empathy', 'Curiosity', 'Idealism'],
            datasets: [{
                label: 'Votre profil',
                data: [uE, uC, uI],
                backgroundColor: 'rgba(129, 140, 248, 0.3)',
                borderColor: '#818cf8',
                borderWidth: 2,
                pointBackgroundColor: '#c4b5fd',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#c4b5fd'
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: {
                        color: '#f0f2fc',
                        font: { family: 'Space Grotesk', size: 14 }
                    },
                    ticks: {
                        display: false, // Cache les numéros d'échelle
                        min: 0,
                        max: 100,
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Envoi des données brutes du profil vers Firebase Firestore
    try {
        await addDoc(collection(db, 'results'), {
            result: "Profil Visuel",
            e: uE, c: uC, i: uI,
            date: new Date().toISOString()
        });
        updateCount(); 
    } catch(err) {
        console.error("Erreur de sauvegarde Firestore :", err);
    }
};

// --- FONCTION : RETOURNER AUX SLIDERS ---
window.goBack = function() {
    document.getElementById('result-screen').classList.remove('on');
};

// --- FONCTION : CHARGER ET AFFICHER L'HISTORIQUE ---
window.openHistory = async function() {
    document.getElementById('hist-modal').classList.add('on');
    const container = document.getElementById('hist-list-container');
    container.innerHTML = '<p class="hist-empty">Chargement de l\'historique...</p>';

    try {
        const q = query(collection(db, 'results'), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            container.innerHTML = '<p class="hist-empty">Aucun résultat pour le moment !</p>';
            return;
        }

        let html = '<div class="hist-list">';
        let index = snap.size;
        snap.forEach(doc => {
            const data = doc.data();
            const d = new Date(data.date);
            const dateStr = d.toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
            
            html += `
            <div class="hist-entry">
                <span class="hist-num">#${index}</span>
                <span class="hist-result">Radar Profil</span>
                <div class="hist-meta">
                    <span class="hist-date">${dateStr}</span>
                    <span class="hist-sliders">Emp:${data.e}% · Cur:${data.c}% · Idé:${data.i}%</span>
                </div>
            </div>`;
            index--;
        });
        html += '</div>';
        container.innerHTML = html;

    } catch(err) {
        container.innerHTML = '<p class="hist-empty" style="color:red;">Erreur de connexion à la base de données.</p>';
        console.error(err);
    }
};

// --- FONCTION INTERNE : METTRE A JOUR LE COMPTEUR DE L'HISTORIQUE ---
async function updateCount() {
    try {
        const snap = await getDocs(collection(db, 'results'));
        document.getElementById('hist-count').textContent = snap.size;
    } catch(e) {}
}

// Initialisation automatique du petit compteur de badges au démarrage
updateCount();