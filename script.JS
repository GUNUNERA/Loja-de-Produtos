// --- ESTADO DA APLICAÇÃO ---
let currentUser = "";
let currentJasonIndex = null;
let jasonsData = JSON.parse(localStorage.getItem('jasonsData')) || new Array(15).fill(null);
let currentListItems = [];

// --- NAVEGAÇÃO E INICIALIZAÇÃO ---

function confirmName() {
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

    // Mostrar botão Home apenas se não estiver no login ou seleção
    const homeBtn = document.getElementById('home-btn');
    if (screenId === 'screen-editor') {
        homeBtn.style.display = 'block';
    } else {
        homeBtn.style.display = 'none';
    }
}

function goToJasonSelection() {
    switchScreen('screen-selection');
    renderJasonGrid();
}

// --- LÓGICA DO GRID JASON ---

function renderJasonGrid() {
    const grid = document.getElementById('jason-grid');
    grid.innerHTML = ""; // Limpa grid

    jasonsData.forEach((data, index) => {
        const slot = document.createElement('div');
        const slotNumber = index + 1;
        
        if (data) {
            // Slot Ocupado
            slot.className = 'jason-slot filled';
            const totalItems = data.items ? data.items.length : 0;
            const totalValue = data.items.reduce((acc, item) => acc + item.total, 0);
            
            slot.innerHTML = `
                <strong>Jason ${slotNumber}</strong>
                <span style="font-size:0.8rem; margin-top:5px;">${totalItems} Produtos</span>
                <span style="font-size:0.8rem;">R$ ${totalValue.toFixed(2)}</span>
            `;
            slot.onclick = () => loadJason(index);
        } else {
            // Slot Vazio
            slot.className = 'jason-slot empty';
            slot.innerHTML = `
                <strong>Jason ${slotNumber}</strong>
                <span>(Criar Novo)</span>
            `;
            slot.onclick = () => createJason(index);
        }
        grid.appendChild(slot);
    });
}

function createJason(index) {
    currentJasonIndex = index;
    currentListItems = []; // Começa vazio
    updateListUI();
    switchScreen('screen-editor');
}

function loadJason(index) {
    currentJasonIndex = index;
    // Carrega os itens salvos desse Jason para a memória temporária
    currentListItems = [...jasonsData[index].items]; 
    updateListUI();
    switchScreen('screen-editor');
}

// --- LÓGICA DO EDITOR DE PRODUTOS ---

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
        alert("Preencha os campos principais (CDP, Nome, Qtd, Valor).");
        return;
    }

    const newItem = {
        id: Date.now(), // ID único
        cdp,
        nome,
        qtd,
        valor,
        detalhes,
        total: qtd * valor
    };

    currentListItems.push(newItem);
    updateListUI();
    
    // Limpar inputs
    document.getElementById('input-cdp').value = "";
    document.getElementById('input-nome').value = "";
    document.getElementById('input-qtd').value = "";
    document.getElementById('input-valor').value = "";
    document.getElementById('input-detalhes').value = "";
    document.getElementById('display-item-total').innerText = "R$ 0,00";
}

function removeProduct(id) {
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
            <div>
                ${item.nome}
                ${item.detalhes ? `<br><small style="color:#666; font-style:italic;">${item.detalhes}</small>` : ''}
            </div>
            <div>${item.qtd}</div>
            <div>${item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <div style="font-weight:bold; color:var(--primary);">${item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <button class="delete-btn" onclick="removeProduct(${item.id})">X</button>
        `;
        container.appendChild(div);
    });

    document.getElementById('grand-total').innerText = grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function saveToJason() {
    if (currentListItems.length === 0) {
        alert("A lista está vazia!");
        return;
    }

    const jasonObject = {
        createdDate: new Date(),
        items: currentListItems
    };

    // Salva no slot selecionado
    jasonsData[currentJasonIndex] = jasonObject;
    
    // Persiste no LocalStorage do navegador
    localStorage.setItem('jasonsData', JSON.stringify(jasonsData));

    alert(`Lista salva com sucesso no Jason ${currentJasonIndex + 1}!`);
    goToJasonSelection();
}

// --- LÓGICA DA TELA DE ABERTURA ---
function startIntroAnimation() {
    const introScreen = document.getElementById('intro-screen');
    introScreen.classList.add('animate');

    // Espera a animação acabar (1.5s) para esconder a tela
    setTimeout(() => {
        introScreen.style.display = 'none';
    }, 1500); 
}