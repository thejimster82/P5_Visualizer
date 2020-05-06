// let carriers = [];
// let fft;
// let slider_amp, slider_freq;

// function instantiateCarrier(freq, amp, type = 'sine') {
//   carrier = new p5.Oscillator(type);
//   carrier.freq(freq);
//   carrier.amp(amp);
//   carrier.start();
//   return [carrier, freq, amp];
// }

// function setup() {
//   for (i = 0; i < 20000; i += 100) {
//     carriers.push(instantiateCarrier(i, random(0.2)));
//   }
//   createCanvas(800, 400);
//   noFill();
//   background(30); // alpha
//   // create an fft to analyze the audio
//   fft = new p5.FFT();
//   mic = new p5.AudioIn();
//   text(mic.getSources(),height / 2,width/2);
//   mic.start();
//   //freq slider
//   slider_freq = createSlider(0, 10, 100);
//   slider_freq.position(110, height - 50);
//   slider_freq.style('width', '80px')
//   //vol slider
//   slider_amp = createSlider(0, 1, 100);
//   slider_amp.position(10, height - 50);
//   slider_amp.style('width', '80px')
// }

// function draw() {
//   background(30, 30, 30, 100); // alpha

//   // map mouseY to modulator freq between 0 and 1kHz
//   let Freq = slider_freq.value();
//   // for (i = 0; i < carriers.length; i++) {
//   //   carriers[i][0].freq(carriers[i][1] * Freq);
//   // }
//   let Amp = slider_amp.value();
//   mic.amp(Amp);

//   // let Amp = slider_amp.value();
//   // for (i = 0; i < carriers.length; i++) {
//   //   carriers[i][0].amp(carriers[i][2] * Amp);
//   // }


//   // analyze the waveform
//   waveform = fft.waveform();

//   // draw the shape of the waveform
//   drawWaveform();

//   drawText(Freq, Amp);
// }

// function drawWaveform() {
//   stroke(240);
//   strokeWeight(3);
//   beginShape();
//   for (let i = 0; i < waveform.length; i++) {
//     let x = map(i, 0, waveform.length, 0, width);
//     let y = map(waveform[i], -1, 1, -height / 2, height / 2);
//     vertex(x, y + height / 2);
//   }
//   endShape();
// }

// function drawText(modFreq, modAmp) {
//   strokeWeight(1);
//   text('Amplitude: ' + modAmp.toFixed(3), 10, height - 10);
//   text('Frequency: ' + modFreq.toFixed(3) + ' Hz', 120, height - 10);
// }