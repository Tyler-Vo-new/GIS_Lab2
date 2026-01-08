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
    // console.log(wallPolygon);
    const bottomLeft = wallPolygon[0];
    const bottomRight = wallPolygon[1];

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


// dịch điểm theo bearing + distance (m)
function offsetPoint(coord, bearing, distance) {
    const R = 6378137;
    const δ = distance / R;
    const θ = toRad(bearing);

    const φ1 = toRad(coord[1]);
    const λ1 = toRad(coord[0]);

    const φ2 = Math.asin(
        Math.sin(φ1) * Math.cos(δ) +
        Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
    );

    const λ2 = λ1 + Math.atan2(
        Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

    return [toDeg(λ2), toDeg(φ2)];
}

// hướng của LineString
function getLineBearing(p0, p1) {
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    let angle = Math.atan2(dx, dy) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
}

// Hàm tính khoảng cách giữa hai Point
function distanceBetweenCoords(coord1, coord2) {
    const R = 6378137; // bán kính Trái Đất (m)
    const φ1 = toRad(coord1[1]);
    const φ2 = toRad(coord2[1]);
    const Δφ = toRad(coord2[1] - coord1[1]);
    const Δλ = toRad(coord2[0] - coord1[0]);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // khoảng cách (m)
}

function divideWallLine(feature, n) {
    const [[x1, y1], [x2, y2]] = feature.geometry.coordinates;

    const dx = (x2 - x1) / n;
    const dy = (y2 - y1) / n;

    const points = [];
    for (let i = 0; i <= n; i++) {
        points.push([x1 + dx * i, y1 + dy * i]);
    }

    return points; // mảng gồm n+1 điểm chia đều trên cạnh tường
}
