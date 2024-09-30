<?php

    $conn = pg_connect("host=localhost dbname=PDI_ELDA_new user=postgres password=postgres");


    //Récupération du nombre de colonnes
    $nb_col = $_REQUEST['nb_col'];
    $data_meteo = json_decode($_REQUEST['data']);
    $table_name = $_REQUEST['filename'];

    $lst_name_col = explode(",",$data_meteo[0]);

    $nb_lignes = count($data_meteo);
    //Construction de la nouvelle table MySQL en fonction des noms de colonnes
    //Forme de la requête : CREATE TABLE nom_table( col1 datatype, col2 datatype, ... , colN datatype)
    $requete_drop = "DROP TABLE IF EXISTS ".$table_name;
    $requete_create = "CREATE TABLE ".$table_name." (";
    $requete_insert_init = "INSERT INTO ".$table_name." (";
    $ind = 1;
    $nb_col = count($lst_name_col);
    foreach($lst_name_col as $name_col){
        $requete_create = $requete_create.$name_col;
        $requete_insert_init = $requete_insert_init.$name_col;
        if($name_col == "Datetime"){ //1ère colonne : type str
            $requete_create = $requete_create." VARCHAR(50),";
            $requete_insert_init = $requete_insert_init.",";
        }
        else{ // Autres colonnes : valeurs mesurées par les sondes (float = decimal)
            $requete_create = $requete_create." DECIMAL";
            if($ind < $nb_col){ // Si ce n'est pas la dernière colonne on ajoute un virgule
                $requete_create = $requete_create.",";
                $requete_insert_init = $requete_insert_init.",";
            }
        }
        $ind += 1;
    }
    $requete_create = $requete_create.")";
    $requete_insert_init = $requete_insert_init.") VALUES";
    
    //CREATION DE LA TABLE : Application de la requête MySQL
    if (pg_query($conn, $requete_drop) && pg_query($conn, $requete_create)) {
        
        //Remplissage de la requête INSERT INTO table VALUES
        
        $N = (int) ($nb_lignes/1000);
        foreach(range(0,$N-1) as $j){
            $requete_insert = $requete_insert_init;
            foreach(range(1+$j*1000 , ($j+1)*1000) as $i){
                $ligne = $data_meteo[$i];
                $requete_insert = $requete_insert."(".$ligne.")";
                if($i<($j+1)*1000){
                    $requete_insert = $requete_insert.",";
                }
            }
            if (!(pg_query($conn, $requete_insert))) {
                echo "Erreur lors du remplissage de la table ";
            }   
        }


        //Dernière boucle : reste de la division euclidienne
        $requete_insert = $requete_insert_init;
        foreach(range(1+$N*1000 , $nb_lignes-2) as $k){
            $ligne = $data_meteo[$k];
            $requete_insert = $requete_insert."(".$ligne.")";
            if($k != ($nb_lignes-2)){
                $requete_insert = $requete_insert.",";
            }
            
        }
        
        if (!(pg_query($conn, $requete_insert))) {
            echo "Erreur lors du remplissage de la table ";
        }  

        echo "success";
    }
    else {
        echo "Erreur lors de la création de la table ";
    }

    // Fermeture de la connexion à la base de données
    pg_close($conn);
    
?>