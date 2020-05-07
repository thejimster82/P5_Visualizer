window.onload = function () {
  var PaintCanvas = function ($) {};
};
let fft, mic, micLevel;
let partNum,
  partNum3d,
  particles = [];

let particles3d = [];

let width_,
  height_,
  allGUI = [];

var cols,
  rows,
  scl = 25,
  w = 500,
  h = 500,
  mouseSpeed,
  flying = 0,
  terrain = [];

var orbiting = false,
  particles_visible = true,
  ellipsoids_visible = false,
  landscape_visible = false,
  waveform_visible = false,
  fft_visible = false;

let windowDepth = 0;
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  background(30); // alpha
  // create an fft to analyze the audio
  fft = new p5.FFT();
  mic = new p5.AudioIn();
  mic.start();
  mic.connect(fft);

  allGUI = drawGUI(windowWidth, windowHeight);

  //filter(BLUR, 10);
  colorMode(HSB, 365, 100, 100, 1);
  partNum = 14;
  for (i = 0; i < partNum; i++) {
    particles.push([]);
    for (j = 0; j < partNum; j++) {
      particles[i].push(
        new Particle(
          (windowWidth / partNum) * i,
          (windowHeight / partNum) * j,
          0,
          0
        )
      );
    }
  }
  partNum3d = 6;
  windowDepth = windowWidth;
  for (i = 0; i < partNum3d; i++) {
    particles3d.push([]);
    for (j = 0; j < partNum3d; j++) {
      particles3d[i].push([]);
      for (k = 0; k < partNum3d; k++) {
        particles3d[i][j].push(
          new Particle3d(
            (windowWidth / partNum3d) * i,
            (windowHeight / partNum3d) * j,
            (windowDepth / partNum3d) * k,
            0,
            0,
            0
          )
        );
      }
    }
  }
  // let terrInfo = genTerrain(w, h, scl);
  // cols = terrInfo[0];
  // rows = terrInfo[1];
}

function draw() {
  //auto rescale
  if (width_ != windowWidth || height_ != windowHeight) {
    resizeCanvas(windowWidth, windowHeight, true);
    clearGUI(allGUI);
    allGUI = drawGUI(windowWidth, windowHeight);
  }

  //controls
  orbiting && orbitControl();

  //global modifications
  //translate(-width / 2, -height / 2, 0);
  translate(mouseX - width, mouseY - height, 0);
  smooth();

  //inputs
  mic.amp(1);
  micLevel = mic.getLevel();
  let y = height - micLevel * height;
  waves = fft.waveform();
  freqs = fft.analyze();

  //sub-draw-functions
  drawBackground(
    slider_mode_4.value(),
    slider_mode_5.value(),
    checkbox.checked()
  );

  ellipsoids_visible &&
    drawCircles3d(
      freqs,
      waves,
      1,
      slider_mode_3.value(),
      slider_mode_2.value(),
      slider_mode_4.value(),
      slider_mode_9.value()
    );
  particles_visible && drawParticles(freqs, waves, particles, partNum, 1, true);
  //drawParticles3d(freqs, waves, particles3d, partNum3d, 1);

  landscape_visible && ThreeDLandscape(freqs, waves, terrain, 10, 10, 10);

  //keep track here so can check if screen size changes on next draw call
  width_ = windowWidth;
  height_ = windowHeight;
}

function keyPressed() {
  //space bar
  keyCode === 32 && (orbiting = !orbiting);
  //1,2,3
  keyCode === 49 && (particles_visible = !particles_visible);
  keyCode === 50 && (ellipsoids_visible = !ellipsoids_visible);
  keyCode === 51 && (landscape_visible = !landscape_visible);
}

function drawBackground(mode, alpha, renderBG) {
  if (renderBG) {
    if (mode == 10) {
      background(random(360), random(100), random(100), alpha); // alpha
    } else {
      background(360, 100, 0, alpha);
    }
  }
}

function drawWaveform(wave, mode) {
  stroke(240);
  noFill();
  strokeWeight(3);
  //beginShape();
  for (let i = 0; i < wave.length; i++) {
    let x = map(i, 0, wave.length, 0, width);
    let y = map(wave[i], -1, 1, -height / 2, height / 2);
    if (mode == 0) {
      stroke(wave[i] * 4, x * wave[i] * 4, wave[i] * 4);
    } else {
      stroke(random(255), random(255), random(255));
    }
    point(x, y + height / 2);
  }
  //endShape();
}

function drawFreqs(freqs, mode) {
  noStroke();
  for (let i = 0; i < freqs.length; i++) {
    let x = map(i, 0, freqs.length, 0, width);
    let h = -height + map(freqs[i], 0, 255, height, 0);
    if (mode == 0) {
      fill(h, x, x / 2);
    } else {
      fill(random(255), random(255), random(255));
    }
    rect(x, height, width / freqs.length, h);
  }
}

