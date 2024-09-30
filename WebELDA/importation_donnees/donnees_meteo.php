<?php

    $user = 'root';
    $password = '';
    $db = 'meteo';
    $host = 'localhost';
    $port = 3306;

    $link = mysqli_init();
    if (!$link) {
        die('Erreur connexion');
    }

    $success = mysqli_real_connect($link, $host, $user, $password, $db,$port);

    $requete_col = "SHOW COLUMNS FROM test_table_true";
    if($results_col = mysqli_query($link,$requete_col)){
        
        while ($ligne = mysqli_fetch_assoc($results_col)){
            // On transforme le résultat en tableau assocciatif
            $lst_col[] = $ligne["Field"];
        }
    }

    $tab = array();
    $text_requete = "";
    foreach($lst_col as $nom_col){
        $tab[$nom_col] = [];
        $text_requete = $text_requete.$nom_col.",";
    }
    $text_requete = substr($text_requete, 0, -1);

    $requete = "SELECT ".$text_requete." FROM test_table_true";

    if($results = mysqli_query($link,$requete)){
        while ($ligne = mysqli_fetch_assoc($results)){
            // On transforme le résultat en tableau assocciatif
            $i = 0;
            foreach($lst_col as $nom_col){
                if($nom_col !== 'id'){
                    $tab[$nom_col][] = $ligne[$nom_col];
                    
                }
                $i+=1; 
            }
        }
        echo json_encode($tab,JSON_UNESCAPED_UNICODE);  
    }
    else {
        echo "Erreur de requête de base de données.";
    }

?>