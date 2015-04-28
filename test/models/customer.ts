import User = require('./user');

/**
 * Customer model
 */
export class Customer implements User {

  public id: string;

  /**
   * Default property values are not yet reflected in ts-reflect.
   */
  name: string = 'John Doe';

  /**
   * Customer account number
   */
  account: string | number;
}

export enum AnimationType {
  /**
   * Bounce description...
   */
  BOUNCE,
  DROP,
  SLIDE
}

export class ParameterizedCustomer<T, U> extends Customer {
  /**
   * Private variables are serialized by default
   *
   * This can be changed with some configuration parameters.
   */
  private foo: any;

  animation: AnimationType;

}
