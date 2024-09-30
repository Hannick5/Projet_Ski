// Fichier Javascript contrôlant l'affichage des Menus Déroulants 'Sélection' et 'Outils', ainsi que la gestion du calendrier en input

const MenusDeroulants = document.getElementsByClassName("menu_deroulant");
const BoutonsMenusDeroulants = document.getElementsByClassName("bouton_menu_deroulant");

var date = "";
var zone = "ratier"

for(i=0;i<MenusDeroulants.length;i++){//Pour chaque menu déroulant

    let btnDrop = BoutonsMenusDeroulants[i];
    btnDrop.toggleIndex = 0;
    let dropdown = MenusDeroulants[i];
    console.log("nouvelle hauteur petite : ",btnDrop.scrollHeight);

    //Récupérer le bouton directement à partir du menu déroulant
    btnDrop.addEventListener('click',() => {
        if(btnDrop.toggleIndex == 0){ //Si le menu déroulant n'était PAS déroulé avant de cliquer sur le bouton (menu masqué)
            dropdown.style.height = dropdown.scrollHeight+'px'; //On augmente sa hauteur pour faire dérouler le contenu du menu
            console.log("nouvelle hauteur grande : ",dropdown.scrollHeight);
            btnDrop.children[1].src = "img/moins.png"; //L'icone de droite devient moins
            btnDrop.toggleIndex++; //On rend le menu déroulant ACTIF
        }
        else{ //Si le menu déroulant était déroulé avant de cliquer sur le bouton (menu affiché)
            dropdown.style.height = btnDrop.scrollHeight+'px'; //On diminue sa hauteur pour replier le menu
            console.log("nouvelle hauteur petite : ",btnDrop.scrollHeight);
            btnDrop.children[1].src = "img/plus.png"; //L'icone de droite devient plus
            btnDrop.toggleIndex--; //On rend le menu déroulant INACTIF
        }
    })
}

// Initialisation du calendrier flatpickr
flatpickr("#calendrier", {
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