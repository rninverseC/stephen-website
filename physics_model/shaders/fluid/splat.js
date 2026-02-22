export const SPLAT_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec3 uValue;
uniform float uRadius;
uniform float uAspect;
uniform vec2 uDirection;
uniform float uStretch;

void main() {
  vec2 offset = vUv - uPoint;
  offset.x *= uAspect;
  vec2 direction = normalize(uDirection + vec2(0.0001, 0.0));
  vec2 normal = vec2(-direction.y, direction.x);
  float along = dot(offset, direction);
  float across = dot(offset, normal);
  float stretch = max(uStretch, 1.0);
  float ellipse = across * across + (along * along) / stretch;
  float falloff = exp(-ellipse / max(uRadius, 0.0000001));
  vec4 base = texture(uTarget, vUv);
  outColor = base + vec4(uValue * falloff, 0.0);
}
`;
