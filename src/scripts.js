// Инициализация Firebase
const firebaseConfig = {
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
  const db = firebase.database();
  
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
  
  // Обработка отправки формы нового заказа
  document.getElementById('newOrderForm').addEventListener('submit', function(event) {
      event.preventDefault(); // Предотвращаем перезагрузку страницы при отправке формы
  
      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const size = document.getElementById('size').value;
      const quantity = parseInt(document.getElementById('quantity').value);
      const company = document.getElementById('company').value.trim();
      const note = document.getElementById('note').value.trim();
      const deadline = document.getElementById('deadline').value;
      const paymentType = document.getElementById('paymentType').value;
      const totalAmount = parseFloat(document.getElementById('totalAmount').value);
      const depositAmount = parseFloat(document.getElementById('depositAmount').value);
  
      // Проверка, чтобы залог не превышал общую сумму
      if (depositAmount > totalAmount) {
          alert('Залог не может превышать общую сумму заказа.');
          return;
      }
  
      const depositPercentage = ((depositAmount / totalAmount) * 100).toFixed(2);
      const outstandingAmount = totalAmount - depositAmount;
  
      const order = {
          name,
          phone,
          size,
          quantity,
          company,
          note,
          deadline, // Храним как строку в формате "YYYY-MM-DD"
          status: 'waiting', // Статус по умолчанию "ожидание"
          paymentType,
          totalAmount,
          depositAmount,
          depositPercentage,
          outstandingAmount,
          createdAt: firebase.database.ServerValue.TIMESTAMP
      };
  
      // Сохраняем заказ в Realtime Database
      db.ref('orders').push(order, function(error) {
          if (error) {
              console.error("Ошибка при добавлении заказа: ", error);
              alert("Произошла ошибка при добавлении заказа. Пожалуйста, попробуйте еще раз.");
          } else {
              closeFormModal();
              document.getElementById('newOrderForm').reset();
          }
      });
  });
  
  // Функция для отображения всех заказов на странице
  function renderOrders() {
      // Очищаем все контейнеры перед загрузкой
      document.getElementById('waiting-1m-orders').innerHTML = '';
      document.getElementById('waiting-1.20m-orders').innerHTML = '';
      document.getElementById('completed-1m-orders').innerHTML = '';
      document.getElementById('completed-1.20m-orders').innerHTML = '';
  
      db.ref('orders').on('value', function(snapshot) {
          // Очищаем контейнеры перед обновлением
          document.getElementById('waiting-1m-orders').innerHTML = '';
          document.getElementById('waiting-1.20m-orders').innerHTML = '';
          document.getElementById('completed-1m-orders').innerHTML = '';
          document.getElementById('completed-1.20m-orders').innerHTML = '';
  
          snapshot.forEach(function(childSnapshot) {
              const order = childSnapshot.val();
              order.id = childSnapshot.key; // Получаем уникальный ключ заказа
  
              const orderDiv = document.createElement('div');
              orderDiv.classList.add('order');
              orderDiv.innerText = `${order.company} - ${order.name}`;
  
              // Кнопка удаления заказа
              const deleteBtn = document.createElement('button');
              deleteBtn.innerHTML = 'X';
              deleteBtn.onclick = function(event) {
                  event.stopPropagation(); // Останавливаем всплытие события
                  deleteOrder(order.id); // Вызов функции удаления заказа
              };
              orderDiv.appendChild(deleteBtn);
  
              // Расчет оставшихся дней до дедлайна
              const now = new Date();
              const deadlineDate = new Date(order.deadline);
              const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24)); // Количество оставшихся дней
  
              // Применение классов в зависимости от оставшегося времени до дедлайна
              if (daysLeft <= 5 && daysLeft > 2) {
                  orderDiv.classList.add('blink-yellow'); // Мигает желтым, если осталось менее 5 дней
              } else if (daysLeft <= 2 && daysLeft > 0) {
                  orderDiv.classList.add('blink-red'); // Мигает красным, если осталось менее 2 дней
              } else if (daysLeft <= 0) {
                  orderDiv.classList.add('blink-maroon'); // Мигает темно-красным, если срок истек
              }
  
              // Открытие модального окна с информацией о заказе при клике на заказ
              orderDiv.onclick = function() {
                  showOrderInfo(order);
              };
  
              // Определение куда добавить заказ в зависимости от статуса и размера
              if (order.status === 'waiting') {
                  if (order.size === '1m') {
                      document.getElementById('waiting-1m-orders').appendChild(orderDiv);
                  } else if (order.size === '1.20m') {
                      document.getElementById('waiting-1.20m-orders').appendChild(orderDiv);
                  }
              } else if (order.status === 'completed') {
                  if (order.size === '1m') {
                      document.getElementById('completed-1m-orders').appendChild(orderDiv);
                  } else if (order.size === '1.20m') {
                      document.getElementById('completed-1.20m-orders').appendChild(orderDiv);
                  }
              }
          });
      });
  }
  
  // Функция для отображения информации о заказе в модальном окне
  function showOrderInfo(order) {
      const modal = document.getElementById('orderInfoModal');
      modal.style.display = 'flex'; // Изменено на 'flex' для правильного центрирования
  
      document.getElementById('orderInfoName').innerText = order.name;
      document.getElementById('orderInfoPhone').innerText = order.phone;
      document.getElementById('orderInfoSize').innerText = order.size === '1m' ? '1 метр' : '1.20 метра';
      document.getElementById('orderInfoQuantity').innerText = order.quantity;
      document.getElementById('orderInfoCompany').innerText = order.company;
      document.getElementById('orderInfoNote').innerText = order.note;
      document.getElementById('orderInfoDeadline').innerText = new Date(order.deadline).toLocaleDateString();
      document.getElementById('orderInfoPaymentType').innerText = getPaymentTypeText(order.paymentType);
      document.getElementById('orderInfoTotalAmount').innerText = order.totalAmount.toLocaleString();
      document.getElementById('orderInfoDepositAmount').innerText = `${order.depositAmount.toLocaleString()} сум`;
  
      document.getElementById('orderInfoDepositPercentage').innerText = order.depositPercentage;
  
      const outstandingElement = document.getElementById('orderInfoOutstandingAmount');
      outstandingElement.innerText = `${order.outstandingAmount.toLocaleString()} сум`;
  
      if (order.outstandingAmount > 0) {
          outstandingElement.classList.remove('deposit-paid');
          outstandingElement.classList.add('outstanding');
      } else {
          outstandingElement.classList.remove('outstanding');
          outstandingElement.classList.add('deposit-paid');
      }
  }
  
  // Функция для закрытия модального окна информации о заказе
  function closeOrderInfoModal() {
      document.getElementById('orderInfoModal').style.display = 'none';
  }
  
  // Функция для удаления заказа по его идентификатору
  function deleteOrder(id) {
      if (confirm('Вы уверены, что хотите удалить этот заказ?')) {
          db.ref('orders/' + id).remove()
              .then(() => {
                  console.log("Заказ успешно удален!");
              })
              .catch((error) => {
                  console.error("Ошибка при удалении заказа: ", error);
                  alert("Произошла ошибка при удалении заказа. Пожалуйста, попробуйте еще раз.");
              });
      }
  }
  
  // Функция для закрытия модального окна оформления заказа
  function closeFormModal() {
      document.getElementById('formModal').style.display = 'none';
  }
  
  // Функция для открытия модального окна оформления заказа
  function openOrderForm() {
      document.getElementById('formModal').style.display = 'flex'; // Изменено на 'flex' для правильного центрирования
      document.getElementById('newOrderForm').reset(); // Сброс формы при открытии
  }
  
  // Функция для поиска заказов по тексту в поле поиска
  function searchOrders() {
      const query = document.getElementById('searchInput').value.toLowerCase(); // Получаем поисковый запрос
      const orders = document.querySelectorAll('.order'); // Находим все заказы
  
      orders.forEach(orderElement => {
          // Проверяем наличие текста из поискового запроса в каждом заказе
          if (orderElement.innerText.toLowerCase().includes(query)) {
              orderElement.style.display = 'block'; // Показываем заказы, которые совпадают с запросом
          } else {
              orderElement.style.display = 'none'; // Скрываем неподходящие заказы
          }
      });
  }
  
  // Функция для фильтрации заказов по статусу
  function filterOrders() {
      const filter = document.getElementById('filterStatus').value; // Получаем выбранный фильтр
      const orders = document.querySelectorAll('.order'); // Находим все заказы
  
      orders.forEach(orderElement => {
          // Проверяем соответствие статуса
          if (filter === 'all') {
              orderElement.style.display = 'block'; // Показываем все заказы
          } else {
              // Определяем статус заказа
              const status = orderElement.parentElement.parentElement.id.includes('waiting') ? 'waiting' : 'completed';
              if (status === filter) {
                  orderElement.style.display = 'block'; // Показываем заказы с нужным статусом
              } else {
                  orderElement.style.display = 'none'; // Скрываем остальные
              }
          }
      });
  }
  
  // Функция для сортировки заказов по дате дедлайна
  function sortOrders() {
      const sort = document.getElementById('sortOrders').value; // Получаем выбранную сортировку
  
      db.ref('orders').once('value', function(snapshot) {
          let ordersArray = [];
          snapshot.forEach(function(childSnapshot) {
              const order = childSnapshot.val();
              order.id = childSnapshot.key;
              ordersArray.push(order);
          });
  
          // Сортировка массива заказов по дате дедлайна
          if (sort === 'dateAsc') {
              ordersArray.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
          } else if (sort === 'dateDesc') {
              ordersArray.sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
          }
  
          // Очищаем все контейнеры
          document.getElementById('waiting-1m-orders').innerHTML = '';
          document.getElementById('waiting-1.20m-orders').innerHTML = '';
          document.getElementById('completed-1m-orders').innerHTML = '';
          document.getElementById('completed-1.20m-orders').innerHTML = '';
  
          // Отображаем отсортированные заказы
          ordersArray.forEach(order => {
              const orderDiv = document.createElement('div');
              orderDiv.classList.add('order');
              orderDiv.innerText = `${order.company} - ${order.name}`;
  
              // Кнопка удаления заказа
              const deleteBtn = document.createElement('button');
              deleteBtn.innerHTML = 'X';
              deleteBtn.onclick = function(event) {
                  event.stopPropagation(); // Останавливаем всплытие события
                  deleteOrder(order.id); // Вызов функции удаления заказа
              };
              orderDiv.appendChild(deleteBtn);
  
              // Расчет оставшихся дней до дедлайна
              const now = new Date();
              const deadlineDate = new Date(order.deadline);
              const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24)); // Количество оставшихся дней
  
              // Применение классов в зависимости от оставшегося времени до дедлайна
              if (daysLeft <= 5 && daysLeft > 2) {
                  orderDiv.classList.add('blink-yellow'); // Мигает желтым, если осталось менее 5 дней
              } else if (daysLeft <= 2 && daysLeft > 0) {
                  orderDiv.classList.add('blink-red'); // Мигает красным, если осталось менее 2 дней
              } else if (daysLeft <= 0) {
                  orderDiv.classList.add('blink-maroon'); // Мигает темно-красным, если срок истек
              }
  
              // Открытие модального окна с информацией о заказе при клике на заказ
              orderDiv.onclick = function() {
                  showOrderInfo(order);
              };
  
              // Определение куда добавить заказ в зависимости от статуса и размера
              if (order.status === 'waiting') {
                  if (order.size === '1m') {
                      document.getElementById('waiting-1m-orders').appendChild(orderDiv);
                  } else if (order.size === '1.20m') {
                      document.getElementById('waiting-1.20m-orders').appendChild(orderDiv);
                  }
              } else if (order.status === 'completed') {
                  if (order.size === '1m') {
                      document.getElementById('completed-1m-orders').appendChild(orderDiv);
                  } else if (order.size === '1.20m') {
                      document.getElementById('completed-1.20m-orders').appendChild(orderDiv);
                  }
              }
          });
      });
  }
  
  // Сразу отображаем заказы при загрузке страницы
  window.onload = function() {
      renderOrders(); // Отображаем все заказы из Realtime Database
  };
  