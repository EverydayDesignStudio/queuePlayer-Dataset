//Dev Variables
var user;
var playerID;
var trackArr=new Array();
var isPlaying=false;
var add=0;

//Input Control
window.addEventListener('keydown', function (e) {
  console.log(e.key)
  if(e.key==1)
  {
    user=1;
    tapBPM(user);
  }
  else if(e.key==2)
  {
    user=2;
    tapBPM(user);
  }
  else if(e.key==3)
  {
    user=3;
    tapBPM(user);
  }
  else if(e.key==4)
  {
    user=4;
    tapBPM(user);
  }
  else
  {
    user=0;
    alert("Invalid key");
  }
}, false);

//TapBPM control variables
var count=0;
var millisecondsFirst=0;
var millisecondsPrev=0;
var millisecondsCurr=0;
var bpmAvg=0;
var flag=0;

function resetCount(){
  count=0;
}

function tapBPM(userInterac){
  flag=1;
  document.getElementById('user-indicator').innerHTML = "User: "+userInterac;
  setUserColor(userInterac);
  document.getElementById('T_WAIT').blur();
  timeSeconds = new Date();
  millisecondsCurr=timeSeconds.getTime();
  if(millisecondsCurr-millisecondsPrev > 1000 * document.getElementById('T_WAIT').value)
  {
    count=0;
  }
  if(count==0)
  {
    document.getElementById('bpm-indicator').innerHTML = "-";
    millisecondsFirst=millisecondsCurr;
    count = 1;
  }
  else
  {
    bpmAvg=60000*count/(millisecondsCurr-millisecondsFirst);
    document.getElementById('bpm-indicator').innerHTML = Math.round(bpmAvg);
    count++;
  }
  millisecondsPrev = millisecondsCurr;
  return true;
}

function setUserColor(userInterac){
  var user_tag=document.getElementById('user-indicator');
  var bpm_tag=document.getElementById('bpm-indicator');
  if(userInterac=="1"){
    user_tag.style.color="red";
    bpm_tag.style.color="red";
  } 
  else if(userInterac=="2"){
    user_tag.style.color="blue";
    bpm_tag.style.color="blue";
  }
  else if(userInterac=="3"){
    user_tag.style.color="green";
    bpm_tag.style.color="green";
  }
  else if(userInterac=="4"){
    user_tag.style.color="yellow";
    bpm_tag.style.color="yellow";
  }
}


//Using tapBPM results
var bpmWaitChecker=setInterval(async function(){ 
  timeSeconds= new Date();
  millisecondsCurr=timeSeconds.getTime();
  if(flag==1 && millisecondsCurr-millisecondsPrev > 1000 * document.getElementById('T_WAIT').value)
  {
    console.log("BPM requested");
    if(isPlaying)
    {
      add++;
      pushBPMtoQueue(add);
    }
    else
    {
      pushBPMtoPlay(); 
    }

    createQueueTable();

    flag=0;
  }
},1000);

async function pushBPMtoPlay() 
{
  await fetch('/getTrackToPlay',{
    method:'POST',
    headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
    },
    body: JSON.stringify({
      "bpm":Math.round(bpmAvg),
      "userID":user,
    })
  }).then(async response => {
    return await response.json();
  }).then(data=>{
    justforWebsite(data.song);
    queuePlayerSections(data.color)
    trackArr=[];
    trackArr.push("spotify:track:"+data.song.track_id);
    playSong(trackArr);
  });
}

async function pushBPMtoQueue(add)
{
  await fetch('/getTrackToQueue',{
    method:'POST',
    headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
    },
    body: JSON.stringify({
      "bpm":Math.round(bpmAvg),
      "userID":user,
      "offset":add,
    })
  }).then(async response => {
    return await response.json();
  }).then(data=>{
    console.log("queue updated");
    let i=0;
    while(i<data.queue.length)
    {
      appendTracks(data.queue[i])
      i++;
    }
    queuePlayerSections(data.color)
  });
}

var bpmAddedChecker = setInterval(async function(){
  await fetch("/getState", {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }).then(async response => {
    return await response.json();
  }).then(data=>{
    if(data.state=="playing")
    {
      isPlaying=true;
      document.getElementById('song-name').innerHTML=data.song;
    }
    else if(data.state=="ended")
    {
      isPlaying=false;
      queuePlayContinue(); 
    }
  });
},1000)

