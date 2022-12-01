import express from 'express';
import path from 'path';
import http from 'http';

const cors = require("cors");
const app =  express();
const jwt = require('jsonwebtoken');

app.set('SECRET', process.env.SECRET || 'qC83KJXtmmG0SyNORxw/UtpJPYXF5DNpoDmV827FjaI=');
app.set('http_port', process.env.http_port || 8080);
app.set('http_port_public', process.env.KUBERNETES_PORT_443_TCP_PORT || process.env.http_port_public || app.get('http_port'));
app.set('http_host', process.env.http_host || process.env.RENDER_EXTERNAL_URL || 'localhost');

app.use(express.static(path.join(__dirname, 'public/assets')));
app.use(cors());
app.set('views', path.join(__dirname, 'public/views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const corsWhitelist = [
    /http(|s)\:\/\/localhost(|\:[0-9]{2,6})$/,
    'https://realtime-chat.onrender.com'
];

const httpServer = http.createServer(app).listen(8080, function() {
    console.log("Express server listen on port ".concat(8080));
});

function VerifyJWT(token){
    if (!token) {
        console.log('Falta token');
        return null;
    }
    
    return jwt.verify(token, app.get('SECRET'), function(err, decoded) {
        if (err) {
            return null;
        }
        return decoded;
    });
}

const io = require('socket.io')(httpServer, {
    cors: {
        allowedHeaders: ['Origin', 'X-Requeseted-With', 'Content-Type', 'Accept', 'Authorization'],
        origin: corsWhitelist,
        credentials: true,
        withCredentials: true
    }
});

const messages = {
    _all: [],
    add(m) {
        this._all.push(m);
    },
    all() {
        return this._all;
    },
    allFromRoom(r) {
        const ret = this._all.filter(m => {
            if (m.room == r) {
                return m;
            }
        });

        return ret;
    }
};

const audience = {
    _all: [],
    _NewAudience(a){
        return {
            SendMessage(target, chanel, message) {
                target.emit(chanel, message);
            }
        }
    },
    new(a) {
        this._all.push(this._NewAudience(a));
    }
};

function IoConnection(person) {
    console.log(`New connection socket.id: ${person.id}`);
    person.emit('socket-id', {
        socketId: person.id
    });
}

function IoSubscription(socket, data) {
    if (data.token) {
        const decoded = VerifyJWT(data.token);
        if (decoded) {
            console.log(socket.id.concat(' joined at room ', decoded.room));
            socket.join(decoded.room);
            const previousMessages = messages.allFromRoom(decoded.room);
            console.log({'previous-message' : previousMessages});
            io.sockets.in(decoded.room).emit('previous-message', previousMessages);
            return true;
        }
    }
}

io.on('connection', (socket) => {
    IoConnection(socket);

    socket.on('subscribe', (room, callback) => {
        if (IoSubscription(socket, room)) {
            if (typeof callback === "function") callback('joined');
        }
    });

    socket.on('unsubscribe', function(data) {  
        console.log('leaving room', data.room);
        socket.leave(data.room); 
    });

    socket.on('set-nickname', (data, callback) => {
        if (data.token) {
            const decoded = VerifyJWT(data.token);
            if (decoded) {
                console.log('set-nickname '.concat(decoded.username, ' to ', socket.id));
                messages.add({
                    id: socket.id.concat('.', new Date().getTime()),
                    author: decoded.username,
                    room: decoded.room,
                    message: data.message
                });
                io.sockets.in(decoded.room).emit('joinned-user', data);
                if (typeof callback === "function") callback('nickname-setted');
            }
        }
    });

    socket.on('message', (data, callback) => {
        console.log('Message received:', data);
        if (data.token) {
            const decoded = VerifyJWT(data.token);
            if (decoded) {
                messages.add({
                    id: data.id,
                    author: decoded.username,
                    room: decoded.room,
                    message: data.message
                });
                delete data.token;
                if (typeof callback === "function") callback(data);
                io.to(decoded.room).emit('received-message', data);
            }
        }
    });
  
    socket.on('ping', (data, callback) => {
      if (typeof callback === "function") callback('pong');
    });
    socket.on('pong', (data, callback) => {
      if (typeof callback === "function") callback();
    });
});

app.get('/', (req, res) => {
    res.render('index.html', {host: app.get('http_host'), port: app.get('http_port_public')});
});

app.get('/healthz', (req, res) => {
    res.sendStatus(200);
});