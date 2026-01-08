require([
    "esri/Graphic",
    "esri/geometry/Mesh"
], function (Graphic, Mesh) {

    /**
     * Tạo hình hộp 3D (BOX) cho các thành phần cửa
     * @param {Array} p0 - Điểm đầu [lon, lat]
     * @param {Array} p1 - Điểm cuối [lon, lat]
     * @param {number} z0 - Độ cao đáy
     * @param {number} z1 - Độ cao đỉnh
     * @param {number} depth - Độ sâu (nhô ra/vào)
     * @param {number} normalOrientation - Hướng pháp tuyến
     * @param {Array} color - Màu [R,G,B]
     * @param {Array} edgeColor - Màu viền
     * @param {number} edgeSize - Độ dày viền
     * @param {string} doorId - ID cửa
     * @returns {Graphic} Graphic hình hộp
     */
    function createBox(p0, p1, z0, z1, depth, normalOrientation, color, edgeColor = "white", edgeSize = 0.5, doorId = null) {
        const front0 = p0;
        const front1 = p1;
        const back0 = findNewPoint(front0, normalOrientation, depth);
        const back1 = findNewPoint(front1, normalOrientation, depth);

        const positions = [
            // Mặt trước
            front0[0], front0[1], z0,
            front1[0], front1[1], z0,
            front1[0], front1[1], z1,
            front0[0], front0[1], z1,
            // Mặt sau
            back0[0], back0[1], z0,
            back1[0], back1[1], z0,
            back1[0], back1[1], z1,
            back0[0], back0[1], z1
        ];

        const faces = [
            0, 1, 2, 0, 2, 3,  // mặt trước
            5, 4, 7, 5, 7, 6,  // mặt sau
            4, 0, 3, 4, 3, 7,  // mặt trái
            1, 5, 6, 1, 6, 2,  // mặt phải
            4, 5, 1, 4, 1, 0,  // mặt dưới
            3, 2, 6, 3, 6, 7   // mặt trên
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
     * Tạo mặt phẳng đa giác (polygon mesh) hiển thị 2 mặt
     * Dùng cho phần vòm cung của cửa
     * @param {Array} rings - Mảng các điểm tạo thành polygon
     * @param {Array} color - Màu [R,G,B]
     * @param {Array} edgeColor - Màu viền [R,G,B]
     * @param {number} edgeSize - Độ dày viền
     * @param {string} doorId - ID cửa
     * @returns {Graphic} Graphic polygon phẳng
     */
    function createFlatPolygonMesh(rings, color, edgeColor = [26, 26, 26], edgeSize = 0.5, doorId = null) {
        const positions = [];
        const faces = [];
        
        rings[0].forEach(point => {
            positions.push(point[0], point[1], point[2]);
        });
        
        const numVertices = rings[0].length - 1;
        
        // Chia polygon thành các tam giác (fan triangulation)
        for (let i = 1; i < numVertices - 1; i++) {
            faces.push(0, i, i + 1);       // mặt trước
            faces.push(0, i + 1, i);       // mặt sau (render 2 mặt)
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
                        cullFace: "none"  // Hiển thị cả 2 mặt
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
     * Tạo khung vòm cung (merged thành 1 mesh duy nhất để tối ưu hiệu suất)
     * @param {Array} centerPoint - Tâm vòng cung
     * @param {number} orientation - Hướng tường
     * @param {number} normalOrientation - Hướng pháp tuyến
     * @param {number} radius - Bán kính trong
     * @param {number} outerRadius - Bán kính ngoài
     * @param {number} baseZ - Độ cao đáy
     * @param {number} rectHeight - Chiều cao phần chữ nhật
     * @param {number} segments - Số đoạn chia vòng cung
     * @param {number} frameDepth - Độ sâu khung
     * @param {string} frameColor - Màu khung
     * @param {string} frameEdgeColor - Màu viền khung
     * @param {string} doorId - ID cửa
     * @returns {Graphic} Graphic khung vòm
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

            // 8 đỉnh cho mỗi phân đoạn
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
                base+0, base+1, base+2, base+0, base+2, base+3,  // mặt trước
                base+5, base+4, base+7, base+5, base+7, base+6,  // mặt sau
                base+4, base+0, base+3, base+4, base+3, base+7,  // mặt trong
                base+1, base+5, base+6, base+1, base+6, base+2,  // mặt ngoài
                base+4, base+5, base+1, base+4, base+1, base+0,  // mặt dưới
                base+3, base+2, base+6, base+3, base+6, base+7   // mặt trên
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
     * Tạo cửa vòm kiểu La Mã (Roman arch door) cho Nhà thờ Đức Bà
     * Cửa có khung viền màu vàng, vòm bán nguyệt, và phần lấp màu xám nhạt bên trong
     * @param {Array} wallPolygon - Polygon tường
     * @param {number} leftPad - Khoảng cách từ điểm đầu tường đến cửa
     * @param {number} width - Chiều rộng cửa
     * @param {number} rectHeight - Chiều cao phần chữ nhật
     * @param {number} baseZ - Độ cao đáy cửa (mặt đất)
     * @param {number} depth - Độ sâu cửa (mặc định 0.5)
     * @param {number} frameThickness - Độ dày khung (mặc định 0.3)
     * @param {string} wallId - ID tường (để xác định hướng)
     * @param {string} doorId - ID cửa (để nhận diện khi click)
     * @returns {Array} Mảng graphics tạo thành cửa
     */
    function createArchedDoor(
        wallPolygon,
        leftPad,
        width,
        rectHeight,
        baseZ = 0,
        depth = 0.5,
        frameThickness = 0.40,
        wallId = null,
        doorId = null
    ) {
        const graphics = [];
        const orientation = getPolygonOrientation(wallPolygon);
        const normalOrientation = orientation + 90;

        const wallBL = wallPolygon[0];
        const doorLeft = findNewPoint(wallBL, orientation, leftPad);
        const doorRight = findNewPoint(doorLeft, orientation, width);
        
        const radius = width / 2;

        // Xác định độ sâu khung theo từng tường
        let frameDepth;
        if (wallId === "wall-001" || wallId === "wall-005" || wallId === "wall-006") {
            frameDepth = 0.3;  // Nhô ra ngoài
        } else if (wallId === "wall-002") {
            frameDepth = -0.3; // Nhô vào trong
        } else {
            frameDepth = 0.3;
        }

        const frameColor = "#ffffff";           // Màu trắng cho khung trong
        const frameEdgeColor = "#ffffff";       // Màu viền trắng
        const frameWidth = frameThickness;
        
        // Lớp viền ngoài (dày gấp đôi, màu trắng vàng nhạt)
        const outerFrameThickness = frameThickness * 2;
        const outerFrameColor = "#fffef0";      // Màu trắng vàng nhạt
        const outerFrameEdgeColor = "#fffef0";

        // Tính toán vị trí khung trong và ngoài
        const frameBottomLeft = findNewPoint(doorLeft, orientation, -frameWidth);
        const frameBottomRight = findNewPoint(doorRight, orientation, frameWidth);
        const outerFrameBottomLeft = findNewPoint(doorLeft, orientation, -(frameWidth + outerFrameThickness));
        const outerFrameBottomRight = findNewPoint(doorRight, orientation, (frameWidth + outerFrameThickness));

        // === LỚP VIỀN NGOÀI (Outer frame) ===
        // 1a. Khung ngoài dưới (ngưỡng cửa - lớp ngoài)
        graphics.push(createBox(
            outerFrameBottomLeft, frameBottomLeft,
            baseZ - frameWidth * 0.5 - outerFrameThickness * 0.5, baseZ,
            frameDepth,
            normalOrientation,
            outerFrameColor, outerFrameEdgeColor, 0.1,
            doorId
        ));
        graphics.push(createBox(
            frameBottomRight, outerFrameBottomRight,
            baseZ - frameWidth * 0.5 - outerFrameThickness * 0.5, baseZ,
            frameDepth,
            normalOrientation,
            outerFrameColor, outerFrameEdgeColor, 0.1,
            doorId
        ));
        
        // 1b. Khung ngoài trái (lớp ngoài)
        graphics.push(createBox(
            outerFrameBottomLeft, frameBottomLeft,
            baseZ, baseZ + rectHeight,
            frameDepth,
            normalOrientation,
            outerFrameColor, outerFrameEdgeColor, 0.1,
            doorId
        ));
        
        // 1c. Khung ngoài phải (lớp ngoài)
        graphics.push(createBox(
            frameBottomRight, outerFrameBottomRight,
            baseZ, baseZ + rectHeight,
            frameDepth,
            normalOrientation,
            outerFrameColor, outerFrameEdgeColor, 0.1,
            doorId
        ));

        // === LỚP VIỀN TRONG (Inner frame - trắng) ===
        // 2. Khung dưới (ngưỡng cửa)
        graphics.push(createBox(
            frameBottomLeft, frameBottomRight,
            baseZ - frameWidth * 0.5, baseZ,
            frameDepth,
            normalOrientation,
            frameColor, frameEdgeColor, 0.15,
            doorId
        ));

        // 3. Khung trái (dừng ở vị trí vòm bắt đầu)
        graphics.push(createBox(
            frameBottomLeft, doorLeft,
            baseZ, baseZ + rectHeight,
            frameDepth,
            normalOrientation,
            frameColor, frameEdgeColor, 0.15,
            doorId
        ));

        // 4. Khung phải (dừng ở vị trí vòm bắt đầu)
        graphics.push(createBox(
            doorRight, frameBottomRight,
            baseZ, baseZ + rectHeight,
            frameDepth,
            normalOrientation,
            frameColor, frameEdgeColor, 0.15,
            doorId
        ));

        // 4. Tạo điểm vòm cung
        const centerDoor = findNewPoint(doorLeft, orientation, width / 2);
        const archSegments = 50;
        
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
        
        // 5. Phần lấp chữ nhật (màu xám đậm)
        graphics.push(createBox(
            doorLeft, doorRight,
            baseZ, baseZ + rectHeight + 0.1,
            fillDepth, normalOrientation,
            [120, 120, 120], [120, 120, 120], 0, doorId
        ));
        
        // 6. Phần lấp vòm cung (màu xám đậm)
        const archFillRings = [[
            [doorLeft[0], doorLeft[1], baseZ + rectHeight],
            ...archPoints,
            [doorRight[0], doorRight[1], baseZ + rectHeight],
            [doorLeft[0], doorLeft[1], baseZ + rectHeight]
        ]];
        
        const offsetArchRings = archFillRings[0].map(p => {
            const offsetP = findNewPoint([p[0], p[1]], normalOrientation, fillDepth);
            return [offsetP[0], offsetP[1], p[2]];
        });
        
        graphics.push(createFlatPolygonMesh(
            [offsetArchRings],
            [120, 120, 120],
            [120, 120, 120],
            0,
            doorId
        ));

        // 8. Khung vòm cung
        const archFrameSegments = 60;
        const outerArchOuterRadius = radius + frameThickness + outerFrameThickness;
        const outerArchInnerRadius = radius + frameThickness;
        
        // Lớp ngoài - màu trắng vàng nhạt
        graphics.push(createMergedArchFrame(
            centerDoor, orientation, normalOrientation,
            outerArchInnerRadius, outerArchOuterRadius, baseZ, rectHeight,
            archFrameSegments, frameDepth, outerFrameColor, outerFrameEdgeColor, doorId
        ));

        // Lớp trong - màu trắng
        const outerRadius = radius + frameThickness;
        
        graphics.push(createMergedArchFrame(
            centerDoor, orientation, normalOrientation,
            radius, outerRadius, baseZ, rectHeight,
            archFrameSegments, frameDepth, frameColor, frameEdgeColor, doorId
        ));

        return graphics;
    }

    /**
     * Tính chiều dài tường (đơn vị: mét)
     */
    function getWallLength(polygon) {
        const p0 = polygon[0];
        const p1 = polygon[1];
        const dx = p1[0] - p0[0];
        const dy = p1[1] - p0[1];
        const lengthInDegrees = Math.sqrt(dx * dx + dy * dy);
        return lengthInDegrees * 111000; // Chuyển độ sang mét
    }

    /**
     * Thêm 1 cửa vào layer (helper function)
     */
    function addDoor(graphicsLayer, wallPolygon, width, height, wallId, doorId) {
        const wallLength = getWallLength(wallPolygon);
        const leftPad = (wallLength - width) / 2; // Căn giữa tường
        const doors = createArchedDoor(
            wallPolygon, leftPad, width, height,
            9, 0.5, 0.26, wallId, doorId
        );
        doors.forEach(g => graphicsLayer.add(g));
    }

    /**
     * Thêm 3 cửa chính phía trước tháp chuông
     */
    function addMainDoors(graphicsLayer, walls) {
        // Cửa trái
        addDoor(graphicsLayer, walls.wall001, 3.52, 5.5, "wall-001", "main-door-left");
        
        // Cửa giữa (lớn hơn)
        const wall5Length = getWallLength(walls.wall005);
        const centerPad = (wall5Length - 4.62) / 2;
        const centerDoors = createArchedDoor(
            walls.wall005, centerPad, 4.62, 6.05,
            9, 0.6, 0.33, "wall-005", "main-door-center"
        );
        centerDoors.forEach(g => graphicsLayer.add(g));
        
        // Cửa phải
        addDoor(graphicsLayer, walls.wall006, 3.52, 5.5, "wall-006", "main-door-right");
    }

    /**
     * Thêm 2 cửa bên hông tháp chuông
     */
    function addSideDoors(graphicsLayer, walls) {
        if (walls.wall002) {
            addDoor(graphicsLayer, walls.wall002, 3.52, 5.5, "wall-002", "side-door-left");
        }
        if (walls.wall007) {
            addDoor(graphicsLayer, walls.wall007, 3.52, 5.5, "wall-007", "side-door-right");
        }
    }

    // Export các hàm để sử dụng ở file khác
    window.createArchedDoor = createArchedDoor;
    window.addMainDoors = addMainDoors;
    window.addSideDoors = addSideDoors;
});
