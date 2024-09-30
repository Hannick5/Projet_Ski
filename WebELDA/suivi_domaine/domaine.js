

DisplayDomaine();


/**
 * Affiche la page de suivi du domaine
 * @returns {void}
 */
function DisplayDomaine() {
  
    //Creation des variables
    let snowfall = '';
    let minTemp = '';
    let maxTemp = '';
    let wind = '';
  
    //Appel de l'API https://api.open-meteo.com
    let url = 'https://api.open-meteo.com/v1/forecast?latitude=44.94&longitude=6.56&daily=temperature_2m_max,temperature_2m_min,snowfall_sum,windspeed_10m_max&forecast_days=1&timezone=Europe%2FBerlin';
    fetch(url)    
    .then(r=>r.json())
    .then(r=>{
      //console.log(r);
      
      //recuperation des donnees
      snowfall = r['daily']['snowfall_sum'][0];
      minTemp = r['daily']['temperature_2m_min'][0];
      maxTemp = r['daily']['temperature_2m_max'][0];
      wind = r['daily']['windspeed_10m_max'][0];
  
      //Affichage meteo
      meteoDisplay(snowfall, minTemp, maxTemp, wind);
      //Ajout d'un evenement pour la meteo détaillé
      let maMeteo = document.getElementById('meteo');
      maMeteo.addEventListener('click', function(){meteoDetails()});


      /*
        FETCH DONNEES NEIGE
        Les données de haiteurs de neiges n'existent pas encore
        La variable snowData donne des valeurs fictives pour le graphique ChartJS
      */
        let snowData = [0, 20, 20, 60, 60, 120, NaN, 180, 120, 125, 105, 110, 170];
  
      //Affichage hauteur de neige
      snowDisplay(snowData);
      //Ajout d'un evenement pour le graphe des neiges
      let maNeige = document.getElementById('snowDet');
      maNeige.addEventListener('click', function(){snowDetails()});


      /*
        FETCH CARTE CESIUM
      */
     mapDisplay();

    });
}

/**
 * Création d'une div pour afficher des informations météo
 * 
 * @param {number} snowfall en cm
 * @param {number} minTemp en °C
 * @param {number} maxTemp en °C
 * @param {number} wind en km/h
 * @returns {void}
 */
function meteoDisplay (snowfall, minTemp, maxTemp, wind) {
    let maMeteo = document.getElementById('meteo');
    let meteoDuJour = document.createElement('div');
    meteoDuJour.id = 'meteoDuJour';
  
    //Edition de la nouvelle div meteoDuJour
    meteoDuJour.innerHTML = `<div id='info_chutes_neige'>Chutes de neiges récentes : `+ snowfall +` cm</div> 
        <div id='info_temp'>Températures : `+ maxTemp + `/` + minTemp +` °C</div> 
        <div id='info_vitesse_vent'>Vitesse du vent : `+ wind +` km/h</div>`; 
  
    maMeteo.appendChild(meteoDuJour);
}

/**
 * Evenement pour accèder à la page météo détaillée
 * @returns {void}
 */
function meteoDetails (){
    console.log('chgt page meteo detailé');
    window.location.assign("domaineMeteo.html");
    //document.location.href="../domaineMeteo/domaineMeteo.html";
}


/**
 * Permet l'affichage des hauteurs de neige
 * 
 * @param {Array<number>} snowData 
 */
function snowDisplay (snowData) {
  
    const DATA_COUNT = 10;
    const labels = [];
  
    for (let i = 0; i < DATA_COUNT; ++i) {
      labels.push(i.toString());
    }
  
    const datapoints = snowData;
    
    const ctx = document.getElementById('snowChart');
  
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: snowData,
        datasets: [{
          label: 'Epaisseur de neige',
          data: datapoints
        }]
      },
      options: {
        responsive : true,
        scales: {

          x: {
            beginAtZero: true,
            display: true ,
            title: {
              display: true,
              text: 'Date'
            }
          },

          y: {
            beginAtZero: true,
            display: true ,
            title: {
              display: true,
              text: 'Epaisseur (cm)'
            }
          }
        }
      }
    });
  };

/**
 * Evenement pour accèder à la page hauteurs de neige détaillée
 * @returns {void}
 */
  function snowDetails () {
    console.log('chgt page hauteur de neige detailé')
    window.location.assign("domaineNeige.html");
    //document.location.href="../domaineNeige/domaineNeige.html";
  }


function mapDisplay() {
  
  var extent = Cesium.Rectangle.fromDegrees(6.48,44.89,6.64,44.97);
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = extent;
  Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZDZlNjVmNy05NDljLTQ0N2QtOTUxOC0zZDI2OGRlN2M0ZTEiLCJpZCI6MTI5MjQ3LCJpYXQiOjE2NzkxMDM5MzB9.Tg7aSLwwJsDszMtkyNF5IxJWDaxb81_W8hfx2r78vAY';

  var viewer = new Cesium.Viewer("cesiumContainer",{
      orderIndependentTranslucency: false,
      Geocoder : false,
      Animation: true,
      CredistDisplay : false,
      Timeline : false,
      FullscreenButton : false,
      terrainProvider: Cesium.createWorldTerrain()
  });


  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

  // Ajout des geojson

  Cesium.GeoJsonDataSource.clampToGround = true;

  fetch("../BDD/pistes.php")
      .then(response => response.json())
      .then(data => {
        console.log(data);
        var pistesPromise = Cesium.GeoJsonDataSource.load(data);
        // Attente de la résolution des promesses
        Promise.all([pistesPromise]).then(function(dataSources) {
          var pistes = dataSources[0].entities;

          // Ajout des entités à la scène Cesium
          viewer.dataSources.add(dataSources[0]);

          // Ajout des gestionnaires d'événements pour les boutons
          pistes.show = true;
          viewer.zoomTo(pistes);
        }).catch(function(error) {
          console.log(error);
        });
      })
      .catch(error => console.log("Erreur lors de la récupération du GeoJSON : " + error));

  fetch("../BDD/anemos.php")
    .then(response => response.json())
    .then(data => {
      console.log("data anemo post php : ",data);
      var anemosPromise = Cesium.GeoJsonDataSource.load(data);
      // Attente de la résolution des promesses
      Promise.all([anemosPromise]).then(function(dataSources) {
        var anemos = dataSources[0].entities;

        // Ajout des entités à la scène Cesium
        viewer.dataSources.add(dataSources[0]);

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

        anemos.show = true;
    });
  })
  .catch(error => console.log("Erreur lors de la récupération du GeoJSON : " + error));

  fetch("../BDD/sondes.php")
    .then(response => response.json())
    .then(data => {
      var sondesPromise = Cesium.GeoJsonDataSource.load(data);
      // Attente de la résolution des promesses
      Promise.all([sondesPromise]).then(function(dataSources) {
        var sondes = dataSources[0].entities;

        // Ajout des entités à la scène Cesium
        viewer.dataSources.add(dataSources[0]);

        sondes.values.forEach(function(entity) {
          entity.point = new Cesium.PointGraphics({
            color: Cesium.Color.BLUE,
            pixelSize: 10,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          });
        });

        sondes.show = true;
    });
  })
  .catch(error => console.log("Erreur lors de la récupération du GeoJSON : " + error));

}