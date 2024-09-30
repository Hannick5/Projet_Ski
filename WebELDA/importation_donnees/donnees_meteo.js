// Obtenir la référence du bouton "Importer des données" et de l'input file
var BoutonImport = document.getElementById('b_import_meteo');
var fileInput = document.getElementById('fileInput');

//Récupération des élements de la section "VISUALISATION"
var BoutonCalcul = document.getElementById("b_calcul");
var form_meteo = document.getElementById("form_meteo");
var TextInfoGraphique = document.getElementById("texte_debut_graphique");

//Variables initialisées pour manipuler les données meteo
var data_meteo;
var DISPO = true;
var data_selec;
var saison = [0,0];
var infos;
var selection = new Array(); //Liste des élements que la requête utilisateur

var MeteoChart; //Graphique des données météo
var graphe_existant = false;

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

//_______________________________________ FONCTION MAIN ___________________________________________________


// ---------------------- PARTIE IMPORTATION DES DONNEES ----------------------

// Ajouter un gestionnaire d'événement au clic sur le bouton 'Importer des données'
BoutonImport.addEventListener('click', function() {
  // Déclencher un clic sur l'input file
  fileInput.click();

});

// Ajouter un gestionnaire d'événement pour la sélection de fichier dans l'input file
fileInput.addEventListener('change', function() {
  // Obtenir le fichier sélectionné
  var selectedFile = fileInput.files[0];
  //On effectue un FETCH pour récupérer le contenu du fichier au format .csv
  fetch("../BDD/data_import/"+selectedFile.name)
  .then(response => response.text())
  .then(data => {
      
      // Manipulations diverses sur le texte csv, pour le convertir à terme en requête d'insertion dans une table SQL
      data_meteo_csv = data.replace(/;/g, ","); //Texte de data_meteo
      data_meteo_csv = data_meteo_csv.split("\n");
      for(i=1;i<data_meteo_csv.length;i++){
        data_meteo_csv[i]= data_meteo_csv[i].split(",");
        data_meteo_csv[i][0] = "'"+data_meteo_csv[i][0]+"'";
        data_meteo_csv[i] = data_meteo_csv[i].join(",");
      }      
      nb_colonnes = data_meteo_csv[0].split(",").length;

      let filename = selectedFile.name.replace(".csv","");
      filename = filename.replace("_","");
      filename = filename.replace("-","");
      filename = filename.toLowerCase();

      //FETCH vers le fichier 'import_csv.php' qui va enregister le csv en tant que table SQL dans la BDD
      infos = "data="+JSON.stringify(data_meteo_csv)+"&nb_col="+nb_colonnes+"&filename="+filename;
      fetch('../BDD/import_csv.php',{
        method: 'post',
        body : infos,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        })
        .then(result => result.text())
        .then(r => {
            if(r == "success"){ //Succès
                alert("Le fichier de données météo <"+selectedFile.name+"> à été enregistré sur la base de données");
            }
            else{ //Echec
                alert("Le fichier de données météo <"+selectedFile.name+"> n'a pas pu être enregistré sur la base de données.\nCela est dû à l'erreur suivante : "+r);
            }
            
        });
  })
  .catch(error => {console.error(error);return false});
});


// ---------------------- PARTIE VISUALISATION DES DONNEES ----------------------