function drawCircles(freqs, waves, mode, randomness, separation, fraction) {
  let freq_sum = freqs.reduce((a, b) => a + b, 0);
  let freq_avg = freq_sum / freqs.length || 0;
  let waves_sum = waves.reduce((a, b) => a + b, 0);
  let waves_avg = waves_sum / waves.length || 0;
  let deg = 360 / freqs.length;
  noStroke();
  //beginShape(LINES);
  for (let i = 0; i < freqs.length; i += fraction) {
    let freq_random = (freqs[i] * randomness) / 10;
    fill(i % 360, freqs[i] % 100, freqs[i] % 100, freqs[i] % 100);
    let xPos = width / 2;
    let yPos = height / 2;
    push();
    translate(
      xPos + ((Math.cos(deg * i) * freqs[i]) / 5) * separation,
      yPos + ((Math.sin(deg * i) * freqs[i]) / 5) * separation
    );
    rotate(deg * i);
    ellipse(0, 0, freqs[i] / 2, freqs[i] * 5 + 5 * freq_random, 5);
    pop();
  }
  //endShape();
}

function drawCircles3d(
  freqs,
  waves,
  mode,
  randomness,
  separation,
  fraction,
  detail,
  oscillate = true
) {
  let freq_sum = freqs.reduce((a, b) => a + b, 0);
  let freq_avg = freq_sum / freqs.length || 0;
  let waves_sum = waves.reduce((a, b) => a + b, 0);
  let waves_avg = waves_sum / waves.length || 0;
  let deg = 360 / freqs.length;
  noStroke();
  //beginShape(LINES);
  let detail_XY = detail;
  print(detail_XY);
  for (let i = 0; i < freqs.length; i += fraction) {
    // if (oscillate) {
    //   detail_XY = Math.floor((Math.abs(waves[i] * 1000) % 15) + 2);
    // }
    let freq_random = (freqs[i] * randomness) / 10;
    fill(i % 360, freqs[i] % 100, freqs[i] % 100, freqs[i] % 100);
    let xPos = width / 2;
    let yPos = height / 2;
    push();
    translate(
      xPos + ((Math.cos(deg * i) * freqs[i]) / 5) * separation,
      yPos + ((Math.sin(deg * i) * freqs[i]) / 5) * separation
    );
    rotate(deg * i);
    ellipsoid(
      freqs[i] / 2,
      freqs[i] * 5 + 5 * freq_random,
      freqs[i] / 2,
      detail_XY,
      detail_XY
    );
    pop();
  }
  //endShape();
}

function drawParticles(
  freqs,
  waves,
  particles,
  partNum,
  mode,
  spheres = false
) {
  //sum of frequency information
  let freq_sum = freqs.reduce((a, b) => a + b, 0);
  //average frequency
  let freq_avg = freq_sum / freqs.length || 0;
  let maxDist =
    Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight) / 2;
  let vel_damp = slider_mode_6.value();
  noStroke();
  if (mode == 1) {
    for (i = 0; i < partNum; i++) {
      for (j = 0; j < partNum; j++) {
        let pVel = sqrt(sq(particles[i][j].xVel) + sq(particles[i][j].yVel));
        let particleDist = Math.sqrt(
          (particles[i][j].xLoc - windowWidth / 2) ** 2 +
            (particles[i][j].yLoc - windowHeight / 2) ** 2
        );
        let freq = Math.ceil(
          ((particleDist / maxDist) * freqs.length) % freqs.length
        );
        fill(
          freq % 360,
          freqs[freq] % 100,
          freqs[freq] % 100,
          freqs[freq] % 100
        );
        if (spheres) {
          push();
          translate(particles[i][j].xLoc, particles[i][j].yLoc);
          sphere(pVel ** 1.5 + 5);
          pop();
        } else {
          circle(particles[i][j].xLoc, particles[i][j].yLoc, pVel ** 1.5 + 5);
        }

        if (freqs[freq] < freq_avg) {
          if (particles[i][j].xLoc > windowWidth / 2) {
            particles[i][j].xVel += random(-freqs[freq] / vel_damp, 0);
          } else {
            particles[i][j].xVel += random(0, freqs[freq] / vel_damp);
          }
          if (particles[i][j].yLoc < windowHeight / 2) {
            particles[i][j].yVel += random(0, freqs[freq] / vel_damp);
          } else {
            particles[i][j].yVel += random(-freqs[freq] / vel_damp, 0);
          }
        } else {
          if (particles[i][j].xLoc <= windowWidth / 2) {
            particles[i][j].xVel += random(-freqs[freq] / vel_damp, 0);
          } else {
            particles[i][j].xVel += random(0, freqs[freq] / vel_damp);
          }
          if (particles[i][j].yLoc >= windowHeight / 2) {
            particles[i][j].yVel += random(0, freqs[freq] / vel_damp);
          } else {
            particles[i][j].yVel += random(-freqs[freq] / vel_damp, 0);
          }
        }

        particles[i][j].move(windowWidth, windowHeight);
      }
    }
  }
}

