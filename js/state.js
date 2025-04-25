// js/state.js

const AppState = {
    currentGeneratorId: null,
    selectedOptions: {},
    ruleModuleStates: {},
    presets: {},

    setCurrentGenerator(generatorId) {
        this.currentGeneratorId = generatorId;
        this.selectedOptions = {}; // Reset options when generator changes
        this.ruleModuleStates = {}; // Reset module states
        // TODO: Initialize options and modules with defaults from the new generator
        console.log(`Current generator set to: ${generatorId}`);
    },

    updateOption(sectionId, optionValue) {
        if (!this.selectedOptions[sectionId]) {
            this.selectedOptions[sectionId] = {};
        }
        // Assuming single choice for now, adapt for multi-choice later
        this.selectedOptions[sectionId] = optionValue;
        console.log('State updated - selectedOptions:', JSON.stringify(this.selectedOptions));
        // TODO: Trigger UI updates or dependency checks
    },

    updateMultiOption(sectionId, optionValue, isSelected) {
        if (!this.selectedOptions[sectionId]) {
            this.selectedOptions[sectionId] = [];
        }
        const currentValues = this.selectedOptions[sectionId];
        if (isSelected) {
            if (!currentValues.includes(optionValue)) {
                currentValues.push(optionValue);
            }
        } else {
            const index = currentValues.indexOf(optionValue);
            if (index > -1) {
                currentValues.splice(index, 1);
            }
        }
        console.log('State updated - selectedOptions:', JSON.stringify(this.selectedOptions));
         // TODO: Trigger UI updates or dependency checks
    },

    updateRuleModuleState(moduleId, isEnabled) {
        this.ruleModuleStates[moduleId] = isEnabled;
        console.log('State updated - ruleModuleStates:', JSON.stringify(this.ruleModuleStates));
    },

    // --- Preset Management ---
    loadPreset(name) {
        const preset = this.presets[name];
        if (preset) {
            this.selectedOptions = JSON.parse(JSON.stringify(preset.options || {})); // Deep copy
            this.ruleModuleStates = JSON.parse(JSON.stringify(preset.modules || {})); // Deep copy
            console.log(`Preset '${name}' loaded.`);
            return true;
        } else {
            console.warn(`Preset '${name}' not found.`);
            return false;
        }
    },

    savePreset(name) {
        if (!name) {
            console.error("Preset name cannot be empty.");
            return false;
        }
        this.presets[name] = {
            options: JSON.parse(JSON.stringify(this.selectedOptions)), // Deep copy
            modules: JSON.parse(JSON.stringify(this.ruleModuleStates))  // Deep copy
        };
        console.log(`Preset '${name}' saved.`);
        // TODO: Persist presets (e.g., localStorage)
        // TODO: Update preset UI dropdown
        return true;
    },

    getPresets() {
        return this.presets;
        // TODO: Load presets from persistence
    },

    // --- Settings Import/Export ---
    getSettings() {
        return {
            generatorId: this.currentGeneratorId,
            options: this.selectedOptions,
            modules: this.ruleModuleStates
        };
    },

    loadSettings(settings) {
        if (!settings || !settings.generatorId || !GeneratorRegistry.getGenerator(settings.generatorId)) {
            console.error("Invalid settings object or generator ID.");
            return false;
        }
        this.currentGeneratorId = settings.generatorId;
        this.selectedOptions = settings.options || {};
        this.ruleModuleStates = settings.modules || {};
        console.log(`Settings loaded for generator '${this.currentGeneratorId}'.`);
        return true;
    }
};
