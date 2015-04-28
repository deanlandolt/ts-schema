import User = require('./user');

/**
 * Customer model
 */
class Customer implements User {

  public id: string | number;

  public name: string;

  /**
   * Customer account number
   */
  account: string;
}

export = Customer;

//
// exports class ParameterizedCustomer<T, U> implements User {
//  
//}
