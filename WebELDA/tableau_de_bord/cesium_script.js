const Bouton2D = document.getElementById("bouton_2D"); //Boutons 2D et 3D
const Bouton3D = document.getElementById("bouton_3D");
//Configuration par défaut : 
Bouton3D.toggleIndex = 1;
Bouton3D.style.borderColor = "green";
Bouton2D.toggleIndex = 0;
Bouton2D.style.borderColor = "red";

//Texte dans la div box_mode du Cesium Container
var ModeTitle = document.getElementById("box_titre_mode");
var ModeText = document.getElementById("box_texte_mode");

//Div de la pop up informant de l'épaisseur de neige à un point donné
var EpNeigePopup = document.getElementById("snowDepthValue");

//Texte d'introduction dans la section graphique
var TextInfoGraphique = document.getElementById("elevationProfileText");

//Pour les boutons Calculer et Effacer le profil
var was_never_active = new Array();
was_never_active.CalculProfil = true;
was_never_active.EffacerProfil = true;
was_never_active.CalculVolume = true;
was_never_active.EffacerPolygone = true;

//Pour la partie Polygone, variable de dessin polygonal
var thePolygonDrawing = null;

//Pour l'affichage des étiquettes des enneigeurs
var zoomLevel; //Niveau de zoom
var bigZoom = false; //Indicateur de visibilité des étiquettes : au dela d'un certain niveau de zoom, cette valeur devient true



//-------------------------------------------- SECTION SELECTION du TABLEAU DE BORD --------------------------------------------

var date_selec; //Date sélectionnée par l'utilisateur
//Bouton de validation de la sélection de l'utilisateur
const InputDate = document.getElementById("calendrier");
const CurseurNeige = document.getElementById("cursor");
const BoutonValider = document.getElementById("valider_selection");

//Quand on clique sur le bouton Valider
BoutonValider.addEventListener('click',function(e){
  date_selec = InputDate.value; //On récuppère la date sélectionnée

  fetch('http://localhost:50000/bbox')//FETCH vers le serveur Python qui récupère la Bounding Box du geotiff de la BDD
  .then(response => response.json())
  .then(data => {
    // Stocker les valeurs de la bounding box dans des variables globales
    west = data[0];
    south = data[1];
    east = data[2];
    north = data[3];
  })
  .catch(error => console.error(error));

  fetch('http://localhost:50000/image')//FETCH vers le serveur Python qui construit un pngà partir du geotiff de la BDD
    .then(response => response.json())
    .then(data => {
      //Récupération de l'image en Base 64
      const imgBase64 = data.imgBase64;
      const imgData = atob(imgBase64);
      const imgArray = new Uint8Array(imgData.length);
      for (let i = 0; i < imgData.length; i++) {
        imgArray[i] = imgData.charCodeAt(i);
      }
      const imgBlob = new Blob([imgArray], {type: 'image/png'});
      const imgURL = URL.createObjectURL(imgBlob);
      //Création une couche d'imagerie à partir de l'URL de l'image et de la bounding box
      const imageryLayer = new Cesium.ImageryLayer(
        new Cesium.SingleTileImageryProvider({
          url: imgURL,
          rectangle: Cesium.Rectangle.fromDegrees(west,south,east,north),
        })
      );
      // Ajouter la couche d'imagerie à la carte
      viewer.imageryLayers.add(imageryLayer);
    })
    .catch(error => console.error(error));
});



//-------------------------------------------- SECTION CHARGEMENT DU CESIUM VIEWER --------------------------------------------

var extent = Cesium.Rectangle.fromDegrees(6.48,44.89,6.64,44.97); //Rectangle de la prise de vue du domaine skiable
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = extent; //On braque la caméra sur la prise de vue
Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

//Chemin de connexion vers Cesium
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZDZlNjVmNy05NDljLTQ0N2QtOTUxOC0zZDI2OGRlN2M0ZTEiLCJpZCI6MTI5MjQ3LCJpYXQiOjE2NzkxMDM5MzB9.Tg7aSLwwJsDszMtkyNF5IxJWDaxb81_W8hfx2r78vAY';

// Chargement du Cesium Viewer
var viewer = new Cesium.Viewer("CesiumContainer",{
    Geocoder : false,
    Animation: false,
    CredistDisplay : false,
    Timeline : false,
    FullscreenButton : false,
    terrainProvider: Cesium.createWorldTerrain()
});

const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

//Partie pour gérer la couche d'épaisseur de neige
var epaisseur_de_neige = new Cesium.IonImageryProvider({ assetId: 1633225 });
const layer = viewer.imageryLayers.addImageryProvider(epaisseur_de_neige);

