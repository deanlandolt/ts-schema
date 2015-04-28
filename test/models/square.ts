import shapes = require('./shapes');

export class ColoredSquare implements shapes.Shape, shapes.PenStroke {
  color: string;
  strokeWidth: number;

  /**
   * Width and height of square
   */
  sideLength: number;

  optField: number | void;
}
