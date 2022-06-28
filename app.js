//Depedency variables
const express = require('express')
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var fs= require('fs');
var bodyParser = require("body-parser");
var SpotifyWebApi = require('spotify-web-api-node');

//Scope Definition for Spotify WebAPI calls
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

//Initialising the SpotifyAPI node package
var spotifyApi = new SpotifyWebApi({
    clientId: 'e5528e5bb8b24755ad89dbc0eae5bea8',
    clientSecret: 'c265137ac990469890c0b7e447d5ca23',
    redirectUri: 'http://localhost:8888/callback'
});

var access_token;

//Initialising the express server
const app = express();
app.use(bodyParser.json());
const { ppid } = require('process');

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

//Authorization flow for the Spotify API 
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

app.post('/getTrackToPlay', (req, res) => {
  var trackInfos = readDatabase();
  var bpmData=getDatafromBPM(trackInfos, req.body.bpm);
  var songAddition = processDatabase(bpmData, req.body.userID);
  queue=songAddition;
  res.send(queue.shift());
})

app.post('/getTrackToQueue',(req, res)=>{
  var trackInfos = readDatabase();
  var bpmData=getDatafromBPM(trackInfos, req.body.bpm);
  var songAddition = processDatabase(bpmData, req.body.userID);
  queue.splice(req.body.offset,queue.length-req.body.offset);
  queue=queue.concat(songAddition);
  res.send(queue);
})

app.post('/continuePlaying', (req, res)=>{
  res.send(queue.shift());
})

app.post('/playback',async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const play= await spotifyApi.play({
    "uris": req.body.song,
  }).then(function() {
      console.log('Playback started');
    }, function(err) {
      //if the user making the request is non-premium, a 403 FORBIDDEN response code will be returned
      console.log('Something went wrong!', err);
  });
});

app.get('/getState', (req, res)=> {
    const state=spotifyApi.getMyCurrentPlaybackState()
    .then(function(data) {
      if(data.body.is_playing)
      {
        var wot=0;
        if(wot==0 && data.body.progress_ms+2000>data.body.item.duration_ms)
        {
          wot=1;
          console.log('Finished Playing: ' + data.body.item.name);
          res.send({state:"ended"}); 
        }
        else
        {
          res.send({state:"playing"});
        }
      }
    }, function(err) {
      console.log('Something went wrong!', err);
    });
})

app.listen(8888, () =>
   console.log(
     'HTTP Server up. Now go to http://localhost:8888/ in your browser.'
   )
 );

//////////// Server Helper Functions ///////////

var queue = []; 

// Reading the JSON file data
function readDatabase()
{
  var qpDataset=require("./Final Database/Final Final/qp_multiuser.json");
  return qpDataset;
}

function getDatafromBPM(qpData, bpm)
{
  //Handling the case when the specified bpm is not present and then the next lowest bpm is selected
  var qpBPMData=new Array();
  while(qpBPMData.length == 0)
  {
    for(let i=0;i<qpData.length;i++)
    {
      if(qpData[i].tempo==bpm)
      {
        qpBPMData.push(qpData[i]);
      }
    }
    bpm--;
  }
  return qpBPMData;
}

//Processing the JSON file data
function processDatabase(qpData,user)
{
  //Include Song Selection Algorithm

  //Sorting data according to danceability for now , until song selection algorithm
  qpData.sort((first,second) => {
      return first.danceability - second.danceability;
  });

  //Choosing the first song for the user interacted
  let l=0;
  while(!qpData[l].user_id.includes(user))
  {
    l++;
  }
  var temp=qpData.splice(0,l);
  qpData=qpData.concat(temp);

  return qpData;
}

// var trackArr=[];
// var flg=0
// var bpmPrev=0;
// var currFeatures;

// function testResults(avgBPM, userInterac) {

//   document.getElementById('bpm-indicator').style.color="#ffffff";
//   console.log("QUEUE UPDATE");
//   let bpm = avgBPM;
//   if(qpDataset[bpm]!=null)
//   {
//     fetch("/getCurrentID", {
//       method: "GET",
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//       }
//     })
//     .then(response => response.json())
//     .then(data => {

