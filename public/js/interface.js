//Queue for queuePlayer
var qply=[];
var add=0;

//TapBPM control variables
var count=0;
var millisecondsFirst=0;
var millisecondsPrev=0;
var millisecondsCurr=0;
var bpmAvg=0;
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


var endtrack=false;
async function triggerEndTrack(){
  await fetch("/getState", {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }).then(async response => {
    return await response.json();
  }).then(data=>{
    if(data.state=="eot")
    {
      endtrack=true;
    }
  });
}

window.addEventListener('keydown', function (e) {
  console.log(e.key)
  if(e.key==1)
  {
    tapBPM();
  }
  else if(e.key==2)
  {
    tapBPM();
  }
  else if(e.key==3)
  {
    tapBPM();
  }
  else if(e.key==4)
  {
    tapBPM();
  }
  else
  {
    alert("Invalid key");
  }
}, false);

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
      testResults(Math.round(bpmAvg));
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

function testResults(avgBPM) {

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

function playSongs(trackArr){ 

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

//Creation of Table of Tracks
var queueDiv=document.getElementById('queue');
// let tableHeaders = ['User ID', 'Track Name', 'Track ID', 'Tempo', 'Danceability', 'Energy', 'Liveness', 'Valence', 'Mode', 'Time Signature'];
let tableHeaders = ['User ID', 'Track Name', 'Tempo', 'Danceability', 'Energy', 'Liveness', 'Valence', 'Mode', 'Time Signature'];


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

  let trackName=document.createElement('td');
  trackName.innerText=track.track_name;

  // let trackID=document.createElement('td');
  // trackID.innerText=track.track_id;

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

  queueTableBodyRow.append(userID,trackName,tempo,danceability,energy,liveness,valence,mode,timeSignature);
  // queueTableBodyRow.append(userID,trackName,trackID,tempo,danceability,energy,liveness,valence,mode,timeSignature);


  queueTableBody.append(queueTableBodyRow);

}

function rearrangeQueue(){
  testResults(Math.round(bpmAvg));
}

