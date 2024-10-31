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

// Функции для управления модальным окном

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
        status: status
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

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    var modal = document.getElementById('inventoryModal');
    if (modal && event.target == modal) {
        modal.style.display = 'none';
        resetInventoryForm();
    }
}

// Инициализация загрузки запасов при загрузке страницы
window.onload = function() {
    loadInventory();
};
