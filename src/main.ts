import * as utils from "@iobroker/adapter-core";
import { getStationDetails } from "./lib/apiHelper";
import "./lib/apiHelper";

class SolisCloud extends utils.Adapter {
	private running = false;
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "soliscloud",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	private async onReady(): Promise<void> {
		this.log.info("Starting soliscloud adapter");
		await this.setObjectNotExistsAsync("current_Consumption", {
			type: "state",
			common: {
				name: "currentConsumption",
				type: "number",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("current_Power", {
			type: "state",
			common: {
				name: "current_Power",
				type: "number",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("current_From_Net", {
			type: "state",
			common: {
				name: "current_From_Net",
				type: "number",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("sold_Today", {
			type: "state",
			common: {
				name: "sold_Today",
				type: "number",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("generated_Today", {
			type: "state",
			common: {
				name: "generated_Today",
				type: "number",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("bought_Today", {
			type: "state",
			common: {
				name: "bought_Today",
				type: "number",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("consumption_Today", {
			type: "state",
			common: {
				name: "consumption_Today",
				type: "number",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("battery_percent", {
			type: "state",
			common: {
				name: "battery_percent",
				type: "number",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync("battery_current_usage", {
			type: "state",
			common: {
				name: "battery_current_usage",
				type: "number",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		if (this.config.apiKey && this.config.apiSecret && this.config.plantId) {
			this.log.info(`Start polling soliscloud, polling every ${this.config.pollInterval} seconds`);
			this.running = true;
			while (this.running) {

				try {
					const callResult = await getStationDetails(this.config.plantId, this.config.apiKey, this.config.apiSecret);
					await this.setStateAsync("current_Consumption", callResult?.current_consumption);
					await this.setStateAsync("current_Power", callResult?.current_Power);
					await this.setStateAsync("current_From_Net", callResult?.current_From_Net);
					await this.setStateAsync("sold_Today", callResult?.sold_Today);
					await this.setStateAsync("generated_Today", callResult?.generated_Today);
					await this.setStateAsync("bought_Today", callResult?.bought_Today);
					await this.setStateAsync("consumption_Today", callResult?.consumption_Today);
					await this.setStateAsync("battery_percent", callResult?.battery_percent);
					await this.setStateAsync("battery_current_usage", callResult?.battery_current_usage);

					//Wait 30 seconds and loop again. #TODO make interval configurable
					await new Promise(resolve => setTimeout(resolve, 30000));
				} catch (e) {
					this.log.error(`Error while calling solis api, retrying in ${this.config.pollInterval} seconds`);
					await new Promise(resolve => setTimeout(resolve, this.config.pollInterval * 1000));
				}
			}
		} else {
			this.log.info("Can't start polling, missing needed settings.");
		}
	}
	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			this.log.info("Stopping soliscloud polling");
			this.running = false;
			callback();
		} catch (e) {
			this.log.info("Error while stopping polling: " + e);
			callback();
		}
	}

	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new SolisCloud(options);
} else {
	// otherwise start the instance directly
	(() => new SolisCloud())();
}