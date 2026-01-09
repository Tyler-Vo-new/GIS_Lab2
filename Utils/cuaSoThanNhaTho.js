/**
 * cuaSoThanNhaTho.js
 * Quản lý cửa sổ cho phần THÂN NHÀ THỜ (nave)
 * Bao gồm các tường bên hông và tường giữa của thân nhà thờ
 */

(function() {
    'use strict';

    /**
     * Tạo 6 bộ 3 cửa sổ giãn cách đều nhau trên tường thân nhà thờ
     * @param {Polygon} wallPolygon - Polygon của tường
     * @param {number} windowWidth - Chiều rộng mỗi cửa sổ
     * @param {number} rectHeight - Chiều cao phần chữ nhật của cửa sổ
     * @param {number} baseZ - Độ cao bắt đầu của cửa sổ
     * @param {string} wallId - ID của tường
     * @returns {Array<Graphic>} - Array of window graphics
     */
    function createNaveTripletSeries(wallPolygon, windowWidth, rectHeight, baseZ, wallId) {
        console.log(`createNaveTripletSeries called for ${wallId}`);
        const graphics = [];
        const wallLength = getWallLength(wallPolygon);
        console.log(`Wall length: ${wallLength}m`);
        
        const tripletCount = 6; // 6 bộ 3 cửa
        
        // Tính khoảng cách giữa các bộ để giãn cách đều
        // Chia tường thành 7 phần (6 bộ + 2 phần lề 2 đầu)
        const spacing = wallLength / (tripletCount + 1);
        console.log(`Spacing between triplets: ${spacing}m`);
        
        // Tạo từng bộ 3 cửa tại các vị trí đều nhau
        for (let i = 1; i <= tripletCount; i++) {
            const position = spacing * i;
            console.log(`Creating triplet ${i} at position ${position}m`);
            
            // Sử dụng createWindowTriplet từ cuaSoThapChuong.js
            const tripletGraphics = createWindowTriplet(
                wallPolygon,
                position,
                windowWidth,
                rectHeight,
                baseZ,
                wallId
            );
            
            console.log(`Triplet ${i} created ${tripletGraphics.length} graphics`);
            graphics.push(...tripletGraphics);
        }
        
        console.log(`Total graphics created for ${wallId}: ${graphics.length}`);
        return graphics;
    }

    /**
     * Tạo 6 cặp cửa sổ giãn cách đều nhau trên tường thân nhà thờ
     * @param {Polygon} wallPolygon - Polygon của tường
     * @param {number} windowWidth - Chiều rộng mỗi cửa sổ
     * @param {number} rectHeight - Chiều cao phần chữ nhật của cửa sổ
     * @param {number} baseZ - Độ cao bắt đầu của cửa sổ
     * @param {string} wallId - ID của tường
     * @returns {Array<Graphic>} - Array of window graphics
     */
    function createNaveWindowSeries(wallPolygon, windowWidth, rectHeight, baseZ, wallId) {
        console.log(`createNaveWindowSeries called for ${wallId}`);
        const graphics = [];
        const wallLength = getWallLength(wallPolygon);
        console.log(`Wall length: ${wallLength}m`);
        
        const windowCount = 6; // 6 cặp cửa sổ
        
        // Tính khoảng cách giữa các cặp cửa sổ để giãn cách đều
        // Chia tường thành 7 phần (6 cửa sổ + 2 phần lề 2 đầu)
        const spacing = wallLength / (windowCount + 1);
        console.log(`Spacing between windows: ${spacing}m`);
        
        // Tạo từng cặp cửa sổ tại các vị trí đều nhau
        for (let i = 1; i <= windowCount; i++) {
            const position = spacing * i;
            console.log(`Creating window pair ${i} at position ${position}m`);
            
            // Sử dụng createWindowPair từ cuaSoThapChuong.js
            const windowPairGraphics = createWindowPair(
                wallPolygon,
                position,
                windowWidth,
                rectHeight,
                baseZ,
                wallId
            );
            
            console.log(`Window pair ${i} created ${windowPairGraphics.length} graphics`);
            graphics.push(...windowPairGraphics);
        }
        
        console.log(`Total graphics created for ${wallId}: ${graphics.length}`);
        return graphics;
    }

    /**
     * Thêm cửa sổ cho thân nhà thờ (wall-014 và wall-011)
     * @param {GraphicsLayer} graphicsLayer - Layer để thêm graphics
     * @param {Object} walls - Object chứa các tường cần thêm cửa sổ
     */
    function addNaveWindows(graphicsLayer, walls) {
        console.log("addNaveWindows called with walls:", walls);
        
        // Thông số cửa sổ giống tầng dưới của tháp chuông
        const windowWidth = 1.44;
        const wallHeight = 9;
        const wallBaseZ = 9;
        
        // Tính baseZ để căn giữa tường theo chiều cao
        const totalWindowsHeight = 5.74; // chiều cao cửa sổ tầng dưới (bottomHeight từ tháp chuông)
        const rectHeight = totalWindowsHeight * 0.65;
        const windowsBaseZ = wallBaseZ + (wallHeight / 2) - (totalWindowsHeight / 2);
        
        console.log("Window parameters:", { windowWidth, rectHeight, windowsBaseZ });
        
        // === TƯỜNG BÊN TRÁI (wall-014) - cùng hướng wall-002 ===
        if (walls.wall014) {
            console.log("Creating windows for wall-014");
            const graphics14 = createNaveWindowSeries(
                walls.wall014,
                windowWidth,
                rectHeight,
                windowsBaseZ,
                "wall-014"
            );
            console.log(`Created ${graphics14.length} graphics for wall-014`);
            graphics14.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-014 not found");
        }
        
        // === TƯỜNG BÊN PHẢI (wall-011) - cùng hướng wall-007 ===
        if (walls.wall011) {
            console.log("Creating windows for wall-011");
            const graphics11 = createNaveWindowSeries(
                walls.wall011,
                windowWidth,
                rectHeight,
                windowsBaseZ,
                "wall-011"
            );
            console.log(`Created ${graphics11.length} graphics for wall-011`);
            graphics11.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-011 not found");
        }
    }

    /**
     * Thêm bộ 3 cửa sổ cho wall-016 và wall-017
     * @param {GraphicsLayer} graphicsLayer - Layer để thêm graphics
     * @param {Object} walls - Object chứa các tường cần thêm cửa sổ
     */
    function addNaveTripletWindows(graphicsLayer, walls) {
        console.log("addNaveTripletWindows called with walls:", walls);
        
        // Thông số cửa sổ nhỏ hơn wall-005
        const windowWidth = 1.2; // Nhỏ hơn 1.44m
        const wallHeight = 9; // Wall-016 và wall-017 có height = 9m
        const wallBaseZ = 26; // Wall-016 và wall-017 có baseZ = 26
        
        // Tính baseZ để căn giữa tường theo chiều cao
        const totalWindowsHeight = 4.5; // Chiều cao cửa sổ
        const rectHeight = totalWindowsHeight * 0.65;
        const windowsBaseZ = wallBaseZ + (wallHeight / 2) - (totalWindowsHeight / 2);
        
        console.log("Triplet window parameters:", { windowWidth, rectHeight, windowsBaseZ });
        
        console.log("Checking wall016:", walls.wall016);
        console.log("Checking wall017:", walls.wall017);
        
        // === TƯỜNG BÊN TRÁI (wall-016) - cùng hướng wall-014 ===
        if (walls.wall016) {
            console.log("Creating triplet windows for wall-016");
            const graphics16 = createNaveTripletSeries(
                walls.wall016,
                windowWidth,
                rectHeight,
                windowsBaseZ,
                "wall-016"
            );
            console.log(`Created ${graphics16.length} graphics for wall-016`);
            graphics16.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-016 not found");
        }
        
        // === TƯỜNG BÊN PHẢI (wall-017) - cùng hướng wall-011 ===
        if (walls.wall017) {
            console.log("Creating triplet windows for wall-017");
            const graphics17 = createNaveTripletSeries(
                walls.wall017,
                windowWidth,
                rectHeight,
                windowsBaseZ,
                "wall-017"
            );
            console.log(`Created ${graphics17.length} graphics for wall-017`);
            graphics17.forEach(g => graphicsLayer.add(g));
        } else {
            console.log("wall-017 not found");
        }
    }

    // Export functions
    window.createNaveWindowSeries = createNaveWindowSeries;
    window.createNaveTripletSeries = createNaveTripletSeries;
    window.addNaveWindows = addNaveWindows;
    window.addNaveTripletWindows = addNaveTripletWindows;

})();
