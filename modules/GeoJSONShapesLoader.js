'use strict';

const fs = require('fs');

class GeoJSONShapesLoader {
    constructor(file, labelProperty) {
        this.labelProperty = labelProperty ? labelProperty : "STATE_NAME";
        this.filename = file;
    }

    load() {
        return new Promise((resolve)=>{
            fs.readFile(this.filename, (err, data) => {
                if (err) throw err;
                const featureCollection = JSON.parse(data);
                const json = featureCollection.features.map((feature => {
                    let coordinates = feature.geometry.type == "Multipoligon" ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates[0];
                    if (coordinates.length===1) coordinates=coordinates[0];
                    return {
                        name: feature.properties[this.labelProperty],
                        coordinates: coordinates
                    }
                }))
                resolve(json)
            });
        });
    }
}

module.exports = GeoJSONShapesLoader;
