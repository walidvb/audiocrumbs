let openConnectionsCount = 0;
const minConnectionsCount = 2;
function setupWebSocket(request) {

  const connection = request.accept(null, request.origin);

  // This is the most important callback for us, we'll handle
  // all messages from users here.

  connection.on('message', handleMessage);

  connection.on('close', function (connection) {
    openConnectionsCount--;
  });

  function handleMessage(message){
    if (message.type === 'utf8') {
      // process WebSocket message
      const data = JSON.parse(message.utf8Data);
      if(data.connected){
        openConnectionsCount++;
      }
      console.log(openConnectionsCount)
      if (openConnectionsCount >= minConnectionsCount){ 
        sendMessage({ command: 'play' });
      }
  }

  function sendMessage(obj){
    connection.sendUTF(
      JSON.stringify(obj));
    }
  }
}

module.exports = setupWebSocket;