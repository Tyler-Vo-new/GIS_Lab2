/**
 * cuaChinhThanNhaTho.js
 * Quản lý cửa chính cho THÂN NHÀ THỜ (nave main doors)
 * Bao gồm cửa chính lớn cho wall-020 và wall-021
 */

require([
    "esri/Graphic",
    "esri/geometry/Mesh"
], function (Graphic, Mesh) {

    /**
     * Tạo hộp 3D mesh từ 2 điểm và độ sâu
     */
    function createBox(p0, p1, z0, z1, depth, normalOrientation, color, edgeColor = "white", edgeSize = 0.5) {
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
                type: "door-part"
            }
        });
    }

    /**
     * Tạo 1 bộ 6 cửa dính liền nhau (middle level windows)
     * Sử dụng createWindowPair từ cuaSoThapChuong.js
     * @param {Polygon} wallPolygon - Polygon của tường
     * @param {number} windowWidth - Chiều rộng mỗi cửa
     * @param {number} rectHeight - Chiều cao phần chữ nhật
     * @param {number} baseZ - Độ cao bắt đầu
     * @param {string} wallId - ID của tường
     * @returns {Array<Graphic>} - Array of window graphics
     */
    function createSixWindowSet(wallPolygon, windowWidth, rectHeight, baseZ, wallId) {
        console.log(`createSixWindowSet called for ${wallId}`);
        
        // Sử dụng createWindowTriplet 2 lần để tạo 6 cửa
        const wallLength = window.getWallLength(wallPolygon);
        const tripletWidth = windowWidth * 3 + 0.3 * 2; // 3 cửa + 2 khoảng cách
        const gap = 0.5; // Khoảng cách giữa 2 bộ triplet
        
        console.log(`Wall length: ${wallLength}m, Triplet width: ${tripletWidth}m`);
        
        // Tính vị trí 2 bộ triplet
        const centerX = wallLength / 2;
        const leftTripletCenter = centerX - tripletWidth / 2 - gap / 2;
        const rightTripletCenter = centerX + tripletWidth / 2 + gap / 2;
        
        console.log(`Left triplet center: ${leftTripletCenter}m, Right triplet center: ${rightTripletCenter}m`);
        
        // Tạo 2 bộ triplet (tổng 6 cửa)
        const leftTriplet = window.createWindowTriplet(wallPolygon, leftTripletCenter, windowWidth, rectHeight, baseZ, wallId);
        const rightTriplet = window.createWindowTriplet(wallPolygon, rightTripletCenter, windowWidth, rectHeight, baseZ, wallId);
        
        const graphics = [...leftTriplet, ...rightTriplet];
        console.log(`Total graphics created for ${wallId}: ${graphics.length}`);
        
        return graphics;
    }

    /**
     * Tạo 1 cặp cửa chính (2 cửa dính liền) ở tầng dưới
     * @param {Polygon} wallPolygon - Polygon của tường
     * @param {number} doorWidth - Chiều rộng mỗi cửa
     * @param {number} doorHeight - Chiều cao cửa (tổng)
     * @param {number} baseZ - Độ cao nền (chân cửa sát đất)
     * @param {string} wallId - ID của tường
     * @returns {Array<Graphic>} - Array of door graphics
     */
    function createMainDoorPair(wallPolygon, doorWidth, doorHeight, baseZ, wallId) {
        console.log(`createMainDoorPair called for ${wallId}`);
        const wallLength = getWallLength(wallPolygon);
        console.log(`Wall length: ${wallLength}m, Door height: ${doorHeight}m`);
        
        // Tính vị trí trung tâm tường
        const centerX = wallLength / 2;
        
        // Tính chiều cao phần chữ nhật (65% tổng chiều cao)
        const rectHeight = doorHeight * 0.65;
        
        console.log(`Center position: ${centerX}m, rectHeight: ${rectHeight}m`);
        
        // Sử dụng createWindowPair từ cuaSoThapChuong.js
        // Hàm này đã có sẵn logic vẽ khung và vòm cung đúng
        const doorGraphics = createWindowPair(
            wallPolygon,
            centerX,
            doorWidth,
            rectHeight,
            baseZ,
            wallId
        );
        
        console.log(`Total graphics created for ${wallId}: ${doorGraphics.length}`);
        return doorGraphics;
    }

    /**
     * Thêm cửa chính cho wall-020 và wall-021
     * @param {GraphicsLayer} graphicsLayer - Layer để thêm graphics
     * @param {Object} walls - Object chứa các tường cần thêm cửa
     */
    function addNaveMainDoors(graphicsLayer, walls) {
        console.log("=== addNaveMainDoors START ===");
        console.log("addNaveMainDoors called with walls:", walls);
        console.log("graphicsLayer:", graphicsLayer);
        
        const doorWidth = 1.8 * 2.5; // Chiều rộng mỗi cửa (gấp 2.5 lần)
        const wallBaseZ = 9;
        const wallHeight = 26;
        
        // Cao 1/3 chiều cao wall, tăng 15%
        const doorHeight = (wallHeight / 3) * 1.15;
        const doorBaseZ = wallBaseZ; // Chân cửa sát đất
        
        console.log("Main door parameters:", { doorWidth, doorHeight, doorBaseZ });
        
        // === TƯỜNG wall-020 ===
        console.log("Checking wall-020:", walls.wall020 ? "Found" : "Not found");
        if (walls.wall020) {
            console.log("Creating main door pair for wall-020");
            try {
                const graphics020 = createMainDoorPair(
                    walls.wall020,
                    doorWidth,
                    doorHeight,
                    doorBaseZ,
                    "wall-020"
                );
                console.log(`Created ${graphics020.length} graphics for wall-020`);
                graphics020.forEach(g => graphicsLayer.add(g));
                console.log("Added graphics to layer for wall-020");
                
                // Thêm cửa sổ tầng giữa (giống wall-029)
                console.log("Creating middle level windows for wall-020");
                const middleWindowWidth = 1.2; // Giống wall-029
                const middleRectHeight = 2.925; // Giống wall-029
                const middleBaseZ = 22; // Tầng giữa
                const middleGraphics020 = createSixWindowSet(walls.wall020, middleWindowWidth, middleRectHeight, middleBaseZ, "wall-020");
                console.log(`Created ${middleGraphics020.length} middle level graphics for wall-020`);
                middleGraphics020.forEach(g => graphicsLayer.add(g));
                console.log("Added middle level graphics to layer for wall-020");
            } catch (error) {
                console.error("Error creating doors for wall-020:", error);
            }
        } else {
            console.log("wall-020 not found");
        }
        
        // === TƯỜNG wall-021 ===
        console.log("Checking wall-021:", walls.wall021 ? "Found" : "Not found");
        if (walls.wall021) {
            console.log("Creating main door pair for wall-021");
            try {
                const graphics021 = createMainDoorPair(
                    walls.wall021,
                    doorWidth,
                    doorHeight,
                    doorBaseZ,
                    "wall-021"
                );
                console.log(`Created ${graphics021.length} graphics for wall-021`);
                graphics021.forEach(g => graphicsLayer.add(g));
                console.log("Added graphics to layer for wall-021");
                
                // Thêm cửa sổ tầng giữa (giống wall-029)
                console.log("Creating middle level windows for wall-021");
                const middleWindowWidth = 1.2; // Giống wall-029
                const middleRectHeight = 2.925; // Giống wall-029
                const middleBaseZ = 22; // Tầng giữa
                const middleGraphics021 = createSixWindowSet(walls.wall021, middleWindowWidth, middleRectHeight, middleBaseZ, "wall-021");
                console.log(`Created ${middleGraphics021.length} middle level graphics for wall-021`);
                middleGraphics021.forEach(g => graphicsLayer.add(g));
                console.log("Added middle level graphics to layer for wall-021");
            } catch (error) {
                console.error("Error creating doors for wall-021:", error);
            }
        } else {
            console.log("wall-021 not found");
        }
        
        console.log("=== addNaveMainDoors END ===");
    }

    // Export functions
    window.createMainDoorPair = createMainDoorPair;
    window.createSixWindowSet = createSixWindowSet;
    window.addNaveMainDoors = addNaveMainDoors;

});
