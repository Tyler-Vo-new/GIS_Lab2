require([
    "esri/Graphic",
    "esri/geometry/Mesh",
], function (Graphic, Mesh) {

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

    function createWallPolygonFromLine1(feature) {
        const { id, baseZ, height, material } = feature.properties;
        const [p0, p1] = feature.geometry.coordinates;

        const bearing = getLineBearing(p0, p1);

        const p1L = offsetPoint(p0, bearing, height + 2);
        const p1R = offsetPoint(p1, bearing, height);

        return [p0, p1, p1R, p1L, p0]; // CCW
    }

    function createWallPolygonFromLine2(feature) {
        const { id, baseZ, height, material } = feature.properties;
        const [p0, p1] = feature.geometry.coordinates;

        const bearing = getLineBearing(p0, p1);

        const p1L = offsetPoint(p0, bearing, height);
        const p1R = offsetPoint(p1, bearing, height);
        const midPoint = [
            (p0[0] + p1[0]) / 2,
            (p0[1] + p1[1]) / 2
        ];
        const pDinh = [midPoint[0], midPoint[1], baseZ + height + 3];

        // polygon theo CCW: đáy → cạnh phải → đỉnh → cạnh trái → quay về đáy
        return [p0, p1, p1R, pDinh, p1L, p0];

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

    function createWallGraphic1(feature) {

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
                    x1, y1, baseZ + height + 2,
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
                polygon: createWallPolygonFromLine1(feature)
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

    function createWallGraphic2(feature, vertexHeight) {

        const { id, baseZ, height, material } = feature.properties;
        const [[x1, y1], [x2, y2]] = feature.geometry.coordinates;

        // Vector pháp tuyến (vuông góc với tường)
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);

        // pháp tuyến nằm ngang
        const normal = computeWallNormal([x1, y1], [x2, y2]);

        // Trung điểm để đặt đỉnh mái
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const roofZ = baseZ + height + vertexHeight;

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: {
                position: [
                    // đáy
                    x1, y1, baseZ,      // 0
                    x2, y2, baseZ,      // 1
                    // đỉnh tường
                    x1, y1, baseZ + height, // 2
                    x2, y2, baseZ + height, // 3
                    // đỉnh mái
                    midX, midY, roofZ       // 4
                ]
            },
            components: [{
                faces: [
                    // mặt tường
                    0, 2, 3,
                    0, 3, 1,
                    // mái tam giác
                    2, 3, 4
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
                    },
                    shading: "flat"
                }]
            },
            attributes: {
                id,
                baseZ,
                height,
                material,
                line: feature.geometry.coordinates,
                polygon: createWallPolygonFromLine2(feature)
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

    // expose
    window.createWallGraphic = createWallGraphic;
    window.createWallGraphic1 = createWallGraphic1;
    window.createWallGraphic2 = createWallGraphic2;

});