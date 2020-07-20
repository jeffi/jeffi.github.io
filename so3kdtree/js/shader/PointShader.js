define(["gl/Shader"], function(Shader) {
    var vsSource = [
        "attribute vec3 position;",

        "uniform mat4 modelView;",
        "uniform mat4 projection;",
        "uniform float pointSize;",
        "uniform vec3 color;",

        "varying vec3 vColor;",

        "void main(void) {",
        "    gl_Position = projection * modelView * vec4(position, 1.0);",
        "    gl_PointSize = pointSize;",
        "    vColor = color;",
        "}"
    ];
    var fsSource = [
        "precision mediump float;",

        "varying vec3 vColor;",

        "void main(void) {",
        "    float dist = distance(gl_PointCoord, vec2(0.5));",
        "    if (dist > 0.5) discard;",
        "    float alpha = 1.0 - smoothstep(0.45, 0.5, dist);",
        "    gl_FragColor = vec4(vColor, 1.0);",
        "    gl_FragColor.a = alpha;",
        "}"
    ];

    function PointShader(gl) {
        this.init(gl, vsSource, fsSource);
    }
    PointShader.prototype = new Shader();

    return PointShader;
});
