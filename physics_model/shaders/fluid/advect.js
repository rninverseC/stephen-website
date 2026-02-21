export const ADVECTION_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uDt;
uniform float uDissipation;

void main() {
  vec2 velocity = texture(uVelocity, vUv).xy;
  vec2 sampleUv = clamp(vUv - velocity * uDt * uTexelSize, vec2(0.001), vec2(0.999));
  outColor = texture(uSource, sampleUv) * uDissipation;
}
`;
