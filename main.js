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

    function createWallPolygonFromLine(feature) {
        const { id, baseZ, height, material } = feature.properties;
        const [p0, p1] = feature.geometry.coordinates;

        const bearing = getLineBearing(p0, p1);

        const p1L = offsetPoint(p0, bearing, height);
        const p1R = offsetPoint(p1, bearing, height);

        return [p0, p1, p1R, p1L, p0]; // CCW
    }

    function computeWallNormal(p0, p1) {
        const dx = p1[0] - p0[0];
        const dy = p1[1] - p0[1];

        // pháp tuyến nằm ngang
        return [-dy, dx, 0];
    }
    
    function createWallGraphic(feature) {

        const { id, baseZ, height, material } = feature.properties;
        const [[x1, y1], [x2, y2]] = feature.geometry.coordinates;

        // Vector pháp tuyến (vuông góc với tường)
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);

        // pháp tuyến nằm ngang
        const normal = computeWallNormal([x1, y1], [x2, y2]);

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: {

                // 🔥 CCW ORDER (QUAN TRỌNG)
                position: [
                    x1, y1, baseZ,
                    x1, y1, baseZ + height,
                    x2, y2, baseZ + height,
                    x2, y2, baseZ
                ],

                normal: [
                    ...normal,
                    ...normal,
                    ...normal,
                    ...normal
                ],

                uv: [
                    0, 0,
                    1, 0,
                    1, 1,
                    0, 1
                ]
            },

            components: [{
                faces: [
                    0, 1, 2,
                    0, 2, 3
                ]
            }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: {
                        color: "#fe9f33ff"
                    },
                    edges: {
                        type: "solid",
                        color: "#fafafa",
                        size: 0.2
                    }
                }]
            },
            attributes: {
                id,
                baseZ,
                height,
                material,
                line: feature.geometry.coordinates,
                polygon: createWallPolygonFromLine(feature)
            },
            popupTemplate: {
                title: "Thông tin tường",
                content: `
                <b>ID:</b> {id}<br>
                <b>Chiều cao:</b> {height} m<br>
                <b>Base Z:</b> {baseZ}<br>
                <b>Vật liệu:</b> {material}
            `
            }
        });
    }

    fetch("./tuong.geojson")
        .then(res => res.json())
        .then(data => {
            data.features.forEach(feature => {
                const wallGraphic = createWallGraphic(feature);
                graphicsLayer.add(wallGraphic);
            });


            const wall1 = getGraphicById(graphicsLayer, "wall-001");

            console.log(wall1.attributes)

            const wall1_polygon = wall1.attributes.polygon;
            const wall1_line = wall1.attributes.line;
            console.log(getPolygonOrientation(wall1_polygon));
            console.log(getLineBearing(wall1_line[0], wall1_line[1]))

            graphicsLayer.add(createWindowMesh(
                wall1_polygon,
                2,       // m
                5,         // m
                10,        // m
                6,         // m
                0,  // độ dày cửa sổ (m)
                0
                // + lồi / - lõm
            ));

            const wall = getGraphicById(graphicsLayer, "wall-013");
            const wall_line = wall.attributes.line
            const o = getPolygonOrientation(wall.attributes.polygon) + 90;
            console.log(findNewPoint(wall_line[0], o, 35))
            // showUpWindow(graphicsLayer, wall1_polygon, 2, 2, 5, 20);
        });


    // // Đặt tượng Đức mẹ bằng Mesh
    // const mariaStatue = new Point({
    //     x: 106.69933635984347,
    //     y: 10.779468952965884,
    //     z: 10.2,
    // })

    // const mariaStatue_orientation = getPolygonOrientation(wall1_polygon)

    // Mesh.createFromGLTF(mariaStatue, "./3D_Models/maria_immaculata.glb")
    //     .then(function (geometry) {
    //         geometry.scale(1, { origin: mariaStatue })
    //         geometry.rotate(0, 0, mariaStatue_orientation+270);
    //         const graphic = new Graphic({
    //             geometry,
    //             symbol: {
    //                 type: "mesh-3d",
    //                 symbolLayers: [{
    //                     type: "fill",
    //                     size: 10000
    //                 }]
    //             }
    //         });
    //         graphicsLayer.add(graphic)
    //     })
    //     .catch(console.error);
});