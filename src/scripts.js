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

// Функция для преобразования типа оплаты в текст
function getPaymentTypeText(type) {
    switch(type) {
        case 'cash':
            return 'Наличные';
        case 'bank':
            return 'Банковский перевод';
        case 'card':
            return 'Оплата картой';
        default:
            return '';
    }
}

// Переменные для управления шагами формы
var currentStep = 1;
var totalSteps = 3;

// Функция для переключения шага формы
function showStep(step) {
    // Скрываем все шаги
    for (var i = 1; i <= totalSteps; i++) {
        var stepElement = document.getElementById('step-' + i);
        if (stepElement) {
            stepElement.style.display = 'none';
        }
    }

    // Показываем текущий шаг
    var currentStepElement = document.getElementById('step-' + step);
    if (currentStepElement) {
        currentStepElement.style.display = 'block';
    }

    // Обновляем прогресс-бар
    var progress = (step / totalSteps) * 100;
    var progressBarFill = document.getElementById('progressBarFill');
    if (progressBarFill) {
        progressBarFill.style.width = progress + '%';
    }
}

// Функция для перехода на следующий шаг
function nextStep() {
    // Валидация текущего шага перед переходом
    var valid = validateStep(currentStep);
    if (!valid) return;

    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
}

// Функция для перехода на предыдущий шаг
function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

// Функция для валидации полей текущего шага
function validateStep(step) {
    var isValid = true;
    var stepElement = document.getElementById('step-' + step);
    if (!stepElement) return false;

    var inputs = stepElement.querySelectorAll('input, select, textarea');

    inputs.forEach(function(input) {
        if (!input.checkValidity()) {
            input.classList.add('invalid');
            isValid = false;
        } else {
            input.classList.remove('invalid');
        }
    });

    if (!isValid) {
        alert('Пожалуйста, заполните все обязательные поля корректно.');
    }

    return isValid;
}

// Функция для форматирования длины бетона
function formatLength(length) {
    if (!length) return 'Не указано';
    return parseFloat(length).toFixed(2) + ' м';
}

// Функция для отображения информации о заказе в модальном окне
function showOrderInfo(order) {
    var modal = document.getElementById('orderInfoModal');
    if (!modal) return;
    modal.style.display = 'flex'; // Изменено на 'flex' для правильного центрирования

    document.getElementById('orderInfoName').innerText = order.name || 'Не указано';
    document.getElementById('orderInfoPhone').innerText = order.phone || 'Не указано';
    document.getElementById('orderInfoCompany').innerText = order.company || 'Не указано';
    document.getElementById('orderInfoSize').innerText = order.size || 'Не указано';
    document.getElementById('orderInfoLength').innerText = formatLength(order.length);
    document.getElementById('orderInfoQuantity').innerText = order.quantity || 'Не указано';
    document.getElementById('orderInfoPaymentType').innerText = getPaymentTypeText(order.paymentType);
    document.getElementById('orderInfoBankAccount').innerText = (order.paymentType === 'bank') ? (order.bankAccount || 'Не указано') : 'Не требуется';
    document.getElementById('orderInfoTotalAmount').innerText = order.totalAmount ? order.totalAmount.toLocaleString() : '0';
    document.getElementById('orderInfoDepositAmount').innerText = order.depositAmount ? order.depositAmount.toLocaleString() + ' сум' : '0 сум';
    document.getElementById('orderInfoDepositPercentage').innerText = order.depositPercentage ? order.depositPercentage : '0';
    document.getElementById('orderInfoNote').innerText = order.note || 'Нет';
    document.getElementById('orderInfoDeadline').innerText = order.deadline ? new Date(order.deadline).toLocaleDateString() : 'Не указано';

    var outstandingElement = document.getElementById('orderInfoOutstandingAmount');
    if (outstandingElement) {
        outstandingElement.innerText = order.outstandingAmount ? order.outstandingAmount.toLocaleString() + ' сум' : '0 сум';
        if (order.outstandingAmount > 0) {
            outstandingElement.classList.remove('deposit-paid');
            outstandingElement.classList.add('outstanding');
        } else {
            outstandingElement.classList.remove('outstanding');
            outstandingElement.classList.add('deposit-paid');
        }
    }

    // Добавляем обработчик для кнопки "Готово"
    var markCompletedBtn = document.getElementById('markCompletedBtn');
    if (markCompletedBtn) {
        // Удаляем предыдущие обработчики, чтобы избежать дублирования
        var newMarkCompletedBtn = markCompletedBtn.cloneNode(true);
        markCompletedBtn.parentNode.replaceChild(newMarkCompletedBtn, markCompletedBtn);

        newMarkCompletedBtn.addEventListener('click', function() {
            markOrderCompleted(order.id);
        });
    }
}