function drawParticles3d(freqs, waves, particles, partNum, mode) {
  let freq_sum = freqs.reduce((a, b) => a + b, 0);
  let freq_avg = freq_sum / freqs.length || 0;
  let maxDist = Math.sqrt(sq(windowWidth) + sq(windowHeight)) / 2;
  let vel_damp = slider_mode_6.value();
  noStroke();
  if (mode == 1) {
    for (i = 0; i < partNum; i++) {
      for (j = 0; j < partNum; j++) {
        for (k = 0; k < partNum; k++) {
          let pVel = Math.cbrt(
            sq(particles[i][j][k].xVel) +
              sq(particles[i][j][k].yVel) +
              sq(particles[i][j][k].zVel)
          );
          let particleDist = Math.cbrt(
            (particles[i][j][k].xLoc - windowWidth / 2) ** 2 +
              (particles[i][j][k].yLoc - windowHeight / 2) ** 2 +
              (particles[i][j][k].zLoc - windowDepth / 2) ** 2
          );
          let freq = Math.ceil(
            ((particleDist / maxDist) * freqs.length) % freqs.length
          );
          fill(
            freq % 360,
            freqs[freq] % 100,
            freqs[freq] % 100,
            freqs[freq] % 100
          );
          push();
          translate(
            particles[i][j][k].xLoc,
            particles[i][j][k].yLoc,
            particles[i][j][k].zLoc
          );
          sphere(pVel ** 1.5 + 5);
          translate(
            -particles[i][j][k].xLoc,
            -particles[i][j][k].yLoc,
            -particles[i][j][k].zLoc
          );
          pop();

          //move toward freq band if less than
          if (freqs[freq] < freq_avg) {
            if (particles[i][j][k].xLoc < windowWidth / 2) {
              particles[i][j][k].xVel += random(0, freqs[freq] / vel_damp);
            } else {
              particles[i][j][k].xVel += random(-freqs[freq] / vel_damp, 0);
            }
            if (particles[i][j][k].yLoc < windowHeight / 2) {
              particles[i][j][k].yVel += random(0, freqs[freq] / vel_damp);
            } else {
              particles[i][j][k].yVel += random(-freqs[freq] / vel_damp, 0);
            }
            if (particles[i][j][k].zLoc < windowDepth / 2) {
              particles[i][j][k].zVel += random(0, freqs[freq] / vel_damp);
            } else {
              particles[i][j][k].zVel += random(-freqs[freq] / vel_damp, 0);
            }
            //move toward freq band if greater than
          } else {
            if (particles[i][j][k].xLoc >= windowWidth / 2) {
              particles[i][j][k].xVel += random(0, freqs[freq] / vel_damp);
            } else {
              particles[i][j][k].xVel += random(-freqs[freq] / vel_damp, 0);
            }
            if (particles[i][j][k].yLoc >= windowHeight / 2) {
              particles[i][j][k].yVel += random(0, freqs[freq] / vel_damp);
            } else {
              particles[i][j][k].yVel += random(-freqs[freq] / vel_damp, 0);
            }
            if (particles[i][j][k].zLoc >= windowDepth / 2) {
              particles[i][j][k].zVel += random(0, freqs[freq] / vel_damp);
            } else {
              particles[i][j][k].zVel += random(-freqs[freq] / vel_damp, 0);
            }
          }

          particles[i][j][k].move(windowWidth, windowHeight, windowDepth);
        }
      }
    }
  }
}

// help from mesh landscape by ada10086 on p5js web editor
function ThreeDLandscape(freqs, waves, terrain, rows, cols, scl) {
  for (var y = 0; y < rows - 1; y++) {
    let freqy = Math.floor((freqs.length / rows) * y);
    noStroke();
    fill(freqs[freqy], freqs[freqy], freqs[freqy]);
    beginShape(TRIANGLE_STRIP);
    for (var x = 0; x < cols; x++) {
      let freqx = Math.floor((freqs.length / cols) * x);
      let freqy1 = Math.floor((freqs.length / rows) * (y + 1));
      let zHeight = (freqs[freqx] * freqs[freqy]) / 100;
      let zHeight1 = (freqs[freqx] * freqs[freqy1]) / 100;
      //fill(terrain[x][y], terrain[x][y], terrain[x][y]);
      vertex((windowWidth / cols) * x, (windowHeight / rows) * y, zHeight);
      vertex(
        (windowWidth / cols) * x,
        (windowHeight / rows) * (y + 1),
        zHeight1
      );
    }
    endShape();
  }
}

