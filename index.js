
const express = require('express');
const crypto = require('crypto'); // Adicionado o módulo crypto
const mysql = require('mysql2/promise');


const conn = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: "",
      database: "escola"
});

const app = express();
app.use(express.json());

const PORT = 3001;
app.listen(PORT, '0.0.0.0');

app.get("/", (req, res) => {
     res.json({
        rotas: {
            "/": "GET - obtém todas as rotas disponiveis",
            "/login": "POST - Recebe usuario e senha para autenticar"
        }
     });
});

app.post("/login", async (req, res) => {
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const { usuario, senha } = req.body;
        const hash = crypto.createHash("sha256").update(senha).digest("hex"); // Corrigido o algoritmo e método

        const sql = "SELECT * FROM usuarios_login WHERE nome_usuario = ? AND senha_hash = ?"; // Corrigido o nome do campo
        const [rows] = await conn.execute(sql, [usuario, hash]);

        if (rows.length > 0) {
            res.json({
                mensagem: "Deu certo",usuario: rows[0] 
            });
            await registerlogin(usuario, hash, 1, ip);
        } else {
            res.status(401).json({ mensagem: "Usuário ou senha inválidos" });
            await registerlogin(usuario, hash, 0, ip);
        
        async function registerlogin(usuario, senha_hash, estado, ip)  {
            // Garantindo que `horario` seja definido corretamente
            const horario = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
            const estadoValor = estado === 1 ? 1: 0;
            const ip_user = ip.replace(/^.*:/, ''); // Corrigido para evitar erros

            const logMsg = estado === 1
            ? `Login Deu certo para o usúario: ${usuario}, Senha ${senha_hash},`
            : `Tentativa de Login falhou para o usúario: ${usuario}, Senha ${senha_hash}`;

            const Logs = "INSERT INTO logs_consulta (logs, estado, horario) VALUES (?, ?, ?)"; // Removida a coluna `id` da consulta SQL
          
            await conn.query(Logs, [logMsg, estadoValor, horario, ip_user]); // Ajustada a chamada para refletir a remoção da coluna `id`
        }
});