var canvas = document.getElementById("ChartMeteo"); //Creation d'un canvas pour y afficher le graphique
//Quand on clique sur le bouton Calculer
form_meteo.addEventListener('submit',function(e){

    e.preventDefault();
    
    //Données entrées par l'utilisateur : [saison hivernale, date de départ, date de fin, numéro de l'enneigeur]
    selection.debut = StringToDate(form_meteo.elements["debut"].value);
    selection.fin = StringToDate(form_meteo.elements["fin"].value);
    selection.variable = form_meteo.elements["choix_var_meteo"].value;
    selection.numero = form_meteo.elements["numero"].value;

    if (ValidationSelection(selection)){ //Si les données entrées par l'utilisateur sont cohérentes
        if(VerifBonnePeriode(selection)){ //Si la période entrée par l'utilisateur est correcte
            VerifDisponible(selection,saison).then(r => {
                if(r == true){ //Si les données sont disponibles
                    
                    data_selec = getDataMeteoSelec(data_meteo,selection); //Récupération des données

                    //Fonctions de lissage des données brutes
                    data_selec = lissageTotal(data_selec["normal"],data_selec); //Donne liste des valeurs moyennes par 24h
                    data_selec = lissageNuit(data_selec["nuit"],data_selec); //Donne liste des valeurs moyennes par nuit (19h-7h)
                    data_selec = lissageJour(data_selec["jour"],data_selec); //Donne liste des valeurs moyennes par journée (9h-17h)

                    TextInfoGraphique.remove(); //On enlève le texte dans la section graphique, pour affiché le graphique commandé
                    CreateMeteoChart(canvas,data_selec,selection); //Création du graphique (Chart.js)
                    console.log("Graphique réalisé avec succès !");
                }
                
            });
        }   
    }
});

//_____________________________________________________________________________________________
//FONCTIONS

/**
 * Fonction vérifiant si l'ordre des dates de début et de fin est cohérente.
 * @param {array} selection Liste des paramètres entrés par l'utilisateur.
 * @returns {boolean} Si l'ordre est correct ou non.
 */
