import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import moment from 'moment-timezone';
import cors from 'cors';
import { v4 as uuid4 } from 'uuid';
import os from 'os';

const app = express();
const PORT = 3000;
const sessions = {};

app.use(bodyParser.json());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar la sesión
app.use(
    session({
        secret: "TereVaFer - vida",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 5 * 60 * 1000 },
    })
);

// Función de utilidad que permite acceder a la IP del cliente
const getClientIp = (req) => {
    return (
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket?.remoteAddress
    );
};

// Función de utilidad que obtiene la IP local
const getLocalIp = () => {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
            // IPv4 y no interna (no localhost)
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null; // Retorna null si no encuentra una IP válida
};

// Bienvenida a la API
app.get("/welcome", (req, res) => {
    return res.status(200).json({
        message: "Bienvenido a la API de Control de Sesion.",
        author: "Teresa Vargas Fernández",
    });
});

// Login Endpoint
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
        message: "Se ha logeado con exito",
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
        message: "Logout exitoso",
    });
});

// Actualización de la Sesión
app.put("/update", (req, res) => {
    const { sessionId, email, nickname } = req.body;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No existe una sesión activa",
        });
    }

    if (email) sessions[sessionId].email = email;
    if (nickname) sessions[sessionId].nickname = nickname;
    sessions[sessionId].lastAccess = new Date();

    res.status(200).json({
        message: "Sesión actualizada correctamente.",
        session: {
            sessionId,
            email: sessions[sessionId].email,
            nickname: sessions[sessionId].nickname,
            lastAccess: sessions[sessionId].lastAccess,
        },
    });
});

// Estatus de la sesión
app.get("/status", (req, res) => {
    const sessionId = req.query.sessionId;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No existe sesión activa",
        });
    }

    res.status(200).json({
        message: "Sesión activa",
        session: sessions[sessionId],
    });
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
