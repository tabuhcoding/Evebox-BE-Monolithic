// libs/ddd/domain-event.base.ts

export abstract class DomainEvent {
    public readonly occurredOn: Date;
  
    constructor() {
      this.occurredOn = new Date();
    }
  }
  