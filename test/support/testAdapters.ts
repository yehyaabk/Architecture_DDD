// Adapters de test : implémentations déterministes des ports sortants
import { BookingView } from "../../src/application/ports/in/BookingView";
import { Clock } from "../../src/application/ports/out/Clock";
import { IdGenerator } from "../../src/application/ports/out/IdGenerator";
import { Notifier } from "../../src/application/ports/out/Notifier";
import { PaymentGateway } from "../../src/application/ports/out/PaymentGateway";

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

/** Notifier espion : enregistre les notifications au lieu de les envoyer. */
export class SpyNotifier implements Notifier {
  readonly confirmations: { booking: BookingView; movie: string }[] = [];
  readonly cancellations: BookingView[] = [];

  async bookingConfirmed(booking: BookingView, movie: string): Promise<void> {
    this.confirmations.push({ booking, movie });
  }

  async bookingCancelled(booking: BookingView): Promise<void> {
    this.cancellations.push(booking);
  }
}
