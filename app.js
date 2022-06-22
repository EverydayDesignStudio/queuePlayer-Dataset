const express = require('express')
var SpotifyWebApi = require('spotify-web-api-node');

var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var fs= require('fs');
var bodyParser = require("body-parser");

const scopes = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
  ];

var spotifyApi = new SpotifyWebApi({
    clientId: 'e5528e5bb8b24755ad89dbc0eae5bea8',
    clientSecret: 'c265137ac990469890c0b7e447d5ca23',
    redirectUri: 'http://localhost:8888/callback'
});

var access_token;

const app = express();
app.use(bodyParser.json());

const { ppid } = require('process');

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
  });
  
app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;
  
    if (error) {
      console.error('Callback Error:', error);
      res.send(`Callback Error: ${error}`);
      return;
    }
  
spotifyApi
      .authorizationCodeGrant(code)
      .then(data => {
        access_token = data.body['access_token'];
        const refresh_token = data.body['refresh_token'];
        const expires_in = data.body['expires_in'];
  
        spotifyApi.setAccessToken(access_token);
        spotifyApi.setRefreshToken(refresh_token);
  
        // console.log('access_token:', access_token);
        // console.log('refresh_token:', refresh_token);
  
        setInterval(async () => {
          const data = await spotifyApi.refreshAccessToken();
          const access_token = data.body['access_token'];
  
          console.log('The access token has been refreshed!');
          console.log('access_token:', access_token);
          spotifyApi.setAccessToken(access_token);
        }, expires_in / 2 * 1000);
      })
      .catch(error => {
        console.error('Error getting Tokens:', error);
        res.send(`Error getting Tokens: ${error}`);
      });

      if(access_token !=null)
      {
        res.redirect('/qpInterface');
      }
  });

app.get('/qpInterface',(req, res)=>{

  res.sendFile(__dirname + '/public/html/qpInterface.html');
    
});

app.get('/getCurrentID', async (req,res) => {

  const playingTrack = await spotifyApi.getMyCurrentPlayingTrack();
  playingID=playingTrack.body.item.id;

  const af= await spotifyApi.getAudioFeaturesForTrack(playingID);
  res.send(af.body);
});


app.post('/playback',async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const play= await spotifyApi.play({
    "uris": req.body.queue
  }).then(function() {
      console.log('Playback started');
    }, function(err) {
      //if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
      console.log('Something went wrong!', err);
  });
});

app.get('/getState', (req, res)=> {
  const si=setInterval(async ()=> {
    const state=spotifyApi.getMyCurrentPlaybackState()
    .then(function(data) {
      // Output items
      var wot=0;
      if(wot==0 && data.body.progress_ms+2000>data.body.item.duration_ms)
      {
        console.log('Finished Playing: ' + data.body.item.name);
        clearInterval(si);
        wot=1;
        res.send({state:"eot"}); 
      }
    }, function(err) {
      console.log('Something went wrong!', err);
    });
  }, 1000);
})

app.get('/getTrackToPlay', (req, res) => {



})

app.listen(8888, () =>
   console.log(
     'HTTP Server up. Now go to http://localhost:8888/ in your browser.'
   )
 );



//////////// Server Helper Functions ///////////

//Use BPM results 
var bpmAdded=0;
var lol=setInterval(function(){
  timeSeconds = new Date();
  millisecondsCurr=timeSeconds.getTime();
  if(endtrack)
  {    
    console.log("EndTrack")
    flg=0;
    trackArr.splice(0,1);
    playSongs(trackArr);
    // add=0;
    bpmAdded=0;
    endtrack=false;
    // trackArr=[];
  }
  if(flag==1 && millisecondsCurr-millisecondsPrev > 1000 * document.getElementById('T_WAIT').value)
  {
      console.log("New BPM Added");
      if(bpmAdded==0)
      {
        console.log("Tracking Song End");
        triggerEndTrack();
        bpmAdded=1;
      }
      testResults(Math.round(bpmAvg),user);
        // trackArr=[];
      add++;
    flag=0;
  }
},1000);

