const nicknamePlace = $('#nickname');
const messagePlace = $('#message');
const message = $('#chat-input');

let author = null;

var socket = io(host);

function RenderMessage(m) {
    const msgLine = `<div><strong>${m.author}:&nbsp;</strong>${m.message}</div>`;
    $('#messages').append(msgLine);
}

function SubmitMessage(m) {
    socket.emit('message', m);

    RenderMessage(m);
}

function PreSend() {
    if (author.length > 0 && message.val().length > 0) {
        const messageObject = {
            author,
            message: message.val()
        };

        SubmitMessage(messageObject);
        message.val('');
    }
    return false;
}

$('#btn-nickname').on('click', () => {
    if (nicknamePlace.val().length > 0) {
        author = nicknamePlace.val();
        socket.emit('set-nickname', {
            data: author
        });
        $('#set-nickname').slideUp(() => {
            $('#chat-container').slideDown();
        });
    }
});

socket.on('socket-id', data => {
    console.log(data);
});

socket.on('received-message', (data) => {
    console.log('received-message');
    RenderMessage(data);
});

socket.on('previous-message', (data) => {
    for (const i in data) {
        RenderMessage(data[i]);
    }
});

$('#btn-chat').on('click', () => {
    PreSend();
});

$('#chat-input').keyup((e) => {
    if(e.keyCode == 13) {
        PreSend();
    }
});