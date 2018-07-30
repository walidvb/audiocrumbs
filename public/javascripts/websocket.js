// force https, as it doesn't seem to automatically redirect
var secure = /s/.test(location.protocol)
var protocol = secure ? 'wss' : 'ws';
if(!secure && !/localhost/.test(location.host)){
  window.location = 'https://' + location.host;
}

document.onload = function () {
  handleUserReady()

  // if user is running mozilla then use it's built-in WebSocket
  window.WebSocket = window.WebSocket || window.MozWebSocket;
  // useful for local development
  var connection = new WebSocket(protocol + '://' + location.host);

  connection.onerror = function (error) {
    console.log('Error connecting to the socket', error);
  };

  var player, nativePlayer;
  connection.onmessage = function (message) {
    var data;
    try {
      data = JSON.parse(message.data);
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ',
      message.data, e);
      return;
    }
    console.log("message", message.data);
    logToScreen(data);
    switch (data.command) {
      case 'loadMp3':
        player = $('<audio controls><source src="' + data.payload + '"/></audio>');
        nativePlayer = player.get(0);
        nativePlayer.pause();

        player.appendTo('.player-container');
        return
      case 'peersCount':
        $('.peers-count').html(data.payload.peersCount);
        var minClientsCount = data.payload.minClientsCount;
        $('.peers-min-count').html(minClientsCount);
        var canChangPeersCount = minClientsCount !== undefined;
        $('.input-container').toggle(!canChangPeersCount);
        return;
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
      var msg = { command: 'ready' };

      // if the input is present and filled, send the number
      // whoever sends first will remove the others
      var totalPeers = $('#peer-count-input').val();
      if (totalPeers && totalPeers != ''){
        msg.totalPeers = totalPeers;
      }
      sendMessage(msg);
      $('.page').toggleClass('on off');
    })
  }
  function logToScreen(data){
    $('.logger').append($('<div>'+JSON.stringify(data)+'</div>'))
  }
}
document.onload()
