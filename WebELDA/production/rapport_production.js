var form_rapport = document.getElementById("form_rapport");
var canvas = document.getElementById("RapportChart");
var graphe_existant = false;
var RapportChart; //Graphique

var BoutonImport = document.getElementById("b_import_rapport");
var TextInfoGraphique = document.getElementById("texte_debut_graphique");

var selection = new Array(); //Données entrées par l'utilisateur
var data_rapport = new Array(); //Données récupérées depuis la base de données
var saison; //Saison hivernal des données demandées par l'utilisateur (ex: 2021/2022)

// Initialisation du calendrier flatpickr
flatpickr(".calendrier", {
    dateFormat: "d/m/Y",
    altInput: true,
    altFormat: "d/m/Y",
    locale: {
        firstDayOfWeek: 1,
        weekdays: {
            shorthand: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
            longhand: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        },
        months: {
            shorthand: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sept', 'Oct', 'Nov', 'Dec'],
            longhand: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        },
    },
});

//Pour la bulle d'info
let divInfo = document.querySelector('.info');
let divMessage =divToShow = document.querySelector('.infoMsg');

divInfo.addEventListener('mouseover', function() {
    divMessage.classList.add('showInfo');
  });
  
  divInfo.addEventListener('mouseout', function() {
    divMessage.classList.remove('showInfo');
  });

//_______________________________________ FONCTION MAIN ___________________________________________________

//-------------------------------------  PARTIE VISUALISATION DES DONNEES ---------------------------------

//Lorsque l'utilisateur remplit le formulaire
form_rapport.addEventListener('submit',function(e){

    e.preventDefault();

    //Données entrées par l'utilisateur : [saison hivernale, date de départ, date de fin, numéro de l'enneigeur]
    selection.debut = StringToDate(form_rapport.elements["debut"].value);
    selection.fin = StringToDate(form_rapport.elements["fin"].value);
    selection.numero = form_rapport.elements["numero"].value;

    if (ValidationSelection(selection)){ //Si les données entrées par l'utilisateur sont cohérentes
        if(VerifBonnePeriode(selection)){ //Si la période entrée par l'utilisateur est correcte
            VerifDisponible(selection,saison).then(r => {
                if(r == true){ //Si les données sont disponibles
                    data_selec = getDataMeteoSelec(data_rapport,selection); //Récupération des données
                    data_selec = groupByDay(data_selec); //On regroupe les données par jour

                    TextInfoGraphique.remove(); //On enlève le texte dans la section graphique, pour afficher le graphique commandé
                    CreateRapportChart(canvas,data_selec,selection);
                    //console.log("Graphique réalisé avec succès !");
                }
            });
        }   
    }
});

function getSumValues(arr){
    let sum = 0;
    for(i=0;i<arr.length;i++){
        sum += arr[i];
    }
    return sum;
}

// ---------------------- PARTIE IMPORTATION DES DONNEES ----------------------

// Ajouter un gestionnaire d'événement au clic sur le bouton
BoutonImport.addEventListener('click', function() {
    // Déclencher un clic sur l'input file
    fileInput.click();
  
  });
  
  // Ajouter un gestionnaire d'événement pour la sélection de fichier dans l'input file
  fileInput.addEventListener('change', function() {
    // Obtenir le fichier sélectionné
    var selectedFile = fileInput.files[0];
    // Faire quelque chose avec le fichier sélectionné, par exemple l'afficher dans la console
    //console.log('Fichier sélectionnée :', selectedFile);
    fetch("../BDD/data_import/"+selectedFile.name)
    .then(response => response.text())
    .then(data => {
        
        //Mise en page du texte
        let data_rapport_csv = data.replace(/;/g, ","); //Texte de data_rapport
        data_rapport_csv = data_rapport_csv.split("\n");
        for(i=1;i<data_rapport_csv.length;i++){
          data_rapport_csv[i]= data_rapport_csv[i].split(",");
          data_rapport_csv[i][0] = "'"+data_rapport_csv[i][0]+"'";
          data_rapport_csv[i] = data_rapport_csv[i].join(",");
        }      
        nb_colonnes = data_rapport_csv[0].split(",").length;
        //console.log(nb_colonnes);
        
        //Préparationd des infos pour le Fetch
        let filename = selectedFile.name.replace(".csv","");
        filename = filename.replace("_","");
        filename = filename.replace("-","");
        filename = filename.toLowerCase();

        infos = "data="+JSON.stringify(data_rapport_csv)+"&nb_col="+nb_colonnes+"&filename="+filename;

        //FETCH : Demande d'import de données vers une table SQL
        fetch('../BDD/import_csv.php',{
          method: 'post',
          body : infos,
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          }
          })
          .then(result => result.text())
          .then(r => {
            if(r == "success"){
                alert("Le fichier de données météo <"+selectedFile.name+"> à été enregistré sur la base de données");
            }
            else{
                alert("Le fichier de données météo <"+selectedFile.name+"> n'a pas pu être enregistré sur la base de données.\nCela est dû à l'erreur suivante : "+r);
            }
          });
    })
    .catch(error => {console.error(error);return false});
  });



