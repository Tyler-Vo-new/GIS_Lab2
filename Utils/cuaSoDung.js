import findNewPoint from './utils';
import Graphic from "https://js.arcgis.com/4.29/esri/Graphic.js";


const createUpWindow = (basePoint, width, height, orientation = 90) => {
    // Tạo cửa sổ đứng của nhà thờ
    const bottomLeft = basePoint;
    const bottomRight = findNewPoint(basePoint, orientation, width)
    const topRight = findNewPoint(bottomRight, 0, height);
    const topLeft = findNewPoint(bottomLeft, 0, height);

    returnn[bottomLeft, bottomRight, topRight, topLeft, bottomLeft];
}


define([], function () {
    function showUpWindow(graphicsLayer, basePoint, width, height, orientation = 90){
        // Hiển thị cửa sổ
        const windowPolygon = createUpWindow(basePoint, width, height, orientation);

        const windowGraphic = new Graphic({
            geometry: {
                type: "polygon",
                rings: windowPolygon
            },
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
    return showUpWindow;
});
