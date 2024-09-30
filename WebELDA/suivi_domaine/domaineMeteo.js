maMeteo();

/**
 * Affiche le tableau météo sur 3 jourss
 * @returns {void}
 */
function maMeteo () {

    //Creation des variables
    let snowfall = '';
    let temp = '';
    let time = '';
    let wind = '';

    // Utilisation de l'API https://api.open-meteo.com
    let url = 'https://api.open-meteo.com/v1/forecast?latitude=44.94&longitude=6.56&hourly=temperature_2m,snowfall,windspeed_10m&forecast_days=3&timezone=Europe%2FBerlin';
    fetch(url)    
    .then(r=>r.json())
    .then(r=>{
      console.log(r);
      
      //recuperation des donnees
      snowfall = r['hourly']['snowfall'];
      temp = r['hourly']['temperature_2m'];
      time = r['hourly']['time'];
      wind = r['hourly']['windspeed_10m'];

      console.log(snowfall);

      affichageMeteo(snowfall, temp, time, wind);

      let btn = document.getElementById('meteotitle');
      btn.addEventListener('click', function(){return2domaine()});
    });

}

/**
 * Permet la mise en forme et l'affichage des données météo sur 3J
 * 
 * @param {Array<number>} snow 
 * @param {Array<number>} temp 
 * @param {Array<number>} time 
 * @param {Array<number>} wind 
 */
function affichageMeteo (snow, temp, time, wind) {

    let meteoJ = document.getElementById('TableJ');
    let meteoJ1 = document.getElementById('TableJ1');
    let meteoJ2 = document.getElementById('TableJ2');

    let Jtitle = document.getElementById('J');
    let J1title = document.getElementById('J1');
    let J2title = document.getElementById('J2');

    let J = new Date();
    let JName = J.toLocaleDateString('fr-FR', { weekday: 'long' });
    let J1 = new Date(J.getTime() + (1 * 24 * 60 * 60 * 1000));
    let J1Name = J1.toLocaleDateString('fr-FR', { weekday: 'long' });
    let J2 = new Date(J.getTime() + (2 * 24 * 60 * 60 * 1000));
    let J2Name = J2.toLocaleDateString('fr-FR', { weekday: 'long' });

    Jtitle.title = JName;
    J1title.title = J1Name;
    J2title.title = J2Name;
    let nextday = document.getElementById('J2');
    nextday.innerHTML = J2Name;

    let Hour = J.getHours();

    //Météo pour la journée restante
    for ( let i = Hour; i < 24; i+=3) {
      var date = time[i].split("T");
      let meteoH = document.createElement('tr');
      meteoH.innerHTML = `<td>` + date[1] + `</td>
      <td>`+temp[i]+` °C</td>
      <td>`+snow[i]+` cm</td>
      <td>`+wind[i]+` km/h</td>`;

      meteoH.className = 'l' + i%2;

      meteoJ.appendChild(meteoH);
    }

    //Météo pour J + 1
    for ( let i = 24; i < 48; i+=3) {
      var date = time[i].split("T");               
      let meteoH = document.createElement('tr');   
      meteoH.innerHTML = `<td>` + date[1] + `</td>  
      <td>`+temp[i]+` °C</td>
      <td>`+snow[i]+` cm</td>
      <td>`+wind[i]+` km/h</td>`;                  

      meteoH.className = 'l' + i%2;

      meteoJ1.appendChild(meteoH);               
    }

    //Météo pour J + 2
    for ( let i = 48; i < 72; i+=3) {
      var date = time[i].split("T");     
      let meteoH = document.createElement('tr');  
      meteoH.innerHTML = `<td>` + date[1] + `</td>  
      <td>`+temp[i]+` °C</td>
      <td>`+snow[i]+` cm</td>
      <td>`+wind[i]+` km/h</td>`;                 

      meteoH.className = 'l' + i%2;

      meteoJ2.appendChild(meteoH);                 
    }
}

function return2domaine () {
  window.location.assign("domaine.html");
}