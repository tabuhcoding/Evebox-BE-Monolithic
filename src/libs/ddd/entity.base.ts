// libs/ddd/entity.base.ts

import { Identifier } from './identifier.base';

export abstract class Entity<ID extends Identifier<any>, Props> {
  public readonly id: ID;
  protected props: Props;

  constructor(id: ID, props: Props) {
    this.id = id;
    this.props = props;
  }

  public equals(entity?: Entity<ID, Props>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    return this.id.equals(entity.id);
  }
}
