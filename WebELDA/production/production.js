var EspCesiumContainer = document.getElementById("CesiumContainer");
var BoutonRapport = document.getElementById("bouton_rapport");
var zoomLevel; //Niveau de zoom
var bigZoom = false; //Indicateur de visibilité des étiquettes : au dela d'un certain niveau de zoom, cette valeur devient true


//---------------------------------- SECTION CLICK SUR Bouton RAPPORT DE PRODUCTION --------------------------------------------
BoutonRapport.addEventListener('click',function(e){
    updateHistorique();
    window.location.assign("rapport_production.html");
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

//---------------------------------- SECTION CESIUM affichant la POSITION DES ENNEIGEURS --------------------------------------------

var extent = Cesium.Rectangle.fromDegrees(6.48,44.89,6.64,44.97); //Rectangle de la prise de vue du domaine skiable
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = extent; //On braque la caméra sur la prise de vue
Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

//Chemin de connexion vers Cesium
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZDZlNjVmNy05NDljLTQ0N2QtOTUxOC0zZDI2OGRlN2M0ZTEiLCJpZCI6MTI5MjQ3LCJpYXQiOjE2NzkxMDM5MzB9.Tg7aSLwwJsDszMtkyNF5IxJWDaxb81_W8hfx2r78vAY';

// Chargement du Cesium Viewer
var viewer = new Cesium.Viewer("CesiumContainer",{
    Geocoder : false,
    Animation: true,
    CredistDisplay : false,
    Timeline : false,
    FullscreenButton : false,
    terrainProvider: Cesium.createWorldTerrain()
});

const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

// Ajout des geojson sur le Cesium Viewer
Cesium.GeoJsonDataSource.clampToGround = true;

fetch("../BDD/pistes.php") //FETCH vers le fichier PHP qui va charger le fichier geojson des pistes depuis la BDD
    .then(response => response.json())
    .then(data => {
      var pistesPromise = Cesium.GeoJsonDataSource.load(data);
      // Attente de la résolution des promesses
      Promise.all([pistesPromise]).then(function(dataSources) {
        var pistes = dataSources[0].entities;

        // Ajout des entités à la scène Cesium
        viewer.dataSources.add(dataSources[0]);

        //Affichage des pistes
        pistes.show = true;
        viewer.zoomTo(pistes);
      }).catch(function(error) {
        console.log(error);
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
    regard.show = true; //On affiche les enneigeurs
});
})
.catch(error => console.log("Erreur lors de la récupération du GeoJSON : " + error));
