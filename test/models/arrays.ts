
export type StringArray = string[];

export type AnotherStringArray = Array<string>;

export type PrimitiveArray = Array<string|number|boolean>;

/**
 * Array constrained to a maximum of 10 elements
 *
 * Annotations are defined for some additional JSON Schema features not provided
 * in TypeScript's type system.
 *
 * @maxLength 10
 */
export type Array10 = Array<string>;

/**
 * Array of Date elements, with at least one
 *
 * @minLength 1
 */
export type DateArray = Date[];
