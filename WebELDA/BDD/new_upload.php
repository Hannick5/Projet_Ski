<?php
    echo ini_set("memory_limit","1000M");
    // Connexion à la base de données
    $dbconn = pg_connect("host=localhost dbname=PDI_ELDA_new user=postgres password=postgres"); //or die("Impossible de se connecter à la base de données");

    // Vérification que le formulaire a été soumis
            
    // Ouverture du fichier
    $file = fopen($_POST['filename'], 'rb');
    $data = fread($file, filesize($_POST['filename']));

    fclose($file);

    // Échappement des caractères spéciaux dans les données binaires
    //echo $data;
    

    if($_POST['filetype'] == 'TIF'){
        $escaped_data = pg_escape_bytea($data);
        // Insertion des données dans la base de données
        $result = pg_query_params($dbconn, 'INSERT INTO table_geotiff (nom_fichier, fichier) VALUES ($1, $2)', array(substr($_POST['filename'],14), $escaped_data));
        if(!$result) {
            die("Erreur lors de l'insertion des données dans la base de données");
        } else {
            echo "Le fichier a été enregistré dans la base de données";
        }
    }

    if($_POST['filetype'] == 'GEOJSON'){

        /*$json_data = json_encode($data);
        // Échapper les caractères de backslash dans la chaîne JSON
        $json_data = str_replace('\x', '', $json_data);*/
        $escaped_data = pg_escape_string($data);

        echo $escaped_data;
        // Insertion des données dans la base de données
        if(isset($_POST['data-type'])) {
            $result = pg_query_params($dbconn, "INSERT INTO table_".$_POST['data-type']." (fichier) VALUES ($1)", array($escaped_data));
            if(!$result) {
                die("Erreur lors de l'insertion des données dans la base de données");
            } else {
                echo "Le fichier a été enregistré dans la base de données";
            }
        }
    }
?>

<?php
    // Fermeture de la connexion à la base de données
    pg_close($dbconn);
?>