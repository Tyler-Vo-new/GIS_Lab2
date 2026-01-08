require([
    "esri/Graphic",
    "esri/geometry/Mesh"
], function (Graphic, Mesh) {

    /**
     * Tạo một BOX mesh đơn giản (hình hộp 3D)
     * Tương tự createWindowMesh nhưng đơn giản hóa
     */
    function createBox(p0, p1, z0, z1, depth, normalOrientation, color, edgeColor = "white", edgeSize = 0.5, doorId = null) {
        const front0 = p0;
        const front1 = p1;
        const back0 = findNewPoint(front0, normalOrientation, depth);
        const back1 = findNewPoint(front1, normalOrientation, depth);

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

        const faces = [
            0, 1, 2, 0, 2, 3,  // front
            5, 4, 7, 5, 7, 6,  // back
            4, 0, 3, 4, 3, 7,  // left
            1, 5, 6, 1, 6, 2,  // right
            4, 5, 1, 4, 1, 0,  // bottom
            3, 2, 6, 3, 6, 7   // top
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
                    material: { color: color },
                    edges: {
                        type: "solid",
                        color: edgeColor,
                        size: edgeSize
                    }
                }]
            },
            attributes: {
                type: "door-part",
                doorId: doorId
            }
        });
    }

    /**
     * Tạo polygon mesh phẳng với 2 mặt (double-sided)
     */
    function createFlatPolygonMesh(rings, color, edgeColor = [26, 26, 26], edgeSize = 0.5, doorId = null) {
        const positions = [];
        const faces = [];
        
        // Thêm vertices
        rings[0].forEach(point => {
            positions.push(point[0], point[1], point[2]);
        });
        
        const numVertices = rings[0].length - 1; // bỏ điểm cuối trùng điểm đầu
        
        // Tạo faces (triangulate polygon đơn giản - fan triangulation)
        for (let i = 1; i < numVertices - 1; i++) {
            // Front face (CCW)
            faces.push(0, i, i + 1);
            // Back face (CW) - để render cả 2 mặt
            faces.push(0, i + 1, i);
        }
        
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
                    material: { 
                        color: color,
                        cullFace: "none"  // QUAN TRỌNG: render cả 2 mặt
                    },
                    edges: {
                        type: "solid",
                        color: edgeColor,
                        size: edgeSize
                    }
                }]
            },
            attributes: {
                type: "door-part",
                doorId: doorId
            }
        });
    }

    /**
     * Tạo arch frame merged thành 1 mesh duy nhất (optimize performance)
     */
    function createMergedArchFrame(
        centerPoint, orientation, normalOrientation,
        radius, outerRadius, baseZ, rectHeight,
        segments, frameDepth, frameColor, frameEdgeColor, doorId
    ) {
        const positions = [];
        const faces = [];
        let vertexIndex = 0;

        for (let i = 0; i < segments; i++) {
            const angle1 = Math.PI * (i / segments);
            const angle2 = Math.PI * ((i + 1) / segments);

            const x1in = radius * Math.cos(angle1);
            const y1in = radius * Math.sin(angle1);
            const x2in = radius * Math.cos(angle2);
            const y2in = radius * Math.sin(angle2);

            const x1out = outerRadius * Math.cos(angle1);
            const y1out = outerRadius * Math.sin(angle1);
            const x2out = outerRadius * Math.cos(angle2);
            const y2out = outerRadius * Math.sin(angle2);

            const p1in = findNewPoint(centerPoint, orientation, x1in);
            const p2in = findNewPoint(centerPoint, orientation, x2in);
            const p1out = findNewPoint(centerPoint, orientation, x1out);
            const p2out = findNewPoint(centerPoint, orientation, x2out);

            const z1in = baseZ + rectHeight + y1in;
            const z2in = baseZ + rectHeight + y2in;
            const z1out = baseZ + rectHeight + y1out;
            const z2out = baseZ + rectHeight + y2out;

            const back1in = findNewPoint(p1in, normalOrientation, frameDepth);
            const back2in = findNewPoint(p2in, normalOrientation, frameDepth);
            const back1out = findNewPoint(p1out, normalOrientation, frameDepth);
            const back2out = findNewPoint(p2out, normalOrientation, frameDepth);

            // 8 vertices cho mỗi segment
            positions.push(
                p1in[0], p1in[1], z1in,
                p1out[0], p1out[1], z1out,
                p2out[0], p2out[1], z2out,
                p2in[0], p2in[1], z2in,
                back1in[0], back1in[1], z1in,
                back1out[0], back1out[1], z1out,
                back2out[0], back2out[1], z2out,
                back2in[0], back2in[1], z2in
            );

            const base = vertexIndex;
            faces.push(
                base+0, base+1, base+2, base+0, base+2, base+3,  // front
                base+5, base+4, base+7, base+5, base+7, base+6,  // back
                base+4, base+0, base+3, base+4, base+3, base+7,  // inner
                base+1, base+5, base+6, base+1, base+6, base+2,  // outer
                base+4, base+5, base+1, base+4, base+1, base+0,  // bottom
                base+3, base+2, base+6, base+3, base+6, base+7   // top
            );

            vertexIndex += 8;
        }

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
                    material: { color: frameColor },
                    edges: {
                        type: "solid",
                        color: frameEdgeColor,
                        size: 0.15
                    }
                }]
            },
            attributes: {
                type: "door-part",
                doorId: doorId
            }
        });
    }

    /**
     * Tạo cửa vòm Roman (nửa hình tròn) cho Nhà thờ Đức Bà
     * Theo đúng hình mẫu: có khung viền, vòm tròn, và cửa đen bên trong
     */
    function createArchedDoor(
        wallPolygon,
        leftPad,
        width,
        rectHeight,
        baseZ = 0,
        depth = 0.5,
        frameThickness = 0.3,
        wallId = null,  // THÊM THAM SỐ wallId
        doorId = null   // THÊM doorId để nhận diện door khi click
    ) {
        const graphics = [];
        const orientation = getPolygonOrientation(wallPolygon);
        const normalOrientation = orientation + 90;

        const wallBL = wallPolygon[0];
        const doorLeft = findNewPoint(wallBL, orientation, leftPad);
        const doorRight = findNewPoint(doorLeft, orientation, width);
        
        const radius = width / 2;
        const archHeight = radius;

        let frameDepth;
        if (wallId === "wall-001" || wallId === "wall-005" || wallId === "wall-006") {
            frameDepth = 0.3;
        } else if (wallId === "wall-002") {
            frameDepth = -0.3;
        } else {
            frameDepth = 0.3;
        }

        const frameColor = "#d4c5a9";
        const frameEdgeColor = "#f0e6d2"; // Sáng hơn
        const frameWidth = frameThickness; // Khung dày đồng nhất

        // Khung DƯỚI (ngưỡng)
        const frameBottomLeft = findNewPoint(doorLeft, orientation, -frameWidth);
        const frameBottomRight = findNewPoint(doorRight, orientation, frameWidth);
        graphics.push(createBox(
            frameBottomLeft, frameBottomRight,
            baseZ - frameWidth * 0.5, baseZ,
            frameDepth,
            normalOrientation,
            frameColor, frameEdgeColor, 0.15,
            doorId
        ));

        // Khung TRÁI (viền mỏng, CHỈ ĐẾN NƠI VÒNG BẮT ĐẦU)
        graphics.push(createBox(
            frameBottomLeft, doorLeft,
            baseZ, baseZ + rectHeight,  // Dừng ở rectHeight, không vượt lên vòm
            frameDepth,
            normalOrientation,
            frameColor, frameEdgeColor, 0.15,
            doorId
        ));

        // Khung PHẢI (viền mỏng, CHỈ ĐẾN NƠI VÒNG BẮT ĐẦU)
        graphics.push(createBox(
            doorRight, frameBottomRight,
            baseZ, baseZ + rectHeight,  // Dừng ở rectHeight, không vượt lên vòm
            frameDepth,
            normalOrientation,
            frameColor, frameEdgeColor, 0.15,
            doorId
        ));

        // === TẠO ARCH POINTS TRƯỚC (cần cho cả wall-007 và walls khác) ===
        const centerDoor = findNewPoint(doorLeft, orientation, width / 2);
        const archSegments = 50;  // Tăng từ 30 lên 50 để phủ kín hơn
        
        const archPoints = [];
        for (let i = 0; i <= archSegments; i++) {
            const angle = Math.PI * (i / archSegments);
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const p = findNewPoint(centerDoor, orientation, x);
            const z = baseZ + rectHeight + y;
            archPoints.push([p[0], p[1], z]);
        }

        const fillDepth = frameDepth;
        
        const rectMesh = createBox(
            doorLeft, doorRight,
            baseZ, baseZ + rectHeight + 0.1,
            fillDepth, normalOrientation,
            [10, 10, 10], [26, 26, 26], 0.5, doorId
        );
        graphics.push(rectMesh);
        
        const archFillRings = [[
            [doorLeft[0], doorLeft[1], baseZ + rectHeight],
            ...archPoints,
            [doorRight[0], doorRight[1], baseZ + rectHeight],
            [doorLeft[0], doorLeft[1], baseZ + rectHeight]
        ]];
        
        // Offset toàn bộ ra ngoài
        const offsetArchRings = archFillRings[0].map(p => {
            const offsetP = findNewPoint([p[0], p[1]], normalOrientation, fillDepth);
            return [offsetP[0], offsetP[1], p[2]];
        });
        
        const archFillMesh = createFlatPolygonMesh(
            [offsetArchRings],
            [10, 10, 10],
            [26, 26, 26],
            0.5,
            doorId
        );
        graphics.push(archFillMesh);

        const outerRadius = radius + frameThickness;
        const archFrameSegments = 60;
        
        const mergedArchFrame = createMergedArchFrame(
            centerDoor, orientation, normalOrientation,
            radius, outerRadius, baseZ, rectHeight,
            archFrameSegments, frameDepth, frameColor, frameEdgeColor, doorId
        );
        graphics.push(mergedArchFrame);

        return graphics;
    }

    /**
     * Tính chiều dài tường
     */
    function getWallLength(polygon) {
        const p0 = polygon[0];
        const p1 = polygon[1];
        const dx = p1[0] - p0[0];
        const dy = p1[1] - p0[1];
        const lengthInDegrees = Math.sqrt(dx * dx + dy * dy);
        return lengthInDegrees * 111000;
    }

    /**
     * Tạo cửa và thêm vào graphicsLayer
     */
    function addDoor(graphicsLayer, wallPolygon, width, height, wallId, doorId) {
        const wallLength = getWallLength(wallPolygon);
        const leftPad = (wallLength - width) / 2;
        const doors = createArchedDoor(
            wallPolygon, leftPad, width, height,
            9, 0.5, 0.2, wallId, doorId
        );
        doors.forEach(g => graphicsLayer.add(g));
    }

    /**
     * Thêm 3 cửa chính
     */
    function addMainDoors(graphicsLayer, walls) {
        addDoor(graphicsLayer, walls.wall001, 3.52, 5.5, "wall-001", "main-door-left");
        
        const wall5Length = getWallLength(walls.wall005);
        const centerPad = (wall5Length - 4.62) / 2;
        const centerDoors = createArchedDoor(
            walls.wall005, centerPad, 4.62, 6.05,
            9, 0.6, 0.25, "wall-005", "main-door-center"
        );
        centerDoors.forEach(g => graphicsLayer.add(g));
        
        addDoor(graphicsLayer, walls.wall006, 3.52, 5.5, "wall-006", "main-door-right");
    }

    /**
     * Thêm 2 cửa bên hông
     */
    function addSideDoors(graphicsLayer, walls) {
        if (walls.wall002) {
            addDoor(graphicsLayer, walls.wall002, 3.52, 5.5, "wall-002", "side-door-left");
        }
        if (walls.wall007) {
            addDoor(graphicsLayer, walls.wall007, 3.52, 5.5, "wall-007", "side-door-right");
        }
    }

    // Export functions
    window.createArchedDoor = createArchedDoor;
    window.addMainDoors = addMainDoors;
    window.addSideDoors = addSideDoors;
});
