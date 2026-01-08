// --- ESTADO DA APLICAÇÃO ---
let currentUser = "";
let currentMode = "shared"; 
let currentGroup = "default";
let currentJasonIndex = null;
let currentListItems = [];

// Banco de dados centralizado
let allData = JSON.parse(localStorage.getItem('jason_vault')) || {
    shared: new Array(15).fill(null),
    privateGroups: {} 
};

// --- CONFIGURAÇÃO DE SONS ---
const soundSwipe = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'); 
const soundClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); 
const soundAdd = new Audio('https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3');   
const soundDenied = new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'); 

// --- NAVEGAÇÃO E AUTH ---

function startIntroAnimation() {
    soundSwipe.play().catch(e => {});
    document.getElementById('intro-screen').classList.add('animate');
    setTimeout(() => { document.getElementById('intro-screen').style.display = 'none'; }, 1500);
}

function confirmName() {
    currentUser = document.getElementById('user-name-input').value.trim();
    if (!currentUser) { soundDenied.play(); alert("Insira sua assinatura!"); return; }
    soundClick.play();
    switchScreen('screen-mode');
}

function selectMode(mode) {
    soundClick.play();
    currentMode = mode;
    if (mode === 'shared') {
        currentGroup = 'Compartilhado';
        goToJasonSelection();
    } else {
        switchScreen('screen-private-auth');
    }
}

function handlePrivateAuth(action) {
    const group = document.getElementById('group-name').value.trim();
    const pass = document.getElementById('group-pass').value.trim();

    if (!group || !pass) { soundDenied.play(); alert("Preencha grupo e senha!"); return; }

    if (action === 'create') {
        if (allData.privateGroups[group]) {
            soundDenied.play(); alert("Este grupo já existe!");
        } else {
            allData.privateGroups[group] = { password: pass, jasons: new Array(15).fill(null) };
            saveAll();
            currentGroup = group;
            soundAdd.play();
            goToJasonSelection();
        }
    } else {
        if (allData.privateGroups[group] && allData.privateGroups[group].password === pass) {
            currentGroup = group;
            soundClick.play();
            goToJasonSelection();
        } else {
            soundDenied.play(); alert("Acesso Negado: Dados incorretos.");
        }
    }
}

function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('home-btn').style.display = (id === 'screen-editor' || id === 'screen-selection') ? 'block' : 'none';
}

function goToJasonSelection() {
    document.getElementById('welcome-msg').innerText = `MODO: ${currentGroup.toUpperCase()} | OPERADOR: ${currentUser}`;
    switchScreen('screen-selection');
    renderJasonGrid();
}

// --- GRID E BUSCA ---

function renderJasonGrid() {
    const grid = document.getElementById('jason-grid');
    grid.innerHTML = "";
    const jasons = (currentMode === 'shared') ? allData.shared : allData.privateGroups[currentGroup].jasons;

    jasons.forEach((data, index) => {
        const slot = document.createElement('div');
        slot.className = data ? 'jason-slot filled' : 'jason-slot empty';
        
        if (data) {
            const totalItems = data.items.length;
            const totalValue = data.items.reduce((acc, item) => acc + item.total, 0);
            slot.innerHTML = `
                <div class="reset-jason-btn" onclick="event.stopPropagation(); resetJason(${index})">🗑️</div>
                <strong>Jason ${index + 1}</strong>
                <span>${totalItems} Produtos | R$ ${totalValue.toFixed(2)}</span>
                <div class="last-mod">Última edição: ${data.lastUser}</div>
            `;
            slot.onclick = () => loadJason(index);
        } else {
            slot.innerHTML = `<strong>Jason ${index+1}</strong><span>Disponível</span>`;
            slot.onclick = () => createJason(index);
        }
        grid.appendChild(slot);
    });
}

