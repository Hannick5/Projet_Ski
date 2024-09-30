var BoutonMeteo = document.getElementById("b_meteo");
var BoutonDrone = document.getElementById("b_drone");

//Si on clique sur 'Données météorologiques'
BoutonMeteo.addEventListener('click',function(e){
    e.preventDefault();
    console.log("eh oh");
    updateHistorique(); //On enregistre la page dans l'historique
    //Redirection vers la nouvelle page
    window.location.assign("./donnees_meteo.html");
});

//Si on clique sur 'Données drone'
BoutonDrone.addEventListener('click',function(e){
    e.preventDefault();
    updateHistorique(); //On enregistre la page dans l'historique
    //Redirection vers la nouvelle page
    window.location.assign("./donnees_drone.html");
});



/**
 * Fonction mettant à jour l'historique dans le localStorage
 * @returns {void} 
 */
function updateHistorique(){
    //Recupération de l'historique
    let lst_pages = JSON.parse(localStorage.getItem("historique"));
    let index = parseInt(localStorage.getItem("index"));
    //Modification de l'historique
    index += 1; // On bouge l'index car une page va d'être ajoutée dans la liste
    lst_pages.push(window.location.href);
    //Enregistrement du nouvel historique
    localStorage.setItem("historique",JSON.stringify(lst_pages));
    localStorage.setItem("index",JSON.stringify(index));
}