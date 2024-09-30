// Obtenir la référence du bouton "Importer des données" et de l'input file
var BoutonImport = document.getElementById('b_import_drone');
var fileInput = document.getElementById('fileInput');
var HistoContenu = document.getElementById('histo_contenu');
var BoutonValider = document.getElementById('b_valider');
var text_valider = document.getElementById('text_valider');
var popup_geojson = document.getElementById('popup_geojson');

//Désactivation du bouton de Validation (car initialement, rien est prêt à être importé)
BoutonValider.disabled = true;

var import_date; //Date d'import du fichier

//histo_drone : Liste de l'ensemble des fichiers ayant été importés
//Si la variable n'a pas été intilisée dans le local storage
if(localStorage.getItem("histo_drone") === null){
    localStorage.setItem("histo_drone",JSON.stringify(new Array()));
}
var histo_drone = JSON.parse(localStorage.getItem("histo_drone"));
console.log("histo_drone : ",histo_drone);

var histo_drone_temp = new Array(); //Liste temporaire des fichiers sélectionnés AVANT d'avoir cliqué sur le bouton valider
//A chaque fois qu'on cliquera sur le bouton valider, cette liste temporaire sera réinitialisée

//Pour la bulle d'info
let divInfo = document.querySelector('.info');
let divMessage =divToShow = document.querySelector('.infoMsg');

divInfo.addEventListener('mouseover', function() {
    divMessage.classList.add('showInfo');
  });
  
  divInfo.addEventListener('mouseout', function() {
    divMessage.classList.remove('showInfo');
  });
  
// _______________________________ PARTIE IMPORTATION DES DONNEES __________________________________


//---------- SOUS PARTIE 1 : BOUTON IMPORT DES DONNEES

// Ajouter un gestionnaire d'événement au clic sur le bouton
BoutonImport.addEventListener('click', function() {
    // Déclencher un clic sur l'input file
    fileInput.click();
});
  
// Ajouter un gestionnaire d'événement pour la sélection de fichier dans l'input file
fileInput.addEventListener('change', function() {
    // Obtenir le fichier sélectionné
    var selectedFile = fileInput.files[0];
    import_date = new Date().toLocaleString();
    // Faire quelque chose avec le fichier sélectionné, par exemple l'afficher dans la console
    console.log('Fichier sélectionné :', selectedFile);
    //Ajout dans l'historique des fichiers importés
    histo_drone.push([selectedFile,import_date]);
    histo_drone_temp.push([selectedFile,import_date]);
    //On met à jour le bouton valider
    updateBoutonValider(BoutonValider,text_valider,histo_drone_temp);
});

//---------- SOUS PARTIE 2 : SECTION DROPZONE DES DONNEES

const dropzone = document.getElementById('dropzone');

dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    //Changement de couleur pour informer que le fichier est pas à la bonne place pour être glissé dans la dragzone
    dropzone.style.backgroundColor = 'beige';
    dropzone.style.borderColor = 'brown';
});

dropzone.addEventListener('dragleave', (event) => {
    event.preventDefault();
    //Changement de couleur pour informer qu'aucun fichier est à la bonne place pour être glissé dans la dragzone
    dropzone.style.backgroundColor = 'lightgray';
    dropzone.style.borderColor = 'darkgray';
});


dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    //Changement de couleur pour informer qu'aucun fichier est à la bonne place pour être glissé dans la dragzone
    dropzone.style.backgroundColor = 'lightgray';
    dropzone.style.borderColor = 'darkgray';
    //On récupère le fichier
    const files = event.dataTransfer.files;
    let filename = files[0].name;
    import_date = new Date().toLocaleString();
    //Ajout dans l'historique des fichiers importés
    histo_drone.push([files[0],import_date]);
    console.log(histo_drone);
    histo_drone_temp.push([files[0],import_date]);
    //On met à jour le bouton valider
    updateBoutonValider(BoutonValider,text_valider,histo_drone_temp);
});

//Formulaire qui apparit lorsque l'utilisateur décide d'importer un fichier au format .geojson
var FormPopupGeoJSON = document.getElementById('form_popup_geojson');
var filename='';

FormPopupGeoJSON.addEventListener('submit',function(e){
    e.preventDefault();
    uploadGEOJSON(FormPopupGeoJSON,filename,popup_geojson); 
});
//---------- SOUS PARTIE 3 : SECTION VALIDER IMPORT DES DONNEES

