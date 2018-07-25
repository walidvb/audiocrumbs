
document.onload = function () {
  handleUserReady()

  // if user is running mozilla then use it's built-in WebSocket
  window.WebSocket = window.WebSocket || window.MozWebSocket;

  var connection = new WebSocket('ws://127.0.0.1:1337');

  connection.onopen = function () {
  };

  connection.onerror = function (error) {
    // an error occurred when sending/receiving data
  };

  connection.onmessage = function (message) {
    // try to decode json (I assume that each message
    // from server is json)
    try {
      var data = JSON.parse(message.data);
      console.log(data)
      if (data.command == 'play'){
        play();
      }
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ',
        message.data);
      return;
    }
    // handle incoming message
  };

  function play(){
    mymp3.play();
  }

  function sendMessage(msg){
    connection.send(JSON.stringify(msg))
  }
  function handleUserReady(){
    const button = $(".ready-button");
    button.click(function(){
      sendMessage({ connected: true });
    })
  }
}
document.onload()
