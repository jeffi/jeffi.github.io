define(["KDNode", "math/v2", "math/v3"], function(Node, v2, v3) {


    function RLKDTree2Sphere(points) {
        var min = new Float64Array(3);
        var max = new Float64Array(3);

        function build(points) {
            var n = points.length;

            if (!n) {
                return null;
            }

            if (n === 1) {
                return Node.leaf(points[0]);
            }

            v3.fill(min, Infinity);
            v3.fill(max,-Infinity);

            for (var i=0 ; i<n ; ++i) {
                var pt = points[i];
                v3.min(min, min, pt);
                v3.max(max, max, pt);
            }
            v3.sub(min, max, min);
            var splitAxis = v3.maxCoeff(min);

            points.sort(function(a, b) {
                return a[splitAxis] - b[splitAxis];
            });

            var mp = n>>1;

            return Node.branch(
                splitAxis,
                points[mp][splitAxis],
                build(points.slice(0, mp)),
                build(points.slice(mp, n)));
        }
        
        this.root = build(points.slice());
    }

    RLKDTree2Sphere.prototype = {
        
    };

    return RLKDTree2Sphere;
});
