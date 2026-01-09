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

            // Code tạo tường cho nhà thờ
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



            // Code đặt ngói cho nhà thờ
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
            
            // Đặt ngói cho polygon 1 (đuôi giữa) - Tường: 050 052 053 051 049
            const walls_DuoiGiua = data.features.filter(f => ["wall-050", "wall-052", "wall-053", "wall-051", "wall-049"].includes(f.properties.id));
            if (walls_DuoiGiua.length > 0) {
                let sumX = 0, sumY = 0, count = 0;
                walls_DuoiGiua.forEach(w => {
                    w.geometry.coordinates.forEach(p => {
                        sumX += p[0];
                        sumY += p[1];
                        count++;
                    });
                });
                const center = new Point({
                    x: (sumX / count) + 0.000375,
                    y: sumY / count + 0.000094,
                    z: walls_DuoiGiua[0].properties.baseZ + walls_DuoiGiua[0].properties.height - 28
                });

                Mesh.createFromGLTF(center, "./3D_Models/maiNha/DuoiGiua.glb")
                    .then(geometry => {
                        geometry.scale(27, { origin: center });
                        geometry.rotate(0, 0, 315); // Xoay theo hướng nhà thờ (NW)
                        const graphic = new Graphic({
                            geometry,
                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", size: 10000 }] }
                        });
                        graphicsLayer.add(graphic);
                    })
                    .catch(console.error);
            }

            // Đặt ngói cho polygon (đuôi ngoài cùng trái) - Tường: 043 042 041
            const walls_DuoiNgoaiCungTrai = data.features.filter(f => ["wall-043", "wall-042", "wall-041"].includes(f.properties.id));
            if (walls_DuoiNgoaiCungTrai.length > 0) {
                let sumX = 0, sumY = 0, count = 0;
                walls_DuoiNgoaiCungTrai.forEach(w => {
                    w.geometry.coordinates.forEach(p => {
                        sumX += p[0];
                        sumY += p[1];
                        count++;
                    });
                });
                const center = new Point({
                    x: sumX / count + 0.000553,
                    y: sumY / count - 0.000273,
                    z: walls_DuoiNgoaiCungTrai[0].properties.baseZ + walls_DuoiNgoaiCungTrai[0].properties.height - 7.28
                });

                Mesh.createFromGLTF(center, "./3D_Models/maiNha/DuoiNgoaiCungTrai.glb")
                    .then(geometry => {
                        geometry.scale(30.8, { origin: center });
                        geometry.rotate(0, 0, 285);
                        const graphic = new Graphic({
                            geometry,
                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", size: 10000 }] }
                        });
                        graphicsLayer.add(graphic);
                    })
                    .catch(console.error);
            }

            // Đặt ngói cho polygon (đuôi ngoài cùng phải) - Tường: 038 039 040
            const walls_DuoiNgoaiCungPhai = data.features.filter(f => ["wall-038", "wall-039", "wall-040"].includes(f.properties.id));
            if (walls_DuoiNgoaiCungPhai.length > 0) {
                let sumX = 0, sumY = 0, count = 0;
                walls_DuoiNgoaiCungPhai.forEach(w => {
                    w.geometry.coordinates.forEach(p => {
                        sumX += p[0];
                        sumY += p[1];
                        count++;
                    });
                });
                const center = new Point({
                    x: sumX / count + 0.000324,
                    y: sumY / count - 0.000395,
                    z: walls_DuoiNgoaiCungPhai[0].properties.baseZ + walls_DuoiNgoaiCungPhai[0].properties.height - 7.74
                });

                Mesh.createFromGLTF(center, "./3D_Models/maiNha/DuoiNgoaiCungPhai.glb")
                    .then(geometry => {
                        geometry.scale(30.8, { origin: center });
                        geometry.rotate(0, 0, 345);
                        const graphic = new Graphic({
                            geometry,
                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", size: 10000 }] }
                        });
                        graphicsLayer.add(graphic);
                    })
                    .catch(console.error);
            }

            // Đặt ngói cho polygon (đuôi thứ 2 trái) - Tường: 035 036 037
            const walls_DuoiThu2Trai = data.features.filter(f => ["wall-035", "wall-036", "wall-037"].includes(f.properties.id));
            if (walls_DuoiThu2Trai.length > 0) {
                let sumX = 0, sumY = 0, count = 0;
                walls_DuoiThu2Trai.forEach(w => {
                    w.geometry.coordinates.forEach(p => {
                        sumX += p[0];
                        sumY += p[1];
                        count++;
                    });
                });
                const center = new Point({
                    x: sumX / count + 0.000469,
                    y: sumY / count + 0.000384,
                    z: walls_DuoiThu2Trai[0].properties.baseZ + walls_DuoiThu2Trai[0].properties.height - 3.88
                });

                Mesh.createFromGLTF(center, "./3D_Models/maiNha/DuoiThu2Trai.glb")
                    .then(geometry => {
                        geometry.scale(26, { origin: center });
                        geometry.rotate(0, 0, 365);
                        const graphic = new Graphic({
                            geometry,
                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", size: 10000 }] }
                        });
                        graphicsLayer.add(graphic);
                    })
                    .catch(console.error);
            }

            // Đặt ngói cho polygon (đuôi thứ 2 phải) - Tường: 032 033 034
            const walls_DuoiThu2Phai = data.features.filter(f => ["wall-032", "wall-033", "wall-034"].includes(f.properties.id));
            if (walls_DuoiThu2Phai.length > 0) {
                let sumX = 0, sumY = 0, count = 0;
                walls_DuoiThu2Phai.forEach(w => {
                    w.geometry.coordinates.forEach(p => {
                        sumX += p[0];
                        sumY += p[1];
                        count++;
                    });
                });
                const center = new Point({
                    x: sumX / count - 0.000275,
                    y: sumY / count - 0.000509,
                    z: walls_DuoiThu2Phai[0].properties.baseZ + walls_DuoiThu2Phai[0].properties.height - 3.33
                });

                Mesh.createFromGLTF(center, "./3D_Models/maiNha/DuoiThu2Phai.glb")
                    .then(geometry => {
                        geometry.scale(26, { origin: center });
                        geometry.rotate(0, 0, 265);
                        const graphic = new Graphic({
                            geometry,
                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", size: 10000 }] }
                        });
                        graphicsLayer.add(graphic);
                    })
                    .catch(console.error);
            }

            // Đặt ngói cho polygon (SauTraiDuoi) - Tường: 025
            const walls_SauTraiDuoi = data.features.filter(f => ["wall-025"].includes(f.properties.id));
            if (walls_SauTraiDuoi.length > 0) {
                let sumX = 0, sumY = 0, count = 0;
                walls_SauTraiDuoi.forEach(w => {
                    w.geometry.coordinates.forEach(p => {
                        sumX += p[0];
                        sumY += p[1];
                        count++;
                    });
                });
                const center = new Point({
                    x: sumX / count + 0.00039,
                    y: sumY / count - 0.000019,
                    z: walls_SauTraiDuoi[0].properties.baseZ + walls_SauTraiDuoi[0].properties.height - 13
                });

                Mesh.createFromGLTF(center, "./3D_Models/maiNha/SauTraiDuoi.glb")
                    .then(geometry => {
                        geometry.scale(26, { origin: center });
                        geometry.rotate(0, 0, 315);
                        const graphic = new Graphic({
                            geometry,
                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", size: 10000 }] }
                        });
                        graphicsLayer.add(graphic);
                    })
                    .catch(console.error);
            }

            // Đặt ngói cho polygon (SauPhaiDuoi) - Tường: 024
            const walls_SauPhaiDuoi = data.features.filter(f => ["wall-024"].includes(f.properties.id));
            if (walls_SauPhaiDuoi.length > 0) {
                let sumX = 0, sumY = 0, count = 0;
                walls_SauPhaiDuoi.forEach(w => {
                    w.geometry.coordinates.forEach(p => {
                        sumX += p[0];
                        sumY += p[1];
                        count++;
                    });
                });
                const center = new Point({
                    x: sumX / count - 0.000038,
                    y: sumY / count - 0.000565,
                    z: walls_SauPhaiDuoi[0].properties.baseZ + walls_SauPhaiDuoi[0].properties.height - 17
                });

                Mesh.createFromGLTF(center, "./3D_Models/maiNha/SauPhaiDuoi.glb")
                    .then(geometry => {
                        geometry.scale(36, { origin: center });
                        geometry.rotate(0, 0, 316.5);
                        const graphic = new Graphic({
                            geometry,
                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", size: 10000 }] }
                        });
                        graphicsLayer.add(graphic);
                    })
                    .catch(console.error);
            }

            // Đặt ngói cho polygon (SauTamGiacTrai) - Tường: 027 031
            const walls_SauTamGiacTrai = data.features.filter(f => ["wall-027", "wall-031"].includes(f.properties.id));
            if (walls_SauTamGiacTrai.length > 0) {
                let sumX = 0, sumY = 0, count = 0;
                walls_SauTamGiacTrai.forEach(w => {
                    w.geometry.coordinates.forEach(p => {
                        sumX += p[0];
                        sumY += p[1];
                        count++;
                    });
                });
                const center = new Point({
                    x: sumX / count + 0.000399,
                    y: sumY / count - 0.0001266,
                    z: walls_SauTamGiacTrai[0].properties.baseZ + walls_SauTamGiacTrai[0].properties.height - 15
                });

                Mesh.createFromGLTF(center, "./3D_Models/maiNha/SauTamGiacTrai.glb")
                    .then(geometry => {
                        geometry.scale(22.8, { origin: center });
                        geometry.rotate(0, 0, 318);
                        const graphic = new Graphic({
                            geometry,
                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", size: 10000 }] }
                        });
                        graphicsLayer.add(graphic);
                    })
                    .catch(console.error);
            }

            // Tạo nóc chính cho nhà thờ
            function createRoofMesh(peakStartXY,   // [x,y] đỉnh nóc đầu
                peakEndXY,     // [x,y] đỉnh nóc cuối
                baseLeftXY,    // [x,y] đáy trái tại đầu hồi đầu
                baseRightXY,   // [x,y] đáy phải tại đầu hồi đầu
                wallTopZ,      // cao độ đỉnh tường
                roofHeight,    // đỉnh nóc cao hơn tường
                wkid = 4326    // hệ tọa độ (đổi sang 3857 nếu dùng WebMercator)
            ) {
                // Z cho đáy và nóc
                const baseZ = wallTopZ;
                const peakZ = wallTopZ + roofHeight;

                // Vector dịch theo chiều dài mái: peakStart -> peakEnd
                const vx = peakEndXY[0] - peakStartXY[0];
                const vy = peakEndXY[1] - peakStartXY[1];

                // Đáy tại đầu hồi thứ hai: dịch baseLeft/baseRight theo vector
                const baseLeft2 = [baseLeftXY[0] + vx, baseLeftXY[1] + vy, baseZ];
                const baseRight2 = [baseRightXY[0] + vx, baseRightXY[1] + vy, baseZ];

                // Đầu hồi 1
                const baseLeft1 = [baseLeftXY[0], baseLeftXY[1], baseZ];
                const baseRight1 = [baseRightXY[0], baseRightXY[1], baseZ];
                const peak1 = [peakStartXY[0], peakStartXY[1], peakZ];

                // Đầu hồi 2
                const peak2 = [peakEndXY[0], peakEndXY[1], peakZ];

                const positions = [
                    // đầu hồi 1
                    baseLeft1[0], baseLeft1[1], baseLeft1[2],  // 0
                    baseRight1[0], baseRight1[1], baseRight1[2], // 1
                    peak1[0], peak1[1], peak1[2],      // 2

                    // đầu hồi 2
                    baseLeft2[0], baseLeft2[1], baseLeft2[2],  // 3
                    baseRight2[0], baseRight2[1], baseRight2[2], // 4
                    peak2[0], peak2[1], peak2[2]       // 5
                ];

                const faces = [
                    // tam giác đầu hồi 1
                    0, 1, 2,
                    // tam giác đầu hồi 2
                    3, 4, 5,
                    // mặt bên trái mái
                    0, 2, 5, 0, 5, 3,
                    // mặt bên phải mái
                    1, 2, 5, 1, 5, 4
                ];

                const mesh = new Mesh({
                    spatialReference: { wkid },
                    vertexAttributes: { position: positions },
                    components: [{ faces }]
                });

                return new Graphic({
                    geometry: mesh,
                    symbol: {
                        type: "mesh-3d",
                        symbolLayers: [{
                            type: "fill",
                            material: { color: "#c1440e" },
                            edges: { type: "solid", color: "#333", size: 0.1 }
                        }]
                    },
                    attributes: { type: "roof-extended-triangle" }
                });
            }

            function createSlopePrismFromOnePeak(
                peakXY,        // [x,y] đỉnh nóc (theo mặt bằng)
                baseLeftXY,    // [x,y] đáy trái (theo mặt bằng)
                baseRightXY,   // [x,y] đáy phải (theo mặt bằng)
                wallTopZ,      // cao độ đỉnh tường
                roofHeight,    // đỉnh nóc cao hơn tường
                wkid = 4326
            ) {
                const baseZ = wallTopZ;
                const peakZ = wallTopZ + roofHeight;

                // 3 đỉnh của tam giác: 2 đáy cùng Z, 1 đỉnh nóc cao hơn
                const v0 = [baseLeftXY[0], baseLeftXY[1], baseZ];  // 0
                const v1 = [baseRightXY[0], baseRightXY[1], baseZ];  // 1
                const v2 = [peakXY[0], peakXY[1], peakZ];  // 2

                // Tùy hướng mặt, có thể cần đảo thứ tự để CCW
                const positions = [
                    v0[0], v0[1], v0[2],
                    v1[0], v1[1], v1[2],
                    v2[0], v2[1], v2[2]
                ];

                const faces = [0, 1, 2];

                const mesh = new Mesh({
                    spatialReference: { wkid },
                    vertexAttributes: { position: positions },
                    components: [{ faces }]
                });

                return new Graphic({
                    geometry: mesh,
                    symbol: {
                        type: "mesh-3d",
                        symbolLayers: [{
                            type: "fill",
                            material: { color: "#c1440e" },
                            edges: { type: "solid", color: "#333", size: 0.1 },
                            // Hiển thị mặt dù hướng normal quay ngược
                            doubleSided: true
                        }]
                    },
                    attributes: { type: "roof-slope-triangle" }
                });
            }

            function createSlopeQuadMesh(
                topLeftXY, topRightXY,     // [x,y] hai đỉnh trên (cao hơn)
                baseLeftXY, baseRightXY,   // [x,y] hai đỉnh dưới (thấp hơn)
                wallTopZ, roofHeight,      // cao độ tường và chiều cao nóc
                wkid = 4326
            ) {
                const baseZ = wallTopZ;
                const topZ = wallTopZ + roofHeight;

                // 4 điểm: từ trái sang phải, dưới rồi trên
                const v0 = [baseLeftXY[0], baseLeftXY[1], baseZ]; // 0
                const v1 = [baseRightXY[0], baseRightXY[1], baseZ]; // 1
                const v2 = [topRightXY[0], topRightXY[1], topZ];  // 2
                const v3 = [topLeftXY[0], topLeftXY[1], topZ];  // 3

                const positions = [
                    v0[0], v0[1], v0[2],
                    v1[0], v1[1], v1[2],
                    v2[0], v2[1], v2[2],
                    v3[0], v3[1], v3[2]
                ];

                const faces = [
                    0, 1, 2,
                    0, 2, 3
                ];

                const mesh = new Mesh({
                    spatialReference: { wkid },
                    vertexAttributes: { position: positions },
                    components: [{ faces }]
                });

                return new Graphic({
                    geometry: mesh,
                    symbol: {
                        type: "mesh-3d",
                        symbolLayers: [{
                            type: "fill",
                            material: { color: "#c1440e" },
                            edges: { type: "solid", color: "#333", size: 0.1 },
                            doubleSided: true
                        }]
                    },
                    attributes: { type: "roof-slope-quad" }
                });
            }




            var wm = getGraphicById(graphicsLayer, "wall-005");
            var d1 = wm.attributes.polygon[3]
            var wm1 = getGraphicById(graphicsLayer, "wall-008");
            var wm2 = getGraphicById(graphicsLayer, "wall-003");
            var d2 = getMidPoint(wm1.attributes.line[0], wm2.attributes.line[0]);
            var baseLeft = wm.attributes.line[0]
            var baseRight = wm.attributes.line[1]
            var r = createRoofMesh(d1, d2, baseLeft, baseRight, 26 + 9, 3);
            graphicsLayer.add(r);
            d1 = d2;
            wm1 = getGraphicById(graphicsLayer, "wall-016");
            wm2 = getGraphicById(graphicsLayer, "wall-017");
            baseLeft = wm1.attributes.line[0];
            baseRight = wm2.attributes.line[0];
            d2 = getMidPoint(wm1.attributes.line[1], wm2.attributes.line[1]);
            r = createRoofMesh(d1, d2, baseLeft, baseRight, 26 + 9, 3);
            graphicsLayer.add(r);
            d1 = d2;
            baseLeft = wm1.attributes.line[1];
            baseRight = wm2.attributes.line[1];
            wm1 = getGraphicById(graphicsLayer, "wall-028");
            wm2 = getGraphicById(graphicsLayer, "wall-029");
            d2 = getMidPoint(wm1.attributes.line[0], wm2.attributes.line[0]);
            r = createRoofMesh(d1, d2, baseLeft, baseRight, 26 + 9, 3);
            graphicsLayer.add(r);
            d1 = d2;
            baseLeft = wm1.attributes.line[0];
            baseRight = wm2.attributes.line[0];
            d2 = getMidPoint(wm1.attributes.line[1], wm2.attributes.line[1]);
            r = createRoofMesh(d1, d2, baseLeft, baseRight, 26 + 9, 3);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-021");
            d1 = getMidPoint(wm.attributes.line[0], wm.attributes.line[1]);
            baseLeft = wm.attributes.line[1];
            baseRight = wm.attributes.line[0];
            wm1 = getGraphicById(graphicsLayer, "wall-020");
            d2 = getMidPoint(wm1.attributes.line[0], wm1.attributes.line[1]);
            r = createRoofMesh(d1, d2, baseLeft, baseRight, 26 + 9, 3);
            graphicsLayer.add(r);
            wm1 = getGraphicById(graphicsLayer, "wall-028");
            wm2 = getGraphicById(graphicsLayer, "wall-029");
            d2 = getMidPoint(wm1.attributes.line[1], wm2.attributes.line[1]);
            wm = getGraphicById(graphicsLayer, "wall-054");
            baseLeft = wm.attributes.line[1];
            baseRight = wm.attributes.line[0];
            r = createSlopePrismFromOnePeak(d2, baseLeft, baseRight, 26 + 9, 3);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-055");
            baseLeft = wm.attributes.line[1];
            baseRight = wm.attributes.line[0];
            r = createSlopePrismFromOnePeak(d2, baseLeft, baseRight, 26 + 9, 3);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-056");
            baseLeft = wm.attributes.line[1];
            baseRight = wm.attributes.line[0];
            r = createSlopePrismFromOnePeak(d2, baseLeft, baseRight, 26 + 9, 3);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-057");
            baseLeft = wm.attributes.line[1];
            baseRight = wm.attributes.line[0];
            r = createSlopePrismFromOnePeak(d2, baseLeft, baseRight, 26 + 9, 3);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-058");
            baseLeft = wm.attributes.line[1];
            baseRight = wm.attributes.line[0];
            r = createSlopePrismFromOnePeak(d2, baseLeft, baseRight, 26 + 9, 3);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-028");
            d1 = wm.attributes.line[0];
            d2 = wm.attributes.line[1];
            wm1 = getGraphicById(graphicsLayer, "wall-024");
            baseLeft = findNewPoint(wm1.attributes.line[0], getPolygonOrientation(wm1.attributes.polygon) - 90, 5);
            wm2 = getGraphicById(graphicsLayer, "wall-026");
            baseRight = findNewPoint(wm2.attributes.line[1], getPolygonOrientation(wm1.attributes.polygon) - 90, 5);
            r = createSlopeQuadMesh(d1, d2, baseLeft, baseRight, 15 + 9, 2);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-029");
            d1 = wm.attributes.line[0];
            d2 = wm.attributes.line[1];
            wm1 = getGraphicById(graphicsLayer, "wall-025");
            baseLeft = findNewPoint(wm1.attributes.line[0], getPolygonOrientation(wm1.attributes.polygon) + 90, 4);
            wm2 = getGraphicById(graphicsLayer, "wall-027");
            baseRight = findNewPoint(wm2.attributes.line[1], getPolygonOrientation(wm1.attributes.polygon) + 90, 4);
            r = createSlopeQuadMesh(d1, d2, baseLeft, baseRight, 15 + 9, 2);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-027");
            d1 = wm.attributes.polygon[3];
            d2 = findNewPoint(d1, getPolygonOrientation(wm1.attributes.polygon) + 90, 6);
            baseLeft = wm.attributes.line[0];
            baseRight = wm.attributes.line[1];
            r = createRoofMesh(d1, d2, baseLeft, baseRight, 15 + 9, 2);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-026");
            d1 = wm.attributes.polygon[3];
            wm1 = getGraphicById(graphicsLayer, "wall-024");
            d2 = findNewPoint(d1, getPolygonOrientation(wm1.attributes.polygon) - 90, 6);
            baseLeft = wm.attributes.line[0];
            baseRight = wm.attributes.line[1];
            r = createRoofMesh(d1, d2, baseLeft, baseRight, 15 + 9, 2);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-054");
            d1 = wm.attributes.line[0];
            d2 = wm.attributes.line[1];
            wm1 = getGraphicById(graphicsLayer, "wall-044");
            baseLeft = wm1.attributes.line[0];
            baseRight = wm1.attributes.line[1];
            r = createSlopeQuadMesh(d1, d2, baseLeft, baseRight, 15 + 9, 2);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-055");
            d1 = wm.attributes.line[0];
            d2 = wm.attributes.line[1];
            wm1 = getGraphicById(graphicsLayer, "wall-045");
            baseLeft = wm1.attributes.line[0];
            baseRight = wm1.attributes.line[1];
            r = createSlopeQuadMesh(d1, d2, baseLeft, baseRight, 15 + 9, 2);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-056");
            d1 = wm.attributes.line[0];
            d2 = wm.attributes.line[1];
            wm1 = getGraphicById(graphicsLayer, "wall-046");
            baseLeft = wm1.attributes.line[0];
            baseRight = wm1.attributes.line[1];
            r = createSlopeQuadMesh(d1, d2, baseLeft, baseRight, 15 + 9, 2);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-057");
            d1 = wm.attributes.line[0];
            d2 = wm.attributes.line[1];
            wm1 = getGraphicById(graphicsLayer, "wall-047");
            baseLeft = wm1.attributes.line[0];
            baseRight = wm1.attributes.line[1];
            r = createSlopeQuadMesh(d1, d2, baseLeft, baseRight, 15 + 9, 2);
            graphicsLayer.add(r);
            wm = getGraphicById(graphicsLayer, "wall-058");
            d1 = wm.attributes.line[0];
            d2 = wm.attributes.line[1];
            wm1 = getGraphicById(graphicsLayer, "wall-048");
            baseLeft = wm1.attributes.line[0];
            baseRight = wm1.attributes.line[1];
            r = createSlopeQuadMesh(d1, d2, baseLeft, baseRight, 15 + 9, 2);
            graphicsLayer.add(r);


            // Code đặt tượng đức mẹ
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
            
            
            // Code ốp gạch vào các tường xung quanh
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
                points.forEach(point => {
                    opGachTuong02(graphicsLayer, w, point)
                })
            });
            const hangGach01 = ["wall-028", "wall-024"]
            hangGach01.forEach(wallName => {
                const w = getGraphicById(graphicsLayer, wallName);
                const points = divideWallLine(w, 2);
                points.forEach(point => {
                    opGachTuong02(graphicsLayer, w, point)
                })
            });

            const hangGach1 = ["wall-014", "wall-015", "wall-016"]
            hangGach1.forEach(wallName => {
                const w = getGraphicById(graphicsLayer, wallName);
                const points = divideWallLine(w, 6);
                points.forEach(point => {
                    opGachTuong12(graphicsLayer, w, point)
                })
            })
            const hangGach11 = ["wall-029", "wall-025"]
            hangGach11.forEach(wallName => {
                const w = getGraphicById(graphicsLayer, wallName);
                const points = divideWallLine(w, 2);
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