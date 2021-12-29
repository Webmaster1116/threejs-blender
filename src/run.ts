import type * as AWS_SDK from "aws-sdk";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { GestureConfig, POIConfig } from "./app.interface";
import { loadScript } from "./fun";
import * as HOST from "./lib/three.js/index";

(window as any).HOST = HOST;

declare const AWS: typeof AWS_SDK;
const renderFn: (() => void)[] = [];

const speakers = new Map([["Grace", undefined]]);
const preUrl =
  "https://raw.githubusercontent.com/aws-samples/amazon-sumerian-hosts/mainline/examples/assets/";

const getCurrentHost = () => {
  const name = "Grace";
  return { name, host: speakers.get(name as string) };
};

async function loadCharacter(
  scene: THREE.Scene,
  characterFile: string,
  animationPath: string,
  animationFiles: string[]
) {
  // Asset loader
  const fileLoader = new THREE.FileLoader();
  const gltfLoader = new GLTFLoader();

  const loadAsset = (loader: GLTFLoader, assetPath: string) =>
    new Promise<GLTF>((s, f) => loader.load(assetPath, s, void 0, f));

  const processGltf = (gltf: GLTF) => {
    // Transform the character
    const character = gltf.scene;
    scene.add(character);

    // Make the offset pose additive
    const [bindPoseOffset] = gltf.animations;
    if (bindPoseOffset) {
      THREE.AnimationUtils.makeClipAdditive(bindPoseOffset);
    }

    // Cast shadows
    character.traverse((object) => {
      if ((object as any).isMesh) {
        object.castShadow = true;
      }
    });

    return { character, bindPoseOffset };
  };

  // Load character model
  const { character, bindPoseOffset } = processGltf(
    await loadAsset(gltfLoader, characterFile)
  );

  // Load animations
  const clips = await Promise.all(
    animationFiles.map(async (filename) => {
      const filePath = `${animationPath}/${filename}`;
      const gltf = await loadAsset(gltfLoader, filePath);
      return gltf.animations;
    })
  );

  return { character, clips, bindPoseOffset };
}

