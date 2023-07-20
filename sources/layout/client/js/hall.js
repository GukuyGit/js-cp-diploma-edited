'use strict';

document.addEventListener('DOMContentLoaded', () => {
	const dataChosenSeance = getJSON('data-chosen-seance');
	const timestamp = +dataChosenSeance.seanceTimeStamp / 1000;
	const hallId = dataChosenSeance.hallId;
	const seanceId = dataChosenSeance.seanceId;
	const requestData = `event=get_hallConfig&timestamp=${timestamp}&hallId=${hallId}&seanceId=${seanceId}`;

	requestServer(requestData, updateHall);
});

function updateHall(serverResponse) {
	const response = JSON.parse(serverResponse);
	const dataChosenSeance = getJSON('data-chosen-seance');

	let configChoseHall;
	let configHalls = getJSON('config-halls');

	if (response !== null) {
		configChoseHall = response; // в зале есть купленные билеты
	} else {
		configChoseHall = configHalls[dataChosenSeance.hallId]; // получаем схему пустого зала
	}

	const buyingInfo = document.querySelector('.buying__info');
	buyingInfo.innerHTML = '';

	const codeHtml = `
        <div class='buying__info-description'>
            <h2 class='buying__info-title'>${dataChosenSeance.filmName}</h2>
            <p class='buying__info-start'>Дата: ${new Date(+dataChosenSeance.seanceTimeStamp).toLocaleDateString('ru-RU', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</br>
            <p class='buying__info-start'>Начало сеанса: ${dataChosenSeance.seanceTime}</p>
            <p class='buying__info-hall'>${dataChosenSeance.hallName}</p>
        </div>
        <div class='buying__info-hint'>
            <p>Тапните дважды,<br>чтобы увеличить</p>
        </div>`;
	buyingInfo.insertAdjacentHTML('beforeEnd', codeHtml);

	const configStep = document.querySelector('.conf-step');
	const textHtmlConfig = `<div class='conf-step__wrapper'>${configChoseHall}</div>`;

	configStep.innerHTML = '';
	configStep.insertAdjacentHTML('beforeEnd', textHtmlConfig);

	const textHtmlInfoPrice = `
        <div class='conf-step__legend'>
            <div class='col'>
                <p class='conf-step__legend-price'><span class='conf-step__chair conf-step__chair_standart'></span> Свободно (<span class='conf-step__legend-value price-standart'>${dataChosenSeance.priceStandart}</span> руб.)</p>
                <p class='conf-step__legend-price'><span class='conf-step__chair conf-step__chair_vip'></span> Свободно VIP (<span class='conf-step__legend-value price-vip'>${dataChosenSeance.priceVip}</span> руб.)</p> 
            </div>
            <div class='col'>
                <p class='conf-step__legend-price'><span class='conf-step__chair conf-step__chair_taken'></span> Занято</p>
                <p class='conf-step__legend-price'><span class='conf-step__chair conf-step__chair_selected'></span> Выбрано</p>
            </div>
        </div>`;
	configStep.insertAdjacentHTML('beforeEnd', textHtmlInfoPrice);

	const finalSelectedChairs = [];

	// Клик по месту зала

	const configStepChair = document.querySelectorAll('.conf-step__wrapper .conf-step__chair');

	configStepChair.forEach((element) => {
		element.addEventListener('click', () => {
			const elementClickClassList = element.classList;
			if (elementClickClassList.contains('conf-step__chair_disabled') || elementClickClassList.contains('conf-step__chair_taken')) {
				return;
			}
			element.classList.toggle('conf-step__chair_selected');
		});
	});

	// Клик по "Забронировать"
	const acceptionButton = document.querySelector('.acceptin-button');

	acceptionButton.addEventListener("mouseenter", function() {
		this.style.cursor = "pointer";
	});

	acceptionButton?.addEventListener('click', (event) => {
		event.preventDefault();
		const arrayOfRows = Array.from(
			document.querySelectorAll('.conf-step__row')
		);

		for (let indexRow = 0; indexRow < arrayOfRows.length; indexRow++) {
			const elementRow = arrayOfRows[indexRow];
			const arrayOfChairs = Array.from(
				elementRow.querySelectorAll('.conf-step__chair')
			);

			for (
				let indexChair = 0; indexChair < arrayOfChairs.length; indexChair++
			) {
				const elementChair = arrayOfChairs[indexChair];
				if (elementChair.classList.contains('conf-step__chair_selected')) {
					const typeChair = elementChair.classList.contains(
							'conf-step__chair_vip'
						) ?
						'vip' :
						'standart';

					finalSelectedChairs.push({
						row: indexRow + 1,
						place: indexChair + 1,
						typeChair: typeChair,
					});
				}
			}
		}

		if (finalSelectedChairs.length) {
			// Сохраним выбранные места в зале
			setJSON('data-of-the-selected-chairs', finalSelectedChairs);

			// Конфигурация (разметка) выбранного зала
			const configSelectedHallHtml = document.querySelector('.conf-step__wrapper')?.innerHTML.trim();

			// Сохраним выбранные места в конфиг залов
			configHalls[dataChosenSeance.hallId] = configSelectedHallHtml;
			setJSON('config-halls', configHalls);

			// Предварительная конфигурация с забронированными местами
			configStepChair.forEach((element) => {
				element.classList.replace('conf-step__chair_selected', 'conf-step__chair_taken');
			});

			const configSelectedHallTaken = document.querySelector('.conf-step__wrapper')?.innerHTML.trim();
			const configHallsTaken = getJSON('config-halls');

			// Сохраним забронированные места в отдельный конфиг залов в sessionStorage. После нажатия кнопки забронировать он передатся на сервер.
			configHallsTaken[dataChosenSeance.hallId] = configSelectedHallTaken;
			setJSON('pre-config-halls-paid-seats', configHallsTaken);

			// Итоговые данные про бронированию билета
			const dataOfTheSelectedChairs = getJSON('data-of-the-selected-chairs');

			// Общая стоимость билетов и места
			const arrRowPlace = [];
			let totalCost = 0;

			dataOfTheSelectedChairs.forEach(element => {
				arrRowPlace.push(`${element.row}/${element.place}`);
				totalCost += element.typeChair === 'vip' ? +dataChosenSeance.priceVip : +dataChosenSeance.priceStandart;
			});

			const strRowPlace = arrRowPlace.join(', ');

			const ticketDetails = {
				...dataChosenSeance,
				strRowPlace: strRowPlace,
				hallNameNumber: dataChosenSeance.hallName.substring(3),
				seanceTimeStampInSec: +dataChosenSeance.seanceTimeStamp / 1000,
				seanceDay: new Date(+dataChosenSeance.seanceTimeStamp).toLocaleDateString('ru-RU', {
					weekday: 'long',
					day: '2-digit',
					month: 'short',
					year: 'numeric'
				}),
				totalCost: totalCost,
			};

			setJSON('ticket-details', ticketDetails);

			window.location.href = 'payment.html';
		}
	});
};