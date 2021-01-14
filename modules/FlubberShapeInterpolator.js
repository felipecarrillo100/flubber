const flubber = require("flubber"); // Node classic

class FlubberShapeInterpolator {
    constructor(options) {
        options = options ? options : {};
        this.shapes = options.shapes;
        this.geometryType= options.geometryType ? options.geometryType : "Polygon";
        this.index = 0;
        this.interpolator = flubber.interpolate(this.shapes[this.index].coordinates, this.shapes[(this.index+1) % this.shapes.length].coordinates, {string: false});
    }

    toggleShape(index) {
        if (typeof index == "undefined") {
           this.index = (this.index + 1) % this.shapes.length;
        } else {
           this.index = (index) % this.shapes.length;
        }
        this.interpolator = flubber.interpolate(this.getCurrentShape().coordinates, this.getNextShape().coordinates, {string: false});
    };

    getInterpolatedShape(ratio) {
        const geometry = this.interpolator(ratio);
        let coordinates = geometry;
        if (this.geometryType == "Polygon") {
            coordinates = [geometry]
        }
        const shape = {
                "type": this.geometryType,
                "coordinates": coordinates
        }
        return shape;
    }

    getCurrentShape() {
        return this.shapes[this.index];
    }
	
	getNextShape() {
        return this.shapes[(this.index+1) % this.shapes.length];
    }

}

module.exports = FlubberShapeInterpolator;
