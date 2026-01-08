require([
    "esri/Graphic",
    "esri/geometry/Mesh"
], function (Graphic, Mesh) {

    // Tạo gạch
    function createBrickGraphic(
        wallPolygon,
        startingPoint,       // m
        width,         // m
        height,        // m
        baseZ,         // m
        depth = 0.8   // độ dày gạch (m)
    ) {
        // 1️⃣ Hướng tường
        const orientation = getPolygonOrientation(wallPolygon);

        // 2️⃣ Pháp tuyến
        const normalOrientation = orientation - 90;

        // 3️⃣ Điểm bắt đầu (dưới-trái của tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        // 5️⃣ Gạch luôn nằm trên mặt phẳng tường
        const front0 = p0;
        const front1 = p1;

        const back0 = findNewPoint(front0, normalOrientation, -depth);
        const back1 = findNewPoint(front1, normalOrientation, -depth);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 6️⃣ Vertex (8 điểm = box)
        const positions = [
            // FRONT
            front0[0], front0[1], z0,
            front1[0], front1[1], z0,
            front1[0], front1[1], z1,
            front0[0], front0[1], z1,

            // BACK
            back0[0], back0[1], z0,
            back1[0], back1[1], z0,
            back1[0], back1[1], z1,
            back0[0], back0[1], z1
        ];

        // 7️⃣ Faces (6 mặt hộp)
        const faces = [
            // front
            0, 1, 2, 0, 2, 3,
            // back
            5, 4, 7, 5, 7, 6,
            // left
            4, 0, 3, 4, 3, 7,
            // right
            1, 5, 6, 1, 6, 2,
            // bottom
            4, 5, 1, 4, 1, 0,
            // top
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#f9bf8fff" },
                    edges: {
                        type: "solid",
                        color: "#ccc",
                        size: 0.1
                    }
                }]
            },
            attributes: {
                type: "brick"
            }
        });
    }
    function createBrickGraphic1(
        wallPolygon,
        startingPoint,       // m
        width,         // m
        height,        // m
        baseZ,         // m
        depth = 0.8   // độ dày gạch (m)
    ) {
        // 1️⃣ Hướng tường
        const orientation = getPolygonOrientation(wallPolygon) + 180;

        // 2️⃣ Pháp tuyến
        const normalOrientation = orientation + 90;

        // 3️⃣ Điểm bắt đầu (dưới-trái của tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        // 5️⃣ Gạch luôn nằm trên mặt phẳng tường
        const front0 = p0;
        const front1 = p1;

        const back0 = findNewPoint(front0, normalOrientation, -depth);
        const back1 = findNewPoint(front1, normalOrientation, -depth);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 6️⃣ Vertex (8 điểm = box)
        const positions = [
            // FRONT
            front0[0], front0[1], z0,
            front1[0], front1[1], z0,
            front1[0], front1[1], z1,
            front0[0], front0[1], z1,

            // BACK
            back0[0], back0[1], z0,
            back1[0], back1[1], z0,
            back1[0], back1[1], z1,
            back0[0], back0[1], z1
        ];

        // 7️⃣ Faces (6 mặt hộp)
        const faces = [
            // front
            0, 1, 2, 0, 2, 3,
            // back
            5, 4, 7, 5, 7, 6,
            // left
            4, 0, 3, 4, 3, 7,
            // right
            1, 5, 6, 1, 6, 2,
            // bottom
            4, 5, 1, 4, 1, 0,
            // top
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#f9bf8fff" },
                    edges: {
                        type: "solid",
                        color: "#ccc",
                        size: 0.1
                    }
                }]
            },
            attributes: {
                type: "brick"
            }
        });
    }

    function createBrickGraphic2(
        wallPolygon,
        startingPoint,       // m
        width,         // m
        height,        // m
        baseZ,         // m
        depth = 0.8   // độ dày gạch (m)
    ) {
        // 1️⃣ Hướng tường
        const orientation = getPolygonOrientation(wallPolygon);

        // 2️⃣ Pháp tuyến
        const normalOrientation = orientation + 90;

        // 3️⃣ Điểm bắt đầu (dưới-trái của tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        // 5️⃣ Gạch luôn nằm trên mặt phẳng tường
        const front0 = p0;
        const front1 = p1;

        const back0 = findNewPoint(front0, normalOrientation, -depth);
        const back1 = findNewPoint(front1, normalOrientation, -depth);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 6️⃣ Vertex (8 điểm = box)
        const positions = [
            // FRONT
            front0[0], front0[1], z0,
            front1[0], front1[1], z0,
            front1[0], front1[1], z1,
            front0[0], front0[1], z1,

            // BACK
            back0[0], back0[1], z0,
            back1[0], back1[1], z0,
            back1[0], back1[1], z1,
            back0[0], back0[1], z1
        ];

        // 7️⃣ Faces (6 mặt hộp)
        const faces = [
            // front
            0, 1, 2, 0, 2, 3,
            // back
            5, 4, 7, 5, 7, 6,
            // left
            4, 0, 3, 4, 3, 7,
            // right
            1, 5, 6, 1, 6, 2,
            // bottom
            4, 5, 1, 4, 1, 0,
            // top
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#f9bf8fff" },
                    edges: {
                        type: "solid",
                        color: "#ccc",
                        size: 0.1
                    }
                }]
            },
            attributes: {
                type: "brick"
            }
        });
    }

    function createBrickGraphic3(
        wallPolygon,
        startingPoint,       // m
        width,         // m
        height,        // m
        baseZ,         // m
        depth = 0.8   // độ dày gạch (m)
    ) {
        // 1️⃣ Hướng tường
        const orientation = getPolygonOrientation(wallPolygon) + 180;

        // 2️⃣ Pháp tuyến
        const normalOrientation = orientation - 90;

        // 3️⃣ Điểm bắt đầu (dưới-trái của tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        // 5️⃣ Gạch luôn nằm trên mặt phẳng tường
        const front0 = p0;
        const front1 = p1;

        const back0 = findNewPoint(front0, normalOrientation, -depth);
        const back1 = findNewPoint(front1, normalOrientation, -depth);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 6️⃣ Vertex (8 điểm = box)
        const positions = [
            // FRONT
            front0[0], front0[1], z0,
            front1[0], front1[1], z0,
            front1[0], front1[1], z1,
            front0[0], front0[1], z1,

            // BACK
            back0[0], back0[1], z0,
            back1[0], back1[1], z0,
            back1[0], back1[1], z1,
            back0[0], back0[1], z1
        ];

        // 7️⃣ Faces (6 mặt hộp)
        const faces = [
            // front
            0, 1, 2, 0, 2, 3,
            // back
            5, 4, 7, 5, 7, 6,
            // left
            4, 0, 3, 4, 3, 7,
            // right
            1, 5, 6, 1, 6, 2,
            // bottom
            4, 5, 1, 4, 1, 0,
            // top
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#f9bf8fff" },
                    edges: {
                        type: "solid",
                        color: "#ccc",
                        size: 0.1
                    }
                }]
            },
            attributes: {
                type: "brick"
            }
        });
    }

    function createBrickGraphic4(
        wallPolygon,
        startingPoint,       // m
        width,         // m
        height,        // m
        baseZ,         // m
        depth = 0.8   // độ dày gạch (m)
    ) {
        // 1️⃣ Hướng tường
        const orientation = getPolygonOrientation(wallPolygon);

        // 2️⃣ Pháp tuyến
        const normalOrientation = orientation - 90;

        // 3️⃣ Điểm bắt đầu (dưới-trái của tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        // 5️⃣ Gạch luôn nằm trên mặt phẳng tường
        const front0 = p0;
        const front1 = p1;

        const back0 = findNewPoint(front0, normalOrientation, -depth);
        const back1 = findNewPoint(front1, normalOrientation, -depth);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 6️⃣ Vertex (8 điểm = box)
        const positions = [
            // FRONT
            front0[0], front0[1], z0,
            front1[0], front1[1], z0,
            front1[0], front1[1], z1,
            front0[0], front0[1], z1,

            // BACK
            back0[0], back0[1], z0,
            back1[0], back1[1], z0,
            back1[0], back1[1], z1,
            back0[0], back0[1], z1
        ];

        // 7️⃣ Faces (6 mặt hộp)
        const faces = [
            // front
            0, 1, 2, 0, 2, 3,
            // back
            5, 4, 7, 5, 7, 6,
            // left
            4, 0, 3, 4, 3, 7,
            // right
            1, 5, 6, 1, 6, 2,
            // bottom
            4, 5, 1, 4, 1, 0,
            // top
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#ffffffff" },
                    edges: {
                        type: "solid",
                        color: "#5b5b5bff",
                        size: 0.1
                    }
                }]
            },
            attributes: {
                type: "brick"
            }
        });
    }

    function createBrickGraphic5(
        wallPolygon,
        startingPoint,       // m
        width,         // m
        height,        // m
        baseZ,         // m
        depth = 0.8   // độ dày gạch (m)
    ) {
        // 1️⃣ Hướng tường
        const orientation = getPolygonOrientation(wallPolygon) + 180;

        // 2️⃣ Pháp tuyến
        const normalOrientation = orientation + 90;

        // 3️⃣ Điểm bắt đầu (dưới-trái của tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        // 5️⃣ Gạch luôn nằm trên mặt phẳng tường
        const front0 = p0;
        const front1 = p1;

        const back0 = findNewPoint(front0, normalOrientation, -depth);
        const back1 = findNewPoint(front1, normalOrientation, -depth);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 6️⃣ Vertex (8 điểm = box)
        const positions = [
            // FRONT
            front0[0], front0[1], z0,
            front1[0], front1[1], z0,
            front1[0], front1[1], z1,
            front0[0], front0[1], z1,

            // BACK
            back0[0], back0[1], z0,
            back1[0], back1[1], z0,
            back1[0], back1[1], z1,
            back0[0], back0[1], z1
        ];

        // 7️⃣ Faces (6 mặt hộp)
        const faces = [
            // front
            0, 1, 2, 0, 2, 3,
            // back
            5, 4, 7, 5, 7, 6,
            // left
            4, 0, 3, 4, 3, 7,
            // right
            1, 5, 6, 1, 6, 2,
            // bottom
            4, 5, 1, 4, 1, 0,
            // top
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#ffffffff" },
                    edges: {
                        type: "solid",
                        color: "#5b5b5bff",
                        size: 0.1
                    }
                }]
            },
            attributes: {
                type: "brick"
            }
        });
    }

    function createBrickGraphic6(
        wallPolygon,
        startingPoint,       // m
        width,         // m
        height,        // m
        baseZ,         // m
        depth = 0.8   // độ dày gạch (m)
    ) {
        // 1️⃣ Hướng tường
        const orientation = getPolygonOrientation(wallPolygon) + 180;

        // 2️⃣ Pháp tuyến
        const normalOrientation = orientation - 90;

        // 3️⃣ Điểm bắt đầu (dưới-trái của tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        // 5️⃣ Gạch luôn nằm trên mặt phẳng tường
        const front0 = p0;
        const front1 = p1;

        const back0 = findNewPoint(front0, normalOrientation, -depth);
        const back1 = findNewPoint(front1, normalOrientation, -depth);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 6️⃣ Vertex (8 điểm = box)
        const positions = [
            // FRONT
            front0[0], front0[1], z0,
            front1[0], front1[1], z0,
            front1[0], front1[1], z1,
            front0[0], front0[1], z1,

            // BACK
            back0[0], back0[1], z0,
            back1[0], back1[1], z0,
            back1[0], back1[1], z1,
            back0[0], back0[1], z1
        ];

        // 7️⃣ Faces (6 mặt hộp)
        const faces = [
            // front
            0, 1, 2, 0, 2, 3,
            // back
            5, 4, 7, 5, 7, 6,
            // left
            4, 0, 3, 4, 3, 7,
            // right
            1, 5, 6, 1, 6, 2,
            // bottom
            4, 5, 1, 4, 1, 0,
            // top
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#ffffffff" },
                    edges: {
                        type: "solid",
                        color: "#5b5b5bff",
                        size: 0.1
                    }
                }]
            },
            attributes: {
                type: "brick"
            }
        });
    }

    function createBrickGraphic7(
        wallPolygon,
        startingPoint,       // m
        width,         // m
        height,        // m
        baseZ,         // m
        depth = 0.8   // độ dày gạch (m)
    ) {
        // 1️⃣ Hướng tường
        const orientation = getPolygonOrientation(wallPolygon);

        // 2️⃣ Pháp tuyến
        const normalOrientation = orientation + 90;

        // 3️⃣ Điểm bắt đầu (dưới-trái của tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        // 5️⃣ Gạch luôn nằm trên mặt phẳng tường
        const front0 = p0;
        const front1 = p1;

        const back0 = findNewPoint(front0, normalOrientation, -depth);
        const back1 = findNewPoint(front1, normalOrientation, -depth);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 6️⃣ Vertex (8 điểm = box)
        const positions = [
            // FRONT
            front0[0], front0[1], z0,
            front1[0], front1[1], z0,
            front1[0], front1[1], z1,
            front0[0], front0[1], z1,

            // BACK
            back0[0], back0[1], z0,
            back1[0], back1[1], z0,
            back1[0], back1[1], z1,
            back0[0], back0[1], z1
        ];

        // 7️⃣ Faces (6 mặt hộp)
        const faces = [
            // front
            0, 1, 2, 0, 2, 3,
            // back
            5, 4, 7, 5, 7, 6,
            // left
            4, 0, 3, 4, 3, 7,
            // right
            1, 5, 6, 1, 6, 2,
            // bottom
            4, 5, 1, 4, 1, 0,
            // top
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#ffffffff" },
                    edges: {
                        type: "solid",
                        color: "#5b5b5bff",
                        size: 0.1
                    }
                }]
            },
            attributes: {
                type: "brick"
            }
        });
    }

    function createTrapezoidBrickOutwardSlope(
        wallPolygon,
        startingPoint,   // điểm bắt đầu (dưới-trái)
        width,           // chiều rộng viên gạch
        height,          // chiều cao viên gạch
        baseZ,           // cao độ đáy
        depthUpper = 0.8,// độ dày mặt trên
        depthLower = 1   // độ dày mặt dưới
    ) {
        const orientation = getPolygonOrientation(wallPolygon);
        const normalOrientation = orientation - 90;

        // Mặt trước (luôn nằm trên tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        const front0 = p0;
        const front1 = p1;

        // Mặt sau dưới (đáy dưới dày hơn)
        const back0Lower = findNewPoint(front0, normalOrientation, -depthLower);
        const back1Lower = findNewPoint(front1, normalOrientation, -depthLower);

        // Mặt sau trên (đỉnh trên mỏng hơn)
        const back0Upper = findNewPoint(front0, normalOrientation, -depthUpper);
        const back1Upper = findNewPoint(front1, normalOrientation, -depthUpper);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 8 đỉnh: 4 cho mặt trước, 2 cho mặt sau dưới, 2 cho mặt sau trên
        const positions = [
            // mặt trước
            front0[0], front0[1], z0, // 0
            front1[0], front1[1], z0, // 1
            front1[0], front1[1], z1, // 2
            front0[0], front0[1], z1, // 3

            // mặt sau dưới
            back0Lower[0], back0Lower[1], z0, // 4
            back1Lower[0], back1Lower[1], z0, // 5

            // mặt sau trên
            back1Upper[0], back1Upper[1], z1, // 6
            back0Upper[0], back0Upper[1], z1  // 7
        ];

        const faces = [
            // mặt trước
            0, 1, 2, 0, 2, 3,
            // mặt sau (hình thang nghiêng)
            5, 4, 7, 5, 7, 6,
            // cạnh trái (slope)
            0, 3, 7, 0, 7, 4,
            // cạnh phải (slope)
            1, 2, 6, 1, 6, 5,
            // đáy
            4, 5, 1, 4, 1, 0,
            // đỉnh
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#d2691e" }, // màu gạch
                    edges: { type: "solid", color: "#333", size: 0.1 }
                }]
            },
            attributes: { type: "trapezoid-brick-outward-slope" }
        });
    }
    function createTrapezoidBrickOutwardSlope1(
        wallPolygon,
        startingPoint,   // điểm bắt đầu (dưới-trái)
        width,           // chiều rộng viên gạch
        height,          // chiều cao viên gạch
        baseZ,           // cao độ đáy
        depthUpper = 0.8,// độ dày mặt trên
        depthLower = 1   // độ dày mặt dưới
    ) {
        const orientation = getPolygonOrientation(wallPolygon) + 180;
        const normalOrientation = orientation + 90;

        // Mặt trước (luôn nằm trên tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        const front0 = p0;
        const front1 = p1;

        // Mặt sau dưới (đáy dưới dày hơn)
        const back0Lower = findNewPoint(front0, normalOrientation, -depthLower);
        const back1Lower = findNewPoint(front1, normalOrientation, -depthLower);

        // Mặt sau trên (đỉnh trên mỏng hơn)
        const back0Upper = findNewPoint(front0, normalOrientation, -depthUpper);
        const back1Upper = findNewPoint(front1, normalOrientation, -depthUpper);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 8 đỉnh: 4 cho mặt trước, 2 cho mặt sau dưới, 2 cho mặt sau trên
        const positions = [
            // mặt trước
            front0[0], front0[1], z0, // 0
            front1[0], front1[1], z0, // 1
            front1[0], front1[1], z1, // 2
            front0[0], front0[1], z1, // 3

            // mặt sau dưới
            back0Lower[0], back0Lower[1], z0, // 4
            back1Lower[0], back1Lower[1], z0, // 5

            // mặt sau trên
            back1Upper[0], back1Upper[1], z1, // 6
            back0Upper[0], back0Upper[1], z1  // 7
        ];

        const faces = [
            // mặt trước
            0, 1, 2, 0, 2, 3,
            // mặt sau (hình thang nghiêng)
            5, 4, 7, 5, 7, 6,
            // cạnh trái (slope)
            0, 3, 7, 0, 7, 4,
            // cạnh phải (slope)
            1, 2, 6, 1, 6, 5,
            // đáy
            4, 5, 1, 4, 1, 0,
            // đỉnh
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#d2691e" }, // màu gạch
                    edges: { type: "solid", color: "#333", size: 0.1 }
                }]
            },
            attributes: { type: "trapezoid-brick-outward-slope" }
        });
    }

    function createTrapezoidBrickOutwardSlope2(
        wallPolygon,
        startingPoint,   // điểm bắt đầu (dưới-trái)
        width,           // chiều rộng viên gạch
        height,          // chiều cao viên gạch
        baseZ,           // cao độ đáy
        depthUpper = 0.8,// độ dày mặt trên
        depthLower = 1   // độ dày mặt dưới
    ) {
        const orientation = getPolygonOrientation(wallPolygon);
        const normalOrientation = orientation + 90;

        // Mặt trước (luôn nằm trên tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        const front0 = p0;
        const front1 = p1;

        // Mặt sau dưới (đáy dưới dày hơn)
        const back0Lower = findNewPoint(front0, normalOrientation, -depthLower);
        const back1Lower = findNewPoint(front1, normalOrientation, -depthLower);

        // Mặt sau trên (đỉnh trên mỏng hơn)
        const back0Upper = findNewPoint(front0, normalOrientation, -depthUpper);
        const back1Upper = findNewPoint(front1, normalOrientation, -depthUpper);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 8 đỉnh: 4 cho mặt trước, 2 cho mặt sau dưới, 2 cho mặt sau trên
        const positions = [
            // mặt trước
            front0[0], front0[1], z0, // 0
            front1[0], front1[1], z0, // 1
            front1[0], front1[1], z1, // 2
            front0[0], front0[1], z1, // 3

            // mặt sau dưới
            back0Lower[0], back0Lower[1], z0, // 4
            back1Lower[0], back1Lower[1], z0, // 5

            // mặt sau trên
            back1Upper[0], back1Upper[1], z1, // 6
            back0Upper[0], back0Upper[1], z1  // 7
        ];

        const faces = [
            // mặt trước
            0, 1, 2, 0, 2, 3,
            // mặt sau (hình thang nghiêng)
            5, 4, 7, 5, 7, 6,
            // cạnh trái (slope)
            0, 3, 7, 0, 7, 4,
            // cạnh phải (slope)
            1, 2, 6, 1, 6, 5,
            // đáy
            4, 5, 1, 4, 1, 0,
            // đỉnh
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#d2691e" }, // màu gạch
                    edges: { type: "solid", color: "#333", size: 0.1 }
                }]
            },
            attributes: { type: "trapezoid-brick-outward-slope" }
        });
    }

    function createTrapezoidBrickOutwardSlope3(
        wallPolygon,
        startingPoint,   // điểm bắt đầu (dưới-trái)
        width,           // chiều rộng viên gạch
        height,          // chiều cao viên gạch
        baseZ,           // cao độ đáy
        depthUpper = 0.8,// độ dày mặt trên
        depthLower = 1   // độ dày mặt dưới
    ) {
        const orientation = getPolygonOrientation(wallPolygon) + 180;
        const normalOrientation = orientation - 90;

        // Mặt trước (luôn nằm trên tường)
        const p0 = startingPoint;
        const p1 = findNewPoint(p0, orientation, width);

        const front0 = p0;
        const front1 = p1;

        // Mặt sau dưới (đáy dưới dày hơn)
        const back0Lower = findNewPoint(front0, normalOrientation, -depthLower);
        const back1Lower = findNewPoint(front1, normalOrientation, -depthLower);

        // Mặt sau trên (đỉnh trên mỏng hơn)
        const back0Upper = findNewPoint(front0, normalOrientation, -depthUpper);
        const back1Upper = findNewPoint(front1, normalOrientation, -depthUpper);

        const z0 = baseZ;
        const z1 = baseZ + height;

        // 8 đỉnh: 4 cho mặt trước, 2 cho mặt sau dưới, 2 cho mặt sau trên
        const positions = [
            // mặt trước
            front0[0], front0[1], z0, // 0
            front1[0], front1[1], z0, // 1
            front1[0], front1[1], z1, // 2
            front0[0], front0[1], z1, // 3

            // mặt sau dưới
            back0Lower[0], back0Lower[1], z0, // 4
            back1Lower[0], back1Lower[1], z0, // 5

            // mặt sau trên
            back1Upper[0], back1Upper[1], z1, // 6
            back0Upper[0], back0Upper[1], z1  // 7
        ];

        const faces = [
            // mặt trước
            0, 1, 2, 0, 2, 3,
            // mặt sau (hình thang nghiêng)
            5, 4, 7, 5, 7, 6,
            // cạnh trái (slope)
            0, 3, 7, 0, 7, 4,
            // cạnh phải (slope)
            1, 2, 6, 1, 6, 5,
            // đáy
            4, 5, 1, 4, 1, 0,
            // đỉnh
            3, 2, 6, 3, 6, 7
        ];

        const mesh = new Mesh({
            spatialReference: { wkid: 4326 },
            vertexAttributes: { position: positions },
            components: [{ faces }]
        });

        return new Graphic({
            geometry: mesh,
            symbol: {
                type: "mesh-3d",
                symbolLayers: [{
                    type: "fill",
                    material: { color: "#d2691e" }, // màu gạch
                    edges: { type: "solid", color: "#333", size: 0.1 }
                }]
            },
            attributes: { type: "trapezoid-brick-outward-slope" }
        });
    }

    // Ốp gạch vào chân tháp 
    function opGachChanThap(graphicsLayer, wall) {
        var brick = null;
        for (var i = 0; i < 26; i++) {
            if (i < 7 && i != 0) {
                brick = createBrickGraphic(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.8);
                graphicsLayer.add(brick);
                brick = createBrickGraphic1(wall.attributes.polygon, wall.attributes.line[1], 1.5, 1, wall.attributes.baseZ + i, 0.8);
                graphicsLayer.add(brick)
            } else if ([0, 7, 13, 18, 23].includes(i)) {
                brick = createTrapezoidBrickOutwardSlope(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.8, 1);
                graphicsLayer.add(brick);
                brick = createTrapezoidBrickOutwardSlope1(wall.attributes.polygon, wall.attributes.line[1], 1.5, 1, wall.attributes.baseZ + i, 0.8, 1);
                graphicsLayer.add(brick);
            } else if (i > 8 && i < 18) {
                brick = createBrickGraphic(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.6);
                graphicsLayer.add(brick);
                brick = createBrickGraphic1(wall.attributes.polygon, wall.attributes.line[1], 1.5, 1, wall.attributes.baseZ + i, 0.6);
                graphicsLayer.add(brick);
            } else {
                brick = createBrickGraphic(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.5);
                graphicsLayer.add(brick);
                brick = createBrickGraphic1(wall.attributes.polygon, wall.attributes.line[1], 1.5, 1, wall.attributes.baseZ + i, 0.5);
                graphicsLayer.add(brick);
            }
        }
    }
    function opGachChanThap1(graphicsLayer, wall) {
        var brick = null;
        for (var i = 0; i < 26; i++) {
            if (i < 7 && i != 0) {
                brick = createBrickGraphic2(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.8);
                graphicsLayer.add(brick);
                brick = createBrickGraphic3(wall.attributes.polygon, wall.attributes.line[1], 1.5, 1, wall.attributes.baseZ + i, 0.8);
                graphicsLayer.add(brick)
            } else if ([0, 7, 13, 18, 23].includes(i)) {
                brick = createTrapezoidBrickOutwardSlope2(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.8, 1);
                graphicsLayer.add(brick);
                brick = createTrapezoidBrickOutwardSlope3(wall.attributes.polygon, wall.attributes.line[1], 1.5, 1, wall.attributes.baseZ + i, 0.8, 1);
                graphicsLayer.add(brick);
            } else if (i > 8 && i < 18) {
                brick = createBrickGraphic2(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.6);
                graphicsLayer.add(brick);
                brick = createBrickGraphic3(wall.attributes.polygon, wall.attributes.line[1], 1.5, 1, wall.attributes.baseZ + i, 0.6);
                graphicsLayer.add(brick);
            } else {
                brick = createBrickGraphic2(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.5);
                graphicsLayer.add(brick);
                brick = createBrickGraphic3(wall.attributes.polygon, wall.attributes.line[1], 1.5, 1, wall.attributes.baseZ + i, 0.5);
                graphicsLayer.add(brick);
            }
        }
    }
    function opGachChanThap2(graphicsLayer, wall) {
        var brick = null;
        for (var i = 0; i < 26; i++) {
            if (i < 7 && i != 0) {
                brick = createBrickGraphic(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.8);
                graphicsLayer.add(brick);
            } else if ([0, 7, 13, 18, 23].includes(i)) {
                brick = createTrapezoidBrickOutwardSlope(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.8, 1);
                graphicsLayer.add(brick);
            } else if (i > 8 && i < 18) {
                brick = createBrickGraphic(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.6);
                graphicsLayer.add(brick);
            } else {
                brick = createBrickGraphic(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.5);
                graphicsLayer.add(brick);
            }
        }
    }
    function opGachChanThap3(graphicsLayer, wall) {
        var brick = null;
        for (var i = 0; i < 26; i++) {
            if (i < 7 && i != 0) {
                brick = createBrickGraphic2(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.8);
                graphicsLayer.add(brick);
            } else if ([0, 7, 13, 18, 23].includes(i)) {
                brick = createTrapezoidBrickOutwardSlope2(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.8, 1);
                graphicsLayer.add(brick);
            } else if (i > 8 && i < 18) {
                brick = createBrickGraphic2(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.6);
                graphicsLayer.add(brick);
            } else {
                brick = createBrickGraphic2(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.5);
                graphicsLayer.add(brick);
            }
        }
    }

    function opGachDinhThap(graphicsLayer, wall) {
        var brick = null;
        for (var i = 0; i < 12; i++) {
            if (i % 2 == 0) {
                brick = createBrickGraphic4(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick);
                brick = createBrickGraphic5(wall.attributes.polygon, wall.attributes.line[1], 1.5, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick)
            } else {
                brick = createBrickGraphic4(wall.attributes.polygon, wall.attributes.line[0], 1.3, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick);
                brick = createBrickGraphic5(wall.attributes.polygon, wall.attributes.line[1], 1.3, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick);
            }
        }
    }

    function opGachDinhThap1(graphicsLayer, wall) {
        var brick = null;
        for (var i = 0; i < 12; i++) {
            if (i % 2 == 0) {
                brick = createBrickGraphic4(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick);
                brick = createBrickGraphic6(wall.attributes.polygon, wall.attributes.line[1], 1.5, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick)
            } else {
                brick = createBrickGraphic4(wall.attributes.polygon, wall.attributes.line[0], 1.3, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick);
                brick = createBrickGraphic6(wall.attributes.polygon, wall.attributes.line[1], 1.3, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick);
            }
        }
    }
    function opGachDinhThap2(graphicsLayer, wall) {
        var brick = null;
        for (var i = 0; i < 12; i++) {
            if (i % 2 == 0) {
                brick = createBrickGraphic7(wall.attributes.polygon, wall.attributes.line[0], 1.5, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick);
                brick = createBrickGraphic6(wall.attributes.polygon, wall.attributes.line[1], 1.5, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick)
            } else {
                brick = createBrickGraphic7(wall.attributes.polygon, wall.attributes.line[0], 1.3, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick);
                brick = createBrickGraphic6(wall.attributes.polygon, wall.attributes.line[1], 1.3, 1, wall.attributes.baseZ + i, 0.1);
                graphicsLayer.add(brick);
            }
        }
    }

    window.opGachChanThap = opGachChanThap;
    window.opGachChanThap1 = opGachChanThap1;
    window.opGachChanThap2 = opGachChanThap2;
    window.opGachChanThap3 = opGachChanThap3;
    window.opGachDinhThap = opGachDinhThap;
    window.opGachDinhThap1 = opGachDinhThap1;
    window.opGachDinhThap2 = opGachDinhThap2;
    window.createTrapezoidBrickOutwardSlope = createTrapezoidBrickOutwardSlope
    window.createTrapezoidBrickOutwardSlope1 = createTrapezoidBrickOutwardSlope1
    window.createTrapezoidBrickOutwardSlope2 = createTrapezoidBrickOutwardSlope2
    window.createTrapezoidBrickOutwardSlope3 = createTrapezoidBrickOutwardSlope3
});
