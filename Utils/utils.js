const toRad = deg => deg * Math.PI / 180;
const toDeg = rad => rad * 180 / Math.PI;

const findNewPoint = (coord, bearing, distance) => {
    // Tìm điểm tiếp theo dựa trên khoảng cách tính bằng m
    if (isNaN(coord[0]) || isNaN(coord[1]) || isNaN(bearing) || isNaN(distance)) {
        throw new Error("Invalid input");
    }

    var radius = 6371e3,
        δ = Number(distance) / radius, // angular distance in radians
        θ = toRad(Number(bearing)),
        φ1 = toRad(Number(coord[1])),
        λ1 = toRad(Number(coord[0]));
    var φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    var λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
    λ2 = (λ2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // normalise to -180..+180°

    return [toDeg(λ2), toDeg(φ2)]; //[lon, lat]
}

function getGraphicById(graphicsLayer, id) {
    // Tìm graphic vật thể trong map bằng id
    const graphicsArray = graphicsLayer.graphics.toArray();

    for (const g of graphicsArray) {
        if (g.attributes && g.attributes.id == id) {
            return g; // trả về Graphic có id khớp
        }
    }
    return null; // nếu không tìm thấy
}




const getPolygonOrientation = (wallPolygon) => {
    // Tìm hướng của Polygon
    console.log(wallPolygon.rings);
    const bottomLeft = wallPolygon.rings[0][0];
    const bottomRight = wallPolygon.rings[0][1];

    const dx = bottomRight[0] - bottomLeft[0]; // lon2 - lon1
    const dy = bottomRight[1] - bottomLeft[1]; // lat2 - lat1

    // atan2 tính góc radian từ trục X
    let angleRad = Math.atan2(dx, dy);

    // Đổi rad sang độ
    let angleDeg = angleRad * 180 / Math.PI;

    if (angleDeg < 0)
        angleDeg += 360;

    return angleDeg;
}