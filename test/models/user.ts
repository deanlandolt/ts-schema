/**
 * User model with JPA-style annotations
 * @entity
 * @table "users"
 */
interface User {

  /** @id */
  id: string;

  /**
   * The full name of the user
   * @column name: "full_name", length: 255
   */
  name: string;
}

export = User;