function ValidationSelection(selection){

    let txt_error = "";
    //Vérification si tous les paramètres ont bien été renseignés
    let emptyIndexes = EmptyIndexes(selection); //Recherches des élements vides
    if(emptyIndexes.length > 0){
        txt_error += "ERREUR ! Vous avez oublié de rensigner les informations suivantes : \n";
        for(i=0;i<emptyIndexes.length;i++){
            let param = "";
            switch(emptyIndexes[i]){
                case 0: param = " - Date du début des enregistrements";break;
                case 1: param = " - Date de fin des enregistrements";break;
                case 3: param = " - Numéro de la station";break;
            }
            txt_error += param+"\n";
        }
        alert(txt_error);
        return false;
    }
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
    let variable = selection.variable;
    let num_station = selection.numero;
    //Récupération du nom de la table SQL en fonction de la selection
    let tablename = variable.toLowerCase();
    tablename = tablename.replace("_","");
    tablename = tablename.replace("-","");
    tablename += "20"+saison[0]+"20"+saison[1];
    //Préparation des infos à envoyer au fetch vers un fichier php
    infos = "&tablename="+tablename+"&id_object=Sonde_"+num_station;
    
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
        console.log(data);
        data_meteo = data;
        
        for(i=0;i<data_meteo['Datetime'].length;i++){ //Convertion des dates en éléments de type Date()
            data_meteo['Datetime'][i] = StringToDate(data_meteo['Datetime'][i]);
        }
        //Vérification : Si les données de la station sélectionnée ne sont pas dans le fichier, on annule l'opération
        if(!VerifStationDispo(data_meteo,num_station)){
            return false;
        }
        selection.numero = "Sonde_"+num_station;

        //Récupération des dates de début et de fin des données disponibles
        let debut_dispo = data_meteo['Datetime'][0];
        let fin_dispo = data_meteo['Datetime'][data_meteo['Datetime'].length-1];
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
 * @param {array} data_meteo Données récoltées.
 * @param {string} station_selec Nom de la station sélectionée par l'utilisateur.
 * @returns {boolean} Si les données de la station sont disponibles ou non.
 */
function VerifStationDispo(data_meteo,station_selec){

    let stations = Object.keys(data_meteo);
    let id_station;
    for(i=1;i<stations.length;i++){ //On parcourt la liste des stations (élement 0 skippé car = 'Datetime')
        //Si les deux derniers caractères du nom de colonne sont égaux à l'id de la station
        if(station_selec == stations[i].substring(6,stations[i].length)){
            return true;
        }
    }
    //Si on a rien trouvé
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

    for(year=14;year<22;year++){

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
 * @param {array} data_meteo Données récoltées depuis la base de données.
 * @param {array} selection Liste des paramètres entrés par l'utilisateur.
 * @returns {[array,array]} Array de [liste des dates,liste des valeurs].
 */
function getDataMeteoSelec(data_meteo,selection){

    let ind_debut = rechercheDichotomiqueDate(data_meteo['Datetime'],selection.debut);
    let ind_fin = rechercheDichotomiqueDate(data_meteo['Datetime'],selection.fin);

    let dates_selec = data_meteo['Datetime'].slice(ind_debut,ind_fin+1);
    let val_selec = data_meteo[selection.numero].slice(ind_debut,ind_fin+1);

    const evenNumbers = dates_selec.map((value, index) => ({ value, index })) // associe chaque valeur à son index
    .filter(({ value }) => value.getHours() >= 19 || value.getHours() < 7 )
    .map(({ index }) => index); // extrait les index filtrés

    //Ajout des données brutes
    let meteo_selec_total = new Array();
    meteo_selec_total["normal"] = [dates_selec,val_selec];
    meteo_selec_total = filtrageDataMeteo(dates_selec,val_selec,meteo_selec_total);

    return meteo_selec_total;
}



/**
 * Fonction qui va complétér données météo brutes en extrayant les données de NUIT [19 - 7h] et de JOUR [9h - 17h].
 * @param {array} dates_selec Array des dates des données météo brutes en entrée.
 * @param {array} val_selec Array des valeurs des données météo brutes en entrée.

 * @param {array} meteo_selec_total Array de l'ensemble des données météo calculées = [données brutes, données de JOUR et de NUIT (à ajouter) données lissées (à ajouter)].
 * @returns {number} Array de données météo moyennées toutes les 24h.
 */
function filtrageDataMeteo(dates_selec,val_selec,meteo_selec_total){

    let dates_selec_nuit = new Array();
    let dates_selec_jour = new Array();
    let val_selec_nuit = new Array();
    let val_selec_jour = new Array();

    let indices = new Array();
    indices["nuit"] = getIndicesNuit(dates_selec);
    indices["jour"] = getIndicesJour(dates_selec);

    for(i=0;i<dates_selec.length;i++){
        if(indices["nuit"].includes(i)){
            dates_selec_nuit.push(dates_selec[i]);
            val_selec_nuit.push(val_selec[i]);
        }
        else{
            val_selec_nuit.push(NaN);
        }
        if(indices["jour"].includes(i)){
            dates_selec_jour.push(dates_selec[i]);
            val_selec_jour.push(val_selec[i]);
        }
        else{
            val_selec_jour.push(NaN);
        }
    }

    meteo_selec_total["nuit"] = [dates_selec,val_selec_nuit];
    meteo_selec_total["jour"] = [dates_selec,val_selec_jour];

    return meteo_selec_total;
}


/**
 * Fonction qui va parcourir un Array de Dates et qui va renvoyer les indices des Dates dans la période de NUIT [19h - 7h].
 * @param {array} dates_selec Array initial des Dates.
 * @returns {array} Array des indices des Dates dans la période de NUIT [19h - 7h].
 */
function getIndicesNuit(dates_selec){

    return dates_selec.map((value, index) => ({ value, index })) // associe chaque valeur à son index
    .filter(({ value }) => value.getHours() >= 19 || value.getHours() < 7 )
    .map(({ index }) => index); // extrait les index filtrés  
}



/**
 * Fonction qui va parcourir un Array de Dates et qui va renvoyer les indices des Dates dans la période de JOUR [9h - 17h].
 * @param {array} dates_selec Array initial des Dates.
 * @returns {array} Array des indices des Dates dans la période de JOUR [9h - 17h].
 */
function getIndicesJour(dates_selec){

    return dates_selec.map((value, index) => ({ value, index })) // associe chaque valeur à son index
    .filter(({ value }) => value.getHours() >= 9 && value.getHours() < 17 )
    .map(({ index }) => index); // extrait les index filtrés  
}



/**
 * Fonction qui va construire le graphique final (avec Chart.js) avec les données récoltées.
 * @param {HTMLCanvasElement} canvas Canvas du graphique dans le document HTML.
 * @param {array} data_rapport Array de [liste des dates,liste des valeurs].
 * @param {array} selection Liste des paramètres entrés par l'utilisateur.
 * @returns {void}
 */
function CreateMeteoChart(canvas,data_meteo,selection){

    let titre = "",titre_prefixe;
    switch(selection.variable){
        case 'Temperature': titre_prefixe = "Température sèche (en °C)";break;
        case 'Humidite': titre_prefixe = "Hygrométrie (pourcentage d'humidité)";break;
        case 'Direction_vent': titre_prefixe = "Direction du vent (en degrés : 0° = Nord)";break;
        case 'Vitesse_vent': titre_prefixe = "Vitesse du vent (en km/h)";break;
    }
    selection.numero = selection.numero.replace("Sonde_","");
    titre += titre_prefixe + " mesuré par la sonde n°"+selection.numero+". Période du "+DateToString(data_meteo["normal"][0][0])+" au "+DateToString(data_meteo["normal"][0][data_meteo["normal"][0].length-1]);

    if(graphe_existant == true){//Si il y avait déja un graphique, on le détruit
        MeteoChart.destroy();
    }

    //Si il y a plus de 2500 données brutes, on les masque
    let hidden_donnees_brutes = false;
    if(data_meteo["normal"][0].length > 2500){
        hidden_donnees_brutes = true;
    }

    //Création du graphique
    MeteoChart = new Chart(canvas,{
        data: {
            datasets: [{
                type: 'line',
                label: 'Normal (données brutes)',
                data: data_meteo["normal"][1],
                borderColor: "green",
                point: {
                    radius: 0,
                    hoverRadius: 2,
                },
                order: 1,
                hidden : hidden_donnees_brutes
            },{
                type: 'line',
                label: 'Nuit (de 19h à 7h)',
                data: data_meteo["nuit"][1],
                borderColor: "blue",
                point: {
                    radius: 0,
                    hoverRadius: 2,
                },
                hidden: true,
                order: 4,
                spanGaps: false
            },{
                type: 'line',
                label: 'Journée (de 9h à 17h)',
                data: data_meteo["jour"][1],
                borderColor: "red",
                point: {
                    radius: 0,
                    hoverRadius: 2,
                },
                hidden: true,
                order: 5,
                spanGaps: false
            },{
                type: 'line',
                label: 'Lissage des données brutes (1 valeur/24h)',
                data: data_meteo["lissage_normal"][1],
                borderColor: "magenta",
                point: {
                    radius: 0,
                    hoverRadius: 2,
                },
                order: 0,
                spanGaps: true,
                tension: 0.5 // Courbe légèrement les lignes
            },{
                type: 'line',
                label: 'Lissage des données Nuit (1 valeur/nuit)',
                data: data_meteo["lissage_nuit"][1],
                borderColor: "brown",
                point: {
                    radius: 0,
                    hoverRadius: 2,
                },
                hidden: true,
                order: 2,
                spanGaps: true,
                tension: 0.5 // Courbe légèrement les lignes
            },{
                type: 'line',
                label: 'Lissage des données Journée (1 valeur/journée)',
                data: data_meteo["lissage_jour"][1],
                borderColor: "orange",
                point: {
                    radius: 0,
                    hoverRadius: 2,
                },
                hidden: true,
                order: 3,
                spanGaps: true,
                tension: 0.5 // Courbe légèrement les lignes
            }],
            labels: data_meteo["normal"][0],
        },
    
        options:{
            plugins: {
                title: {
                    display: true,
                    text: titre,
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
                        text: titre_prefixe // Légende de l'axe y
                    }
                }
            }
        }
    })
    graphe_existant = true;
}

//-------------------------------------------------------------------------------------------------------------------------------
//FONCTIONS UTILES

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


//-------------------------------------------------------------------------------------------------------------------------------
//FONCTIONS DE LISSAGE


/**
 * Fonction qui va lisser les données météo brutes en un Array de données moyennées toutes les 24h.
 * @param {array} data_meteo Array des données météo brutes en entrée.
 * @param {array} meteo_selec_total Array de l'ensemble des données météo calculées = [données brutes (normal,de jour et de nuit), données lissées (à ajouter)].
 * @returns {number} Array de données météo moyennées toutes les 24h.
 */
function lissageTotal(data_meteo,meteo_selec_total){

    let moy_jour = 0;
    let nb_jour = 0;

    let dates_meteo_lissage = new Array();
    let val_meteo_lissage = new Array();
    let val_meteo = new Array();
    console.log(data_meteo[0]);

    val_meteo.push(NaN);
    
    for(i=1;i<data_meteo[0].length;i++){
        //Si on est dans le même jour
        if(data_meteo[0][i].getDate()==data_meteo[0][i-1].getDate() || i==1){
            //Si on passe les 12h
            if(data_meteo[0][i].getHours()>=12 && data_meteo[0][i-1].getHours()<12){
                val_meteo.push(1); //Marqueur
            }
            else{//Sinon, on ne marque rien
                val_meteo.push(NaN);
            }
            //Ajout de la donnée
            moy_jour += parseFloat(data_meteo[1][i]);
            nb_jour += 1;
        }
        //Si on change de jour
        else{
            val_meteo.push(NaN);
            moy_jour = moy_jour/nb_jour; //Moyenne sur les 24h
            let vdate = data_meteo[0][i-1]; //Récupération de la date correspondant au 24h
            //Ajout de la donnée moyennée
            dates_meteo_lissage.push(new Date(vdate.getFullYear(),vdate.getMonth()+1,vdate.getDate(),12));
            val_meteo_lissage.push(moy_jour);
            //On recommence pour les 24h suivantes
            moy_jour = parseFloat(data_meteo[1][i]);
            nb_jour = 1;
        }
    }
    //Pour le dernier jour :
    moy_jour = moy_jour/nb_jour;
    val_meteo_lissage.push(moy_jour);

    //On ajoute les données moyénées au indices des marqueurs de 12h
    let ind_ajout_val = 0;
    for(j=0;j<val_meteo.length;j++){
        if(val_meteo[j] == 1){
            val_meteo[j] = val_meteo_lissage[ind_ajout_val];
            ind_ajout_val += 1;
        }
    }
    //Ajout dans l'Array de l'ensemble des données météo calculées
    meteo_selec_total["lissage_normal"] = [dates_meteo_lissage,val_meteo];

    return meteo_selec_total;
}



/**
 * Fonction qui va lisser les données météo brutes en un Array de données moyennées toutes les périodes de NUIT [19h - 7h].
 * @param {array} data_meteo Array des données météo brutes en entrée.
 * @param {array} meteo_selec_total Array de l'ensemble des données météo calculées = [données brutes (normal,de jour et de nuit), données lissées (à ajouter)].
 * @returns {number} Array de données météo moyennées toutes les périodes de NUIT [19h - 7h].
 */
function lissageNuit(data_meteo,meteo_selec_total){

    let moy_jour = 0;
    let nb_jour = 0;

    let dates_meteo_lissage = new Array();
    let val_meteo_lissage = new Array();
    let val_meteo = new Array();

    if(data_meteo[0][0].getHours()<=12){
        val_meteo.push(1);
    }
    
    for(i=1;i<data_meteo[0].length;i++){
        //Si on est dans la période NUIT [19h - 7h]
        if(!((data_meteo[0][i].getHours()>=7 && data_meteo[0][i-1].getHours()<7) || (i==data_meteo[0].length-1))){ //Si on sort de la période nocturne
            //Si on passe minuit
            if(data_meteo[0][i].getDate()!=data_meteo[0][i-1].getDate()){ //On marque la date la plus proche de minuit
                val_meteo.push(1); //Marqueur
            }
            else{//Sinon, on ne marque rien
                val_meteo.push(NaN);
            }
            //Ajout de la donnée
            if(!isNaN(parseFloat(data_meteo[1][i]))){
                moy_jour += parseFloat(data_meteo[1][i]); //On ajoute la valeur pour calculer le moyenne plus tard
                nb_jour += 1; //On dénombre le nombre de valeurs ajoutées
            }  
        }
        //Si la période de NUIT se termine
        else{
            val_meteo.push(NaN);
            moy_jour = moy_jour/nb_jour; //On calcule la moyenne sur la période nocturne
            let vdate = data_meteo[0][i]; //On récupère la date coorespondant au minuit de la période nocturne
            //Ajout de la donnée moyennée
            dates_meteo_lissage.push(new Date(vdate.getFullYear(),vdate.getMonth()+1,vdate.getDate()));
            val_meteo_lissage.push(moy_jour);
            //On réinitialise en prévision de la nuit suivante
            moy_jour = 0;
            nb_jour = 0;
        }
    }

    val_meteo.push(1);//Pour la dernière valeur de minuit

    //On ajoute les données moyénées au indices des marqueurs de minuit
    let ind_ajout_val = 0;
    for(j=0;j<val_meteo.length;j++){
        if(val_meteo[j] == 1){
            val_meteo[j] = val_meteo_lissage[ind_ajout_val];
            ind_ajout_val += 1;
        }
    }

    //Ajout dans l'Array de l'ensemble des données météo calculées
    meteo_selec_total["lissage_nuit"] = [dates_meteo_lissage,val_meteo];

    return meteo_selec_total;
}



/**
 * Fonction qui va lisser les données météo brutes en un Array de données moyennées toutes les périodes de JOUR [7h - 19h].
 * @param {array} data_meteo Array des données météo brutes en entrée.
 * @param {array} meteo_selec_total Array de l'ensemble des données météo calculées = [données brutes (normal,de jour et de nuit), données lissées (à ajouter)].
 * @returns {number} Array de données météo moyennées toutes les périodes de NUIT [7h - 19h].
 */
function lissageJour(data_meteo,meteo_selec_total){

    let moy_jour = 0;
    let nb_jour = 0;

    let dates_meteo_lissage = new Array();
    let val_meteo_lissage = new Array();
    let val_meteo = new Array();

    val_meteo.push(NaN);
    for(i=1;i<data_meteo[0].length;i++){
        //Si on est dans la période JOUR [9h - 17h]
        if(!(data_meteo[0][i].getHours()>=17 && data_meteo[0][i-1].getHours()<17)){ //Si on sort de la période nocturne
            //Si on passe 12h
            if(data_meteo[0][i].getHours()>=12 && data_meteo[0][i-1].getHours()<12){
                val_meteo.push(1); //Marqueur
            }
            else{//Sinon, on ne marque rien
                val_meteo.push(NaN);
            }
            //Ajout de la donnée
            if(!isNaN(parseFloat(data_meteo[1][i]))){
                moy_jour += parseFloat(data_meteo[1][i]); //On ajoute la valeur pour calculer le moyenne plus tard
                nb_jour += 1; //On dénombre le nombre de valeurs ajoutées
            }
        }
        //Si la période de JOUR se termine       
        else{
            val_meteo.push(NaN);
            moy_jour = moy_jour/nb_jour; //On calcule la moyenne sur la période nocturne
            let vdate = data_meteo[0][i]; //On récupère la date coorespondant au minuit de la période nocturne
            //Ajout de la donnée moyennée           
            dates_meteo_lissage.push(new Date(vdate.getFullYear(),vdate.getMonth()+1,vdate.getDate()));
            val_meteo_lissage.push(moy_jour);
            //On réinitialise en prévision de la journée suivante
            moy_jour = 0;
            nb_jour = 0;
        }
    }

    //On ajoute les données moyénées au indices des marqueurs de 12h
    let ind_ajout_val = 0;
    for(j=0;j<val_meteo.length;j++){
        if(val_meteo[j] == 1){
            val_meteo[j] = val_meteo_lissage[ind_ajout_val];
            ind_ajout_val += 1;
        }
    }

    //Ajout dans l'Array de l'ensemble des données météo calculées
    meteo_selec_total["lissage_jour"] = [dates_meteo_lissage,val_meteo];

    return meteo_selec_total;
}