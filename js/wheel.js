import {
  POINTER_ANGLE,
  SEGMENT_ANGLE,
  SPIN_DURATION_MS,
  pickSegmentIndex,
  getSegmentById,
} from "./config.js";

export class Wheel {
  constructor(rotorEl) {
    this.rotor = rotorEl;
    this.rotation = 0;
    this.spinning = false;
    this.onComplete = null;
    this._setReadableRotation();
    this._boundEnd = this._handleTransitionEnd.bind(this);
    this.rotor.addEventListener("transitionend", this._boundEnd);
  }

  _handleTransitionEnd(e) {
    if (e.target !== this.rotor || e.propertyName !== "transform") return;
    if (!this.spinning) return;
    this.spinning = false;
    this.rotor.classList.remove("is-spinning");
    this._setReadableRotation();
    const cb = this.onComplete;
    this.onComplete = null;
    if (cb) cb(this._pendingSegment);
  }

  _normalize(deg) {
    return ((deg % 360) + 360) % 360;
  }

  _rotationForSegment(index, jitter = 0) {
    const center = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const offset = this._normalize(POINTER_ANGLE - center);
    return offset + jitter;
  }

  _setReadableRotation() {
    this.rotor.style.setProperty(
      "--wheel-readable-rotation",
      `${this._normalize(this.rotation)}deg`
    );
  }

  spin({ skipAnimation = false, segmentIndex = null } = {}) {
    if (this.spinning) return Promise.reject(new Error("Already spinning"));

    const index = segmentIndex ?? pickSegmentIndex();
    const segment = getSegmentById(index);
    const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE - 8);
    const fullSpins = 5 + Math.floor(Math.random() * 4);
    const targetOffset = this._rotationForSegment(index, jitter);
    const targetDelta = this._normalize(
      targetOffset - this._normalize(this.rotation)
    );
    const finalRotation = this.rotation + fullSpins * 360 + targetDelta;

    this.spinning = true;
    this._pendingSegment = segment;
    this.rotor.classList.add("is-spinning");

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (skipAnimation || reducedMotion) {
      this.rotor.style.transition = "none";
      this.rotation = finalRotation;
      this.rotor.style.transform = `rotate(${this.rotation}deg)`;
      void this.rotor.offsetHeight;
      this.rotor.style.transition = "";
      this.spinning = false;
      this.rotor.classList.remove("is-spinning");
      this._setReadableRotation();
      return Promise.resolve(segment);
    }

    this.rotor.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
    this.rotation = finalRotation;
    this.rotor.style.transform = `rotate(${this.rotation}deg)`;

    return new Promise((resolve) => {
      this.onComplete = () => resolve(segment);
    });
  }
}
