const express = require('express')
var SpotifyWebApi = require('spotify-web-api-node');

var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var fs= require('fs');

var access_token;
var af;
var dict = {};
var trackID_tracker = {}
var trackIDCollection = new Array();

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

const app = express();

const jsonData= require('./public/Spotify Data/Samann/endsong_1.json'); 
segregateDataBy100(jsonData)

const appendData = require('./public/Final Database/test.json');
const id_checker = require('./public/Final Database/keys.json');
// console.log(appendData[30])


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

      res.redirect('/audiofeatures');
  });

function segregateDataBy100(jsonData) {
  let count=0;
  let j=0;
  trackIDCollection[0]=new Array();
  console.log(jsonData.length);
  for (let i=0; i<jsonData.length;i++)
  {
    while(i<jsonData.length && jsonData[i].spotify_track_uri==null)
    {
      i++;
    }
    if(i<jsonData.length)
    {
      if(count==99)
      {
        trackIDCollection[j].push(jsonData[i].spotify_track_uri.split(":")[2]);
        j++;
        trackIDCollection.push(new Array());
        count=0;
      }
      else
      {
        trackIDCollection[j].push(jsonData[i].spotify_track_uri.split(":")[2]);
        count++;
      }
    }
    
  }

  return trackIDCollection;

}

app.get('/audiofeatures', (req, res) => {
 
    res.setHeader('Content-Type', 'text/html');
    
    let i=0; 
    var intervalID=setInterval(async ()=> {
      const me= await spotifyApi.getAudioFeaturesForTracks(trackIDCollection[i]);
      for(let j=0; j<me.body.audio_features.length;j++)
      {
        if(me.body.audio_features[j].speechiness > 0 && me.body.audio_features[j].speechiness < 0.66)
        {
          if(id_checker[me.body.audio_features[j].uri.split(":")[2]]==undefined)
          // if(trackID_tracker[me.body.audio_features[j].uri.split(":")[2]] == undefined) 
          {
            // trackID_tracker[me.body.audio_features[j].uri.split(":")[2]] = 1;
            id_checker[me.body.audio_features[j].uri.split(":")[2]] = 1;

            // if(dict[Math.floor(me.body.audio_features[j].tempo)]==undefined)
            if(appendData[Math.floor(me.body.audio_features[j].tempo)]==undefined)
            {
              // dict[Math.floor(me.body.audio_features[j].tempo)] = new Array({user_id: 1, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: me.body.audio_features[j].tempo, danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, mode: me.body.audio_features[j].mode, time_signature: me.body.audio_features[j].time_signature});
              appendData[Math.floor(me.body.audio_features[j].tempo)] = new Array({user_id: 1, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: me.body.audio_features[j].tempo, danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, mode: me.body.audio_features[j].mode, time_signature: me.body.audio_features[j].time_signature});
            }
            else
            {
              // dict[Math.floor(me.body.audio_features[j].tempo)].push({user_id: 1, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: me.body.audio_features[j].tempo, danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, mode: me.body.audio_features[j].mode, time_signature: me.body.audio_features[j].time_signature});
              appendData[Math.floor(me.body.audio_features[j].tempo)].push({user_id: 1, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: me.body.audio_features[j].tempo, danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, mode: me.body.audio_features[j].mode, time_signature: me.body.audio_features[j].time_signature});
            }
          }
        }
      }
      console.log("Iteration Done : " + i);
      i++;
      if(i==trackIDCollection.length)
      {
          clearInterval(intervalID);

          // var keystring=JSON.stringify(trackID_tracker);
          var keystring=JSON.stringify(id_checker);
          fs.writeFileSync('./public/Final Database/keys.json', keystring,function(err, result) {
            if(err) console.log('error', err);
          });

          // var dictstring=JSON.stringify(dict);
          var dictstring=JSON.stringify(appendData);
          fs.writeFile('./public/Final Database/test.json', dictstring, function(err, result) {
            if(err) console.log('error', err);
          });
  
          return res.redirect('/qpInterface');
      }
    }, 1000);

});  


app.get('/qpInterface',(req, res)=>{
    res.sendFile(__dirname + '/public/qpInterface.html');
});


app.listen(8888, () =>
   console.log(
     'HTTP Server up. Now go to http://localhost:8888/ in your browser.'
   )
 );