//Définition du convertisseur de coordonnées (CC45 vers WGS 84)
proj4.defs("EPSG:3945", "+proj=lcc +lat_0=45 +lon_0=3 +lat_1=44.25 +lat_2=45.75 +x_0=1700000 +y_0=4200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");



//-------------------- SECTION GESTION DES BOUTONS 2D ET 3D du TABLEAU DE BORD sur le CESIUM VIEWER ---------------------

//Click sur le bouron 2D
Bouton2D.addEventListener("click",function(e){
  if(Bouton2D.toggleIndex == 0){//Si et seulement si le bouton est inactif
      //Désactivation du bouton 3D
      Bouton3D.toggleIndex = 0;
      Bouton3D.style.borderColor = "red";
      //Activation du bouton 2D
      Bouton2D.toggleIndex = 1;
      Bouton2D.style.borderColor = "green";

      //Viewer en 2D
      viewer.scene.mode = Cesium.SceneMode.SCENE2D;
  }  
});

//Click sur le bouron 2D
Bouton3D.addEventListener("click",function(e){
  if(Bouton3D.toggleIndex == 0){//Si et seulement si le bouton est inactif
      //Désactivation du bouton 2D
      Bouton2D.toggleIndex = 0;
      Bouton2D.style.borderColor = "red";
      //Activation du bouton 3D
      Bouton3D.toggleIndex = 1;
      Bouton3D.style.borderColor = "green";
      
      //Viewer en 3D
      viewer.scene.mode = Cesium.SceneMode.SCENE3D;
  }
});



//---------------------------------- SECTION CHARGEMENT DES GEOJSON sur le CESIUM VIEWER --------------------------------------------

Cesium.GeoJsonDataSource.clampToGround = true;

// Chargement des entités GeoJSON à partir de la base de données PostgreSQL
fetch("../BDD/pistes.php") //FETCH vers le fichier PHP qui va charger le fichier geojson des pistes depuis la BDD
    .then(response => response.json())
    .then(data => {
      var pistesPromise = Cesium.GeoJsonDataSource.load(data);
      // Attente de la résolution des promesses
      Promise.all([pistesPromise]).then(function(dataSources) {
        var pistes = dataSources[0].entities;

        // Ajout des entités à la scène Cesium
        viewer.dataSources.add(dataSources[0]);

        // Ajout des gestionnaires d'événements pour les boutons d'affchage des pistes
        pistes.show = true; //Initialement, on affiche les pistes
        var togglePistesButton = document.getElementById("pistes");
        togglePistesButton.addEventListener('click', function() {
          pistes.show = !pistes.show;
        });
        viewer.zoomTo(pistes);
      }).catch(function(error) {
        console.log(error);
      });
    })
    .catch(error => console.log("Erreur lors de la récupération du GeoJSON : " + error));

fetch("../BDD/anemos.php")//FETCH vers le fichier PHP qui va charger le fichier geojson des anémomètres depuis la BDD
  .then(response => response.json())
  .then(data => {
    var anemosPromise = Cesium.GeoJsonDataSource.load(data);
    // Attente de la résolution des promesses
    Promise.all([anemosPromise]).then(function(dataSources) {
      var anemos = dataSources[0].entities;

      // Ajout des entités à la scène Cesium
      viewer.dataSources.add(dataSources[0]);

      // Ajout des styles pour les entités
      anemos.values.forEach(function(entity) {
        entity.point = new Cesium.PointGraphics({
          color: Cesium.Color.GREEN,
          pixelSize: 10,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          image: new Cesium.ConstantProperty('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="green" /></svg>')
        });
      });

      // Ajout des gestionnaires d'événements pour les boutons d'affchage des pistes
      anemos.show = false; //Initialement, on affiche pas les anémomètres
      var toggleAnemosButton = document.getElementById("anemos");
      toggleAnemosButton.addEventListener('click', function() {
        anemos.show = !anemos.show;
      });
  });
})
.catch(error => console.log("Erreur lors de la récupération du GeoJSON : " + error));

