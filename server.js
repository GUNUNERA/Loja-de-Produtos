const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const db = new sqlite3.Database('./jason_vault.db');

db.serialize(() => {
    // Tabela para os Jasons (Shared ou Private)
    db.run(`CREATE TABLE IF NOT EXISTS jasons (
        mode TEXT, 
        group_name TEXT, 
        jason_index INTEGER, 
        data TEXT, 
        PRIMARY KEY (mode, group_name, jason_index)
    )`);
});

// Carregar Jasons
app.get('/load/:mode/:group', (req, res) => {
    const { mode, group } = req.params;
    db.all(`SELECT * FROM jasons WHERE mode = ? AND group_name = ?`, [mode, group], (err, rows) => {
        if (err) return res.status(500).send(err);
        res.json(rows);
    });
});

// Salvar ou Atualizar Jason
app.post('/save', (req, res) => {
    const { mode, group_name, jason_index, data } = req.body;
    db.run(`INSERT OR REPLACE INTO jasons VALUES (?, ?, ?, ?)`, 
    [mode, group_name, jason_index, JSON.stringify(data)], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// Resetar/Apagar Jason
app.post('/delete', (req, res) => {
    const { mode, group_name, jason_index } = req.body;
    db.run(`DELETE FROM jasons WHERE mode = ? AND group_name = ? AND jason_index = ?`, 
    [mode, group_name, jason_index], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

app.listen(3001, () => console.log("Servidor Jason Ativo na 3001"));