'use strict';

function requestServer(requestData, callback) {

	// Отправим запрос
	const xhr = new XMLHttpRequest();
	xhr.open("POST", "https://jscp-diplom.netoserver.ru/");
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	// Этот код сработает после того, как мы получим ответ сервера
	xhr.onload = function() {
		if (xhr.status != 200) {
			// HTTP ошибка? Обработаем ошибку
			alert("Ошибка: " + xhr.status);
			return;
		}
		callback(xhr.response);

	};

	xhr.onerror = function() {
		alert("Запрос не удался");
	};
	xhr.send(requestData);
};

// Функции-обертки для получени пары ключ/значение и сохранения их в браузере в sessionStorage
// JSON.stringify объект в JSON.
// JSON.parse JSON в объект.

//  сохранить пару ключ/значение в sessionStorage

function setItem(key, value) {
	try {
		return window.sessionStorage.setItem(key, value);
	} catch (e) {
		console.log(e);
	}
}

//  Получить данные по ключу key
function getItem(key, value) {
	try {
		return window.sessionStorage.getItem(key);
	} catch (e) {
		console.log(e);
	}
}

// Преобразовать value в JSON и сохранить в sessionStorage по ключу key
function setJSON(key, value) {
	try {
		const json = JSON.stringify(value);

		setItem(key, json);
	} catch (e) {
		console.error(e);
	}
}

// Получить данные и преобразовать из JSON в объект из sessionStorage по ключу key
function getJSON(key) {
	try {
		const json = getItem(key);

		return JSON.parse(json);
	} catch (e) {
		console.error(e);
	}
}