fetch("../BDD/enneigeurs.php") //FETCH vers le fichier PHP qui va charger le fichier geojson des enneigeurs depuis la BDD
.then(response => response.json())
.then(data => {
  var regardPromise = Cesium.GeoJsonDataSource.load(data);
  // Attente de la résolution des promesses
  Promise.all([regardPromise]).then(function(dataSources) {
    var regard = dataSources[0].entities;

    // Ajout des entités à la scène Cesium
    viewer.dataSources.add(dataSources[0]);

    // Ajout des styles pour les entités
    regard.values.forEach(function(entity) {
      entity.point = new Cesium.PointGraphics({
        color: Cesium.Color.RED,
        pixelSize: 10,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        image: new Cesium.ConstantProperty('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="red" /></svg>')
      });
      entity.label = { //Etiquette de l'enneigeur
        text: ''+entity.properties._Regard._value+'',
        font: '1px sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: Cesium.Color.BLACK,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0,0)
      }
    });

    //Ajout d'un écouteur d'évènement sur le mouvement de la caméra, pour adapter la taille des étiquettes des enneigeurs en fonction du zoom
    viewer.scene.camera.moveEnd.addEventListener(function() {
    zoomLevel = viewer.scene.camera.positionCartographic.height / 1000; // Définition du niveau de zoom

    let newPixelSize = 1; //nouvelle taille en px de l'étiquette
    let newOffset = 0; //nouvel offset de la position de l'étiquette
    let newBigZoom = false; //nouveau indicateur de visibilité des étiquettes

    if(zoomLevel <= 2.75){ //seuil 1
        newPixelSize = 16;
        newOffset = 15;
        newBigZoom = true;
    }
    else if(zoomLevel <= 3){ //seuil 2
        newPixelSize = 12;
        newOffset = 8;
        newBigZoom = true;
    }
    else if(zoomLevel <= 3.5){ //seuil 3
        newPixelSize = 10;
        newOffset = 5;
        newBigZoom = true;
    }
    if(bigZoom || newBigZoom){ //Si l'ancien ou le nouveau indicateur de visibilité est true, on update l'affichage des étiquettes
        // Changement de taille des étiquettes et de leur offset par rapport à l'entité
        regard.values.forEach(function(entity) {
            entity.label.font = newPixelSize+'px sans-serif';
            entity.label.pixelOffset = new Cesium.Cartesian2(0,newOffset);
          });
      }
      bigZoom = newBigZoom; //L'ancien indicateur devient le nouveau indicateur
    });

    // Ajout des gestionnaires d'événements pour les boutons d'affchage des pistes
    regard.show = false; //Initialement, on affiche pas les enneigeurs
    var toggleRegardButton = document.getElementById("enneigeurs");
    toggleRegardButton.addEventListener('click', function() {
      regard.show = !regard.show;
    });
  });
})
.catch(error => console.log("Erreur lors de la récupération du GeoJSON : " + error));


fetch("../BDD/sondes.php") //FETCH vers le fichier PHP qui va charger le fichier geojson des sondes depuis la BDD
  .then(response => response.json())
  .then(data => {
    var sondesPromise = Cesium.GeoJsonDataSource.load(data);
    // Attente de la résolution des promesses
    Promise.all([sondesPromise]).then(function(dataSources) {
      var sondes = dataSources[0].entities;

      // Ajout des entités à la scène Cesium
      viewer.dataSources.add(dataSources[0]);

      // Ajout des styles pour les entités
      sondes.values.forEach(function(entity) {
        entity.point = new Cesium.PointGraphics({
          color: Cesium.Color.BLUE,
          pixelSize: 10,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        });
      });

      // Ajout des gestionnaires d'événements pour les boutons d'affchage des pistes
      sondes.show = false;//Initialement, on affiche pas les sondes
      var toggleSondesButton = document.getElementById("sondes");
        toggleSondesButton.addEventListener('click', function() {
          sondes.show = !sondes.show;
        });
  });
})
.catch(error => console.log("Erreur lors de la récupération du GeoJSON : " + error));




//---------------------------------- SECTION OPERATEURS DU NIVEAU DE NEIGE sur le CESIUM VIEWER --------------------------------------------


/**
 * Fonction mettant à jour la valeur de l'épaisseur de neige affichée dans une div HTML.
 * @param {float} X Coordonnée X (en CC45).
 * @param {float} Y Coordonnée Y (en CC45).
 * @param {HTMLCollection} divHTML Div HTML du texte à afficher.
 * @param {float} value Valeur de hauteur de neige à afficher.
 * @returns {void}
 */
function updateSnowDepthValue(X,Y,divHTML,value) {

  divHTML.innerHTML = "<p>Position (X,Y) CC45 : ("+X+","+Y+")"+"<br>Hauteur de neige : "+parseFloat(value).toFixed(3)+" m.<br><button id='close_popup'>Fermer</button></p>";
  var ClosePopupButton = document.getElementById("close_popup"); //Ajout d'un bouton 'Fermer'
  ClosePopupButton.addEventListener('click',function(e){
      divHTML.innerHTML = "Cliquez sur une position sur les pistes pour afficher sa hauteur de neige correspondante";
  });
}



/**
 * Fonction mettant à jour le volume de neige affichée dans une div HTML.
 * @param {HTMLCollection} divHTML Div HTML du texte à afficher.
 * @param {float} value Valeur de hauteur de neige à afficher.
 * @returns {void}
 */