function filterJasons() {
    const term = document.getElementById('search-jason').value.toLowerCase();
    const slots = document.querySelectorAll('.jason-slot');
    const jasons = (currentMode === 'shared') ? allData.shared : allData.privateGroups[currentGroup].jasons;

    jasons.forEach((data, index) => {
        const content = data ? (JSON.stringify(data) + `jason ${index+1}`).toLowerCase() : `jason ${index+1}`;
        slots[index].classList.toggle('hidden-search', term !== "" && !content.includes(term));
    });
}

// --- EDITOR DE PRODUTOS ---

function calculateItemTotal() {
    const qtd = parseFloat(document.getElementById('input-qtd').value) || 0;
    const valor = parseFloat(document.getElementById('input-valor').value) || 0;
    document.getElementById('display-item-total').innerText = (qtd * valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function addProductToList() {
    const cdp = document.getElementById('input-cdp').value;
    const nome = document.getElementById('input-nome').value;
    const qtd = parseFloat(document.getElementById('input-qtd').value);
    const valor = parseFloat(document.getElementById('input-valor').value);
    const detalhes = document.getElementById('input-detalhes').value;

    if (!cdp || !nome || isNaN(qtd) || isNaN(valor)) {
        soundDenied.play();
        alert("Campos obrigatórios ausentes!");
        return;
    }

    soundAdd.play();
    currentListItems.push({ id: Date.now(), cdp, nome, qtd, valor, detalhes, total: qtd * valor });
    updateListUI();
    
    ["input-cdp", "input-nome", "input-qtd", "input-valor", "input-detalhes"].forEach(id => document.getElementById(id).value = "");
    document.getElementById('display-item-total').innerText = "R$ 0,00";
}

function updateListUI() {
    const container = document.getElementById('list-container');
    container.innerHTML = "";
    let grandTotal = 0;

    currentListItems.forEach(item => {
        grandTotal += item.total;
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div>${item.cdp}</div>
            <div>${item.nome}<br><small>${item.detalhes}</small></div>
            <div>${item.qtd}</div>
            <div>${item.valor.toFixed(2)}</div>
            <div style="color:var(--primary)">${item.total.toFixed(2)}</div>
            <button class="delete-btn" onclick="removeProduct(${item.id})">X</button>
        `;
        container.appendChild(div);
    });
    document.getElementById('grand-total').innerText = grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function filterProducts() {
    const term = document.getElementById('search-product').value.toLowerCase();
    const items = document.querySelectorAll('.list-item');
    currentListItems.forEach((item, index) => {
        const text = (item.nome + item.cdp).toLowerCase();
        if(items[index]) items[index].classList.toggle('hidden-search', !text.includes(term));
    });
}

function removeProduct(id) {
    soundDenied.play();
    currentListItems = currentListItems.filter(item => item.id !== id);
    updateListUI();
}

function saveToJason() {
    if (currentListItems.length === 0) { soundDenied.play(); return; }
    const jasonObj = { lastUser: currentUser, date: new Date().toLocaleString(), items: currentListItems };

    if (currentMode === 'shared') allData.shared[currentJasonIndex] = jasonObj;
    else allData.privateGroups[currentGroup].jasons[currentJasonIndex] = jasonObj;

    saveAll();
    soundAdd.play();
    goToJasonSelection();
}

function resetJason(index) {
    soundDenied.play();
    if(confirm("Deseja apagar este Jason?")) {
        if (currentMode === 'shared') allData.shared[index] = null;
        else allData.privateGroups[currentGroup].jasons[index] = null;
        saveAll();
        renderJasonGrid();
    }
}

function loadJason(index) {
    soundClick.play();
    currentJasonIndex = index;
    const jasons = (currentMode === 'shared') ? allData.shared : allData.privateGroups[currentGroup].jasons;
    currentListItems = [...jasons[index].items];
    updateListUI();
    switchScreen('screen-editor');
}

function createJason(index) {
    soundClick.play();
    currentJasonIndex = index;
    currentListItems = [];
    updateListUI();
    switchScreen('screen-editor');
}

function saveAll() {
    localStorage.setItem('jason_vault', JSON.stringify(allData));
}