// Port entrant : ce que l'application sait faire — réserver des places
import { Booking } from "../../../domain/Booking";

export interface BookSeatsCommand {
  screeningId: string;
  email: string;
  seats: number;
  tariff: string;
}

export interface BookSeats {
  execute(command: BookSeatsCommand): Promise<Booking>;
}
