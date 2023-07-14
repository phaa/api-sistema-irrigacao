class Timer {
  private interval: number;
  private callback: () => void;

  constructor(interval: number, callback: () => void) {
    this.interval = interval;
    this.callback = callback;
  }

  // Com esse arranjo conseguimos evitar o time drift
  public loop() {
    // Verifica a hora atual e calcula o delay até o proximo intervalo
    let now = new Date();
    let delay = this.interval - now.valueOf() % this.interval;

    const start = () => {
      // Executa a função passada
      this.callback();
      // ... E inicia a recursividade
      this.loop();
    }

    // Segura a execução até o momento certo
    setTimeout(start, delay);
  }
}

export default Timer;