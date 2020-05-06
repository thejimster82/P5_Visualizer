class Particle {
  constructor(x, y, xVelocity, yVelocity) {
    this.xLoc = x;
    this.yLoc = y;
    this.xVel = xVelocity;
    this.yVel = yVelocity;
  }
  collide(colliderX, colliderY, radius, colliderXVel, colliderYVel, particles) {
    if (
      sqrt(sq(abs(colliderX - this.xLoc)) + sq(abs(colliderY - this.yLoc))) <
      radius + random(20)
    ) {
      if (colliderX - this.xLoc < 0) {
        this.xVel += random((abs(colliderX - this.xLoc) * 1) / 5);
      } else {
        this.xVel -= random((abs(colliderX - this.xLoc) * 1) / 5);
      }
      if (colliderY - this.yLoc < 0) {
        this.yVel += random((abs(colliderY - this.yLoc) * 1) / 5);
      } else {
        this.yVel -= random((abs(colliderY - this.yLoc) * 1) / 5);
      }
      return true;
    }
    return false;
  }

  disperse(wt, vel) {
    if (random(0, 1) < 0.5) {
      this.xVel += vel * wt;
    } else {
      this.xVel -= vel * wt;
    }

    if (random(0, 1) < 0.5) {
      this.yVel += vel * wt;
    } else {
      this.yVel -= vel * wt;
    }
  }

  move(width_, height_) {
    //this.xLoc < 0 && (this.xLoc = 1);
    this.xLoc <= 0 && (this.xVel *= -1) + 5;

    //this.yLoc < 0 && (this.yLoc = 1);
    this.yLoc <= 0 && (this.yVel *= -1) + 5;

    //this.xLoc > width_ && (this.xLoc = width_ - 1);
    this.xLoc >= width_ && (this.xVel *= -1) - 5;

    //this.yLoc > height_ && (this.yLoc = height_ - 1);
    this.yLoc >= height_ && (this.yVel *= -1) - 5;

    if (this.xVel > 0) {
      this.xLoc += this.xVel;
      this.xVel -= this.xVel / 20;
    }
    if (this.xVel < 0) {
      this.xLoc += this.xVel;
      this.xVel -= this.xVel / 20;
    }
    if (this.yVel > 0) {
      this.yLoc += this.yVel;
      this.yVel -= this.yVel / 20;
    }
    if (this.yVel < 0) {
      this.yLoc += this.yVel;
      this.yVel -= this.yVel / 20;
    }
  }
}