//_______________________________________ FONCTIONS ___________________________________________________


/**
 * Fonction vérifiant si l'ordre des dates de début et de fin est cohérente.
 * @param {array} selection Liste des paramètres entrés par l'utilisateur.
 * @returns {boolean} Si l'ordre est correct ou non.
 */
function ValidationSelection(selection){ //
    let txt_error = "";
    //Si existants, vérification de la validité des paramètres renseignés
    if(selection.debut>selection.fin){//Vérification que la date fin est après la date début
        txt_error += "ERREUR : Votre date de fin est antérieure à celle de début.\n";
    }
    //Si il existe une de ces erreurs
    if(txt_error != ""){
        alert(txt_error);
        return false;
    }
    //Sinon, le formulaire est valide !
    return true;
}



/**
 * Fonction vérifiant si la période entre les dates de début et de fin est cohérente et est dans les données des saisons hivernales disponibles.
 * @param {array} selection Liste des paramètres entrés par l'utilisateur.
 * @returns {boolean} Si la période est correcte ou non.
 */
function VerifBonnePeriode(selection){
    let date_debut = selection.debut;
    let date_fin = selection.fin;
    //Recherche de la saison hivernale correspondante à la période sélectionnée
    saison = TrouveSaison(selection);
    if( saison == false ){ // Si la saison est incorrecte ou en dehors des saisons disponibles
        alert("La période du "+DateToString(date_debut)+" au "+DateToString(date_fin)+" est totalement en dehors des données disponibles. Veuillez réitérer votre demande sur une autre période.");
        return false;
    }
    return true;
}



/**
 * Fonction vérifiant si les données souhaitées sont disponibles dans la base de données des rapports de production
 * @param {array} selection Liste des paramètres entrés par l'utilisateur.
 * @param {array} saison Saison hivernale contenant la période souhaitée par l'utilisateur. Exemple : 2021/2022 => [21,22]
 * @returns {boolean} Si les données sont disponibles ou non.
 */
