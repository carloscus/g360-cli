class ProgressBar {
  constructor(message) {
    this.message = message;
    this.current = 0;
    this.total = 100;
    this.spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.index = 0;
    this.interval = null;
  }

  start() {
    this.interval = setInterval(() => {
      this.index = (this.index + 1) % this.spinner.length;
      const bar = '█'.repeat(Math.floor(this.current / 5)) + '░'.repeat(20 - Math.floor(this.current / 5));
      process.stdout.write(`\r${this.spinner[this.index]} ${this.message} [${bar}] ${this.current}%`);
    }, 100);
  }

  update(current) {
    this.current = Math.min(Math.max(current, 0), 100);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
    }
  }
}

export const progress = (message) => {
  const bar = new ProgressBar(message);
  bar.start();
  return bar;
};
