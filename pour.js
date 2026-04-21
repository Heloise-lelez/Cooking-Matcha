// pour.js — détection du basculement du bol vers le verre

import { isBowlGrabbed, getBowlOffset } from "./drag.js";

const bowl = document.getElementById("bowl");
const glass = document.getElementById("glass");
const glassLiquid = document.getElementById("glass-liquid");
const glassIce = document.getElementById("glass-ice");
const bowlMatchaLayer = document.getElementById("bowl-matcha-layer");
const bowlWaterLayer = document.getElementById("bowl-water-layer");
const bowlIceLayer = document.getElementById("bowl-ice-layer");

let isActive = false;
let tiltAngle = 0; // angle de basculement détecté
let startHeight = 0; // hauteur initiale du bol
let pourProgress = 0; // 0..100
let completeCbs = [];
let tiltHistory = []; // buffer des angles récents
let autoPourStarted = false; // versement automatique lancé?
let currentStepId = null; // id de l'étape courante

const TILT_THRESHOLD = 25; // degrés avant de commencer le versement
const POUR_COMPLETE_ANGLE = 60; // degrés pour terminer
const AUTO_POUR_RATE = 0.8; // vitesse de versement automatique (%/frame)

export function setPourActive(active) {
  isActive = active;
  if (active) {
    pourProgress = 0;
    tiltHistory = [];
    // Mémoriser la hauteur actuelle
    startHeight = Math.max(
      parseFloat(bowlMatchaLayer.style.height || 0),
      parseFloat(bowlWaterLayer.style.height || 0),
    );
  }
}

export function setCurrentStepId(stepId) {
  currentStepId = stepId;
}

export function onPourComplete(cb) {
  completeCbs.push(cb);
}

export function resetPour() {
  isActive = false;
  pourProgress = 0;
  tiltAngle = 0;
  tiltHistory = [];
  autoPourStarted = false;
  glass.classList.remove("pour-ready");
  glassLiquid.style.height = "0px";
  glassIce.style.height = "0px";
  glassIce.style.bottom = "0px";
}

function updateBowlTilt(shouldTilt) {
  const { x, y } = getBowlOffset(); // récupère l'offset actuel du drag
  const tilt = shouldTilt ? "rotateZ(45deg)" : "";
  bowl.style.transform = `translate(${x}px, ${y}px) ${tilt}`;

  // Transition douce seulement sur le tilt, pas sur le drag
}

export function processPour(hand, landmarks) {
  const bowlGrabbed = isBowlGrabbed();
  const overGlass = isOverGlass();

  // Incliner le bol si au-dessus du verre
  updateBowlTilt(bowlGrabbed && overGlass);

  // Lancer le versement automatique dès que le bol arrive au-dessus du verre
  if (bowlGrabbed && overGlass && !autoPourStarted) {
    autoPourStarted = true;
    isActive = true;
    pourProgress = 0;
    startHeight = Math.max(
      parseFloat(bowlMatchaLayer.style.height || 0),
      parseFloat(bowlWaterLayer.style.height || 0),
    );
    glass.classList.add("pour-ready");
  }

  // Stopper si le bol repart
  if (!bowlGrabbed || !overGlass) {
    autoPourStarted = false;
  }

  // Versement automatique frame par frame
  if (autoPourStarted && pourProgress < 100) {
    pourProgress = Math.min(100, pourProgress + AUTO_POUR_RATE);
    animatePour(pourProgress);

    if (pourProgress >= 100) {
      finishPour();
    }
  }
}

// Calcule l'angle de basculement à partir des landmarks MediaPipe
// Plus l'angle est grand, plus le bol est incliné vers l'avant
function calculateTiltAngle(landmarks) {
  const wrist = landmarks[0];
  const palmBase = landmarks[9]; // base du majeur

  // Vecteur paume
  const palmX = palmBase.x - wrist.x;
  const palmY = palmBase.y - wrist.y;

  // Angle par rapport à la verticale (en degrés)
  // 0° = paume vers le bas, 90° = paume vers l'avant
  const radians = Math.atan2(palmX, palmY);
  const degrees = (radians * 180) / Math.PI;

  return Math.abs(degrees);
}

function isOverGlass() {
  const bowlRect = bowl.getBoundingClientRect();
  const glassRect = glass.getBoundingClientRect();
  const marginX = 80; // ← petite marge horizontale
  const marginY = 200; // ← grande marge verticale

  const bowlCenterX = bowlRect.left + bowlRect.width / 2;
  const bowlCenterY = bowlRect.top + bowlRect.height / 2;

  return (
    bowlCenterX > glassRect.left - marginX &&
    bowlCenterX < glassRect.right + marginX &&
    bowlCenterY > glassRect.top - marginY &&
    bowlCenterY < glassRect.bottom + marginY
  );
}
function animatePour(progress) {
  // Afficher les glaçons quand le versement commence
  if (progress > 0) {
    glassIce.style.opacity = "1";
  }

  // Vider le bol progressivement
  const emptyHeight = (startHeight * (100 - progress)) / 100;
  bowlMatchaLayer.style.height = emptyHeight + "px";
  bowlWaterLayer.style.height = emptyHeight * 0.3 + "px"; // garder ratio
  bowlIceLayer.style.marginBottom = emptyHeight * 0.2 + "px"; // garder ratio
  if (emptyHeight < 5) {
    bowlIceLayer.style.opacity = 0;
  }

  // Remplir le verre
  const glassHeight = (100 * progress) / 100; // 100px = hauteur max du verre
  glassLiquid.style.height = glassHeight + "px";

  // Positionner les glaçons au-dessus du liquide
  const iceHeight = 15; // hauteur des glaçons
  if (glassHeight > 0) {
    glassIce.style.height = Math.min(iceHeight, glassHeight + iceHeight) + "px";
    glassIce.style.bottom = glassHeight + "px";
  } else {
    glassIce.style.height = "0px";
  }
}

function finishPour() {
  pourProgress = 100;
  glass.classList.add("pour-complete");
  completeCbs.forEach((cb) => cb());
}
