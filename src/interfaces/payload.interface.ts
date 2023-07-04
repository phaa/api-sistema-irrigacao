export interface Payload {
  pin: number;
  cmd: string,
  reading: number;
  fromSensor?: boolean;
  fromActuator?: boolean;
}