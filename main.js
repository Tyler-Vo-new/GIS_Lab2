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

            // === THÊM CỬA VÀ CỬA SỔ ===
            
            // Lấy các wall cần thiết (tầng dưới)
            const wall1 = getGraphicById(graphicsLayer, "wall-001");
            const wall2 = getGraphicById(graphicsLayer, "wall-002");
            const wall3 = getGraphicById(graphicsLayer, "wall-003");
            const wall4 = getGraphicById(graphicsLayer, "wall-004");
            const wall5 = getGraphicById(graphicsLayer, "wall-005");
            const wall6 = getGraphicById(graphicsLayer, "wall-006");
            const wall7 = getGraphicById(graphicsLayer, "wall-007");
            const wall8 = getGraphicById(graphicsLayer, "wall-008");
            const wall9 = getGraphicById(graphicsLayer, "wall-009");
            const wall20 = getGraphicById(graphicsLayer, "wall-020");
            const wall21 = getGraphicById(graphicsLayer, "wall-021");

            // Lấy các wall tầng trên (baseZ = 35m)
            const wall59 = getGraphicById(graphicsLayer, "wall-059");  // tầng trên wall-001
            const wall60 = getGraphicById(graphicsLayer, "wall-060");  // tầng trên wall-002
            const wall61 = getGraphicById(graphicsLayer, "wall-061");  // tầng trên wall-003
            const wall62 = getGraphicById(graphicsLayer, "wall-062");  // tầng trên wall-004
            const wall63 = getGraphicById(graphicsLayer, "wall-063");  // tầng trên wall-006
            const wall64 = getGraphicById(graphicsLayer, "wall-064");  // tầng trên wall-007
            const wall65 = getGraphicById(graphicsLayer, "wall-065");  // tầng trên wall-008
            const wall66 = getGraphicById(graphicsLayer, "wall-066");  // tầng trên wall-009

            // 3 CỬA CHÍNH (mặt trước)
            if (wall1 && wall5 && wall6) {
                addMainDoors(graphicsLayer, {
                    wall001: wall1.attributes.polygon,
                    wall005: wall5.attributes.polygon,
                    wall006: wall6.attributes.polygon
                });
            }

            // 2 CỬA BÊN HÔNG
            if (wall2 && wall7) {
                addSideDoors(graphicsLayer, {
                    wall002: wall2.attributes.polygon,
                    wall007: wall7.attributes.polygon
                });
            }

            // CỬA SỔ CHO 2 THÁP (wall-001 và wall-006)
            if (wall1 && wall6 && wall59 && wall63) {
                addTowerWindows(graphicsLayer, {
                    wall001: wall1.attributes.polygon,
                    wall006: wall6.attributes.polygon,
                    wall059: wall59.attributes.polygon,  // tầng trên wall-001
                    wall063: wall63.attributes.polygon,  // tầng trên wall-006
                    topWall059BaseZ: wall59.attributes.baseZ,
                    topWall063BaseZ: wall63.attributes.baseZ
                });
            }

            // CỬA SỔ CHO 2 THÁP PHÍA SAU (wall-003 và wall-008)
            if (wall3 && wall8 && wall61 && wall65) {
                addBackTowerWindows(graphicsLayer, {
                    wall003: wall3.attributes.polygon,
                    wall008: wall8.attributes.polygon,
                    wall061: wall61.attributes.polygon,  // tầng trên wall-003
                    wall065: wall65.attributes.polygon,  // tầng trên wall-008
                    topWall061BaseZ: wall61.attributes.baseZ,
                    topWall065BaseZ: wall65.attributes.baseZ
                });
            }

            // CỬA SỔ CHO 2 TƯỜNG BÊN HÔNG
            if (wall2 || wall7 || wall4 || wall9) {
                addSideWindows(graphicsLayer, {
                    wall002: wall2 ? wall2.attributes.polygon : null,
                    wall007: wall7 ? wall7.attributes.polygon : null,
                    wall004: wall4 ? wall4.attributes.polygon : null,
                    wall009: wall9 ? wall9.attributes.polygon : null,
                    wall060: wall60 ? wall60.attributes.polygon : null,  // tầng trên wall-002
                    wall064: wall64 ? wall64.attributes.polygon : null,  // tầng trên wall-007
                    wall062: wall62 ? wall62.attributes.polygon : null,  // tầng trên wall-004
                    wall066: wall66 ? wall66.attributes.polygon : null,  // tầng trên wall-009
                    topWall060BaseZ: wall60 ? wall60.attributes.baseZ : null,
                    topWall064BaseZ: wall64 ? wall64.attributes.baseZ : null,
                    topWall062BaseZ: wall62 ? wall62.attributes.baseZ : null,
                    topWall066BaseZ: wall66 ? wall66.attributes.baseZ : null
                });
            }

            // CỬA SỔ CHO TƯỜNG GIỮA (wall-005)
            if (wall5) {
                addCenterWindows(graphicsLayer, {
                    wall005: wall5.attributes.polygon
                });
            }

            // === CỬA CHÍNH CHO THÂN NHÀ THỜ (wall-020 và wall-021) ===
            console.log("Checking wall-020 and wall-021 for main doors...");
            console.log("wall-020:", wall20);
            console.log("wall-021:", wall21);
            
            if (wall20 || wall21) {
                try {
                    console.log("Calling addNaveMainDoors...");
                    addNaveMainDoors(graphicsLayer, {
                        wall020: wall20 ? wall20.attributes.polygon : null,
                        wall021: wall21 ? wall21.attributes.polygon : null
                    });
                    console.log("addNaveMainDoors completed");
                } catch (error) {
                    console.error("Error adding nave main doors:", error);
                }
            } else {
                console.log("Both wall-020 and wall-021 not found");
            }

            // === CỬA SỔ CHO THÂN NHÀ THỜ (wall-014 và wall-011) ===
            const wall14 = getGraphicById(graphicsLayer, "wall-014");  // Gian nhà trái (cùng hướng wall-002)
            const wall11 = getGraphicById(graphicsLayer, "wall-011");  // Gian nhà phải (cùng hướng wall-007)
            
            if (wall14 || wall11) {
                try {
                    addNaveWindows(graphicsLayer, {
                        wall014: wall14 ? wall14.attributes.polygon : null,
                        wall011: wall11 ? wall11.attributes.polygon : null
                    });
                } catch (error) {
                    console.error("Error adding nave windows:", error);
                }
            }

            // === BỘ 3 CỬA SỔ CHO THÂN NHÀ THỜ (wall-016 và wall-017) ===
            const wall16 = getGraphicById(graphicsLayer, "wall-016");  // Gian nhà trái (cùng hướng wall-014)
            const wall17 = getGraphicById(graphicsLayer, "wall-017");  // Gian nhà phải (cùng hướng wall-011)
            
            console.log("wall-016:", wall16);
            console.log("wall-017:", wall17);
            
            if (wall16 || wall17) {
                try {
                    addNaveTripletWindows(graphicsLayer, {
                        wall016: wall16 ? wall16.attributes.polygon : null,
                        wall017: wall17 ? wall17.attributes.polygon : null
                    });
                } catch (error) {
                    console.error("Error adding nave triplet windows:", error);
                }
            } else {
                console.log("Both wall-016 and wall-017 not found");
            }

            // Thêm cửa sổ cho các tường cuối nhà thờ (apse)
            const wall26 = getGraphicById(graphicsLayer, "wall-026");
            const wall27 = getGraphicById(graphicsLayer, "wall-027");
            const wall28 = getGraphicById(graphicsLayer, "wall-028");
            const wall29 = getGraphicById(graphicsLayer, "wall-029");
            const wall18 = getGraphicById(graphicsLayer, "wall-018");
            const wall19 = getGraphicById(graphicsLayer, "wall-019");
            const wall22 = getGraphicById(graphicsLayer, "wall-022");
            const wall23 = getGraphicById(graphicsLayer, "wall-023");
            const wall24 = getGraphicById(graphicsLayer, "wall-024");
            const wall25 = getGraphicById(graphicsLayer, "wall-025");
            
            // Lấy các tường nhỏ ở phần cuối nhà thờ
            const wall32 = getGraphicById(graphicsLayer, "wall-032");
            const wall33 = getGraphicById(graphicsLayer, "wall-033");
            const wall34 = getGraphicById(graphicsLayer, "wall-034");
            const wall35 = getGraphicById(graphicsLayer, "wall-035");
            const wall36 = getGraphicById(graphicsLayer, "wall-036");
            const wall37 = getGraphicById(graphicsLayer, "wall-037");
            const wall38 = getGraphicById(graphicsLayer, "wall-038");
            const wall39 = getGraphicById(graphicsLayer, "wall-039");
            const wall40 = getGraphicById(graphicsLayer, "wall-040");
            const wall41 = getGraphicById(graphicsLayer, "wall-041");
            const wall42 = getGraphicById(graphicsLayer, "wall-042");
            const wall43 = getGraphicById(graphicsLayer, "wall-043");
            const wall49 = getGraphicById(graphicsLayer, "wall-049");
            const wall50 = getGraphicById(graphicsLayer, "wall-050");
            const wall51 = getGraphicById(graphicsLayer, "wall-051");
            const wall52 = getGraphicById(graphicsLayer, "wall-052");
            const wall53 = getGraphicById(graphicsLayer, "wall-053");
            const wall54 = getGraphicById(graphicsLayer, "wall-054");
            const wall55 = getGraphicById(graphicsLayer, "wall-055");
            const wall56 = getGraphicById(graphicsLayer, "wall-056");
            const wall57 = getGraphicById(graphicsLayer, "wall-057");
            const wall58 = getGraphicById(graphicsLayer, "wall-058");
            
            console.log("wall-028:", wall28);
            console.log("wall-029:", wall29);
            console.log("wall-018:", wall18);
            console.log("wall-019:", wall19);
            console.log("wall-022:", wall22);
            console.log("wall-023:", wall23);
            console.log("wall-024:", wall24);
            console.log("wall-025:", wall25);
            
            if (wall28 || wall29 || wall18 || wall19 || wall22 || wall23 || wall24 || wall25) {
                try {
                    addApseWindows(graphicsLayer, {
                        wall028: wall28 ? wall28.attributes.polygon : null,
                        wall029: wall29 ? wall29.attributes.polygon : null,
                        wall018: wall18 ? wall18.attributes.polygon : null,
                        wall019: wall19 ? wall19.attributes.polygon : null,
                        wall022: wall22 ? wall22.attributes.polygon : null,
                        wall023: wall23 ? wall23.attributes.polygon : null,
                        wall024: wall24 ? wall24.attributes.polygon : null,
                        wall025: wall25 ? wall25.attributes.polygon : null
                    });
                } catch (error) {
                    console.error("Error adding apse windows:", error);
                }
            } else {
                console.log("No apse walls found");
            }
            
            // Thêm cửa sổ đơn cho các tường nhỏ ở phần cuối
            if (wall32 || wall33 || wall34 || wall35 || wall36 || wall37 || wall38 || wall39 || wall40 || wall41 || wall42 || wall43 || wall49 || wall50 || wall51 || wall52 || wall53 || wall54 || wall55 || wall56 || wall57 || wall58) {
                try {
                    addUpperApseWindows(graphicsLayer, {
                        wall032: wall32 ? wall32.attributes.polygon : null,
                        wall033: wall33 ? wall33.attributes.polygon : null,
                        wall034: wall34 ? wall34.attributes.polygon : null,
                        wall035: wall35 ? wall35.attributes.polygon : null,
                        wall036: wall36 ? wall36.attributes.polygon : null,
                        wall037: wall37 ? wall37.attributes.polygon : null,
                        wall038: wall38 ? wall38.attributes.polygon : null,
                        wall039: wall39 ? wall39.attributes.polygon : null,
                        wall040: wall40 ? wall40.attributes.polygon : null,
                        wall041: wall41 ? wall41.attributes.polygon : null,
                        wall042: wall42 ? wall42.attributes.polygon : null,
                        wall043: wall43 ? wall43.attributes.polygon : null,
                        wall049: wall49 ? wall49.attributes.polygon : null,
                        wall050: wall50 ? wall50.attributes.polygon : null,
                        wall051: wall51 ? wall51.attributes.polygon : null,
                        wall052: wall52 ? wall52.attributes.polygon : null,
                        wall053: wall53 ? wall53.attributes.polygon : null,
                        wall054: wall54 ? wall54.attributes.polygon : null,
                        wall055: wall55 ? wall55.attributes.polygon : null,
                        wall056: wall56 ? wall56.attributes.polygon : null,
                        wall057: wall57 ? wall57.attributes.polygon : null,
                        wall058: wall58 ? wall58.attributes.polygon : null
                    });
                } catch (error) {
                    console.error("Error adding upper apse windows:", error);
                }
            } else {
                console.log("No upper apse walls found");
            }
            
            // Thêm cửa chính cho wall-026
            if (wall26) {
                try {
                    const doorWidth = 1.0;
                    const doorHeight = 3.5;
                    const rectHeight = doorHeight * 0.65;
                    const doorBaseZ = 9; // Chạm đất
                    
                    const doorGraphics = window.createSingleCenteredWindow(
                        wall26.attributes.polygon,
                        doorWidth,
                        rectHeight,
                        doorBaseZ,
                        "wall-026"
                    );
                    doorGraphics.forEach(g => graphicsLayer.add(g));
                    console.log(`Added ${doorGraphics.length} door graphics to wall-026`);
                } catch (error) {
                    console.error("Error adding door to wall-026:", error);
                }
            }
            
            // Thêm cửa chính cho wall-026
            if (wall26) {
                try {
                    const doorWidth = 1.0;
                    const doorHeight = 3.5;
                    const rectHeight = doorHeight * 0.65;
                    const doorBaseZ = 9; // Chạm đất
                    
                    const doorGraphics = window.createSingleCenteredWindow(
                        wall26.attributes.polygon,
                        doorWidth,
                        rectHeight,
                        doorBaseZ,
                        "wall-026"
                    );
                    doorGraphics.forEach(g => graphicsLayer.add(g));
                    console.log(`Added ${doorGraphics.length} door graphics to wall-026`);
                } catch (error) {
                    console.error("Error adding door to wall-026:", error);
                }
            }
            
            // Thêm cửa chính cho wall-027
            if (wall27) {
                try {
                    const doorWidth = 1.0;
                    const doorHeight = 3.5;
                    const rectHeight = doorHeight * 0.65;
                    const doorBaseZ = 9; // Chạm đất
                    
                    const doorGraphics = window.createSingleCenteredWindow(
                        wall27.attributes.polygon,
                        doorWidth,
                        rectHeight,
                        doorBaseZ,
                        "wall-027"
                    );
                    doorGraphics.forEach(g => graphicsLayer.add(g));
                    console.log(`Added ${doorGraphics.length} door graphics to wall-027`);
                } catch (error) {
                    console.error("Error adding door to wall-027:", error);
                }
            }

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
            
            // Tìm kiếm các điểm 
            const wall = getGraphicById(graphicsLayer, "wall-008");
            const wall_line = wall.attributes.line
            const o = getPolygonOrientation(wall.attributes.polygon) - 90;
            console.log(findNewPoint(
                [
                    106.69926887393719,
                    10.779610252606249
                ]
                , o, 0.5));
            
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