
document.onload = function () {
  handleUserReady()

  // if user is running mozilla then use it's built-in WebSocket
  window.WebSocket = window.WebSocket || window.MozWebSocket;

  var connection = new WebSocket('ws://127.0.0.1:1337');

  connection.onerror = function (error) {
    // an error occurred when sending/receiving data
  };

  var player, nativePlayer;
  connection.onmessage = function (message) {
    console.log("message", message)
    var data;
    try {
      data = JSON.parse(message.data);
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ',
        message.data, e);
      return;
    }
    console.log(typeof data, data)
    switch (data.command) {
      case 'loadMp3':
        player = $('<audio controls><source src="' + data.src + '"/></audio>');
        nativePlayer = player.get(0);
        nativePlayer.pause();

        player.appendTo('.player-container');
        return
      case 'play':
        play();
        return
      default:
        console.log('default')
    }
    if (data.command == 'play') {
      play();
    }
    // handle incoming message
  };

  function play(){
    nativePlayer.play();
  }

  function sendMessage(msg){
    connection.send(JSON.stringify(msg))
  }
  function handleUserReady(){
    const button = $(".ready-button");
    button.click(function(){
      sendMessage({ command: 'ready' });
    })
  }
}
document.onload()
