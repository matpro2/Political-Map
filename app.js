import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const CX = 200;
const CY = 200;
const R = 150; 

const values = {
    idealism: 50,
    curiosity: 50,
    empathy: 50
};

const svg = document.getElementById('interactive-radar');
const poly = document.getElementById('radar-poly');
const handleIdealism = document.getElementById('handle-idealism');
const handleCuriosity = document.getElementById('handle-curiosity');
const handleEmpathy = document.getElementById('handle-empathy');

const infoTitle = document.getElementById('info-title');
const infoText = document.getElementById('info-text');

let activeHandle = null;

// --- AXIS DESCRIPTIONS ---
const axisDescriptions = {
    curiosity: {
        high: {
            title: "Curiosity",
            subtitle: "Your relationship with change and the unknown",
            pole: "Curiosity",
            items: [
                { label: "Your drive", text: "Exploration and novelty." },
                { label: "Facing risk", text: "You'd rather try something new and fail than stay in the dark about what could have been. An uncertain outcome doesn't scare you — it excites you." },
                { label: "Vision for society", text: "You welcome global change with enthusiasm. You see the transformation of a system as an adventure and an opportunity for improvement, even if it disrupts established habits." }
            ]
        },
        low: {
            title: "Conservatism",
            subtitle: "Your relationship with change and the unknown",
            pole: "Conservatism",
            items: [
                { label: "Your drive", text: "Stability and reliability." },
                { label: "Facing risk", text: "You favour what has been proven to work. If a system or tool has functioned well for decades, you see no reason to risk it for an untested alternative." },
                { label: "Vision for society", text: "You prefer cautious evolution over uncertain revolutions. Abrupt change is seen as a risk to stability. You value what is safe, predictable, and time-tested." }
            ]
        }
    },
    idealism: {
        high: {
            title: "Idealism",
            subtitle: "Your relationship with reality and possibilities",
            pole: "Idealism",
            items: [
                { label: "Your drive", text: "A vision of what the world should be." },
                { label: "Facing limits", text: "You refuse to be constrained by \"realism\". You pursue immense goals — sometimes called utopian — convinced that current limits are only temporary obstacles to overcome." },
                { label: "Your perception", text: "The world is not fixed. You see it as a canvas of infinite possibilities, shaped by imagination and ambition rather than rigid laws." }
            ]
        },
        low: {
            title: "Pragmatism",
            subtitle: "Your relationship with reality and possibilities",
            pole: "Pragmatism",
            items: [
                { label: "Your drive", text: "A sense of the concrete and the achievable." },
                { label: "Facing limits", text: "You set clear, tangible, attainable goals. You prefer to move forward wisely with the resources at hand rather than exhaust yourself chasing the unreachable." },
                { label: "Your perception", text: "You don't seek the absolutely perfect scenario at any cost, but the most optimal result given existing constraints. You build the future on solid, real foundations." }
            ]
        }
    },
    empathy: {
        high: {
            title: "Empathy",
            subtitle: "Your relationship with others and self-interest",
            pole: "Empathy",
            items: [
                { label: "Your drive", text: "Collective well-being and universal connection." },
                { label: "Toward others", text: "Your circle of consideration is boundless. You feel the pain of others emotionally and value the survival of every living being. A stranger deserves as much attention as someone close to you." },
                { label: "Your decisions", text: "You act for the group's interest before your own. Reducing global suffering takes precedence over your personal comfort." }
            ]
        },
        low: {
            title: "Competition / Individualism",
            subtitle: "Your relationship with others and self-interest",
            pole: "Individualism",
            items: [
                { label: "Your drive", text: "Your own achievement and personal happiness." },
                { label: "Toward others", text: "You clearly define what matters to you. What impacts neither your close circle nor your goals is perceived as outside your responsibility." },
                { label: "Your decisions", text: "You believe investing energy in things that bring you no value is a waste. You logically prioritise your own needs and the success of your own endeavours." }
            ]
        }
    }
};

function renderAxisDescription(axis) {
    const val = values[axis];
    const desc = val >= 50 ? axisDescriptions[axis].high : axisDescriptions[axis].low;

    infoTitle.textContent = desc.title;

    const itemsHTML = desc.items.map(item => `
        <div class="info-item">
            <span class="info-item-label">${item.label}</span>
            <p>${item.text}</p>
        </div>
    `).join('');

    infoText.innerHTML = `
        <p class="info-subtitle">${desc.subtitle}</p>
        <div class="info-pole-badge">${desc.pole}</div>
        ${itemsHTML}
    `;
}

