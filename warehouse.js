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

// Переменные для сортировки
var currentSortColumn = null;
var currentSortOrder = 'asc';

// Функция для отображения запасов на складе
function renderInventory() {
    var inventoryTableBody = document.getElementById('inventoryTableBody');
    if (!inventoryTableBody) return;

    inventoryTableBody.innerHTML = ''; // Очищаем таблицу перед загрузкой

    db.ref('inventory').on('value', function(snapshot) {
        inventoryTableBody.innerHTML = ''; // Очищаем таблицу перед загрузкой

        snapshot.forEach(function(childSnapshot) {
            var item = childSnapshot.val();
            item.id = childSnapshot.key;

            var row = document.createElement('tr');
            row.setAttribute('data-id', item.id);

            var widthCell = document.createElement('td');
            widthCell.innerText = item.width || 'Не указано';
            row.appendChild(widthCell);

            var lengthCell = document.createElement('td');
            lengthCell.innerText = item.length ? parseFloat(item.length).toFixed(2) + ' м' : 'Не указано';
            row.appendChild(lengthCell);

            var quantityCell = document.createElement('td');
            quantityCell.innerText = item.quantity || '0';
            row.appendChild(quantityCell);

            // Проверка на низкий уровень запасов (например, менее 10)
            var statusCell = document.createElement('td');
            if (item.quantity < 10) {
                statusCell.innerText = 'Низкий уровень запасов!';
                statusCell.classList.add('low-stock');
            } else {
                statusCell.innerText = 'Достаточный запас';
                statusCell.classList.add('adequate-stock');
            }
            row.appendChild(statusCell);

            // Ячейка для действий (Редактировать и Удалить)
            var actionsCell = document.createElement('td');

            // Кнопка "Редактировать"
            var editButton = document.createElement('button');
            editButton.innerText = 'Редактировать';
            editButton.classList.add('btn-edit');
            editButton.onclick = function() {
                showEditInventoryForm(item);
            };
            actionsCell.appendChild(editButton);

            // Кнопка "Удалить"
            var deleteButton = document.createElement('button');
            deleteButton.innerText = 'Удалить';
            deleteButton.classList.add('btn-delete');
            deleteButton.onclick = function() {
                deleteInventoryItem(item.id);
            };
            actionsCell.appendChild(deleteButton);

            row.appendChild(actionsCell);

            inventoryTableBody.appendChild(row);
        });

        applySearchFilter(); // Применяем поиск и фильтрацию после загрузки данных
    });
}

// Функция для отображения формы добавления бетона
function showAddInventoryForm() {
    var addInventoryForm = document.getElementById('addInventoryForm');
    if (addInventoryForm) {
        addInventoryForm.style.display = 'block';
    }

    // Скрываем форму редактирования, если она открыта
    hideEditInventoryForm();
}

// Функция для скрытия формы добавления бетона
function hideAddInventoryForm() {
    var addInventoryForm = document.getElementById('addInventoryForm');
    if (addInventoryForm) {
        addInventoryForm.style.display = 'none';
        addInventoryForm.reset();
    }
}

// Функция для отображения формы редактирования бетона
function showEditInventoryForm(item) {
    var editInventoryForm = document.getElementById('editInventoryForm');
    if (editInventoryForm) {
        editInventoryForm.style.display = 'block';
        document.getElementById('editInventoryId').value = item.id;
        document.getElementById('editInventoryWidth').value = item.width;
        document.getElementById('editInventoryLength').value = item.length;
        document.getElementById('editInventoryQuantity').value = item.quantity;
    }

    // Скрываем форму добавления, если она открыта
    hideAddInventoryForm();
}

// Функция для скрытия формы редактирования бетона
function hideEditInventoryForm() {
    var editInventoryForm = document.getElementById('editInventoryForm');
    if (editInventoryForm) {
        editInventoryForm.style.display = 'none';
        editInventoryForm.reset();
    }
}

// Функция для добавления нового бетона на склад
function addInventoryItem(event) {
    event.preventDefault();

    var width = document.getElementById('inventoryWidth').value.trim();
    var length = parseFloat(document.getElementById('inventoryLength').value);
    var quantity = parseInt(document.getElementById('inventoryQuantity').value);

    if (!width || isNaN(length) || length <= 0 || isNaN(quantity) || quantity <= 0) {
        alert('Пожалуйста, заполните все поля корректно.');
        return;
    }

    var newItem = {
        width: width,
        length: length,
        quantity: quantity
    };

    db.ref('inventory').push(newItem, function(error) {
        if (error) {
            console.error("Ошибка при добавлении на склад: ", error);
            alert("Произошла ошибка при добавлении на склад. Пожалуйста, попробуйте еще раз.");
        } else {
            alert('Новый бетон успешно добавлен на склад.');
            // Очищаем форму
            var addInventoryForm = document.getElementById('addInventoryForm');
            if (addInventoryForm) {
                addInventoryForm.reset();
                addInventoryForm.style.display = 'none';
            }
            // Обновляем отображение склада
            renderInventory();
        }
    });
}

