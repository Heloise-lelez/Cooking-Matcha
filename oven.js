// oven.js — gestion du four avec animation de cuisson 5s + ouverture

import { isBowlGrabbed, getBowlOffset } from "./drag.js";

const bowl = document.getElementById("bowl");
const oven = document.getElementById("oven");
const ovenContainer = document.getElementById("oven-container");
const glass = document.getElementById("glass");

let isActive = false;
let completeCbs = [];
let ovenStarted = false;
let bowlAtOven = false;

const COOKING_DURATION = 5000; // 5 secondes de cuisson
const DOOR_OPEN_DELAY = 500; // délai avant l'ouverture de la porte

// ── API publique ─────────────────────────────────────────
export function setOvenActive(active) {
  isActive = active;
  if (active) {
    ovenStarted = false;
    bowlAtOven = false;
  }
}

export function isOvenCooking() {
  return ovenStarted;
}

export function onOvenComplete(cb) {
  completeCbs.push(cb);
}

export function resetOven() {
  isActive = false;
  ovenStarted = false;
  bowlAtOven = false;
  ovenContainer.classList.remove("oven-ready");
  ovenContainer.classList.remove("oven-complete");
  ovenContainer.classList.remove("oven-opening");
  bowl.classList.remove("cooking-in-oven");
  bowl.style.transform = "";
}

// ── Boucle principale ────────────────────────────────────
export function processOven(hand) {
  if (!isActive) return;
  if (ovenStarted) return; // déjà lancé

  const bowlGrabbed = isBowlGrabbed();
  const overOven = isOverOven();

  // Lancer la cuisson si le bol lâche sur le four (AVANT de réinitialiser bowlAtOven)
  if (!bowlGrabbed && bowlAtOven && !ovenStarted) {
    startOven();
  }

  // Placer le bol au four
  if (bowlGrabbed && overOven) {
    if (!bowlAtOven) {
      bowlAtOven = true;
      ovenContainer.classList.add("oven-ready");
    }
  } else {
    if (bowlAtOven) {
      bowlAtOven = false;
      ovenContainer.classList.remove("oven-ready");
    }
  }
}

function isOverOven() {
  const bowlRect = bowl.getBoundingClientRect();
  const ovenRect = oven.getBoundingClientRect();
  const marginX = 60;
  const marginY = 60;

  const bowlCenterX = bowlRect.left + bowlRect.width / 2;
  const bowlCenterY = bowlRect.top + bowlRect.height / 2;

  return (
    bowlCenterX > ovenRect.left - marginX &&
    bowlCenterX < ovenRect.right + marginX &&
    bowlCenterY > ovenRect.top - marginY &&
    bowlCenterY < ovenRect.bottom + marginY
  );
}

function startOven() {
  ovenStarted = true;
  ovenContainer.classList.remove("oven-ready");
  ovenContainer.classList.add("oven-cooking");

  // Réinitialiser le transform du bol avant l'animation
  bowl.style.transform = "";

  // Faire descendre le bol dans le four
  bowl.classList.add("cooking-in-oven");

  // Vider progressivement la préparation du bol
  const bowlMatchaLayer = document.getElementById("bowl-matcha-layer");
  const bowlWaterLayer = document.getElementById("bowl-water-layer");
  const bowlIceLayer = document.getElementById("bowl-ice-layer");
  const bowlButterLayer = document.getElementById("bowl-butter-layer");
  const bowlSugarLayer = document.getElementById("bowl-sugar-layer");
  const bowlEggLayer = document.getElementById("bowl-egg-layer");
  const bowlFlourLayer = document.getElementById("bowl-flour-layer");
  const bowlChocolateLayer = document.getElementById("bowl-chocolate-layer");

  let progress = 0;
  const emptyInterval = setInterval(() => {
    progress += 2;
    if (progress >= 100) {
      progress = 100;
      clearInterval(emptyInterval);
    }

    // Vider tous les layers progressivement
    const currentHeight = 1 - progress / 100;
    if (bowlMatchaLayer)
      bowlMatchaLayer.style.height =
        parseFloat(bowlMatchaLayer.style.height || "0") * currentHeight + "px";
    if (bowlWaterLayer)
      bowlWaterLayer.style.height =
        parseFloat(bowlWaterLayer.style.height || "0") * currentHeight + "px";
    if (bowlIceLayer)
      bowlIceLayer.style.height =
        parseFloat(bowlIceLayer.style.height || "0") * currentHeight + "px";
    if (bowlButterLayer)
      bowlButterLayer.style.height =
        parseFloat(bowlButterLayer.style.height || "0") * currentHeight + "px";
    if (bowlSugarLayer)
      bowlSugarLayer.style.height =
        parseFloat(bowlSugarLayer.style.height || "0") * currentHeight + "px";
    if (bowlEggLayer)
      bowlEggLayer.style.height =
        parseFloat(bowlEggLayer.style.height || "0") * currentHeight + "px";
    if (bowlFlourLayer)
      bowlFlourLayer.style.height =
        parseFloat(bowlFlourLayer.style.height || "0") * currentHeight + "px";
    if (bowlChocolateLayer)
      bowlChocolateLayer.style.height =
        parseFloat(bowlChocolateLayer.style.height || "0") * currentHeight +
        "px";
  }, 50);

  // Animation de cuisson pendant 5 secondes
  setTimeout(() => {
    // Enlever l'animation avant de terminer le four
    bowl.classList.remove("cooking-in-oven");
    finishOven();
  }, COOKING_DURATION);
}

function finishOven() {
  ovenContainer.classList.remove("oven-cooking");
  ovenContainer.classList.add("oven-opening");
  ovenContainer.classList.add("oven-complete");

  // Attendre que l'animation d'ouverture se termine
  setTimeout(() => {
    // Appeler les callbacks pour marquer l'étape comme complétée
    completeCbs.forEach((cb) => cb());
  }, DOOR_OPEN_DELAY + 400);
}
