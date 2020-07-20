define(["math/v3"], function(v3) {

    function Cylinder(gl, ht, r0, r1, segments) {
        var v = [];
        var n = [];

        var tv = [ 0, 0, 0];

        for (var i=0 ; i <= segments ; ++i) {
            var a = 2 * Math.PI * (i / segments);
            var s = Math.sin(a);
            var c = Math.cos(a);
            var av = [r0*c, r1*s, 0];

            v.push(r0*c, r0*s, 0, r1*c, r1*s, ht);

            var dv = [ (r1 - r0) * c,
                       (r1 - r0) * s,
                       ht ];

            v3.cross(tv, av, dv);
            v3.cross(tv, dv, tv);
            n.push.apply(n, tv);
            n.push.apply(n, tv);
        }

        var nBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(n), gl.STATIC_DRAW);

        var vBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);

        this.nVerts = v.length / 3;
        this.normals = nBuf;
        this.vertexes = vBuf;
    }

    Cylinder.prototype = {
        draw : function (gl, shader) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexes);
            gl.vertexAttribPointer(shader.attributes.position, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
            gl.vertexAttribPointer(shader.attributes.normal, 3, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.nVerts);
        }
    };

    return Cylinder;
});
