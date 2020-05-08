window.onload = function () {
  //necessary so google chrome will let the audio run
  var context = new AudioContext();
  var PaintCanvas = function (p) {
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
      particles_visible = false,
      ellipsoids_visible = true,
      landscape_visible = false,
      waveform_visible = false,
      fft_visible = false,
      draw_active = true,
      background_rendered = true,
      trackMouse = false,
      staticRotate = false,
      bg_crazy = false;

    var zLoc = 1000,
      scrollDelta = 0,
      mouseXLastFrame = 0,
      mouseYLastFrame = 0,
      eyeZ,
      rotateXSaved = 0,
      rotateYSaved = 0,
      rotateZSaved = 0;

    var canv;

    let windowDepth = 0;
    p.setup = function () {
      canv = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
      gl = this._renderer.GL;
      gl.disable(gl.DEPTH_TEST);
      p.background(30);
      eyeZ = p.windowHeight / 2 / p.tan((30 * p.PI) / 180);

      // create an fft to analyze the audio
      fft = new p5.FFT();
      mic = new p5.AudioIn();
      mic.start();
      mic.connect(fft);

      allGUI = p.drawGUI(p.windowWidth, p.windowHeight);

      //filter(BLUR, 10);
      p.colorMode(p.HSB, 365, 100, 100, 1);
      partNum = 14;
      for (i = 0; i < partNum; i++) {
        particles.push([]);
        for (j = 0; j < partNum; j++) {
          particles[i].push(
            new Particle(
              (p.windowWidth / partNum) * i,
              (p.windowHeight / partNum) * j,
              0,
              0
            )
          );
        }
      }
      partNum3d = 6;
      windowDepth = p.windowWidth;
      for (i = 0; i < partNum3d; i++) {
        particles3d.push([]);
        for (j = 0; j < partNum3d; j++) {
          particles3d[i].push([]);
          for (k = 0; k < partNum3d; k++) {
            particles3d[i][j].push(
              new Particle3d(
                (p.windowWidth / partNum3d) * i,
                (p.windowHeight / partNum3d) * j,
                (p.windowDepth / partNum3d) * k,
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
    };

    p.draw = function () {
      //____________________window rescaling____________________
      if (width_ != p.windowWidth || height_ != p.windowHeight) {
        p.resizeCanvas(p.windowWidth, p.windowHeight, true);
        p.clearGUI(allGUI);
        allGUI = p.drawGUI(p.windowWidth, p.windowHeight);
      }

      //____________________controls____________________
      zLoc += Math.floor(scrollDelta);

      //keep within screen bounds
      zLoc > 10000 && (zLoc = 10000);
      zLoc < -1100 && (zLoc = -1100);
      scrollDelta = 0;
      orbiting && p.orbitControl();

      //inputs
      mic.amp(1);
      micLevel = mic.getLevel();
      let y = p.windowHeight - micLevel * p.windowHeight;
      waves = fft.waveform();
      freqs = fft.analyze();

      //raycasting to get mouse position in 3-space
      const xAdj = p.mouseX - p.windowWidth / 2;
      const yAdj = p.mouseY - p.windowHeight / 2;
      const Q = p.createVector(0, 0, eyeZ); // A point on the ray and the default position of the camera.
      const v = p.createVector(xAdj, yAdj, -eyeZ); // The direction vector of the ray.

      //create invisible plane at zLoc
      workingPlane = new IntersectPlane(0, 0, 1, 0, 0, zLoc);
      let lambda = workingPlane.getLambda(Q, v);
      let intersect = p5.Vector.add(Q, p5.Vector.mult(v, lambda));

      staticRotate &&
        p.rotateX(p.millis() / 1000) &&
        p.rotateZ(p.millis() / 1000);

      if (p.mouseIsPressed && p.mouseButton === p.RIGHT) {
        let mouseXDiff = p.mouseX - mouseXLastFrame;
        rotateXSaved += mouseXDiff / 20;
        mouseXLastFrame = p.mouseX;
      }
      //move brush to mouse position in 3-space
      trackMouse && p.translate(intersect);

      //adjust coordinate system for WebGL
      let center = new p5.Vector(-p.windowWidth / 2, -p.windowHeight / 2, 0);
      //p.rotate(rotateXSaved, intersect);

      //____________________brush options____________________
      //sub-draw-functions
      background_rendered && p.drawBackground(bg_crazy, slider_mode_2.value());
      p.smooth();
      if (draw_active) {
        ellipsoids_visible &&
          p.drawCircles3d(
            freqs,
            waves,
            1,
            slider_mode_1.value(),
            slider_mode_1.value(),
            slider_mode_1.value(),
            slider_mode_1.value()
          );

        particles_visible &&
          p.drawParticles(freqs, waves, particles, partNum, 1, true);

        landscape_visible &&
          p.ThreeDLandscape(freqs, waves, terrain, 10, 10, 10);

        //keep track here so can check if screen size changes on next draw call
        width_ = p.windowWidth;
        height_ = p.windowHeight;
      }

      //record mousewheel movement for moving in z axis
      p.mouseWheel = function (event) {
        scrollDelta = event.delta;
      };

      //record key presses for events
      p.keyPressed = function () {
        //background active (spacebar)
        p.keyCode === 32 && (background_rendered = !background_rendered);

        //drawing or not (d)
        p.keyCode === 68 && (draw_active = !draw_active);

        //track mouse(e)
        p.keyCode === 69 && (trackMouse = !trackMouse);

        //static rotate(q)
        p.keyCode === 81 && (staticRotate = !staticRotate);

        //particles, ellipsoids, landscape (1,2,3)
        p.keyCode === 49 && (particles_visible = !particles_visible);
        p.keyCode === 50 && (ellipsoids_visible = !ellipsoids_visible);
        p.keyCode === 51 && (landscape_visible = !landscape_visible);

        //background crazy mode (x)
        p.keyCode === 88 && (bg_crazy = !bg_crazy);
      };
    };

    p.drawBackground = function (bg_random, alpha) {
      if (bg_random) {
        p.background(p.random(360), p.random(100), p.random(100), alpha); // alpha
      } else {
        p.background(360, 100, 0, alpha);
      }
    };

    p.drawWaveform = function (wave, mode) {
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
    };

    p.drawFreqs = function (freqs, mode) {
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
    };

    p.drawCircles = function (
      freqs,
      waves,
      mode,
      randomness,
      separation,
      fraction
    ) {
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
        let xPos = p.windowWidth / 2;
        let yPos = p.windowHeight / 2;
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
    };

    p.drawCircles3d = function (
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
      //p.noStroke();
      //beginShape(LINES);
      let detail_XY = Math.floor(detail);
      for (let i = 0; i < freqs.length; i += Math.floor(fraction)) {
        let freq_random = (freqs[i] * randomness) / 10;
        p.fill(i % 360, freqs[i] % 100, freqs[i] % 100, freqs[i] % 100);
        p.push();
        p.translate(
          ((Math.cos(deg * i) * freqs[i]) / 5) * separation,
          ((Math.sin(deg * i) * freqs[i]) / 5) * separation
        );
        p.rotate(deg * i);
        p.cone(
          freqs[i] / 2,
          freqs[i] * 5 + 5 * freq_random,
          detail_XY,
          detail_XY
        );
        p.pop();
      }
      //endShape();
    };

    p.drawParticles = function (
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
        Math.sqrt(
          p.windowWidth * p.windowWidth + p.windowHeight * p.windowHeight
        ) / 2;
      let vel_damp = slider_mode_3.value();
      p.noStroke();
      if (mode == 1) {
        for (i = 0; i < partNum; i++) {
          for (j = 0; j < partNum; j++) {
            let pVel = p.sqrt(
              p.sq(particles[i][j].xVel) + p.sq(particles[i][j].yVel)
            );
            let particleDist = Math.sqrt(
              (particles[i][j].xLoc - p.windowWidth / 2) ** 2 +
                (particles[i][j].yLoc - p.windowHeight / 2) ** 2
            );
            let freq = Math.ceil(
              ((particleDist / maxDist) * freqs.length) % freqs.length
            );
            p.fill(
              freq % 360,
              freqs[freq] % 100,
              freqs[freq] % 100,
              freqs[freq] % 100
            );
            if (spheres) {
              p.push();
              p.translate(particles[i][j].xLoc, particles[i][j].yLoc);
              p.sphere(pVel ** 1.5 + 5);
              p.pop();
            } else {
              p.circle(
                particles[i][j].xLoc,
                particles[i][j].yLoc,
                pVel ** 1.5 + 5
              );
            }

            if (freqs[freq] < freq_avg) {
              if (particles[i][j].xLoc > p.windowWidth / 2) {
                particles[i][j].xVel += p.random(-freqs[freq] / vel_damp, 0);
              } else {
                particles[i][j].xVel += p.random(0, freqs[freq] / vel_damp);
              }
              if (particles[i][j].yLoc < p.windowHeight / 2) {
                particles[i][j].yVel += p.random(0, freqs[freq] / vel_damp);
              } else {
                particles[i][j].yVel += p.random(-freqs[freq] / vel_damp, 0);
              }
            } else {
              if (particles[i][j].xLoc <= p.windowWidth / 2) {
                particles[i][j].xVel += p.random(-freqs[freq] / vel_damp, 0);
              } else {
                particles[i][j].xVel += p.random(0, freqs[freq] / vel_damp);
              }
              if (particles[i][j].yLoc >= p.windowHeight / 2) {
                particles[i][j].yVel += p.random(0, freqs[freq] / vel_damp);
              } else {
                particles[i][j].yVel += p.random(-freqs[freq] / vel_damp, 0);
              }
            }

            particles[i][j].move(p.windowWidth, p.windowHeight);
          }
        }
      }
    };

    // help from mesh landscape by ada10086 on p5js web editor
    p.ThreeDLandscape = function (freqs, waves, terrain, rows, cols, scl) {
      for (var y = 0; y < rows - 1; y++) {
        let freqy = Math.floor((freqs.length / rows) * y);
        p.noStroke();
        p.fill(freqs[freqy], freqs[freqy], freqs[freqy]);
        p.beginShape(p.TRIANGLE_STRIP);
        for (var x = 0; x < cols; x++) {
          let freqx = Math.floor((freqs.length / cols) * x);
          let freqy1 = Math.floor((freqs.length / rows) * (y + 1));
          let zHeight = (freqs[freqx] * freqs[freqy]) / 100;
          let zHeight1 = (freqs[freqx] * freqs[freqy1]) / 100;
          //fill(terrain[x][y], terrain[x][y], terrain[x][y]);
          p.vertex(
            (p.windowWidth / cols) * x,
            (p.windowHeight / rows) * y,
            zHeight
          );
          p.vertex(
            (p.windowWidth / cols) * x,
            (p.windowHeight / rows) * (y + 1),
            zHeight1
          );
        }
        p.endShape();
      }
    };

    p.drawGUI = function (local_width, local_height) {
      let GUI = [];

      startX = 10;
      local_height = local_height - 50;

      slider_mode_1 = p.createSlider(1, 10, 5, 0.1);
      slider_mode_2 = p.createSlider(0, 1, 0.9, 0.01);
      slider_mode_3 = p.createSlider(1, 100, 30);
      saveButton = p.createButton("Save Canvas");

      GUI.push(
        slider_mode_1, //circles randomness, circles separation, circles fraction, circles oscillation
        slider_mode_2, //draw background alpha
        slider_mode_3, //particle velocity
        saveButton
      );

      for (let i = 0; i < GUI.length; i++) {
        GUI[i].position(startX + 100 * i, local_height);
        GUI[i].style("width", "80px");
      }

      saveButton.mousePressed(p.saveCanvas);

      return GUI;
    };

    p.clearGUI = function (GUI) {
      for (let i = 0; i < GUI.length; i++) {
        GUI[i].remove();
      }
    };

    p.saveCanvas = function () {
      p.save(canv);
    };

    class IntersectPlane {
      constructor(n1, n2, n3, p1, p2, p3) {
        this.normal = p.createVector(n1, n2, n3); // The normal vector of the plane
        this.point = p.createVector(p1, p2, p3); // A point on the plane
        this.d = this.point.dot(this.normal);
      }

      getLambda(Q, v) {
        return (-this.d - this.normal.dot(Q)) / this.normal.dot(v);
      }
    }

    //necessary so google chrome will let the audio run
    p.touchStarted = function () {
      p.getAudioContext().resume();
    };
  };

  var main_canvas = new p5(PaintCanvas, "paint-canvas-container");
};

// p.drawParticles3d = function(freqs, waves, particles, partNum, mode) {
//   let freq_sum = freqs.reduce((a, b) => a + b, 0);
//   let freq_avg = freq_sum / freqs.length || 0;
//   let maxDist = Math.sqrt(sq(windowWidth) + sq(windowHeight)) / 2;
//   let vel_damp = slider_mode_6.value();
//   noStroke();
//   if (mode == 1) {
//     for (i = 0; i < partNum; i++) {
//       for (j = 0; j < partNum; j++) {
//         for (k = 0; k < partNum; k++) {
//           let pVel = Math.cbrt(
//             sq(particles[i][j][k].xVel) +
//               sq(particles[i][j][k].yVel) +
//               sq(particles[i][j][k].zVel)
//           );
//           let particleDist = Math.cbrt(
//             (particles[i][j][k].xLoc - windowWidth / 2) ** 2 +
//               (particles[i][j][k].yLoc - windowHeight / 2) ** 2 +
//               (particles[i][j][k].zLoc - windowDepth / 2) ** 2
//           );
//           let freq = Math.ceil(
//             ((particleDist / maxDist) * freqs.length) % freqs.length
//           );
//           fill(
//             freq % 360,
//             freqs[freq] % 100,
//             freqs[freq] % 100,
//             freqs[freq] % 100
//           );
//           push();
//           translate(
//             particles[i][j][k].xLoc,
//             particles[i][j][k].yLoc,
//             particles[i][j][k].zLoc
//           );
//           sphere(pVel ** 1.5 + 5);
//           translate(
//             -particles[i][j][k].xLoc,
//             -particles[i][j][k].yLoc,
//             -particles[i][j][k].zLoc
//           );
//           pop();

//           //move toward freq band if less than
//           if (freqs[freq] < freq_avg) {
//             if (particles[i][j][k].xLoc < windowWidth / 2) {
//               particles[i][j][k].xVel += random(0, freqs[freq] / vel_damp);
//             } else {
//               particles[i][j][k].xVel += random(-freqs[freq] / vel_damp, 0);
//             }
//             if (particles[i][j][k].yLoc < windowHeight / 2) {
//               particles[i][j][k].yVel += random(0, freqs[freq] / vel_damp);
//             } else {
//               particles[i][j][k].yVel += random(-freqs[freq] / vel_damp, 0);
//             }
//             if (particles[i][j][k].zLoc < windowDepth / 2) {
//               particles[i][j][k].zVel += random(0, freqs[freq] / vel_damp);
//             } else {
//               particles[i][j][k].zVel += random(-freqs[freq] / vel_damp, 0);
//             }
//             //move toward freq band if greater than
//           } else {
//             if (particles[i][j][k].xLoc >= windowWidth / 2) {
//               particles[i][j][k].xVel += random(0, freqs[freq] / vel_damp);
//             } else {
//               particles[i][j][k].xVel += random(-freqs[freq] / vel_damp, 0);
//             }
//             if (particles[i][j][k].yLoc >= windowHeight / 2) {
//               particles[i][j][k].yVel += random(0, freqs[freq] / vel_damp);
//             } else {
//               particles[i][j][k].yVel += random(-freqs[freq] / vel_damp, 0);
//             }
//             if (particles[i][j][k].zLoc >= windowDepth / 2) {
//               particles[i][j][k].zVel += random(0, freqs[freq] / vel_damp);
//             } else {
//               particles[i][j][k].zVel += random(-freqs[freq] / vel_damp, 0);
//             }
//           }

//           particles[i][j][k].move(windowWidth, windowHeight, windowDepth);
//         }
//       }
//     }
//   }
// }

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
//https://p5js.org/examples/3d-ray-casting.html