//       currFeatures=data;
//       // trackArr=[];
//       qpDataset[bpm].sort((first,second) => {
//         if(document.getElementById('T_TYPE').value=='danceability'){
//           return first.danceability - second.danceability;
//         }
//         else if(document.getElementById('T_TYPE').value=='energy'){
//           return first.energy - second.energy;
//         }
//         else if(document.getElementById('T_TYPE').value=='liveness'){
//           return first.liveness - second.liveness;
//         }
//         else if(document.getElementById('T_TYPE').value=='valence'){
//           return first.valence - second.valence;
//         }
//         else if(document.getElementById('T_TYPE').value=='tempo'){
//           return first.tempo - second.tempo;
//         }
//         else if(document.getElementById('T_TYPE').value=='mode'){
//           return first.mode - second.mode;
//         }
//         else if(document.getElementById('T_TYPE').value=='time_signature'){
//           return first.time_signature - second.time_signature;
//         }
//       });
//       qpDataset[bpm].sort((first,second) => {
//         if(document.getElementById('T_TYPE').value=='danceability'){
//           return (Math.abs(first.danceability-currFeatures.danceability)) - (Math.abs(second.danceability-currFeatures.danceability));
//         }
//         else if(document.getElementById('T_TYPE').value=='energy'){
//           return (Math.abs(first.energy-currFeatures.energy)) - (Math.abs(second.energy-currFeatures.energy));
//         }
//         else if(document.getElementById('T_TYPE').value=='liveness'){
//           return (Math.abs(first.liveness-currFeatures.liveness)) - (Math.abs(second.liveness-currFeatures.liveness));
//         }
//         else if(document.getElementById('T_TYPE').value=='valence'){
//           return (Math.abs(first.valence-currFeatures.valence)) - (Math.abs(second.valence-currFeatures.valence));
//         }
//         else if(document.getElementById('T_TYPE').value=='tempo'){
//           return (Math.abs(first.tempo-currFeatures.tempo)) - (Math.abs(second.tempo-currFeatures.tempo))
//         }
//         else if(document.getElementById('T_TYPE').value=='mode'){
//           return (Math.abs(first.mode-currFeatures.mode)) - (Math.abs(second.mode-currFeatures.mode))
//         }
//         else if(document.getElementById('T_TYPE').value=='time_signature'){
//           return (Math.abs(first.time_signature-currFeatures.time_signature)) - (Math.abs(second.time_signature-currFeatures.time_signature));
//         }
//       });


//       //Choosing the first song for the user interacted
//       let l=0;
//       while(qpDataset[bpm][l].user_id != userInterac)
//       {
//         l++;
//       }
//       var temp=qpDataset[bpm].splice(0,l);
//       qpDataset[bpm].concat(temp);

//       createQueueTable();

//       var chk=0;
//       for(let i=0;i<qpDataset[bpm].length;i++)
//       {
//         if(add>1)
//         {
//           if(chk==0)
//           {
//             console.log("New Queue in the Making");
//             trackArr.splice(add-1,trackArr.length-1);
//             qply.splice(add-1,qply.length-1);
//             chk=1;
//           }
//           qply.push(qpDataset[bpm][i]);
//           trackArr.push("spotify:track:"+qpDataset[bpm][i].track_id);
//         }
//         else
//         {
//           console.log("When no queue is made");
//           qply.push(qpDataset[bpm][i]);
//           trackArr.push("spotify:track:"+qpDataset[bpm][i].track_id);
//           if(i == qpDataset[bpm].length-1)
//           {
//             flg=0;
//             playSongs(trackArr);
//           }
//         }
//         // appendTracks(qpDataset[bpm][i]);
//       }

//       for(let i=0; i<qply.length; i++)
//       {
//         appendTracks(qply[i]);
//       }
//     });
//   }
// }