function updateSnowVolumeValue(divHTML,value) {

  divHTML.innerHTML = "<p>Volume de neige : "+parseFloat(value).toFixed(3)+" m³.<br><button id='close_popup_volume'>Fermer</button></p>";
  var ClosePopupButtonVolume = document.getElementById("close_popup_volume");
  ClosePopupButtonVolume.addEventListener('click',function(e){ //Ajout d'un bouton 'Fermer'
      divHTML.innerHTML = "<p>Au sein d'une piste, tracez un polygone, puis cliquez sur le bouton pour afficher le volume de neige dans ce polygone<button id='valider_polygone' type='button' value='Calculer'>Calculer</button><button id='effacer_polygone' type='button' value='Effacer'>Effacer</button></p>";
      thePolygonDrawing.reset(); //Réinitialisation du polygone
      thePolygonDrawing.startDrawing(); //Autorisation de dessiner à nouveau
      //Réactivation des boutons 'Valider' et 'Effacer'
      let BoutonCalculVolume = document.getElementById("valider_polygone");
      BoutonCalculVolume.disabled = true;
      let BoutonEffacerPolygone = document.getElementById("effacer_polygone");
      BoutonEffacerPolygone.disabled = true;
    });
}



/**
 * Fonction calculant la hauteur de neige à une position donnée via un FETCH vers le serveur Python.
 * @param {float} lon Coordonnée X (en CC45).
 * @param {float} lat Coordonnée Y (en CC45).
 * @param {HTMLCollection} divHTML Div HTML du texte à afficher.
 * @param {float} value Valeur de hauteur de neige à afficher.
 * @returns {void}
 */
function getSnowDepth(lon,lat,divHTML) {
  // Créer un objet FormData pour envoyer les données
  const formData = new FormData();
  formData.append('lon', lon);
  formData.append('lat', lat);
  fetch('http://127.0.0.1:50000/getSnowDepth', { //FETCH vers le serveur Python
    method: 'POST',
    body: formData
  })
    .then(response => response.text())
    .then(data => {
      if (data !== "0" && data !== "1") {
          updateSnowDepthValue(lon,lat,divHTML,data);
      }
    })
    .catch(error => {
      console.error('Erreur :', error);
    });
}



/**
 * Fonction calculant les hauteurs de neige sur le profil linéaire via un FETCH vers le serveur Python.
 * @param {array} lst_lon Liste des coordonnées X du profil linéaire (en CC45).
 * @param {array} lst_lat Liste des coordonnées Y du profil linéaire (en CC45).
 * @returns {array} Liste des hauteurs de neige sur le profil linéaire.
 */
function getSnowDepthProfile(lst_lon,lst_lat) {
  // Créer un objet FormData pour envoyer les données
  const formData = new FormData();
  formData.append('lon', lst_lon);
  formData.append('lat', lst_lat);

  return fetch('http://127.0.0.1:50000/getSnowDepthProfile', { //FETCH vers le serveur Python
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      if (data !== "0" && data !== "1") {
          ordonne = data; //Récupération des données
          if(canvas.style.display == "none"){ //Si le canvas n'a jamais été affiché
            TextInfoGraphique.remove(); //On enlève le texte explicatif
            canvas.style.display = "flex"; //On affiche le canvas
          }
          return ordonne; //On retourne la liste des hauteurs de neige
      }
    })
    .catch(error => {
      console.error('Erreur :', error);
    });
}



/**
 * Fonction calculant le volume de neige via un FETCH vers le serveur Python.
 * @param {array} lst_lon Liste des coordonnées X du polygone (en CC45).
 * @param {array} lst_lat Liste des coordonnées Y du polygone (en CC45).
 * @param {HTMLCollection} divHTML Div HTML du texte à afficher.
 * @returns {void}
 */
function getSnowVolume(lst_lon,lst_lat,divHTML) {
  // Créer un objet FormData pour envoyer les données
  const formData = new FormData();
  formData.append('lon', lst_lon);
  formData.append('lat', lst_lat);

  fetch('http://127.0.0.1:50000/getSnowVolume', { //FETCH vers le serveur Python
      method: 'POST',
      body: formData
  })
  .then(response => response.text())
  .then(data => {
      if (data !== "0" && data !== "1") {
        updateSnowVolumeValue(divHTML,data);
      }
  })
  .catch(error => {
      console.error('Erreur :', error);
  });
}

//Récupération du conteneur pour le graphique
const canvas = document.getElementById("ChartEpNeige");
var graphe_existant = false;
canvas.style.display = "none"; //Initialement, on affiche pas le graphique
var ProfileChart; //Graphique du profil des hauteurs de neige
//Données en abscisse et en ordonnée
var abscisse = [];
var ordonne = [];



