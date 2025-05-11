// libs/ddd/identifier.base.ts

export abstract class Identifier<T> {
  public readonly value: T;

  constructor(value: T) {
    if (!value) {
      throw new Error('Identifier value cannot be empty');
    }
    this.value = value;
  }

  public equals(id?: Identifier<T>): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    return this.value === id.value;
  }

  public toString(): string {
    return this.value.toString();
  }
}