function VerifDisponible(selection,saison){

    let date_debut = selection.debut;
    let date_fin = selection.fin;
    let num_station = selection.numero;
    //Récupération du nom de la table SQL en fonction de la selection
    let tablename = "rapportproduction";
    tablename = tablename.replace("_","");
    tablename = tablename.replace("-","");
    tablename += "20"+saison[0]+"20"+saison[1];
    //Préparation des infos à envoyer au fetch vers un fichier php
    infos = "&tablename="+tablename+"&id_object="+num_station;

    //FETCH : Demande d'export de données depuis une table SQL
    return fetch('../BDD/export_csv.php',{
        method: 'post',
        body : infos,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        })
    .then(response => response.json())
    .then(data => {
        data_rapport = data;
        
        for(i=0;i<data_rapport['Datetime'].length;i++){ //Convertion des dates en éléments de type Date()
            data_rapport['Datetime'][i] = StringToDate(data_rapport['Datetime'][i]);
        }
        //Vérification : Si les données de la station sélectionnée ne sont pas dans le fichier, on annule l'opération
        if(!VerifStationDispo(data_rapport,num_station)){
            return false;
        }

        //Récupération des dates de début et de fin des données disponibles
        let debut_dispo = data_rapport['Datetime'][0];
        let fin_dispo = data_rapport['Datetime'][data_rapport['Datetime'].length-1];
        //Si la période sélectionnée est totalement en dehors de la période disponible
        if( date_fin<debut_dispo || date_debut>fin_dispo){
            alert("La période du "+DateToString(date_debut)+" au "+DateToString(date_fin)+" est totalement en dehors des données disponibles. Veuillez réitérer votre demande sur une autre période.");
            return false;
        }
        else{ //Cas de troncage de la période
            if(date_debut<debut_dispo){//Si la date de départ sélectionnée est antérieure à la première date des données disponibles
                alert("La date ["+DateToString(date_debut)+"] est en dehors du champ de données disponibles. Voici donc les données à partir du ["+DateToString(debut_dispo)+"]");
                selection.debut = debut_dispo;
            }
            if(date_fin>fin_dispo){//Si la date de fin sélectionnée est postérieure à la dernière date des données disponibles
                alert("La date ["+DateToString(date_fin)+"] est en dehors du champ de données disponibles. Voici donc les données jusqu'au ["+DateToString(fin_dispo)+"]");
                selection.fin = fin_dispo;
            }
            return true;
        }
    })
    .catch(error => {console.error(error);return false});
}



/**
 * Fonction vérifiant si la station est disponible dans les données récoltées depuis la base de données.
 * @param {array} data Données récoltées.
 * @param {string} station_selec Nom de la station sélectionée par l'utilisateur.
 * @returns {boolean} Si les données de la station sont disponibles ou non.
 */
function VerifStationDispo(data,station_selec){

    let stations = Object.keys(data);
    let id_station;
    for(i=1;i<stations.length;i++){ //On parcourt la liste des stations (élement 0 skippé car = 'Datetime')
        //Si les deux derniers caractères du nom de colonne sont égaux à l'id de la station
        if(station_selec == stations[i]){
            return true;
        }
    }
    //Si on a rien trouvé
    alert("Les données de l'enneigeur numéro "+station_selec+" ne sont pas disponibles.");
    return false;
}



/**
 * Fonction qui va trouver la saison hivernale correspondante à la période entre les dates de début et de fin sélectionnées par l'utilisateur.
 * @param {array} selection Liste des paramètres entrés par l'utilisateur.
 * @returns {boolean | array} Array de la saison si elle est correcte, false sinon.
 */
function TrouveSaison(selection){
    //Fonction qui va trouver la saison hivernale en fonction des dates de début et de fin sélectionnées
    let date_debut = selection.debut;
    let date_fin = selection.fin;
    let debut_saison,fin_saison;

    for(year=14;year<=22;year++){

        debut_saison = StringToDate("01/10/20"+year);
        fin_saison = StringToDate("01/06/20"+(year+1));

        date_interdite = StringToDate("01/07/20"+(year+1)); 
        //Si les dates sont à cheval sur plusieurs saisons
        if(date_debut.getTime()<=date_interdite.getTime() && date_interdite.getTime()<=date_fin.getTime()){
            if((year+1) == 22){ //exception : dernière saison disponible
                return [21,22];
            }
            console.log(year+1,"à cheval");
            return false;
        }
        //Si le debut de la sélection est avant le début de la première saison disponible
        if(year==14 && debut_saison.getTime()>=date_debut.getTime() && date_fin.getTime()<=fin_saison.getTime()){
            return [14,15];
        }
        //Si les dates de sélection sont comprises dans l'intervalle temporel de la saison
        if(debut_saison.getTime()<=date_debut.getTime() && date_fin.getTime()<=fin_saison.getTime()){
            return [year,year+1];
        }
    }
    //Si les dates ne sont incluses dans aucune des saisons
    return false;
}


/**
 * Fonction qui va extraire les dates (dans l'ordre chronologique) et leurs valeurs associées dans les données récoltées.
 * @param {array} data_rapport Données récoltées depuis la base de données.
 * @param {array} selection Liste des paramètres entrés par l'utilisateur.
 * @returns {[array,array]} Array de [liste des dates,liste des valeurs].
 */