// Функция для закрытия модального окна информации о заказе
function closeOrderInfoModal() {
    var modal = document.getElementById('orderInfoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Функция для удаления заказа по его идентификатору
function deleteOrder(id) {
    if (confirm('Вы уверены, что хотите удалить этот заказ?')) {
        db.ref('orders/' + id).remove()
            .then(function() {
                console.log("Заказ успешно удален!");
            })
            .catch(function(error) {
                console.error("Ошибка при удалении заказа: ", error);
                alert("Произошла ошибка при удалении заказа. Пожалуйста, попробуйте еще раз.");
            });
    }
}

// Функция для закрытия модального окна оформления заказа
function closeFormModal() {
    var formModal = document.getElementById('formModal');
    if (formModal) {
        formModal.style.display = 'none';
        resetForm();
        currentStep = 1;
        showStep(currentStep);
    }
}

// Функция для открытия модального окна оформления заказа
function openOrderForm() {
    var formModal = document.getElementById('formModal');
    if (formModal) {
        formModal.style.display = 'flex'; // Изменено на 'flex' для правильного центрирования
        resetForm();
        currentStep = 1;
        showStep(currentStep);
    }
}

// Функция для сброса формы
function resetForm() {
    var form = document.getElementById('newOrderForm');
    if (form) {
        form.reset();
    }

    var bankDetails = document.getElementById('bankDetails');
    if (bankDetails) {
        bankDetails.style.display = 'none';
    }

    // Сброс стилей валидации
    var inputs = document.querySelectorAll('#newOrderForm input, #newOrderForm select, #newOrderForm textarea');
    inputs.forEach(function(input) {
        input.classList.remove('invalid');
    });

    // Сброс прогресс-бара
    var progressBarFill = document.getElementById('progressBarFill');
    if (progressBarFill) {
        progressBarFill.style.width = '33%';
    }

    // Удаление всех дополнительных размеров кроме первого
    var sizesContainer = document.getElementById('sizesContainer');
    if (sizesContainer) {
        var sizeEntries = sizesContainer.querySelectorAll('.size-entry');
        sizeEntries.forEach(function(entry, index) {
            if (index > 0) {
                sizesContainer.removeChild(entry);
            } else {
                // Очистка значений первого блока
                var selects = entry.querySelectorAll('select.size-select');
                selects.forEach(function(select) {
                    select.selectedIndex = 0;
                });
                var lengthInputs = entry.querySelectorAll('input.length-input');
                lengthInputs.forEach(function(input) {
                    input.value = '';
                });
                var quantityInputs = entry.querySelectorAll('input.quantity-input');
                quantityInputs.forEach(function(input) {
                    input.value = '';
                });
            }
        });
    }

    // Показать первый шаг
    var firstStep = document.getElementById('step-1');
    if (firstStep) {
        firstStep.style.display = 'block';
    }
}

// Функция для добавления нового блока размера
function addSizeEntry() {
    var sizesContainer = document.getElementById('sizesContainer');
    if (!sizesContainer) return;

    var sizeEntry = document.createElement('div');
    sizeEntry.classList.add('size-entry');

    sizeEntry.innerHTML = `
        <div class="form-group">
            <label>Размер бетона по ширине:</label>
            <select name="size" class="size-select" required>
                <option value="" disabled selected>Выберите размер бетона по ширине</option>
                <option value="1m">1 метр</option>
                <option value="1.20m">1.20 метра</option>
            </select>
        </div>
        <div class="form-group">
            <label>Размер бетона по длине (метры):</label>
            <input type="number" name="length" class="length-input" step="0.1" min="0.1" max="10" required>
        </div>
        <div class="form-group">
            <label>Количество:</label>
            <input type="number" name="quantity" class="quantity-input" min="1" required>
        </div>
        <button type="button" class="btn-remove" onclick="removeSizeEntry(this)">Удалить</button>
    `;

    sizesContainer.appendChild(sizeEntry);
}

// Функция для удаления блока размера
function removeSizeEntry(button) {
    var sizeEntry = button.parentElement;
    if (sizeEntry) {
        var sizesContainer = document.getElementById('sizesContainer');
        if (sizesContainer) {
            sizesContainer.removeChild(sizeEntry);
        }
    }
}

// Функция для отображения предварительного просмотра заказа (опционально)
function previewOrder() {
    // Собираем данные из формы и отображаем их в модальном окне
    var name = document.getElementById('name') ? document.getElementById('name').value.trim() : '';
    var phone = document.getElementById('phone') ? document.getElementById('phone').value.trim() : '';
    var company = document.getElementById('company') ? document.getElementById('company').value.trim() : '';
    
    // Собираем размеры
    var sizeEntries = document.querySelectorAll('.size-entry');
    var sizesInfo = '';
    sizeEntries.forEach(function(entry, index) {
        var sizeSelect = entry.querySelector('select.size-select');
        var size = sizeSelect ? sizeSelect.value : '';
        var lengthInput = entry.querySelector('input.length-input');
        var length = lengthInput ? lengthInput.value : '';
        var quantityInput = entry.querySelector('input.quantity-input');
        var quantity = quantityInput ? quantityInput.value : '';

        sizesInfo += `<strong>Размер ${index + 1} по ширине:</strong> ${size || 'Не указано'}<br>`;
        sizesInfo += `<strong>Размер ${index + 1} по длине:</strong> ${length ? parseFloat(length).toFixed(2) + ' м' : 'Не указано'}<br>`;
        sizesInfo += `<strong>Количество ${index + 1}:</strong> ${quantity || 'Не указано'}<br><br>`;
    });

    var paymentType = document.getElementById('paymentType') ? document.getElementById('paymentType').value : '';
    var bankAccount = (paymentType === 'bank' && document.getElementById('bankAccount')) ? document.getElementById('bankAccount').value.trim() : '';
    var totalAmount = document.getElementById('totalAmount') ? document.getElementById('totalAmount').value : '';
    var depositAmount = document.getElementById('depositAmount') ? document.getElementById('depositAmount').value : '';
    var note = document.getElementById('note') ? document.getElementById('note').value.trim() : '';
    var deadline = document.getElementById('deadline') ? document.getElementById('deadline').value : '';

    var previewContent = `
        <strong>Имя:</strong> ${name || 'Не указано'}<br>
        <strong>Телефон:</strong> ${phone || 'Не указано'}<br>
        <strong>Компания:</strong> ${company || 'Не указано'}<br>
        ${sizesInfo}
        <strong>Тип оплаты:</strong> ${getPaymentTypeText(paymentType)}<br>
        ${paymentType === 'bank' ? '<strong>Номер банковского счета:</strong> ' + (bankAccount || 'Не указано') + '<br>' : ''}
        <strong>Итого сумма:</strong> ${totalAmount ? parseFloat(totalAmount).toLocaleString() : '0'} сум<br>
        <strong>Залог:</strong> ${depositAmount ? parseFloat(depositAmount).toLocaleString() : '0'} сум<br>
        <strong>Примечание:</strong> ${note || 'Нет'}<br>
        <strong>Срок выполнения:</strong> ${deadline ? new Date(deadline).toLocaleDateString() : 'Не указано'}<br>
    `;
    var orderPreview = document.getElementById('orderPreview');
    if (orderPreview) {
        orderPreview.innerHTML = previewContent;
    }

    var previewModal = document.getElementById('previewModal');
    if (previewModal) {
        previewModal.style.display = 'flex';
    }
}

// Функция для переключения отображения банковских реквизитов
function toggleBankDetails() {
    var paymentTypeElement = document.getElementById('paymentType');
    var bankDetails = document.getElementById('bankDetails');
    if (!paymentTypeElement || !bankDetails) return;

    var paymentType = paymentTypeElement.value;
    if (paymentType === 'bank') {
        bankDetails.style.display = 'block';
    } else {
        bankDetails.style.display = 'none';
    }
}

// Обработка отправки формы нового заказа
document.getElementById('newOrderForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Предотвращаем перезагрузку страницы при отправке формы

    // Валидация всех шагов перед отправкой
    var isValid = true;
    for (var i = 1; i <= totalSteps; i++) {
        var stepElement = document.getElementById('step-' + i);
        if (!stepElement) continue;

        var inputs = stepElement.querySelectorAll('input, select, textarea');
        inputs.forEach(function(input) {
            if (!input.checkValidity()) {
                input.classList.add('invalid');
                isValid = false;
            } else {
                input.classList.remove('invalid');
            }
        });
    }

    if (!isValid) {
        alert('Пожалуйста, заполните все обязательные поля корректно.');
        return;
    }

    // Получаем общие значения из формы, проверяя наличие элементов
    var name = document.getElementById('name') ? document.getElementById('name').value.trim() : '';
    var phone = document.getElementById('phone') ? document.getElementById('phone').value.trim() : '';
    var company = document.getElementById('company') ? document.getElementById('company').value.trim() : '';
    
    // Собираем размеры
    var sizeEntries = document.querySelectorAll('.size-entry');
    var sizes = [];
    sizeEntries.forEach(function(entry) {
        var sizeSelect = entry.querySelector('select.size-select');
        var size = sizeSelect ? sizeSelect.value : '';
        var lengthInput = entry.querySelector('input.length-input');
        var length = lengthInput ? parseFloat(lengthInput.value) : 0;
        var quantityInput = entry.querySelector('input.quantity-input');
        var quantity = quantityInput ? parseInt(quantityInput.value) : 0;

        if (size && length > 0 && quantity > 0) {
            sizes.push({
                size: size,
                length: length,
                quantity: quantity
            });
        }
    });

    if (sizes.length === 0) {
        alert('Пожалуйста, добавьте хотя бы один размер бетона.');
        return;
    }

    var paymentType = document.getElementById('paymentType') ? document.getElementById('paymentType').value : '';
    var bankAccount = (paymentType === 'bank' && document.getElementById('bankAccount')) ? document.getElementById('bankAccount').value.trim() : '';
    var totalAmount = document.getElementById('totalAmount') ? parseFloat(document.getElementById('totalAmount').value) : 0;
    var depositAmount = document.getElementById('depositAmount') ? parseFloat(document.getElementById('depositAmount').value) : 0;
    var note = document.getElementById('note') ? document.getElementById('note').value.trim() : '';
    var deadline = document.getElementById('deadline') ? document.getElementById('deadline').value : '';

    // Проверка, чтобы залог не превышал общую сумму
    if (depositAmount > totalAmount) {
        alert('Залог не может превышать общую сумму заказа.');
        return;
    }

    var depositPercentage = totalAmount > 0 ? ((depositAmount / totalAmount) * 100).toFixed(2) : '0.00';
    var outstandingAmount = totalAmount - depositAmount;

    // Для каждого размера создаем отдельный заказ
    sizes.forEach(function(sizeObj) {
        var order = {
            name: name,
            phone: phone,
            company: company,
            size: sizeObj.size,
            length: sizeObj.length,
            quantity: sizeObj.quantity,
            paymentType: paymentType,
            bankAccount: bankAccount,
            totalAmount: totalAmount,
            depositAmount: depositAmount,
            depositPercentage: depositPercentage,
            outstandingAmount: outstandingAmount,
            note: note,
            deadline: deadline, // Храним как строку в формате "YYYY-MM-DD"
            status: 'waiting', // Статус по умолчанию "ожидание"
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        // Сохраняем заказ в Realtime Database
        db.ref('orders').push(order, function(error) {
            if (error) {
                console.error("Ошибка при добавлении заказа: ", error);
                alert("Произошла ошибка при добавлении заказа. Пожалуйста, попробуйте еще раз.");
            } else {
                // Для демонстрации можно добавить уведомление, но лучше сохранять один раз после всех
                // alert("Заказ успешно оформлен!");
            }
        });
    });

    // После сохранения всех заказов закрываем форму и показываем уведомление
    closeFormModal();
    alert("Заказы успешно оформлены!");
});

// Функция для создания элемента заказа
function createOrderDiv(order) {
    if (!order) return null;

    var orderDiv = document.createElement('div');
    orderDiv.classList.add('order');
    orderDiv.innerText = `${order.company} - ${order.name} (${order.size})`;

    // Кнопка удаления заказа
    var deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = 'X';
    deleteBtn.onclick = function(event) {
        event.stopPropagation(); // Останавливаем всплытие события
        deleteOrder(order.id); // Вызов функции удаления заказа
    };
    orderDiv.appendChild(deleteBtn);

    // Расчет оставшихся дней до дедлайна
    var now = new Date();
    var deadlineDate = new Date(order.deadline);
    var daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24)); // Количество оставшихся дней

    // Применение классов в зависимости от оставшегося времени до дедлайна
    if (daysLeft <= 5 && daysLeft > 2) {
        orderDiv.classList.add('blink-yellow'); // Мигает желтым, если осталось менее 5 дней
    } else if (daysLeft <= 2 && daysLeft > 0) {
        orderDiv.classList.add('blink-red'); // Мигает красным, если осталось менее 2 дней
    } else if (daysLeft <= 0) {
        orderDiv.classList.add('blink-maroon'); // Мигает темно-красным, если срок истек
    }

    // Добавляем класс 'ready' если статус заказа 'completed'
    if (order.status === 'completed') {
        orderDiv.classList.add('ready');
    }

    // Открытие модального окна с информацией о заказе при клике на заказ
    orderDiv.onclick = function() {
        showOrderInfo(order);
    };

    return orderDiv;
}