// Initialize the host
const createHost = (
  character: THREE.Group,
  audioAttachJoint: THREE.Object3D<THREE.Event> | undefined,
  voice: string,
  engine: string,
  idleClip: THREE.AnimationClip,
  faceIdleClip: THREE.AnimationClip,
  lipsyncClips: THREE.AnimationClip[],
  gestureClips: THREE.AnimationClip[],
  gestureConfig: GestureConfig,
  emoteClips: THREE.AnimationClip[],
  blinkClips: THREE.AnimationClip[],
  poiClips: THREE.AnimationClip[],
  poiConfig: POIConfig,
  lookJoint: THREE.Object3D<THREE.Event> | undefined,
  bindPoseOffset: THREE.AnimationClip,
  clock: THREE.Clock,
  camera: THREE.Camera,
  scene: THREE.Scene
) => {
  // Add the host to the render loop
  const host = new HOST.HostObject({ owner: character as any, clock });
  renderFn.push(() => host.update());

  // Set up text to speech
  const audioListener = new THREE.AudioListener();
  camera.add(audioListener);
  host.addFeature(HOST.aws.TextToSpeechFeature as any, false, {
    listener: audioListener,
    attachTo: audioAttachJoint,
    voice,
    engine,
  });

  // Set up animation
  host.addFeature(HOST.anim.AnimationFeature as any);
  console.log(host);
  // Base idle
  host.AnimationFeature.addLayer("Base");
  host.AnimationFeature.addAnimation(
    "Base",
    idleClip.name,
    HOST.anim.AnimationTypes.single,
    {
      clip: idleClip,
    }
  );
  host.AnimationFeature.playAnimation("Base", idleClip.name);

  // Face idle
  host.AnimationFeature.addLayer("Face", {
    blendMode: HOST.anim.LayerBlendModes.Additive,
  });
  THREE.AnimationUtils.makeClipAdditive(faceIdleClip);
  host.AnimationFeature.addAnimation(
    "Face",
    faceIdleClip.name,
    HOST.anim.AnimationTypes.single,
    {
      clip: THREE.AnimationUtils.subclip(
        faceIdleClip,
        faceIdleClip.name,
        1,
        faceIdleClip.duration * 30,
        30
      ),
    }
  );
  host.AnimationFeature.playAnimation("Face", faceIdleClip.name);

  // Blink
  host.AnimationFeature.addLayer("Blink", {
    blendMode: HOST.anim.LayerBlendModes.Additive,
    transitionTime: 0.075,
  });
  blinkClips.forEach((clip) => {
    THREE.AnimationUtils.makeClipAdditive(clip);
  });
  host.AnimationFeature.addAnimation(
    "Blink",
    "blink",
    HOST.anim.AnimationTypes.randomAnimation,
    {
      playInterval: 3,
      subStateOptions: blinkClips.map((clip) => {
        return { name: clip.name, loopCount: 1, clip };
      }),
    }
  );
  host.AnimationFeature.playAnimation("Blink", "blink");

  // Talking idle
  host.AnimationFeature.addLayer("Talk", {
    transitionTime: 0.75,
    blendMode: HOST.anim.LayerBlendModes.Additive,
  });
  host.AnimationFeature.setLayerWeight("Talk", 0);
  const talkClip = lipsyncClips.find(
    (c) => c.name === "stand_talk"
  ) as THREE.AnimationClip;
  lipsyncClips.splice(lipsyncClips.indexOf(talkClip), 1);
  host.AnimationFeature.addAnimation(
    "Talk",
    talkClip.name,
    HOST.anim.AnimationTypes.single,
    {
      clip: THREE.AnimationUtils.makeClipAdditive(talkClip),
    }
  );
  host.AnimationFeature.playAnimation("Talk", talkClip.name);

  // Gesture animations
  host.AnimationFeature.addLayer("Gesture", {
    transitionTime: 0.5,
    blendMode: HOST.anim.LayerBlendModes.Additive,
  });
  gestureClips.forEach((clip) => {
    const { name } = clip;
    const config = gestureConfig[name as keyof typeof gestureConfig] as any;
    THREE.AnimationUtils.makeClipAdditive(clip);

    if (config !== undefined) {
      config.queueOptions.forEach((option: any) => {
        // Create a subclip for each range in queueOptions
        option.clip = THREE.AnimationUtils.subclip(
          clip,
          `${name}_${option.name}`,
          option.from,
          option.to,
          30
        );
      });
      host.AnimationFeature.addAnimation(
        "Gesture",
        name,
        HOST.anim.AnimationTypes.queue,
        config
      );
    } else {
      host.AnimationFeature.addAnimation(
        "Gesture",
        name,
        HOST.anim.AnimationTypes.single,
        {
          clip,
        }
      );
    }
  });

  // Emote animations
  host.AnimationFeature.addLayer("Emote", { transitionTime: 0.5 });

  emoteClips.forEach((clip) => {
    const { name } = clip;
    host.AnimationFeature.addAnimation(
      "Emote",
      name,
      HOST.anim.AnimationTypes.single,
      {
        clip,
        loopCount: 1,
      }
    );
  });

  // Viseme poses
  host.AnimationFeature.addLayer("Viseme", {
    transitionTime: 0.12,
    blendMode: HOST.anim.LayerBlendModes.Additive,
  });
  host.AnimationFeature.setLayerWeight("Viseme", 0);

  // Slice off the reference frame
  const blendStateOptions = lipsyncClips.map((clip) => {
    THREE.AnimationUtils.makeClipAdditive(clip);
    return {
      name: clip.name,
      clip: THREE.AnimationUtils.subclip(clip, clip.name, 1, 2, 30),
      weight: 0,
    };
  });
  host.AnimationFeature.addAnimation(
    "Viseme",
    "visemes",
    HOST.anim.AnimationTypes.freeBlend,
    {
      blendStateOptions,
    }
  );
  host.AnimationFeature.playAnimation("Viseme", "visemes");

  // POI poses
  (poiConfig as any as any[]).forEach((config) => {
    host.AnimationFeature.addLayer(config.name, {
      blendMode: HOST.anim.LayerBlendModes.Additive,
    });

    // Find each pose clip and make it additive
    config.blendStateOptions.forEach((clipConfig: any) => {
      const clip = poiClips.find((clip) => clip.name === clipConfig.clip);
      THREE.AnimationUtils.makeClipAdditive(clip as any);
      clipConfig.clip = THREE.AnimationUtils.subclip(
        clip as any,
        (clip as any).name,
        1,
        2,
        30
      );
    });

    host.AnimationFeature.addAnimation(
      config.name,
      config.animation,
      HOST.anim.AnimationTypes.blend2d,
      { ...config }
    );

    host.AnimationFeature.playAnimation(config.name, config.animation);

    // Find and store reference objects
    config.reference = character.getObjectByName(
      config.reference.replace(":", "")
    );
  });

  // Apply bindPoseOffset clip if it exists
  if (bindPoseOffset !== undefined) {
    host.AnimationFeature.addLayer("BindPoseOffset", {
      blendMode: HOST.anim.LayerBlendModes.Additive,
    });
    host.AnimationFeature.addAnimation(
      "BindPoseOffset",
      bindPoseOffset.name,
      HOST.anim.AnimationTypes.single,
      {
        clip: THREE.AnimationUtils.subclip(
          bindPoseOffset,
          bindPoseOffset.name,
          1,
          2,
          30
        ),
      }
    );
    host.AnimationFeature.playAnimation("BindPoseOffset", bindPoseOffset.name);
  }

  // Set up Lipsync
  const visemeOptions = {
    layers: [{ name: "Viseme", animation: "visemes" }],
  };
  const talkingOptions = {
    layers: [
      {
        name: "Talk",
        animation: "stand_talk",
        blendTime: 0.75,
        easingFn: HOST.anim.Easing.Quadratic.InOut,
      },
    ],
  };
  host.addFeature(
    HOST.LipsyncFeature as any,
    false,
    visemeOptions,
    talkingOptions
  );

  // Set up Gestures
  host.addFeature(HOST.GestureFeature as any, false, {
    layers: {
      Gesture: { minimumInterval: 3 },
      Emote: {
        blendTime: 0.5,
        easingFn: HOST.anim.Easing.Quadratic.InOut,
      },
    },
  });

  // Set up Point of Interest
  host.addFeature(
    HOST.PointOfInterestFeature as any,
    false,
    { target: camera, lookTracker: lookJoint, scene },
    { layers: poiConfig },
    { layers: [{ name: "Blink" }] }
  );

  return host;
};

