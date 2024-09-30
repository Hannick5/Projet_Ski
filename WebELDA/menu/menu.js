AffichageMenu();

function AffichageMenu () {

    enTete(localStorage.getItem("username"), 'profil');
    menuPage();
    addBtnEvent();
}

/**
 * Recuperation de l'heure et la date
 * 
 * @returns {Array} jour heure minute
 */
function userTime () {

    let date = new Date();

    let jourlocale = date.toLocaleDateString('fr-FR',{
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'});

    //Mise en majuscule du premier caractère du jour
    jourlocale = jourlocale.substring(0,1).toUpperCase() + jourlocale.substring(1,jourlocale.length);

    let heurelocale = date.getHours();
    let minutelocale = date.getMinutes();

    return [jourlocale, heurelocale, minutelocale];
}

/**
 * Creation de l'en tete de la page avec les informations utilisateurs
 * 
 * @param {string} userName 
 * @param {string} userImg nom du fichier png sans l'extention
 */
function enTete (userName, userImg){
    let page = document.getElementById('body');
    let head = document.createElement('header');
    let flecheG = document.createElement('div');
    let flecheD = document.createElement('div');
    let jour = document.createElement('p');
    jour.id = 'jour_entete';
    let heure = document.createElement('p');
    heure.id = 'heure_entete';
    let utilisateur = document.createElement('p');
    utilisateur.id = 'user_entete';
    let profil = document.createElement('div');
    profil.id = 'espace_profil_entete';

    flecheG.id = "flecheG";
    flecheG.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-arrow-left arrow" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
    </svg>`;
    flecheD.id = "flecheD";
    flecheD.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-arrow-right arrow" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
    </svg>`;
    

    let [jourlocale, heurelocale, minutelocale] = userTime();

    
    jour.innerText = jourlocale;
    if(parseInt(heurelocale) < 10){
        heurelocale = '0'+heurelocale;
    }
    if(parseInt(minutelocale) < 10){
        minutelocale = '0'+minutelocale;
    }
    heure.innerText = heurelocale + ":" + minutelocale;
    utilisateur.innerText = userName;
    profil.innerHTML = `<img id='profil_entete' src="../img/`+ userImg+ `.png" alt="Image Profil">`;

    head.appendChild(flecheG);
    head.appendChild(flecheD);
    head.appendChild(jour);
    head.appendChild(heure);
    head.appendChild(utilisateur);
    head.appendChild(profil);
    page.appendChild(head);

    flecheG.addEventListener('click', function(){SwitchLeftArrow()});
    flecheD.addEventListener('click', function(){SwitchRightArrow()});
}

/**
 * Creation du menu de navigation
 */
function menuPage () {
    let page = document.getElementById('body');

    //Création des éléments du menu
    let menu = document.createElement('div');
    let slideMenu = document.createElement('div');
    let menuDisplay = document.createElement('ul');
    let options = document.createElement('div');
    let slideBtn = document.createElement('div');
    let optionBtn = document.createElement('div');
    let optionLogo = document.createElement('div');

    //Edition des élémenets du menu
    menuDisplay.innerHTML = `<li class="off" id="TdB">Tableau de bord</li>
    <li class="off" id="imData">Importation des données</li>
    <li class="off" id="domaine">Suivi du domaine</li>
    <li class="off" id="production">Production</li>`;
    menuDisplay.id = 'menuDisplay';

    /*<li class="off" id="dameuse">Dameuses</li>
    <li class="off" id="MNP">MNP</li>*/

    optionLogo.innerHTML = `<img id="optionLogo" src="../img/logo.png" alt="Logo ELDA">`;

    optionBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" class="bi bi-gear-fill gear" viewBox="0 0 16 16">
    <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
    </svg>`;


    slideBtn.innerHTML = '<p>></p>';
    slideBtn.id = 'slideBtn';

    menu.id = 'menu';
    slideMenu.id = 'slideMenu';
    options.id = 'options';

    //Ajout des nouveaux éléments et évenement 
    optionBtn.addEventListener('click', function(){addBtnOption()});

    slideBtn.addEventListener("click", function() {
        menu.classList.toggle("show");});

    options.appendChild(optionBtn);
    optionBtn.id = 'optionBtnMenu';
    options.appendChild(optionLogo);
    optionLogo.id = 'optionLogoMenu';

    slideMenu.appendChild(menuDisplay);
    slideMenu.append(options);

    menu.appendChild(slideMenu);
    menu.appendChild(slideBtn);
    
    page.appendChild(menu);

    //Modification de la classe du bouton correspondant à la page actuelle
    let myPage = document.getElementById(page.className);
    myPage.className = 'on';

}

/**
 * Ajoute à chaque bouton du menu l'evenement de redirection
 */
function addBtnEvent () {
    let nbDisplay = document.getElementsByTagName("li").length;
    //console.log(nbDisplay);

    for ( let i = 0; i < nbDisplay; i++) { 
        let elem = document.getElementsByTagName("li")[i];
        let id = elem.id;
        let repertoire,nomFichier;
        //console.log(id);
        switch(elem.id){
            case 'TdB':  repertoire = 'tableau_de_bord'; nomFichier = 'tableau_de_bord';break;
            case 'imData':  repertoire = 'importation_donnees'; nomFichier = 'importation_donnees';break;
            case 'domaine':  repertoire = 'suivi_domaine'; nomFichier = 'domaine';break;
            case 'production':  repertoire = 'production'; nomFichier = 'production';break;
            default: break;
        }

        elem.addEventListener('click', function(){SwitchDisplay(repertoire,nomFichier)});
    }
}

/**
 * Permet dechanger de page dans le menu
 * 
 * @param {string} repertoire 
 * @param {string} nomFichier 
 */
function SwitchDisplay (repertoire,nomFichier) {
    //Recupération de l'historique
    let lst_pages = JSON.parse(localStorage.getItem("historique"));
    let index = parseInt(localStorage.getItem("index"));
    //Modification de l'historique
    index += 1;
    lst_pages.push(window.location.href);
    //Enregistrement du nouvel historique
    localStorage.setItem("historique",JSON.stringify(lst_pages));
    localStorage.setItem("index",JSON.stringify(index));
    //Redirection vers la nouvelle page
    window.location.assign("../" + repertoire + "/" + nomFichier + ".html");
}

/**
 * Redirection vers la page de parametre utilisateur
 */
function addBtnOption () {
    let lst_pages = localStorage.getItem("historique");
    lst_pages.push(window.location.href);
    localStorage.setItem("historique",JSON.stringify(lst_pages));
    localStorage.setItem("index",index);
    window.location.assign("../_options/options.html");
}


/**
 * Permet de revenir a la page suivante dans l'historique
 */
function SwitchRightArrow() {

    let lst_pages = JSON.parse(localStorage.getItem("historique"));
    let index = parseInt(localStorage.getItem("index"));
    if(index < lst_pages.length-1){
        //Ajout de la page actuelle dans l'historique
        lst_pages.push(window.location.href);
        localStorage.setItem("historique",JSON.stringify(lst_pages));
        index += 1;
        localStorage.setItem("index",JSON.stringify(index));
        window.location.assign(lst_pages[index]);
        

        console.log('clique fleche droite');
    }
    else{
        alert("Il n'existe pas de page suivante !");
    }
}

/**
 * Permet de revenir a la page précédente dans l'historique
 */
function SwitchLeftArrow() { //Lorsque l'on clique sur la flèche de gauche => Page précédente

    let lst_pages = JSON.parse(localStorage.getItem("historique"));
    let index = parseInt(localStorage.getItem("index"));
    if(index >= 0){
        //Ajout de la page actuelle dans l'historique
        lst_pages.push(window.location.href);
        localStorage.setItem("historique",JSON.stringify(lst_pages));
        index -= 1;
        localStorage.setItem("index",JSON.stringify(index));
        window.location.assign(lst_pages[index+1]);
        
        console.log('clique fleche gauche');
        
    }
    else{
        alert("Il n'existe pas de page précédente !");
    }
    
}


function piedPage () {
    let page = document.getElementById('body');
        
}