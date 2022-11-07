const nicknamePlace = $("#nickname");
const messagePlace = $("#message");
const message = $("#chat-input");

const messages = [];

let author = null;
let room = null;
let uid = null;

var socket = io(host);

function RenderMessage(m) {
    const msgLine = `<div><strong>${m.author}:&nbsp;</strong>${m.message}</div>`;
    $("#messages").append(msgLine);
}

function SetROOMName(n) {
    room = n;
    socket.emit("subscribe", n);
    return true;
}

function SubmitMessage(m) {
    socket.emit("message", m);

    RenderMessage(m);
}

function PreSend() {
    if (author.length > 0 && message.val().length > 0) {
        const id = uid.concat(".", Date.now().toString());
        const messageObject = {
            id,
            room,
            author,
            message: message.val()
        };

        messages.push(messageObject);

        SubmitMessage(messageObject);
        message.val("");
    }
    return false;
}

$("#select-room-btn").on("click", () => {
    const roomName = $("#select-room").val();
    if (roomName && roomName.length > 0) {
        if (SetROOMName(roomName)) {
            $("#select-room").val("");
            $("#selectRoom").slideUp(() => {
                $("#chat").slideDown();
            });
        }
    }
});

$("#btn-nickname").on("click", () => {
    if (nicknamePlace.val().length > 0) {
        author = nicknamePlace.val();
        socket.emit("set-nickname", {
            room,
            data: author,
            message: 'join'
        });
        $("#set-nickname").slideUp(() => {
            $("#chat-container").slideDown();
        });
    }
});

socket.on("socket-id", data => {
    console.log(data);
    uid = data.socketId;
});

socket.on("received-message", (data) => {
    console.log("received-message");
    const found = messages.find(m => m.id == data.id);
    if (!found) {
        messages.push(data);
        RenderMessage(data);
    }
});

socket.on("previous-message", (data) => {
    for (const i in data) {
        RenderMessage(data[i]);
    }
});

$("#btn-chat").on("click", () => {
    PreSend();
});

$("#chat-input").keyup((e) => {
    if(e.keyCode == 13) {
        PreSend();
    }
});