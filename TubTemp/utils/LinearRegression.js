export default function findLineByLeastSquares(values) {
  var sum_x = 0
  var sum_y = 0
  var sum_xy = 0
  var sum_xx = 0

  if (values.length === 0) {
      return {}
  }

  /*
   * Calculate the sum for each of the parts necessary.
   */
  for (var i = 0; i < values.length; i++) {
      sum_x += values[i].x
      sum_y += values[i].y
      sum_xx += values[i].x*values[i].x
      sum_xy += values[i].x*values[i].y
  }

  /*
   * Calculate m and b for the formula y = x * m + b
   */
  var m = (values.length*sum_xy - sum_x*sum_y) / (values.length*sum_xx - sum_x*sum_x)
  var b = (sum_y/values.length) - (m*sum_x)/values.length

  return {m, b}
}
