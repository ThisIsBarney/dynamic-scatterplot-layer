// language=GLSL
export default `
#define SHADER_NAME dynamic-scatterplot-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

varying vec4 vColor;
varying vec2 unitPosition;
varying float innerUnitRadius;
varying float vTime;
varying float invalid;
varying float vFadeIn;

void main(void) {

  float distToCenter = length(unitPosition);

  if (distToCenter > 1.0 || distToCenter < innerUnitRadius) {
    discard;
  }

  if (invalid > 0.0) {
    discard;
  } 
  if (vTime < 0.0) {
    // gl_FragColor = vec4(1., 0., 0., 1.);
    discard;
  } else if (vTime > 1.0) {
    // gl_FragColor = vec4(0., 1., 0., 1.);
    if (vFadeIn < 0.0 || vFadeIn > 1.0) {
        discard;
    }
    gl_FragColor = vec4(vColor.rgb, max(0.0, min(1.0, vColor.a * vFadeIn)));
//    discard;
  } else {
    gl_FragColor = vColor;
    // gl_FragColor = vec4(vColor.rgb, vColor.a * (1.0 - distToCenter));
  }

  // use highlight color if this fragment belongs to the selected object.
  gl_FragColor = picking_filterHighlightColor(gl_FragColor);

  // use picking color if rendering to picking FBO.
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}
`;
