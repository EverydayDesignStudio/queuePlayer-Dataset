const express = require('express')
var SpotifyWebApi = require('spotify-web-api-node');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var fs= require('fs');
var path = require('path');
var bodyParser = require("body-parser");

var access_token;
var dict = {};
var trackID_tracker = {}
var database = new Array();
var jsonData = new Array();
var intervalDuration = 1000;

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
    clientId: '85b1c7b8639148ac8208202327d7a4cc',
    clientSecret: 'e64bad6b6d35415192c16b69fcc3f4df',
    redirectUri: 'http://localhost:8888/callback'
});

const app = express();
app.use(bodyParser.json());

const directoryPath = './public/NewSpotifyData';

// const files= fs.readdirSync(directoryPath)
// console.log(files.length)
for (let i = 0; i < 4; i++) 
{
  const userPath=directoryPath+'/User'+(i+1);
  // const userPath=directoryPath+'/User4'                   //Change folder name to corresponding user number
  const jsons=fs.readdirSync(userPath)
  for (let j = 0; j < jsons.length; j++)
  {
    var jsonBuffer=require(userPath+'/'+jsons[j]);
    jsonData=jsonData.concat(jsonBuffer);
  }
  segregateDataBy100(jsonData, i+1);
}

// const appendData = require('./Final Database/Final Final/qp_multiuser.json');
// console.log(appendData.length)
// const id_checker = require('./Final Database/Final Final/qp_keys_multiuser.json');
// console.log(Object.keys(id_checker).length);

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
        console.log('Access token:', access_token);
        // res.redirect('/audiofeatures');
      }
  });

function segregateDataBy100(jsonData,id) {
  var trackIdCollection = new Array();
  let count=0;
  let j=0;
  trackIdCollection[0]=new Array();
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
        trackIdCollection[j].push(jsonData[i].spotify_track_uri.split(":")[2]);
        j++;
        trackIdCollection.push(new Array());
        count=0;
      }
      else
      {
        trackIdCollection[j].push(jsonData[i].spotify_track_uri.split(":")[2]);
        count++;
      }
    }
  }
  dict[id] = trackIdCollection;
  return trackIdCollection;
}

