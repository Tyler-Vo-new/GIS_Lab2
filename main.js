require([
    "esri/Map",
    "esri/views/MapView",
    "esri/views/SceneView",
    "esri/layers/GeoJSONLayer",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/geometry/Mesh",
    "esri/geometry/Point",
], function (Map, MapView, SceneView, GeoJSONLayer, GraphicsLayer, Graphic, Mesh, Point) {
    const map = new Map({
        basemap: "topo-vector",
        ground: "world-elevation",
        // layers: [geojsonLayer]
    });

    const view = new SceneView({
        container: "viewDiv",
        map: map,
        camera: {
            position: [106.69900154581283, 10.775276832043538, 300],
            heading: 0,
            tilt: 60
        }
    });


    view.on("click", function (event) {
        const point = event.mapPoint;
        const lonDeg = point.longitude;
        const latDeg = point.latitude;

        // Đổi sang radian
        const lonRad = lonDeg * Math.PI / 180;
        const latRad = latDeg * Math.PI / 180;

        console.log("Longitude (deg):", lonDeg, "→ rad:", lonRad);
        console.log("Latitude (deg):", latDeg, "→ rad:", latRad);

        view.popup.open({
            title: "Tọa độ (radian)",
            content: `Longitude: ${lonDeg} rad<br>
                Latitude: ${latDeg} rad`,
            location: point
        });
    });

    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    fetch("./tuong.geojson")
        .then(res => res.json())
        .then(data => {
            data.features.forEach(feature => {
                var wallGraphic = null;
                if (feature.properties.id == "wall-013" || feature.properties.id == "wall-010") {
                    wallGraphic = createWallGraphic1(feature);
                    graphicsLayer.add(wallGraphic);
                } else if (["wall-005", "wall-020", "wall-021"].includes(feature.properties.id)) {
                    wallGraphic = createWallGraphic2(feature, 3);
                    graphicsLayer.add(wallGraphic);
                } else if (["wall-026", "wall-027"].includes(feature.properties.id)) {
                    wallGraphic = createWallGraphic2(feature, 2);
                    graphicsLayer.add(wallGraphic);
                }
                else {
                    wallGraphic = createWallGraphic(feature);
                    graphicsLayer.add(wallGraphic);
                }
            });

            // Đặt ngói cho tầng trệt trái
            const datNgoiTretTrai = (wall_id) => {
                const wall = getGraphicById(graphicsLayer, wall_id);
                const tretTrai_orientation = getLineBearing(wall.attributes.line[0], wall.attributes.line[1]);
                const tretTrai_coords = findNewPoint(wall.attributes.line[0], tretTrai_orientation - 90, 0.5)
                const tretTrai_point = new Point({
                    x: tretTrai_coords[0],
                    y: tretTrai_coords[1],
                    z: wall.attributes.baseZ + wall.attributes.height + 0.2
                })
                Mesh.createFromGLTF(tretTrai_point, "./3D_Models/maiNha/TangTretTrai.glb")
                    .then(function (geometry) {
                        geometry.scale(1, { origin: geometry.extent.center });
                        geometry.rotate(18, 0, tretTrai_orientation + 3.8);
                        const graphic = new Graphic({
                            geometry,
                            symbol: {
                                type: "mesh-3d",
                                symbolLayers: [{
                                    type: "fill",
                                    size: 10000
                                }]
                            }
                        });
                        graphicsLayer.add(graphic)
                    })
                    .catch(console.error);
            }

            // Đặt ngói cho tầng trệt phải
            const datNgoiTretPhai = (wall_id) => {
                const wall = getGraphicById(graphicsLayer, wall_id);
                const tretPhai_orientation = getLineBearing(wall.attributes.line[0], wall.attributes.line[1]);
                const tretPhai_coords = findNewPoint(wall.attributes.line[0], tretPhai_orientation + 90, 0.5)
                const tretPhai_point = new Point({
                    x: tretPhai_coords[0],
                    y: tretPhai_coords[1],
                    z: wall.attributes.baseZ + wall.attributes.height + 0.73
                })
                Mesh.createFromGLTF(tretPhai_point, "./3D_Models/maiNha/TangTretPhai.glb")
                    .then(function (geometry) {
                        geometry.scale(1, { origin: geometry.extent.center });
                        geometry.rotate(-28, 0, tretPhai_orientation + 3.8);
                        const graphic = new Graphic({
                            geometry,
                            symbol: {
                                type: "mesh-3d",
                                symbolLayers: [{
                                    type: "fill",
                                    size: 10000
                                }]
                            }
                        });
                        graphicsLayer.add(graphic)
                    })
                    .catch(console.error);
            }

            // Đặt ngói cho tầng trệt trái
            datNgoiTretTrai("wall-014")
            // Đặt ngói cho tầng một trái
            datNgoiTretTrai("wall-015")
            
            // Đặt ngói cho tầng trệt phải
            datNgoiTretPhai("wall-011")
            // Đặt ngói cho tầng một phải
            datNgoiTretPhai("wall-012")
            

// --- Gắn các linh kiện (Cửa sổ và Đồng hồ) lên tường ---
                const componentsToAttach = [
                    {
                        model: "./3D_Models/smallRoundWindow.glb",
                        scale: 0.3,
                        targets: [
                           { ids: ["wall-049", "wall-053"], qty: 1 },
                           {
                           ids: ["wall-001"],
                           qty: 1,
                           adjustments: {
                           windowOverrides: {
                           0: { heightFactor: 0.75 }
                           }
                           }},
                           {
                           ids: ["wall-006"],
                           qty: 1,
                           adjustments: {
                           windowOverrides: {
                           0: { heightFactor: 0.75 }
                            }
                           }}
                           ,
                           {
                           ids: ["wall-007"],
                           qty: 1,
                           adjustments: { offsetDist: 0.1,
                           windowOverrides: {
                           0: { heightFactor: 0.75 }
                           }
                           }}
                           ,
                           {
                           ids: ["wall-002"],
                           qty: 1,
                           adjustments: { offsetDist: -0.5,
                           windowOverrides: {
                           0: { heightFactor: 0.75 }
                           }
                           }}
                           ,
 {
                                                         ids: ["wall-051"],
                                                         qty: 1,
                                                         adjustments: { offsetDir: 90, offsetDist: 0.1,
                                                         headingRotation: 90,
                                                         windowOverrides: {
                                                         0: { heightFactor: 0.6 },

                                                         }
                                                         }
                                                         }
                           ,
{
                                                        ids: ["wall-052"],
                                                        qty: 1,
                                                        adjustments: { offsetDir: 90, offsetDist: -0.2,
                                                        headingRotation: -90,
                                                        windowOverrides: {
                                                        0: { heightFactor: 0.6 },

                                                        }
                                                        }
                                                        }
                           ,
{
                                                        ids: ["wall-050"],
                                                        qty: 1,
                                                        adjustments: { offsetDir: 90, offsetDist: -0.2,
                                                        headingRotation: 0,
                                                        windowOverrides: {
                                                        0: { heightFactor: 0.6 },

                                                        }
                                                        }
                                                        }
                           ,
                            {
                            ids: ["wall-012"],
                            qty: 6,
                            adjustments: { offsetDir: -20, offsetDist: -0.9,
                            windowOverrides: {
                             0: { heightFactor: 0.2 },
                             1: { heightFactor: 0.2 },
                             2: { heightFactor: 0.2 },
                             3: { heightFactor: 0.2 },
                             4: { heightFactor: 0.2 },
                             5: { heightFactor: 0.2 },
                            }
                             }
                            },
                            {
                            ids: ["wall-015"],
                            qty: 6,
                            adjustments: { offsetDir: -20, offsetDist: 0.5,
                             windowOverrides: {
                              0: { heightFactor: 0.2 },
                              1: { heightFactor: 0.2 },
                              2: { heightFactor: 0.2 },
                              3: { heightFactor: 0.2 },
                              4: { heightFactor: 0.2 },
                              5: { heightFactor: 0.2 },
                              }
                             }
                            },

                            {
                                                        ids: ["wall-027"],
                                                        qty: 1,
                                                        adjustments: { offsetDir: -20, offsetDist: 0.2,
                                                        windowOverrides: {
                                                        0: { heightFactor: 0.4 },


                                                        }
                                                        }
                                                        }
                            ,
{
                                                        ids: ["wall-027"],
                                                        qty: 1,
                                                        adjustments: { offsetDir: -20, offsetDist: 0.2,
                                                        windowOverrides: {
                                                        0: { heightFactor: 0.75 },


                                                        }
                                                        }
                                                        }
                            ,
 {
                                                        ids: ["wall-026"],
                                                        qty: 1,
                                                        adjustments: { offsetDir: 90, offsetDist: 0.2,
                                                        windowOverrides: {
                                                        0: { heightFactor: 0.4 },


                                                        }
                                                        }
                                                        }
                            ,
{
                                                        ids: ["wall-026"],
                                                        qty: 1,
                                                        adjustments: { offsetDir: 90, offsetDist: 0.2,
                                                        windowOverrides: {
                                                        0: { heightFactor: 0.75 },


                                                        }
                                                        }
                                                        }
                            ,
                            {
                            ids: ["wall-021"],
                            qty: 2,
                            adjustments: { offsetDir: -20, offsetDist: 0.2,
                            windowOverrides: {
                            0: { heightFactor: 0.4 },
                            1: { heightFactor: 0.4 },
                            }
                            }
                            },
                            {
                            ids: ["wall-020"],
                            qty: 2,
                            adjustments: { offsetDir: -20, offsetDist: -0.6,
                            windowOverrides: {
                            0: { heightFactor: 0.4 },
                            1: { heightFactor: 0.4 },
                            }
                            }
                            }
                            ,
                            {
                            ids: ["wall-044"],
                            qty: 3,
                            adjustments: { offsetDir: 90, offsetDist: 0.1,
                            headingRotation: 45,
                            windowOverrides: {
                            0: { heightFactor: 0.3 },
                            1: { heightFactor: 0.3 },
                            2: { heightFactor: 0.3 },
                            }
                            }
                            },
                                                        {
                                                        ids: ["wall-045"],
                                                        qty: 3,
                                                        adjustments: { offsetDir: 90, offsetDist: 0.1,
                                                        headingRotation: 110,
                                                        windowOverrides: {
                                                        0: { heightFactor: 0.3 },
                                                        1: { heightFactor: 0.3 },
                                                        2: { heightFactor: 0.3 },
                                                        }
                                                        }
                                                        },
{
                                                        ids: ["wall-047"],
                                                        qty: 3,
                                                        adjustments: { offsetDir: 90, offsetDist: 0.1,
                                                        headingRotation: 75,
                                                        windowOverrides: {
                                                        0: { heightFactor: 0.3 },
                                                        1: { heightFactor: 0.3 },
                                                        2: { heightFactor: 0.3 },
                                                        }
                                                        }
                                                        },
{
                                                        ids: ["wall-048"],
                                                        qty: 3,
                                                        adjustments: { offsetDir: 90, offsetDist: 0.1,
                                                        headingRotation: 150,
                                                        windowOverrides: {
                                                        0: { heightFactor: 0.3 },
                                                        1: { heightFactor: 0.3 },
                                                        2: { heightFactor: 0.3 },
                                                        }
                                                        }
                                                        }
                        ]
                    },
                    {
                        model: "./3D_Models/roseWindow.glb",
                        scale: 0.1,
                        targets: [
                                                   {ids: ["wall-005"],
                                                   qty: 1,
                                                   adjustments: { lineOffset: -3.5, offsetDir: 90, offsetDist: -1,
                                                   headingRotation: 180,
                                                   windowOverrides: {
                                                   0: { heightFactor: 0.7 }
                                                   }
                                                   }},
                                                   {ids: ["wall-020"],
                                                   qty: 1,
                                                   adjustments: { lineOffset: -3.5, offsetDir: 90, offsetDist: -1.2,
                                                   headingRotation: 0,
                                                   windowOverrides: {
                                                   0: { heightFactor: 0.75 }
                                                   }
                                                   }},
                                                   {ids: ["wall-021"],
                                                   qty: 1,
                                                   adjustments: { lineOffset: 3.5, offsetDir: 90, offsetDist: 1.4,
                                                   headingRotation: 180,
                                                   windowOverrides: {
                                                   0: { heightFactor: 0.75 }
                                                   }
                                                   }}
                        ]
                    },
                    {
                        model: "./3D_Models/wall_clock.glb",
                        scale: 0.008,
                        targets: [
                        {
                                                   ids: ["wall-005"],
                                                   qty: 1,
                                                   adjustments: { offsetDir: 90, offsetDist: 0.1,
                                                   headingRotation: 180,
                                                   windowOverrides: {
                                                   0: { heightFactor: 0.9 }
                                                   }
                                                   }}
                        ]
                    }
                ];

                const attachComponentToWall = (wallId, modelPath, quantity, scaleFactor, heightFactor = 0.6, adjustments = {}) => {
                    const wall = getGraphicById(graphicsLayer, wallId);
                    if (!wall) return;

                    const line = wall.attributes.line;
                    const baseZ = wall.attributes.baseZ;
                    const height = wall.attributes.height;
                    const orientation = getLineBearing(line[0], line[1]);


//                    const offsetDir = adjustments.offsetDir !== undefined ? adjustments.offsetDir : 90;
//                    const offsetDist = adjustments.offsetDist !== undefined ? adjustments.offsetDist : 0.1;


                    for (let i = 0; i < quantity; i++) {

                    const windowOverride = (adjustments.windowOverrides && adjustments.windowOverrides[i]) || {};

                    const finalOffsetDir = windowOverride.offsetDir !== undefined ? windowOverride.offsetDir : (adjustments.offsetDir !== undefined ? adjustments.offsetDir : 90);
                    const finalOffsetDist = windowOverride.offsetDist !== undefined ? windowOverride.offsetDist : (adjustments.offsetDist !== undefined ? adjustments.offsetDist : 0.1);
                    const finalHeightFact = windowOverride.heightFactor !== undefined ? windowOverride.heightFactor : heightFactor;
                    const finalHeadingRot = windowOverride.headingRotation !== undefined ? windowOverride.headingRotation : (adjustments.headingRotation !== undefined ? adjustments.headingRotation : 0);
                    const finalLineOffset = windowOverride.lineOffset !== undefined ? windowOverride.lineOffset : (adjustments.lineOffset !== undefined ? adjustments.lineOffset : 0);


                    const fraction = (i + 1) / (quantity + 1);
                    const dist = (distanceBetweenCoords(line[0], line[1]) * fraction) + finalLineOffset;

                        let pos = findNewPoint(line[0], orientation, dist);
                        // Đẩy nhẹ ra khỏi mặt tường (0.1m) để không bị z-fighting
                        pos = findNewPoint(pos, orientation + finalOffsetDir, finalOffsetDist);

                        const point = new Point({
                            x: pos[0],
                            y: pos[1],
                            z: baseZ + (height * finalHeightFact)
                        });

                        Mesh.createFromGLTF(point, modelPath)
                            .then(function (geometry) {
                                geometry.scale(scaleFactor, { origin: point });
                                geometry.rotate(0, 0, orientation + finalHeadingRot);

                                const graphic = new Graphic({
                                    geometry,
                                    symbol: {
                                        type: "mesh-3d",
                                        symbolLayers: [{ type: "fill" }]
                                    }
                                });
                                graphicsLayer.add(graphic);
                            })
                            .catch(console.error);
                    }
                };

                componentsToAttach.forEach(comp => {
                    let hFact = 0.6;
                    // Tinh chỉnh độ cao cho Rose Window và Đồng hồ để nằm đúng vị trí kiến trúc
                    if (comp.model.includes("roseWindow")) hFact = 0.75;
                    if (comp.model.includes("wall_clock")) hFact = 0.88;

                    comp.targets.forEach(target => {
                        target.ids.forEach(id => {
                            attachComponentToWall(id, comp.model, target.qty, comp.scale, hFact, target.adjustments);
                        });
                    });
                });

//// --- TEST BLOCK: Debugging GLB Models ---
//                const testPoint = new Point({
//                    x: 106.6993, // Close to the Cathedral front
//                    y: 10.7795,
//                    z: 20        // Floating 20m in the air so it's visible
//                });
//
//                // --- TEST BLOCK: Debugging GLB Models with Scaling ---
//                                const testPointBase = { x: 106.6993, y: 10.7795, z: 20 };
//
//                                // Test smallRoundWindow - testing with a large scale of 10
//                                Mesh.createFromGLTF(new Point({ ...testPointBase, x: 106.6993 }), "./3D_Models/smallRoundWindow.glb")
//                                    .then(geom => {
//                                        geom.scale(0.5, { origin: geom.extent.center }); // Thử scale lớn gấp 10 lần
//                                        // geom.rotate(90, 0, 0); // Bỏ comment nếu nó đang nằm bẹp dưới đất
//                                        graphicsLayer.add(new Graphic({
//                                            geometry: geom,
//                                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", material: { color: "red" } }] }
//                                        }));
//                                        console.log("Small Window (Red) loaded with scale 10");
//                                    }).catch(e => console.error("Small Window Error:", e));
//
//                                // Test roseWindow - testing with a huge scale of 50
//                                Mesh.createFromGLTF(new Point({ ...testPointBase, x: 106.6995 }), "./3D_Models/roseWindow.glb")
//                                    .then(geom => {
//                                        geom.scale(0.1, { origin: geom.extent.center }); // Thử scale cực lớn
//                                        graphicsLayer.add(new Graphic({
//                                            geometry: geom,
//                                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", material: { color: "blue" } }] }
//                                        }));
//                                        console.log("Rose Window (Blue) loaded with scale 50");
//                                    }).catch(e => console.error("Rose Window Error:", e));
//
//                                // Test clock - standard scale for comparison
//                                Mesh.createFromGLTF(new Point({ ...testPointBase, x: 106.6997 }), "./3D_Models/wall_clock.glb")
//                                    .then(geom => {
//                                        geom.scale(0.005, { origin: geom.extent.center });
//                                        graphicsLayer.add(new Graphic({
//                                            geometry: geom,
//                                            symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill" }] }
//                                        }));
//                                        console.log("Clock loaded with scale 1");
//                                    }).catch(e => console.error("Clock Error:", e))

            // Vẽ trụ tròn đỡ tượng
            const pedestal = new Graphic({
                geometry: {
                    type: "point",
                    x: 106.69934135984347,
                    y: 10.779468952965884,
                    z: 9
                },
                symbol: {
                    type: "point-3d",
                    symbolLayers: [{
                        type: "object",
                        resource: { primitive: "cylinder" },
                        width: 5.5, // Đường kính trụ
                        height: 1.6, // Chiều cao từ 9m lên 10.2m
                        anchor: "bottom",
                        material: { color: "grey" }
                    }]
                }
            });
            graphicsLayer.add(pedestal);

            // Đặt tượng Đức mẹ bằng Mesh
            const mariaStatue = new Point({
                x: 106.69933635984347,
                y: 10.779468952965884,
                z: 10.2,
            })

            const mariaStatue_orientation = getPolygonOrientation(getGraphicById(graphicsLayer, "wall-005").attributes.polygon);

            Mesh.createFromGLTF(mariaStatue, "./3D_Models/maria_immaculata.glb")
                .then(function (geometry) {
                    geometry.scale(10, { origin: mariaStatue })
                    geometry.rotate(0, 0, mariaStatue_orientation);
                    const graphic = new Graphic({
                        geometry,
                        symbol: {
                            type: "mesh-3d",
                            symbolLayers: [{
                                type: "fill",
                                size: 10000
                            }]
                        }
                    });
                    graphicsLayer.add(graphic)
                })
                .catch(console.error);
            
            // Tìm kiếm các điểm 
            const wall = getGraphicById(graphicsLayer, "wall-008");
            const wall_line = wall.attributes.line
            const o = getPolygonOrientation(wall.attributes.polygon) - 90;
            console.log(findNewPoint(
                [
                    106.69926887393719,
                    10.779610252606249
                ]
                , o, 0.5));
            
            // const w30 = getGraphicById(graphicsLayer, 'wall-028');
            // const w31 = getGraphicById(graphicsLayer, 'wall-029');
            // const d = distanceBetweenCoords(w30.attributes.line[1], w31.attributes.line[1]);
            // const center = findNewPoint(
            //     w30.attributes.line[1],
            //     getLineBearing(w30.attributes.line[1], w31.attributes.line[1]),
            //     d/2
            // )
            // var tmp = w30.attributes.line[1]
            // for (i = 0; i < 5; i++) {
            //     var point = findNewPoint(center, getLineBearing(center, tmp) - 36, d / 2)
            //     console.log(point);
            //     tmp = point;
            // }
        });

    
});