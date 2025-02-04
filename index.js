import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import moment from 'moment-timezone';
import cors from 'cors';
import { v4 as uuid4 } from 'uuid';
import os from 'os';
import morgan from "morgan";

const app = express();
const PORT = 3000;
const sessions = {};

app.use(morgan('dev'));
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
// const getClientIp = (req) => {
   // return (
    //    req.headers["x-forwarded-for"] ||
      //  req.connection.remoteAddress ||
      //  req.socket.remoteAddress ||
      //  req.connection.socket?.remoteAddress
    //);
//};

// Función de utilidad que obtiene la IP local
const getClientIP = (req) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               req.connection?.socket?.remoteAddress ||
               "IP no disponible";

    if (ip.startsWith("::ffff:")) {
        return ip.slice(7); 
    }

    return ip;
};


const getServerNetworkInfo = () => {
    const interfaces = os.networkInterfaces();
    for(const name in interfaces){
        for(const iface of interfaces[name]){
            if(iface.family === 'IPv4' && !iface.internal){
                return {
                    serverIp: iface.address,
                    serverMac: iface.mac,
                }
            }
        }
    }
}


app.post("/login", (req, res) => {
    const { nickname, email, macAddress } = req.body;
    const serverInfo = getServerNetworkInfo();

    if (!email || !nickname || !macAddress) {
        return res.status(400).json({
            message: "Se esperan campos requeridos",
        });
    }

    const sessionId = uuidv4();
    const now = new Date();
    const horaMexico = moment(now).tz("America/Mexico_City").format("YYYY-MM-DD HH:mm:ss")
    const ipClient = getClientIP(req)

    sessions[sessionId] = {
        sessionId,
        email,
        nickname,
        macAddress,
        ip: ipClient,
        dateCreated: horaMexico, 
        lastAccessed: horaMexico,
        duration: 0,
        inactivityTime: 0,
        ipServer: serverInfo.serverIp,
        macServer: serverInfo.serverMac,
        status: true
    };

    res.status(200).json({
        message: "Se ha logueado con éxito",
        sessionId,
    });
});

app.post("/logout", (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No se ha encontrado una sesión activa",
        });
    }

    delete sessions[sessionId];
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error al cerrar la sesión");
        }
    });


    res.status(200).json({
        message: "Logout successful",
    });
});

app.put("/update", (req, res) => {
    const { sessionId, email, nickname } = req.body;

    // Validar si la sesión existe antes de acceder a sus propiedades
    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No existe una sesión activa"
        });
    }

    const now = new Date();
    const horaMexico = moment(now).tz("America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");
    
    // Obtener datos de la sesión después de la validación
    const duration = new Date(horaMexico) - new Date(sessions[sessionId].dateCreated);
    const inactivity = new Date(horaMexico) - new Date(sessions[sessionId].lastAccessed);

    console.log(`sessionID: ${sessionId} email: ${email} nickname: ${nickname}`);

    // Actualizar los campos proporcionados
    if (email) sessions[sessionId].email = email;
    if (nickname) sessions[sessionId].nickname = nickname;
    sessions[sessionId].lastAccessed = horaMexico;
    sessions[sessionId].duration = duration;
    sessions[sessionId].inactivityTime = inactivity;

    // Responder con el estado actualizado de la sesión
    res.status(200).json({
        message: "Sesión actualizada exitosamente",
        session: sessions[sessionId]
    });
});

app.get("/status", (req, res) => {
    const sessionId = req.query.sessionId;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({
            message: "No hay sesión activa"
        });
    }

    const now = new Date();
    const horaMexico = moment(now).tz("America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");

    const duration = new Date(horaMexico) - new Date(sessions[sessionId].dateCreated);
    const inactivity = new Date(horaMexico) - new Date(sessions[sessionId].lastAccessed);

    sessions[sessionId].lastAccessed = horaMexico;
    sessions[sessionId].duration = duration;
    sessions[sessionId].inactivityTime = inactivity;

    res.status(200).json({
        message: "Sesión activa",
        session: sessions[sessionId]
    });
});


app.get("/statusAllActives", (req, res) => {
    if (!sessions || Object.keys(sessions).length === 0) {
        return res.status(404).json({
            message: "No hay sesiones activas"
        });
    }

    const activeSessions = Object.entries(sessions).map(([sessionId, sessionData]) => ({
        sessionId,
        sessionData
    }));

    res.status(200).json({
        message: "Listado de sesiones activas",
        activeSessions
    });
});


app.listen(PORT, () => {
    console.log(`Servidor levantado en el puerto ${PORT}`);
});

app.get("/", (req, res)=>{
    return res.status(200).json({
        message:"Bienvenid@ a mi API de control de Sesiones",
        author:"Teresa Vargas Fernández"
    })
});














































// Bienvenida a la API
/*app.get("/welcome", (req, res) => {
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
});*/
