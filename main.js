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
                    x: 106.6993582996723,
                    y: 10.779467758454615,
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
            var w = getGraphicById(graphicsLayer, "wall-005");
            var midpoint = getMidPoint(w.attributes.line[0], w.attributes.line[1]);
            console.log(findNewPoint(midpoint, getPolygonOrientation(w.attributes.polygon)+90, 10))

            // Đặt tượng Đức mẹ bằng Mesh
            const mariaStatue = new Point({
                x: 106.6993582996723, 
                y: 10.779467758454615,
                z: 10.2,
            })

            const mariaStatue_orientation = getPolygonOrientation(getGraphicById(graphicsLayer, "wall-005").attributes.polygon);

            Mesh.createFromGLTF(mariaStatue, "./3D_Models/maria_immaculata.glb")
                .then(function (geometry) {
                    geometry.scale(5, { origin: mariaStatue })
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
            
            // Code thêm nóc tháp và thập tự giá
            const towerConfigs = [
                { id: "tower-01", wallIds: ["wall-059", "wall-060", "wall-061", "wall-062"] },
                { id: "tower-02", wallIds: ["wall-063", "wall-064", "wall-065", "wall-066"] }
            ];

            towerConfigs.forEach(config => {
                // Lấy các tường đỉnh tháp để tính tâm và độ cao
                const walls = data.features.filter(f => config.wallIds.includes(f.properties.id));
                if (!walls.length) return;

                let sumX = 0, sumY = 0, count = 0;
                let maxZ = 0;

                walls.forEach(w => {
                    const z = w.properties.baseZ + w.properties.height;
                    if (z > maxZ) maxZ = z;
                    w.geometry.coordinates.forEach(p => {
                        sumX += p[0];
                        sumY += p[1];
                        count++;
                    });
                });

                const center = [sumX / count, sumY / count];
                const currentZ = maxZ;

                // Tạo mặt phẳng che nóc (ceiling) để che khít mặt trên
                let towerPoints = [];
                walls.forEach(w => {
                    towerPoints.push(w.geometry.coordinates[0]);
                    towerPoints.push(w.geometry.coordinates[1]);
                });

                // Lọc điểm trùng
                const uniqueTowerPoints = [];
                towerPoints.forEach(p => {
                    if (!uniqueTowerPoints.some(up => Math.abs(up[0] - p[0]) < 1e-9 && Math.abs(up[1] - p[1]) < 1e-9)) {
                        uniqueTowerPoints.push(p);
                    }
                });

                // Sắp xếp theo góc xung quanh tâm để tạo vòng (ring) đúng thứ tự
                uniqueTowerPoints.sort((a, b) => {
                    return Math.atan2(a[1] - center[1], a[0] - center[0]) - Math.atan2(b[1] - center[1], b[0] - center[0]);
                });

                // Đóng vòng polygon
                if (uniqueTowerPoints.length > 0) {
                    uniqueTowerPoints.push(uniqueTowerPoints[0]);
                }

                // Thêm Z (độ cao đỉnh tường)
                const ceilingRing = uniqueTowerPoints.map(p => [p[0], p[1], currentZ]);

                const ceilingGraphic = new Graphic({
                    geometry: { type: "polygon", rings: [ceilingRing], hasZ: true },
                    symbol: { type: "simple-fill", color: "#c1891c", outline: null } // Màu xám che nóc
                });
                graphicsLayer.add(ceilingGraphic);

                // 2. Thêm Nóc tháp (Roof) - GLB Model
                const roofGraphic = new Graphic({
                    geometry: {
                        type: "point",
                        x: center[0],
                        y: center[1],
                        z: currentZ - 0.4
                    },
                    symbol: {
                        type: "point-3d",
                        symbolLayers: [{
                            type: "object",
                            resource: { href: "./3D_Models/maiNha/ngoiMaiTrang.glb" },
                            height: 15, // Cao 15m
                            anchor: "bottom",
                            heading: 314 // Xoay 45.5 độ ngược chiều kim đồng hồ
                        }]
                    }
                });
                graphicsLayer.add(roofGraphic);

                // 3. Thêm Thập tự giá (Cross)
                const crossBaseZ = currentZ - 0.2 + 15;
                const crossHeight = 2.3;
                const crossWidth = 2.57;
                const thickness = 0.2;

                const crossV = new Graphic({
                    geometry: { type: "point", x: center[0], y: center[1], z: crossBaseZ + crossHeight / 2 },
                    symbol: {
                        type: "point-3d",
                        symbolLayers: [{
                            type: "object",
                            resource: { primitive: "cube" },
                            width: thickness, depth: thickness, height: crossHeight,
                            material: { color: "#3c2415" },
                            heading: 314.5
                        }]
                    }
                });
                const crossH = new Graphic({
                    geometry: { type: "point", x: center[0], y: center[1], z: crossBaseZ + crossHeight * 0.7 },
                    symbol: {
                        type: "point-3d",
                        symbolLayers: [{
                            type: "object",
                            resource: { primitive: "cube" },
                            width: crossWidth, depth: thickness, height: thickness,
                            material: { color: "#3c2415" },
                            heading: 314.5
                        }]
                    }
                });

                graphicsLayer.add(crossV);
                graphicsLayer.add(crossH);
            });
            
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
            var wall2_2 = getGraphicById(graphicsLayer, "wall-002");
            var trap1 = createTrapezoidBrickOutwardSlope2(
                wall2_2.attributes.polygon,
                findNewPoint(wall2_2.attributes.line[0], getLineBearing(wall2_2.attributes.line[0], wall2_2.attributes.line[1]) + 90, 0.5),
                8,
                0.2,
                wall2_2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2_2 = getGraphicById(graphicsLayer, "wall-001");
            trap1 = createTrapezoidBrickOutwardSlope(
                wall2_2.attributes.polygon,
                findNewPoint(wall2_2.attributes.line[0], getLineBearing(wall2_2.attributes.line[0], wall2_2.attributes.line[1]) - 90, 0.5),
                8,
                0.2,
                wall2_2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2_2 = getGraphicById(graphicsLayer, "wall-003");
            trap1 = createTrapezoidBrickOutwardSlope2(
                wall2_2.attributes.polygon,
                findNewPoint(wall2_2.attributes.line[0], getLineBearing(wall2_2.attributes.line[0], wall2_2.attributes.line[1]) + 90, 0.5),
                8,
                0.2,
                wall2_2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2_2 = getGraphicById(graphicsLayer, "wall-004");
            trap1 = createTrapezoidBrickOutwardSlope2(
                wall2_2.attributes.polygon,
                findNewPoint(wall2_2.attributes.line[0], getLineBearing(wall2_2.attributes.line[0], wall2_2.attributes.line[1]) + 90, 0.5),
                8,
                0.2,
                wall2_2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);
            
            wall2_2 = getGraphicById(graphicsLayer, "wall-006");
            trap1 = createTrapezoidBrickOutwardSlope(
                wall2_2.attributes.polygon,
                findNewPoint(wall2_2.attributes.line[0], getLineBearing(wall2_2.attributes.line[0], wall2_2.attributes.line[1]) - 90, 0.5),
                8,
                0.2,
                wall2_2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2_2 = getGraphicById(graphicsLayer, "wall-007");
            trap1 = createTrapezoidBrickOutwardSlope(
                wall2_2.attributes.polygon,
                findNewPoint(wall2_2.attributes.line[0], getLineBearing(wall2_2.attributes.line[0], wall2_2.attributes.line[1]) - 90, 0.5),
                8,
                0.2,
                wall2_2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2_2 = getGraphicById(graphicsLayer, "wall-008");
            trap1 = createTrapezoidBrickOutwardSlope(
                wall2_2.attributes.polygon,
                findNewPoint(wall2_2.attributes.line[0], getLineBearing(wall2_2.attributes.line[0], wall2_2.attributes.line[1]) - 90, 0.5),
                8,
                0.2,
                wall2_2.attributes.baseZ + 26,
                0.5,
                1);
            graphicsLayer.add(trap1);

            wall2_2 = getGraphicById(graphicsLayer, "wall-009");
            trap1 = createTrapezoidBrickOutwardSlope(
                wall2_2.attributes.polygon,
                findNewPoint(wall2_2.attributes.line[0], getLineBearing(wall2_2.attributes.line[0], wall2_2.attributes.line[1]) - 90, 0.5),
                8,
                0.2,
                wall2_2.attributes.baseZ + 26,
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


            // Code thêm các cửa vào tường
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

            // ====== Gắn lan can mái nhà ======
            (function () {

                // ====== Lan can mái dọc ======
                const start = {
                    x: 106.6992425,
                    y: 10.77957299,
                    z: 38
                };

                const end = {
                    x: 106.6987947,
                    y: 10.77997192,
                    z: 38
                };

                // ====== SỐ ĐOẠN LAN CAN ======
                // tăng số này nếu muốn lan can mịn hơn
                const SEGMENTS = 35;

                // ====== TÍNH VECTOR ======
                const dx = (end.x - start.x) / SEGMENTS;
                const dy = (end.y - start.y) / SEGMENTS;
                const dz = (end.z - start.z) / SEGMENTS;

                for (let i = 0; i <= SEGMENTS; i++) {
                    const center = new Point({
                        x: start.x + dx * i,
                        y: start.y + dy * i,
                        z: start.z + dz * i,
                        spatialReference: { wkid: 4326 }
                    });

                    Mesh.createFromGLTF(center, "./3D_Models/maiNha/Lancan.glb")
                        .then((geometry) => {
                            geometry.scale(2, { origin: center });
                            geometry.rotate(90, 180, -45);

                            const graphic = new Graphic({
                                geometry,
                                symbol: {
                                    type: "mesh-3d",
                                    symbolLayers: [{ type: "fill", size: 10000 }]
                                },
                                elevationInfo: { mode: "absolute-height" }
                            });
                            graphicsLayer.add(graphic);
                        })
                        .catch((err) => console.error("Lancan GLB ERROR:", err));
                }

            })();

            (function () {
                // ====== Lan can Mái NGang ======
                const start = {
                    x: 106.698837656,
                    y: 10.7797061846,
                    z: 38
                };

                const end = {
                    x: 106.699086,
                    y: 10.779972495,
                    z: 38
                };

                // ====== SỐ ĐOẠN LAN CAN ======
                const SEGMENTS = 35; // tăng nếu muốn dày hơn

                // ====== VECTOR NỘI SUY ======
                const dx = (end.x - start.x) / SEGMENTS;
                const dy = (end.y - start.y) / SEGMENTS;
                const dz = (end.z - start.z) / SEGMENTS;

                for (let i = 0; i <= SEGMENTS; i++) {

                    const center = new Point({
                        x: start.x + dx * i,
                        y: start.y + dy * i,
                        z: start.z + dz * i,
                        spatialReference: { wkid: 4326 }
                    });

                    Mesh.createFromGLTF(center, "./3D_Models/maiNha/Lancan.glb")
                        .then((geometry) => {
                            geometry.scale(2, { origin: center });
                            // XOAY NGANG + 90 ĐỘ
                            geometry.rotate(90, 180, 45);
                            // ↑ trước là -45, giờ +90 → 45

                            const graphic = new Graphic({
                                geometry,
                                symbol: {
                                    type: "mesh-3d",
                                    symbolLayers: [{ type: "fill", size: 10000 }]
                                },
                                elevationInfo: { mode: "absolute-height" }
                            });

                            graphicsLayer.add(graphic);
                        })
                        .catch((err) => console.error("Lancan GLB ERROR:", err));
                }
            })();
            

            // Code thêm các cửa sổ tròn và Đồng hồ
            // --- Gắn các linh kiện (Cửa sổ và Đồng hồ) lên tường ---
            const componentsToAttach = [
                {
                    model: "./3D_Models/smallRoundWindow.glb",
                    scale: 0.3,
                    targets: [
                        { ids: ["wall-049", "wall-053"], qty: 1 },
                        {
                            ids: ["wall-051"],
                            qty: 1,
                            adjustments: {
                                offsetDir: 90, offsetDist: 0.1,
                                headingRotation: 90,
                                windowOverrides: {
                                    0: { heightFactor: 0.7 },

                                }
                            }
                        }
                        ,
                        {
                            ids: ["wall-052"],
                            qty: 1,
                            adjustments: {
                                offsetDir: 90, offsetDist: -0.2,
                                headingRotation: -90,
                                windowOverrides: {
                                    0: { heightFactor: 0.7 },

                                }
                            }
                        }
                        ,
                        {
                            ids: ["wall-050"],
                            qty: 1,
                            adjustments: {
                                offsetDir: 90, offsetDist: -0.2,
                                headingRotation: 0,
                                windowOverrides: {
                                    0: { heightFactor: 0.7 },

                                }
                            }
                        }
                        ,
                        {
                            ids: ["wall-012"],
                            qty: 6,
                            adjustments: {
                                offsetDir: -20, offsetDist: -0.9,
                                windowOverrides: {
                                    0: { heightFactor: 0.2 },
                                    1: { heightFactor: 0.2 },
                                    2: { heightFactor: 0.2 },
                                    3: { heightFactor: 0.2 },
                                    4: { heightFactor: 0.2 },
                                    5: { heightFactor: 0.2 },
                                }
                            }
                        },
                        {
                            ids: ["wall-015"],
                            qty: 6,
                            adjustments: {
                                offsetDir: -20, offsetDist: 0.5,
                                windowOverrides: {
                                    0: { heightFactor: 0.2 },
                                    1: { heightFactor: 0.2 },
                                    2: { heightFactor: 0.2 },
                                    3: { heightFactor: 0.2 },
                                    4: { heightFactor: 0.2 },
                                    5: { heightFactor: 0.2 },
                                }
                            }
                        },

                        {
                            ids: ["wall-027"],
                            qty: 1,
                            adjustments: {
                                offsetDir: -20, offsetDist: 0.2,
                                windowOverrides: {
                                    0: { heightFactor: 0.4 },


                                }
                            }
                        }
                        ,
                        {
                            ids: ["wall-027"],
                            qty: 1,
                            adjustments: {
                                offsetDir: -20, offsetDist: 0.2,
                                windowOverrides: {
                                    0: { heightFactor: 0.75 },


                                }
                            }
                        }
                        ,
                        {
                            ids: ["wall-026"],
                            qty: 1,
                            adjustments: {
                                offsetDir: 90, offsetDist: 0.2,
                                windowOverrides: {
                                    0: { heightFactor: 0.4 },


                                }
                            }
                        }
                        ,
                        {
                            ids: ["wall-026"],
                            qty: 1,
                            adjustments: {
                                offsetDir: 90, offsetDist: 0.2,
                                windowOverrides: {
                                    0: { heightFactor: 0.75 },


                                }
                            }
                        }
                        ,
                        {
                            ids: ["wall-021"],
                            qty: 2,
                            adjustments: {
                                offsetDir: -20, offsetDist: 0.2,
                                windowOverrides: {
                                    0: { heightFactor: 0.4 },
                                    1: { heightFactor: 0.4 },
                                }
                            }
                        },
                        {
                            ids: ["wall-020"],
                            qty: 2,
                            adjustments: {
                                offsetDir: -20, offsetDist: -0.6,
                                windowOverrides: {
                                    0: { heightFactor: 0.4 },
                                    1: { heightFactor: 0.4 },
                                }
                            }
                        }
                        ,
                        {
                            ids: ["wall-044"],
                            qty: 3,
                            adjustments: {
                                offsetDir: 90, offsetDist: 0.1,
                                headingRotation: 45,
                                windowOverrides: {
                                    0: { heightFactor: 0.3 },
                                    1: { heightFactor: 0.3 },
                                    2: { heightFactor: 0.3 },
                                }
                            }
                        },
                        {
                            ids: ["wall-045"],
                            qty: 3,
                            adjustments: {
                                offsetDir: 90, offsetDist: 0.1,
                                headingRotation: 110,
                                windowOverrides: {
                                    0: { heightFactor: 0.3 },
                                    1: { heightFactor: 0.3 },
                                    2: { heightFactor: 0.3 },
                                }
                            }
                        },
                        {
                            ids: ["wall-047"],
                            qty: 3,
                            adjustments: {
                                offsetDir: 90, offsetDist: 0.1,
                                headingRotation: 75,
                                windowOverrides: {
                                    0: { heightFactor: 0.3 },
                                    1: { heightFactor: 0.3 },
                                    2: { heightFactor: 0.3 },
                                }
                            }
                        },
                        {
                            ids: ["wall-048"],
                            qty: 3,
                            adjustments: {
                                offsetDir: 90, offsetDist: 0.1,
                                headingRotation: 150,
                                windowOverrides: {
                                    0: { heightFactor: 0.3 },
                                    1: { heightFactor: 0.3 },
                                    2: { heightFactor: 0.3 },
                                }
                            }
                        }
                    ]
                },
                {
                    model: "./3D_Models/roseWindow.glb",
                    scale: 0.1,
                    targets: [
                        {
                            ids: ["wall-005"],
                            qty: 1,
                            adjustments: {
                                lineOffset: -3.5, offsetDir: 90, offsetDist: -1,
                                headingRotation: 180,
                                windowOverrides: {
                                    0: { heightFactor: 0.7 }
                                }
                            }
                        },
                        {
                            ids: ["wall-020"],
                            qty: 1,
                            adjustments: {
                                lineOffset: -3.5, offsetDir: 90, offsetDist: -1.2,
                                headingRotation: 0,
                                windowOverrides: {
                                    0: { heightFactor: 0.75 }
                                }
                            }
                        },
                        {
                            ids: ["wall-021"],
                            qty: 1,
                            adjustments: {
                                lineOffset: 3.5, offsetDir: 90, offsetDist: 1.4,
                                headingRotation: 180,
                                windowOverrides: {
                                    0: { heightFactor: 0.75 }
                                }
                            }
                        }
                    ]
                },
                {
                    model: "./3D_Models/wall_clock.glb",
                    scale: 0.008,
                    targets: [
                        {
                            ids: ["wall-005"],
                            qty: 1,
                            adjustments: {
                                offsetDir: 90, offsetDist: 0.1,
                                headingRotation: 180,
                                windowOverrides: {
                                    0: { heightFactor: 0.9 }
                                }
                            }
                        }
                    ]
                }
            ];

            const attachComponentToWall = (wallId, modelPath, quantity, scaleFactor, heightFactor = 0.6, adjustments = {}) => {
                const wall = getGraphicById(graphicsLayer, wallId);
                if (!wall) return;

                const line = wall.attributes.line;
                const baseZ = wall.attributes.baseZ;
                const height = wall.attributes.height;
                const orientation = getLineBearing(line[0], line[1]);


                //                    const offsetDir = adjustments.offsetDir !== undefined ? adjustments.offsetDir : 90;
                //                    const offsetDist = adjustments.offsetDist !== undefined ? adjustments.offsetDist : 0.1;


                for (let i = 0; i < quantity; i++) {

                    const windowOverride = (adjustments.windowOverrides && adjustments.windowOverrides[i]) || {};

                    const finalOffsetDir = windowOverride.offsetDir !== undefined ? windowOverride.offsetDir : (adjustments.offsetDir !== undefined ? adjustments.offsetDir : 90);
                    const finalOffsetDist = windowOverride.offsetDist !== undefined ? windowOverride.offsetDist : (adjustments.offsetDist !== undefined ? adjustments.offsetDist : 0.1);
                    const finalHeightFact = windowOverride.heightFactor !== undefined ? windowOverride.heightFactor : heightFactor;
                    const finalHeadingRot = windowOverride.headingRotation !== undefined ? windowOverride.headingRotation : (adjustments.headingRotation !== undefined ? adjustments.headingRotation : 0);
                    const finalLineOffset = windowOverride.lineOffset !== undefined ? windowOverride.lineOffset : (adjustments.lineOffset !== undefined ? adjustments.lineOffset : 0);


                    const fraction = (i + 1) / (quantity + 1);
                    const dist = (distanceBetweenCoords(line[0], line[1]) * fraction) + finalLineOffset;

                    let pos = findNewPoint(line[0], orientation, dist);
                    // Đẩy nhẹ ra khỏi mặt tường (0.1m) để không bị z-fighting
                    pos = findNewPoint(pos, orientation + finalOffsetDir, finalOffsetDist);

                    const point = new Point({
                        x: pos[0],
                        y: pos[1],
                        z: baseZ + (height * finalHeightFact)
                    });

                    Mesh.createFromGLTF(point, modelPath)
                        .then(function (geometry) {
                            geometry.scale(scaleFactor, { origin: point });
                            geometry.rotate(0, 0, orientation + finalHeadingRot);

                            const graphic = new Graphic({
                                geometry,
                                symbol: {
                                    type: "mesh-3d",
                                    symbolLayers: [{ type: "fill" }]
                                }
                            });
                            graphicsLayer.add(graphic);
                        })
                        .catch(console.error);
                }
            };

            componentsToAttach.forEach(comp => {
                let hFact = 0.6;
                // Tinh chỉnh độ cao cho Rose Window và Đồng hồ để nằm đúng vị trí kiến trúc
                if (comp.model.includes("roseWindow")) hFact = 0.8;
                if (comp.model.includes("wall_clock")) hFact = 0.88;

                comp.targets.forEach(target => {
                    target.ids.forEach(id => {
                        attachComponentToWall(id, comp.model, target.qty, comp.scale, hFact, target.adjustments);
                    });
                });
            });

            


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