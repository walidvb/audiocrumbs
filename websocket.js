require('console.table');
const fetchFiles = require('./fileManager');

let minClientsCount, readyCount, clients;

let files = {custom:[]};


let sessionId;

function init(cb){
  const oldClients = clients;
  fetchFiles(elems => {
    files = elems;
    console.log("Got files: ", files);
    clients = [];
    sessionId = uuid();
    readyCount = 0;
    minClientsCount = undefined;
    if(cb){
      cb(oldClients);
    }
  });
}

init();

function setupNewWebSocket(request) {
  const connection = request.accept(null, request.origin);
  let ready = false;
  console.log("New connection, total:", clients.length + 1);
  clients.push({connection});
  broadcast({
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
        const src = data.mp3 || (files.custom.length === 0 ? files.generic : files.custom.shift());
        clients.forEach(c => {
          if(c.connection === connection){
            c.id = data.id;
            c.ready = false;
            console.log('one more ready')
          }
        })
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
      ready = true;
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
        ready = false;
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
      Object.keys(handlers);
      try{
        handlers[data.command](data);
      }
      catch(e){
        console.log("command not found", data, e);
      }
      console.log(data.command, data.id, readyCount)
      console.table(clients.map(({ id, ready, src }) => ({ id, ready, src })));
      console.log("=========")
    }
  });

  connection.on('close', function () {
    connection.ready = false;
    readyCount = Math.max(readyCount - 1, 0);
    clients = clients.filter(c => c.connection !== connection)
    console.log('lost connection. New ready count:', readyCount, clients.map(c => ({ id: c.id, ready: c.ready, src: c.src })))
    broadcast({
      command: 'peersCount',
      payload: {
        peersCount: readyCount,
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