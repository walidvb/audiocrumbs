const minConnectionsCount = 2;
let readyCount = 0;
const clients = [];

const mp3s = ['dimensia.mp3'];
const commonMp3 = 'yaya.mp3';

function setupNewWebSocket(request) {
  const connection = request.accept(null, request.origin);
  clients.push({ connection });
  
  const selectedMp3 = mp3s.length == 0 ? commonMp3 : mp3s.pop();
  sendMessage({
    command: 'loadMp3',
    src: '/images/' + selectedMp3,
  })
  // This is the most important callback for us, we'll handle
  // all messages from users here.
  
  connection.on('message', handleMessage);
  
  connection.on('close', function (connection) {
    clients.filter((conn) => conn = connection);
  });
  
  
  function handleMessage(message){
    if (message.type === 'utf8') {
      // process WebSocket message
      const data = JSON.parse(message.utf8Data);
      console.log(data);
      switch(data.command){
        case 'ready':
        readyCount++
        if (readyCount >= minConnectionsCount){ 
          clients.forEach((client) => sendMessage({ 
            command: 'play', 
          }, client.connection));
        }
        return
        default:
        console.log('default')
        console.log(data)
      }
      
    }
    
  }
  function sendMessage(obj, con = connection){
    con.sendUTF(JSON.stringify(obj));
  }
}

module.exports = setupNewWebSocket;