export const GRADIENT_SUBTRACT_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexelSize;

void main() {
  float pressureLeft = texture(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
  float pressureRight = texture(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
  float pressureBottom = texture(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
  float pressureTop = texture(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;

  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity -= 0.5 * vec2(pressureRight - pressureLeft, pressureTop - pressureBottom);

  outColor = vec4(velocity, 0.0, 1.0);
}
`;
