const fetchFiles = require('./fileManager');

let minClientsCount, readyCount, clients;

let files = {custom:[]};


let sessionId;

function init(cb){
  const oldClients = clients;
  fetchFiles(elems => {
    files = elems;
    console.log("Got files: ", files);
    if(cb){
      cb(oldClients);
    }
  });
  sessionId = uuid();
  clients = [];
  readyCount = 0;
  minClientsCount = undefined;
}

init();

function setupNewWebSocket(request) {
  const connection = request.accept(null, request.origin);
  console.log("New connection, total:", clients.length);
  
  sendMessage({
    command: 'peersCount',
    payload: {
      peersCount: readyCount,
      minClientsCount
    },
  });

  
  
  const handlers = {
    connected: function(data){
      const existing = clients.some(c => c.id === data.id);
      if(!existing){
        console.log(files);
        const src = data.mp3 || (files.custom.length === 0 ? files.generic : files.custom.pop());
        clients.push({ connection, src, id: data.id });
        sendMessage({
          command: 'loadMp3',
          payload: {
            src,
          },
        });
      }
    },
    // this currently combines being ready 
    // and handling the number of peers required to start
    ready: function(data){
      // don't let a client be ready twice
      if(connection.ready){return}
      readyCount++;
      connection.ready = true;
      // if a totalPeers count was sent, set it
      minClientsCount = data.totalPeers || minClientsCount
      broadcast({
        command: 'peersCount',
        payload: {
          peersCount: readyCount,
          minClientsCount
        }
      })
      connection.ready = true
      if (readyCount >= minClientsCount){ 
        broadcast({
          command: 'play',
        });
      }
    },
    reset: function(){
      init((oldClients) => {
        console.log("Broadcasting reset")
        broadcast({
          command: 'reset',
        }, oldClients)
      });
    }
  }

  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      // process WebSocket message
      const data = JSON.parse(message.utf8Data);
      console.log(data, readyCount, clients.map(({ id, ready, src }) => ({ id, ready, src })));
      try{
        handlers[data.command](data);
      }
      catch(e){
        console.log("command not found", data);
      }
    }
  });

  connection.on('close', function () {
    console.log('lost connection. New ready count:', readyCount, clients.map(c => ({ id: c.id, ready: c.ready, src: c.src })))
    connection.ready = false;
    readyCount = Math.max(readyCount - 1, 0);
    broadcast({
      command: 'peersCount',
      payload: {
        peersCount: clients.length,
      },
      message: 'Lost a peer',
    })
  });

  function broadcast(msg, clients_ = clients){
    clients_.forEach((client) => sendMessage(msg, client.connection));
  }
  function sendMessage(obj, con = connection){
    obj.sessionId = sessionId;
    con.sendUTF(JSON.stringify(obj));
  }
}


function uuid() {
  var uuid = "", i, random;
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;
    
    if (i == 8 || i == 12 || i == 16 || i == 20) {
      uuid += "-"
    }
    uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
}

module.exports = setupNewWebSocket;