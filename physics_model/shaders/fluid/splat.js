export const SPLAT_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec3 uValue;
uniform float uRadius;
uniform float uAspect;

void main() {
  vec2 offset = vUv - uPoint;
  offset.x *= uAspect;
  float falloff = exp(-dot(offset, offset) / max(uRadius, 0.0000001));
  vec4 base = texture(uTarget, vUv);
  outColor = base + vec4(uValue * falloff, 0.0);
}
`;
