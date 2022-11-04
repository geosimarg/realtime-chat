import express from 'express';
import path from 'path';
import http from 'http';

const cors = require("cors");
const app =  express();

console.log(process.env);

app.set('port_http', process.env.port_http || 8080);
app.set('port_ws', process.env.port_ws || 3001);

app.use(cors());
app.use(express.static(path.join(__dirname, 'public/assets')));
app.set('views', path.join(__dirname, 'public/views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const server = http.createServer(app, {
    cors: {
        origin: "http://localhost:8080"
    }
}).listen(app.get('port_http'), function() {
    console.log("Express server listen on port ".concat(app.get('port_http')));
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
    res.render('index.html');
});