export const createScene = async () => {
  const scene = new THREE.Scene();
  const clock = new THREE.Clock();

  const spaceTexture = new THREE.TextureLoader().load(
    "https://raw.githubusercontent.com/fireship-io/threejs-scroll-animation-demo/main/space.jpg"
  );
  scene.background = spaceTexture;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0x33334d);
  renderer.domElement.id = "renderCanvas";
  document.body.appendChild(renderer.domElement);

  const loadTexture = (setPath: string, load: string) =>
    new Promise<THREE.Texture>((resolve, reject) => {
      new THREE.TextureLoader()
        .setPath(setPath)
        .load(load, resolve, undefined, reject);
    });

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const hdrEquirect = await loadTexture(preUrl, "/images/machine_shop.jpg");
  const hdrCubeRenderTarget = pmremGenerator.fromEquirectangular(hdrEquirect);
  hdrEquirect.dispose();
  pmremGenerator.dispose();

  scene.environment = hdrCubeRenderTarget.texture;

  const camera = new THREE.PerspectiveCamera(
    THREE.MathUtils.radToDeg(0.8),
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const pointLight = new THREE.PointLight(0xffffff);
  pointLight.position.set(50, 20, 20);

  const pointLightHelper = new THREE.PointLightHelper(pointLight);
  const gridHelper = new THREE.GridHelper(10, 10);
  scene.add(pointLightHelper, gridHelper);

  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(0, 1.4, 3.1);

  controls.target = new THREE.Vector3(0, 0.8, 0);
  controls.screenSpacePanning = true;
  controls.update();

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth , window.innerHeight);
  };

  window.addEventListener("resize", onWindowResize, false);

  const render = () => {
    requestAnimationFrame(render);
    controls.update();
    renderFn.forEach((fn) => fn());
    renderer.render(scene, camera);
  };

  render();

  return { scene, camera, clock };
};

