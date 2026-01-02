require([
    "esri/Map",
    "esri/views/MapView",
    "esri/views/SceneView",
    "esri/layers/GeoJSONLayer",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/geometry/Mesh",
    "esri/geometry/Point",
], function (Map, MapView, SceneView, GeoJSONLayer, GraphicsLayer, Graphic, Mesh, Point) {

    // Tạo một GeoJSONLayer từ file hoặc URL
    // const geojsonLayer = new GeoJSONLayer({
    //     url: "./data/nhathoducba.geojson",   // đường dẫn tới file GeoJSON của bạn
    //     popupTemplate: {
    //         title: "{Name}",
    //         content: "{Description}"
    //     },
    //     renderer: {
    //         type: "simple",
    //         symbol: {
    //             type: "simple-fill",
    //             color: [0, 0, 255, 0.3],
    //             outline: { color: "white", width: 1 }
    //         }
    //     }
    // });
    
    const map = new Map({
        basemap: "topo-vector",
        ground: "world-elevation",
        // layers: [geojsonLayer]
    });

    const view = new SceneView({
        container: "viewDiv",
        map: map,
        camera: {
            position: [106.69900154581283, 10.775276832043538, 300],
            heading: 0,
            tilt: 60
        }
    });


    view.on("click", function (event) {
        const point = event.mapPoint;
        const lonDeg = point.longitude;
        const latDeg = point.latitude;

        // Đổi sang radian
        const lonRad = lonDeg * Math.PI / 180;
        const latRad = latDeg * Math.PI / 180;

        console.log("Longitude (deg):", lonDeg, "→ rad:", lonRad);
        console.log("Latitude (deg):", latDeg, "→ rad:", latRad);

        view.popup.open({
            title: "Tọa độ (radian)",
            content: `Longitude: ${lonDeg} rad<br>
                Latitude: ${latDeg} rad`,
            location: point
        });
    });

    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    // Polygon 3D: bức tường
    const wallPolygon = {
        type: "polygon",
        rings: [
            [106.69886007437611, 10.77964233843145, 0],    // góc dưới trái
            [106.69909093191316, 10.779427922622276, 0],    // góc dưới phải
            [106.69909093191316, 10.779427922622276, 30],   // góc trên phải (cao 30m)
            [106.69886007437611, 10.77964233843145, 30],   // góc trên trái (cao 30m)
            [106.69886007437611, 10.77964233843145, 0]     // đóng polygon
        ]
    };

    const wallGraphic = new Graphic({
        geometry: wallPolygon,
        symbol: {
            type: "simple-fill",
            color: [200, 100, 50, 0.7],
            outline: { color: [255, 255, 255], width: 1 }
        },
        attributes: {
            id: "wall-001",  
            Name: "Bức tường 001"
        },
        popupTemplate: { title: "{Name}" }
    });

    graphicsLayer.add(wallGraphic);
    const wall1 = getGraphicById(graphicsLayer, 'wall-001');
    console.log(wall1.geometry);
    const wall1_polygon = wall1.geometry;
    
    showUpWindow(graphicsLayer, wall1_polygon, 2, 2, 5, 20);
    
    // Đặt tượng Đức mẹ bằng Mesh
    const mariaStatue = new Point({
        x: 106.69933635984347,
        y: 10.779468952965884,
        z: 10.2,
    })

    const mariaStatue_orientation = getPolygonOrientation(wall1_polygon)

    Mesh.createFromGLTF(mariaStatue, "./3D_Models/maria_immaculata.glb")
        .then(function (geometry) {
            geometry.scale(1, { origin: mariaStatue })
            geometry.rotate(0, 0, mariaStatue_orientation+270);
            const graphic = new Graphic({
                geometry,
                symbol: {
                    type: "mesh-3d",
                    symbolLayers: [{
                        type: "fill",
                        size: 10000
                    }]
                }
            });
            graphicsLayer.add(graphic)
        })
        .catch(console.error);
});