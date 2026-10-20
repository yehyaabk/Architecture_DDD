// Domaine : une séance (prix en centimes)
export interface Screening {
  id: string;
  movie: string;
  room: string;
  startsAt: Date;
  capacity: number;
  price: number;
}
