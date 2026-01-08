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
                if (["wall-044", "wall-045", "wall-048"].includes(feature.properties.id)) {
                    const fillFeature = JSON.parse(JSON.stringify(feature));
                    fillFeature.properties.height = feature.properties.baseZ;
                    fillFeature.properties.baseZ = 0;
                    fillFeature.properties.id = feature.properties.id + "-fill";
                    graphicsLayer.add(createWallGraphic(fillFeature));
                }

                var wallGraphic = null;
                if (feature.properties.id == "wall-013" || feature.properties.id == "wall-010") {
                    wallGraphic = createWallGraphic1(feature);
                    graphicsLayer.add(wallGraphic);
                } else if (["wall-005", "wall-020", "wall-021"].includes(feature.properties.id)) {
                    wallGraphic = createWallGraphic2(feature, 3);
                    graphicsLayer.add(wallGraphic);
                } else if (["wall-026"].includes(feature.properties.id)) {
                    wallGraphic = createWallGraphic2(feature, 2);
                    graphicsLayer.add(wallGraphic);
                } else if (["wall-027"].includes(feature.properties.id)) {
                    wallGraphic = createWallGraphic2(feature, 1.31);
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
                    y: sumY / count  - 0.000273,
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

            // Đặt ngói cho polygon (VomU) - Tường: 045 046 047 048
            const walls_VomU = data.features.filter(f => ["wall-045", "wall-046", "wall-047", "wall-048"].includes(f.properties.id));
            if (walls_VomU.length > 0) {
                let sumX = 0, sumY = 0, count = 0;
                walls_VomU.forEach(w => {
                    w.geometry.coordinates.forEach(p => {
                        sumX += p[0];
                        sumY += p[1];
                        count++;
                    });
                });
                const center = new Point({
                    x: sumX / count + 0.0000509,
                    y: sumY / count - 0.0005412,
                    z: walls_VomU[0].properties.baseZ + walls_VomU[0].properties.height - 18.85
                });

                Mesh.createFromGLTF(center, "./3D_Models/maiNha/VomU.glb")
                    .then(geometry => {
                        geometry.scale(32, { origin: center });
                        geometry.rotate(0, 0, 315);
                        const graphic = new Graphic({
                            geometry,
                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", size: 10000 }] }
                        });
                        graphicsLayer.add(graphic);
                    })
                    .catch(console.error);
            }

            // Đặt ngói cho nóc chính (NgoiChinh) - Tường: 016 017 028 029 054 055 056 057 058
            const walls_NgoiChinh = data.features.filter(f => ["wall-016", "wall-017", "wall-028", "wall-029", "wall-054", "wall-055", "wall-056", "wall-057", "wall-058"].includes(f.properties.id));
            if (walls_NgoiChinh.length > 0) {
                let sumX = 0, sumY = 0, count = 0;
                walls_NgoiChinh.forEach(w => {
                    w.geometry.coordinates.forEach(p => {
                        sumX += p[0];
                        sumY += p[1];
                        count++;
                    });
                });
                const center = new Point({
                    x: sumX / count + 0.000565,
                    y: sumY / count + 0.000028,
                    z: walls_NgoiChinh[0].properties.baseZ + walls_NgoiChinh[0].properties.height - 26.68
                });

                Mesh.createFromGLTF(center, "./3D_Models/maiNha/NgoiChinh.glb")
                    .then(geometry => {
                        geometry.scale(37, { origin: center });
                        geometry.rotate(0, 0, 317.3);
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
                    x: sumX / count - 0.00035,
                    y: sumY / count - 0.00014,
                    z: walls_SauPhaiDuoi[0].properties.baseZ + walls_SauPhaiDuoi[0].properties.height - 13
                });

                Mesh.createFromGLTF(center, "./3D_Models/maiNha/SauPhaiDuoi.glb")
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

    function buildWallMeshData(line, baseZ, height, wallId) {
        const [[lon1, lat1], [lon2, lat2]] = line;

        const z1 = baseZ;
        const z2 = baseZ + height;

        const positions = [
            lon1, lat1, z1,
            lon2, lat2, z1,
            lon2, lat2, z2,
            lon1, lat1, z2
        ];

        const uvs = [
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ];

        const faces = [
            0, 1, 2,
            0, 2, 3
        ];

        // metadata để gắn object sau này
        const wallMeta = {
            id: wallId,
            p0: [lon1, lat1],
            p1: [lon2, lat2],
            baseZ,
            height
        };

        return { positions, uvs, faces, wallMeta };
    }

    function buildTowers() {
        const towers = [
            {
                id: "tower-01",
                name: "Tháp chuông trái",
                // Footprint coordinates (Polygon ring)
                ring: [
                    [106.69921474573036, 10.779447264138202],
                    [106.6992656680461, 10.779502571187221],
                    [106.69921349720597, 10.779551356448232],
                    [106.69916103232897, 10.779497312696945]
                ]
            },
            {
                id: "tower-02",
                name: "Tháp chuông phải",
                ring: [
                    [106.69931938721504, 10.779558056150924],
                    [106.69937034193144, 10.779611928282318],
                    [106.69931670188687, 10.779661976261488],
                    [106.69926576435819, 10.779606952871548]
                ]
            }
        ];

        const levels = [
            { h: 9.5, name: "Tầng đáy" },
            { h: 5.4, name: "Tầng 1" },
            { h: 8.34, name: "Tầng 2" },
            { h: 11.18, name: "Tầng chuông", targetWidth: 6.34 } // Width in meters
        ];

        const baseZStart = 9; // Bắt đầu từ độ cao 9m

        towers.forEach(tower => {
            let currentZ = baseZStart;
            
            // Tính tâm của tháp để scale (thu nhỏ) tầng chuông
            const center = tower.ring.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0])
                                    .map(v => v / 4);

            // 1. Xây các tầng tường
            levels.forEach((level, idx) => {
                let ring = tower.ring;

                // Nếu là tầng chuông, cần thu nhỏ về rộng 6.34m
                // Chiều rộng hiện tại khoảng 7.5m. Scale factor ~ 6.34 / 7.5 = 0.845
                if (level.targetWidth) {
                    const currentWidthApprox = 7.5; 
                    const scale = level.targetWidth / currentWidthApprox;
                    ring = ring.map(p => [
                        center[0] + (p[0] - center[0]) * scale,
                        center[1] + (p[1] - center[1]) * scale
                    ]);
                }

                // Tạo tường cho 4 cạnh của tầng này
                let positions = [];
                let uvs = [];
                let faces = [];
                let vertexOffset = 0;

                for (let i = 0; i < ring.length; i++) {
                    const p1 = ring[i];
                    const p2 = ring[(i + 1) % ring.length];
                    const line = [p1, p2];
                    
                    // Gọi hàm buildWallMeshData có sẵn
                    const wallData = buildWallMeshData(line, currentZ, level.h, `${tower.id}_L${idx}_W${i}`);
                    
                    positions.push(...wallData.positions);
                    uvs.push(...wallData.uvs);
                    wallData.faces.forEach(f => faces.push(f + vertexOffset));
                    vertexOffset += 4;
                }

                const mesh = new Mesh({
                    spatialReference: { wkid: 4326 },
                    vertexAttributes: { position: positions, uv: uvs },
                    components: [{ faces }]
                });

                const graphic = new Graphic({
                    geometry: mesh,
                    symbol: {
                        type: "mesh-3d",
                        symbolLayers: [{
                            type: "fill",
                            material: { color: "#c1891d" }
                        }]
                    },
                    attributes: {
                        buildingId: tower.id,
                        buildingName: tower.name,
                        level: level.name
                    }
                });
                graphicsLayer.add(graphic);

                currentZ += level.h;
            });

            // 2. Thêm Nóc tháp (Roof) - GLB Model
            // currentZ đang là đỉnh của tầng chuông
            const roofGraphic = new Graphic({
                geometry: {
                    type: "point",
                    x: center[0],
                    y: center[1],
                    z: currentZ
                },
                symbol: {
                    type: "point-3d",
                    symbolLayers: [{
                        type: "object",
                        resource: { href: "./3D_Models/maiNha/ngoiMaiTrang.glb" },
                        height: 15, // Cao 15m
                        anchor: "bottom",
                        heading: 315 // Xoay 45 độ ngược chiều kim đồng hồ
                    }]
                }
            });
            graphicsLayer.add(roofGraphic);

            // 3. Thêm Thập tự giá (Cross)
            // Đặt trên đỉnh mái: currentZ + 15m
            const crossBaseZ = currentZ + 15;
            const crossHeight = 2.3;
            const crossWidth = 2.57;
            
            // Tạo Mesh cho thập tự giá (2 thanh box cắt nhau)
            const thickness = 0.2; // độ dày thanh
            
            const crossV = new Graphic({
                geometry: { type: "point", x: center[0], y: center[1], z: crossBaseZ + crossHeight/2 },
                symbol: {
                    type: "point-3d",
                    symbolLayers: [{
                        type: "object",
                        resource: { primitive: "cube" },
                        width: thickness, depth: thickness, height: crossHeight,
                        material: { color: "#c1891d" },
                        heading: 315 // Xoay 45 độ ngược chiều kim đồng hồ
                    }]
                }
            });
            const crossH = new Graphic({
                geometry: { type: "point", x: center[0], y: center[1], z: crossBaseZ + crossHeight*0.7 }, // Thanh ngang nằm ở 70% chiều cao
                symbol: {
                    type: "point-3d",
                    symbolLayers: [{
                        type: "object",
                        resource: { primitive: "cube" },
                        width: crossWidth, depth: thickness, height: thickness,
                        material: { color: "#c1891d" },
                        heading: 315 // Xoay 45 độ ngược chiều kim đồng hồ
                    }]
                }
            });
            
            graphicsLayer.add(crossV);
            graphicsLayer.add(crossH);
        });
    }

    buildTowers();
});