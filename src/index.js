import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает, является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает, является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}


class Creature extends Card{
    constructor(name, power) {
        super(name, power);
    }
    getDescriptions(){
        const s1 = getCreatureDescription(this);
        const s2 = super.getDescriptions();
        return [s1, ...s2];
    }
}


// Основа для утки.
class Duck extends Creature{
    constructor(name='Мирная утка', power=2) {
        super(name, power);
    }

    quacks() { console.log('quack') };
    swims () { console.log('float: both;') };
}

class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        const opponentCards = oppositePlayer.table;

        taskQueue.push(onDone => this.view.showAttack(onDone));
        for (let oppositeCard of opponentCards)
            taskQueue.push(onDone => {
                this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
            });

        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value - Lad.getBonus());
    }

    getDescriptions() {
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature'))
            return ['Чем их больше, тем они сильнее', ...super.getDescriptions()]
        return super.getDescriptions()
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        if (value < 0)
            value = 0;
        this.inGameCount = value;
    }

    static getBonus() {
        return (this.inGameCount * (this.inGameCount + 1)) / 2;
    }
}


// Основа для собаки.
class Dog extends Creature {
    constructor(name='Пес-бандит', power=3) {
        super(name, power);
    }
}

class Trasher extends Dog {
    constructor(name='Громила', power=5) {
        super(name, power);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => continuation(value - 1))
    }

    getDescriptions() {
        const desc = 'Если Громилу атакуют, то он получает на 1 меньше урона';
        const superDesc = super.getDescriptions();
        return [desc, ...superDesc]
    }
}

const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Duck(),
];
const banditStartDeck = [
    new Trasher(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
