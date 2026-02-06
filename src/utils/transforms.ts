/**
 * Compute a CSS matrix3d transform from source and destination corner points
 * Uses perspective transform to map a rectangle to a quadrilateral
 */
export function computeMatrix3d(
  sourceCorners: [number, number][],
  destCorners: [number, number][]
): string {
  // Using the perspective transform algorithm
  // Maps 4 source corners to 4 destination corners
  
  const [x0, y0] = sourceCorners[0]
  const [x1, y1] = sourceCorners[1]
  const [x2, y2] = sourceCorners[2]
  const [x3, y3] = sourceCorners[3]
  
  const [u0, v0] = destCorners[0]
  const [u1, v1] = destCorners[1]
  const [u2, v2] = destCorners[2]
  const [u3, v3] = destCorners[3]
  
  // Solve for the perspective transform matrix
  // Using the standard 8-point algorithm for homography
  
  // Build the system of equations
  const A: number[][] = [
    [x0, y0, 1, 0, 0, 0, -x0 * u0, -y0 * u0],
    [0, 0, 0, x0, y0, 1, -x0 * v0, -y0 * v0],
    [x1, y1, 1, 0, 0, 0, -x1 * u1, -y1 * u1],
    [0, 0, 0, x1, y1, 1, -x1 * v1, -y1 * v1],
    [x2, y2, 1, 0, 0, 0, -x2 * u2, -y2 * u2],
    [0, 0, 0, x2, y2, 1, -x2 * v2, -y2 * v2],
    [x3, y3, 1, 0, 0, 0, -x3 * u3, -y3 * u3],
    [0, 0, 0, x3, y3, 1, -x3 * v3, -y3 * v3],
  ]
  
  const b = [u0, v0, u1, v1, u2, v2, u3, v3]
  
  // Solve using Gaussian elimination (simplified)
  const h = solveLinearSystem(A, b)
  
  // Convert to CSS matrix3d format
  // CSS matrix3d is column-major order
  const matrix = [
    h[0], h[3], 0, h[6],
    h[1], h[4], 0, h[7],
    0, 0, 1, 0,
    h[2], h[5], 0, 1,
  ]
  
  return `matrix3d(${matrix.join(', ')})`
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  // Simplified Gaussian elimination for 8x8 system
  const n = A.length
  const augmented: number[][] = A.map((row, i) => [...row, b[i]])
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]
    
    // Eliminate
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i]
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j]
      }
    }
  }
  
  // Back substitution
  const x = new Array(n)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n]
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j]
    }
    x[i] /= augmented[i][i]
  }
  
  return x
}

/**
 * Get transform matrix for a given angle preset
 * Returns the CSS transform string
 */
export function getAngleTransform(
  _angle: AnglePreset,
  screenBounds: { corners: [number, number][]; width: number; height: number }
): string {
  const { corners, width, height } = screenBounds
  
  // Source corners (normalized rectangle)
  const sourceCorners: [number, number][] = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ]
  
  return computeMatrix3d(sourceCorners, corners)
}

export type AnglePreset =
  | 'straight'
  | 'slight-left'
  | 'slight-right'
  | 'dramatic-left'
  | 'dramatic-right'
