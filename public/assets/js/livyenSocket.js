const LivyenSocket = class {
    events = {};
    socket = null;
    author = null;
    room = null;
    uid = null;
    messages = [];

    constructor(param) {
        this.socket = io(param.host);
        this.author = param.nickname;
        this.room = param.room;
        this.uid = param.uid;
        
        if (param.room) {
            this.JoinRoom(param.room).then(() => {
                if (param.nickname) {
                    this.SetNickName(param.nickname);
                }
            });
        }


        this.socket.on("socket-id", data => {
            this.dispatch("id-received", data);
            this.uid = data.socketId;
        });

        this.socket.on("received-message", (data) => {
            const found = messages.find(m => m.id == data.id);
            if (!found) {
                messages.push(data);
                this.dispatch('received-message', data);
            }
        });

        this.socket.on("previous-message", (data) => {
            console.log('previous-message', data);
            for (const i in data) {
                if (data[i].message == 'join') {
                    data[i].author = data[i].data;
                }
                RenderMessage(data[i]);
            }
        });

        this.socket.on("ping", (data) => {
            console.log('ping', data);
        });

        setInterval(() => {
            const start = Date.now();
          
            this.socket.emit("ping");
        }, 30000);
    }

    JoinRoom(room) {
        return new Promise((resolve, reject) => {
            this.room = room;
            this.socket.emit("subscribe", room, (data) => {
                this.dispatch("joined", data);
                return resolve(true);
            });
        });
    }

    SetNickName(nickname) {
        return new Promise((resolve, reject) => {
            this.socket.emit("set-nickname", {
                room: this.room,
                data: nickname,
                message: 'join'
            }, data => {
                this.author = nickname;
                this.dispatch("nickname-setted", data);
                return resolve(true);
            });
        });
    }

    SendMessage(m) {
        return new Promise((resolve, reject) => {
            const messageObject = {
                id: this.uid.concat(".", Date.now().toString()),
                room: this.room,
                author: this.author,
                message: m
            };
            this.socket.emit("message", messageObject, data => {
                this.messages.push(messageObject);
                return resolve(data);
            });
        });
    }

    dispatch(eventName, data) {
        const event = this.events[eventName];
        if (event) {
            event.fire(data);
        }
    }

    on(eventName, callback) {
        let event = this.events[eventName];
        if (!event) {
            event = new DispatcherEvent(eventName);
            this.events[eventName] = event;
        }
        event.registerCallback(callback);
    }

    off(eventName, callback) {
        const event = this.events[eventName];
        if (event && event.callbacks.indexOf(callback) > -1) {
            event.unregisterCallback(callback);
            if (event.callbacks.length === 0) {
                delete this.events[eventName];
            }
        }
    }

    #clearString(str) {
        str = str.toString().trim();
        return escape(str);
    }
};

class DispatcherEvent {
    constructor(eventName) {
        this.eventName = eventName;
        this.callbacks = [];
    }

    registerCallback(callback) {
        this.callbacks.push(callback);
    }

    unregisterCallback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
        }
    }

     fire(data) {
        const callbacks = this.callbacks.slice(0);
        callbacks.forEach((callback) => {
            callback(data);
        });
    }
}