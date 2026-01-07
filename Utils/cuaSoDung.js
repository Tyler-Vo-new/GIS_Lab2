// const createUpWindow = (
//     wallPolygon,
//     leftPad,
//     width,
//     height,
//     baseZ = 0,
//     offset = 0.2
// ) => {
//     // 1. Hướng của tường
//     const orientation = getPolygonOrientation(wallPolygon);

//     // 2. Pháp tuyến của tường
//     const normalOrientation = orientation + 90;

//     // 3. Điểm đáy trái của tường
//     const wallBottomLeft = wallPolygon.rings[0][0];

//     // 4. Trượt dọc theo tường
//     const bottomLeft2D = findNewPoint(wallBottomLeft, orientation, leftPad);
//     const bottomRight2D = findNewPoint(bottomLeft2D, orientation, width);

//     // 5. Dịch theo pháp tuyến (lồi / lõm)
//     const bottomLeftOffset = findNewPoint(bottomLeft2D, normalOrientation, offset);
//     const bottomRightOffset = findNewPoint(bottomRight2D, normalOrientation, offset);

//     // 6. Tạo 3D points
//     // Thêm Z cho các điểm dưới
//     const bottomLeft3D = [bottomLeftOffset[0], bottomLeftOffset[1], baseZ];
//     const bottomRight3D = [bottomRightOffset[0], bottomRightOffset[1], baseZ];

//     // Các điểm trên: cùng lon/lat nhưng cao hơn baseZ + height
//     const topRight3D = [bottomRightOffset[0], bottomRightOffset[1], baseZ + height];
//     const topLeft3D = [bottomLeftOffset[0], bottomLeftOffset[1], baseZ + height];

//     return [bottomLeft3D, bottomRight3D, topRight3D, topLeft3D, bottomLeft3D];
// };

// require([
//     "esri/Graphic"
// ], function (Graphic) {

//     function showUpWindow(
//         graphicsLayer,
//         wallPolygon,
//         leftPad,
//         width,
//         height,
//         baseZ = 0,
//         offset = 0.2
//     ) {
//         // Thể hiện cửa sổ đứng trong map
//         const windowPolygon = createUpWindow(wallPolygon, leftPad, width, height, baseZ, offset);

//         // const windowGraphic = new Graphic({
//         //     geometry: { type: "polygon", rings: windowPolygon },
//         //     symbol: {
//         //         type: "simple-fill",
//         //         color: [0, 0, 255, 0.5],
//         //         outline: { color: [255, 255, 255], width: 1 }
//         //     },
//         //     attributes: { Name: "Window" },
//         //     popupTemplate: { title: "{Name}" }
//         // });

//         const windowGraphic = new Graphic({
//             geometry: {
//                 type: "polygon",
//                 rings: windowPolygon,
//                 spatialReference: { wkid: 4326 }
//             },
//             symbol: {
//                 type: "polygon-3d",
//                 symbolLayers: [{
//                     type: "fill",
//                     material: {
//                         color: offset > 0
//                             ? [0, 200, 255, 0.9]   // lồi
//                             : [255, 80, 80, 0.9]   // lõm
//                     }
//                 }]
//             },
//             elevationInfo: {
//                 mode: "absolute-height"   // 🔥 QUAN TRỌNG NHẤT
//             },
//             attributes: {
//                 type: "Window",
//                 offset
//             },
//             popupTemplate: {
//                 title: "Cửa sổ",
//                 content: `
//                     Offset: {offset} m<br>
//                     Trạng thái: ${offset > 0 ? "LỒI" : "LÕM"}
//                 `
//             }
//         });

//         graphicsLayer.add(windowGraphic);
//     }

//     // ✅ Expose globally so main.js can call it
//     window.showUpWindow = showUpWindow;
// });

require([
    "esri/Graphic",
    "esri/geometry/Mesh"
], function (Graphic, Mesh) {

    function createWindowMesh(
        wallPolygon,
        leftPad,       // m
        width,         // m
        height,        // m
        baseZ,         // m
        depth = 0.25,  // độ dày cửa sổ (m)
        offset = 0     // + lồi / - lõm
    ) {
        
        var offset = offset < 0 ? 0 : offset; 
        // 1️⃣ Hướng tường
        const orientation = getPolygonOrientation(wallPolygon);

        // 2️⃣ Pháp tuyến
        const normalOrientation = orientation + 90;

        // 3️⃣ Điểm bắt đầu (dưới-trái của tường)
        const wallBL = wallPolygon[0];

        // 4️⃣ Trượt theo tường
        const p0 = findNewPoint(wallBL, orientation, leftPad);
        const p1 = findNewPoint(p0, orientation, width);

        // 5️⃣ Offset lồi / lõm
        const front0 = findNewPoint(p0, normalOrientation, offset);
        const front1 = findNewPoint(p1, normalOrientation, offset);

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
                    material: { color: [120, 180, 255] },
                    edges: {
                        type: "solid",
                        color: "white",
                        size: 1
                    }
                }]
            },
            attributes: {
                type: "window"
            }
        });
    }

    // expose
    window.createWindowMesh = createWindowMesh;
});