app.get('/audiofeatures', (req, res) => {
 
    res.setHeader('Content-Type', 'text/html'); 
      let i=0; 
      let key=4;                                                      //change according to user id
      var intervalID=setInterval(async ()=> {
      
        var me, trk1, trk2;
        try{
          me=await spotifyApi.getAudioFeaturesForTracks(dict[key][i]);
        }
        catch(err){
            console.log(err)
        }
        try{
          trk1=await spotifyApi.getTracks(dict[key][i].slice(0, dict[key][i].length/2));
        }
        catch(err){
            console.log(err)
        }
        try{
          trk2=await spotifyApi.getTracks(dict[key][i].slice(dict[key][i].length/2, dict[key][i].length));
        }
        catch(err){
            console.log(err)
        }

        // me= await spotifyApi.getAudioFeaturesForTracks(trackIdCollection[i]);
        // trk1=await spotifyApi.getTracks(trackIdCollection[i].slice(0, trackIdCollection[i].length/2));
        // trk2=await spotifyApi.getTracks(trackIdCollection[i].slice(trackIdCollection[i].length/2, trackIdCollection[i].length));

        for(let j=0; j<me.body.audio_features.length;j++)
        {
          if(me.body.audio_features[j]!=null && me.body.audio_features[j].speechiness > 0 && me.body.audio_features[j].speechiness < 0.66)
          {
            if(id_checker[me.body.audio_features[j].uri.split(":")[2]]==undefined)
            // if(trackID_tracker[me.body.audio_features[j].uri.split(":")[2]] == undefined) 
            {
              user_list=new Array();
              user_list.push(key)
              // trackID_tracker[me.body.audio_features[j].uri.split(":")[2]] = user_list;
              id_checker[me.body.audio_features[j].uri.split(":")[2]] = user_list;

                if(j>=trk1.body.tracks.length)
                {
                  // database.push({user_id: trackID_tracker[me.body.audio_features[j].uri.split(":")[2]], track_name: trk2.body.tracks[j-trk1.body.tracks.length].name, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: Math.floor(me.body.audio_features[j].tempo), danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, cluster_number:"", cluster_type:""})
                  appendData.push({user_id: id_checker[me.body.audio_features[j].uri.split(":")[2]], track_name: trk2.body.tracks[j-trk1.body.tracks.length].name, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: Math.floor(me.body.audio_features[j].tempo), danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, cluster_number:"", cluster_type:""})
                }
                else
                {
                  // database.push({user_id: trackID_tracker[me.body.audio_features[j].uri.split(":")[2]], track_name: trk1.body.tracks[j].name, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: Math.floor(me.body.audio_features[j].tempo), danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, cluster_number:"", cluster_type:""})
                  appendData.push({user_id: id_checker[me.body.audio_features[j].uri.split(":")[2]], track_name: trk1.body.tracks[j].name, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: Math.floor(me.body.audio_features[j].tempo), danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, cluster_number:"", cluster_type:""})

                }
            }
            else
            {
              // if(!trackID_tracker[me.body.audio_features[j].uri.split(":")[2]].includes(key))
              if(!id_checker[me.body.audio_features[j].uri.split(":")[2]].includes(key))
              {
                // trackID_tracker[me.body.audio_features[j].uri.split(":")[2]].push(key)
                id_checker[me.body.audio_features[j].uri.split(":")[2]].push(key)
                if(j>=trk1.body.tracks.length)
                {
                  // database.push({user_id: trackID_tracker[me.body.audio_features[j].uri.split(":")[2]], track_name: trk2.body.tracks[j-trk1.body.tracks.length].name, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: Math.floor(me.body.audio_features[j].tempo), danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, cluster_number:"", cluster_type:""})
                  appendData.push({user_id: id_checker[me.body.audio_features[j].uri.split(":")[2]], track_name: trk2.body.tracks[j-trk1.body.tracks.length].name, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: Math.floor(me.body.audio_features[j].tempo), danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, cluster_number:"", cluster_type:""})
                }
                else
                {
                  // database.push({user_id: trackID_tracker[me.body.audio_features[j].uri.split(":")[2]], track_name: trk1.body.tracks[j].name, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: Math.floor(me.body.audio_features[j].tempo), danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, cluster_number:"", cluster_type:""})
                  appendData.push({user_id: id_checker[me.body.audio_features[j].uri.split(":")[2]], track_name: trk1.body.tracks[j].name, track_id: me.body.audio_features[j].uri.split(":")[2], tempo: Math.floor(me.body.audio_features[j].tempo), danceability: me.body.audio_features[j].danceability, energy: me.body.audio_features[j].energy, liveness: me.body.audio_features[j].liveness, valence: me.body.audio_features[j].valence, cluster_number:"", cluster_type:""})

                }
              }
            }
          }
        }
        i++;
        console.log("Iteration Done: "+i);
        if(i==dict[key].length)
        {
          // if(key==4)
          // {
            clearInterval(intervalID);
  
            // var keystring=JSON.stringify(trackID_tracker);
            var keystring=JSON.stringify(id_checker);
            fs.writeFileSync('./public/Final Database/keys_multiuser.json', keystring,function(err, result) {
              if(err) console.log('error', err);
            });
  
            // var dictstring=JSON.stringify(database);
            var dictstring=JSON.stringify(appendData);
            fs.writeFile('./public/Final Database/multiuser.json', dictstring, function(err, result) {
              if(err) console.log('error', err);
            });
            
            console.log("Dataset Made for User", key)
            return res.sendStatus(200);
          // }
          // else
          // {
          //   i=0;
          //   key++;
          //   console.log("User Change to ", key)
          // }

        }
      }, intervalDuration);
});  

app.listen(8888, () =>
   console.log(
     'HTTP Server up. Now go to http://localhost:8888/ in your browser.'
   )
 );

