const express = require('express');
const mysql = require('mysql2/promise');
const cr = require('crypto');

const conn = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "escola"
});

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        rotas: {
            "/": "GET - Obtem todas as rotas disponiveis",
            "/login": "POST- Recebe o usuario e senha para autentificar"
        }
    });
});

app.post("/login", async (req, res) => {

    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const { usuario, senha } = req.body;

    const senha_hash = cr.createHash("sha256").update(senha).digest("hex");

    const sql = "SELECT * FROM usuarios_login WHERE nome_usuario = ? AND senha_hash = ?;"

    const [rows] = await conn.query(sql, [usuario, senha_hash]);

    if (rows.length > 0) {
        res.json({ 
             msg: "Autenticação bem sucedida", usuario: rows[0] 
        });
        await registerLogs(usuario, senha_hash, 1, ip);
    } else {
        res.json({ 
            msg: "Usuário ou senha inválidos"
        });
        await registerLogs(usuario, senha_hash, 0, ip);
    }  

});

//Logs
async function registerLogs(usuario, senha_hash, estado, ip) {

    const horario = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const estadoValor = estado === 1 ? 1 : 0; 
    const ip_user = ip.replace(/^.*:/, ''); 

    const logMsg = estadoValor === 1
        ? `Login bem-sucedido para o usuário: ${usuario}, Senha ${senha_hash},`
        : `Tentativa de login falhou. Usuário: ${usuario}, Senha ${senha_hash}`;

    const logs = "INSERT INTO logs_consulta (logs, estado, horario, ip) VALUES (?, ?, ?, ?);"

    await conn.query(logs, [logMsg, estadoValor, horario, ip_user]);
}

const PORT = 3001;
app.listen(PORT, '0.0.0.0');