export const genGestureMap = async (host: any, text: string) => {
  const gestureMap = host.GestureFeature.createGestureMap();
  const gestureArray = host.GestureFeature.createGenericGestureArray([
    "Gesture",
  ]);
  return HOST.aws.TextToSpeechUtils.autoGenerateSSMLMarks(
    text,
    gestureMap,
    gestureArray
  );
};

export const ctrl = (host: any, text: string) => {
  // ['play', 'pause', 'resume', 'stop']
  host.TextToSpeechFeature["play"](text);
};

export const playGesture = (host: any, text: string) => {
  host.GestureFeature.playGesture("Emote", text);
};

let awsCache: Promise<any>;
export const RunSumerian = async () => {
  if (!awsCache) {
    awsCache = loadScript(
      "https://sdk.amazonaws.com/js/aws-sdk-2.1023.0.min.js"
    );
  }
  await awsCache;

  AWS.config.region = "ap-southeast-1";
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "ap-southeast-1:d1a4f400-8f16-473d-b5c6-444c7d59f382",
  });
  const polly = new AWS.Polly();
  const presigner = new AWS.Polly.Presigner();
  const speechInit = HOST.aws.TextToSpeechFeature.initializeService(
    polly,
    presigner,
    (AWS as any).VERSION
  );

  // Define the glTF assets that will represent the host

  // const preUrl = '/assets/sumerian';
  // github.com/Webiers/learn-three/tree/main/src/assets
  const asset = (x: string) => preUrl + x;
  const characterFile1 = '/assets/3d/ChristineBald/christinebald.gltf';
  // const characterFile1 = asset(
  //   "/glTF/characters/adult_female/cristine/cristine.gltf"
  // );

  // const animationPath1 = asset("/glTF/animations/adult_female");
  const animationPath1 = '/assets/3d/animations';
  const animationFiles = [
    "stand_idle.glb",
    "lipsync.glb",
    "gesture.glb",
    "emote.glb",
    "face_idle.glb",
    "blink.glb",
    "poi.glb",
  ];
  const gestureConfigFile = "gesture.json";
  const poiConfigFile = "poi.json";
  const audioAttachJoint1 = "chardef_c_neckB";
  const lookJoint1 = "charjx_c_look";
  const voice1 = "Aditi";
  const voiceEngine = "neural";
  const { scene, camera, clock } = await createScene();
  const {
    character: character1,
    clips: clips1,
    bindPoseOffset: bindPoseOffset1,
  } = await loadCharacter(
    scene,
    characterFile1,
    animationPath1,
    animationFiles
  );
  character1.position.set(-1.7, 0, 0);
  character1.rotateY(-5);
  const audioAttach1 = character1.getObjectByName(audioAttachJoint1);
  const lookTracker1 = character1.getObjectByName(lookJoint1);
  const gestureConfig1 = await fetch(
    `${animationPath1}/${gestureConfigFile}`
  ).then<GestureConfig>((r) => r.json());
  const poiConfig1 = await fetch(
    `${animationPath1}/${poiConfigFile}`
  ).then<POIConfig>((r) => r.json());

  const [
    idleClips1,
    lipsyncClips1,
    gestureClips1,
    emoteClips1,
    faceClips1,
    blinkClips1,
    poiClips1,
  ] = clips1;

  const host1 = createHost(
    character1,
    audioAttach1,
    voice1,
    voiceEngine,
    idleClips1[0],
    faceClips1[0],
    lipsyncClips1,
    gestureClips1,
    gestureConfig1,
    emoteClips1,
    blinkClips1,
    poiClips1,
    poiConfig1,
    lookTracker1,
    bindPoseOffset1,
    clock,
    camera,
    scene
  );
  const onStopSpeech = () =>
    void host1.PointOfInterestFeature.setTarget(camera);
  host1.listenTo(host1.TextToSpeechFeature.EVENTS.play, () => void {});
  host1.listenTo(host1.TextToSpeechFeature.EVENTS.resume, () => void {});
  HOST.aws.TextToSpeechFeature.listenTo(
    HOST.aws.TextToSpeechFeature.EVENTS.pause,
    onStopSpeech
  );
  HOST.aws.TextToSpeechFeature.listenTo(
    HOST.aws.TextToSpeechFeature.EVENTS.stop,
    onStopSpeech
  );
  await speechInit;

  speakers.set("Grace", host1 as any);
  return host1;
};
