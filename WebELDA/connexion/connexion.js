var form_connexion = document.getElementById("form_connexion");
var comptes_existants; //Liste des comptes [usersame,password] déjà existants


getAllAccounts().then(r => { //Une fois que l'on récupéré l'ensemble des comptes existants
    comptes_existants = r;
    console.log(comptes_existants);
    
    //Cas du formulaire CONNEXION
    form_connexion.addEventListener('submit',function(e){
        e.preventDefault();//Evite de recharger la page
        let login = getFormElements(e,form_connexion,comptes_existants);
        login = 1;
        if(login!=null){//Si le formulaire à été validé
            alert("Connexion réussie !");
            //On déclare dans le stockage local l'historique des pages
            localStorage.setItem("historique",JSON.stringify(new Array()));
            localStorage.setItem("index",-1);
            localStorage.setItem("username",form_connexion.elements["username"].value);
            //Redirection vers le tableau de bord
            window.location.assign("../tableau_de_bord/tableau_de_bord.html");
        }
    });

});


/**
 * Fonction effectuant un fetch pour récupérér la table des comptes depuis la BDD 
 * @returns {Promise} Retourne le fetch.
 */
function getAllAccounts(){
    // Requête AJAX pour récupérer les objets
    return fetch('../BDD/gestion_comptes.php',{
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(result => {
        return result.json();
    })
    .then(r => {
        comptes = r;
        return r;
    });
}



/**
 * Fonction récupérant les éléments du formulaire si ils étaient aussi présents dans la BDD
 * @param {event} e Evenement
 * @param {HTMLCollection} form Formulaire de connexion.
 * @returns {array} Null si c'est pas le cas , [username,password] si c'est le cas.
 */
function getFormElements(e,form,comptes_existants){
    //Fonction qui récupère les élements du formulaire
    if(formOK(form,comptes_existants)){ //Si le formulaire à été validé
        let login=[];
        login.identifiant = form.elements["username"].value;//username
        login.mdp = form.elements["password"].value;//password
        
        return login;
    }
    e.preventDefault();
    return null;

}




/**
 * Fonction vérifiant si les éléments du formulaire sont dans la BDD
 * @param {event} event Evenement
 * @param {HTMLCollection} form Formulaire de connexion.
 * @returns {boolean} false si c'est pas le cas , true si c'est le cas.
 */

function ValidForm(event,form) {
    // code a exécuter lorsque le formulaire sera validé
    // Au final, on empeche l'envoi du formulaire si form_OK est faux
    if(!formOK(form)){
        event.preventDefault();
        return false;
    }
    else{
        return true;
    }   
}



/**
 * Fonction vérifiant si les éléments du formulaire existe dans un liste
 * @param {HTMLCollection} form Formulaire de connexion.
 * @param {array} comptes_existants Evenement
 * @returns {boolean} false si c'est pas le cas , true si c'est le cas.
 */
function formOK(form,comptes_existants){// le formulaire est-il OK?
    let form_OK = true;
    let identifiant = form.elements["username"].value;
    for(i=0;i<comptes_existants.length;i++){ //On parcourt la liste des comptes existants (récupéré via test unitaire)
        if(comptes_existants[i].username == identifiant){ //Si le user est bien présent, on vérifie le mot de passe
            if(comptes_existants[i].password == form.elements["password"].value){//Si le mot de passe est correct, formulaire validé !
                return true;
            }
            else{
                alert("Le compte au nom de '"+identifiant+"' ne possède pas ce mot de passe.");
                return false;
            }
        }
    }
    //A ce niveau, on a pas trouvé le user dans la liste des comptes enregistrés
    alert("Le compte au nom de '"+identifiant+"' n'existe pas.");
    return false;
    
    return form_OK;
}