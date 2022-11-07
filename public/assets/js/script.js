const nicknamePlace = $("#nickname");
const messagePlace = $("#message");
const message = $("#chat-input");

const messages = [];

let author = null;
let room = null;
let uid = null;

const livyenSocket = new LivyenSocket({
    host: 'https://livyen-ws-chat1.glitch.me',
    room: 'sala1',
    nickname: 'Ramy Soeg'
});

function RenderMessage(m) {
    const msgLine = `<div><strong>${m.author}:&nbsp;</strong>${m.message}</div>`;
    $("#messages").append(msgLine);
}

function SendMessage() {
    const nMessage = message.val();
    if (livyenSocket.author && nMessage.length > 0) {
        return livyenSocket.SendMessage(nMessage).then(data => {
            console.log(data);
            message.val("");
            RenderMessage(data);
            return true;
        });
    }
    return false;
}

/*$("#select-room-btn").on("click", () => {
    const roomName = $("#select-room").val();
    if (roomName && roomName.length > 0) {
        livyenSocket.JoinRoom(roomName).then(() => {
            room = roomName;
            $("#select-room").val("");
            $("#selectRoom").slideUp(() => {
                $("#chat").slideDown();
            });
        });
    }
});

$("#btn-nickname").on("click", () => {
    if (nicknamePlace.val().length > 0) {
        author = nicknamePlace.val();

        livyenSocket.SetNickName(author);

        $("#set-nickname").slideUp(() => {
            $("#chat-container").slideDown();
        });
    }
});*/

livyenSocket.on("received-message", (data) => {
    console.log("received-message");
    const found = livyenSocket.messages.find(m => m.id == data.id);
    if (!found) {
        RenderMessage(data);
    }
});

livyenSocket.on('id-received', function(data) {
    console.log('id-received', data);
});

$("#btn-chat").on("click", () => {
    SendMessage();
});

$("#chat-input").keyup((e) => {
    if(e.keyCode == 13) {
        SendMessage();
    }
});