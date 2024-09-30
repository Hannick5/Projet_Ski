const Cartesian3 = Cesium.Cartesian3;
const Color = Cesium.Color;

let thePolygonDrawing = null;

function main() {
    // create cesium viewer.

    // store scene
    let scene = viewer.scene;

    // construct the polygon drawing tool as global
    thePolygonDrawing = new PolygonDrawing({
        scene : scene,
        polygonOptions : {
            color : Color.WHITE.withAlpha(0.5),
        },
        polylineOptions : {
            color : Color.BLUE,
        },
        pointOptions : {
            pixelSize : 10,
            color : Color.RED,
            position : new Cartesian3(),
            disableDepthTestDistance : Number.POSITIVE_INFINITY, // for draw-over
            show : false
        }
    });

    // when the user clicks the 'Start Drawing' button
    Sandcastle.addToolbarButton("Start Drawing", function () {
        if(thePolygonDrawing.started()) {
            alert('already started!');
            return;
        }

        thePolygonDrawing.startDrawing();
    });

    // when the user clicks the 'Stop Drawing' button
    Sandcastle.addToolbarButton("Stop Drawing", function () {
        if(!thePolygonDrawing.started()) {
            alert('not started!');
            return;
        }

        thePolygonDrawing.stopDrawing();
    });

   // when the user clicks the 'Clear Polygon' button
    Sandcastle.addToolbarButton("Clear Polygon", function () {

        thePolygonDrawing.reset();
    });

    // when the user clicks the 'Get Snow Volume' button
    Sandcastle.addToolbarButton("Get Snow Volume", function () {
        if (!thePolygonDrawing.started()) {
            alert('not started!');
            return;
        }

        let positions = thePolygonDrawing.positions();

        let lon = [];
        let lat = [];

        proj4.defs("EPSG:3945", "+proj=lcc +lat_0=45 +lon_0=3 +lat_1=44.25 +lat_2=45.75 +x_0=1700000 +y_0=4200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");

        for (let i = 0; i < positions.length; i++) {
            let cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
            lon4326 = Cesium.Math.toDegrees(cartographic.longitude)
            lat4326 = Cesium.Math.toDegrees(cartographic.latitude)
            const coord = proj4('EPSG:4326', 'EPSG:3945', [lon4326, lat4326])
            lon.push(coord[0]);
            lat.push(coord[1]);
        }

        // Envoyer les données à Flask
        const formData = new FormData();
        formData.append('lon', lon);
        formData.append('lat', lat);

        fetch('http://127.0.0.1:50000/getSnowVolume', {
            method: 'POST',
            body: formData
        })
            .then(response => response.text())
            .then(data => {
                if (data !== "0" && data !== "1") {
                    let snowVolumeDiv = document.getElementById("snow-volume");
                    snowVolumeDiv.innerHTML = "Snow Volume: " + data + " m³";
                }
            })
            .catch(error => {
                console.error('Erreur :', error);
            });
    });

    
}

main();
