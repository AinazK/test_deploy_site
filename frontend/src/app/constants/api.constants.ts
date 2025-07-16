// const BASE_URL = 'http://192.168.31.248:5000';
const BASE_URL = 'promoted-dodo-deeply.ngrok-free.app ';

export const API = {
  LOGIN: `${BASE_URL}/users/login`, // Авторизация пользователя
  USERS: `${BASE_URL}/users`, // Создание нового пользователя
  REQUESTS: `${BASE_URL}/requests`, // Создание новой заявки
  FILTER_REQUESTS: `${BASE_URL}/requests/filter`, // Получение заявок по фильтру
  ENGINEERS_STATS: `${BASE_URL}/requests/engineers/stats`, // Получение статистики по инженерам
  REQUEST_BY_ID: (id: number) => `${BASE_URL}/requests/engineer/${id}`, // Обновление заявки по ID
  REQUEST_HISTORY: (id: number) => `${BASE_URL}/requests/history/${id}`, // Получение истории изменений по заявке
  BALANCE_UPDATE: (id: number) => `${BASE_URL}/balance/${id}`, // Обновление баланса инженера
  ENGINEER_REQUESTS: `${BASE_URL}/requests/engineer`, // Получение заявок для инженера
};