//Si on clique sur la bouton Valider
BoutonValider.addEventListener('click', (event) => {
    event.preventDefault();

    //Récupération du dernier fichier importé
    let file = histo_drone[histo_drone.length-1][0];
    console.log(file);
    filename = file.name;

    let valid_file = false;
    if(filename.length > 4){ //Si le fichier fait plus de 4 caractères
        // Cas 1 : Fichier TIF
        if(filename.substring(filename.length-4,filename.length) == ".tif"){
            valid_file = true;
            uploadGEOTIFF(filename);
        }
        if(filename.length > 8){
            //CAS 2 : Fichier GEOJSON
            if(filename.substring(filename.length-8,filename.length) == ".geojson"){
                valid_file = true;
                popup_geojson.style.display = 'flex';//On affiche le popup geojson
            }
        }
        
    }  
    //On affiche le tableau de l'historique des imports
    afficheHistoriqueDrone(histo_drone);
    //On vide la liste temporaire de fichiers importés
    histo_drone_temp.splice(0,histo_drone_temp.length);
    //Une fois tout importé, plus rien n'est prêt à été importé : On redésactive le bouton valider
    BoutonValider.disabled = true;
    BoutonValider.style.backgroundColor = 'lightcoral';
    BoutonValider.style.borderColor = 'darkred';
    text_valider.innerHTML = "Valider<br>(0 fichier sélectionné)";
});

// _______________________________ FONCTIONS __________________________________



/**
 * Fonction qui va affiche l'historique des fichier importés sur la page HTML sous la forme d'un tableau.
 * @param {array} histo_drone Array des fichiers importés. Chaque élement est de la forme [nom_fichier,date_import]
 * @returns {void}
 */
function afficheHistoriqueDrone(histo_drone){

    //On ajoute les éléments un par un dans l'histogramme ...
    //On ne retiendra que les 5 éléments importés les plus récents
    while(histo_drone.length > 5){ //Si on ajoute un élément qui est le 6e dans l'histogramme
        histo_drone.shift(); //On élimine le 1er élément (qui est le plus ancien), pour rester à 5 éléments
    }

    // Affichage de l'historique des imports de données drone
    var textHTML="<table id='histo_table'><th>Rang</th><th>Nom du fichier</th><th>Date d'importation</th>";
    for(j=0;j<histo_drone.length;j++){
        var dronefile = histo_drone[j];
        textHTML +="<tr> <td>"+(j+1)+"</td> <td>"+dronefile[0].name+"</td> <td>"+dronefile[1]+"</td> </tr>";
    }
    textHTML+="</table>";

    HistoContenu.innerHTML = textHTML;
}



/**
 * Fonction qui va modifier le CSS du bouton valider en fonction du nombre de fichiers importés.
 * @param {HTMLCollection} BoutonValider Bouton HTML Valider
 * @param {HTMLCollection} text_valider Div HTML du texte dans le bouton Valider
 * @param {array} histo_drone_temp Array des fichiers importés. Chaque élement est de la forme [nom_fichier,date_import]
 * @returns {void}
 */
function updateBoutonValider(BoutonValider,text_valider,histo_drone_temp){
    //Activation du bouton Valider
    if(BoutonValider.disabled == true){
        BoutonValider.disabled = false;
        BoutonValider.style.backgroundColor = 'lightgreen';
        BoutonValider.style.borderColor = 'darkgreen';
    }

    //Changement des infos dans le bouton valider
    if(histo_drone_temp.length == 1){
        text_valider.innerHTML = "Valider<br>(1 fichier sélectionné)";
    }
    else{
        text_valider.innerHTML = "Valider<br>("+histo_drone_temp.length+" fichiers sélectionnés)";
    }
}



/**
 * Fonction importer un fichier geotiff sur la base de données via un FETCH.
 * @param {string} filename Nom du fichier à importer.
 * @returns {void}
 */
function uploadGEOTIFF(filename){

    let infos = "filename=./data_import/"+filename+"&filetype=TIF";
    fetch('../BDD/new_upload.php', {
        method: 'POST',
        body : infos,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        })
        .then(response => response.text())
        .then(data => {
            alert("Le fichier nommé '"+filename+"' à bien été importé sur la base de données !");
        })
        .catch(error => {
        console.error('Erreur :', error);
        });
}



/**
 * Fonction importer un fichier geojson sur la base de données via un FETCH.
 * @param {HTMLCollection} form Formulaire du popup geojson.
 * @param {string} filename Nom du fichier à importer.
 * @param {HTMLCollection} popup Popup geojson.
 * @returns {void}
 */
function uploadGEOJSON(form,filename,popup){

    popup.style.display = 'none'; //On efface le popup
    //Récupérer le mode sélectionné
    let mode = form.elements["data-type"].value;
    
    let infos = "data-type="+mode.toLowerCase()+"&filename=./data_import/"+filename+"&filetype=GEOJSON";
    console.log(infos);
    fetch('../BDD/new_upload.php', {
        method: 'POST',
        body : infos,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        })
        .then(response => response.text())
        .then(data => {
            alert("Le fichier nommé '"+filename+"' à bien été importé sur la base de données !");
        })
        .catch(error => {
        console.error('Erreur :', error);
        });
}
