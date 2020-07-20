define(["math/v2", "math/v3"], function(v2, v3) {
    var abs = Math.abs;

    // TODO: import and use KDNode instead

    function Node() {
    }

    Node.prototype = {
        point : null,
        axis : null,
        split : null,
        left : null,
        right : null,
    };

    function distance(a, b) {
        return Math.acos(Math.abs(v3.dot(a, b)));
    }

    function createLeaf(pt) {
        var node = new Node();
        node.point = pt;
        return node;
    }

    function createBranch(axis, split, left, right) {
        if (!left || !right) throw new Error();
        var node = new Node();
        node.axis = axis;
        node.split = split;
        node.left = left;
        node.right = right;
        return node;
    }

    function ptSurface(pt) {
        var i = Math.abs(pt[0]) > Math.abs(pt[1]) ? 0 : 1
        return Math.abs(pt[2]) > Math.abs(pt[i]) ? 2 : i;
    }

    function axisValue(v, vol, axis) {
        var x = -v[(vol + axis + 1) % 3];
        var y = v[vol];
        var s = 1 / Math.sqrt(x*x + y*y);
        if (y < 0) { s = -s; }
        return [x*s, y*s];
    }

    function kdBuild(points, vol) {
        var n = points.length;
        if (n === 0) {
            return null;
        }

        if (n === 1) {
            return createLeaf(points[0]);
        }

        var min = [ [ 1, 0], [ 1, 0] ];
        var max = [ [-1, 0], [-1, 0] ];

        for (var i=0 ; i<n ; ++i) {
            for (var ax = 0 ; ax<2 ; ++ax) {
                var v = axisValue(points[i], vol, ax); // TODO
                if (v[0] < min[ax][0]) {
                    min[ax] = v;
                }
                if (max[ax][0] < v[0]) {
                    max[ax] = v;
                }
            }
        }

        var r0 = min[0][0] * max[0][0] + min[0][1] * max[0][1];
        var r1 = min[1][0] * max[1][0] + min[1][1] * max[1][1];

        var splitAxis = (r0 < r1) ? 0 : 1;

        // Note: efficient implementations would use a partial sort
        // here (e.g. std::nth_element).
        points.sort(function(a, b) {
            return axisValue(a, vol, splitAxis)[0] - axisValue(b, vol, splitAxis)[0];
        });

        // 3 >> 1 == 1 [0][1 2]
        // 4 >> 1 == 2 [0 1][2 3]
        var mid = n >> 1;
        // var splitValue = (n&1)
        //     ? axisValue(points[mid], vol, splitAxis) // odd == exact point
        //     : meanValue(points[mid-1], points[mid], vol, splitAxis);

        // Note: efficient implementations would not create copies of
        // the points array (unfortunately we cannot sort part of an
        // array using builtin methods, so there's no point trying to
        // be more efficient here).
        return createBranch(
            splitAxis,
            axisValue(points[mid], vol, splitAxis),
            kdBuild(points.slice(0, mid), vol),
            kdBuild(points.slice(mid, n), vol));
    }

    function KDTree2Sphere(points) {
        this.volumes = new Array(3);
        for (var vol=0 ; vol<3 ; ++vol) {
            this.volumes[vol] = kdBuild(points.filter(function(pt) {
                return ptSurface(pt) == vol;
            }), vol);
        }
    }

    KDTree2Sphere.prototype = {
        nearest : function (pt, callback) {
            var ptVol = ptSurface(pt);
            var vol = ptVol;
            var nearest = null;
            var distToNearest = Infinity;

            if (this.volumes[vol]) {
                search(this.volumes[vol]);
            }

            var r2 = 0.70710678118655;

            for (var i=0 ; i<2 ; ++i) {
                if (this.volumes[vol]) {
                    vol = (ptVol + i) % 3;
                    var dp = Math.min(Math.abs(pt[vol] * r2 - pt[ptVol] * r2),
                                      Math.abs(pt[vol] * r2 + pt[ptVol] * r2));
                    if (Math.asin(dp) < distToNearest) {
                        search(this.volumes[vol]);
                    }
                }
            }

            function search(n) {
                if (n.point) {
                    if (callback) callback(n);

                    var d = distance(n.point, pt);
                    if (d < distToNearest) {
                        nearest = n;
                        distToNearest = d;
                    }
                    return;
                }

                var dq = pt[vol] * n.split[0] + pt[(vol + n.axis + 1)%3] * n.split[1];
                if (pt[vol] < 0) {
                    dq = -dq;
                }

                search(dq > 0 ? n.left : n.right);

                if (Math.asin(Math.abs(dq)) < distToNearest) {
                    search(dq > 0 ? n.right : n.left);
                }
            }

            return nearest;
        }
    };

    return KDTree2Sphere;
});
