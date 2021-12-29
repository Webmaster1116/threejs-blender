import * as THREE from "three";
import { TextToSpeechFeature as CoreTextToSpeechFeature } from "../../core/awspack/TextToSpeechFeature";
import { HostObject } from "../HostObject";

export class TextToSpeechFeature extends CoreTextToSpeechFeature {
  _listener?: THREE.AudioListener;
  _attachTo?: THREE.Object3D;
  // _audioContext?: any;

  constructor(
    host: HostObject,
    options: {
      voice?: string;
      engine?: string;
      language?: string;
      audioFormat?: string;
      sampleRate?: number;
      listener?: THREE.AudioListener;
      attachTo?: THREE.Object3D;
    } = { audioFormat: "mp3" }
  ) {
    super(host, options);
    this._listener = options.listener;
    this._attachTo = options.attachTo || host.owner;
    this._setAudioContext();
    this._observeAudioContext();
  }

  _setAudioContext() {
    if (this._listener) {
      this._audioContext = this._listener.context;
    }
  }

  async _synthesizeAudio(params: any): Promise<any> {
    if (!this._listener) return;
    return super._synthesizeAudio(params).then((result) => {
      if (!this._listener) return;
      if (this._attachTo !== undefined) {
        result.threeAudio = new THREE.PositionalAudio(this._listener);
        this._attachTo.add(result.threeAudio);
      } else {
        result.threeAudio = new THREE.Audio(this._listener);
      }
      result.threeAudio.setMediaElementSource(result.audio);
      return result;
    });
  }
}
