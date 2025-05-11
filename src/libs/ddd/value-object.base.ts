// libs/ddd/value-object.base.ts

export abstract class ValueObject<T> {
    protected readonly props: T;
  
    constructor(props: T) {
      this.props = Object.freeze(props); // Đảm bảo tính bất biến
    }
  
    public equals(vo?: ValueObject<T>): boolean {
      if (vo === null || vo === undefined) {
        return false;
      }
      if (vo.props === undefined) {
        return false;
      }
      return this.shallowEqual(this.props, vo.props);
    }
  
    private shallowEqual(obj1: T, obj2: T): boolean {
      const keys1 = Object.keys(obj1) as Array<keyof T>;
      const keys2 = Object.keys(obj2) as Array<keyof T>;
  
      if (keys1.length !== keys2.length) {
        return false;
      }
  
      for (const key of keys1) {
        if (obj1[key] !== obj2[key]) {
          return false;
        }
      }
  
      return true;
    }
  }
  