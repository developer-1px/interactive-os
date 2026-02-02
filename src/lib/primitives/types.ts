// Generic command type that primitives can work with
export interface BaseCommand {
  type: string;
  payload?: any;
}
