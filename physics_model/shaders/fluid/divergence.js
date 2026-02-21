export const DIVERGENCE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uVelocity;
uniform vec2 uTexelSize;

void main() {
  float velocityLeft = texture(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
  float velocityRight = texture(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
  float velocityBottom = texture(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
  float velocityTop = texture(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;

  float divergence = 0.5 * ((velocityRight - velocityLeft) + (velocityTop - velocityBottom));
  outColor = vec4(divergence, 0.0, 0.0, 1.0);
}
`;
