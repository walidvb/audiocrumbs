// force https, as it doesn't seem to automatically redirect
var secure = /s/.test(location.protocol)
var protocol = secure ? 'wss' : 'ws';
if(!secure && !/localhost/.test(location.host)){
  window.location = 'https://' + location.host;
}
var AUDIO_CRUMBS = 'audio_crumbs';



var state = JSON.parse(localStorage.getItem(AUDIO_CRUMBS));
console.log(state)
var ready = false, 
  player, nativePlayer;

  // if user is running mozilla then use it's built-in WebSocket
window.WebSocket = window.WebSocket || window.MozWebSocket;
// useful for local development
var connection = new WebSocket(protocol + '://' + location.host);

var id = uuid();
if (!state) {
  var state = { id }
  console.log('new state', state)
  saveState();
}
else {
  console.log(state.id, state.sessionId, state.mp3);
}

$(document).ready(function () {
  handleUserReady()
  setMp3(state.mp3);
  
  var handlers = {
    loadMp3: function(data){
      console.log(state, state.mp3)
      if (state.mp3 === undefined) {
        state.mp3 = data.payload.src;
      }
      setMp3(state.mp3)
    },
    peersCount: function(data){
      $('.peers-count').html(data.payload.peersCount);
      var minClientsCount = data.payload.minClientsCount;
      $('.peers-min-count').html(minClientsCount);
      var canChangPeersCount = minClientsCount !== undefined;
      $('.input-container').toggle(!canChangPeersCount);
    },
    play: function(data){
      play();
    }
  }
  connection.onerror = function (error) {
    console.log('Error connecting to the socket', error);
  };
  connection.onopen = function(){
    sendMessage({ command: 'connected', mp3: state.mp3 })
  }
  connection.onmessage = function (message) {
    var data;
    try {
      data = JSON.parse(message.data);
      console.log(data.command);
      handlers[data.command](data);
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ',
      message.data, e);
      return;
    }
    handleSession(data.sessionId);
    logToScreen(data);
    console.log(data);
    handlers[data.command](data);
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
});

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


function setMp3(src) {
  $('body').append(src)
  player = $('<audio class="debug-on" controls><source src="' + src + '"/></audio>');
  nativePlayer = player.get(0);
  nativePlayer.pause();
  $('.player-container').html(player);
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
    console.log('New Session');
    localStorage.removeItem(AUDIO_CRUMBS);
    ready = false;
    sendMessage({command: 'connected'})
  }
}
function saveState(){
  localStorage.setItem(AUDIO_CRUMBS, JSON.stringify(state));
}