require([
    "esri/Graphic",
    "esri/geometry/Mesh"
], function (Graphic, Mesh) {

    /**
     * Tạo hình hộp 3D cho các thành phần cửa sổ
     * (Sử dụng chung cho khung và phần lấp cửa sổ)
     */
    function createBox(p0, p1, z0, z1, depth, normalOrientation, color, edgeColor = "white", edgeSize = 0.5) {
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
            }
        });
    }

    /**
     * Tạo polygon mesh phẳng với 2 mặt (double-sided)
     */
    function createFlatPolygonMesh(rings, color, edgeColor = [26, 26, 26], edgeSize = 0.5) {
        const positions = [];
        const faces = [];
        
        rings[0].forEach(point => {
            positions.push(point[0], point[1], point[2]);
        });
        
        const numVertices = rings[0].length - 1;
        
        for (let i = 1; i < numVertices - 1; i++) {
            faces.push(0, i, i + 1);
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
                        cullFace: "none"
                    },
                    edges: {
                        type: "solid",
                        color: edgeColor,
                        size: edgeSize
                    }
                }]
            }
        });
    }

    /**
     * Tạo arch frame merged thành 1 mesh duy nhất (optimize performance)
     */
    function createMergedArchFrame(
        centerPoint, orientation, normalOrientation,
        radius, outerRadius, baseZ, rectHeight,
        segments, frameDepth, frameColor, frameEdgeColor
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
                base+0, base+1, base+2, base+0, base+2, base+3,
                base+5, base+4, base+7, base+5, base+7, base+6,
                base+4, base+0, base+3, base+4, base+3, base+7,
                base+1, base+5, base+6, base+1, base+6, base+2,
                base+4, base+5, base+1, base+4, base+1, base+0,
                base+3, base+2, base+6, base+3, base+6, base+7
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
                        size: 0.1
                    }
                }]
            }
        });
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
     * Tạo 1 cặp cửa sổ vòm Roman (2 cửa dính liền nhau)
     */
    function createWindowPair(
        wallPolygon,
        centerX,      // Vị trí trung tâm cặp cửa sổ (tính từ đầu tường)
        width,        // Chiều rộng mỗi cửa
        rectHeight,   // Chiều cao phần vuông góc
        baseZ,        // Độ cao nền
        wallId        // ID tường
    ) {
        const graphics = [];
        const orientation = getPolygonOrientation(wallPolygon);
        let normalOrientation = orientation + 90;
        const wallBL = wallPolygon[0];

        // Kiểm tra xem có phải cửa chính không
        const isMainDoor = (wallId === "wall-020" || wallId === "wall-021");
        
        // Kiểm tra xem có phải cửa sổ tầng trên tháp chuông không (walls 059-066)
        const isUpperBellTowerWindow = (wallId === "wall-001" || wallId === "wall-002" || 
                                         wallId === "wall-003" || wallId === "wall-004" || 
                                         wallId === "wall-006" || wallId === "wall-007" || 
                                         wallId === "wall-008" || wallId === "wall-009");
        
        // Frame thickness: dày hơn cho cửa chính để cân đối với cửa tháp chuông
        const frameThickness = isMainDoor ? 0.30 : 0.18;
        
        // Khoảng cách giữa 2 cửa: lớn hơn cho cửa chính và cửa sổ tầng trên (để viền không chồng)
        const gap = isMainDoor ? 1.0 : (isUpperBellTowerWindow ? 0.8 : 0.5);
        
        // Điều chỉnh depth và normal theo wall
        let frameDepth;
        if (wallId === "wall-004") {
            // wall-004: đảo ngược normal orientation (cùng hướng wall-007)
            normalOrientation = orientation - 90;
            frameDepth = 0.3;
        } else if (wallId === "wall-009") {
            // wall-009: đảo ngược normal orientation để quay ngược 180 độ (cùng hướng wall-002)
            normalOrientation = orientation - 90;
            frameDepth = -0.3;
        } else if (wallId === "wall-008") {
            // wall-008: ngược hướng 180 độ so với wall-006
            normalOrientation = orientation - 90;
            frameDepth = -0.3;
        } else if (wallId === "wall-003") {
            // wall-003: ngược hướng 180 độ so với wall-001
            normalOrientation = orientation - 90;
            frameDepth = 0.3;
        } else if (wallId === "wall-002" || wallId === "wall-014") {
            // wall-002, wall-014: hướng ngược (frameDepth âm)
            frameDepth = -0.3;
        } else if (wallId === "wall-020") {
            // wall-020: cửa chính, frameDepth dương
            frameDepth = 0.3;
        } else if (wallId === "wall-021") {
            // wall-021: cửa chính, frameDepth âm
            frameDepth = -0.3;
        } else if (wallId === "wall-024") {
            // wall-024: cửa sổ ở vị trí cao, frameDepth dương (nhô ra ngoài)
            frameDepth = 0.3;
        } else if (wallId === "wall-025") {
            // wall-025: cửa sổ ở vị trí cao, frameDepth âm (ngược hướng wall-024)
            frameDepth = -0.3;
        } else if (wallId === "wall-011") {
            // wall-011: tăng frameDepth để nhô ra đều đặn
            frameDepth = 0.5;
        } else {
            // wall-001, 006, 007: hướng thuận
            frameDepth = 0.3;
        }

        const frameColor = "#ffffff";
        const frameEdgeColor = "#ffffff";

        // Lớp viền ngoài cho cửa chính (walls 020, 021) và cửa sổ tầng trên tháp chuông
        const outerFrameThickness = frameThickness * 2;
        const outerFrameColor = "#fffef0";
        const outerFrameEdgeColor = "#fffef0";
        const hasOuterFrame = isMainDoor || isUpperBellTowerWindow;

        const radius = width / 2;

        // Tính vị trí 2 cửa
        const totalWidth = width * 2 + gap;
        const leftWindowStart = centerX - totalWidth / 2;
        const rightWindowStart = leftWindowStart + width + gap;

        // === VẼ CỬA TRÁI ===
        const leftWinLeft = findNewPoint(wallBL, orientation, leftWindowStart);
        const leftWinRight = findNewPoint(leftWinLeft, orientation, width);
        const leftWinCenter = findNewPoint(leftWinLeft, orientation, width / 2);

        // Khung cửa trái
        const leftFrameLeft = findNewPoint(leftWinLeft, orientation, -frameThickness);
        const leftFrameRight = findNewPoint(leftWinRight, orientation, frameThickness);

        // Outer frame cho cửa trái (cho cửa chính và cửa sổ tầng trên tháp chuông)
        if (hasOuterFrame) {
            const leftOuterFrameLeft = findNewPoint(leftWinLeft, orientation, -(frameThickness + outerFrameThickness));
            const leftOuterFrameRight = findNewPoint(leftWinRight, orientation, (frameThickness + outerFrameThickness));

            // Outer frame dưới (trái)
            graphics.push(createBox(
                leftOuterFrameLeft, leftFrameLeft,
                baseZ - frameThickness * 0.5 - outerFrameThickness * 0.5, baseZ,
                frameDepth, normalOrientation,
                outerFrameColor, outerFrameEdgeColor, 0.1
            ));
            // Outer frame dưới (phải)
            graphics.push(createBox(
                leftFrameRight, leftOuterFrameRight,
                baseZ - frameThickness * 0.5 - outerFrameThickness * 0.5, baseZ,
                frameDepth, normalOrientation,
                outerFrameColor, outerFrameEdgeColor, 0.1
            ));

            // Outer frame trái
            graphics.push(createBox(
                leftOuterFrameLeft, leftFrameLeft,
                baseZ - frameThickness, baseZ + rectHeight,
                frameDepth, normalOrientation,
                outerFrameColor, outerFrameEdgeColor, 0.1
            ));

            // Thanh ngang dưới cùng cho outer frame trái (chân khung) - không cần nữa

            // Outer frame phải
            graphics.push(createBox(
                leftFrameRight, leftOuterFrameRight,
                baseZ - frameThickness, baseZ + rectHeight,
                frameDepth, normalOrientation,
                outerFrameColor, outerFrameEdgeColor, 0.1
            ));
        }

        // Khung dưới (inner frame) - cao hơn để khớp với thanh dọc
        graphics.push(createBox(
            leftFrameLeft, leftFrameRight,
            baseZ - frameThickness, baseZ,
            frameDepth, normalOrientation,
            frameColor, frameEdgeColor, 0.1
        ));

        // Khung trái
        graphics.push(createBox(
            leftFrameLeft, leftWinLeft,
            baseZ - frameThickness, baseZ + rectHeight,
            frameDepth, normalOrientation,
            frameColor, frameEdgeColor, 0.1
        ));

        // Khung phải
        graphics.push(createBox(
            leftWinRight, leftFrameRight,
            baseZ - frameThickness, baseZ + rectHeight,
            frameDepth, normalOrientation,
            frameColor, frameEdgeColor, 0.1
        ));

        // Fill đen cửa trái (chữ nhật)
        graphics.push(createBox(
            leftWinLeft, leftWinRight,
            baseZ, baseZ + rectHeight + 0.05,
            frameDepth, normalOrientation,
            [120, 120, 120], [120, 120, 120], 0
        ));

        // Vòm cung cửa trái
        const leftArchPoints = [];
        const archSegments = 40;
        for (let i = 0; i <= archSegments; i++) {
            const angle = Math.PI * (i / archSegments);
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const p = findNewPoint(leftWinCenter, orientation, x);
            const z = baseZ + rectHeight + y;
            leftArchPoints.push([p[0], p[1], z]);
        }

        // Fill đen vòm cung trái
        const leftArchRings = [[
            [leftWinLeft[0], leftWinLeft[1], baseZ + rectHeight],
            ...leftArchPoints,
            [leftWinRight[0], leftWinRight[1], baseZ + rectHeight],
            [leftWinLeft[0], leftWinLeft[1], baseZ + rectHeight]
        ]];
        
        const leftOffsetRings = leftArchRings[0].map(p => {
            const offsetP = findNewPoint([p[0], p[1]], normalOrientation, frameDepth);
            return [offsetP[0], offsetP[1], p[2]];
        });
        
        graphics.push(createFlatPolygonMesh(
            [leftOffsetRings],
            [120, 120, 120], [120, 120, 120], 0
        ));

        const outerRadius = radius + frameThickness;
        const archFrameSegments = 40;

        // Outer arch frame cho cửa trái (cho cửa chính và cửa sổ tầng trên tháp chuông)
        if (hasOuterFrame) {
            const leftOuterArchOuterRadius = radius + frameThickness + outerFrameThickness;
            const leftOuterArchInnerRadius = radius + frameThickness;
            const leftOuterArchFrame = createMergedArchFrame(
                leftWinCenter, orientation, normalOrientation,
                leftOuterArchInnerRadius, leftOuterArchOuterRadius, baseZ, rectHeight,
                archFrameSegments, frameDepth, outerFrameColor, outerFrameEdgeColor
            );
            graphics.push(leftOuterArchFrame);
        }

        // Inner arch frame
        const leftArchFrame = createMergedArchFrame(
            leftWinCenter, orientation, normalOrientation,
            radius, outerRadius, baseZ, rectHeight,
            archFrameSegments, frameDepth, frameColor, frameEdgeColor
        );
        graphics.push(leftArchFrame);

        // === VẼ CỬA PHẢI (tương tự) ===
        const rightWinLeft = findNewPoint(wallBL, orientation, rightWindowStart);
        const rightWinRight = findNewPoint(rightWinLeft, orientation, width);
        const rightWinCenter = findNewPoint(rightWinLeft, orientation, width / 2);

        const rightFrameLeft = findNewPoint(rightWinLeft, orientation, -frameThickness);
        const rightFrameRight = findNewPoint(rightWinRight, orientation, frameThickness);

        // Outer frame cho cửa phải (cho cửa chính và cửa sổ tầng trên tháp chuông)
        if (hasOuterFrame) {
            const rightOuterFrameLeft = findNewPoint(rightWinLeft, orientation, -(frameThickness + outerFrameThickness));
            const rightOuterFrameRight = findNewPoint(rightWinRight, orientation, (frameThickness + outerFrameThickness));

            // Outer frame dưới (trái)
            graphics.push(createBox(
                rightOuterFrameLeft, rightFrameLeft,
                baseZ - frameThickness * 0.5 - outerFrameThickness * 0.5, baseZ,
                frameDepth, normalOrientation,
                outerFrameColor, outerFrameEdgeColor, 0.1
            ));
            // Outer frame dưới (phải)
            graphics.push(createBox(
                rightFrameRight, rightOuterFrameRight,
                baseZ - frameThickness * 0.5 - outerFrameThickness * 0.5, baseZ,
                frameDepth, normalOrientation,
                outerFrameColor, outerFrameEdgeColor, 0.1
            ));

            // Outer frame trái
            graphics.push(createBox(
                rightOuterFrameLeft, rightFrameLeft,
                baseZ - frameThickness, baseZ + rectHeight,
                frameDepth, normalOrientation,
                outerFrameColor, outerFrameEdgeColor, 0.1
            ));

            // Thanh ngang dưới cùng cho outer frame trái (chân khung) - không cần nữa

            // Outer frame phải
            graphics.push(createBox(
                rightFrameRight, rightOuterFrameRight,
                baseZ - frameThickness, baseZ + rectHeight,
                frameDepth, normalOrientation,
                outerFrameColor, outerFrameEdgeColor, 0.1
            ));
        }

        // Khung dưới (inner frame) - cao hơn để khớp với thanh dọc
        graphics.push(createBox(
            rightFrameLeft, rightFrameRight,
            baseZ - frameThickness, baseZ,
            frameDepth, normalOrientation,
            frameColor, frameEdgeColor, 0.1
        ));

        // Khung trái
        graphics.push(createBox(
            rightFrameLeft, rightWinLeft,
            baseZ - frameThickness, baseZ + rectHeight,
            frameDepth, normalOrientation,
            frameColor, frameEdgeColor, 0.1
        ));

        // Khung phải
        graphics.push(createBox(
            rightWinRight, rightFrameRight,
            baseZ - frameThickness, baseZ + rectHeight,
            frameDepth, normalOrientation,
            frameColor, frameEdgeColor, 0.1
        ));

        // Fill đen cửa phải
        graphics.push(createBox(
            rightWinLeft, rightWinRight,
            baseZ, baseZ + rectHeight + 0.05,
            frameDepth, normalOrientation,
            [120, 120, 120], [120, 120, 120], 0
        ));

        // Vòm cung cửa phải
        const rightArchPoints = [];
        for (let i = 0; i <= archSegments; i++) {
            const angle = Math.PI * (i / archSegments);
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const p = findNewPoint(rightWinCenter, orientation, x);
            const z = baseZ + rectHeight + y;
            rightArchPoints.push([p[0], p[1], z]);
        }

        // Fill đen vòm phải
        const rightArchRings = [[
            [rightWinLeft[0], rightWinLeft[1], baseZ + rectHeight],
            ...rightArchPoints,
            [rightWinRight[0], rightWinRight[1], baseZ + rectHeight],
            [rightWinLeft[0], rightWinLeft[1], baseZ + rectHeight]
        ]];
        
        const rightOffsetRings = rightArchRings[0].map(p => {
            const offsetP = findNewPoint([p[0], p[1]], normalOrientation, frameDepth);
            return [offsetP[0], offsetP[1], p[2]];
        });
        
        graphics.push(createFlatPolygonMesh(
            [rightOffsetRings],
            [120, 120, 120], [120, 120, 120], 0
        ));

        // Outer arch frame cho cửa phải (cho cửa chính và cửa sổ tầng trên tháp chuông)
        if (hasOuterFrame) {
            const rightOuterArchOuterRadius = radius + frameThickness + outerFrameThickness;
            const rightOuterArchInnerRadius = radius + frameThickness;
            const rightOuterArchFrame = createMergedArchFrame(
                rightWinCenter, orientation, normalOrientation,
                rightOuterArchInnerRadius, rightOuterArchOuterRadius, baseZ, rectHeight,
                archFrameSegments, frameDepth, outerFrameColor, outerFrameEdgeColor
            );
            graphics.push(rightOuterArchFrame);
        }

        // Inner arch frame
        const rightArchFrame = createMergedArchFrame(
            rightWinCenter, orientation, normalOrientation,
            radius, outerRadius, baseZ, rectHeight,
            archFrameSegments, frameDepth, frameColor, frameEdgeColor
        );
        graphics.push(rightArchFrame);

        return graphics;
    }

    /**
     * Tạo bộ 3 cửa sổ vòm Roman (3 cửa dính liền nhau)
     */
    function createWindowTriplet(
        wallPolygon,
        centerX,
        width,
        rectHeight,
        baseZ,
        wallId
    ) {
        const graphics = [];
        const orientation = getPolygonOrientation(wallPolygon);
        let normalOrientation = orientation + 90;
        const wallBL = wallPolygon[0];

        const frameThickness = 0.20; // Tăng thêm 10% (0.18 -> 0.20)
        const gap = 0.5;
        
        // Điều chỉnh frameDepth theo wall
        let frameDepth;
        if (wallId === "wall-016" || wallId === "wall-029") {
            // wall-016, wall-029: cùng hướng wall-014 (frameDepth âm)
            frameDepth = -0.3;
        } else if (wallId === "wall-017" || wallId === "wall-028") {
            // wall-017, wall-028: giữ nguyên normal orientation, tăng frameDepth để nhô ra rõ hơn
            frameDepth = 0.5;
        } else if (wallId === "wall-018" || wallId === "wall-023") {
            // wall-018, wall-023: frameDepth âm, không đảo normal
            frameDepth = -0.3;
        } else if (wallId === "wall-019" || wallId === "wall-022") {
            // wall-019, wall-022: đảo ngược normal và frameDepth âm
            normalOrientation = orientation - 90;
            frameDepth = -0.3;
        } else if (wallId === "wall-020") {
            // wall-020: frameDepth dương
            frameDepth = 0.3;
        } else if (wallId === "wall-021") {
            // wall-021: frameDepth âm (ngược với wall-020)
            frameDepth = -0.3;
        } else {
            // wall-005: hướng thuận
            frameDepth = 0.3;
        }

        const frameColor = "#ffffff";
        const frameEdgeColor = "#ffffff";
        const radius = width / 2;

        // Tính vị trí 3 cửa
        const totalWidth = width * 3 + gap * 2;
        const leftWindowStart = centerX - totalWidth / 2;
        const centerWindowStart = leftWindowStart + width + gap;
        const rightWindowStart = centerWindowStart + width + gap;

        // Hàm helper vẽ 1 cửa
        const drawSingleWindow = (windowStart) => {
            const winLeft = findNewPoint(wallBL, orientation, windowStart);
            const winRight = findNewPoint(winLeft, orientation, width);
            const winCenter = findNewPoint(winLeft, orientation, width / 2);

            const frameLeft = findNewPoint(winLeft, orientation, -frameThickness);
            const frameRight = findNewPoint(winRight, orientation, frameThickness);

            // Khung dưới
            graphics.push(createBox(
                frameLeft, frameRight,
                baseZ - frameThickness * 0.5, baseZ,
                frameDepth, normalOrientation,
                frameColor, frameEdgeColor, 0.1
            ));

            // Khung trái
            graphics.push(createBox(
                frameLeft, winLeft,
                baseZ, baseZ + rectHeight,
                frameDepth, normalOrientation,
                frameColor, frameEdgeColor, 0.1
            ));

            // Khung phải
            graphics.push(createBox(
                winRight, frameRight,
                baseZ, baseZ + rectHeight,
                frameDepth, normalOrientation,
                frameColor, frameEdgeColor, 0.1
            ));

            // Fill đen chữ nhật
            graphics.push(createBox(
                winLeft, winRight,
                baseZ, baseZ + rectHeight + 0.05,
                frameDepth, normalOrientation,
                [120, 120, 120], [120, 120, 120], 0
            ));

            // Vòm cung
            const archPoints = [];
            const archSegments = 40;
            for (let i = 0; i <= archSegments; i++) {
                const angle = Math.PI * (i / archSegments);
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                const p = findNewPoint(winCenter, orientation, x);
                const z = baseZ + rectHeight + y;
                archPoints.push([p[0], p[1], z]);
            }

            // Fill đen vòm
            const archRings = [[
                [winLeft[0], winLeft[1], baseZ + rectHeight],
                ...archPoints,
                [winRight[0], winRight[1], baseZ + rectHeight],
                [winLeft[0], winLeft[1], baseZ + rectHeight]
            ]];

            const offsetRings = archRings[0].map(p => {
                const offsetP = findNewPoint([p[0], p[1]], normalOrientation, frameDepth);
                return [offsetP[0], offsetP[1], p[2]];
            });

            graphics.push(createFlatPolygonMesh(
                [offsetRings],
                [120, 120, 120], [120, 120, 120], 0
            ));

            // Khung vòm
            const outerRadius = radius + frameThickness;
            const archFrameSegments = 40;

            const winArchFrame = createMergedArchFrame(
                winCenter, orientation, normalOrientation,
                radius, outerRadius, baseZ, rectHeight,
                archFrameSegments, frameDepth, frameColor, frameEdgeColor
            );
            graphics.push(winArchFrame);
        };

        // Vẽ 3 cửa
        drawSingleWindow(leftWindowStart);
        drawSingleWindow(centerWindowStart);
        drawSingleWindow(rightWindowStart);

        return graphics;
    }

    /**
     * Thêm cửa sổ cho 2 tháp (wall-001 và wall-006)
     */
    function addTowerWindows(graphicsLayer, walls) {
        const wallHeight = 44;
        const wallBaseZ = 9;
        
        // Chia làm 3 tầng với khoảng cách 0.8m (giữa dưới-giữa) và 2m (giữa-trên)
        const gap = 0.8;
        const topGap = 2.0;  // Khoảng cách lớn hơn cho tầng trên
        const totalWindowsHeight = 13.2;
        const bottomHeight = totalWindowsHeight / 2.3;
        const middleHeight = bottomHeight * 1.3;
        const topHeight = middleHeight * 1.2;  // Cặp trên cùng cao hơn tầng giữa 20%

        const bottomRectHeight = bottomHeight * 0.65;
        const middleRectHeight = bottomRectHeight;  // Tầng giữa có chiều cao bằng tầng dưới
        const topRectHeight = topHeight * 0.65;

        // Chiều rộng mỗi cửa (tăng 20% so với ban đầu: 1.2 * 1.2 = 1.44m)
        const windowWidth = 1.44;

        // Tính baseZ để cửa sổ lùi xuống 5% so với vị trí giữa tường, sau đó dịch xuống thêm 0.5m
        const windowsBaseZ = wallBaseZ + (wallHeight * 0.45) - (totalWindowsHeight / 2) - 0.5;

        // === THÁP TRÁI (wall-001) ===
        const wall1Length = getWallLength(walls.wall001);
        const wall1Center = wall1Length / 2;

        // Cặp cửa dưới
        const bottomGraphics1 = createWindowPair(
            walls.wall001,
            wall1Center,
            windowWidth,
            bottomRectHeight,
            windowsBaseZ,
            "wall-001"
        );
        bottomGraphics1.forEach(g => graphicsLayer.add(g));

        // Cặp cửa giữa (rộng hơn 30%)
        const middleBaseZ1 = windowsBaseZ + bottomHeight + gap;
        const middleGraphics1 = createWindowPair(
            walls.wall001,
            wall1Center,
            windowWidth * 1.3,
            middleRectHeight,
            middleBaseZ1,
            "wall-001"
        );
        middleGraphics1.forEach(g => graphicsLayer.add(g));

        // Cặp cửa trên cùng (rộng hơn 10%, cao hơn 20% so với tầng giữa)
        // Sử dụng wall-059 (tầng trên) nếu có, nếu không dùng tính toán cũ
        // Căn giữa tường: baseZ + (wallHeight/2) - (windowHeight/2) + offset
        const topBaseZ1 = walls.topWall059BaseZ ? (walls.topWall059BaseZ + (12/2) - (topHeight/2) + 1) : (middleBaseZ1 + middleHeight + topGap + 3.5);
        const topWall1 = walls.wall059 || walls.wall001;  // Dùng wall tầng trên nếu có
        const topWall1Center = walls.wall059 ? getWallLength(walls.wall059) / 2 : wall1Center;  // Tính center của wall tầng trên
        const topGraphics1 = createWindowPair(
            topWall1,
            topWall1Center,
            windowWidth * 1.43,  // 1.3 * 1.1 = rộng hơn tầng giữa 10%
            topRectHeight,
            topBaseZ1,
            "wall-001"
        );
        topGraphics1.forEach(g => graphicsLayer.add(g));

        // === THÁP PHẢI (wall-006) ===
        const wall6Length = getWallLength(walls.wall006);
        const wall6Center = wall6Length / 2;

        // Cặp cửa dưới
        const bottomGraphics6 = createWindowPair(
            walls.wall006,
            wall6Center,
            windowWidth,
            bottomRectHeight,
            windowsBaseZ,
            "wall-006"
        );
        bottomGraphics6.forEach(g => graphicsLayer.add(g));

        // Cặp cửa giữa (rộng hơn 30%)
        const middleBaseZ6 = windowsBaseZ + bottomHeight + gap;
        const middleGraphics6 = createWindowPair(
            walls.wall006,
            wall6Center,
            windowWidth * 1.3,
            middleRectHeight,
            middleBaseZ6,
            "wall-006"
        );
        middleGraphics6.forEach(g => graphicsLayer.add(g));

        // Cặp cửa trên cùng (rộng hơn 10%, cao hơn 20% so với tầng giữa)
        // Sử dụng wall-063 (tầng trên) nếu có
        const topBaseZ6 = walls.topWall063BaseZ ? (walls.topWall063BaseZ + (12/2) - (topHeight/2) + 1) : (middleBaseZ6 + middleHeight + topGap + 3.5);
        const topWall6 = walls.wall063 || walls.wall006;
        const topWall6Center = walls.wall063 ? getWallLength(walls.wall063) / 2 : wall6Center;
        const topGraphics6 = createWindowPair(
            topWall6,
            topWall6Center,
            windowWidth * 1.43,  // 1.3 * 1.1 = rộng hơn tầng giữa 10%
            topRectHeight,
            topBaseZ6,
            "wall-006"
        );
        topGraphics6.forEach(g => graphicsLayer.add(g));
    }

    /**
     * Thêm cửa sổ cho 2 tường bên hông (wall-002 và wall-007)
     */
    function addSideWindows(graphicsLayer, walls) {

        const wallHeight = 44;
        const wallBaseZ = 9;
        const gap = 0.8;
        const topGap = 2.0;
        const totalWindowsHeight = 13.2;
        const bottomHeight = totalWindowsHeight / 2.3;
        const middleHeight = bottomHeight * 1.3;
        const topHeight = middleHeight * 1.2;
        const bottomRectHeight = bottomHeight * 0.65;
        const middleRectHeight = bottomRectHeight;  // Tầng giữa có chiều cao bằng tầng dưới
        const topRectHeight = topHeight * 0.65;
        const windowWidth = 1.44;
        const windowsBaseZ = wallBaseZ + (wallHeight * 0.45) - (totalWindowsHeight / 2) - 0.5;

        // === TƯỜNG BÊN TRÁI (wall-002) ===
        if (walls.wall002) {
            const wall2Length = getWallLength(walls.wall002);
            const wall2Center = wall2Length / 2;

            // Cặp cửa dưới
            const bottomGraphics2 = createWindowPair(
                walls.wall002,
                wall2Center,
                windowWidth,
                bottomRectHeight,
                windowsBaseZ,
                "wall-002"
            );
            bottomGraphics2.forEach(g => graphicsLayer.add(g));

            // Cặp cửa giữa (rộng hơn 30%)
            const middleBaseZ2 = windowsBaseZ + bottomHeight + gap;
            const middleGraphics2 = createWindowPair(
                walls.wall002,
                wall2Center,
                windowWidth * 1.3,
                middleRectHeight,
                middleBaseZ2,
                "wall-002"
            );
            middleGraphics2.forEach(g => graphicsLayer.add(g));

            // Cặp cửa trên cùng (rộng hơn 10%, cao hơn 20% so với tầng giữa)
            // Sử dụng wall-060 (tầng trên) nếu có
            const topBaseZ2 = walls.topWall060BaseZ ? (walls.topWall060BaseZ + (12/2) - (topHeight/2) + 1) : (middleBaseZ2 + middleHeight + topGap + 3.5);
            const topWall2 = walls.wall060 || walls.wall002;
            const topWall2Center = walls.wall060 ? getWallLength(walls.wall060) / 2 : wall2Center;
            const topGraphics2 = createWindowPair(
                topWall2,
                topWall2Center,
                windowWidth * 1.43,
                topRectHeight,
                topBaseZ2,
                "wall-002"
            );
            topGraphics2.forEach(g => graphicsLayer.add(g));
        }

        // === TƯỜNG BÊN TRÁI (wall-009) - giống wall-002 ===
        if (walls.wall009) {
            const wall9Length = getWallLength(walls.wall009);
            const wall9Center = wall9Length / 2;

            // Cặp cửa dưới
            const bottomGraphics9 = createWindowPair(
                walls.wall009,
                wall9Center,
                windowWidth,
                bottomRectHeight,
                windowsBaseZ,
                "wall-009"
            );
            bottomGraphics9.forEach(g => graphicsLayer.add(g));

            // Cặp cửa giữa (rộng hơn 30%)
            const middleBaseZ9 = windowsBaseZ + bottomHeight + gap;
            const middleGraphics9 = createWindowPair(
                walls.wall009,
                wall9Center,
                windowWidth * 1.3,
                middleRectHeight,
                middleBaseZ9,
                "wall-009"
            );
            middleGraphics9.forEach(g => graphicsLayer.add(g));

            // Cặp cửa trên cùng
            // Sử dụng wall-066 (tầng trên) nếu có
            const topBaseZ9 = walls.topWall066BaseZ ? (walls.topWall066BaseZ + (12/2) - (topHeight/2) + 1) : (middleBaseZ9 + middleHeight + topGap + 3.5);
            const topWall9 = walls.wall066 || walls.wall009;
            const topWall9Center = walls.wall066 ? getWallLength(walls.wall066) / 2 : wall9Center;
            const topGraphics9 = createWindowPair(
                topWall9,
                topWall9Center,
                windowWidth * 1.43,
                topRectHeight,
                topBaseZ9,
                "wall-009"
            );
            topGraphics9.forEach(g => graphicsLayer.add(g));
        }

        // === TƯỜNG BÊN PHẢI (wall-004) - giống wall-007 ===
        if (walls.wall004) {
            const wall4Length = getWallLength(walls.wall004);
            const wall4Center = wall4Length / 2;

            // Cặp cửa dưới
            const bottomGraphics4 = createWindowPair(
                walls.wall004,
                wall4Center,
                windowWidth,
                bottomRectHeight,
                windowsBaseZ,
                "wall-004"
            );
            bottomGraphics4.forEach(g => graphicsLayer.add(g));

            // Cặp cửa giữa (rộng hơn 30%)
            const middleBaseZ4 = windowsBaseZ + bottomHeight + gap;
            const middleGraphics4 = createWindowPair(
                walls.wall004,
                wall4Center,
                windowWidth * 1.3,
                middleRectHeight,
                middleBaseZ4,
                "wall-004"
            );
            middleGraphics4.forEach(g => graphicsLayer.add(g));

            // Cặp cửa trên cùng
            // Sử dụng wall-062 (tầng trên) nếu có
            const topBaseZ4 = walls.topWall062BaseZ ? (walls.topWall062BaseZ + (12/2) - (topHeight/2) + 1) : (middleBaseZ4 + middleHeight + topGap + 3.5);
            const topWall4 = walls.wall062 || walls.wall004;
            const topWall4Center = walls.wall062 ? getWallLength(walls.wall062) / 2 : wall4Center;
            const topGraphics4 = createWindowPair(
                topWall4,
                topWall4Center,
                windowWidth * 1.43,
                topRectHeight,
                topBaseZ4,
                "wall-004"
            );
            topGraphics4.forEach(g => graphicsLayer.add(g));
        }

        // === TƯỜNG BÊN PHẢI (wall-007) ===
        if (walls.wall007) {
            const wall7Length = getWallLength(walls.wall007);
            const wall7Center = wall7Length / 2;

            // Cặp cửa dưới
            const bottomGraphics7 = createWindowPair(
                walls.wall007,
                wall7Center,
                windowWidth,
                bottomRectHeight,
                windowsBaseZ,
                "wall-007"
            );
            bottomGraphics7.forEach(g => graphicsLayer.add(g));

            // Cặp cửa giữa (rộng hơn 30%)
            const middleBaseZ7 = windowsBaseZ + bottomHeight + gap;
            const middleGraphics7 = createWindowPair(
                walls.wall007,
                wall7Center,
                windowWidth * 1.3,
                middleRectHeight,
                middleBaseZ7,
                "wall-007"
            );
            middleGraphics7.forEach(g => graphicsLayer.add(g));

            // Cặp cửa trên cùng (rộng hơn 10%, cao hơn 20% so với tầng giữa)
            // Sử dụng wall-064 (tầng trên) nếu có
            const topBaseZ7 = walls.topWall064BaseZ ? (walls.topWall064BaseZ + (12/2) - (topHeight/2) + 1) : (middleBaseZ7 + middleHeight + topGap + 3.5);
            const topWall7 = walls.wall064 || walls.wall007;
            const topWall7Center = walls.wall064 ? getWallLength(walls.wall064) / 2 : wall7Center;
            const topGraphics7 = createWindowPair(
                topWall7,
                topWall7Center,
                windowWidth * 1.43,
                topRectHeight,
                topBaseZ7,
                "wall-007"
            );
            topGraphics7.forEach(g => graphicsLayer.add(g));
        }
    }

    /**
     * Thêm cửa sổ cho tường giữa (wall-005)
     */
    function addCenterWindows(graphicsLayer, walls) {
        const wallHeight = 44;
        const wallBaseZ = 9;
        const totalWindowsHeight = 13.2;
        const bottomHeight = totalWindowsHeight / 2.3;
        const bottomRectHeight = bottomHeight * 0.65;
        const windowWidth = 1.44;
        const windowsBaseZ = wallBaseZ + (wallHeight * 0.45) - (totalWindowsHeight / 2);

        if (walls.wall005) {
            const wall5Length = getWallLength(walls.wall005);
            const wall5Center = wall5Length / 2;

            // Chỉ có 1 bộ 3 cửa ở dưới
            const tripletGraphics = createWindowTriplet(
                walls.wall005,
                wall5Center,
                windowWidth,
                bottomRectHeight,
                windowsBaseZ,
                "wall-005"
            );
            tripletGraphics.forEach(g => graphicsLayer.add(g));
        }
    }

    /**
     * Thêm cửa sổ cho 2 tháp phía sau (wall-003 và wall-008) - ngược hướng 180 độ với wall-001 và wall-006
     */
    function addBackTowerWindows(graphicsLayer, walls) {
        const wallHeight = 44;
        const wallBaseZ = 9;
        
        const gap = 0.8;
        const topGap = 2.0;
        const totalWindowsHeight = 13.2;
        const bottomHeight = totalWindowsHeight / 2.3;
        const middleHeight = bottomHeight * 1.3;
        const topHeight = middleHeight * 1.2;

        const bottomRectHeight = bottomHeight * 0.65;
        const middleRectHeight = bottomRectHeight;  // Tầng giữa có chiều cao bằng tầng dưới
        const topRectHeight = topHeight * 0.65;

        const windowWidth = 1.44;
        const windowsBaseZ = wallBaseZ + (wallHeight * 0.45) - (totalWindowsHeight / 2) - 0.5;

        // === THÁP SAU TRÁI (wall-003) ===
        if (walls.wall003) {
            const wall3Length = getWallLength(walls.wall003);
            const wall3Center = wall3Length / 2;

            // Cặp cửa dưới
            const bottomGraphics3 = createWindowPair(
                walls.wall003,
                wall3Center,
                windowWidth,
                bottomRectHeight,
                windowsBaseZ,
                "wall-003"
            );
            bottomGraphics3.forEach(g => graphicsLayer.add(g));

            // Cặp cửa giữa (rộng hơn 30%)
            const middleBaseZ3 = windowsBaseZ + bottomHeight + gap;
            const middleGraphics3 = createWindowPair(
                walls.wall003,
                wall3Center,
                windowWidth * 1.3,
                middleRectHeight,
                middleBaseZ3,
                "wall-003"
            );
            middleGraphics3.forEach(g => graphicsLayer.add(g));

            // Cặp cửa trên cùng
            // Sử dụng wall-061 (tầng trên) nếu có
            const topBaseZ3 = walls.topWall061BaseZ ? (walls.topWall061BaseZ + (12/2) - (topHeight/2) + 1) : (middleBaseZ3 + middleHeight + topGap + 3.5);
            const topWall3 = walls.wall061 || walls.wall003;
            const topWall3Center = walls.wall061 ? getWallLength(walls.wall061) / 2 : wall3Center;
            const topGraphics3 = createWindowPair(
                topWall3,
                topWall3Center,
                windowWidth * 1.43,
                topRectHeight,
                topBaseZ3,
                "wall-003"
            );
            topGraphics3.forEach(g => graphicsLayer.add(g));
        }

        // === THÁP SAU PHẢI (wall-008) ===
        if (walls.wall008) {
            const wall8Length = getWallLength(walls.wall008);
            const wall8Center = wall8Length / 2;

            // Cặp cửa dưới
            const bottomGraphics8 = createWindowPair(
                walls.wall008,
                wall8Center,
                windowWidth,
                bottomRectHeight,
                windowsBaseZ,
                "wall-008"
            );
            bottomGraphics8.forEach(g => graphicsLayer.add(g));

            // Cặp cửa giữa (rộng hơn 30%)
            const middleBaseZ8 = windowsBaseZ + bottomHeight + gap;
            const middleGraphics8 = createWindowPair(
                walls.wall008,
                wall8Center,
                windowWidth * 1.3,
                middleRectHeight,
                middleBaseZ8,
                "wall-008"
            );
            middleGraphics8.forEach(g => graphicsLayer.add(g));

            // Cặp cửa trên cùng
            // Sử dụng wall-065 (tầng trên) nếu có
            const topBaseZ8 = walls.topWall065BaseZ ? (walls.topWall065BaseZ + (12/2) - (topHeight/2) + 1) : (middleBaseZ8 + middleHeight + topGap + 3.5);
            const topWall8 = walls.wall065 || walls.wall008;
            const topWall8Center = walls.wall065 ? getWallLength(walls.wall065) / 2 : wall8Center;
            const topGraphics8 = createWindowPair(
                topWall8,
                topWall8Center,
                windowWidth * 1.43,
                topRectHeight,
                topBaseZ8,
                "wall-008"
            );
            topGraphics8.forEach(g => graphicsLayer.add(g));
        }
    }

    // Export functions
    window.getWallLength = getWallLength;
    window.createWindowPair = createWindowPair;
    window.createWindowTriplet = createWindowTriplet;
    window.addTowerWindows = addTowerWindows;
    window.addBackTowerWindows = addBackTowerWindows;
    window.addSideWindows = addSideWindows;
    window.addCenterWindows = addCenterWindows;
    
    // Export helper functions for other modules
    window.createBox = createBox;
    window.createFlatPolygonMesh = createFlatPolygonMesh;
    window.createMergedArchFrame = createMergedArchFrame;
    window.findNewPoint = findNewPoint;
    window.getPolygonOrientation = getPolygonOrientation;
});
