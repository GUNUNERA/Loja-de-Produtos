const API_URL = "http://localhost:3001";
let currentUser = "";
let currentMode = "shared"; 
let currentGroup = "shared";
let currentJasonIndex = null;
let currentListItems = [];

// Sons
const soundSwipe = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'); 
const soundClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); 
const soundAdd = new Audio('https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3');   
const soundDenied = new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'); 

function startIntroAnimation() {
    soundSwipe.play().catch(e => {});
    document.getElementById('intro-screen').classList.add('animate');
    setTimeout(() => { document.getElementById('intro-screen').style.display = 'none'; }, 1500);
}

function confirmName() {
    currentUser = document.getElementById('user-name-input').value.trim();
    if (!currentUser) { alert("Insira sua assinatura!"); return; }
    switchScreen('screen-mode');
}

function selectMode(mode) {
    currentMode = mode;
    if (mode === 'shared') {
        currentGroup = 'shared';
        enterJasonSelection();
    } else {
        switchScreen('screen-private-auth');
    }
}

async function handlePrivateAuth(action) {
    const group = document.getElementById('group-name').value.trim();
    const pass = document.getElementById('group-pass').value.trim();
    const route = action === 'create' ? '/create-group' : '/login-group';

    try {
        const response = await fetch(`${API_URL}${route}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: group, password: pass })
        });
        const result = await response.json();
        if (response.ok) {
            currentGroup = group;
            enterJasonSelection();
        } else { alert(result.error); }
    } catch (e) { alert("Servidor Offline na porta 3001!"); }
}

async function renderJasonGrid() {
    const grid = document.getElementById('jason-grid');
    grid.innerHTML = "Carregando...";
    
    try {
        const response = await fetch(`${API_URL}/load-group/${currentGroup}`);
        const data = await response.json();
        const jasons = new Array(15).fill(null);
        data.forEach(d => jasons[d.jason_index] = d);

        grid.innerHTML = "";
        jasons.forEach((data, index) => {
            const slot = document.createElement('div');
            slot.className = data ? 'jason-slot filled' : 'jason-slot empty';
            if (data) {
                const items = JSON.parse(data.items);
                slot.innerHTML = `<div class="reset-jason-btn" onclick="event.stopPropagation(); resetJason(${index})">🗑️</div>
                                  <strong>Jason ${index + 1}</strong><span>${items.length} Itens</span>
                                  <div class="last-mod">${data.last_user}</div>`;
                slot.onclick = () => { currentJasonIndex = index; currentListItems = items; updateListUI(); switchScreen('screen-editor'); };
            } else {
                slot.innerHTML = `<strong>Jason ${index+1}</strong><span>Vazio</span>`;
                slot.onclick = () => { currentJasonIndex = index; currentListItems = []; updateListUI(); switchScreen('screen-editor'); };
            }
            grid.appendChild(slot);
        });
    } catch (e) { grid.innerHTML = "Erro ao conectar ao servidor."; }
}

async function saveToJason() {
    try {
        await fetch(`${API_URL}/save-jason`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_name: currentGroup, jason_index: currentJasonIndex, last_user: currentUser, items: currentListItems })
        });
        enterJasonSelection();
    } catch (e) { alert("Erro ao salvar."); }
}

async function resetJason(index) {
    if(!confirm("Apagar?")) return;
    await fetch(`${API_URL}/delete-jason`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: currentGroup, jason_index: index })
    });
    renderJasonGrid();
}

function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('home-btn').style.display = (id === 'screen-selection' || id === 'screen-editor') ? 'block' : 'none';
}

function updateListUI() {
    const container = document.getElementById('list-container');
    container.innerHTML = "";
    let total = 0;
    currentListItems.forEach(item => {
        total += item.total;
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<div>${item.cdp}</div><div>${item.nome}</div><div>${item.qtd}</div><div>${item.valor}</div><div>${item.total.toFixed(2)}</div><button onclick="removeProduct(${item.id})">X</button>`;
        container.appendChild(div);
    });
    document.getElementById('grand-total').innerText = `R$ ${total.toFixed(2)}`;
}

function addProductToList() {
    const cdp = document.getElementById('input-cdp').value;
    const nome = document.getElementById('input-nome').value;
    const qtd = parseFloat(document.getElementById('input-qtd').value);
    const valor = parseFloat(document.getElementById('input-valor').value);
    if (!cdp || !nome) return;
    currentListItems.push({ id: Date.now(), cdp, nome, qtd, valor, total: qtd * valor });
    updateListUI();
}

function removeProduct(id) {
    currentListItems = currentListItems.filter(i => i.id !== id);
    updateListUI();
}

async function enterJasonSelection() {
    switchScreen('screen-selection');
    renderJasonGrid();
}
function goToHomeMenu() { switchScreen('screen-mode'); }