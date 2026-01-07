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
            // VẼ TƯỜNG TRƯỚC
            data.features.forEach(feature => {
                const wallGraphic = createWallGraphic(feature);
                graphicsLayer.add(wallGraphic);
            });

            // SAU ĐÓ VẼ CỬA (để cửa render trên walls)
            const wall1 = getGraphicById(graphicsLayer, "wall-001");
            const wall2 = getGraphicById(graphicsLayer, "wall-002");
            const wall3 = getGraphicById(graphicsLayer, "wall-003");
            const wall4 = getGraphicById(graphicsLayer, "wall-004");
            const wall5 = getGraphicById(graphicsLayer, "wall-005");
            const wall6 = getGraphicById(graphicsLayer, "wall-006");
            const wall7 = getGraphicById(graphicsLayer, "wall-007");
            const wall8 = getGraphicById(graphicsLayer, "wall-008");
            const wall9 = getGraphicById(graphicsLayer, "wall-009");

            const wall1_polygon = wall1.attributes.polygon;
            const wall1_line = wall1.attributes.line;

            // === THÊM CỬA SAU KHI WALLS ĐÃ ĐƯỢC VẼ ===
            
            // 3 CỬA CHÍNH (mặt trước)
            addMainDoors(graphicsLayer, {
                wall001: wall1.attributes.polygon,
                wall005: wall5.attributes.polygon,
                wall006: wall6.attributes.polygon
            });

            // 2 CỬA BÊN HÔNG
            if (wall2 && wall7) {
                addSideDoors(graphicsLayer, {
                    wall002: wall2.attributes.polygon,
                    wall007: wall7.attributes.polygon
                });
            }

            // CỬA SỔ CHO 2 THÁP (wall-001 và wall-006)
            addTowerWindows(graphicsLayer, {
                wall001: wall1.attributes.polygon,
                wall006: wall6.attributes.polygon
            });

            // CỬA SỔ CHO 2 THÁP PHÍA SAU (wall-003 và wall-008) - ngược hướng 180 độ
            if (wall3 && wall8) {
                addBackTowerWindows(graphicsLayer, {
                    wall003: wall3.attributes.polygon,
                    wall008: wall8.attributes.polygon
                });
            }

            // CỬA SỔ CHO 2 TƯỜNG BÊN HÔNG (wall-002, wall-007, wall-004, wall-009)
            addSideWindows(graphicsLayer, {
                wall002: wall2 ? wall2.attributes.polygon : null,
                wall007: wall7 ? wall7.attributes.polygon : null,
                wall004: wall4 ? wall4.attributes.polygon : null,
                wall009: wall9 ? wall9.attributes.polygon : null
            });

            // CỬA SỔ CHO TƯỜNG GIỮA (wall-005) - bộ 3 cửa
            addCenterWindows(graphicsLayer, {
                wall005: wall5.attributes.polygon
            });
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