// Reading the JSON file data
var qpDataset;
fetch("../Final Database/multiuser.json")
.then(response => {
  return response.json();
}).then(qpData=>{
  qpDataset=qpData;
})

//Processing the JSON file data
var trackArr=[];
var flg=0
var bpmPrev=0;
var currFeatures;

function testResults(avgBPM, userInterac) {

  document.getElementById('bpm-indicator').style.color="#ffffff";
  console.log("QUEUE UPDATE");
  let bpm = avgBPM;
  if(qpDataset[bpm]!=null)
  {
    fetch("/getCurrentID", {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {

      currFeatures=data;
      // trackArr=[];
      qpDataset[bpm].sort((first,second) => {
        if(document.getElementById('T_TYPE').value=='danceability'){
          return first.danceability - second.danceability;
        }
        else if(document.getElementById('T_TYPE').value=='energy'){
          return first.energy - second.energy;
        }
        else if(document.getElementById('T_TYPE').value=='liveness'){
          return first.liveness - second.liveness;
        }
        else if(document.getElementById('T_TYPE').value=='valence'){
          return first.valence - second.valence;
        }
        else if(document.getElementById('T_TYPE').value=='tempo'){
          return first.tempo - second.tempo;
        }
        else if(document.getElementById('T_TYPE').value=='mode'){
          return first.mode - second.mode;
        }
        else if(document.getElementById('T_TYPE').value=='time_signature'){
          return first.time_signature - second.time_signature;
        }
      });
      qpDataset[bpm].sort((first,second) => {
        if(document.getElementById('T_TYPE').value=='danceability'){
          return (Math.abs(first.danceability-currFeatures.danceability)) - (Math.abs(second.danceability-currFeatures.danceability));
        }
        else if(document.getElementById('T_TYPE').value=='energy'){
          return (Math.abs(first.energy-currFeatures.energy)) - (Math.abs(second.energy-currFeatures.energy));
        }
        else if(document.getElementById('T_TYPE').value=='liveness'){
          return (Math.abs(first.liveness-currFeatures.liveness)) - (Math.abs(second.liveness-currFeatures.liveness));
        }
        else if(document.getElementById('T_TYPE').value=='valence'){
          return (Math.abs(first.valence-currFeatures.valence)) - (Math.abs(second.valence-currFeatures.valence));
        }
        else if(document.getElementById('T_TYPE').value=='tempo'){
          return (Math.abs(first.tempo-currFeatures.tempo)) - (Math.abs(second.tempo-currFeatures.tempo))
        }
        else if(document.getElementById('T_TYPE').value=='mode'){
          return (Math.abs(first.mode-currFeatures.mode)) - (Math.abs(second.mode-currFeatures.mode))
        }
        else if(document.getElementById('T_TYPE').value=='time_signature'){
          return (Math.abs(first.time_signature-currFeatures.time_signature)) - (Math.abs(second.time_signature-currFeatures.time_signature));
        }
      });


      //Choosing the first song for the user interacted
      let l=0;
      while(qpDataset[bpm][l].user_id != userInterac)
      {
        l++;
      }
      var temp=qpDataset[bpm].splice(0,l);
      qpDataset[bpm].concat(temp);

      createQueueTable();

      var chk=0;
      for(let i=0;i<qpDataset[bpm].length;i++)
      {
        if(add>1)
        {
          if(chk==0)
          {
            console.log("New Queue in the Making");
            trackArr.splice(add-1,trackArr.length-1);
            qply.splice(add-1,qply.length-1);
            chk=1;
          }
          qply.push(qpDataset[bpm][i]);
          trackArr.push("spotify:track:"+qpDataset[bpm][i].track_id);
        }
        else
        {
          console.log("When no queue is made");
          qply.push(qpDataset[bpm][i]);
          trackArr.push("spotify:track:"+qpDataset[bpm][i].track_id);
          if(i == qpDataset[bpm].length-1)
          {
            flg=0;
            playSongs(trackArr);
          }
        }
        // appendTracks(qpDataset[bpm][i]);
      }

      for(let i=0; i<qply.length; i++)
      {
        appendTracks(qply[i]);
      }
    });
  }
}