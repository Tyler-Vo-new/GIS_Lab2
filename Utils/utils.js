const toRad = deg => deg * Math.PI / 180;
const toDeg = rad => rad * 180 / Math.PI;

const generateNewPoint = (coord, bearing, distance) => {
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