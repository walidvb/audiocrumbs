const minConnectionsCount = 2;
let readyCount = 0;
const clients = [];
function setupWebSocket(request) {

  const connection = request.accept(null, request.origin);
  clients.push(connection);
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
      switch(data.command){
        case 'ready':
          readyCount++
          if (readyCount >= minConnectionsCount){ 
            clients.forEach((conn) => sendMessage({ command: 'play' }, conn));
          }
          return
        default:
          console.log('default')
          console.log(data)
      }

  }

  function sendMessage(obj, connection = conn){
    connection.sendUTF(
      JSON.stringify(obj));
    }
  }
}

module.exports = setupWebSocket;