function getDataMeteoSelec(data_rapport,selection,mode){

    let ind_debut = rechercheDichotomiqueDate(data_rapport['Datetime'],selection.debut);
    let ind_fin = rechercheDichotomiqueDate(data_rapport['Datetime'],selection.fin);

    let dates_selec = data_rapport['Datetime'].slice(ind_debut,ind_fin+1);
    let val_selec = data_rapport[selection.numero].slice(ind_debut,ind_fin+1);

    if(mode == "without_null"){ //Mode ou on enlève les valeurs nulles
        let new_dates_selec = new Array();
        let new_val_selec = new Array();
        for(i=0;i<val_selec.length;i++){ //Ajout des données
            if(val_selec[i] != 0){
                new_dates_selec.push(dates_selec[i]);
                new_val_selec.push(val_selec[i]);
            }
        }
        dates_selec = new_dates_selec;
        val_selec = new_val_selec;
    }
    return [dates_selec,val_selec];
}



/**
 * Fonction qui va regrouper les données par jour. Exemple : J'ai 3 données pour le 03/01 => Je n'aurai plus qu'une donnée pour le 03/01 qui sera la somme des 3 valeurs
 * @param {array} data_rapport Array de [liste des dates,liste des valeurs].
 * @returns {[array,array]} Array de [liste des dates (jours),liste des valeurs].
 */
function groupByDay(data_rapport){

    let dates_selec = data_rapport[0];
    let val_selec = data_rapport[1];

    let dates_selec_day = new Array();
    let val_selec_day = new Array();

    let day_value = parseFloat(val_selec[0]);
    let vdate;

    for(i=1;i<dates_selec.length;i++){
        if(dates_selec[i].getDate() == dates_selec[i-1].getDate()){
            day_value += parseFloat(val_selec[i]);
        }
        else{
            vdate = dates_selec[i-1];
            dates_selec_day.push(new Date(vdate.getFullYear(),vdate.getMonth(),vdate.getDate()));
            val_selec_day.push(day_value);
            day_value = 0;
        }
    }
    return [dates_selec_day,val_selec_day];
}



/**
 * Fonction qui va construire le graphique final (avec Chart.js) avec les données récoltées.
 * @param {HTMLCanvasElement} canvas Canvas du graphique dans le document HTML.
 * @param {array} data_rapport Array de [liste des dates (jours),liste des valeurs].
 * @param {array} selection Liste des paramètres entrés par l'utilisateur.
 * @returns {void}
 */
function CreateRapportChart(canvas,data_rapport,selection){

    let titre = "",titre_prefixe;
    titre +="Graphique de la production de\n l'enneigeur n°"+selection.numero+" sur la période du "+DateToString(selection.debut)+" au "+DateToString(selection.fin);
    //On calcule la production totale sur la période
    let prod_totale = getSumValues(data_selec[1]).toFixed(3);
    if(graphe_existant == true){//Si il y avait déja un graphique, on le détruit
        RapportChart.destroy();
    }
    
    //Création du graphique
    RapportChart = new Chart(canvas,{
        data: {
            datasets: [{
                type: 'bar',
                label: 'Débit en eau' ,
                data: data_rapport[1],
                backgroundColor: "blue",
            }],
            labels: data_rapport[0],
        },
    
        options:{
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: [titre,'Production totale sur cette période : '+prod_totale+' m³'],
                    lineHeight: 1.5,
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                }
            },

            scales: {
                x: {
                    //display: false, // Afficher l'axe x
                    title: {
                        display: true,
                        text: 'Temps' // Légende de l'axe x
                    },
                    ticks: {
                        display: false // Cacher les valeurs de l'axe y
                    },
                    grid:{
                        display :false
                    }
                },
                y: {
                    display: true, // Afficher l'axe y
                    title: {
                        display: true,
                        text: 'Volume (en L)' // Légende de l'axe y
                    }
                }
            }
        }
    })
    graphe_existant = true;
}



/**
 * Fonction qui va transformer un Array de lignes en un Array Colonne (transposée).
 * @param {array} data_rapport Array en entrée.
 * @returns {array} Array Colonne.
 */
