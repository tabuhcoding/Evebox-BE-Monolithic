// libs/ddd/aggregate-root.base.ts

import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';
import { Identifier } from './identifier.base';

export abstract class AggregateRoot<ID extends Identifier<any>, Props> extends Entity<ID, Props> {
  private domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }

  public clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