// --- VISUAL UPDATE ---
function updateRadar() {
    const yIdealism = CY - (R * (values.idealism / 100));
    const xIdealism = CX;
    handleIdealism.setAttribute('cx', xIdealism);
    handleIdealism.setAttribute('cy', yIdealism);
    document.getElementById('val-idealism').textContent = `${Math.round(values.idealism)}%`;

    const lenCuriosity = R * (values.curiosity / 100);
    const xCuriosity = CX + lenCuriosity * 0.866025;
    const yCuriosity = CY + lenCuriosity * 0.5;
    handleCuriosity.setAttribute('cx', xCuriosity);
    handleCuriosity.setAttribute('cy', yCuriosity);
    document.getElementById('val-curiosity').textContent = `${Math.round(values.curiosity)}%`;

    const lenEmpathy = R * (values.empathy / 100);
    const xEmpathy = CX - lenEmpathy * 0.866025;
    const yEmpathy = CY + lenEmpathy * 0.5;
    handleEmpathy.setAttribute('cx', xEmpathy);
    handleEmpathy.setAttribute('cy', yEmpathy);
    document.getElementById('val-empathy').textContent = `${Math.round(values.empathy)}%`;

    poly.setAttribute('points', `${xIdealism},${yIdealism} ${xCuriosity},${yCuriosity} ${xEmpathy},${yEmpathy}`);
}

// --- DRAG & DROP LOGIC ---
svg.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('radar-handle')) {
        activeHandle = e.target.getAttribute('data-axis');
    }
});

window.addEventListener('mousemove', (e) => {
    if (!activeHandle) return;

    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Scale mouse coords to SVG viewBox (400x400)
    const scaleX = 400 / rect.width;
    const scaleY = 400 / rect.height;
    const svgX = mouseX * scaleX;
    const svgY = mouseY * scaleY;

    const dx = svgX - CX;
    const dy = svgY - CY;

    if (activeHandle === 'idealism') {
        let proj = -dy; 
        proj = Math.max(0, Math.min(R, proj));
        values.idealism = (proj / R) * 100;
    } 
    else if (activeHandle === 'curiosity') {
        let proj = dx * 0.866025 + dy * 0.5; 
        proj = Math.max(0, Math.min(R, proj));
        values.curiosity = (proj / R) * 100;
    } 
    else if (activeHandle === 'empathy') {
        let proj = dx * (-0.866025) + dy * 0.5; 
        proj = Math.max(0, Math.min(R, proj));
        values.empathy = (proj / R) * 100;
    }

    updateRadar();
    renderAxisDescription(activeHandle);
});

window.addEventListener('mouseup', () => {
    activeHandle = null;
});

// --- HOVER EXPLANATIONS ---
document.querySelectorAll('.radar-handle, .radar-axis').forEach(element => {
    element.addEventListener('mouseenter', (e) => {
        if (!activeHandle) {
            const axis = e.target.getAttribute('data-axis');
            if (axis) renderAxisDescription(axis);
        }
    });
});

