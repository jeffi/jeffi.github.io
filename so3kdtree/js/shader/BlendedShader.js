define(["gl/Shader"], function(Shader) {
    var vsSource = [
        "attribute vec3 position;",
        "attribute vec3 normal;",
        "attribute vec3 color;",

        "uniform mat4 modelView;",
        "uniform mat4 projection;",
        "uniform mat3 normalMatrix;",

        "varying vec4 vColor;",
        "varying vec3 vNormal;",
        "varying vec3 vEyeDir;",

        "void main(void) {",
        "    vec4 viewPos = modelView * vec4(position, 1.0);",
        "    gl_Position = projection * viewPos;",
        "    vColor = vec4(0.8, 0.8, 0.8, 0.9);",
        "    vNormal = normalMatrix * normal;",
        "    vEyeDir = normalize(-viewPos.xyz);",
        "}"
    ];

    var fsSource = [
        "precision highp float;",

        "varying vec4 vColor;",
        "varying vec3 vNormal;",
        "varying vec3 vEyeDir;",

        "void main(void) {",
        "    float shininess = 9.0;",
        "    float specularLevel = 0.2;",
        "    vec3 specularColor = vec3(1.0, 1.0, 1.0);",

        "    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));",
        "    vec3 lightColor = vec3(0.8, 0.8, 0.8);",
        "    vec3 ambientLight = vec3(0.05, 0.05, 0.05);",

        "    vec3 normal = normalize(vNormal);",
        "    vec3 eyeDir = normalize(vEyeDir);",
        "    vec3 reflectDir = reflect(-lightDir, normal);",

        "    float specularFactor = pow(clamp(dot(reflectDir, eyeDir), 0.0, 1.0), shininess) * specularLevel;",
        "    float lightFactor = max(dot(lightDir, normal), 0.0);",
        "    vec3 lightValue = ambientLight + (lightColor * lightFactor) + (specularColor * specularFactor);",
        "    gl_FragColor = vec4(vColor.rgb * lightValue, vColor.a);",
        "}"
    ];

    function BlendedShader(gl) {
        this.init(gl, vsSource, fsSource);
    }

    BlendedShader.prototype = new Shader();

    return BlendedShader;
});
