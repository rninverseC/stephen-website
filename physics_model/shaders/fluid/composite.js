export const COMPOSITE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uDye;
uniform sampler2D uVelocity;
uniform float uTime;
uniform float uOverlayAlpha;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec3 dye = texture(uDye, vUv).rgb;
  vec2 velocity = texture(uVelocity, vUv).xy;
  float speed = length(velocity);

  float luma = dot(dye, vec3(0.2126, 0.7152, 0.0722));
  vec3 deep = vec3(0.028, 0.048, 0.082);
  vec3 steel = vec3(0.162, 0.264, 0.402);
  vec3 mist = vec3(0.415, 0.542, 0.706);

  vec3 color = mix(deep, steel, smoothstep(0.01, 0.65, luma + dye.b * 0.2));
  color = mix(color, mist, smoothstep(0.20, 1.55, speed) * 0.52 + dye.g * 0.18);

  float swell = 0.5 + 0.5 * sin(vUv.y * 7.0 - uTime * 0.12 + dye.b * 2.2);
  float ripples = 0.5 + 0.5 * sin((vUv.x * 16.0 + vUv.y * 9.0) - uTime * 0.35);
  float flowHighlights = smoothstep(0.16, 1.0, speed + dye.g * 0.16);
  color += vec3(0.022, 0.034, 0.052) * (swell - 0.5);
  color += vec3(0.014, 0.024, 0.038) * flowHighlights * (ripples - 0.3);
  color = mix(color, vec3(0.54, 0.67, 0.82), flowHighlights * 0.08);

  float edge = length(vUv * 2.0 - 1.0);
  float vignette = smoothstep(1.28, 0.2, edge);
  color *= vignette;

  float grain = hash(vUv * 131.0 + vec2(uTime * 0.2, -uTime * 0.17)) - 0.5;
  color += grain * 0.010;

  outColor = vec4(color, uOverlayAlpha);
}
`;
