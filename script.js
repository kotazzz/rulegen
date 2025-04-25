document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const rulesOutput = document.getElementById('generated-rules');
    const downloadBtn = document.getElementById('download-btn');
    const optionButtons = document.querySelectorAll('.rule-option');

    let selectedOptions = {
        strictness: null,
        detail: null
        // Добавьте сюда ключи для других типов опций
    };

    // Обработка выбора опций
    optionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.type;
            const value = button.dataset.value;

            // Снимаем выделение с других кнопок того же типа
            document.querySelectorAll(`.rule-option[data-type="${type}"]`).forEach(btn => {
                btn.classList.remove('active');
                // Возвращаем исходный класс стиля (outline)
                 const outlineClass = Array.from(btn.classList).find(cls => cls.startsWith('btn-outline-'));
                 if (outlineClass) {
                    btn.classList.remove(outlineClass.replace('outline-', '')); // убираем основной цвет если был
                    btn.classList.add(outlineClass); // возвращаем outline
                 }
            });

            // Выделяем нажатую кнопку
            button.classList.add('active');
            // Меняем стиль на основной цвет
            const outlineClass = Array.from(button.classList).find(cls => cls.startsWith('btn-outline-'));
            if (outlineClass) {
                button.classList.remove(outlineClass);
                button.classList.add(outlineClass.replace('outline-', ''));
            }


            selectedOptions[type] = value;
            console.log('Selected options:', selectedOptions); // Для отладки
        });
    });

    // Обработка нажатия кнопки "Сгенерировать"
    generateBtn.addEventListener('click', () => {
        // Простая логика генерации (замените на реальную)
        let generatedText = `--- Сгенерированные Правила ---

`;
        generatedText += `Жесткость: ${selectedOptions.strictness || 'не выбрана'}
`;
        generatedText += `Подробность: ${selectedOptions.detail || 'не выбрана'}
`;
        // Добавьте генерацию на основе других опций

        generatedText += `
Пример правила 1...
`;
        generatedText += `Пример правила 2...
`;

        rulesOutput.textContent = generatedText;
        downloadBtn.style.display = 'inline-block'; // Показываем кнопку скачивания
    });

    // Обработка нажатия кнопки "Скачать"
    downloadBtn.addEventListener('click', () => {
        const textToSave = rulesOutput.textContent;
        const blob = new Blob([textToSave], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated_rules.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Освобождаем память
    });

});
