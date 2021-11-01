function reqListener () {
    alert(JSON.parse(this.responseText).status);
    window.location.replace("/");
}

function deleteList(id){
    let xhttp = new XMLHttpRequest();
    xhttp.addEventListener("load", reqListener);
    xhttp.open('DELETE', `/lists/${id}`);
    xhttp.send();
}