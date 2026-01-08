const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

// Configurações para o servidor entender JSON e aceitar conexões do seu site
app.use(express.json());
app.use(cors());

// Conecta ao banco de dados (Cria o arquivo jason_vault.db automaticamente na pasta)
const db = new sqlite3.Database('./jason_vault.db', (err) => {
    if (err) console.error("Erro ao abrir banco:", err.message);
    else console.log('Banco de dados SQLite pronto.');
});

// Criação da tabela (A "estante" onde os Jasons ficam guardados)
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS jasons (
        group_name TEXT,
        jason_index INTEGER,
        last_user TEXT,
        items TEXT,
        PRIMARY KEY (group_name, jason_index)
    )`);
});

// --- ROTAS (Comandos que o seu site envia) ---

// 1. SALVAR OU ATUALIZAR: "INSERT OR REPLACE" faz o trabalho de atualizar se já existir
app.post('/save-jason', (req, res) => {
    const { group_name, jason_index, last_user, items } = req.body;
    const sql = `INSERT OR REPLACE INTO jasons (group_name, jason_index, last_user, items) VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [group_name, jason_index, last_user, JSON.stringify(items)], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Sincronizado com o Banco de Dados!" });
    });
});

// 2. CARREGAR: Busca todos os Jasons de um grupo específico (Compartilhado ou Privado)
app.get('/load-group/:name', (req, res) => {
    const sql = `SELECT * FROM jasons WHERE group_name = ?`;
    db.all(sql, [req.params.name], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. DELETAR: Remove a linha específica do banco de dados
app.delete('/delete-jason', (req, res) => {
    const { group_name, jason_index } = req.body;
    const sql = `DELETE FROM jasons WHERE group_name = ? AND jason_index = ?`;
    
    db.run(sql, [group_name, jason_index], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Removido do Banco de Dados!" });
    });
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log('=========================================');
    console.log('   SERVIDOR GN ONLINE: http://localhost:3000');
    console.log('   MANTENHA ESTA JANELA ABERTA');
    console.log('=========================================');
});