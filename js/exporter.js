// js/exporter.js

const Exporter = {

    /**
     * Инициирует скачивание текстового файла.
     */
    downloadText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'generated_output.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Экспортирует текущие настройки в виде JSON файла.
     * TODO: Добавить сжатие и Base64 по желанию.
     */
    exportSettings(settings) {
        try {
            const settingsString = JSON.stringify(settings, null, 2); // Pretty print JSON
            // --- Опционально: Сжатие и Base64 --- 
            // if (typeof pako !== 'undefined') { // Check if pako is loaded
            //     const compressed = pako.deflate(settingsString, { to: 'string' });
            //     settingsString = btoa(compressed); // Encode to Base64
            //     console.log("Settings compressed and encoded.");
            // } else {
            //     console.log("Pako library not found, exporting raw JSON.");
            // }
            // --- Конец опциональной части ---

            this.downloadText(settingsString, `${settings.generatorId || 'settings'}.json`);
        } catch (error) {
            console.error("Error exporting settings:", error);
            alert("Ошибка при экспорте настроек.");
        }
    },

    /**
     * Запрашивает у пользователя файл настроек и вызывает callback с результатом.
     */
    importSettings(callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json, .txt'; // Accept JSON or Base64 text

        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    let settingsString = e.target.result;
                    let settings;

                    // --- Опционально: Base64 и декомпрессия --- 
                    // try {
                    //     const decoded = atob(settingsString);
                    //     if (typeof pako !== 'undefined') {
                    //         settingsString = pako.inflate(decoded, { to: 'string' });
                    //         console.log("Settings decoded and decompressed.");
                    //     } else {
                    //         // If pako isn't available, maybe it was just Base64 encoded JSON?
                    //         settingsString = decoded; 
                    //     }
                    // } catch (e) {
                    //     // Likely wasn't Base64 encoded, assume raw JSON
                    //     console.log("Data doesn't seem Base64 encoded, assuming raw JSON.");
                    // }
                    // --- Конец опциональной части ---

                    settings = JSON.parse(settingsString);

                    if (typeof callback === 'function') {
                        callback(settings);
                    }
                } catch (error) {
                    console.error("Error importing settings:", error);
                    alert(`Ошибка при импорте настроек: ${error.message}`);
                }
            };
            reader.onerror = (error) => {
                 console.error("Error reading file:", error);
                 alert("Ошибка при чтении файла.");
            };
            reader.readAsText(file);
        };

        input.click();
    }
};
