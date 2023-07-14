export interface Payload {
  pin: number;
  instruction: string,
  reading: number;
  fromSensor?: boolean;
  fromActuator?: boolean;
}