import express from 'express'
import session from 'express-session'
import bodyParser from 'body-parser'
import moment from 'moment-timezone'
import cors from 'cors';
import { v4 as uuid4 } from 'uuid'
import os from 'os'

const app = express();
const PORT = 3000;
const sessions = {};


app.use(bodyParser.json());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({extended:true }));

//Configurar la sesion
app.use(
    session({
        secret:"TereVaFer - vida",
        resave:false,
        saveUninitialized:false,
        cookie:{maxAge: 5*60*1000},
    })
);



// Funcion de utilidad que nos permitirá acceder a la información de la interfaz 
const getClientIp = (req) => {
    return (
        req.headers["x-forwarded-fro"] ||
        req.connection.remoteAdress ||
        req.socket.remoteAddress ||
        req.connection.socket?.remoteAddress
    );
};


app.post("/login", (req, res) => {
    const { email, nickname, macAddress } = req.body;

    if (!email || !nickname || !macAddress) {
        return res.status(400).json({ message: "Se esperan campos requeridos" });
    }

    const sessionId = uuid4();
    const now = new Date();

    sessions[sessionId] = {
        sessionId,
        email,
        nickname,
        macAddress,
        ip: getLocalIp(),
        createdAt: now,
        lastAccess: now,
    };

    res.status(200).json({
        message: "Se ha logeado de manera exitosa",
        sessionId,
    });
});

// Logout endpoint
app.post("/logout", (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({ message: "No se ha encontrado una sesión activa" });
    }

    delete sessions[sessionId];
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar la sesión');
        }
    });
    res.status(200).json({
        message: "Logout succesfull",
    });
});

// Actualización de la Sesión
app.put("/update", (req, res) => {
    const { sessionId, email, nickname } = req.body;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No existe una sesión activa" });
    }

    if (email) sessions[sessionId].email = email;
    if (nickname) sessions[sessionId].nickname = nickname;
    sessions[sessionId].lastAccess = new Date();
});

// Estatus de la sesion
app.get("/status", (req, res) => {
    const sessionId = req.query.sessionId;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No existe sesión activa"
        });
    }

    res.status(200).json({
        message: "Sesión activa",
        session: sessions[sessionId]
    });
});

app.listen(PORT, () => {
    console.log(`Servidor levantado en el puerto ${PORT}`);
});
