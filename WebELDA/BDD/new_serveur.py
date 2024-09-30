from flask import Flask, request, make_response, jsonify, render_template
from flask_cors import CORS
from shapely.geometry import Polygon, mapping
import rasterio
import io
import psycopg2
from rasterio import features
from rasterio.mask import mask
import math
from rasterio.transform import from_bounds
import sys
import numpy as np
from PIL import Image
import base64
import pyproj

app = Flask(__name__)
CORS(app)

def getCoordinatePixel(src, lon, lat):
    # Établir une connexion à la base de données
    
    # Obtenir les coordonnées de la bounding box
    bounds = src.bounds
    # Vérifier si les coordonnées sont à l'intérieur de la bounding box
    if lon >= bounds.left and lon <= bounds.right and lat >= bounds.bottom and lat <= bounds.top:
        # Obtenir les coordonnées du pixel correspondant
        py, px = src.index(lon, lat)

        # Créer une fenêtre de 1x1 pixel autour du pixel correspondant
        window = rasterio.windows.Window(px - 1//2, py - 1//2, 1, 1)

        # Lire les valeurs RGB de la fenêtre
        clip = src.read(window=window)

        # Vérifier si la valeur est de -32768.0
        if clip[0][0][0] == -32768.0:
            return 1
        
        # Retourner la valeur du premier canal (R) du premier pixel de la fenêtre
        return clip[0][0][0]
    else:
        # Les coordonnées ne sont pas à l'intérieur de la bounding box, retourner 0
        return 0


@app.route('/getSnowDepth', methods=['POST'])
def handle_post_request():
    lon = float(request.form['lon'])
    lat = float(request.form['lat'])
    
    conn = psycopg2.connect(host="localhost", dbname="PDI_ELDA_new", user="postgres", password="postgres")

    # Exécuter une requête SQL pour récupérer les données binaires du fichier GeoTIFF
    cur = conn.cursor()
    cur.execute("SELECT fichier FROM table_geotiff WHERE id = (SELECT MAX(id) FROM table_geotiff)")
    data = cur.fetchone()[0]

    # Créer un objet de flux de mémoire à partir des données binaires
    stream = io.BytesIO(data)

    # Ouvrir le fichier GeoTIFF en lecture
    with rasterio.open(stream) as src:
        value = getCoordinatePixel(src, lon, lat)
        cur.close()
        conn.close()
        response = make_response(str(value))
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

@app.route('/getSnowDepthProfile', methods=['POST'])
def get_snow_profile():
    lon = request.form['lon'].split(",")
    lat = request.form['lat'].split(",")

    # Établir une connexion à la base de données
    conn = psycopg2.connect(host="localhost", dbname="PDI_ELDA_new", user="postgres", password="postgres")

    # Exécuter une requête SQL pour récupérer les données binaires du fichier GeoTIFF
    cur = conn.cursor()
    cur.execute("SELECT fichier FROM table_geotiff WHERE id = (SELECT MAX(id) FROM table_geotiff)")
    data = cur.fetchone()[0]

    # Créer un objet de flux de mémoire à partir des données binaires
    stream = io.BytesIO(data)

    # Ouvrir le fichier GeoTIFF
    with rasterio.open(stream) as src:

        profile_values = []

        for i in range(len(lon)):
            hauteur = getCoordinatePixel(src,float(lon[i]), float(lat[i]))
            if(hauteur < 0):
                hauteur = 0
            profile_values.append(hauteur)
        
        cur.close()
        conn.close()
        response = make_response(str(profile_values))
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

@app.route('/getSnowVolume', methods=['POST'])
def get_snow_volume():
    lon = request.form.getlist('lon')
    lat = request.form.getlist('lat')

    # Split the comma-separated strings into individual values
    lon = [float(x) for x in ','.join(lon).split(',')]
    lat = [float(x) for x in ','.join(lat).split(',')]

    # Créer un objet Polygon à partir des coordonnées
    polygon = Polygon(zip(lon, lat))

    # Établir une connexion à la base de données
    conn = psycopg2.connect(host="localhost", dbname="PDI_ELDA_new", user="postgres", password="postgres")

    # Exécuter une requête SQL pour récupérer les données binaires du fichier GeoTIFF
    cur = conn.cursor()
    cur.execute("SELECT fichier FROM table_geotiff WHERE id = (SELECT MAX(id) FROM table_geotiff)")
    data = cur.fetchone()[0]

    # Créer un objet de flux de mémoire à partir des données binaires
    stream = io.BytesIO(data)

    # Ouvrir le fichier GeoTIFF
    with rasterio.open(stream) as src:
        # Obtenir la transformation de coordonnées du fichier GeoTIFF
        transform = src.transform

        # Convertir le polygone en une géométrie GeoJSON
        geojson = mapping(polygon)

        # Masquer les données du fichier GeoTIFF avec le polygone
        masked_data, masked_transform = mask(src, [geojson], crop=True)

        valid_mask = masked_data != -3.2768000e+04

        valid_data = np.ma.masked_array(masked_data, mask=~valid_mask)

        # Calculer la moyenne de l'épaisseur de neige dans le polygone
        snow_depth = np.mean(valid_data)

        # Calculer le volume de neige dans le polygone en mètres cubes
        area = polygon.area
        snow_volume = area * snow_depth

        cur.close()
        conn.close()
    
        # Créer une réponse avec le volume de neige compactée
        response = make_response(str(snow_volume))
    
        # Ajouter l'en-tête Access-Control-Allow-Origin pour résoudre le problème de CORS
        response.headers['Access-Control-Allow-Origin'] = '*'
    
        return response

@app.route('/image')
def get_image():
    conn = psycopg2.connect(host="localhost", dbname="PDI_ELDA_new", user="postgres", password="postgres")

    # Exécuter une requête SQL pour récupérer les données binaires du fichier GeoTIFF
    cur = conn.cursor()
    cur.execute("SELECT fichier FROM table_geotiff WHERE id = (SELECT MAX(id) FROM table_geotiff)")
    data = cur.fetchone()[0]

    # Créer un objet de flux de mémoire à partir des données binaires
    stream = io.BytesIO(data)
    # Ouvrir le fichier GeoTIFF en lecture
    with rasterio.open(stream) as src:
        data = src.read(1)
        profile = src.profile

    # Remplacer les valeurs de nodata par une valeur valide
    nodata = profile['nodata']
    if nodata is not None:
        data[data == nodata] = 0

    # Créer une nouvelle bande avec la palette de couleurs personnalisée
    color_map = [(0, 0, 0)] # Ajouter la couleur pour la valeur minimale
    color_map.append((255, 8, 33)) # Plage de couleurs 0 à 0.2
    color_map.append((255, 119, 0)) # Plage de couleurs 0.2 à 0.4
    color_map.append((28, 209, 0)) # Plage de couleurs 0.4 à 0.8
    color_map.append((0, 23, 176)) # Plage de couleurs 0.8 à 2
    color_map.append((153, 0, 255)) # Plage de couleurs 2 à 3
    color_map.append((153, 0, 255)) # Plage de couleurs 3 à 4
    color_map.append((255, 255, 255)) # Ajouter la couleur pour la valeur maximale
    new_data = np.zeros((data.shape[0], data.shape[1], 3), dtype=np.uint8)
    for i, color in enumerate(color_map):
        if i != profile['nodata']:
            if i == 0:
                new_data[data == i] = color
            else:
                if i == 1:
                    lower_bound = 0
                    upper_bound = 0.2
                elif i == 2:
                    lower_bound = 0.2
                    upper_bound = 0.4
                elif i == 3:
                    lower_bound = 0.4
                    upper_bound = 0.8
                elif i == 4:
                    lower_bound = 0.8
                    upper_bound = 2
                elif i == 5:
                    lower_bound = 2
                    upper_bound = 3
                elif i == 6:
                    lower_bound = 3
                    upper_bound = 4
                else:
                    lower_bound = 4
                    upper_bound = data.max()
                new_data[(data > lower_bound) & (data <= upper_bound)] = color

    # Convertir les données en PNG avec PIL
    img = Image.fromarray(new_data)

    # Convertir l'image en mode RGBA
    image = img.convert("RGBA")

    # Obtenir les pixels de l'image
    pixels = image.load()
    
    
    # Parcourir tous les pixels de l'image
    for i in range(image.size[0]):
        for j in range(image.size[1]):
            # Si le pixel est noir, le rendre transparent
            if pixels[i, j] == (0, 0, 0, 255):
                pixels[i, j] = (0, 0, 0, 0)
    
    # Enregistrer l'image modifiée
    image = image.resize((1920, 1080), resample=Image.LANCZOS)

    # Convertir l'image en PNG
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)

    # Encoder l'image en base64
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    # Retourner l'image encodée en base64
    return jsonify({'imgBase64': img_base64})