// function ThreeDCopy(scl, rows, cols, flying, w, h, terrain, freqs, waves) {
//   rotateX(PI / 3);
//   ambientLight(200, 200, 200);
//   specularMaterial(255, 255, 255, 150);
//   //translate(-w / 2, -h / 2);
//   for (var y = 0; y < rows - 1; y++) {
//     let freqy = Math.floor((freqs.length / rows) * y);
//     stroke(freqs[freqy], 100, 100);
//     fill(freqs[freqy], freqs[freqy], freqs[freqy]);
//     //beginShape(TRIANGLE_STRIP);
//     for (var x = 0; x < cols - 1; x++) {
//       let freqx = Math.floor((freqs.length / cols) * x);
//       let freqy = Math.floor((freqs.length / rows) * y);
//       //let freqxy = Math.floor((freqs.length / rows / cols) * (x * y));
//       terrain[x][y] = map(
//         Math.sqrt(freqs[freqx] * freqs[freqy]),
//         -0.05,
//         0.05,
//         -0.05,
//         0.05
//       );
//       beginShape(TRIANGLE_STRIP);
//       wavey = Math.floor((waves.length / rows) * y);
//       wavex = Math.floor((waves.length / cols) * x);
//       rotateY(waves[wavey] / 100);
//       rotateX(waves[wavex] / 100);

//       vertex(x * scl, y * scl, 0);
//       vertex(x * scl, y * scl, terrain[x][y + 1]);
//       vertex(x * scl, y + 1 * scl, terrain[x][y + 1]);
//       vertex((x + 1) * scl, y * scl, terrain[x + 1][y]);
//       endShape();
//     }
//     //endShape();
//   }
// }

function genTerrain(w, h, scl) {
  let cols = w / scl;
  let rows = h / scl;
  for (var x = 0; x < cols; x++) {
    terrain[x] = [];
    for (var y = 0; y < rows; y++) {
      terrain[x][y] = 0;
    }
  }
  return [cols, rows];
}

function drawGUI(local_width, local_height) {
  slider_mode_1 = createSlider(0, 100, 0);
  slider_mode_1.position(10, local_height - 50);
  slider_mode_1.style("width", "80px");
  //vol slider
  slider_mode_2 = createSlider(0, 10, 0);
  slider_mode_2.position(110, local_height - 50);
  slider_mode_2.style("width", "80px");
  //background slider
  slider_mode_3 = createSlider(0, 10, 0);
  slider_mode_3.position(210, local_height - 50);
  slider_mode_3.style("width", "80px");
  //background slider
  slider_mode_4 = createSlider(1, 10, 5, 1);
  slider_mode_4.position(310, local_height - 50);
  slider_mode_4.style("width", "80px");

  slider_mode_5 = createSlider(0, 1, 0.5, 0.01);
  slider_mode_5.position(410, local_height - 50);
  slider_mode_5.style("width", "80px");

  slider_mode_6 = createSlider(1, 100, 30);
  slider_mode_6.position(510, local_height - 50);
  slider_mode_6.style("width", "80px");

  slider_mode_7 = createSlider(0, 2, 0);
  slider_mode_7.position(610, local_height - 50);
  slider_mode_7.style("width", "80px");

  slider_mode_8 = createSlider(0, 50, 30);
  slider_mode_8.position(710, local_height - 50);
  slider_mode_8.style("width", "80px");

  slider_mode_9 = createSlider(2, 15, 10, 1);
  slider_mode_9.position(810, local_height - 50);
  slider_mode_9.style("width", "80px");

  checkbox = createCheckbox("background", true);
  checkbox.position(910, height - 50);
  // checkbox_1 = createCheckbox("threshold", false);
  // checkbox_1.position(710, height - 50);
  // checkbox_2 = createCheckbox("invert", false);
  // checkbox_2.position(710, height - 100);
  // checkbox_3 = createCheckbox("posterize", false);
  // checkbox_3.position(710, height - 150);
  let GUI = [];
  GUI.push(
    slider_mode_1,
    slider_mode_2,
    slider_mode_3,
    slider_mode_4,
    slider_mode_5,
    slider_mode_6,
    slider_mode_7,
    slider_mode_8,
    slider_mode_9,
    checkbox
  );
  return GUI;
}

function clearGUI(GUI) {
  for (let i = 0; i < GUI.length; i++) {
    GUI[i].remove();
  }
}
