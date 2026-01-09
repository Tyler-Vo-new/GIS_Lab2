/**
 * cuaSoCuoiNhaTho.js
 * Quản lý cửa sổ cho PHẦN CUỐI NHÀ THỜ (apse/sanctuary)
 * Bao gồm cửa sổ cho các tường cong hoặc thẳng của phần thánh đường
 */

(function() {
    'use strict';

    /**
     * Tạo 2 bộ 3 cửa sổ giãn cách đều nhau trên tường cuối nhà thờ
     * @param {Polygon} wallPolygon - Polygon của tường
     * @param {number} windowWidth - Chiều rộng mỗi cửa sổ
     * @param {number} rectHeight - Chiều cao phần chữ nhật của cửa sổ
     * @param {number} baseZ - Độ cao bắt đầu của cửa sổ
     * @param {string} wallId - ID của tường
     * @returns {Array<Graphic>} - Array of window graphics
    /**
     * Tạo 2 bộ 3 cửa sổ giãn cách đều nhau trên tường cuối nhà thờ
     * @param {Polygon} wallPolygon - Polygon của tường
     * @param {number} windowWidth - Chiều rộng mỗi cửa sổ
     * @param {number} rectHeight - Chiều cao phần chữ nhật của cửa sổ
     * @param {number} baseZ - Độ cao bắt đầu của cửa sổ
     * @param {string} wallId - ID của tường
     * @param {Array<number>} fixedPositions - (Optional) Mảng vị trí cố định cho các bộ cửa
     * @returns {Array<Graphic>} - Array of window graphics
     */
    function createApseTripletSeries(wallPolygon, windowWidth, rectHeight, baseZ, wallId, fixedPositions) {
        console.log(`createApseTripletSeries called for ${wallId}`);
        const graphics = [];
        const wallLength = getWallLength(wallPolygon);
        console.log(`Wall length: ${wallLength}m`);
        
        const tripletCount = 2; // 2 bộ 3 cửa
        const gap = 0.3; // Khoảng cách giữa các cửa trong 1 bộ (phải khớp với cuaSoThapChuong.js)
        const tripletWidth = windowWidth * 3 + gap * 2; // Tổng chiều rộng 1 bộ 3 cửa
        
        console.log(`Triplet width: ${tripletWidth}m`);
        
        let positions;
        if (fixedPositions && fixedPositions.length === tripletCount) {
            // Sử dụng vị trí cố định từ tham số
            positions = fixedPositions;
            console.log(`Using fixed positions: ${positions}`);
        } else {
            // Tính khoảng cách giữa các bộ để giãn cách đều
            // Công thức: (wallLength - tripletWidth * tripletCount) / (tripletCount + 1)
            // Chia thành: [lề trái][bộ 1][khoảng giữa][bộ 2][lề phải]
            const availableSpace = wallLength - (tripletWidth * tripletCount);
            const spacing = availableSpace / (tripletCount + 1);
            console.log(`Available space: ${availableSpace}m, Spacing: ${spacing}m`);
            
            positions = [];
            for (let i = 1; i <= tripletCount; i++) {
                // Position là tâm của bộ 3 cửa
                // Công thức: spacing * i + tripletWidth * (i - 0.5)
                const position = spacing * i + tripletWidth * (i - 0.5);
                positions.push(position);
            }
        }
        
        // Tạo từng bộ 3 cửa tại các vị trí đã tính
        for (let i = 0; i < positions.length; i++) {
            const position = positions[i];
            console.log(`Creating triplet ${i+1} at position ${position}m (center), range: ${position - tripletWidth/2}m to ${position + tripletWidth/2}m`);
            
            // Sử dụng createWindowTriplet từ cuaSoThapChuong.js
            const tripletGraphics = createWindowTriplet(
                wallPolygon,
                position,
                windowWidth,
                rectHeight,
                baseZ,
                wallId
            );
            
            console.log(`Triplet ${i+1} created ${tripletGraphics.length} graphics`);
            graphics.push(...tripletGraphics);
        }
        
        console.log(`Total graphics created for ${wallId}: ${graphics.length}`);
        return graphics;
    }

    /**
     * Tạo 1 cửa sổ đơn căn giữa tường ở vị trí cao
     * @param {Polygon} wallPolygon - Polygon của tường
     * @param {number} windowWidth - Chiều rộng cửa sổ
     * @param {number} rectHeight - Chiều cao phần chữ nhật của cửa sổ
     * @param {number} baseZ - Độ cao bắt đầu của cửa sổ
     * @param {string} wallId - ID của tường
     * @returns {Array<Graphic>} - Array of window graphics
     */
    function createSingleCenteredWindow(wallPolygon, windowWidth, rectHeight, baseZ, wallId) {
        console.log(`createSingleCenteredWindow called for ${wallId}`);
        console.log('Available window functions:', {
            getWallLength: typeof window.getWallLength,
            getPolygonOrientation: typeof window.getPolygonOrientation,
            findNewPoint: typeof window.findNewPoint,
            createBox: typeof window.createBox,
            createFlatPolygonMesh: typeof window.createFlatPolygonMesh,
            createMergedArchFrame: typeof window.createMergedArchFrame
        });
        
        if (typeof window.getWallLength !== 'function') {
            console.error('window.getWallLength is not available!');
            return [];
        }
        
        const graphics = [];
        const wallLength = window.getWallLength(wallPolygon);
        const centerX = wallLength / 2;
        
        console.log(`Wall length: ${wallLength}m, Center position: ${centerX}m`);
        
        // Lấy orientation và frameDepth
        const orientation = window.getPolygonOrientation(wallPolygon);
        let normalOrientation;
        const wallBL = wallPolygon[0];
        
        const frameThickness = 0.20; // Tăng thêm 10% (0.18 -> 0.20)
        
        // Các wall mới cần frameDepth dương
        const newWalls = ['035', '036', '037', '041', '042', '043', '050', '052'];
        const isNewWall = newWalls.includes(wallId.replace('wall-', ''));
        
        let frameDepth;
        if (wallId === "wall-053") {
            // Wall 053: xoay ngược lại
            normalOrientation = orientation + 90;
            frameDepth = -0.3;
        } else if (wallId === "wall-027") {
            // Wall 027: cửa chính
            normalOrientation = orientation + 90;
            frameDepth = -0.3;
        } else if (wallId === "wall-026") {
            // Wall 026: cửa chính
            normalOrientation = orientation - 90;
            frameDepth = -0.3;
        } else if (isNewWall) {
            // Wall mới: frameDepth dương
            normalOrientation = orientation - 90;
            frameDepth = 0.3;
        } else {
            // Wall cũ khác: frameDepth âm
            normalOrientation = orientation - 90;
            frameDepth = -0.3;
        }
        
        const frameColor = "#ffffff";
        const frameEdgeColor = "#ffffff";
        const radius = windowWidth / 2;
        
        // Tính vị trí cửa ở giữa tường
        const windowStart = centerX - windowWidth / 2;
        
        console.log(`Window starts at ${windowStart}m, width ${windowWidth}m, frameDepth: ${frameDepth}`);
        
        // Vẽ 1 cửa duy nhất
        const winLeft = window.findNewPoint(wallBL, orientation, windowStart);
        const winRight = window.findNewPoint(winLeft, orientation, windowWidth);
        const winCenter = window.findNewPoint(winLeft, orientation, windowWidth / 2);
        
        const frameLeft = window.findNewPoint(winLeft, orientation, -frameThickness);
        const frameRight = window.findNewPoint(winRight, orientation, frameThickness);
        
        // Khung dưới
        graphics.push(window.createBox(
            frameLeft, frameRight,
            baseZ - frameThickness * 0.5, baseZ,
            frameDepth, normalOrientation,
            frameColor, frameEdgeColor, 0.1
        ));
        
        // Khung trái
        graphics.push(window.createBox(
            frameLeft, winLeft,
            baseZ, baseZ + rectHeight,
            frameDepth, normalOrientation,
            frameColor, frameEdgeColor, 0.1
        ));
        
        // Khung phải
        graphics.push(window.createBox(
            winRight, frameRight,
            baseZ, baseZ + rectHeight,
            frameDepth, normalOrientation,
            frameColor, frameEdgeColor, 0.1
        ));
        
        // Fill đen chữ nhật
        graphics.push(window.createBox(
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
            const p = window.findNewPoint(winCenter, orientation, x);
            const z = baseZ + rectHeight + y;
            archPoints.push([p[0], p[1], z]);
        }
        
        // Fill đen vòm cung
        const archRings = [[
            [winLeft[0], winLeft[1], baseZ + rectHeight],
            ...archPoints,
            [winRight[0], winRight[1], baseZ + rectHeight],
            [winLeft[0], winLeft[1], baseZ + rectHeight]
        ]];
        
        const offsetRings = archRings[0].map(p => {
            const offsetP = window.findNewPoint([p[0], p[1]], normalOrientation, frameDepth);
            return [offsetP[0], offsetP[1], p[2]];
        });
        
        graphics.push(window.createFlatPolygonMesh(
            [offsetRings],
            [120, 120, 120], [120, 120, 120], 0
        ));
        
        // Khung vòm cung (merged arch frame)
        const outerRadius = radius + frameThickness;
        const archFrameGraphic = window.createMergedArchFrame(
            winCenter, orientation, normalOrientation,
            radius, outerRadius, baseZ, rectHeight,
            archSegments, frameDepth, frameColor, frameEdgeColor
        );
        graphics.push(archFrameGraphic);
        
        console.log(`Total graphics created for ${wallId}: ${graphics.length}`);
        return graphics;
    }

    /**
     * Thêm cửa sổ đơn cho các tường nhỏ ở phần cuối nhà thờ
     * @param {GraphicsLayer} graphicsLayer - Layer để thêm graphics
     * @param {Object} walls - Object chứa các tường cần thêm cửa
     */
    function addUpperApseWindows(graphicsLayer, walls) {
        console.log("=== addUpperApseWindows START ===");
        console.log("Received walls object:", walls);
        console.log("Walls keys:", Object.keys(walls));
        console.log("Walls with values:", Object.keys(walls).filter(k => walls[k] !== null));
        
        const windowWidth = 1.0; // Chiều rộng cửa nhỏ hơn
        const windowHeight = 3.5; // Chiều cao tổng cửa sổ
        const rectHeight = windowHeight * 0.65;
        
        const wallIds = ['032', '033', '034', '035', '036', '037', '038', '039', '040', '041', '042', '043', '049', '050', '051', '052', '053', '054', '055', '056', '057', '058'];
        
        wallIds.forEach(wallId => {
            const wallKey = `wall${wallId}`;
            const fullWallId = `wall-${wallId}`;
            
            console.log(`Checking ${fullWallId}:`, walls[wallKey] ? "Found" : "Not found");
            
            if (walls[wallKey]) {
                console.log(`Creating single centered window for ${fullWallId}`);
                try {
                    // Walls 054-058 có baseZ=26, kích thước giống wall-029
                    const upperWalls = ['054', '055', '056', '057', '058'];
                    const isUpperWall = upperWalls.includes(wallId);
                    
                    let windowBaseZ, winWidth, winRectHeight;
                    if (isUpperWall) {
                        // Walls 054-058: giống wall-029 (căn giữa tường theo chiều cao)
                        const wallBaseZ = 26;
                        const wallHeight = 9;
                        winWidth = 1.2; // Giống wall-029
                        const totalWindowsHeight = 4.5; // Giống wall-029
                        winRectHeight = totalWindowsHeight * 0.65; // = 2.925
                        // Căn giữa tường theo chiều cao
                        windowBaseZ = wallBaseZ + (wallHeight / 2) - (totalWindowsHeight / 2); // 26 + 4.5 - 2.25 = 28.25m
                    } else {
                        // Walls khác: baseZ=9, height=9
                        winWidth = windowWidth;
                        winRectHeight = rectHeight;
                        const wallBaseZ = 9;
                        const wallHeight = 9;
                        const windowOffsetFromBase = wallHeight * 0.03; // 0.27m
                        const additionalOffset = 3.8;
                        windowBaseZ = wallBaseZ + windowOffsetFromBase + additionalOffset; // 9 + 0.27 + 3.8 = 13.07m
                    }
                    
                    console.log(`Window baseZ for ${fullWallId}: ${windowBaseZ}m, width: ${winWidth}m, rectHeight: ${winRectHeight}m`);
                    
                    const graphics = createSingleCenteredWindow(
                        walls[wallKey],
                        winWidth,
                        winRectHeight,
                        windowBaseZ,
                        fullWallId
                    );
                    console.log(`Created ${graphics.length} graphics for ${fullWallId}`);
                    graphics.forEach(g => graphicsLayer.add(g));
                    console.log(`Added graphics to layer for ${fullWallId}`);
                } catch (error) {
                    console.error(`Error creating window for ${fullWallId}:`, error);
                }
            }
        });
        
        console.log("=== addUpperApseWindows END ===");
    }

    /**
     * Tạo 2 bộ cửa sổ cặp (mỗi bộ 2 cửa) giãn cách đều nhau trên tường
     * @param {Polygon} wallPolygon - Polygon của tường
     * @param {number} windowWidth - Chiều rộng mỗi cửa sổ
     * @param {number} rectHeight - Chiều cao phần chữ nhật của cửa sổ
     * @param {number} baseZ - Độ cao bắt đầu của cửa sổ
     * @param {string} wallId - ID của tường
     * @returns {Array<Graphic>} - Array of window graphics
     */
    function createApsePairSeries(wallPolygon, windowWidth, rectHeight, baseZ, wallId) {
        console.log(`createApsePairSeries called for ${wallId}`);
        const graphics = [];
        const wallLength = getWallLength(wallPolygon);
        console.log(`Wall length: ${wallLength}m`);
        
        const pairCount = 2; // 2 bộ cửa
        const gap = 0.3; // Khoảng cách giữa 2 cửa trong 1 bộ
        const pairWidth = windowWidth * 2 + gap; // Tổng chiều rộng 1 bộ 2 cửa
        
        console.log(`Pair width: ${pairWidth}m`);
        
        // Tính khoảng cách giữa các bộ để giãn cách rộng hơn
        // Công thức: (wallLength - pairWidth * pairCount) / (pairCount + 1)
        const availableSpace = wallLength - (pairWidth * pairCount);
        const spacing = availableSpace / (pairCount + 1);
        console.log(`Available space: ${availableSpace}m, Spacing: ${spacing}m`);
        
        // Tạo từng bộ 2 cửa tại các vị trí đã tính
        for (let i = 1; i <= pairCount; i++) {
            // Position là tâm của bộ 2 cửa
            const position = spacing * i + pairWidth * (i - 0.5);
            console.log(`Creating pair ${i} at position ${position}m (center), range: ${position - pairWidth/2}m to ${position + pairWidth/2}m`);
            
            // Sử dụng createWindowPair từ cuaSoThapChuong.js
            const pairGraphics = createWindowPair(
                wallPolygon,
                position,
                windowWidth,
                rectHeight,
                baseZ,
                wallId
            );
            
            console.log(`Pair ${i} created ${pairGraphics.length} graphics`);
            graphics.push(...pairGraphics);
        }
        
        console.log(`Total graphics created for ${wallId}: ${graphics.length}`);
        return graphics;
    }

    /**
     * Thêm bộ 3 cửa sổ cho wall-028 và wall-029 (phần cuối nhà thờ)
     * @param {GraphicsLayer} graphicsLayer - Layer để thêm graphics
     * @param {Object} walls - Object chứa các tường cần thêm cửa sổ
     */
    function addApseWindows(graphicsLayer, walls) {
        console.log("addApseWindows called with walls:", walls);
        
        // Thông số cửa sổ giống wall-016/017
        const windowWidth = 1.2;
        const wallHeight = 9;
        const wallBaseZ = 26;
        
        // Tính baseZ để căn giữa tường theo chiều cao
        const totalWindowsHeight = 4.5;
        const rectHeight = totalWindowsHeight * 0.65;
        const windowsBaseZ = wallBaseZ + (wallHeight / 2) - (totalWindowsHeight / 2);
        
        console.log("Apse window parameters:", { windowWidth, rectHeight, windowsBaseZ });
        
        // Tính positions chuẩn dựa trên wall-018 và wall-019
        let standardPositions018 = null;
        let standardPositions019 = null;
        
        const tripletCount = 2;
        const gap = 0.3;
        const tripletWidth = windowWidth * 3 + gap * 2;
        
        // Tính positions cho wall-018 (làm chuẩn cho 022, 023)
        if (walls.wall018) {
            const wall018Length = getWallLength(walls.wall018);
            const availableSpace = wall018Length - (tripletWidth * tripletCount);
            const spacing = availableSpace / (tripletCount + 1);
            standardPositions018 = [];
            for (let i = 1; i <= tripletCount; i++) {
                standardPositions018.push(spacing * i + tripletWidth * (i - 0.5));
            }
            console.log(`Standard positions from wall-018 (length ${wall018Length}m): ${standardPositions018}`);
        }
        
        // Tính positions cho wall-019 (làm chuẩn nếu cần)
        if (walls.wall019) {
            const wall019Length = getWallLength(walls.wall019);
            const availableSpace = wall019Length - (tripletWidth * tripletCount);
            const spacing = availableSpace / (tripletCount + 1);
            standardPositions019 = [];
            for (let i = 1; i <= tripletCount; i++) {
                standardPositions019.push(spacing * i + tripletWidth * (i - 0.5));
            }
            console.log(`Standard positions from wall-019 (length ${wall019Length}m): ${standardPositions019}`);
        }
        
        // === TƯỜNG BÊN TRÁI (wall-029) - cùng hướng wall-016 ===
        if (walls.wall029) {
            console.log("Creating triplet windows for wall-029");
            const graphics29 = createApseTripletSeries(
                walls.wall029,
                windowWidth,
                rectHeight,
                windowsBaseZ,
                "wall-029"
            );
            console.log(`Created ${graphics29.length} graphics for wall-029`);
            graphics29.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-029 not found");
        }
        
        // === TƯỜNG BÊN PHẢI (wall-028) - cùng hướng wall-017 ===
        if (walls.wall028) {
            console.log("Creating triplet windows for wall-028");
            const graphics28 = createApseTripletSeries(
                walls.wall028,
                windowWidth,
                rectHeight,
                windowsBaseZ,
                "wall-028"
            );
            console.log(`Created ${graphics28.length} graphics for wall-028`);
            graphics28.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-028 not found");
        }
        
        // === TƯỜNG 018 - làm chuẩn cho 022, 023 ===
        if (walls.wall018) {
            console.log("Creating triplet windows for wall-018");
            const graphics18 = createApseTripletSeries(
                walls.wall018,
                windowWidth,
                rectHeight,
                windowsBaseZ,
                "wall-018"
            );
            console.log(`Created ${graphics18.length} graphics for wall-018`);
            graphics18.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-018 not found");
        }
        
        // === TƯỜNG 019 - làm chuẩn nếu cần ===
        if (walls.wall019) {
            console.log("Creating triplet windows for wall-019");
            const graphics19 = createApseTripletSeries(
                walls.wall019,
                windowWidth,
                rectHeight,
                windowsBaseZ,
                "wall-019"
            );
            console.log(`Created ${graphics19.length} graphics for wall-019`);
            graphics19.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-019 not found");
        }
        
        // === TƯỜNG 022 - dùng positions của wall-018 ===
        if (walls.wall022 && standardPositions018) {
            console.log(`Creating triplet windows for wall-022 using wall-018 positions: ${standardPositions018}`);
            const graphics22 = createApseTripletSeries(
                walls.wall022,
                windowWidth,
                rectHeight,
                windowsBaseZ,
                "wall-022",
                standardPositions018  // Sử dụng positions chuẩn từ wall-018
            );
            console.log(`Created ${graphics22.length} graphics for wall-022`);
            graphics22.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-022 not found or no standard positions available");
        }
        
        // === TƯỜNG 023 - dùng positions của wall-018 ===
        if (walls.wall023 && standardPositions018) {
            console.log(`Creating triplet windows for wall-023 using wall-018 positions: ${standardPositions018}`);
            const graphics23 = createApseTripletSeries(
                walls.wall023,
                windowWidth,
                rectHeight,
                windowsBaseZ,
                "wall-023",
                standardPositions018  // Sử dụng positions chuẩn từ wall-018
            );
            console.log(`Created ${graphics23.length} graphics for wall-023`);
            graphics23.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-023 not found or no standard positions available");
        }
        
        // === TƯỜNG 024 và 025 - 2 bộ cửa cặp, vị trí cao hơn ===
        console.log("Checking wall-025:", walls.wall025 ? "Found" : "Not found");
        if (walls.wall025) {
            console.log("Creating pair windows for wall-025");
            // wall-025: baseZ=9, height=15
            // Đặt cửa cao hơn, cách chân tường nhiều hơn
            const wall025BaseZ = 9;
            const wall025Height = 15;
            const wall025WindowHeight = 5.74; // Chiều cao tổng cửa sổ (giống wall-011)
            const wall025RectHeight = wall025WindowHeight * 0.65;
            // Đặt ở phía trên, cách chân tường 8m (gần đỉnh hơn)
            const wall025WindowsBaseZ = wall025BaseZ + 8;
            
            const graphics025 = createApsePairSeries(
                walls.wall025,
                1.44, // Chiều rộng mỗi cửa (giống wall-011)
                wall025RectHeight,
                wall025WindowsBaseZ,
                "wall-025"
            );
            console.log(`Created ${graphics025.length} graphics for wall-025`);
            graphics025.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-025 not found");
        }
        
        if (walls.wall024) {
            console.log("Creating pair windows for wall-024");
            // wall-024: baseZ=9, height=15
            // Đặt cửa cao hơn, cách chân tường nhiều hơn
            const wall024BaseZ = 9;
            const wall024Height = 15;
            const wall024WindowHeight = 5.74; // Chiều cao tổng cửa sổ (giống wall-011)
            const wall024RectHeight = wall024WindowHeight * 0.65;
            // Đặt ở phía trên, cách chân tường 8m (gần đỉnh hơn)
            const wall024WindowsBaseZ = wall024BaseZ + 8;
            
            const graphics024 = createApsePairSeries(
                walls.wall024,
                1.44, // Chiều rộng mỗi cửa (giống wall-011)
                wall024RectHeight,
                wall024WindowsBaseZ,
                "wall-024"
            );
            console.log(`Created ${graphics024.length} graphics for wall-024`);
            graphics024.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-024 not found");
        }
    }

    // Export functions
    window.createApseTripletSeries = createApseTripletSeries;
    window.createApsePairSeries = createApsePairSeries;
    window.createSingleCenteredWindow = createSingleCenteredWindow;
    window.addApseWindows = addApseWindows;
    window.addUpperApseWindows = addUpperApseWindows;

})();
