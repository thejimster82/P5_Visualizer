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
      ellipsoids_visible = false,
      controls_visible = true,
      waveform_visible = false,
      fft_visible = false,
      draw_active = true,
      background_rendered = true,
      trackMouse = false,
      staticRotate = false,
      bg_crazy = false,
      reflective_colors = false;

    var zLoc = 200,
      scrollDelta = 0,
      mouseXLastFrame = 0,
      mouseYLastFrame = 0,
      eyeZ,
      rotateXSaved = 0,
      rotateYSaved = 0,
      rotateZSaved = 0;

    var canv;

    let windowDepth = 0;
    let inconsolata;
    p.preload = function () {
      inconsolata = p.loadFont("assets/Inconsolata-Regular.ttf");
      backup_song = p.loadSound("assets/Spell - Shade.mp3");
    };

    p.setup = function () {
      canv = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
      p.textFont(inconsolata);
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
              (p.windowWidth / partNum) * i - p.windowWidth / 2,
              (p.windowHeight / partNum) * j - p.windowHeight / 2,
              0,
              0
            )
          );
        }
      }

      // let terrInfo = genTerrain(w, h, scl);
      // cols = terrInfo[0];
      // rows = terrInfo[1];
    };

    p.draw = function () {
      p.push();
      //____________________window rescaling____________________
      if (width_ != p.windowWidth || height_ != p.windowHeight) {
        p.resizeCanvas(p.windowWidth, p.windowHeight, true);
        p.clearGUI(allGUI);
        allGUI = p.drawGUI(p.windowWidth, p.windowHeight);
      }

      //____________________controls____________________
      zLoc += Math.floor(scrollDelta * 2);

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

      //move brush to mouse position in 3-space
      if (trackMouse) {
        p.translate(intersect);
      }
      if (staticRotate) {
        p.rotateX(p.millis() / 1000);
        p.rotateZ(p.millis() / 1000);
        rotateXSaved = p.millis() / 1000;
      }

      //p.rotate(rotateXSaved, intersect);

      //____________________brush options____________________
      //sub-draw-functions
      background_rendered && p.drawBackground(bg_crazy, slider_mode_2.value());

      p.smooth();
      if (reflective_colors) {
        p.colorMode(p.RGB);
        p.lights();
        // p.pointLight(255, 255, 255, intersect);
        p.pointLight(255, 255, 255, intersect);
        p.colorMode(p.HSB, 365, 100, 100, 1);
      }
      if (draw_active) {
        particles_visible &&
          p.drawParticles(
            freqs,
            waves,
            particles,
            partNum,
            1,
            true,
            slider_mode_3.value(),
            reflective_colors
          );
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

        if (controls_visible) {
          p.textSize(40);
          p.fill(255, 0, 0);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(
            "Controls:\n\n1: enable particles\n2: enable flower\n Space: allow overlap\n f: enable 3D renderer\n e: enable/disable mouse following\n q: enable/disable rotation\nscroll wheel: scale (in mouse follow mode)\nx: enable background rainbow\nd: stop drawing (so you can save)\n3: toggle Controls menu\n\nBy: Jimmy Howerton",
            0,
            0
          );
        }
        //the whole thing above must be push/poped in order to keep the text from moving with the mouse as well
        p.pop();
        p.fill(255, 0, 0);
        p.textSize(20);
        p.textAlign(p.LEFT, p.BASELINE);
        p.text("Flower", -p.windowWidth / 2 + 10, p.windowHeight / 2 - 70);
        p.text("Background", -p.windowWidth / 2 + 110, p.windowHeight / 2 - 70);
        p.text("Particles", -p.windowWidth / 2 + 210, p.windowHeight / 2 - 70);
        //p.ThreeDLandscape(freqs, waves, terrain, 10, 10, 10);

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

        //enable reflective colors(f)
        p.keyCode === 70 && (reflective_colors = !reflective_colors);

        //track mouse(e)
        p.keyCode === 69 && (trackMouse = !trackMouse);

        //static rotate(q)
        p.keyCode === 81 && (staticRotate = !staticRotate);

        //particles, ellipsoids, landscape (1,2,3)
        p.keyCode === 49 && (particles_visible = !particles_visible);
        p.keyCode === 50 && (ellipsoids_visible = !ellipsoids_visible);
        p.keyCode === 51 && (controls_visible = !controls_visible);

        //background crazy mode (x)
        p.keyCode === 88 && (bg_crazy = !bg_crazy);

        //orbiting (z)
        p.keyCode === 90 && (orbiting = !orbiting);
      };
    };

    p.drawBackground = function (bg_random, alpha) {
      if (bg_random) {
        p.background(p.random(360), p.random(100), p.random(100), 100); // alpha
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

      //beginShape(LINES);
      let detail_XY = Math.floor(detail);
      for (let i = 0; i < freqs.length; i += Math.floor(fraction)) {
        let freq_random = (freqs[i] * randomness) / 10;
        p.fill(i % 360, freqs[i] % 100, freqs[i] % 100, freqs[i] % 100);
        p.strokeWeight(10);
        p.stroke(
          360 - (i % 360),
          freqs[i] % 100,
          freqs[i] % 100,
          freqs[i] % 100
        );
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
      spheres = false,
      vel_damp,
      reflective_colors
    ) {
      //sum of frequency information
      let freq_sum = freqs.reduce((a, b) => a + b, 0);
      //average frequency
      let freq_avg = freq_sum / freqs.length || 0;
      let maxDist = p.sqrt(p.sq(p.windowWidth) + p.sq(p.windowHeight)) / 2;
      p.push();
      p.noStroke();

      if (mode == 1) {
        for (i = 0; i < partNum; i++) {
          for (j = 0; j < partNum; j++) {
            let pVel = p.sqrt(
              p.sq(particles[i][j].xVel) + p.sq(particles[i][j].yVel)
            );
            let particleDist = p.sqrt(
              p.sq(Math.abs(particles[i][j].xLoc)) +
                p.sq(Math.abs(particles[i][j].yLoc))
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
            // p.stroke(
            //   360 - (freq % 360),
            //   freqs[freq] % 100,
            //   freqs[freq] % 100,
            //   freqs[freq] % 100
            // );
            if (spheres) {
              p.push();
              p.translate(particles[i][j].xLoc, particles[i][j].yLoc);
              if (reflective_colors) {
                p.shininess(30);
                p.specularMaterial(
                  freq % 360,
                  freqs[freq] % 100,
                  freqs[freq] % 100
                );
              }
              p.sphere(pVel ** 1.5);
              p.pop();
            } else {
              p.circle(
                particles[i][j].xLoc,
                particles[i][j].yLoc,
                pVel ** 1.5 + 5
              );
            }

            if (freqs[freq] < freq_avg) {
              if (particles[i][j].xLoc > 0) {
                particles[i][j].xVel += p.random(-freqs[freq] / vel_damp, 0);
              } else {
                particles[i][j].xVel += p.random(0, freqs[freq] / vel_damp);
              }
              if (particles[i][j].yLoc < 0) {
                particles[i][j].yVel += p.random(0, freqs[freq] / vel_damp);
              } else {
                particles[i][j].yVel += p.random(-freqs[freq] / vel_damp, 0);
              }
            } else {
              if (particles[i][j].xLoc <= 0) {
                particles[i][j].xVel += p.random(-freqs[freq] / vel_damp, 0);
              } else {
                particles[i][j].xVel += p.random(0, freqs[freq] / vel_damp);
              }
              if (particles[i][j].yLoc >= 0) {
                particles[i][j].yVel += p.random(0, freqs[freq] / vel_damp);
              } else {
                particles[i][j].yVel += p.random(-freqs[freq] / vel_damp, 0);
              }
            }

            particles[i][j].moveWEBGL(p.windowWidth, p.windowHeight);
          }
        }
      }
      p.pop();
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
    //drawGUI every frame
    p.drawGUI = function (local_width, local_height) {
      let GUI = [];

      startX = 10;
      local_height = local_height - 50;

      slider_mode_1 = p.createSlider(3, 100, 5, 0.1);
      slider_mode_2 = p.createSlider(0, 1, 0, 0.01);
      slider_mode_3 = p.createSlider(1, 100, 30);
      micOrSong = p.createCheckbox("use mic", true);
      micOrSong.changed(p.changeAudioSrc);
      saveButton = p.createButton("Save Canvas");

      GUI.push(
        slider_mode_1, //circles randomness, circles separation, circles fraction, circles oscillation
        slider_mode_2, //draw background alpha
        slider_mode_3, //particle velocity
        micOrSong,
        saveButton
      );

      for (let i = 0; i < GUI.length; i++) {
        GUI[i].position(startX + 100 * i, local_height);
        GUI[i].style("width", "80px");
      }

      saveButton.mousePressed(p.saveCanvas);

      return GUI;
    };
    //clear GUI for resize operation
    p.clearGUI = function (GUI) {
      for (let i = 0; i < GUI.length; i++) {
        GUI[i].remove();
      }
    };
    //helper function to save canvas
    p.saveCanvas = function () {
      p.save(canv);
    };
    //for raycasting to center brush on mouse in 3-space
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
    //for allowing user to play a built-in song instead of having to route audio through their mic
    p.changeAudioSrc = function () {
      if (this.checked()) {
        if (mic.isPlaying()) {
          mic.pause();
        }
        fft = new p5.FFT();
        mic = new p5.AudioIn();
        mic.start();
        mic.connect(fft);
      } else {
        mic = backup_song;
        fft = new p5.FFT();
        mic.loop();
      }
    };
  };

  var main_canvas = new p5(PaintCanvas, "paint-canvas-container");
};
