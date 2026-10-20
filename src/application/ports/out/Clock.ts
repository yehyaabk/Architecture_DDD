// Port sortant : l'heure courante (remplace new Date() dans le cœur)
export interface Clock {
  now(): Date;
}
