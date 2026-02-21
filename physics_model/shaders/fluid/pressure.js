export const PRESSURE_JACOBI_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexelSize;

void main() {
  float pressureLeft = texture(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
  float pressureRight = texture(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
  float pressureBottom = texture(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
  float pressureTop = texture(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
  float divergence = texture(uDivergence, vUv).x;

  float pressure = (pressureLeft + pressureRight + pressureBottom + pressureTop - divergence) * 0.25;
  outColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;
