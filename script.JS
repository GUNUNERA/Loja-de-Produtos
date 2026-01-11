// --- ESTADO DA APLICAÇÃO ---
const API_URL = "http://localhost:3001"; // Adicionado para o servidor
let currentUser = "";
let currentMode = "shared"; 
let currentGroup = "default";
let currentJasonIndex = null;
let currentListItems = [];

// --- CONFIGURAÇÃO DE SONS (MANTIDOS 100%) ---
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

function goToHomeMenu() {
    soundClick.play();
    switchScreen('screen-private-auth');
    //switchScreen('screen-mode');
}

function selectMode(mode) {
    soundClick.play();
    currentMode = mode;
    if (mode === 'shared') {
        currentGroup = 'Compartilhado';
        enterJasonSelection();
    } else {
        switchScreen('screen-private-auth');
    }
}

// Lógica de grupos privados mantida - Apenas a verificação será via servidor agora
// Adicione o parâmetro 'action' aqui
async function handlePrivateAuth(action, event) { 
    if (event) event.preventDefault(); // <--- O CÓDIGO MÁGICO

    const group = document.getElementById('group-name').value.trim();
    const pass = document.getElementById('group-pass').value.trim();

    if (!group || !pass) { 
        soundDenied.play(); 
        alert("Preencha o nome do grupo e a senha!"); 
        return; 
    }

    try {
        const res = await fetch(`${API_URL}/auth-group`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos a 'action' (create ou login) para o servidor saber o que fazer
            body: JSON.stringify({ name: group, password: pass, action: action }) 
        });

        const data = await res.json();

        if (res.ok) {
            currentGroup = group; 
            soundClick.play();
            enterJasonSelection();
        } else {
            soundDenied.play();
            alert(data.error); 
        }
    } catch (e) {
        alert("Erro ao conectar com o servidor!");
    }
}

function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    const homeBtn = document.getElementById('home-btn');
    if (id === 'screen-selection' || id === 'screen-editor') {
        homeBtn.style.display = 'block';
    } else {
        homeBtn.style.display = 'none';
    }
}

function enterJasonSelection() {
    document.getElementById('welcome-msg').innerText = `MODO: ${currentGroup.toUpperCase()} | OPERADOR: ${currentUser}`;
    switchScreen('screen-selection');
    renderJasonGrid();
}

// --- GRID E BUSCA (AGORA PUXANDO DO SERVIDOR) ---

async function renderJasonGrid() {
    const grid = document.getElementById('jason-grid');
    grid.innerHTML = "Carregando...";
    
    try {
        const res = await fetch(`${API_URL}/load/${currentMode}/${currentGroup}`);
        const savedData = await res.json();
        
        grid.innerHTML = "";
        // Criamos os 15 slots baseados no seu design original
        for (let index = 0; index < 15; index++) {
            const dbRecord = savedData.find(j => j.jason_index === index);
            const data = dbRecord ? JSON.parse(dbRecord.data) : null;
            
            const slot = document.createElement('div');
            slot.className = data ? 'jason-slot filled' : 'jason-slot empty';
            
            if (data) {
                const totalItems = data.items.length;
                const totalValue = data.items.reduce((acc, item) => acc + item.total, 0);
                slot.innerHTML = `<div class="reset-jason-btn" onclick="resetJason(${index}, event)">🗑️</div>
                    <div class="reset-jason-btn" onclick="event.stopPropagation(); resetJason(${index})">🗑️</div>
                    <strong>Jason ${index + 1}</strong>
                    <span>${totalItems} Produtos | R$ ${totalValue.toFixed(2)}</span>
                    <div class="last-mod">Última edição: ${data.lastUser}</div>
                `;
                slot.onclick = () => loadJason(index, data.items);
            } else {
                slot.innerHTML = `<strong>Jason ${index+1}</strong><span>Disponível</span>`;
                slot.onclick = () => createJason(index);
            }
            grid.appendChild(slot);
        }
    } catch (e) {
        console.error(e);
        alert("Erro ao conectar com o servidor SQL!");
    }
}

// Sua função de filtro original
function filterJasons() {
    const term = document.getElementById('search-jason').value.toLowerCase();
    const slots = document.querySelectorAll('.jason-slot');
    slots.forEach(slot => {
        const text = slot.innerText.toLowerCase();
        slot.classList.toggle('hidden-search', term !== "" && !text.includes(term));
    });
}

// --- EDITOR DE PRODUTOS (IGUAL AO SEU ORIGINAL) ---

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

// --- SALVAMENTO NO SERVIDOR ---

async function saveToJason(event) {
    if (event) event.preventDefault(); // Impede o refresh da página
    if (currentListItems.length === 0) { soundDenied.play(); return; }
    
    const jasonObj = { 
        lastUser: currentUser, 
        date: new Date().toLocaleString(), 
        items: currentListItems 
    };

    try {
        await fetch(`${API_URL}/save`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                mode: currentMode,
                group_name: currentGroup,
                jason_index: currentJasonIndex,
                data: jasonObj
            })
        });
        soundAdd.play();
        
        // AQUI ESTÁ O SEGREDO:
        // Não chame o Login, chame apenas a função que desenha a grade.
        switchScreen('screen-selection'); // Volta para a tela dos 15 Jasons
        renderJasonGrid();               // Atualiza os desenhos dos slots
    } catch (e) {
        alert("Erro ao salvar no servidor!");
    }
}

async function resetJason(index) {

// Aqui usamos dois freios:
    if (event) {
        event.preventDefault();  // 1. Não recarrega a página
        event.stopPropagation(); // 2. Não clica no slot de baixo (não abre o Jason)
    }

    if(confirm("Deseja apagar este Jason?")) {
        soundDenied.play();
        try {
            await fetch(`${API_URL}/delete`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    mode: currentMode, 
                    group_name: currentGroup, 
                    jason_index: index 
                })
            });
            renderJasonGrid();
        } catch (e) {
            alert("Erro ao apagar!");
        }
    }
}

function loadJason(index, items) {
    soundClick.play();
    currentJasonIndex = index;
    currentListItems = [...items];
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