class SimObserver {
  constructor(sim_master) {
    Reactor.apply(this, []);

    this.sim_master = sim_master;
    this.logs = {
      creatures_count: []
    }

    //constants
    this.UDPDATE_INTERVAL = 100;

    //events
    this.registerEvent("updates");

    setInterval(this._updateLogs.bind(this), this.UDPDATE_INTERVAL);
  }

  _updateLogs() {
    this.logs.creatures_count.push(this.sim_master.creatures_controller.creatures_count);

    this.dispatchEvent("updates");
  }
}