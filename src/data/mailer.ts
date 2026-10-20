// Couche données (ressource externe) : envoi des e-mails (simulé par console.log)
// (la confirmation de réservation passe par adapters/out/notification/ConsoleNotifier.ts)
export class Mailer {
  sendCancellationConfirmation(email: string, bookingId: string, total: number) {
    console.log(`[SMTP] To: ${email} — Votre réservation ${bookingId} a été annulée. Remboursement : ${(total / 100).toFixed(2)} €`);
  }
}
