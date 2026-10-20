// Adapter sortant : identifiants UUID v4
import { randomUUID } from "crypto";
import { IdGenerator } from "../../../application/ports/out/IdGenerator";

export class UuidGenerator implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}
