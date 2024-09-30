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

    //Récupération du nombre de colonnes
    $nb_col = $_REQUEST['nb_col'];
    $data_meteo = json_decode($_REQUEST['data']);
    $table_name = $_REQUEST['filename'];

    $lst_name_col = explode(",",$data_meteo[0]);

    /*$lst_name_col = ["Datetime","Sonde_10","Sonde_11","Sonde_12","Sonde_22","Sonde_23","Sonde_37","Sonde_38","Sonde_55","Sonde_56","Sonde_93","Sonde_94","Sonde_95","Sonde_98","Sonde_103","Sonde_104","Sonde_107\r"];
    $ligne1 = "'24/04/2023 15:56',1,2,5,6,4,8,96,5,7,8,6,3,2,4,8,88";
    $ligne2 = "'22/04/2023 17:56',1,24,5,65,4,85,96,5,7,8,6,33,2,4,8,88";


    $data = [$lst_name_col,$ligne1,$ligne2];*/

    $nb_lignes = count($data_meteo);
    echo $nb_lignes;
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
    
    //CEATION DE LA TABLE : Application de la requête MySQL
    if (mysqli_query($link, $requete_drop) && mysqli_query($link, $requete_create)) {
        
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
            if (mysqli_query($link, $requete_insert)) {
                echo "ligne ok";
            } 
            else{
                echo "Erreur lors du remplissage de la table : " . mysqli_error($link);
            }   
        }
        echo $requete_insert;


        //Dernière boucle : reste de la division euclidienne
        $requete_insert = $requete_insert_init;
        foreach(range(1+$N*1000 , $nb_lignes-2) as $k){
            $ligne = $data_meteo[$k];
            $requete_insert = $requete_insert."(".$ligne.")";
            if($k != ($nb_lignes-2)){
                $requete_insert = $requete_insert.",";
            }
            
        }
        
        
        if (mysqli_query($link, $requete_insert)) {
            echo "ligne ok";
        } 
        else{
            echo "Erreur lors du remplissage de la table : " . mysqli_error($link);
        }  



        //echo "La table utilisateurs a été créée avec succès.";
    }
    else {
        echo "Erreur lors de la création de la table : " . mysqli_error($link);
    }
    
    /*
    print_r($requete_create."<br><br><br>".$requete_insert_init);

    if($i==2){

    }
    
    //CEATION DE LA TABLE : Application de la requête MySQL
    if (mysqli_query($link, $requete_drop) && mysqli_query($link, $requete_create) && mysqli_query($link, $requete_insert_init)) {
        echo "La table utilisateurs a été créée avec succès.";
    } else {
        echo "Erreur lors de la création de la table : " . mysqli_error($link);
    }*/
    
    




    //PARTIE REMPLISSAGE DE LA TABLE CREE

    
    //echo json_encode($lst_name_col,JSON_UNESCAPED_UNICODE);  
    
    /*$delimiter = "";
    $array = explode($delimiter, $string);
    print_r($array);*/
    /*
    $requete_col = "SHOW COLUMNS FROM ma_table";
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

    $requete = "SELECT ".$text_requete." FROM ma_table";

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
    }*/

?>