/**
 * Fonction qui va construire le graphique final des hauteurs de neige sur le profil linéaire (avec Chart.js) avec les données récoltées.
 * @param {HTMLCanvasElement} canvas Canvas du graphique dans le document HTML.
 * @param {array} abscisse Données du graphique en abscisse.
 * @param {array} ordonne LDonnées du graphique en ordonnée.
 * @returns {void}
 */
function CreateProfileChart(canvas,abscisse,ordonne){

  console.log(graphe_existant);
  if(graphe_existant){
    ProfileChart.destroy();
    console.log("destruction");
  }
  // Créer le graphique initial
  ProfileChart = new Chart(canvas, {
    type: 'scatter',
    data: {
      labels: abscisse,
      datasets: [{
        label: 'Profil de l\'épaisseur de neige entre deux points',
        data: ordonne,
        borderWidth: 1,
        showLine: true
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  graphe_existant = true;
}



//-------------------------------------- SECTION GESTION DES MODES sur le CESIUM VIEWER ----------------------------------------

// Compteur de points choisis par l'utilisateur sur le Cesium Viewer
var numPointsChosen = 0;

// Ajouter les boutons pour basculer entre les modes "épaisseur de neige", "sélectionner entité" et "choisir les deux points"
var epaisseurDeNeigeButton = document.getElementById("ep_neige")
var selectionnerEntiteButton = document.getElementById("selec")
var choisirDeuxPointsButton = document.getElementById("profil");
var polygoneButton = document.getElementById("polygone");
let startEntity, endEntity,ProfilLine;

// Activer le mode "épaisseur de neige" par défaut
var mode = 'epaisseurDeNeige';

// Ajouter un gestionnaire d'événements pour le bouton "épaisseur de neige"
epaisseurDeNeigeButton.addEventListener('click', function() {
  mode = 'epaisseurDeNeige';
  ModeTitle.innerHTML = "Mode : Epaisseur de neige";
  ModeText.innerHTML = "Cliquez sur une position sur les pistes pour afficher sa hauteur de neige correspondante";
  //On active le mode
  epaisseurDeNeigeButton.classList.add('active');
  selectionnerEntiteButton.classList.remove('active');
  //On désactive les autres modes
  selectionnerEntiteButton.checked = false;
  choisirDeuxPointsButton.classList.remove('active');
  choisirDeuxPointsButton.checked = false;
  polygoneButton.classList.remove('active');
  polygoneButton.checked = false;
  //Si on a sélectionné ce mode, on retire du Cesium Viewer toutes les entités
  //Celles du mode 'Calcul Profil'
  if (startEntity) {
    viewer.entities.remove(startEntity);
  }
  if (endEntity) {
    viewer.entities.remove(endEntity);
  }
  if (ProfilLine){
    viewer.entities.remove(ProfilLine);
  }
  //Celles du mode 'Volume - Tracé de polygone'
  if(thePolygonDrawing != null){
    thePolygonDrawing.reset();
    thePolygonDrawing.stopDrawing();
    thePolygonDrawing = null;
  }
});

// Ajouter un gestionnaire d'événements pour le bouton "sélectionner entité"
selectionnerEntiteButton.addEventListener('click', function() {
  mode = 'selectionnerEntite';
  ModeTitle.innerHTML = "Mode : Sélection d'entités";
  ModeText.innerHTML = "Cliquez sur une entité pour afficher ses caractéristiques";
  //On active le mode
  selectionnerEntiteButton.classList.add('active');
  epaisseurDeNeigeButton.classList.remove('active');
  //On désactive les autres modes
  epaisseurDeNeigeButton.checked = false;
  choisirDeuxPointsButton.classList.remove('active');
  choisirDeuxPointsButton.checked = false;
  polygoneButton.classList.remove('active');
  polygoneButton.checked = false;
  //Si on a sélectionné ce mode, on retire du Cesium Viewer toutes les entités
  //Celles du mode 'Calcul Profil'
  if (startEntity) {
    viewer.entities.remove(startEntity);
  }
  if (endEntity) {
    viewer.entities.remove(endEntity);
  }
  if (ProfilLine){
    viewer.entities.remove(ProfilLine);
  }
  //Celles du mode 'Volume - Tracé de polygone'
  if(thePolygonDrawing != null){
    thePolygonDrawing.reset();
    thePolygonDrawing.stopDrawing();
    thePolygonDrawing = null;
  }
});

// Ajouter un gestionnaire d'événements pour le bouton "choisir les deux points"
choisirDeuxPointsButton.addEventListener('click', function() {
  mode = 'choisirDeuxPoints';
  ModeTitle.innerHTML = "Mode : Calcul du profil des hauteurs de neige";
  ModeText.innerHTML = "<p>Au sein d'une piste, cliquez sur 2 points pour tracer une ligne, puis cliquez sur le bouton pour afficher un graphique ci-dessous des hauteurs de neige sur cette ligne <button id='valider_calcul_profil' type='button' value='Calculer'>Calculer</button><button id='effacer_profil' type='button' value='Effacer'>Effacer</button></p>";
  //On active le mode
  choisirDeuxPointsButton.classList.add('active');
  epaisseurDeNeigeButton.classList.remove('active');
  //On désactive les autres modes
  epaisseurDeNeigeButton.checked = false;
  selectionnerEntiteButton.classList.remove('active');
  selectionnerEntiteButton.checked = false;
  polygoneButton.classList.remove('active');
  polygoneButton.checked = false;

  //On récupère les boutons 'Calculer' et 'Effacer' initialement désactivés car rien est encore tracé sur le Cesium Viewer
  let BoutonCalculProfil = document.getElementById("valider_calcul_profil");
  BoutonCalculProfil.disabled = true;
  let BoutonEffacerProfil = document.getElementById("effacer_profil");
  BoutonEffacerProfil.disabled = true;
  //Si on a sélectionné ce mode, on retire du Cesium Viewer toutes les entités
  //Celles du mode 'Volume - Tracé de polygone'
  if(thePolygonDrawing != null){
    thePolygonDrawing.reset();
    thePolygonDrawing.stopDrawing();
    thePolygonDrawing = null;
    numPointsChosen = 0;
  }
});

// Ajouter un gestionnaire d'événements pour le bouton "Tracé de polygone"
polygoneButton.addEventListener('click', function() {
  mode = 'volumeDeNeige';
  ModeTitle.innerHTML = "Mode : Calcul de volume de neige dans un polygone";
  ModeText.innerHTML = "<p>Au sein d'une piste, tracez un polygone, puis cliquez sur le bouton pour afficher le volume de neige dans ce polygone<button id='valider_polygone' type='button' value='Calculer'>Calculer</button><button id='effacer_polygone' type='button' value='Effacer'>Effacer</button></p>";
  //On active le mode
  polygoneButton.classList.add('active');
  epaisseurDeNeigeButton.classList.remove('active');
  //On désactive les autres modes
  epaisseurDeNeigeButton.checked = false;
  selectionnerEntiteButton.classList.remove('active');
  selectionnerEntiteButton.checked = false;
  choisirDeuxPointsButton.classList.remove('active');
  choisirDeuxPointsButton.checked = false;

  //On récupère les boutons 'Calculer' et 'Effacer' initialement désactivés car rien est encore tracé sur le Cesium Viewer
  let BoutonCalculVolume = document.getElementById("valider_polygone");
  BoutonCalculVolume.disabled = true;
  let BoutonEffacerPolygone = document.getElementById("effacer_polygone");
  BoutonEffacerPolygone.disabled = true;
  //Si on a sélectionné ce mode, on retire du Cesium Viewer toutes les entités
  //Celles du mode 'Calcul Profil'
  if (startEntity) {
    viewer.entities.remove(startEntity);
  }
  if (endEntity) {
    viewer.entities.remove(endEntity);
  }
  if (ProfilLine){
    viewer.entities.remove(ProfilLine);
  }

  //On instancie le traceur de polygone
  thePolygonDrawing = new PolygonDrawing({
    scene : viewer.scene,
    polygonOptions : {
        color : Cesium.Color.WHITE.withAlpha(0.5),
    },
    polylineOptions : {
        color : Cesium.Color.BLUE,
    },
    pointOptions : {
        pixelSize : 10,
        color : Cesium.Color.RED,
        position : new Cesium.Cartesian3(),
        disableDepthTestDistance : Number.POSITIVE_INFINITY, // for draw-over
        show : false
    }
  });
  //On active le traceur de polygone
  thePolygonDrawing.startDrawing();
});



//-------------------------------------- SECTION GESTION DES EVENEMENTS sur le CESIUM VIEWER ----------------------------------------


// Coordonnées des points de départ et d'arrivée
let startLon, startLat, endLon, endLat;

//Ecouteur d'évènement sur chaque action éffectuée sur le Cesium Viewer
viewer.screenSpaceEventHandler.setInputAction(function(event) {

  //Mode Epaisseur de Neige : Click qui donne la hauteur de Neige
  if (mode === 'epaisseurDeNeige') {
    // Récupérer l'épaisseur de neige à l'emplacement cliqué
    const ray = viewer.camera.getPickRay(event.position);
    const position = viewer.scene.globe.pick(ray, viewer.scene);

    if (position) { //Si la position est valide
      //Conversion des coordonnées
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude);

      const coord = proj4('EPSG:4326', 'EPSG:3945', [longitude, latitude])

      let longitude_3945 = coord[0];
      let latitude_3945 = coord[1];

      var coord_clic = new Array();
      coord_clic.x = event.position.x;
      coord_clic.y = event.position.y;

      //Récupération de la hauteur de neige
      getSnowDepth(longitude_3945, latitude_3945,ModeText);
    }
  } 
  
  //Mode Sélectionner Entité : Click sur un entité qui donne ses caractériqtiques
  else if (mode === 'selectionnerEntite') {

    // Sélectionner une entité si elle est présente à l'emplacement cliqué
    var pickedObject = viewer.scene.pick(event.position);
    if (Cesium.defined(pickedObject) && pickedObject.id) {
      viewer.selectedEntity = pickedObject.id;
    } else {
      viewer.selectedEntity = undefined;
    }
  } 
  
  //Mode Choisir Deux Points : Tracé d'une ligne qui donne un profil des hauteurs de neige
  else if (mode === 'choisirDeuxPoints') {
    
    // Récupérer les coordonnées du point cliqué
    const ray = viewer.camera.getPickRay(event.position);
    const position = viewer.scene.globe.pick(ray, viewer.scene);
    if (position) {//Si la position est valide
      //Conversion des coordonnées
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude);
      
      //Récupération des boutons 'Calculer' et 'Effacer'
      let BoutonCalculProfil = document.getElementById("valider_calcul_profil");
      let BoutonEffacerProfil = document.getElementById("effacer_profil");

      // Stocker les coordonnées du point choisi
      if (numPointsChosen === 0) { //Si c'est le 1er clic de l'utilisateur sur le Cesium Viewer
        // Vider le graphique
        abscisse.length = 0;
        ordonne.length = 0;
        //Si existants, on efface toutes les autres entités précedentes de ce mode
        if (startEntity) {
          viewer.entities.remove(startEntity);
        }
        if (endEntity) {
          viewer.entities.remove(endEntity);
        }
        if (ProfilLine){
          viewer.entities.remove(ProfilLine);
        }
        startLon = longitude;
        startLat = latitude;
        //Ajout d'un point au coordonnées du clic
        startEntity = viewer.entities.add({
          position : Cesium.Cartesian3.fromDegrees(startLon, startLat),
          point : {
            pixelSize : 10,
            color : Cesium.Color.ORANGE,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        });

        BoutonEffacerProfil.disabled = false;
        //Si le bouton 'Effacer le tracé' est inactif alors que l'on a un bout de tracé sur la carte, on l'active et on lui ajoute un Event Listener
        if(was_never_active.EffacerProfil){
          was_never_active.EffacerProfil = false;
          BoutonEffacerProfil.addEventListener('click',function(e){
            //On efface les entités du mode
            if (startEntity) {
              viewer.entities.remove(startEntity);
            }
            if (endEntity) {
              viewer.entities.remove(endEntity);
            }
            if (ProfilLine){
              viewer.entities.remove(ProfilLine);
            }
            BoutonCalculProfil.disabled = true;
            BoutonEffacerProfil.disabled = true;
            numPointsChosen = 0; //Réinitialisation
          });
        }
      } 
      
      else if (numPointsChosen === 1) { //Si c'est le 2e clic de l'utilisateur sur le Cesium Viewer, la ligne est tracée
        endLon = longitude;
        endLat = latitude;
        // Ajouter les points sur la carte
        endEntity = viewer.entities.add({
          position : Cesium.Cartesian3.fromDegrees(endLon, endLat),
          point : {
            pixelSize : 10,
            color : Cesium.Color.ORANGE,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        });
        //Ajout de la ligne reliant les deux points
        ProfilLine = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray([startLon,startLat,endLon,endLat]),
            width: 2,
            material: Cesium.Color.RED,
            clampToGround : true // Activer le mode "clamp to ground"
          },
        });
      }

      // On incrémente le compteur de points choisis, car un clic supplémentaire vient d'être effectué
      numPointsChosen++;

      // Si deux points ont été choisis (que la ligne à été tracée)
      if (numPointsChosen === 2) {

        //Il faut maintenant cliquer sur le bouton Calculer
        BoutonCalculProfil.disabled = false;
        if(was_never_active.CalculProfil){
          was_never_active.CalculProfil = false;
          BoutonCalculProfil.addEventListener('click',function(e){
            BoutonEffacerProfil.disabled = true;
            // Nombre de points à parcourir
            let numPoints = 100;
  
            // Incréments de longitude et de latitude
            let lonIncrement = (endLon - startLon) / numPoints;
            let latIncrement = (endLat - startLat) / numPoints;
  
            let lst_lon = new Array();
            let lst_lat = new Array();
            // Parcourir les points entre les deux points
            for (let i = 0; i <= numPoints; i++) {
              let lon = startLon + i * lonIncrement;
              let lat = startLat + i * latIncrement;
              
              // Convertir les coordonnées en EPSG:3945
              const coord = proj4('EPSG:4326', 'EPSG:3945', [lon, lat]);
              let lon3945 = coord[0];
              let lat3945 = coord[1];
  
              lst_lon.push(lon3945);
              lst_lat.push(lat3945);

              // Ajouter les données au graphique
              abscisse.push(i);
            }
            //Récupération des hauteurs de neige sur le profil linéaire
            getSnowDepthProfile(lst_lon,lst_lat).then(r=>{
              ordonne = r;
              CreateProfileChart(canvas,abscisse,ordonne); //Construction du graphique
              // Réinitialiser le compteur de points choisis
              numPointsChosen = 0;
              BoutonCalculProfil.disabled = true;
              alert("Profil des hauteurs de neige calculé sur la ligne !");
            });
          }); 
        }
      }

      if(numPointsChosen === 3){ //Lorsque l'on a cliqué alors que ligne est déja tracée, on construit une nouvelle ligne reliant le dernier point au nouveau clic

        //Effacer le permier point ainsi que la ligne reliant les deux points
        viewer.entities.remove(startEntity);
        viewer.entities.remove(ProfilLine);

        //L'ancien point d'arrivée devient le nouveau point de départ
        startLon = endLon;
        startLat = endLat;
        startEntity = endEntity;

        //Ajout du nouveau point qui devient le point d'arrivée
        endLon = longitude;
        endLat = latitude;
        endEntity = viewer.entities.add({
          position : Cesium.Cartesian3.fromDegrees(endLon, endLat),
          point : {
            pixelSize : 10,
            color : Cesium.Color.ORANGE,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        });

        //Ajout de la nouvelle ligne reliant les deux nouveaux points
        ProfilLine = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray([startLon,startLat,endLon,endLat]),
            width: 2,
            material: Cesium.Color.RED,
            clampToGround : true // Activer le mode "clamp to ground"
          },
        });

        //On repasse à 2 points sélectionnés
        numPointsChosen -= 1; 
      }
    }
  }

  //Mode Volume de Neige : Tracé d'un polygone qui donne les volume des hauteurs de neige
  else if (mode == "volumeDeNeige"){

    //Récupération des boutons 'Calculer' et 'Effacer'
    let BoutonCalculVolume = document.getElementById("valider_polygone");
    let BoutonEffacerPolygone = document.getElementById("effacer_polygone");
    BoutonEffacerPolygone.disabled = false;

    if(numPointsChosen == 0){ //Si c'est le 1er clic de l'utilisateur sur le Cesium Viewer
      if(was_never_active.EffacerPolygone){ //Si on a jamais cliqué sur 'Effacer'
        was_never_active.EffacerPolygone = false;
        //Ajout d'un écouteur d'évènement
        BoutonEffacerPolygone.addEventListener('click',function(e){
          thePolygonDrawing.reset(); //On reset le traceur de polygone
          BoutonEffacerPolygone.disabled = true;
          BoutonCalculVolume.disabled = true;
        })
      }
    }

    // On incrémente le compteur de points choisis, car un clic supplémentaire vient d'être effectué
    numPointsChosen += 1;

    if (numPointsChosen >= 3){ //Si on a tracé au moins un triangle sur la carte
      BoutonCalculVolume.disabled = false; //Le bouton 'Calculer' devient actif
      if(was_never_active.CalculVolume){// Si on a jamais cliqué sur 'Calculer'
        was_never_active.CalculVolume = false;
        BoutonCalculVolume.addEventListener('click',function(e){
          thePolygonDrawing.stopDrawing(); //On stoppe le traceur de polygone
          BoutonEffacerPolygone.disabled = true;
          BoutonCalculVolume.disabled = true;

          //On récupère les positions du polygone tracé
          let positions = thePolygonDrawing.positions();
          let lon = [];
          let lat = [];
          //Conversion de coordonnées
          proj4.defs("EPSG:3945", "+proj=lcc +lat_0=45 +lon_0=3 +lat_1=44.25 +lat_2=45.75 +x_0=1700000 +y_0=4200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
          for (let i = 0; i < positions.length; i++) {
              let cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
              lon4326 = Cesium.Math.toDegrees(cartographic.longitude)
              lat4326 = Cesium.Math.toDegrees(cartographic.latitude)
              const coord = proj4('EPSG:4326', 'EPSG:3945', [lon4326, lat4326])
              lon.push(coord[0]);
              lat.push(coord[1]);
          }
          //Récupération du volume de neige dans le polygone
          getSnowVolume(lon,lat,ModeText);
          // Réinitialiser le compteur de points choisis
          numPointsChosen = 0;
        });
      }
    }
  }

}, Cesium.ScreenSpaceEventType.LEFT_CLICK);