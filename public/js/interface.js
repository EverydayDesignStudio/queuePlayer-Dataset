//Queue for queuePlayer
var qply=[];

//TapBPM control variables
var count=0;
var millisecondsFirst=0;
var millisecondsPrev=0;
var millisecondsCurr=0;
var bpmAvg=0;
var flag=0;
var flagAlt=0

function resetCount(){
  count=0;
  document.getElementById('T_AVG').value = "";
  document.getElementById('T_TAP').value = "";
  document.getElementById('T_RESET').blur();
}

function tapBPM(e){
  flag=1;
  flagAlt=1;
  document.getElementById('T_WAIT').blur();
  timeSeconds = new Date();
  millisecondsCurr=timeSeconds.getTime();
  if(millisecondsCurr-millisecondsPrev > 1000 * document.getElementById('T_WAIT').value)
  {
    count=0;
  }
  if(count==0)
  {
    document.getElementById('T_AVG').value = "First Beat";
    document.getElementById('T_TAP').value = "First Beat";
    millisecondsFirst=millisecondsCurr;
    count = 1;
  }
  else
  {
    bpmAvg=60000*count/(millisecondsCurr-millisecondsFirst);
    document.getElementById('T_AVG').value = Math.round(bpmAvg * 100) / 100;
    document.getElementById('T_WHOLE').value = Math.round(bpmAvg);
    count++;
    document.getElementById('T_TAP').value = count;
  }
  millisecondsPrev = millisecondsCurr;
  return true;
}

document.onkeydown=tapBPM;


//Show BPM results 
var lol=setInterval(function(){
  timeSeconds = new Date();
  millisecondsCurr=timeSeconds.getTime();
  if(flag==1 && millisecondsCurr-millisecondsPrev > 1000 * document.getElementById('T_WAIT').value)
  {
    if(flagAlt==1)
    {
      console.log("Waiting for track to end")
      fetch("/getState", {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }).then(response => {
        return response.json();
      }).then(data=>{
        if(data.state=="eot")
        {    
          testResults(Math.round(bpmAvg));
          trackArr=[];
          flagAlt=0;
        }
        else if(data.state=="np")
        {
          testResults(Math.round(bpmAvg));
          trackArr=[];
          flagAlt=0;
        }
        else if(data.state=="pw")
        {
          testResults(Math.round(bpmAvg));
          trackArr=[];
          flagAlt=0;
        }
      });
    }
    flag=0;
  }
},1000);

// Reading the JSON file data
var qpDataset;

fetch("../Final Database/test.json")
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

function testResults(avgBPM) {
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
      trackArr=[];
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

      createQueueTable();

      for(let i=0;i<qpDataset[bpm].length;i++)
      {
        trackArr.push("spotify:track:"+qpDataset[bpm][i].track_id);
        if(i == qpDataset[bpm].length-1)
        {
          flg=0;
          playSongs();
        }
        
        appendTracks(qpDataset[bpm][i]);
      }
    });
  }
}

//Creation of Table of Tracks
var queueDiv=document.getElementById('queue');
let tableHeaders = ['User ID', 'Track ID', 'Tempo', 'Danceability', 'Energy', 'Liveness', 'Valence', 'Mode', 'Time Signature'];

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

function playSongs(){ 
  if(trackArr!="" && flg==0)
  {
    fetch("/playback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(trackArr),
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
    flg=1;
  }
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

  let mode=document.createElement('td');
  mode.innerText=track.mode;

  let timeSignature=document.createElement('td');
  timeSignature.innerText=track.time_signature;

  queueTableBodyRow.append(userID,trackID,tempo,danceability,energy,liveness,valence,mode,timeSignature);

  queueTableBody.append(queueTableBodyRow);

}

function rearrangeQueue(){
  testResults(Math.round(bpmAvg));
}