// --- ANALYSE BUTTON ---
window.analyzeProfile = function() {
    // Determine dominant trait per axis
    const curiosityPole = values.curiosity >= 50 ? 'Curiosity' : 'Conservatism';
    const idealismPole = values.idealism >= 50 ? 'Idealism' : 'Pragmatism';
    const empathyPole = values.empathy >= 50 ? 'Empathy' : 'Individualism';

    // Profile archetypes based on combinations
    const profiles = {
        'Curiosity-Idealism-Empathy':       { name: 'The Visionary Humanist',    desc: 'You dream of a radically better world and feel it in your bones. Change excites you, grand visions motivate you, and the suffering of others moves you to act.' },
        'Curiosity-Idealism-Individualism': { name: 'The Bold Pioneer',           desc: 'You chase new horizons with ambitious goals and personal drive. You disrupt systems not for altruism, but because excellence and discovery are their own reward.' },
        'Curiosity-Pragmatism-Empathy':     { name: 'The Compassionate Innovator', desc: 'You explore new solutions with both feet on the ground. Change yes — but only when it concretely improves lives. You test, iterate, and care deeply about impact.' },
        'Curiosity-Pragmatism-Individualism':{ name: 'The Pragmatic Explorer',    desc: 'You adapt quickly, seize opportunities, and build things that work. You\'re not afraid to experiment, but only when the payoff is tangible and personally meaningful.' },
        'Conservatism-Idealism-Empathy':    { name: 'The Idealistic Guardian',    desc: 'You hold a beautiful vision for humanity but believe in slow, thoughtful progress. You protect the vulnerable while imagining a better world — one careful step at a time.' },
        'Conservatism-Idealism-Individualism':{ name: 'The Principled Traditionalist', desc: 'You have strong convictions about what should be, rooted in time-tested values. You pursue your own excellence through discipline and a clear moral framework.' },
        'Conservatism-Pragmatism-Empathy':  { name: 'The Steady Caretaker',       desc: 'Reliable, grounded, and community-focused. You work within proven structures to take care of those around you. No grand revolutions — just consistent, meaningful support.' },
        'Conservatism-Pragmatism-Individualism':{ name: 'The Self-Reliant Realist', desc: 'You value stability, proven methods, and personal responsibility above all. You build your own success methodically, trusting only what has stood the test of time.' },
    };

    const key = `${curiosityPole}-${idealismPole}-${empathyPole}`;
    const profile = profiles[key] || { name: 'Unique Profile', desc: 'Your combination of traits is complex and nuanced — a blend that defies easy categorisation.' };

    infoTitle.textContent = profile.name;
    infoText.innerHTML = `
        <p class="info-subtitle">Your profile type</p>
        <div class="profile-scores">
            <span>${curiosityPole} <em>${Math.round(values.curiosity)}%</em></span>
            <span>${idealismPole} <em>${Math.round(values.idealism)}%</em></span>
            <span>${empathyPole} <em>${Math.round(values.empathy)}%</em></span>
        </div>
        <p style="margin-top: 1.2rem; font-size: 0.88rem; color: var(--text); line-height: 1.7;">${profile.desc}</p>
    `;
};

// --- SAVE / SEND BUTTON ---
window.saveProfile = async function() {
    const btn = document.getElementById('save-btn');
    const originalText = btn.textContent;
    
    btn.textContent = "Sending...";
    btn.disabled = true;

    try {
        await addDoc(collection(db, 'results'), {
            result: "Interactive Radar Profile",
            e: Math.round(values.empathy),
            c: Math.round(values.curiosity),
            i: Math.round(values.idealism),
            date: new Date().toISOString()
        });
        
        updateCount();
        
        btn.textContent = "Sent! ✓";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2500);

    } catch(err) {
        console.error("Firestore write error:", err);
        btn.textContent = "Error ❌";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2500);
    }
};

// --- HISTORY MODAL ---
window.openHistory = async function() {
    document.getElementById('hist-modal').classList.add('on');
    const container = document.getElementById('hist-list-container');
    container.innerHTML = '<p class="hist-empty">Loading history...</p>';

    try {
        const q = query(collection(db, 'results'), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            container.innerHTML = '<p class="hist-empty">No results found!</p>';
            return;
        }

        let html = '<div class="hist-list">';
        let index = snap.size;
        snap.forEach(doc => {
            const data = doc.data();
            const d = new Date(data.date);
            const dateStr = d.toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
            
            html += `
            <div class="hist-entry">
                <span class="hist-num">#${index}</span>
                <span class="hist-result">Radar Profile</span>
                <div class="hist-meta">
                    <span class="hist-date">${dateStr}</span>
                    <span class="hist-sliders">Emp:${data.e}% · Cur:${data.c}% · Ide:${data.i}%</span>
                </div>
            </div>`;
            index--;
        });
        html += '</div>';
        container.innerHTML = html;

    } catch(err) {
        container.innerHTML = '<p class="hist-empty" style="color:red;">Error loading history data.</p>';
    }
};

async function updateCount() {
    try {
        const snap = await getDocs(collection(db, 'results'));
        document.getElementById('hist-count').textContent = snap.size;
    } catch(e) {}
}

// Init
updateRadar();
updateCount();