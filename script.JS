// --- ESTADO DA APLICAÇÃO ---
let currentUser = "";
let currentJasonIndex = null;
let jasonsData = JSON.parse(localStorage.getItem('jasonsData')) || new Array(15).fill(null);
let currentListItems = [];

// --- CONFIGURAÇÃO DE SONS (SFX) ---
const soundSwipe = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'); // Abertura
const soundClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Botões gerais
const soundAdd = new Audio('https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3');   // Sucesso/Salvar
const soundDenied = new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'); // ACESSO NEGADO / EXCLUIR

// --- TELA DE ABERTURA & NAVEGAÇÃO ---

function startIntroAnimation() {
    const introScreen = document.getElementById('intro-screen');
    
    // Tocar som de deslize ao iniciar a animação visual
    soundSwipe.play().catch(e => console.log("Áudio aguardando interação do usuário..."));

    introScreen.classList.add('animate');
    setTimeout(() => {
        introScreen.style.display = 'none';
    }, 1500); 
}

function confirmName() {
    soundClick.play();
    const nameInput = document.getElementById('user-name-input');
    if (nameInput.value.trim() === "") {
        alert("Por favor, digite seu nome.");
        return;
    }
    currentUser = nameInput.value;
    document.getElementById('welcome-msg').innerText = `Olá, ${currentUser}`;
    switchScreen('screen-selection');
    renderJasonGrid();
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    const homeBtn = document.getElementById('home-btn');
    if (screenId === 'screen-editor') {
        homeBtn.style.display = 'block';
    } else {
        homeBtn.style.display = 'none';
    }
}

function goToJasonSelection() {
    soundClick.play();
    switchScreen('screen-selection');
    renderJasonGrid();
}

// --- LÓGICA DO GRID JASON & PESQUISA ---

function renderJasonGrid() {
    const grid = document.getElementById('jason-grid');
    grid.innerHTML = ""; 

    jasonsData.forEach((data, index) => {
        const slot = document.createElement('div');
        const slotNumber = index + 1;
        
        if (data) {
            slot.className = 'jason-slot filled';
            const totalItems = data.items ? data.items.length : 0;
            const totalValue = data.items.reduce((acc, item) => acc + item.total, 0);
            
            slot.innerHTML = `
                <div class="reset-jason-btn" title="Resetar Jason" onclick="event.stopPropagation(); resetJason(${index})">🗑️</div>
                <strong>Jason ${slotNumber}</strong>
                <span style="font-size:0.8rem; margin-top:5px;">${totalItems} Produtos</span>
                <span style="font-size:0.8rem;">R$ ${totalValue.toFixed(2)}</span>
            `;
            slot.onclick = () => { soundClick.play(); loadJason(index); };
        } else {
            slot.className = 'jason-slot empty';
            slot.innerHTML = `
                <strong>Jason ${slotNumber}</strong>
                <span>(Criar Novo)</span>
            `;
            slot.onclick = () => { soundClick.play(); createJason(index); };
        }
        grid.appendChild(slot);
    });
}

function filterJasons() {
    const term = document.getElementById('search-jason').value.toLowerCase();
    const slots = document.querySelectorAll('.jason-slot');

    jasonsData.forEach((data, index) => {
        const slot = slots[index];
        const contentString = data ? JSON.stringify(data).toLowerCase() : "";
        const matches = contentString.includes(term) || `jason ${index + 1}`.includes(term);
        
        slot.classList.toggle('hidden-search', term !== "" && !matches);
    });
}

function resetJason(index) {
    // Tocar som de Negado/Alerta antes mesmo de confirmar para dar impacto
    soundDenied.play();
    
    if (confirm(`SISTEMA: Deseja realmente APAGAR permanentemente os dados do Jason ${index + 1}?`)) {
        jasonsData[index] = null;
        localStorage.setItem('jasonsData', JSON.stringify(jasonsData));
        renderJasonGrid();
    }
}

function createJason(index) {
    currentJasonIndex = index;
    currentListItems = [];
    updateListUI();
    switchScreen('screen-editor');
}

function loadJason(index) {
    currentJasonIndex = index;
    currentListItems = [...jasonsData[index].items]; 
    updateListUI();
    switchScreen('screen-editor');
}

// --- LÓGICA DO EDITOR & FILTRO DE PRODUTOS ---

function filterProducts() {
    const term = document.getElementById('search-product').value.toLowerCase();
    const items = document.querySelectorAll('.list-item');

    currentListItems.forEach((item, index) => {
        const text = (item.nome + item.cdp + item.detalhes).toLowerCase();
        if(items[index]) {
            items[index].classList.toggle('hidden-search', !text.includes(term));
        }
    });
}

function calculateItemTotal() {
    const qtd = parseFloat(document.getElementById('input-qtd').value) || 0;
    const valor = parseFloat(document.getElementById('input-valor').value) || 0;
    const total = qtd * valor;
    
    document.getElementById('display-item-total').innerText = 
        total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return total;
}

function addProductToList() {
    const cdp = document.getElementById('input-cdp').value;
    const nome = document.getElementById('input-nome').value;
    const qtd = parseFloat(document.getElementById('input-qtd').value);
    const valor = parseFloat(document.getElementById('input-valor').value);
    const detalhes = document.getElementById('input-detalhes').value;

    if (!cdp || !nome || !qtd || !valor) {
        soundDenied.play(); // Som de erro se tentar adicionar vazio
        alert("ERRO: Preencha os campos obrigatórios.");
        return;
    }

    soundAdd.play();

    const newItem = {
        id: Date.now(),
        cdp, nome, qtd, valor, detalhes,
        total: qtd * valor
    };

    currentListItems.push(newItem);
    updateListUI();
    
    document.getElementById('input-cdp').value = "";
    document.getElementById('input-nome').value = "";
    document.getElementById('input-qtd').value = "";
    document.getElementById('input-valor').value = "";
    document.getElementById('input-detalhes').value = "";
    document.getElementById('display-item-total').innerText = "R$ 0,00";
}

function removeProduct(id) {
    // Tocar som de Acesso Negado ao remover item
    soundDenied.play();
    currentListItems = currentListItems.filter(item => item.id !== id);
    updateListUI();
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

function saveToJason() {
    if (currentListItems.length === 0) {
        soundDenied.play();
        alert("A lista está vazia!");
        return;
    }

    soundAdd.play();
    jasonsData[currentJasonIndex] = {
        createdDate: new Date(),
        items: currentListItems
    };

    localStorage.setItem('jasonsData', JSON.stringify(jasonsData));
    alert(`DADOS SINCRONIZADOS: Jason ${currentJasonIndex + 1} atualizado.`);
    goToJasonSelection();
}