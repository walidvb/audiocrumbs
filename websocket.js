let minClientsCount = 1;
let readyCount = 0;
let clients = [];

const mp3s = ['dimensia.mp3'];
const commonMp3 = 'yaya.mp3';

function setupNewWebSocket(request) {
  const connection = request.accept(null, request.origin);
  clients.push({ connection });
  console.log("New connection, total:", clients.length);
  broadcast({
    command: 'peersCount',
    payload: clients.length,
  })
  const selectedMp3 = mp3s.length == 0 ? commonMp3 : mp3s.pop();
  sendMessage({
    command: 'loadMp3',
    payload: '/images/' + selectedMp3,
  })
  // This is the most important callback for us, we'll handle
  // all messages from users here.
  
  connection.on('message', handleMessage);
  
  connection.on('close', function () {
    clients = clients.filter((conn) => conn.connection != connection);
    readyCount--;
    console.log('lost connection. New ready count:', readyCount)
    broadcast({
      command: 'peersCount',
      payload: clients.length,
    })
  });
  
  
  function handleMessage(message){
    if (message.type === 'utf8') {
      // process WebSocket message
      const data = JSON.parse(message.utf8Data);
      console.log(data, readyCount);
      switch(data.command){
        case 'ready':
        // don't let a client be ready twice
        if(connection.ready){return}
        // if a totalPeers count was sent, set it
        minClientsCount = data.totalPeers || minClientsCount
        console.log("minCli", minClientsCount);
        connection.ready = true
        readyCount++;
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
    con.sendUTF(JSON.stringify(obj));
  }
}

module.exports = setupNewWebSocket;