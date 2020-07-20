define([
    "gl/util",
    "math/m4",
    "math/m3",
    "math/v3",
    "math/v4",
    "math/q4",
    "math/arc4random",
    "m4stack",
    "shader/LineShader",
    "shader/SurfaceShader",
    "shader/BlendedShader",
    "shader/PointShader",
    "KDTree2Sphere",
    "KDTree2SphereGeom",
    "RLKDTree2Sphere",
    "RLKDTree2SphereGeom",
    "geom/Sphere",
    "geom/Cylinder",
    "geom/PointCloud",
    "upload-canvas-image",
    "jquery"
], function(
    glUtil,
    m4,
    m3,
    v3,
    v4,
    q4,
    arc4,
    M4Stack,
    LineShader,
    SurfaceShader,
    BlendedShader,
    PointShader,
    KDTree2Sphere,
    KDTree2SphereGeom,
    RLKDTree2Sphere,
    RLKDTree2SphereGeom,
    Sphere,
    Cylinder,
    PointCloud,
    uploadCanvasImage,
    $
) {
    var NUM_POINTS = 1024*3; // for slides was: 64*3;

    arc4.seed(2);

    function KDTreeDemo(canvas) {
        this.canvas = canvas;
        var gl = glUtil.getGLContext(canvas, {
            preserveDrawingBuffer : true,
            antialias : true
        });
        this.gl = gl;

        console.log(gl);

        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        // gl.enable(gl.CULL_FACE);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.surfaceShader = new SurfaceShader(gl);
        this.blendedShader = new BlendedShader(gl);
        this.lineShader = new LineShader(gl);
        this.pointShader = new PointShader(gl);

        console.log(this.surfaceShader);

        this.modelView = new Float32Array(16);
        this.projection = new Float32Array(16);
        this.normalMatrix = new Float32Array(9);
        this.sphere = new Sphere(gl, 4, 1.0);
        this.searchPoint = new Sphere(gl, 2, 0.03);
        this.axisCylinder = new Cylinder(gl, 1.1, 0.03, 0.03, 16);
        this.axisHead = new Cylinder(gl, 0.1, 0.05, 0, 16);

        var kdPoints = [];
        for (var i=0 ; i<NUM_POINTS ; ++i) {
            var pt = new Float32Array(3);
            v3.randomUnit(pt, arc4.random);
            kdPoints.push(pt);
        }

        this.mvStack = new M4Stack();
        this.mvp = new Float64Array(16);
        this.inv = new Float64Array(16);
        this.searchPt = new Float64Array(4);

        var kdTree = new KDTree2Sphere(kdPoints);
        this.kdTreeGeom = new KDTree2SphereGeom(gl, kdTree);

        var rlKdTree = new RLKDTree2Sphere(kdPoints);
        this.rlKdTreeGeom = new RLKDTree2SphereGeom(gl, rlKdTree);
        console.log(this.rlKdTreeGeom);

        this.pointCloud = new PointCloud(gl, kdPoints);

        $(canvas).mousedown(this.onMouseDown.bind(this));
    }

    KDTreeDemo.prototype = {
        drawMode : "animate", // "once", "animate", or "upload"
        drawKDTree : 3, // bit 1 = front side, bit 2 = inverted too
        kdTreeDrawOptions : {
            volumes: [0,1,2], // 0,1,2], // which surface volumes to draw
            borders: [], // which borders to draw (only needed for volumes not drawn)
        },
        drawKDTreeSearch : true,
        drawRLKDTree : false,
        drawPoints : true,
        drawAntipodalPoints : true,
        animationFrames : 1,
        animationStep : 1 * Math.PI / 180,
        rotation : 30 * Math.PI / 180,

        onMouseDown : function(evt) {
            var x = evt.offsetX,
                y = evt.offsetY;
            console.log("Mouse down", x, y);

            var modelView = this.modelView;
            this.initialTransform(modelView);
            //var mvp = this.mvp;
            //m4.mul(mvp, this.projection, modelView);
            var inv = this.inv;
            m4.invert(inv, modelView);

            var pt = this.searchPt;
            var f = 1/Math.tan(20 * Math.PI / 180);
            var xt = (x * 2.0 / canvas.width - 1) * canvas.height / canvas.width / f;
            var yt = (y *-2.0 / canvas.height + 1) / f;
            pt[0] = xt;
            pt[1] = yt;
            pt[2] = -4;
            pt[3] = 1;
            // var s = pt[0] * pt[0] + pt[1] * pt[1];
            // if (s > 1) {
            //     s = 1 / Math.sqrt(s);
            //     pt[0] *= s;
            //     pt[1] *= s;
            //     pt[2] = -4;
            // } else {
            //     pt[2] = Math.sqrt(1 - s) - 4;
            // }
            // pt[3] = 1;

            v4.m4transform(pt, inv, pt);
            // pt[0] = inv[12];
            // pt[1] = inv[13];
            // pt[2] = inv[14];
            
            v3.normalize(pt, pt);

            console.log(pt[0], pt[1], pt[2], pt[3]);

            // x*x + y*y + z*z = 1
            // x

            // offsetX, offsetY = pixel in canvas
            // pageX, pageY = pixel in view (for relative dragging)
        },

        initialTransform : function(modelView) {
            m4.identity(modelView);
            m4.translate(modelView, modelView, 0, 0, -4);
            m4.rotate(modelView, modelView, 1,1,1, this.rotation);
            m4.rotateZ(modelView, modelView, Math.PI/2);
        },

        drawScene : function() {
            var canvas = this.canvas;
            var gl = this.gl;

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var projection = this.projection;
            m4.perspective(projection, 20 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);

            var normalMatrix = this.normalMatrix;
            var modelView = this.modelView;
            this.initialTransform(modelView);
            // console.log(modelView);

            var shader = this.lineShader;
            gl.useProgram(shader.program);
            gl.lineWidth(5.0);

            // Draw the KD-Tree splits
            this.mvStack.nest(modelView, function() {
                m4.scale(modelView, modelView, 1.01);
                gl.enableVertexAttribArray(shader.attributes.position);
                gl.uniformMatrix4fv(shader.uniforms.modelView, false, modelView);
                gl.uniformMatrix4fv(shader.uniforms.projection, false, projection);

                if (this.drawRLKDTree) {
                    gl.uniform3f(shader.uniforms.color, 0, 0.5, 0);
                    this.rlKdTreeGeom.draw(gl, shader);
                }

                if (this.drawKDTree & 1) {
                    gl.uniform3f(shader.uniforms.color, 0, 0.0, 0.5);
                    this.kdTreeGeom.draw(gl, shader, this.kdTreeDrawOptions);
                }
                if (this.drawKDTree & 2) {
                    m4.scale(modelView, modelView, -1);
                    gl.uniformMatrix4fv(shader.uniforms.modelView, false, modelView);
                    this.kdTreeGeom.draw(gl, shader, this.kdTreeDrawOptions);
                }
            }.bind(this));


            var shader = this.surfaceShader;
            gl.useProgram(shader.program);
            // Draw the axis
            this.mvStack.nest(modelView, function() {
                gl.enableVertexAttribArray(shader.attributes.position);
                gl.enableVertexAttribArray(shader.attributes.normal);
                gl.uniformMatrix4fv(shader.uniforms.projection, false, projection);
                this.drawAxis(shader, 0,0,1);
                m4.rotateX(modelView, modelView, -Math.PI/2);
                this.drawAxis(shader, 0,1,0);
                m4.rotateY(modelView, modelView, Math.PI/2);
                this.drawAxis(shader, 1,0,0);
            }.bind(this));

            // draw the searched leaves
            if (this.drawKDTreeSearch) {
                gl.uniform3f(shader.uniforms.color, 0.2, 0.2, 0.2);

                var inv = this.inv;
                m4.invert(inv, modelView);
                var pt = this.searchPt;
                pt[0] = inv[12];
                pt[1] = inv[13];
                pt[2] = inv[14];
                v3.normalize(pt, pt);

                this.mvStack.nest(modelView, function() {
                    m4.translate(modelView, modelView, pt[0], pt[1], pt[2]);
                    // m4.translate(modelView, modelView, 0, 0, 1.05);
                    gl.uniformMatrix4fv(shader.uniforms.modelView, false, modelView);
                    m3.m4normal(normalMatrix, modelView);
                    gl.uniformMatrix3fv(shader.uniforms.normalMatrix, false, normalMatrix);
                    m4.mul(this.mvp, projection, modelView);
                    this.searchPoint.draw(gl, shader, this.mvp);
                }.bind(this));

                gl.uniform3f(shader.uniforms.color, 1, 1, 0.5);

                this.mvStack.nest(modelView, function() {
                    m4.scale(modelView, modelView, 1.005);
                    gl.uniformMatrix4fv(shader.uniforms.modelView, false, modelView);
                    m3.m4normal(normalMatrix, modelView);
                    gl.uniformMatrix3fv(shader.uniforms.normalMatrix, false, normalMatrix);

                    this.kdTreeGeom.drawSearch(gl, shader, pt);

                    m4.scale(modelView, modelView, -1);
                    gl.uniformMatrix4fv(shader.uniforms.modelView, false, modelView);
                    m3.m4normal(normalMatrix, modelView);
                    gl.uniformMatrix3fv(shader.uniforms.normalMatrix, false, normalMatrix);
                    this.kdTreeGeom.drawSearch(gl, shader, pt);
                }.bind(this));
            }

            var shader = this.pointShader;
            gl.useProgram(shader.program);
            gl.enableVertexAttribArray(shader.attributes.position);
            gl.uniformMatrix4fv(shader.uniforms.projection, false, projection);
            gl.uniform1f(shader.uniforms.pointSize, 10.0);

            // Draw the points
            if (this.drawPoints) {
                this.mvStack.nest(modelView, function() {
                    m4.scale(modelView, modelView, 1.015);
                    gl.uniformMatrix4fv(shader.uniforms.modelView, false, modelView);
                    gl.uniform3f(shader.uniforms.color, 0.4, 0, 0);
                    this.pointCloud.draw(gl, shader);
                }.bind(this));
            }
            if (this.drawAntipodalPoints) {
                this.mvStack.nest(modelView, function() {
                    m4.scale(modelView, modelView, -1.015);
                    gl.uniformMatrix4fv(shader.uniforms.modelView, false, modelView);
                    gl.uniform3f(shader.uniforms.color, 0.2, 0, 0);
                    this.pointCloud.draw(gl, shader);
                }.bind(this));
            }

            if (1) {
                // Draw the sphere last (since its transparent)
                var shader = this.blendedShader;
                gl.useProgram(shader.program);
                gl.enableVertexAttribArray(shader.attributes.position);
                gl.enableVertexAttribArray(shader.attributes.normal);
                gl.uniformMatrix4fv(shader.uniforms.modelView, false, modelView);
                gl.uniformMatrix4fv(shader.uniforms.projection, false, projection);

                m3.m4normal(normalMatrix, modelView);
                gl.uniformMatrix3fv(shader.uniforms.normalMatrix, false, normalMatrix);
                m4.mul(this.mvp, projection, modelView);
                this.sphere.draw(gl, shader, this.mvp);
            }

        },
        drawAxis : function(shader, r, g, b) {
            var gl = this.gl;
            var modelView = this.modelView;
            var normalMatrix = this.normalMatrix;

            gl.uniform3f(shader.uniforms.color, r, g, b);
            gl.uniformMatrix4fv(shader.uniforms.modelView, false, modelView);
            m3.m4normal(normalMatrix, modelView);
            gl.uniformMatrix3fv(shader.uniforms.normalMatrix, false, normalMatrix);
            this.axisCylinder.draw(gl, shader);

            this.mvStack.push(modelView);
            m4.translate(modelView, modelView, 0, 0, 1.1);
            gl.uniformMatrix4fv(shader.uniforms.modelView, false, modelView);
            m3.m4normal(normalMatrix, modelView);
            gl.uniformMatrix3fv(shader.uniforms.normalMatrix, false, normalMatrix);
            this.axisHead.draw(gl, shader);
            this.mvStack.pop(modelView);
        },

        uploadMovie : function(frames, rotationStep) {
            var frame = 1;
            var self = this;

            function renderAndUploadFrame() {
                self.drawScene();

                var fileNo = ("00000000" + frame).substr(-4);

                uploadCanvasImage(this.canvas, "/upload/image"+fileNo+".png", function (err, result) {
                    console.log("Upload status: ", err, result);
                    if (!err && ++frame <= frames) {
                        self.rotation += rotationStep;
                        setTimeout(renderAndUploadFrame, 50);
                    }
                });
            }

            renderAndUploadFrame();
        },

        tick : function() {
            var thisTick = glUtil.timeInMillis();
            var elapsed = thisTick - this.lastTick;
            this.rotation += (20 * Math.PI / 180 * elapsed) / 1000.0;
            //console.log("elapsed ", elapsed, " rotation ", this.rotation);
            this.drawScene();
            this.lastTick = thisTick;
            glUtil.requestAnimationFrame.call(window, this.tick.bind(this));
        },

        run : function() {
            switch (this.drawMode) {
            default:
                console.log("bad drawing mode: "+this.drawMode);
                // fall through to "once"
            case "once":
                this.drawScene();
                break;
            case "animate":
                this.lastTick = glUtil.timeInMillis();
                this.tick();
                break;
            case "upload":
                this.uploadMovie(this.animationFrames, this.animationStep);
                break;
            }
        }
    };


    ~function() {
        // var canvas = document.createElement("canvas");
        // document.body.appendChild(canvas);
        // canvas.width = 400;
        // canvas.height = 400;
        var canvas = document.getElementById("canvas");
        function resize() {
            canvas.width = window.innerWidth * 2;
            canvas.height = window.innerHeight * 2;
            canvas.style.width = window.innerWidth + "px";
            canvas.style.height = window.innerHeight + "px";
            kdTreeDemo && kdTreeDemo.drawScene();
        }
        $(window).on("resize", resize);
        resize();
        var kdTreeDemo = new KDTreeDemo(canvas);
        kdTreeDemo.run();
    }();
});
