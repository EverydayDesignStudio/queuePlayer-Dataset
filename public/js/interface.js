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
    console.log(Math.round(bpmAvg * 100) / 100);
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
    flag=0;
  }
},1000);


// Reading the JSON file data
function clearResults(){
  var child = h1.firstChild;
  while (child) {
    h1.removeChild(child);
    child = h1.firstChild;
  }
  var child = h3.firstChild;
  while (child) {
    h3.removeChild(child);
    child = h3.firstChild;
  }
}

var qpData;
function testResults(avgBPM) {
  let bpm = avgBPM
  fetch("../Final Database/test.json")
  .then(response => {
    return response.json();
  })
  .then(qpDataset=>{
    qpDataset[bpm].sort((first,second) => {
      if(document.getElementById('T_TYPE').value=='danceability'){
        return second.danceability - first.danceability;
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

    // h1=document.createElement('h1');
    // h1.appendChild(document.createTextNode("Queue Playlist"));
    // h1.appendChild(document.createElement('br'));
    // document.body.appendChild(h1);

    // h3=document.createElement('h3');

    createQueueTable();

    for(let i=0;i<qpDataset[bpm].length;i++)
    {
        // h3.appendChild(document.createTextNode("Track ID: " + qpDataset[bpm][i].track_id + " Tempo : "+ qpDataset[bpm][i].tempo));
        // h3.appendChild(document.createElement('br'));
        // document.body.appendChild(h3);

        appendTracks(qpDataset[bpm][i]);
    }
  }); 
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
