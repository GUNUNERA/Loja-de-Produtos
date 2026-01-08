const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const db = new sqlite3.Database('./jason_vault.db', (err) => {
    if (err) console.error("ERRO NO BANCO:", err.message);
    else console.log('BANCO DE DADOS: Conectado com sucesso.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS jasons (group_name TEXT, jason_index INTEGER, last_user TEXT, items TEXT, PRIMARY KEY (group_name, jason_index))`);
    db.run(`CREATE TABLE IF NOT EXISTS groups (name TEXT PRIMARY KEY, password TEXT)`);
});

// Rota de teste simples para verificar se o servidor responde
app.get('/ping', (req, res) => res.json({ message: "Servidor está vivo!" }));

app.listen(3001, () => {
    console.log('------------------------------------------');
    console.log('SERVIDOR ATIVO NA PORTA 3001');
    console.log('Acesse no navegador: http://localhost:3001/ping');
    console.log('------------------------------------------');
});