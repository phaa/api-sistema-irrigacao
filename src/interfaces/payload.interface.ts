export default interface Payload {
  pin: number;
  instruction: string,
  reading: number;
  store?: string;
  fromSensor?: boolean;
  fromActuator?: boolean;
}