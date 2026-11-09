// Adapters de test : implémentations déterministes des ports sortants
import { InMemoryEventBus } from "../../src/adapters/out/events/InMemoryEventBus";
import { NotifyCustomer } from "../../src/application/handlers/NotifyCustomer";
import { Clock } from "../../src/application/ports/out/Clock";
import { IdGenerator } from "../../src/application/ports/out/IdGenerator";
import { Notifier } from "../../src/application/ports/out/Notifier";
import { PaymentGateway } from "../../src/application/ports/out/PaymentGateway";
import { BookingCancelled, BookingConfirmed, BookingEventData } from "../../src/domain/booking/events";

/** Horloge figée : renvoie toujours la même date. */
export class FrozenClock implements Clock {
  constructor(private readonly date: Date) {}

  now(): Date {
    return this.date;
  }
}

/** Générateur prévisible : b1, b2, b3... */
export class SequentialIdGenerator implements IdGenerator {
  private count = 0;

  next(): string {
    this.count++;
    return `b${this.count}`;
  }
}

/** Paiement forcé (accepté ou refusé) qui enregistre les demandes reçues. */
export class ForcedPaymentGateway implements PaymentGateway {
  readonly charges: { email: string; amount: number }[] = [];

  constructor(private readonly accept: boolean) {}

  async charge(email: string, amount: number): Promise<boolean> {
    this.charges.push({ email, amount });
    return this.accept;
  }
}

/** Notifier espion : enregistre les e-mails au lieu de les envoyer. */
export class SpyNotifier implements Notifier {
  readonly confirmations: BookingEventData[] = [];
  readonly cancellations: BookingEventData[] = [];

  async bookingConfirmed(booking: BookingEventData): Promise<void> {
    this.confirmations.push(booking);
  }

  async bookingCancelled(booking: BookingEventData): Promise<void> {
    this.cancellations.push(booking);
  }
}

/** Bus réel avec NotifyCustomer abonné, comme dans la composition root. */
export function busNotifying(notifier: Notifier): InMemoryEventBus {
  const bus = new InMemoryEventBus();
  const handler = new NotifyCustomer(notifier);
  bus.subscribe(BookingConfirmed.TYPE, (e: BookingConfirmed) => handler.onBookingConfirmed(e));
  bus.subscribe(BookingCancelled.TYPE, (e: BookingCancelled) => handler.onBookingCancelled(e));
  return bus;
}
