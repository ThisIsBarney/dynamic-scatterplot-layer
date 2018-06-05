// language=GLSL
export default `
#define SHADER_NAME dynamic-scatterplot-layer-vertex-shader

attribute vec3 positions;

attribute vec3 instancePositions;
attribute vec3 instanceStartPositions;
attribute vec3 instanceEndPositions;
attribute float instanceRadius;
attribute vec4 instanceColors;
attribute vec3 instancePickingColors;

uniform float opacity;
uniform float radiusScale;
uniform float radiusMinPixels;
uniform float radiusMaxPixels;
uniform float outline;
uniform float strokeWidth;
uniform float currentTime;
uniform float maxSpeed;

varying vec4 vColor;
varying vec2 unitPosition;
varying float innerUnitRadius;
varying float vTime;
varying float invalid;

void main(void) {
  // Multiply out radius and clamp to limits
  float outerRadiusPixels = clamp(
    project_scale(radiusScale * instanceRadius),
    radiusMinPixels, radiusMaxPixels
  );
  // outline is centered at the radius
  // outer radius needs to offset by half stroke width
  outerRadiusPixels += outline * strokeWidth / 2.0;

  // position on the containing square in [-1, 1] space
  unitPosition = positions.xy;
  // 0 - solid circle, 1 - stroke with lineWidth=0
  innerUnitRadius = outline * (1.0 - strokeWidth / outerRadiusPixels);

  // Find the center of the point and add the current vertex
  vec2 startPos = instanceStartPositions.xy;
  vec2 endPos = instanceEndPositions.xy;

  // elevation should be considered in the future
  vec3 startCenter = vec3(startPos, 0.00001);
  vec3 endCenter = vec3(endPos, 0.00001);

  // extract the time from position
  float startTime = instanceStartPositions.z;
  float endTime = instanceEndPositions.z;
  float elapse = endTime - startTime;

  // get the current position center
  float currentPosition = (currentTime - startTime) / elapse;
  vec3 center = project_position(mix(startCenter, endCenter, currentPosition));

  // vTime to pass to fragment shader
  vTime = currentPosition;

  // get the final gl position
  vec3 vertex = positions * outerRadiusPixels;
  gl_Position = project_to_clipspace(vec4(center + vertex, 1.0));

  // Apply opacity to instance color, or return instance picking color
  vColor = vec4(instanceColors.rgb, instanceColors.a * opacity) / 255.;
  
  // mark too fast points as invalid
  invalid = 0.0;
  if (distance(project_position(startPos), project_position(endPos)) / elapse > maxSpeed) {
    invalid = 1.0;
  }
  
  // Set color to be rendered to picking fbo (also used to check for selection highlight).
  picking_setPickingColor(instancePickingColors);
}
`;