@app.route('/bbox')
def getBbox():
    # Établir une connexion à la base de données
    conn = psycopg2.connect(host="localhost", dbname="PDI_ELDA_new", user="postgres", password="postgres")

    # Exécuter une requête SQL pour récupérer les données binaires du fichier GeoTIFF
    cur = conn.cursor()
    cur.execute("SELECT fichier FROM table_geotiff WHERE id = (SELECT MAX(id) FROM table_geotiff)")
    data = cur.fetchone()[0]

    # Créer un objet de flux de mémoire à partir des données binaires
    stream = io.BytesIO(data)

    # Créer un objet Transformer pour convertir de la projection 3945 à WGS84
    transformer = pyproj.Transformer.from_crs('EPSG:3945', 'EPSG:4326')

    # Ouvrir le fichier GeoTIFF en lecture
    with rasterio.open(stream) as src:
        # Obtenir les coordonnées de la bounding box
        bounds = src.bounds
    left = bounds[0]
    bottom = bounds[1]
    right = bounds[2]
    top = bounds[3]

    # Convertir les coordonnées de la bounding box en WGS84
    lat_bottom,lon_left = transformer.transform(left, bottom)
    lat_top,lon_right  = transformer.transform(right, top)

    # Afficher les coordonnées en WGS84
    bound = [lon_left, lat_bottom, lon_right, lat_top]
    return jsonify(bound)


if __name__ == '__main__':
    app.run(port=50000, debug=True)