let fft, mic, micLevel;
let partNum,
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

  // filter(BLUR, 10);
  colorMode(HSB, 365, 100, 100, 1);
  partNum = 5;
  for (i = 0; i < partNum; i++) {
    particles.push([]);
    for (j = 0; j < partNum; j++) {
      particles[i].push(
        new Particle((width / partNum) * i, (height / partNum) * j, 0, 0)
      );
    }
  }
  windowDepth = windowWidth;
  for (i = 0; i < partNum; i++) {
    particles3d.push([]);
    for (j = 0; j < partNum; j++) {
      particles3d[i].push([]);
      for (k = 0; k < partNum; k++) {
        particles3d[i][j].push(
          new Particle3d(
            (windowWidth / partNum) * i,
            (windowHeight / partNum) * j,
            (windowDepth / partNum) * k,
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
  orbitControl();
  //inputs
  mic.amp(1);
  micLevel = mic.getLevel();
  let y = height - micLevel * height;
  ellipse(width / 2, y, 10, 10);
  waves = fft.waveform();
  freqs = fft.analyze();

  //sub-draw-functions

  //drawFreqs(freqs, slider_mode_1.value());
  //drawWaveform(waves, slider_mode_2.value());

  drawBackground(slider_mode_4.value(), slider_mode_5.value());

  // drawCircles(
  //   freqs,
  //   waves,
  //   1,
  //   slider_mode_3.value(),
  //   slider_mode_2.value(),
  //   slider_mode_4.value()
  // );

  //drawParticles(freqs, waves, particles, partNum, 1);
  drawParticles3d(freqs, waves, particles3d, partNum, 1);
  //freq_KMeans(freqs, waves, particles);

  //ThreeDLandscape(freqs, waves, terrain, 10, 10, 10);
  // ThreeDCopy(
  //   slider_mode_8.value(),
  //   rows,
  //   cols,
  //   flying,
  //   w,
  //   h,
  //   terrain,
  //   freqs,
  //   waves
  // );
  //keep track here so can check if screen size changes on next draw call
  width_ = windowWidth;
  height_ = windowHeight;
}

function drawBackground(mode, alpha) {
  if (mode == 10) {
    background(random(360), random(100), random(100), alpha); // alpha
  } else {
    background(360, 100, 0, alpha);
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
    ellipse(0, 0, freqs[i] / 2, freqs[i] * 5 + 5 * freq_random);
    pop();
  }
  //endShape();
}

function drawParticles(freqs, waves, particles, partNum, mode) {
  let freq_sum = freqs.reduce((a, b) => a + b, 0);
  let freq_avg = freq_sum / freqs.length || 0;
  let maxDist =
    Math.cbrt(windowWidth * windowWidth + windowHeight * windowHeight) / 2;
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
        circle(particles[i][j].xLoc, particles[i][j].yLoc, pVel ** 1.5 + 5);

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
  let maxDist =
    Math.cbrt(
      windowWidth * windowWidth +
        windowHeight * windowHeight +
        windowDepth * windowDepth
    ) / 2;
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
            particles[i][j][k].xLoc / 2,
            particles[i][j][k].yLoc / 2,
            particles[i][j][k].zLoc / 2
          );
          sphere(pVel ** 1.5 + 5);
          translate(
            -particles[i][j][k].xLoc / 2,
            -particles[i][j][k].yLoc / 2,
            -particles[i][j][k].zLoc / 2
          );
          pop();

          if (freqs[freq] < freq_avg) {
            if (particles[i][j][k].xLoc > windowWidth / 2) {
              particles[i][j][k].xVel += random(-freqs[freq] / vel_damp, 0);
            } else {
              particles[i][j][k].xVel += random(0, freqs[freq] / vel_damp);
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
          } else {
            if (particles[i][j][k].xLoc <= windowWidth / 2) {
              particles[i][j][k].xVel += random(-freqs[freq] / vel_damp, 0);
            } else {
              particles[i][j][k].xVel += random(0, freqs[freq] / vel_damp);
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

function freq_KMeans(freqs, waves, particles) {
  //cluster frequencies together based on their relative change in amplitude over time
  //keep track of percent change of each frequency over a period of time
  //x axis = frequency, y axis = percent change between samples
  //can then group things together along the y axis and take the ratio of points in that cluster to the whole
  //as the 'volume' of that instrument
}
// help from mesh landscape by ada10086 on p5js web editor
function ThreeDLandscape(freqs, waves, terrain, rows, cols, scl) {
  for (var y = 0; y < rows - 1; y++) {
    beginShape(TRIANGLE_STRIP);
    for (var x = 0; x < cols; x++) {
      let freqx = Math.floor((freqs.length / cols) * x);
      let freqy = Math.floor((freqs.length / rows) * y);
      let freqy1 = Math.floor((freqs.length / rows) * (y + 1));
      let zHeight = (freqs[freqx] * freqs[freqy]) / 1000;
      let zHeight1 = (freqs[freqx] * freqs[freqy1]) / 1000;
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

function ThreeDCopy(scl, rows, cols, flying, w, h, terrain, freqs, waves) {
  translate(0, 0);
  rotateX(PI / 3);
  ambientLight(200, 200, 200);
  specularMaterial(255, 255, 255, 150);
  translate(-w / 2, -h / 2);
  for (var y = 0; y < rows - 1; y++) {
    let freqy = Math.floor((freqs.length / rows) * y);
    stroke(freqs[freqy], 100, 100);
    fill(freqs[freqy], freqs[freqy], freqs[freqy]);
    //beginShape(TRIANGLE_STRIP);
    for (var x = 0; x < cols - 1; x++) {
      let freqx = Math.floor((freqs.length / cols) * x);
      let freqy = Math.floor((freqs.length / rows) * y);
      //let freqxy = Math.floor((freqs.length / rows / cols) * (x * y));
      terrain[x][y] = map(
        Math.sqrt(freqs[freqx] * freqs[freqy]),
        -0.05,
        0.05,
        -0.05,
        0.05
      );
      beginShape(TRIANGLE_STRIP);
      wavey = Math.floor((waves.length / rows) * y);
      wavex = Math.floor((waves.length / cols) * x);
      rotateY(waves[wavey] / 100);
      rotateX(waves[wavex] / 100);

      vertex(x * scl, y * scl, 0);
      vertex(x * scl, y * scl, terrain[x][y + 1]);
      vertex(x * scl, y + 1 * scl, terrain[x][y + 1]);
      vertex((x + 1) * scl, y * scl, terrain[x + 1][y]);
      endShape();
    }
    //endShape();
  }
}

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
  slider_mode_4 = createSlider(1, 10, 3);
  slider_mode_4.position(310, local_height - 50);
  slider_mode_4.style("width", "80px");

  slider_mode_5 = createSlider(0, 1, 1, 0.01);
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
    slider_mode_8
  );
  return GUI;
}

function clearGUI(GUI) {
  for (let i = 0; i < GUI.length; i++) {
    GUI[i].remove();
  }
}
