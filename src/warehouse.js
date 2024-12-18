// src/warehouse.js

// Инициализация Firebase
var firebaseConfig = {
    apiKey: "AIzaSyDZy-kc8yyIKWdJKXxLdPoc3gm7Xq96b0w",
    authDomain: "vibropress-713e1.firebaseapp.com",
    databaseURL: "https://vibropress-713e1-default-rtdb.firebaseio.com",
    projectId: "vibropress-713e1",
    storageBucket: "vibropress-713e1.appspot.com",
    messagingSenderId: "954424014496",
    appId: "1:954424014496:web:2eba467bf34a249816fbc5",
    measurementId: "G-GKEVHBSZBM"
};
// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
// Получение ссылки на Realtime Database
var db = firebase.database();

// Пороговое значение для определения низких запасов
const LOW_STOCK_THRESHOLD = 10;

// Хранилище всех запасов
let allInventory = [];

// Функции для управления модальным окном добавления/редактирования запасов

function openInventoryModal() {
    var modal = document.getElementById('inventoryModal');
    if (modal) {
        modal.style.display = 'flex';
        resetInventoryForm();
    }
}

function closeInventoryModal() {
    var modal = document.getElementById('inventoryModal');
    if (modal) {
        modal.style.display = 'none';
        resetInventoryForm();
    }
}

// Функции для управления модальным окном отчетов

function openReportsModal() {
    var modal = document.getElementById('reportsModal');
    if (modal) {
        modal.style.display = 'flex';
        // Инициализируем календарь при открытии модального окна
        flatpickr("#reportDate", {
            dateFormat: "Y-m-d",
            maxDate: "today",
            defaultDate: "today",
            locale: {
                firstDayOfWeek: 1,
                weekdays: {
                    shorthand: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
                    longhand: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
                },
                months: {
                    shorthand: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
                    longhand: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
                },
            },
        });

        // Очищаем контент отчетов
        var reportsContent = document.getElementById('reportsContent');
        if (reportsContent) {
            reportsContent.innerHTML = '';
        }
    }
}

