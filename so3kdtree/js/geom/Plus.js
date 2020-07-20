define(["math/v3"], function(v3) {
    function Plus(gl, innerWidth, outerWidth, depth) {
        //     0 1
        //  11 +-+ 2
        //10 +-+ +-+ 3
        // 9 +-+ +-+ 4
        //   8 +-+ 5
        //     7 6
        

        var x0 = innerWidth/2;
        var x1 = outerWidth/2;
        var z = depth/2;

        var v = [
           -x0, x1, z, // 0
            x0, x1, z, // 1
            x0, x0, z, // 2
            x1, x0, z, // 3
            x1,-x0, z, // 4
            x0,-x0, z, // 5
            x0,-x1, z, // 6
           -x0,-x1, z, // 7
           -x0,-x0, z, // 8
           -x1,-x0, z, // 9
           -x1, x0, z, // 10
           -x0, x0, z, // 11
        ];
        for (var i=0 ; i<12 ; ++i) {
            v.push(v[i*3], v[i*3+1], -v[i*3+2]);
        }

        var idx = [
            0, 1, 2,
            0, 2, 11,
            11, 2, 5,
            11, 5, 9,
            10, 11, 8,
            10, 8, 9,
            2, 3, 4,
            2, 4, 5,
            8, 5, 6,
            8, 6, 7,
        ];
        for (var i=0 ; i<10 ; ++i) {
            idx.push(idx[i*3],
                     idx[i*3+2],
                     idx[i*3+1]);
        }
        for (var i=0 ; i<12 ; ++i) {
            var j = (i+1)%12;
            idx.push(i, j, j+12,
                     i, j+12, i+12);
        }

        var vBuf = this.vBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
        
        var iBuf = this.iBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    }

    Plus.prototype = {
        draw : function (gl) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuf);
            gl.vertexAttribPointer(shader.attributes.position, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuf);
            gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
        }
    };
});
