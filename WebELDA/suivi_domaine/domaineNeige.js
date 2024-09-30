fetchDonneeNeige();

function fetchDonneeNeige() {

    //Creation des variables
    let snow_depth = '';
    let snowfall = '';
    let time = '';

    //Recuperation des données de neige pour afficher le 1er graphique
    let url = 'https://api.open-meteo.com/v1/forecast?latitude=44.911&longitude=6.554&hourly=snowfall,snow_depth&past_days=5&forecast_days=3&timezone=Europe%2FBerlin';
    fetch(url)    
    .then(r=>r.json())
    .then(r=>{
        //console.log(r);

        //recuperation des donnees neige
        snow_depth = r['hourly']['snow_depth'];
        snowfall = r['hourly']['snowfall'];
        time = r['hourly']['time'];

        //Affichage du graphique de hauteur de neige
        affichageHauteur(snow_depth, snowfall, time);

        //Evenement sur le titre de la page pour revenir à la page précédente
        let btn = document.getElementById('meteotitle');
        btn.addEventListener('click', function(){return2domaine()});

        //recuperation donnees de gel pour afficher le 2eme graphique
        let url2 = "https://api.open-meteo.com/v1/forecast?latitude=44.911&longitude=6.554&hourly=freezinglevel_height&past_days=5&forecast_days=3&timezone=Europe%2FBerlin";
        fetch(url2)    
        .then(r=>r.json())
        .then(r=>{
            console.log(r);
    
            //recuperation des donnees
            let freezing = r['hourly']['freezinglevel_height'];
            let time = r['hourly']['time'];
    
            afficherFreezing(freezing, time);
            
        });
    });
}


/**
 * Fonction de
 * 
 * @param {*} snow_depth 
 * @param {*} snowfall 
 * @param {*} time 
 */
function affichageHauteur(snow_depth, snowfall, time){

    //Echantillonnnage des données pour lissage
    let snowdepth = [];
    for (let i = 0; i<snow_depth.length; i++) {
        
        if (i%6 ===0 ) { 
            snowdepth.push(snow_depth[i]);
        }
        else {
            snowdepth.push(NaN);
        }
    }

    

    let timechart = [];
    for (let i = 0; i<time.length; i++) {
        if (i%24 ===0 ) { 
            let date = time[i].split("T");
            let jour = date[0].split("-");
            timechart.push(jour[2] +" / "+ jour[1]);
        }
        else {
            timechart.push("");
        }
    }

    //Création du titre du graphe
    let d2 = time[time.length-1].split("T");
    let d1 = time[0].split("T");

    let titre1 = 'Epaisseur et chutes de neige entre le ' + d1[0].split("-")[2] + "/" + d1[0].split("-")[1] + " et le " + d2[0].split("-")[2] + "/" + d2[0].split("-")[1];
    console.log(titre1);







    //Construction du graphe chart JS
    const datapoints = snowdepth;
    const ctx = document.getElementById('snowChart');

    //Variables d'animation
    const totalDuration = 1000;
    const delayBetweenPoints = totalDuration / 192;
    const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
    const animation = {
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: previousY,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * delayBetweenPoints;
          },
          y1: {
            type: 'number',
            easing: 'linear',
            duration: delayBetweenPoints,
            from: previousY,
            delay(ctx) {
              if (ctx.type !== 'data' || ctx.yStarted) {
                return 0;
              }
              ctx.yStarted = true;
              return ctx.index * delayBetweenPoints;
            }
          }
        }
      };


  
    //Creation du graphe
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: timechart,
        datasets: [
            //Données chute de neige
        {
            label: 'Chute de neige',
            data: snowfall ,
            cubicInterpolationMode: 'default',
            tension: 0.9 ,
            yAxisID: 'y1'
          },
            //Données hauteurs de neige
          {
            label: 'Epaisseur de neige',
            data: datapoints ,
            cubicInterpolationMode: 'monotone',
            tension: 0.4,
            yAxisID: 'y',
            type: 'line',
            radius:0,
            spanGaps:true
          }
    ]

    //Option d'affichage Titre, Axes, animation
      },
      options: {
        animation,
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
          },
        plugins: {
          title: {
            display: true,
            text: titre1,
          },
        },
        interaction: {
          intersect: false,
        },
        scales: {
          x: {
            beginAtZero: true,
            display: true ,
            spanGaps:true,
            title: {
              display: true,
              text: 'Date'
            },
          },

          y: {
            beginAtZero: true,
            display: true ,
            title: {
              display: true,
              text: 'Epaisseur (m)'
            },
          },
          y1: {
            beginAtZero: true,
            display: true ,
            title: {
              display: true,
              text: 'Chute de neige (cm)'
            },
          }
        }
      }
    });  
}



function return2domaine () {
    window.location.assign("domaine.html");
}



function afficherFreezing(freezing, time) {


    let timechart = [];
    for (let i = 0; i<time.length; i++) {
        if (i%24 ===0 ) { 
            let date = time[i].split("T");
            let jour = date[0].split("-");
            timechart.push(jour[2] +" / "+ jour[1]);
        }
        else {
            timechart.push("");
        }
    }

    const ctx = document.getElementById('freezeChart');
  
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: timechart,
        datasets: [{
          label: 'Altitude de gel',
          radius: 0,
          data: freezing
        }]
      },
      options: {
        responsive : true,
        plugins: {
            title: {
              display: true,
              text: "Altitude de gel",
            },
          },
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
            beginAtZero: false,
            display: true ,
            title: {
              display: true,
              text: 'Altitude (m)'
            }
          }
        }
      }
    });
}