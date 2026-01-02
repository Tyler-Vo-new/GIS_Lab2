const createUpWindow = (wallPolygon, leftPad, width, height, baseZ = 0, offset = 0.2) => {
    // Hướng của tường
    const orientation = getPolygonOrientation(wallPolygon);

    // Pháp tuyến (vuông góc với tường)
    const normalOrientation = orientation + 90;

    // Điểm dưới bên trái của tường
    const wallBottomLeft = wallPolygon.rings[0][0];

    // Dịch theo hướng tường để lấy vị trí cửa sổ
    const bottomLeft2D = findNewPoint(wallBottomLeft, orientation, leftPad);
    const bottomRight2D = findNewPoint(bottomLeft2D, orientation, width);

    // Dịch thêm theo pháp tuyến để cửa sổ lòi ra
    const bottomLeftOffset = findNewPoint(bottomLeft2D, normalOrientation, offset);
    const bottomRightOffset = findNewPoint(bottomRight2D, normalOrientation, offset);

    // Thêm Z cho các điểm dưới
    const bottomLeft3D = [bottomLeftOffset[0], bottomLeftOffset[1], baseZ];
    const bottomRight3D = [bottomRightOffset[0], bottomRightOffset[1], baseZ];

    // Các điểm trên: cùng lon/lat nhưng cao hơn baseZ + height
    const topRight3D = [bottomRightOffset[0], bottomRightOffset[1], baseZ + height];
    const topLeft3D = [bottomLeftOffset[0], bottomLeftOffset[1], baseZ + height];

    return [bottomLeft3D, bottomRight3D, topRight3D, topLeft3D, bottomLeft3D];
};

require([
    "esri/Graphic"
], function (Graphic) {

    function showUpWindow(graphicsLayer, wallPolygon, leftPad, width, height, baseZ = 0, offset = 0.2) {
        // Thể hiện cửa sổ đứng trong map
        const windowPolygon = createUpWindow(wallPolygon, leftPad, width, height, baseZ, offset);

        const windowGraphic = new Graphic({
            geometry: { type: "polygon", rings: windowPolygon },
            symbol: {
                type: "simple-fill",
                color: [0, 0, 255, 0.5],
                outline: { color: [255, 255, 255], width: 1 }
            },
            attributes: { Name: "Window" },
            popupTemplate: { title: "{Name}" }
        });

        graphicsLayer.add(windowGraphic);
    }

    // ✅ Expose globally so main.js can call it
    window.showUpWindow = showUpWindow;
});