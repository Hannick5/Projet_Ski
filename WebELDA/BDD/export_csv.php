<?php

    $conn = pg_connect("host=localhost dbname=PDI_ELDA_new user=postgres password=postgres");

    $tablename = $_REQUEST['tablename'];
    $nom_col = $_REQUEST['id_object'];

    $requete = "SELECT Datetime,".strtolower($nom_col)." FROM ".$tablename;

    $tab = array(
        "Datetime" => array(),
        $nom_col => array()
    );

    if($results = pg_query($conn, $requete)){
        while ($ligne = pg_fetch_assoc($results)){
            // On transforme le résultat en tableau assocciatif
            $tab["Datetime"][] = $ligne["datetime"];
            $tab[$nom_col][] = $ligne[strtolower($nom_col)];
        }
        echo json_encode($tab,JSON_UNESCAPED_UNICODE);  
    }
    else {
        echo "Erreur de requête de base de données.";
    }

    // Fermeture de la connexion à la base de données
    pg_close($conn);
?>