var qpData;
    
function testResults(form) {
  let bpm = form.bpm.value;
  fetch("./qp_dataset.json")
  .then(response => {
    return response.json();
  })
  .then(qpDataset=>{
    var h3=document.createElement('h3');
    var h1=document.createElement('h1');
    h1.appendChild(document.createTextNode("Queue Playlist"));
    h1.appendChild(document.createElement('br'));
    document.body.appendChild(h1);

    for(let i=0;i<qpDataset[bpm].length;i++)
    {
        h3.appendChild(document.createTextNode("Track Name: " + qpDataset[bpm][i].track + " Track ID: "+ qpDataset[bpm][i].trackID));
        h3.appendChild(document.createElement('br'));
        document.body.appendChild(h3);
    }

  }); 
}