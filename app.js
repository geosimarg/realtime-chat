import express from 'express';
import path from 'path';
import http from 'http';

const cors = require("cors");
const app =  express();

app.set('http_port', process.env.http_port || 8080);
app.set('http_port_public', process.env.KUBERNETES_PORT_443_TCP_PORT || process.env.http_port_public || app.get('http_port'));
app.set('http_host', process.env.http_host || process.env.RENDER_EXTERNAL_URL || 'localhost');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public/assets')));
app.set('views', path.join(__dirname, 'public/views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const corsWhitelist = [
    'http://localhost:'.concat(app.get('http_port')),
    'https://realtime-chat.onrender.com',
    /http(|s)\:\/\/(|[a-z0-9\-]+\.)livyen\.com(|\.br)$/
];

const server = http.createServer(app, {
    cors: {
        origin: function (origin, callback) {
            if (whitelist.indexOf(origin) !== -1) {
              callback(null, true)
            } else {
              callback(new Error('Not allowed by CORS'))
            }
        }
    }
}).listen(app.get('http_port'), function() {
    console.log("Express server listen on port ".concat(app.get('http_port')));
});

const io = require('socket.io')(server);

const messages = {
    _all: [],
    add(m) {
        this._all.push(m);
    },
    all() {
        return this._all;
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
    person.emit('socket-id', {socketId:person.id});
    const previousMessages = messages.all();
    console.log({'previous-message':previousMessages});
    person.emit('previous-message', previousMessages);
}

io.on('connection', (socket) => {
    IoConnection(socket);

    socket.on('message', (mesage) => {
        console.log(mesage);
        messages.add(mesage);
        socket.broadcast.emit('received-message', mesage);
    });
});


app.get('/', (req, res) => {
    res.render('index.html', {host: app.get('http_host'), port: app.get('http_port_public')});
});

app.get('/healthz', (req, res) => {
    res.sendStatus(200);
});