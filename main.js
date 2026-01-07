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
                        color: "#feb328ff"
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

            // Đặt ngói cho tầng trệt trái
            const datNgoiTretTrai = (wall_id) => {
                const wall = getGraphicById(graphicsLayer, wall_id);
                const tretTrai_orientation = getLineBearing(wall.attributes.line[0], wall.attributes.line[1]);
                const tretTrai_coords = findNewPoint(wall.attributes.line[0], tretTrai_orientation - 90, 0.5)
                const tretTrai_point = new Point({
                    x: tretTrai_coords[0],
                    y: tretTrai_coords[1],
                    z: wall.attributes.baseZ + wall.attributes.height + 0.28
                })
                Mesh.createFromGLTF(tretTrai_point, "./3D_Models/maiNha/TangTretTrai.glb")
                    .then(function (geometry) {
                        geometry.scale(1, { origin: geometry.extent.center });
                        geometry.rotate(20, 0, tretTrai_orientation + 3.5);
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
            }

            // Đặt ngói cho tầng trệt phải
            const datNgoiTretPhai = (wall_id) => {
                const wall = getGraphicById(graphicsLayer, wall_id);
                const tretPhai_orientation = getLineBearing(wall.attributes.line[0], wall.attributes.line[1]);
                const tretPhai_coords = findNewPoint(wall.attributes.line[0], tretPhai_orientation + 90, 0.5)
                const tretPhai_point = new Point({
                    x: tretPhai_coords[0],
                    y: tretPhai_coords[1],
                    z: wall.attributes.baseZ + wall.attributes.height + 0.75
                })
                Mesh.createFromGLTF(tretPhai_point, "./3D_Models/maiNha/TangTretPhai.glb")
                    .then(function (geometry) {
                        geometry.scale(1, { origin: geometry.extent.center });
                        geometry.rotate(-30, 0, tretPhai_orientation + 3.5);
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
            }

            // Đặt ngói cho tầng trệt trái
            datNgoiTretTrai("wall-014")
            // Đặt ngói cho tầng một trái
            datNgoiTretTrai("wall-015")
            
            // Đặt ngói cho tầng trệt phải
            datNgoiTretPhai("wall-011")
            // Đặt ngói cho tầng một phải
            datNgoiTretPhai("wall-012")
            

            // Đặt tượng Đức mẹ bằng Mesh
            const mariaStatue = new Point({
                x: 106.69933635984347,
                y: 10.779468952965884,
                z: 10.2,
            })

            const mariaStatue_orientation = getPolygonOrientation(getGraphicById(graphicsLayer, "wall-005").attributes.polygon);

            Mesh.createFromGLTF(mariaStatue, "./3D_Models/maria_immaculata.glb")
                .then(function (geometry) {
                    geometry.scale(2, { origin: mariaStatue })
                    geometry.rotate(0, 0, mariaStatue_orientation);
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
            
            // Tìm kiếm các điểm 
            const wall = getGraphicById(graphicsLayer, "wall-050");
            const wall_line = wall.attributes.line
            const o = getPolygonOrientation(wall.attributes.polygon) + 45;
            console.log(findNewPoint(
                wall.attributes.line[1]
                , o, 4));
            
            // const w30 = getGraphicById(graphicsLayer, 'wall-028');
            // const w31 = getGraphicById(graphicsLayer, 'wall-029');
            // const d = distanceBetweenCoords(w30.attributes.line[1], w31.attributes.line[1]);
            // const center = findNewPoint(
            //     w30.attributes.line[1],
            //     getLineBearing(w30.attributes.line[1], w31.attributes.line[1]),
            //     d/2
            // )
            // var tmp = w30.attributes.line[1]
            // for (i = 0; i < 5; i++) {
            //     var point = findNewPoint(center, getLineBearing(center, tmp) - 36, d / 2)
            //     console.log(point);
            //     tmp = point;
            // }
        });
});