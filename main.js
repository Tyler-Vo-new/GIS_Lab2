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

    fetch("./tuong.geojson")
        .then(res => res.json())
        .then(data => {
            data.features.forEach(feature => {
                var wallGraphic = null;
                if (feature.properties.id == "wall-013" || feature.properties.id == "wall-010") {
                    wallGraphic = createWallGraphic1(feature);
                    graphicsLayer.add(wallGraphic);
                } else if (["wall-005", "wall-020", "wall-021"].includes(feature.properties.id)) {
                    wallGraphic = createWallGraphic2(feature, 3);
                    graphicsLayer.add(wallGraphic);
                } else if (["wall-026", "wall-027"].includes(feature.properties.id)) {
                    wallGraphic = createWallGraphic2(feature, 2);
                    graphicsLayer.add(wallGraphic);
                }
                else {
                    wallGraphic = createWallGraphic(feature);
                    graphicsLayer.add(wallGraphic);
                }
            });

            // Đặt ngói cho tầng trệt trái
            const datNgoiTretTrai = (wall_id) => {
                const wall = getGraphicById(graphicsLayer, wall_id);
                const tretTrai_orientation = getLineBearing(wall.attributes.line[0], wall.attributes.line[1]);
                const tretTrai_coords = findNewPoint(wall.attributes.line[0], tretTrai_orientation - 90, 0.5)
                const tretTrai_point = new Point({
                    x: tretTrai_coords[0],
                    y: tretTrai_coords[1],
                    z: wall.attributes.baseZ + wall.attributes.height + 0.2
                })
                Mesh.createFromGLTF(tretTrai_point, "./3D_Models/maiNha/TangTretTrai.glb")
                    .then(function (geometry) {
                        geometry.scale(1, { origin: geometry.extent.center });
                        geometry.rotate(18, 0, tretTrai_orientation + 3.8);
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
                    z: wall.attributes.baseZ + wall.attributes.height + 0.73
                })
                Mesh.createFromGLTF(tretPhai_point, "./3D_Models/maiNha/TangTretPhai.glb")
                    .then(function (geometry) {
                        geometry.scale(1, { origin: geometry.extent.center });
                        geometry.rotate(-28, 0, tretPhai_orientation + 3.8);
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
            

            // Vẽ trụ tròn đỡ tượng
            const pedestal = new Graphic({
                geometry: {
                    type: "point",
                    x: 106.69934135984347,
                    y: 10.779468952965884,
                    z: 9
                },
                symbol: {
                    type: "point-3d",
                    symbolLayers: [{
                        type: "object",
                        resource: { primitive: "cylinder" },
                        width: 5.5, // Đường kính trụ
                        height: 1.6, // Chiều cao từ 9m lên 10.2m
                        anchor: "bottom",
                        material: { color: "grey" }
                    }]
                }
            });
            graphicsLayer.add(pedestal);

            // Đặt tượng Đức mẹ bằng Mesh
            const mariaStatue = new Point({
                x: 106.69933635984347,
                y: 10.779468952965884,
                z: 10.2,
            })

            const mariaStatue_orientation = getPolygonOrientation(getGraphicById(graphicsLayer, "wall-005").attributes.polygon);

            Mesh.createFromGLTF(mariaStatue, "./3D_Models/maria_immaculata.glb")
                .then(function (geometry) {
                    geometry.scale(10, { origin: mariaStatue })
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
            
            // Ốp gạch vào chân tháp
            opGachChanThap(graphicsLayer, getGraphicById(graphicsLayer, "wall-001"));
            opGachChanThap1(graphicsLayer, getGraphicById(graphicsLayer, "wall-002"));
            opGachChanThap1(graphicsLayer, getGraphicById(graphicsLayer, "wall-021"));
            opGachChanThap(graphicsLayer, getGraphicById(graphicsLayer, "wall-006"));
            opGachChanThap(graphicsLayer, getGraphicById(graphicsLayer, "wall-007"));
            opGachChanThap(graphicsLayer, getGraphicById(graphicsLayer, "wall-020"));
            opGachChanThap2(graphicsLayer, getGraphicById(graphicsLayer, "wall-019"));
            opGachChanThap3(graphicsLayer, getGraphicById(graphicsLayer, "wall-023"));
            opGachChanThap3(graphicsLayer, getGraphicById(graphicsLayer, "wall-018"));
            opGachChanThap2(graphicsLayer, getGraphicById(graphicsLayer, "wall-022"));
            opGachChanThap2(graphicsLayer, getGraphicById(graphicsLayer, "wall-008"));
            opGachChanThap3(graphicsLayer, getGraphicById(graphicsLayer, "wall-003"));
            opGachDinhThap(graphicsLayer, getGraphicById(graphicsLayer, "wall-059"));
            opGachDinhThap1(graphicsLayer, getGraphicById(graphicsLayer, "wall-060"));
            opGachDinhThap2(graphicsLayer, getGraphicById(graphicsLayer, "wall-061"));
            opGachDinhThap2(graphicsLayer, getGraphicById(graphicsLayer, "wall-062"));
            opGachDinhThap(graphicsLayer, getGraphicById(graphicsLayer, "wall-063"));
            opGachDinhThap1(graphicsLayer, getGraphicById(graphicsLayer, "wall-064"));
            opGachDinhThap(graphicsLayer, getGraphicById(graphicsLayer, "wall-065"));
            opGachDinhThap1(graphicsLayer, getGraphicById(graphicsLayer, "wall-066"));
            var wall2 = getGraphicById(graphicsLayer, "wall-002");
            var trap1 = createTrapezoidBrickOutwardSlope2(
                wall2.attributes.polygon,
                findNewPoint(wall2.attributes.line[0], getLineBearing(wall2.attributes.line[0], wall2.attributes.line[1]) + 90, 0.5),
                8,
                0.2,
                wall2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2 = getGraphicById(graphicsLayer, "wall-001");
            trap1 = createTrapezoidBrickOutwardSlope(
                wall2.attributes.polygon,
                findNewPoint(wall2.attributes.line[0], getLineBearing(wall2.attributes.line[0], wall2.attributes.line[1]) - 90, 0.5),
                8,
                0.2,
                wall2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2 = getGraphicById(graphicsLayer, "wall-003");
            trap1 = createTrapezoidBrickOutwardSlope2(
                wall2.attributes.polygon,
                findNewPoint(wall2.attributes.line[0], getLineBearing(wall2.attributes.line[0], wall2.attributes.line[1]) + 90, 0.5),
                8,
                0.2,
                wall2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2 = getGraphicById(graphicsLayer, "wall-004");
            trap1 = createTrapezoidBrickOutwardSlope2(
                wall2.attributes.polygon,
                findNewPoint(wall2.attributes.line[0], getLineBearing(wall2.attributes.line[0], wall2.attributes.line[1]) + 90, 0.5),
                8,
                0.2,
                wall2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);
            
            wall2 = getGraphicById(graphicsLayer, "wall-006");
            trap1 = createTrapezoidBrickOutwardSlope(
                wall2.attributes.polygon,
                findNewPoint(wall2.attributes.line[0], getLineBearing(wall2.attributes.line[0], wall2.attributes.line[1]) - 90, 0.5),
                8,
                0.2,
                wall2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2 = getGraphicById(graphicsLayer, "wall-007");
            trap1 = createTrapezoidBrickOutwardSlope(
                wall2.attributes.polygon,
                findNewPoint(wall2.attributes.line[0], getLineBearing(wall2.attributes.line[0], wall2.attributes.line[1]) - 90, 0.5),
                8,
                0.2,
                wall2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2 = getGraphicById(graphicsLayer, "wall-008");
            trap1 = createTrapezoidBrickOutwardSlope(
                wall2.attributes.polygon,
                findNewPoint(wall2.attributes.line[0], getLineBearing(wall2.attributes.line[0], wall2.attributes.line[1]) - 90, 0.5),
                8,
                0.2,
                wall2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2 = getGraphicById(graphicsLayer, "wall-009");
            trap1 = createTrapezoidBrickOutwardSlope(
                wall2.attributes.polygon,
                findNewPoint(wall2.attributes.line[0], getLineBearing(wall2.attributes.line[0], wall2.attributes.line[1]) - 90, 0.5),
                8,
                0.2,
                wall2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            opGachTuong(graphicsLayer, getGraphicById(graphicsLayer, "wall-028"));
            opGachTuong(graphicsLayer, getGraphicById(graphicsLayer, "wall-026"));
            opGachTuong(graphicsLayer, getGraphicById(graphicsLayer, "wall-032"));
            opGachTuong(graphicsLayer, getGraphicById(graphicsLayer, "wall-044"));
            
            opGachTuong1(graphicsLayer, getGraphicById(graphicsLayer, "wall-029"));
            opGachTuong1(graphicsLayer, getGraphicById(graphicsLayer, "wall-027"));
            opGachTuong1(graphicsLayer, getGraphicById(graphicsLayer, "wall-035"));
            
            const gachTuong = ["wall-033", "wall-034", "wall-038", "wall-039", "wall-040", "wall-045", "wall-046", "wall-047", "wall-048", "wall-049",  "wall-051", "wall-054", "wall-055", "wall-056", "wall-057"]
            gachTuong.forEach(wallName => {
                opGachTuong01(graphicsLayer, getGraphicById(graphicsLayer, wallName));
            })

            const gachTuong1 = ["wall-036", "wall-037", "wall-041", "wall-042", "wall-043", "wall-050", "wall-052"]
            gachTuong1.forEach(wallName => {
                opGachTuong11(graphicsLayer, getGraphicById(graphicsLayer, wallName));
            })

            const hangGach = ["wall-011", "wall-012", "wall-017"]
            hangGach.forEach(wallName => {
                const w = getGraphicById(graphicsLayer, wallName);
                const points = divideWallLine(w, 6);
                console.log(points);
                points.forEach(point => {
                    opGachTuong02(graphicsLayer, w, point)
                })
            });
            const hangGach01 = ["wall-028", "wall-024"]
            hangGach01.forEach(wallName => {
                const w = getGraphicById(graphicsLayer, wallName);
                const points = divideWallLine(w, 2);
                console.log(points);
                points.forEach(point => {
                    opGachTuong02(graphicsLayer, w, point)
                })
            });

            const hangGach1 = ["wall-014", "wall-015", "wall-016"]
            hangGach1.forEach(wallName => {
                const w = getGraphicById(graphicsLayer, wallName);
                const points = divideWallLine(w, 6);
                console.log(points);
                points.forEach(point => {
                    opGachTuong12(graphicsLayer, w, point)
                })
            })
            const hangGach11 = ["wall-029", "wall-025"]
            hangGach11.forEach(wallName => {
                const w = getGraphicById(graphicsLayer, wallName);
                const points = divideWallLine(w, 2);
                console.log(points);
                points.forEach(point => {
                    opGachTuong12(graphicsLayer, w, point)
                })
            })

            // Tìm kiếm các điểm 
            const wall = getGraphicById(graphicsLayer, "wall-001");
            const wall_line = wall.attributes.line
            const o = getPolygonOrientation(wall.attributes.polygon) - 90;
            console.log(findNewPoint(
                [
                    106.69926887393719,
                    10.779610252606249
                ]
                , o, 0.5));
            
            
            
            
            
            
            
            
            
            

            
        });
    
    

    
});