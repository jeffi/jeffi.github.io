define(["math/v3"], function(v3) {

    var arcEps = Math.cos(1 * Math.PI / 180);

    function makeArc(gl, xi, r, a, b) {
        var verts = [];
        var yi = (xi+1)%3;
        var zi = (xi+2)%3;

        function subdivide(v0, v1) {
            var dot = v0[0]*v1[0] + v0[1]*v1[1] + v0[2]*v1[2];

            if (dot > arcEps)
                return;

            var y = v0[yi] + v1[yi];
            var z = v0[zi] + v1[zi];

            var s = r / Math.sqrt(y*y + z*z);

            var vm = new Array(3);
            vm[xi] = v0[xi];
            vm[yi] = y*s;
            vm[zi] = z*s;

            subdivide(v0, vm);
            verts.push.apply(verts, vm);
            subdivide(vm, v1);
        }

        verts.push.apply(verts, a);
        subdivide(a, b);
        verts.push.apply(verts, b);

        var vBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

        return {
            buffer : vBuf,
            nVerts : verts.length / 3
        };
    }

    function RLKDTree2SphereGeom(gl, tree) {
        var splits = [];

        function buildNodeGeom(n, min, max, depth) {
            if (n.point || depth > 100) {
                return;
            }

            var xi = n.axis,
                yi = (xi + 1) % 3,
                zi = (xi + 2) % 3,

                xv = n.split,

                r2 = Math.max(0, 1 - xv*xv),
                r = Math.sqrt(r2),

                miny = Math.max(-r, min[yi]),
                minz = Math.max(-r, min[zi]),

                maxy = Math.min( r, max[yi]),
                maxz = Math.min( r, max[zi]);

            function makePoint(y, z, ySide, zSide) {
                if (z > maxz) {
                    z = maxz;
                    y = ySide * Math.sqrt(r2 - z*z);
                }
                if (z < minz) {
                    z = minz;
                    y = ySide * Math.sqrt(r2 - z*z);
                }
                if (y > maxy) {
                    y = maxy;
                    z = zSide * Math.sqrt(r2 - y*y);
                }
                if (y < miny) {
                    y = miny;
                    z = zSide * Math.sqrt(r2 - y*y);
                }

                if (miny <= y && y <= maxy &&
                    minz <= z && z <= maxz)
                {
                    var v = new Float64Array(3);
                    v[xi] = xv;
                    v[yi] = y;
                    v[zi] = z;
                    return v;
                }
            }

            function clipArc(ySide, zSide) {
                var a = makePoint(0, r*zSide, ySide, zSide);
                var b = makePoint(r*ySide, 0, ySide, zSide);
                if (a && b &&
                    a[zi] * zSide > b[zi] * zSide &&
                    a[yi] * ySide < b[yi] * ySide)
                {
                    splits.push(makeArc(gl, xi, r, a, b));
                }
            }

            clipArc( 1, 1);
            clipArc( 1,-1);
            clipArc(-1,-1);
            clipArc(-1, 1);

            ++depth;
            if (n.left) {
                var tmax = max.slice();
                tmax[xi] = xv;
                buildNodeGeom(n.left, min, tmax, depth);
            }
            if (n.right) {
                var tmin = min.slice();
                tmin[xi] = xv;
                buildNodeGeom(n.right, tmin, max, depth);
            }
        }

        if (tree.root) {
            buildNodeGeom(tree.root, [-1, -1, -1], [ 1, 1, 1], 0);
        }

        this.tree = tree;
        this.splits = splits;
    }

    RLKDTree2SphereGeom.prototype = {
        draw : function (gl, shader) {
            this.splits.forEach(function(split) {
                gl.bindBuffer(gl.ARRAY_BUFFER, split.buffer);
                gl.vertexAttribPointer(shader.attributes.position, 3, gl.FLOAT, false, 0, 0);
                gl.drawArrays(gl.LINE_STRIP, 0, split.nVerts);
            });
        }
    };


    return RLKDTree2SphereGeom;
});