// Функция для отображения всех заказов на странице
function renderOrders() {
    // Очищаем все контейнеры перед загрузкой
    var waiting1m = document.getElementById('waiting-1m-orders');
    var waiting1_20m = document.getElementById('waiting-1.20m-orders');
    var completed1m = document.getElementById('completed-1m-orders');
    var completed1_20m = document.getElementById('completed-1.20m-orders');

    if (waiting1m) waiting1m.innerHTML = '';
    if (waiting1_20m) waiting1_20m.innerHTML = '';
    if (completed1m) completed1m.innerHTML = '';
    if (completed1_20m) completed1_20m.innerHTML = '';

    db.ref('orders').on('value', function(snapshot) {
        if (waiting1m) waiting1m.innerHTML = '';
        if (waiting1_20m) waiting1_20m.innerHTML = '';
        if (completed1m) completed1m.innerHTML = '';
        if (completed1_20m) completed1_20m.innerHTML = '';

        snapshot.forEach(function(childSnapshot) {
            var order = childSnapshot.val();
            order.id = childSnapshot.key; // Получаем уникальный ключ заказа

            var orderDiv = createOrderDiv(order);
            if (!orderDiv) return;

            // Определение куда добавить заказ в зависимости от статуса и размера
            if (order.status === 'waiting') {
                if (order.size === '1m') {
                    if (waiting1m) waiting1m.appendChild(orderDiv);
                }
                if (order.size === '1.20m') {
                    if (waiting1_20m) waiting1_20m.appendChild(orderDiv);
                }
            } else if (order.status === 'completed') {
                if (order.size === '1m') {
                    if (completed1m) completed1m.appendChild(orderDiv);
                }
                if (order.size === '1.20m') {
                    if (completed1_20m) completed1_20m.appendChild(orderDiv);
                }
            }
        });
    });
}

// Функция для сохранения заказа в избранное (опционально)
function saveToFavorites() {
    // Логика для сохранения текущего заказа в "Избранное"
    alert('Заказ сохранен в Избранное!');
}

// Функция для закрытия модального окна предварительного просмотра (опционально)
function closePreviewModal() {
    var previewModal = document.getElementById('previewModal');
    if (previewModal) {
        previewModal.style.display = 'none';
    }
}

// Функция для изменения статуса заказа на "Готово"
function markOrderCompleted(orderId) {
    db.ref('orders/' + orderId).update({
        status: 'completed'
    }, function(error) {
        if (error) {
            console.error("Ошибка при обновлении статуса заказа: ", error);
            alert("Произошла ошибка при обновлении статуса заказа. Пожалуйста, попробуйте еще раз.");
        } else {
            alert("Статус заказа успешно изменен на 'Готово'!");
            closeOrderInfoModal();
        }
    });
}

// Функция для закрытия модального окна информации о заказе
function closeOrderInfoModal() {
    var modal = document.getElementById('orderInfoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Событие загрузки страницы
window.onload = function() {
    renderOrders(); // Отображаем все заказы из Realtime Database
};
