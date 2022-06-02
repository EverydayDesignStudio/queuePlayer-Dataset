//TapBPM control
var count=0;
var millisecondsFirst=0;
var millisecondsPrev=0;
var bpmAvg=0;
var h1,h3;
var millisecondsCurr=0;
var flag=0;

function resetCount(){
  count=0;
  document.getElementById('T_AVG').value = "";
  document.getElementById('T_TAP').value = "";
  document.getElementById('T_RESET').blur();

}

function tapBPM(e){
  flag=1;
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

var lol=setInterval(function(){
  timeSeconds = new Date();
  millisecondsCurr=timeSeconds.getTime();
  if(flag==1 && millisecondsCurr-millisecondsPrev > 1000 * document.getElementById('T_WAIT').value){
    if(h1 != undefined && h3 != undefined)
    {
      clearResults();
    }
    testResults(Math.round(bpmAvg));
    trackArr=[];
    flag=0;
  }
},1000);


// Reading the JSON file data
var trackArr=[];
var flg=0
var bpmPrev=0;
var qpDataset;
var currFeatures;

fetch("../Final Database/test.json")
.then(response => {
  return response.json();
}).then(qpData=>{
  qpDataset=qpData;
})

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
          console.log(currFeatures.danceability);


          trackArr=[];
          qpDataset[bpm].sort((first,second) => {
            if(document.getElementById('T_TYPE').value=='danceability'){
              return first.danceability - second.danceability;
            }
              else if(document.getElementById('T_TYPE').value=='energy'){
                return second.energy - first.energy;
              }
              else if(document.getElementById('T_TYPE').value=='liveness'){
                return second.liveness - first.liveness;
              }
              else if(document.getElementById('T_TYPE').value=='valence'){
                return second.valence - first.valence;
              }
              else if(document.getElementById('T_TYPE').value=='tempo'){
                return second.tempo - first.tempo;
              }
              else if(document.getElementById('T_TYPE').value=='mode'){
                return second.mode - first.mode;
              }
              else if(document.getElementById('T_TYPE').value=='time_signature'){
                return second.time_signature - first.time_signature;
              }
          });
          qpDataset[bpm].sort((first,second) => {
            if(document.getElementById('T_TYPE').value=='danceability'){
              console.log("first ",first.danceability, Math.abs(first.danceability-currFeatures.danceability))
              console.log("second ",second.danceability,Math.abs(second.danceability-currFeatures.danceability))
              return (Math.abs(first.danceability-currFeatures.danceability)) - (Math.abs(second.danceability-currFeatures.danceability));
            }
              else if(document.getElementById('T_TYPE').value=='energy'){
                return second.energy - first.energy;
              }
              else if(document.getElementById('T_TYPE').value=='liveness'){
                return second.liveness - first.liveness;
              }
              else if(document.getElementById('T_TYPE').value=='valence'){
                return second.valence - first.valence;
              }
              else if(document.getElementById('T_TYPE').value=='tempo'){
                return second.tempo - first.tempo;
              }
              else if(document.getElementById('T_TYPE').value=='mode'){
                return second.mode - first.mode;
              }
              else if(document.getElementById('T_TYPE').value=='time_signature'){
                return second.time_signature - first.time_signature;
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

