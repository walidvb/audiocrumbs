let minClientsCount;
let readyCount = 0;
let clients = [];

const mp3s = ['dimensia.mp3', 'dimensia.mp3'];
const commonMp3 = 'yaya.mp3';
let sessionId = uuid();

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
  // This is the most important callback for us, we'll handle
  // all messages from users here.
  
  connection.on('message', handleMessage);
  
  connection.on('close', function () {
    connection.ready = false;
    readyCount = Math.max(readyCount - 1, 0);
    console.log('lost connection. New ready count:', readyCount)
    broadcast({
      command: 'peersCount',
      payload: {
        peersCount: clients.length,
      },
      message: 'Lost a peer',
    })
  });
  
  
  function handleMessage(message){
    if (message.type === 'utf8') {
      // process WebSocket message
      const data = JSON.parse(message.utf8Data);
      console.log(data, readyCount, clients.map(({id, ready, mp3}) => ({id, ready, mp3})));
      switch(data.command){
        case 'connected':
          const existing = clients.some(c => c.id === data.id);
          if(!existing){
            const mp3 = data.mp3 || (mp3s.length == 0 ? commonMp3 : mp3s.pop());
            clients.push({ connection, mp3, id: data.id });
            sendMessage({
              command: 'loadMp3',
              payload: {
                src: '/images/' + mp3,
              },
            });
          }
          return;
        // this currently combines being ready 
        // and handling the number of peers required to start
        case 'ready':
        // don't let a client be ready twice
        if(connection.ready){return}
        readyCount++;
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
        return
        default:
        console.log('default')
        console.log(data)
      }
      
    }
  }
  function broadcast(msg){
    clients.forEach((client) => sendMessage(msg, client.connection));
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