async function queuePlayContinue()
{
  await fetch('/continuePlaying',{
    method:'POST',
    headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
    },
  }).then(async response => {
    return await response.json();
  }).then(data=>{
    
    createQueueTable();
    let i=0;
    while(i<data.queue.length)
    {
      appendTracks(data.queue[i])
      i++;
    }
    justforWebsite(data.song);
    trackArr=[];
    trackArr.push("spotify:track:"+data.song.track_id);
    playSong(trackArr);
    queuePlayerSections(data.color)
    add--;
  });
}

function playSong(trackArr){ 

  fetch("/getTrack", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: 
    JSON.stringify({
      "id":trackArr[0].split(":")[2],
    })
  })
  .then(async response => {
    return await response.json();
  })
  .then(data=>{
    document.getElementById('song-name').innerHTML=data.songName;
  })

  fetch("/playback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: 
    JSON.stringify({
      "song":trackArr,
    })
  })
  .then(response => {
    if(!response.ok)
    {
      console.error(response)
    }
    else
    {
      return response.json();
    }
  })
}


function queuePlayerSections(color) 
{
  console.log(color);
  for(let i=0;i<color.length;i++)
  {
    var q=document.querySelector('#q'+(i+1));
    if(color[i].length>1)
    {
      var str=""
      for(let j=0;j<color[i].length;j++)
      {
        if(j==0)
        {
          str+=color[i][j];
        }
        else
        {
          str+=","+color[i][j];
        }
      }
      q.style.backgroundImage='linear-gradient('+str+')';
    }
    else
    {
      str=color[i][0];
      q.style.backgroundColor=str;
    }


  }
}

function justforWebsite(song)
{
  document.getElementById('song-info1').innerHTML="Users: " + song.user_id + " | Track ID: "+ song.track_id+ " | Tempo: " + song.tempo;
  document.getElementById('song-info2').innerHTML="Danceability: " + song.danceability+ " | Energy: " + song.energy+ " | Liveness: " + song.liveness+ " | Valence: "+ song.valence;
}

//Creation of Table of Tracks
var queueDiv=document.getElementById('queue');
let tableHeaders = ['User ID', 'Track ID', 'Tempo', 'Danceability', 'Energy', 'Liveness', 'Valence', 'Cluster No.'];

const createQueueTable = () => {
  while(queueDiv.firstChild){
    queueDiv.removeChild(queueDiv.firstChild);
  }

  let queueTable=document.createElement('table');

  let queueTableHead=document.createElement('thead');

  let queueTableHeadRow=document.createElement('tr');

  for(let i=0;i<tableHeaders.length;i++){
    let queueTableHeadCell=document.createElement('th');
    queueTableHeadCell.innerText=tableHeaders[i];
    queueTableHeadRow.appendChild(queueTableHeadCell);
  }

  queueTableHead.appendChild(queueTableHeadRow);
  queueTable.appendChild(queueTableHead);

  let queueTableBody=document.createElement('tbody');
  queueTableBody.id="queueTableBody";
  queueTable.appendChild(queueTableBody);

  queueDiv.appendChild(queueTable);

}

const appendTracks=(track) =>{

  const queueTableBody = document.getElementById('queueTableBody');

  let queueTableBodyRow = document.createElement('tr');

  let userID=document.createElement('td');
  userID.innerText=track.user_id;

  let trackID=document.createElement('td');
  trackID.innerText=track.track_id;

  let tempo=document.createElement('td');
  tempo.innerText=track.tempo;

  let danceability=document.createElement('td');
  danceability.innerText=track.danceability;

  let energy=document.createElement('td');
  energy.innerText=track.energy;

  let liveness=document.createElement('td');
  liveness.innerText=track.liveness;

  let valence=document.createElement('td');
  valence.innerText=track.valence;

  let cluster=document.createElement('td');
  cluster.innerText=track.cluster_number;

  queueTableBodyRow.append(userID,trackID,tempo,danceability,energy,liveness,valence,cluster);

  queueTableBody.append(queueTableBodyRow);

}



