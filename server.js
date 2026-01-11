const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const db = new sqlite3.Database('./jason_vault.db');

db.serialize(() => {
    // Tabela de Jasons
    db.run(`CREATE TABLE IF NOT EXISTS jasons (mode TEXT, group_name TEXT, jason_index INTEGER, data TEXT, PRIMARY KEY (mode, group_name, jason_index))`);
    // NOVA: Tabela de Grupos e Senhas
    db.run(`CREATE TABLE IF NOT EXISTS groups (name TEXT PRIMARY KEY, password TEXT)`);
});

// ROTA DE AUTH (Modificada)
app.post('/auth-group', (req, res) => {
    const { name, password, action } = req.body;
    db.get(`SELECT * FROM groups WHERE name = ?`, [name], (err, group) => {
        if (err) return res.status(500).json(err);
        
        if (action === 'create') {
            if (group) return res.status(400).json({ error: "Este grupo já existe!" });
            db.run(`INSERT INTO groups (name, password) VALUES (?, ?)`, [name, password], (err) => {
                if (err) return res.status(500).json(err);
                res.json({ success: true });
            });
        } else {
            if (!group || group.password !== password) {
                return res.status(401).json({ error: "Senha incorreta ou grupo inexistente!" });
            }
            res.json({ success: true });
        }
    });
});

app.get('/load/:mode/:group', (req, res) => {
    const { mode, group } = req.params;
    db.all(`SELECT * FROM jasons WHERE mode = ? AND group_name = ?`, [mode, group], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows || []);
    });
});

app.post('/save', (req, res) => {
    const { mode, group_name, jason_index, data } = req.body;
    db.run(`INSERT OR REPLACE INTO jasons VALUES (?, ?, ?, ?)`, [mode, group_name, jason_index, JSON.stringify(data)], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

app.post('/delete', (req, res) => {
    const { mode, group_name, jason_index } = req.body;
    db.run(`DELETE FROM jasons WHERE mode = ? AND group_name = ? AND jason_index = ?`, [mode, group_name, jason_index], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true });
    });
});

app.listen(3001, () => console.log("SERVIDOR ONLINE NA 3001"));
// 1. No topo, onde você cria as tabelas, adicione esta linha:
db.run(`CREATE TABLE IF NOT EXISTS groups (name TEXT PRIMARY KEY, password TEXT)`);

// 2. Adicione esta rota para o site conferir a senha:
app.post('/auth-group', (req, res) => {
    const { name, password, action } = req.body; // Agora recebemos a ação (create ou login)

    db.get(`SELECT * FROM groups WHERE name = ?`, [name], (err, group) => {
        if (err) return res.status(500).json(err);

        if (action === 'create') {
            // Se for para CRIAR e já existir, ele avisa
            if (group) {
                return res.status(400).json({ error: "Este nome de grupo já está em uso!" });
            }
            // Se for novo, ele cria
            db.run(`INSERT INTO groups (name, password) VALUES (?, ?)`, [name, password], (err) => {
                if (err) return res.status(500).json(err);
                return res.json({ success: true });
            });
        } else {
            // Se for para ENTRAR (Login)
            if (!group) {
                return res.status(404).json({ error: "Grupo não encontrado! Crie-o primeiro." });
            }
            if (group.password === password) {
                return res.json({ success: true });
            } else {
                return res.status(401).json({ error: "Senha incorreta para este grupo!" });
            }
        }
    });
});