function ArrayLineToArrayColumn(array){

    let array_col = new Array();
    let nb_col = array[0].length;

    for(i=0;i<nb_col;i++){
        array_col[array[0][i]] = new Array();
        for(j=1;j<array.length;j++){
            array_col[array[0][i]].push(array[j][i]);
        }
    }
    return array_col;
}


/**
 * Fonction qui va transformer un string en un élement de type Date().
 * @param {string} date_string String de type 'JJ/MM/YYYY HH:MM:SS'.
 * @returns {Date} Élement de type Date() correspondant.
 */
function StringToDate(date_string){

    let jour = date_string.substring(0,2);
    let mois = date_string.substring(3,5);
    let annee = date_string.substring(6,10);
    let heure = "00";
    let minute = "00";
    if(date_string.length > 10){
        heure = date_string.substring(11,13);
        minute = date_string.substring(14,16);
    }
    let date = annee+'-'+mois+'-'+jour+'T'+heure+':'+minute+':'+'00Z';
    let UTCdate = new Date(date); 
    UTCdate.setUTCHours(UTCdate.getUTCHours() - 1); // Décalage de l'heure d'une heure (GMT-1)

    return UTCdate;
}



/**
 * Fonction qui va transformer un élement de type Date() en un string .
 * @param {Date} date de type Date() correspondant.
 * @returns {string} String de type "JJ/MM/YYYY HH:MM:SS".
 */
function DateToString(date){

    let jour = date.getDate(); // Extraction du jour (de 1 à 31)
    let mois = date.getMonth() + 1; // Extraction du mois (de 0 à 11) et ajout de 1 pour obtenir la valeur réelle du mois (de 1 à 12)
    let annee = date.getFullYear(); // Extraction de l'année (avec 4 chiffres)

    if(jour<10){
        jour = "0"+jour;
    }
    if(mois<10){
        mois = "0"+mois;
    }
    return jour+"/"+mois+"/"+annee;

}



/**
 * Fonction qui va trouver les indices des éléments vides dans un array.
 * @param {array} arr Array en entrée.
 * @returns {string} Array des indices des élements vides.
 */
function EmptyIndexes(arr){
    let emptyIndexes = new Array();
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === null || arr[i] === undefined || arr[i] === "" || arr[i]===NaN) {
          emptyIndexes.push(i);
        }
      }
    return emptyIndexes;
}


/**
 * Fonction qui va effectuer un recherche dichotomique d'un élément dans une Array d'éléments croissants.
 * @param {array} tableau Array en entrée.
 * @param {Date | number} valeur Valeur dont l'indice est à déterminer.
 * @returns {number} Indice de l'élément dans le tableau.
 */
function rechercheDichotomiqueDate(tableau, valeur) {
    let min = 0; // L'indice du premier élément du tableau
    let max = tableau.length - 1; // L'indice du dernier élément du tableau

    if(tableau[0] == valeur){
        return 0;
    }
    console.log(tableau[tableau.length-1],valeur);
    if(tableau[tableau.length-1] == valeur){
        return tableau.length-1;
    }
  
    while (min <= max) {
      // Trouver l'indice de l'élément au milieu du tableau
      let milieu = Math.floor((min + max) / 2);
  
      if (tableau[milieu].getTime() == valeur.getTime()) {
        // Si la valeur est trouvée, retourner son indice
        return milieu;
      } else if (tableau[milieu].getTime() < valeur.getTime()) {
        // Si la valeur recherchée est plus grande, continuer la recherche dans la moitié supérieure du tableau
        min = milieu + 1;
      } else {
        // Sinon, continuer la recherche dans la moitié inférieure du tableau
        max = milieu - 1;
      }
      //Si la valeur est contenu entre 2 valeurs consécutives du tableau
      if(tableau[milieu].getTime() < valeur.getTime() && valeur.getTime() < tableau[milieu+1].getTime()){
        return milieu;
      }
      if(tableau[milieu-1].getTime() < valeur.getTime() && valeur.getTime() < tableau[milieu].getTime()){
        return milieu;
      }
    }
    // Si la valeur n'est pas trouvée, retourner -1
    return -1;
}

