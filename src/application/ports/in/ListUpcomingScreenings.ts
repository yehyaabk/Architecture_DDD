// Port entrant : lister les séances à venir avec le nombre de places restantes
export interface UpcomingScreening {
  id: string;
  movie: string;
  room: string;
  startsAt: Date;
  unitPrice: number;
  remaining: number;
}

export interface ListUpcomingScreenings {
  execute(): Promise<UpcomingScreening[]>;
}
