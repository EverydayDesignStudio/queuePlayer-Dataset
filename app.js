const express = require('express')
var SpotifyWebApi = require('spotify-web-api-node');

var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var access_token;
var af;
var dict = {};

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

const jsonData= require('./AddedToCollection.json'); 


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
  
        // console.log(
        //   `Sucessfully retreived access token. Expires in ${expires_in} s.`
        // );

        res.redirect('/audiofeatures');
  
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
  });

function getAudioFeatures() {
    (async () => {
      const me= await spotifyApi.getAudioFeaturesForTrack('1dtx9AyVFLG001tZ6aNIAf');
    })().catch(e => {
      console.error(e);
    });
}

app.get('/audiofeatures', (req, res) => {
    
    res.setHeader('Content-Type', 'text/html');
    let i=0;
    var intervalID=setInterval(async ()=> {
        const me= await spotifyApi.getAudioFeaturesForTrack(jsonData[i].message_item_uri.split(":")[2]);
        console.log(i+" : "+me.body.tempo);
        i++;

        res.write('<h1>Track ID#: ' + jsonData[i].message_item_uri.split(":")[2] +' | Tempo: '+ me.body.tempo + '</h1>');

        if(i==jsonData.length)
        {
            clearInterval(intervalID);
            res.end();
        }
    }, 1000);


  });  

app.listen(8888, () =>
   console.log(
     'HTTP Server up. Now go to http://localhost:8888/ in your browser.'
   )
 );

