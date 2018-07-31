// force https, as it doesn't seem to automatically redirect
var secure = /s/.test(location.protocol)
var protocol = secure ? 'wss' : 'ws';
if(!secure && !/localhost/.test(location.host)){
  window.location = 'https://' + location.host;
}
var AUDIO_CRUMBS = 'audio_crumbs';


var state = JSON.parse(localStorage.getItem(AUDIO_CRUMBS));
var id = uuid();
if (!state){
  var state = { id }
  saveState();
}
else{
  console.log(state.sessionId)
  setMp3(state.mp3);
}

var ready = false, 
  player, nativePlayer;

  // if user is running mozilla then use it's built-in WebSocket
window.WebSocket = window.WebSocket || window.MozWebSocket;
// useful for local development
var connection = new WebSocket(protocol + '://' + location.host);

document.onload = function () {
  handleUserReady()


  
  connection.onerror = function (error) {
    console.log('Error connecting to the socket', error);
  };
  connection.onopen = function(){
    sendMessage({ command: 'connected' })
  }
  connection.onmessage = function (message) {
    var data;
    try {
      data = JSON.parse(message.data);
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ',
      message.data, e);
      return;
    }
    handleSession(data.sessionId);
    logToScreen(data);
    console.log(data);
    switch (data.command) {
      case 'loadMp3':
        console.log(state, state.mp3)
        if(state.mp3 === undefined){
          state.mp3 = data.payload.src;
        }
        setMp3(state.mp3)
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
    $('.lds-ellipsis').addClass('finished');
    setTimeout(nativePlayer.play.bind(nativePlayer), 500);
  }


  function handleUserReady(){
    const button = $(".ready-button");
    button.click(beReady)
  }
  function logToScreen(data){
    $('.logger').append($('<div>'+JSON.stringify(data)+'</div>'))
  }
}
function sendMessage(msg) {
  msg.id = state.id;
  connection.send(JSON.stringify(msg))
}

function beReady() {
  var msg = { command: 'ready' };
  ready = true;
  // if the input is present and filled, send the number
  // whoever sends first will remove the others
  var totalPeers = $('#peer-count-input').val();
  if (totalPeers && totalPeers != '') {
    msg.totalPeers = totalPeers;
  }
  sendMessage(msg);
  $('.page').toggleClass('on off');
}
document.onload()


function setMp3(src) {
  player = $('<audio controls><source src="' + src + '"/></audio>');
  nativePlayer = player.get(0);
  nativePlayer.pause();
  player.appendTo('.player-container');
  state.mp3 = src;
  saveState();
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

function handleSession(sessionId){
  if (state.sessionId === undefined){
    console.log("setting", sessionId, state);
    state.sessionId = sessionId;
    saveState();
  }
  else if(state.sessionId !== sessionId){
    localStorage.removeItem(AUDIO_CRUMBS);
    ready = false;
    sendMessage({command: 'connected'})
  }
}
function saveState(){
  localStorage.setItem(AUDIO_CRUMBS, JSON.stringify(state));
}