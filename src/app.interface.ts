export interface BlendStateOption {
  clip: string;
  name: string;
}

export interface POIConfig {
  name: string;
  maxSpeed: number;
  reference: string;
  forwardAxis: string;
  animation: string;
  blendStateOptions: BlendStateOption[];
  blendThresholds: number[][];
  hasSaccade?: boolean;
}

export interface QueueOption {
  name: string;
  from: number;
  to: number;
  loopCount: number;
}

export interface GenericA {
  queueOptions: QueueOption[];
}

export interface QueueOption2 {
  name: string;
  from: number;
  to: number;
  loopCount: number;
}

export interface GenericB {
  queueOptions: QueueOption2[];
}

export interface QueueOption3 {
  name: string;
  from: number;
  to: number;
  loopCount: number;
}

export interface GenericC {
  queueOptions: QueueOption3[];
}

export interface QueueOption4 {
  name: string;
  from: number;
  to: number;
  loopCount: number;
}

export interface In {
  queueOptions: QueueOption4[];
}

export interface QueueOption5 {
  name: string;
  from: number;
  to: number;
  loopCount: number;
}

export interface Many {
  queueOptions: QueueOption5[];
}

export interface QueueOption6 {
  name: string;
  from: number;
  to: number;
  loopCount: number;
}

export interface One {
  queueOptions: QueueOption6[];
}

export interface QueueOption7 {
  name: string;
  from: number;
  to: number;
  loopCount: number;
}

export interface Self {
  queueOptions: QueueOption7[];
}

export interface QueueOption8 {
  name: string;
  from: number;
  to: number;
  loopCount: number;
}

export interface Wave {
  queueOptions: QueueOption8[];
}

export interface QueueOption9 {
  name: string;
  from: number;
  to: number;
  loopCount: number;
}

export interface You {
  queueOptions: QueueOption9[];
}

export interface GestureConfig {
  generic_a: GenericA;
  generic_b: GenericB;
  generic_c: GenericC;
  in: In;
  many: Many;
  one: One;
  self: Self;
  wave: Wave;
  you: You;
}
