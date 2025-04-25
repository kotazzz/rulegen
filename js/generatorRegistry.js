// js/generatorRegistry.js

const GeneratorRegistry = {
    generators: {},

    register(generator) {
        if (!generator || !generator.id) {
            console.error("Invalid generator object provided for registration.");
            return;
        }
        if (this.generators[generator.id]) {
            console.warn(`Generator with ID '${generator.id}' is already registered. Overwriting.`);
        }
        this.generators[generator.id] = generator;
        console.log(`Generator registered: ${generator.name} (ID: ${generator.id})`);
    },

    getGenerator(id) {
        return this.generators[id] || null;
    },

    getAllGenerators() {
        return Object.values(this.generators);
    },

    getDefaultGenerator() {
        const keys = Object.keys(this.generators);
        return keys.length > 0 ? this.generators[keys[0]] : null;
    }
};