function closeReportsModal() {
    var modal = document.getElementById('reportsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Функция для генерации отчета по выбранной дате
function generateReport() {
    var selectedDate = document.getElementById('reportDate').value;
    if (!selectedDate) {
        alert('Пожалуйста, выберите дату.');
        return;
    }

    var reportsContent = document.getElementById('reportsContent');
    if (!reportsContent) return;

    // Преобразуем выбранную дату в формат начала и конца дня
    var startOfDay = new Date(selectedDate + 'T00:00:00').getTime();
    var endOfDay = new Date(selectedDate + 'T23:59:59').getTime();

    db.ref('inventory').once('value', function(snapshot) {
        var inventoryData = [];

        snapshot.forEach(function(childSnapshot) {
            var data = childSnapshot.val();
            data.id = childSnapshot.key;

            if (data.createdAt) {
                var createdAt = data.createdAt;
                if (createdAt >= startOfDay && createdAt <= endOfDay) {
                    inventoryData.push(data);
                }
            }
        });

        // Если нет данных за выбранную дату
        if (inventoryData.length === 0) {
            reportsContent.innerHTML = '<p>Нет данных за выбранную дату.</p>';
            return;
        }

        // Создаем таблицу для отображения отчетов
        var reportsHtml = '';
        reportsHtml += '<table class="reports-table">';
        reportsHtml += '<thead><tr><th>Дата добавления</th><th>Размер по ширине</th><th>Размер по длине</th><th>Количество</th></tr></thead>';
        reportsHtml += '<tbody>';

        inventoryData.forEach(function(item) {
            var dateAdded = new Date(item.createdAt).toLocaleString();
            reportsHtml += '<tr>';
            reportsHtml += '<td>' + dateAdded + '</td>';
            reportsHtml += '<td>' + item.sizeWidth + '</td>';
            reportsHtml += '<td>' + item.sizeLength + ' м</td>';
            reportsHtml += '<td>' + item.quantity + '</td>';
            reportsHtml += '</tr>';
        });

        reportsHtml += '</tbody></table>';

        reportsContent.innerHTML = reportsHtml;
    });
}

// Функция для сброса формы
function resetInventoryForm() {
    var form = document.getElementById('inventoryForm');
    if (form) {
        form.reset();
    }
    document.getElementById('inventoryId').value = '';
    document.getElementById('modalTitle').innerText = 'Добавить запас';
}

// Обработка отправки формы
document.getElementById('inventoryForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Предотвращаем перезагрузку страницы при отправке формы

    var inventoryId = document.getElementById('inventoryId').value;
    var sizeWidth = document.getElementById('inventorySizeWidth').value;
    var sizeLength = parseFloat(document.getElementById('inventorySizeLength').value);
    var quantity = parseInt(document.getElementById('inventoryQuantity').value);

    if (!sizeWidth || isNaN(sizeLength) || isNaN(quantity)) {
        alert('Пожалуйста, заполните все обязательные поля корректно.');
        return;
    }

    // Определяем статус на основе количества
    var status = quantity < LOW_STOCK_THRESHOLD ? 'У вас низкие запасы' : 'Достаточно';

    var inventoryData = {
        sizeWidth: sizeWidth,
        sizeLength: sizeLength,
        quantity: quantity,
        status: status,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    if (inventoryId) {
        // Редактирование существующего запаса
        db.ref('inventory/' + inventoryId).update(inventoryData, function(error) {
            if (error) {
                console.error("Ошибка при обновлении запаса: ", error);
                alert("Произошла ошибка при обновлении запаса. Пожалуйста, попробуйте еще раз.");
            } else {
                alert("Запас успешно обновлен!");
                closeInventoryModal();
            }
        });
    } else {
        // Добавление нового запаса
        db.ref('inventory').push(inventoryData, function(error) {
            if (error) {
                console.error("Ошибка при добавлении запаса: ", error);
                alert("Произошла ошибка при добавлении запаса. Пожалуйста, попробуйте еще раз.");
            } else {
                alert("Запас успешно добавлен!");
                closeInventoryModal();
            }
        });
    }
});

// Функция для создания строки таблицы запаса
function createInventoryRow(id, inventory) {
    var tr = document.createElement('tr');

    var tdSizeWidth = document.createElement('td');
    tdSizeWidth.innerText = inventory.sizeWidth;
    tr.appendChild(tdSizeWidth);

    var tdSizeLength = document.createElement('td');
    tdSizeLength.innerText = inventory.sizeLength + ' м';
    tr.appendChild(tdSizeLength);

    var tdQuantity = document.createElement('td');
    tdQuantity.innerText = inventory.quantity;
    tr.appendChild(tdQuantity);

    var tdStatus = document.createElement('td');
    tdStatus.innerText = inventory.status;
    tr.appendChild(tdStatus);

    var tdActions = document.createElement('td');

    // Контейнер для кнопок действий
    var actionsContainer = document.createElement('div');
    actionsContainer.classList.add('actions-container');

    // Кнопка редактирования
    var editBtn = document.createElement('button');
    editBtn.innerText = 'Редактировать';
    editBtn.classList.add('btn-favorite'); // Используем стили из CSS
    editBtn.onclick = function() {
        editInventory(id, inventory);
    };
    actionsContainer.appendChild(editBtn);

    // Добавляем контейнер с кнопками в ячейку действий
    tdActions.appendChild(actionsContainer);
    tr.appendChild(tdActions);

    // Проверяем статус запаса для применения стилей
    if (inventory.status === 'У вас низкие запасы') {
        tr.classList.add('low-stock');
    }

    return tr;
}

// Функция для отображения запасов в таблице
function displayInventory(filteredInventory) {
    var tbody = document.querySelector('#inventoryTable tbody');
    if (!tbody) return;

    tbody.innerHTML = ''; // Очищаем таблицу перед загрузкой

    filteredInventory.forEach(function(inventory) {
        var tr = createInventoryRow(inventory.id, inventory.data);
        tbody.appendChild(tr);
    });
}

// Функция для загрузки всех запасов
function loadInventory() {
    db.ref('inventory').on('value', function(snapshot) {
        allInventory = []; // Сбрасываем хранилище

        snapshot.forEach(function(childSnapshot) {
            var id = childSnapshot.key;
            var data = childSnapshot.val();

            allInventory.push({
                id: id,
                data: data
            });
        });

        // Отображаем все запасы по умолчанию
        displayInventory(allInventory);
    });
}

// Функция для редактирования запаса
function editInventory(id, inventory) {
    var modal = document.getElementById('inventoryModal');
    if (!modal) return;

    document.getElementById('inventoryId').value = id;
    document.getElementById('inventorySizeWidth').value = inventory.sizeWidth;
    document.getElementById('inventorySizeLength').value = inventory.sizeLength;
    document.getElementById('inventoryQuantity').value = inventory.quantity;
    document.getElementById('modalTitle').innerText = 'Редактировать запас';

    modal.style.display = 'flex';
}

// Функция для сброса фильтров
function resetFilters() {
    document.getElementById('filterForm').reset();
    displayInventory(allInventory);
}

// Обработка отправки формы фильтрации
document.getElementById('filterForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Предотвращаем перезагрузку страницы при отправке формы

    var filterSizeWidth = document.getElementById('filterSizeWidth').value;
    var filterSizeLengthMin = parseFloat(document.getElementById('filterSizeLengthMin').value);
    var filterSizeLengthMax = parseFloat(document.getElementById('filterSizeLengthMax').value);
    var filterQuantityMin = parseInt(document.getElementById('filterQuantityMin').value);
    var filterQuantityMax = parseInt(document.getElementById('filterQuantityMax').value);
    var filterStatus = document.getElementById('filterStatus').value;

    // Фильтрация запасов
    var filteredInventory = allInventory.filter(function(inventory) {
        var matches = true;

        if (filterSizeWidth) {
            matches = matches && (inventory.data.sizeWidth === filterSizeWidth);
        }

        if (!isNaN(filterSizeLengthMin)) {
            matches = matches && (inventory.data.sizeLength >= filterSizeLengthMin);
        }

        if (!isNaN(filterSizeLengthMax)) {
            matches = matches && (inventory.data.sizeLength <= filterSizeLengthMax);
        }

        if (!isNaN(filterQuantityMin)) {
            matches = matches && (inventory.data.quantity >= filterQuantityMin);
        }

        if (!isNaN(filterQuantityMax)) {
            matches = matches && (inventory.data.quantity <= filterQuantityMax);
        }

        if (filterStatus) {
            matches = matches && (inventory.data.status === filterStatus);
        }

        return matches;
    });

    displayInventory(filteredInventory);
});

// Закрытие модальных окон при клике вне их
window.onclick = function(event) {
    var inventoryModal = document.getElementById('inventoryModal');
    var reportsModal = document.getElementById('reportsModal');

    if (inventoryModal && event.target == inventoryModal) {
        inventoryModal.style.display = 'none';
        resetInventoryForm();
    }

    if (reportsModal && event.target == reportsModal) {
        reportsModal.style.display = 'none';
    }
}

// Инициализация загрузки запасов при загрузке страницы
window.onload = function() {
    loadInventory();
};