// Функция для обновления существующего бетона на складе
function updateInventoryItem(event) {
    event.preventDefault();

    var id = document.getElementById('editInventoryId').value;
    var width = document.getElementById('editInventoryWidth').value.trim();
    var length = parseFloat(document.getElementById('editInventoryLength').value);
    var quantity = parseInt(document.getElementById('editInventoryQuantity').value);

    if (!id || !width || isNaN(length) || length <= 0 || isNaN(quantity) || quantity <= 0) {
        alert('Пожалуйста, заполните все поля корректно.');
        return;
    }

    var updatedItem = {
        width: width,
        length: length,
        quantity: quantity
    };

    db.ref('inventory/' + id).update(updatedItem, function(error) {
        if (error) {
            console.error("Ошибка при обновлении записи: ", error);
            alert("Произошла ошибка при обновлении записи. Пожалуйста, попробуйте еще раз.");
        } else {
            alert('Запись успешно обновлена.');
            // Очищаем и скрываем форму редактирования
            hideEditInventoryForm();
            // Обновляем отображение склада
            renderInventory();
        }
    });
}

// Функция для удаления записи о бетоне
function deleteInventoryItem(id) {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        db.ref('inventory/' + id).remove(function(error) {
            if (error) {
                console.error("Ошибка при удалении записи: ", error);
                alert("Произошла ошибка при удалении записи. Пожалуйста, попробуйте еще раз.");
            } else {
                alert('Запись успешно удалена.');
                // Обновляем отображение склада
                renderInventory();
            }
        });
    }
}

// Функция для сортировки таблицы
function sortTable(column) {
    if (currentSortColumn === column) {
        // Если уже сортировали по этой колонке, переключаем порядок
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        // Иначе сортируем по новой колонке в порядке возрастания
        currentSortColumn = column;
        currentSortOrder = 'asc';
    }

    var rows = Array.from(document.querySelectorAll('#inventoryTableBody tr'));

    rows.sort(function(a, b) {
        var aValue = a.querySelector('td:nth-child(' + getColumnIndex(column) + ')').innerText;
        var bValue = b.querySelector('td:nth-child(' + getColumnIndex(column) + ')').innerText;

        if (column === 'quantity' || column === 'length') {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
            if (isNaN(aValue)) aValue = 0;
            if (isNaN(bValue)) bValue = 0;
        } else {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return currentSortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return currentSortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // Удаляем текущие строки
    var tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';

    // Добавляем отсортированные строки
    rows.forEach(function(row) {
        tbody.appendChild(row);
    });
}

// Вспомогательная функция для получения индекса столбца по названию
function getColumnIndex(column) {
    switch(column) {
        case 'width': return 1;
        case 'length': return 2;
        case 'quantity': return 3;
        default: return 1;
    }
}

// Функция для применения поиска и фильтрации
function applySearchFilter() {
    var searchQuery = document.getElementById('searchInput').value.toLowerCase();
    var filterQuantity = document.getElementById('filterQuantity').value;
    var filterStatus = document.getElementById('filterStatus').value;

    var rows = document.querySelectorAll('#inventoryTableBody tr');

    rows.forEach(function(row) {
        var width = row.querySelector('td:nth-child(1)').innerText.toLowerCase();
        var length = row.querySelector('td:nth-child(2)').innerText.toLowerCase();
        var quantity = parseInt(row.querySelector('td:nth-child(3)').innerText);
        var status = row.querySelector('td:nth-child(4)').innerText.toLowerCase();

        // Проверка поиска
        var matchesSearch = width.includes(searchQuery) || length.includes(searchQuery);

        // Проверка фильтра по количеству
        var matchesQuantity = false;
        if (filterQuantity === 'all') {
            matchesQuantity = true;
        } else if (filterQuantity === 'low' && quantity < 10) {
            matchesQuantity = true;
        } else if (filterQuantity === 'adequate' && quantity >= 10) {
            matchesQuantity = true;
        }

        // Проверка фильтра по статусу
        var matchesStatus = false;
        if (filterStatus === 'all') {
            matchesStatus = true;
        } else if (filterStatus === 'low-stock' && quantity < 10) {
            matchesStatus = true;
        } else if (filterStatus === 'adequate-stock' && quantity >= 10) {
            matchesStatus = true;
        }

        // Отображаем строку, если все условия выполнены
        if (matchesSearch && matchesQuantity && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Обработчик отправки формы добавления бетона
window.onload = function() {
    renderInventory(); // Отображаем текущие запасы

    var addInventoryForm = document.getElementById('addInventoryForm');
    if (addInventoryForm) {
        addInventoryForm.addEventListener('submit', addInventoryItem);
    }

    var editInventoryForm = document.getElementById('editInventoryForm');
    if (editInventoryForm) {
        editInventoryForm.addEventListener('submit', updateInventoryItem);
    }
};
